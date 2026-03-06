"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Locale } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Track = { src: string; title: string; artist: string };

const MUSIC: Record<Locale, Track[]> = {
  vi: [
    { src: "/music/vi.mp3", title: "Ngày Đầu Tiên", artist: "Đức Phúc" },
    { src: "/music/vi2.mp3", title: "Gặp Gỡ, Yêu Đương Và Được Bên Em", artist: "Phan Mạnh Quỳnh" },
    { src: "/music/vi3.mp3", title: "Lễ Đường", artist: "Kai Đinh" },
    { src: "/music/vi4.mp3", title: "Một Đời", artist: "14 Casper & Bon Nghiêm ft. buitruonglinh" },
    { src: "/music/vi5.mp3", title: "Hơn Cả Yêu", artist: "Đức Phúc" },
    { src: "/music/vi6.mp3", title: "Sau Tất Cả", artist: "ERIK" },
    { src: "/music/vi7.mp3", title: "Ánh Nắng Của Anh", artist: "Đức Phúc" },
    { src: "/music/vi8.mp3", title: "Cưới Nhau Đi (Yes I Do)", artist: "Bùi Anh Tuấn ft. Hiền Hồ" },
  ],
  en: [
    { src: "/music/en.mp3", title: "Ordinary", artist: "Alex Warren" },
    { src: "/music/en2.mp3", title: "Can't Help Falling In Love", artist: "Elvis Presley" },
    { src: "/music/en3.mp3", title: "Until I Found You", artist: "Stephen Sanchez" },
    { src: "/music/en4.mp3", title: "Lover", artist: "Taylor Swift" },
  ],
};

export default function MusicPlayer({ locale }: { locale: Locale }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trackIndex, setTrackIndex] = useState(0);

   
  const playlist = useMemo(() => shuffle(MUSIC[locale]), [locale]);
  const track = playlist[trackIndex];

  const wasPlayingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = 0.3;
    audio.src = track.src;
    audioRef.current = audio;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };

    const onEnded = () => {
      wasPlayingRef.current = true;
      setTrackIndex((prev) => (prev + 1) % playlist.length);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", onEnded);

    // If music was already playing (track change / skip), auto-play the new track
    if (wasPlayingRef.current || playing) {
      audio
        .play()
        .then(() => {
          setPlaying(true);
          wasPlayingRef.current = false;
        })
        .catch(() => {});
    } else {
      // First load — wait for user activation
      let started = false;
      const tryPlay = () => {
        if (started) return;
        audio
          .play()
          .then(() => {
            started = true;
            setPlaying(true);
            cleanup();
          })
          .catch(() => {});
      };

      const events = ["click", "touchstart", "keydown", "pointerdown"] as const;
      const cleanup = () => events.forEach((e) => document.removeEventListener(e, tryPlay));
      events.forEach((e) => document.addEventListener(e, tryPlay, { passive: true }));

      return () => {
        cleanup();
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("ended", onEnded);
        audio.pause();
        audio.src = "";
      };
    }

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, trackIndex, playlist, track.src]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }, [playing]);

  const skip = useCallback(() => {
    wasPlayingRef.current = playing;
    setTrackIndex((prev) => (prev + 1) % playlist.length);
    setProgress(0);
  }, [playlist.length, playing]);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 2.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0"
    >
      <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-charcoal/80 px-3 py-2 shadow-2xl backdrop-blur-xl">
        {/* Play/Pause */}
        <button
          onClick={toggle}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
          aria-label={playing ? "Pause music" : "Play music"}
        >
          <AnimatePresence mode="wait">
            {playing ? (
              <motion.svg
                key="pause"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <rect x="1.5" y="1" width="3" height="10" rx="0.75" />
                <rect x="7.5" y="1" width="3" height="10" rx="0.75" />
              </motion.svg>
            ) : (
              <motion.svg
                key="play"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="currentColor"
              >
                <path d="M2.5 1L10 6L2.5 11V1Z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>

        {/* Music bars */}
        <div className="flex h-3.5 items-end gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="w-0.5 rounded-full bg-gold-light"
              animate={
                playing
                  ? { height: ["3px", "12px", "4px", "10px", "3px"] }
                  : { height: "3px" }
              }
              transition={
                playing
                  ? { duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
            />
          ))}
        </div>

        {/* Song info */}
        <AnimatePresence mode="wait">
          <motion.div
            key={trackIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col whitespace-nowrap leading-none"
          >
            <span className="max-w-30 truncate text-[10px] font-medium text-white">{track.title}</span>
            <span className="text-[9px] text-white/45">{track.artist}</span>
          </motion.div>
        </AnimatePresence>

        {/* Skip button (only for playlists with multiple tracks) */}
        {playlist.length > 1 && (
          <button
            onClick={skip}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
            aria-label="Next track"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M1 1L6 5L1 9V1Z" />
              <rect x="7" y="1" width="1.5" height="8" rx="0.5" />
            </svg>
          </button>
        )}

        {/* Circular progress */}
        <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0 -rotate-90">
          <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="text-gold-light"
            strokeDasharray={2 * Math.PI * 8}
            strokeDashoffset={2 * Math.PI * 8 * (1 - progress)}
          />
        </svg>
      </div>
    </motion.div>
  );
}
