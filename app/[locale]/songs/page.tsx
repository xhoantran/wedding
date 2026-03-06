"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";

interface SongRequest {
  id: string;
  guest_name: string;
  song_title: string;
  artist: string;
  created_at: string;
}

export default function SongsPage() {
  const params = useParams<{ locale: Locale }>();
  const locale = params.locale === "en" ? "en" : "vi";
  const t = getTranslations(locale).songs;

  const [songs, setSongs] = useState<SongRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const fetchSongs = useCallback(async () => {
    const { data } = await supabase
      .from("song_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSongs(data);
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      const form = e.currentTarget;
      const guest_name = (form.elements.namedItem("guest_name") as HTMLInputElement).value.trim();
      const song_title = (form.elements.namedItem("song_title") as HTMLInputElement).value.trim();
      const artist = (form.elements.namedItem("artist") as HTMLInputElement).value.trim();

      if (!guest_name || !song_title) {
        setError(t.errorRequired);
        return;
      }

      setSubmitting(true);
      const { error: insertError } = await supabase
        .from("song_requests")
        .insert({ guest_name, song_title, artist });

      if (insertError) {
        setError(t.errorGeneric);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setJustAdded(true);
      formRef.current?.reset();
      fetchSongs();
      setTimeout(() => setJustAdded(false), 2000);
    },
    [t, fetchSongs]
  );

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-2xl px-6 py-20 md:px-12 md:py-32">
        {/* Back link */}
        <Link
          href={`/${locale}`}
          className="mb-12 inline-flex items-center gap-2 text-sm text-stone transition-colors hover:text-charcoal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8L10 4" />
          </svg>
          {t.backHome}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <motion.svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            className="mx-auto mb-6 text-gold"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <circle cx="18" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 28V10" stroke="currentColor" strokeWidth="1.5" />
            <path d="M24 10C24 10 32 8 32 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="32" cy="24" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M37 24V8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M37 8C37 8 42 7 42 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </motion.svg>
          <h1 className="font-serif text-4xl font-light tracking-wide text-charcoal md:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg italic text-stone">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16 space-y-5 rounded-2xl border border-champagne bg-warm-white/50 p-6 shadow-sm md:p-8"
        >
          <div className="input-underline">
            <input
              type="text"
              name="guest_name"
              placeholder={t.nameLabel}
              required
              className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
          </div>
          <div className="input-underline">
            <input
              type="text"
              name="song_title"
              placeholder={t.songLabel}
              required
              className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
          </div>
          <div className="input-underline">
            <input
              type="text"
              name="artist"
              placeholder={t.artistLabel}
              className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <AnimatePresence>
            {justAdded && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-sage"
              >
                {t.thankYou}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gold px-10 py-3 text-sm font-medium uppercase tracking-[0.15em] text-white transition-all hover:bg-gold-light hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? t.sending : t.send}
            </button>
          </div>
        </motion.form>

        {/* Song list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="mb-6 text-center font-serif text-2xl font-light text-charcoal">
            {t.playlist}
          </h2>

          {songs.length === 0 ? (
            <p className="text-center font-serif italic text-stone/60">
              {t.emptyPlaylist}
            </p>
          ) : (
            <div className="space-y-3">
              {songs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-4 rounded-xl border border-champagne/50 bg-warm-white/30 px-5 py-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 text-sm text-gold">
                    ♪
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal">
                      {song.song_title}
                    </p>
                    {song.artist && (
                      <p className="truncate text-xs text-stone/60">
                        {song.artist}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-stone/40">
                    {song.guest_name}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
