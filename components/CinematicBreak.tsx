"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Locale } from "@/lib/types";
import { getTranslations } from "@/lib/i18n";
import GoldenParticles from "./GoldenParticles";

export default function CinematicBreak({ locale }: { locale: Locale }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const textOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [20, 0, 0, -20]);
  const t = getTranslations(locale).cinematicBreak;

  return (
    <section
      ref={ref}
      className="relative h-screen overflow-hidden bg-charcoal md:h-[70vh]"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        src="/videos/tea_ceremony_film_desktop.mp4"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.15)_100%)]" />

      {/* Bottom gradient for text readability */}
      <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />

      {/* Contextual text overlay */}
      <motion.div
        style={{ opacity: textOpacity, y: textY }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-end gap-3 pb-16 md:pb-20"
      >
        <p className="font-serif text-2xl font-light tracking-wider text-white/80 md:text-4xl">
          {t.title}
        </p>
        <div className="flex items-center gap-3">
          <span className="block h-px w-8 bg-white/30" />
          <span className="h-1 w-1 rotate-45 bg-gold-light/60" />
          <span className="block h-px w-8 bg-white/30" />
        </div>
      </motion.div>

      <GoldenParticles count={12} />
    </section>
  );
}
