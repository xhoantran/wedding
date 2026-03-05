"use client";

import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import ScrollReveal from "./ScrollReveal";

export default function RomanticQuote({ locale }: { locale: Locale }) {
  const t = getTranslations(locale).quote;

  return (
    <section className="bg-cream py-20 md:py-32">
      <div className="mx-auto max-w-2xl px-6 text-center md:px-12">
        <ScrollReveal>
          <div className="relative">
            {/* Decorative quotation marks */}
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 font-serif text-8xl leading-none text-gold/15 select-none md:-top-10 md:text-9xl">
              &ldquo;
            </span>

            <blockquote className="relative pt-6">
              <p className="font-serif text-2xl leading-relaxed font-light italic text-charcoal/80 md:text-3xl">
                {t.text}
              </p>
            </blockquote>

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
