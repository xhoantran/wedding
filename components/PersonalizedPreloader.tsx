"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { GuestData, Locale } from "@/lib/types";
import { getInviteTranslations } from "@/lib/i18n";
import { getGuestDisplayName } from "@/lib/guest-context";

export default function PersonalizedPreloader({
  locale,
  guest,
  onComplete,
}: {
  locale: Locale;
  guest: GuestData;
  onComplete: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [exit, setExit] = useState(false);
  const t = getInviteTranslations(locale, { vnTitle: guest.vnTitle });

  const displayName = getGuestDisplayName(guest, locale);
  const greeting = t.greeting.replace("{name}", displayName);
  const message = (guest.message || t.welcomeMessage).replace("{name}", displayName);
  const avatarPhoto = guest.avatar;

  useEffect(() => {
    if (!ready || exit) return;
    const dismiss = () => setExit(true);
    const events = ["click", "touchstart", "keydown", "pointerdown"] as const;
    events.forEach((e) =>
      document.addEventListener(e, dismiss, { once: true, passive: true })
    );
    return () => events.forEach((e) => document.removeEventListener(e, dismiss));
  }, [ready, exit]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exit && (
        <motion.div
          key="preloader-personal"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-100 flex cursor-pointer flex-col items-center justify-center bg-cream"
        >
          {/* Featured photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-gold/40 ring-offset-4 ring-offset-cream md:h-36 md:w-36"
          >
            {avatarPhoto && (
              <Image
                src={avatarPhoto}
                alt={displayName}
                fill
                className="object-cover"
                sizes="144px"
                priority
              />
            )}
          </motion.div>

          {/* Greeting */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-serif text-2xl font-light text-charcoal md:text-3xl"
          >
            {greeting}
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 flex origin-center items-center gap-3"
          >
            <span className="block h-px w-10 bg-gold/30" />
            <span className="h-1 w-1 rotate-45 bg-gold/50" />
            <span className="block h-px w-10 bg-gold/30" />
          </motion.div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-5 max-w-xs text-center font-serif text-sm italic text-stone/80"
          >
            {message}
          </motion.p>

          {/* Open prompt */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            onAnimationComplete={() => setReady(true)}
            className="mt-8 text-center font-serif text-xs tracking-widest text-gold/70 uppercase"
          >
            {t.openInvitation.replace("{name}", displayName)}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
