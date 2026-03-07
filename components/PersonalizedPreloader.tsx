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
  const avatars = [...new Set(guest.avatar ?? [])];

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
          className="fixed inset-0 z-100 flex cursor-pointer flex-col items-center justify-center overflow-hidden"
        >
          {/* Blurred background image */}
          {avatars[0] && (
            <div className="absolute inset-0 -m-4">
              <Image
                src={avatars[0]}
                alt=""
                fill
                className="object-cover blur-3xl scale-110"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-cream/90" />
            </div>
          )}
          {!avatars[0] && <div className="absolute inset-0 bg-cream" />}

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Featured photo(s) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`flex items-center ${avatars.length > 1 ? "-space-x-4 md:-space-x-5" : ""}`}
            >
              {avatars.map((src, i) => (
                <div
                  key={i}
                  className="relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-gold/40 ring-offset-4 ring-offset-cream/0 md:h-36 md:w-36"
                >
                  <Image
                    src={src}
                    alt={guest.names[i] ?? displayName}
                    fill
                    className="object-cover"
                    sizes="144px"
                    priority
                  />
                </div>
              ))}
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              onAnimationComplete={() => setReady(true)}
              className="mt-8"
            >
              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{
                  delay: 3,
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                  ease: "easeInOut",
                }}
                className="rounded-full border border-gold/40 px-6 py-2.5 text-center font-serif text-sm tracking-widest text-gold uppercase"
              >
                {t.openInvitation.replace("{name}", displayName)}
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
