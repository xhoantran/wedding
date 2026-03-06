"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WEDDING } from "@/lib/constants";
import { Locale } from "@/lib/types";

export default function Preloader({
  locale,
  onComplete,
}: {
  locale: Locale;
  onComplete: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    if (!ready || exit) return;
    const dismiss = () => setExit(true);
    const events = ["click", "touchstart", "wheel", "keydown", "pointerdown"] as const;
    events.forEach((e) => document.addEventListener(e, dismiss, { once: true, passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, dismiss));
  }, [ready, exit]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {!exit && (
        <motion.div
          key="preloader"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-100 flex cursor-pointer flex-col items-center justify-center bg-cream"
        >
          {/* Monogram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col items-center"
          >
            <span className="font-serif text-5xl font-light tracking-widest text-charcoal md:text-7xl">
              {WEDDING.groomName[0]}
              <span className="mx-3 inline-block font-serif text-3xl italic text-gold md:text-5xl">
                &
              </span>
              {WEDDING.brideName[0]}
            </span>

            {/* Decorative line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-4 flex origin-center items-center gap-3"
            >
              <span className="block h-px w-10 bg-gold/30" />
              <span className="h-1 w-1 rotate-45 bg-gold/50" />
              <span className="block h-px w-10 bg-gold/30" />
            </motion.div>
          </motion.div>

          {/* Enter prompt */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            onAnimationComplete={() => setReady(true)}
            className="mt-10 max-w-xs text-center font-serif text-sm italic text-stone/80"
          >
            {locale === "vi"
              ? "Mở thiệp để bắt đầu hành trình yêu thương"
              : "Open the envelope to begin a loving journey"}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
