"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Locale } from "@/lib/types";

const MUSIC: Record<Locale, { src: string; title: string; artist: string }> = {
  vi: { src: "/music/vi.mp3", title: "Ngày Đầu Tiên", artist: "Đức Phúc" },
  en: { src: "/music/en.mp3", title: "Ordinary", artist: "Alex Warren" },
};

export default function MusicPlayer({ locale }: { locale: Locale }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0.3;
    audio.src = MUSIC[locale].src;
    audioRef.current = audio;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    audio.addEventListener("timeupdate", updateProgress);

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

    const events = ["click", "touchstart", "keydown", "wheel", "pointerdown"] as const;
    const cleanup = () => events.forEach((e) => document.removeEventListener(e, tryPlay));
    events.forEach((e) => document.addEventListener(e, tryPlay, { passive: true }));

    return () => {
      cleanup();
      audio.removeEventListener("timeupdate", updateProgress);
      audio.pause();
      audio.src = "";
    };
  }, [locale]);

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

  const track = MUSIC[locale];

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
        <div className="flex flex-col whitespace-nowrap leading-none">
          <span className="text-[10px] font-medium text-white">{track.title}</span>
          <span className="text-[9px] text-white/45">{track.artist}</span>
        </div>

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
