"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import ScrollReveal from "./ScrollReveal";

interface Wish {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

const COOLDOWN_KEY = "gw_last";
const COOLDOWN_MS = 60_000;
const ROTATIONS = [-2, 1, -1, 2];

function timeAgo(dateStr: string, locale: Locale): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return locale === "vi" ? "vừa xong" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return locale === "vi" ? `${minutes} phút trước` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return locale === "vi" ? `${hours} giờ trước` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "vi" ? `${days} ngày trước` : `${days}d ago`;
}

export default function GuestWishes({ locale }: { locale: Locale }) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const t = getTranslations(locale).guestWishes;

  const fetchWishes = useCallback(async () => {
    const { data } = await supabase
      .from("guest_wishes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setWishes(data);
  }, []);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      const form = e.currentTarget;
      const name = (
        form.elements.namedItem("guest_name") as HTMLInputElement
      ).value.trim();
      const message = (
        form.elements.namedItem("message") as HTMLTextAreaElement
      ).value.trim();
      const honeypot = (
        form.elements.namedItem("website") as HTMLInputElement
      ).value;

      // Honeypot check
      if (honeypot) return;

      if (!name || !message) {
        setError(t.errorRequired);
        return;
      }

      // Cooldown check
      const last = localStorage.getItem(COOLDOWN_KEY);
      if (last && Date.now() - parseInt(last) < COOLDOWN_MS) {
        setError(t.errorTooSoon);
        return;
      }

      setSubmitting(true);

      const optimisticWish: Wish = {
        id: crypto.randomUUID(),
        name,
        message,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      setWishes((prev) => [optimisticWish, ...prev]);

      const { error: insertError } = await supabase
        .from("guest_wishes")
        .insert({ name, message });

      if (insertError) {
        setWishes((prev) => prev.filter((w) => w.id !== optimisticWish.id));
        setError(t.errorGeneric);
        setSubmitting(false);
        return;
      }

      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setSubmitting(false);
      setJustSent(true);
      formRef.current?.reset();
      setTimeout(() => setJustSent(false), 2000);
    },
    [t]
  );

  const [charCount, setCharCount] = useState(0);

  return (
    <section className="bg-cream py-20 md:py-32">
      <div className="mx-auto max-w-3xl px-6 md:px-12">
        <ScrollReveal>
          <SectionHeading title={t.title} subtitle={t.subtitle} />
        </ScrollReveal>

        {/* Form */}
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 space-y-5 rounded-2xl border border-champagne bg-warm-white/50 p-6 shadow-sm md:p-8"
        >
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
          />

          <div className="input-underline">
            <input
              type="text"
              name="guest_name"
              placeholder={t.nameLabel}
              maxLength={80}
              required
              className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
          </div>

          <div className="input-underline">
            <textarea
              name="message"
              placeholder={t.messagePlaceholder}
              maxLength={280}
              required
              rows={3}
              onChange={(e) => setCharCount(e.target.value.length)}
              className="w-full resize-none border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
            <p className="mt-1 text-right text-[10px] text-stone/40">
              {280 - charCount}
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <AnimatePresence>
            {justSent && (
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

        {/* Wish Wall */}
        {wishes.length === 0 ? (
          <p className="text-center font-serif italic text-stone/60">
            {t.emptyState}
          </p>
        ) : (
          <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
            {wishes.map((wish, i) => (
              <motion.div
                key={wish.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: i < 6 ? i * 0.08 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ rotate: 0, y: -4 }}
                style={{ rotate: ROTATIONS[i % ROTATIONS.length] }}
                className="mb-4 break-inside-avoid rounded-xl border-t-2 border-gold/30 bg-warm-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="block font-serif text-3xl leading-none text-gold/15">
                  &ldquo;
                </span>
                <p className="mt-1 font-serif text-sm italic leading-relaxed text-charcoal">
                  {wish.message}
                </p>
                <div className="mt-3 border-t border-champagne pt-3">
                  <p className="text-xs uppercase tracking-[0.15em] text-stone/60">
                    {wish.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-stone/40">
                    {timeAgo(wish.created_at, locale)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
