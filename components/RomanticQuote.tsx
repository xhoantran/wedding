"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import ScrollReveal from "./ScrollReveal";
import GoldenParticles from "./GoldenParticles";

export default function RomanticQuote({ locale }: { locale: Locale }) {
  const t = getTranslations(locale).quote;
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const quoteY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const markY = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[50vh] items-center overflow-hidden bg-cream py-20 md:min-h-[60vh] md:py-32"
    >
      {/* Ambient bokeh shapes */}
      <div className="absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-rose/4 blur-3xl" />
      <div className="absolute -right-16 bottom-1/4 h-48 w-48 rounded-full bg-champagne/30 blur-3xl" />

      <GoldenParticles count={6} />

      <div className="relative mx-auto max-w-2xl px-6 text-center md:px-12">
        <ScrollReveal>
          <div className="relative">
            {/* Decorative quotation mark — parallax at different rate */}
            <motion.span
              style={{ y: markY }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 font-serif text-8xl leading-none text-gold/15 select-none md:-top-10 md:text-9xl"
            >
              &ldquo;
            </motion.span>

            <motion.blockquote style={{ y: quoteY }} className="relative pt-6">
              <p className="font-serif text-2xl leading-relaxed font-light italic text-charcoal/80 md:text-3xl">
                {t.text}
              </p>
            </motion.blockquote>

            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="block h-px w-8 bg-gold/30" />
              <span className="h-1 w-1 rotate-45 bg-gold/40" />
              <span className="block h-px w-8 bg-gold/30" />
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-stone">
              {t.author}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
