"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WEDDING } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";

interface TimeBlock {
  value: number;
  label: string;
}

function FlipDigit({ value, label, wide }: TimeBlock & { wide?: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`relative h-12 overflow-hidden rounded-lg border border-white/10 bg-white/10 backdrop-blur-md md:h-14 ${
          wide ? "w-16 md:w-18" : "w-14 md:w-16"
        }`}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0, rotateX: 90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: -20, opacity: 0, rotateX: -90 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center font-sans text-xl font-light tracking-wider text-white md:text-2xl"
            style={{ perspective: 200 }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 block text-[10px] uppercase tracking-[0.2em] text-white/50">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer({ locale }: { locale: Locale }) {
  const [timeLeft, setTimeLeft] = useState<TimeBlock[]>([]);
  const t = getTranslations(locale).countdown;

  useEffect(() => {
    const target = new Date(WEDDING.date + "T10:00:00").getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft([
        { value: Math.floor(diff / (1000 * 60 * 60 * 24)), label: t.days },
        { value: Math.floor((diff / (1000 * 60 * 60)) % 24), label: t.hours },
        { value: Math.floor((diff / (1000 * 60)) % 60), label: t.min },
        { value: Math.floor((diff / 1000) % 60), label: t.sec },
      ]);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [t]);

  if (timeLeft.length === 0) return null;

  return (
    <div className="flex items-center gap-4">
      {timeLeft.map((block, i) => (
        <div key={block.label} className="flex items-center gap-4">
          <FlipDigit value={block.value} label={block.label} wide={i === 0} />
          {i < timeLeft.length - 1 && (
            <span className="mb-5 h-1 w-1 rotate-45 bg-gold-light/60" />
          )}
        </div>
      ))}
    </div>
  );
}
