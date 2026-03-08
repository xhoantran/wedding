"use client";

import { motion } from "framer-motion";
import { WEDDING, getDisplayDate } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import MagneticButton from "./MagneticButton";

function RingsIcon() {
  return (
    <motion.svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className="mx-auto mb-4 text-gold"
      initial={{ rotate: -180, opacity: 0 }}
      whileInView={{ rotate: 0, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
    >
      <circle cx="18" cy="26" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="30" cy="26" r="10" stroke="currentColor" strokeWidth="1.5" />
    </motion.svg>
  );
}

function ChampagneIcon() {
  return (
    <motion.svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className="mx-auto mb-4 text-gold"
      initial={{ y: 20, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <path
        d="M18 8L15 24H33L30 8H18Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="24" y1="24" x2="24" y2="36" stroke="currentColor" strokeWidth="1.5" />
      <line x1="18" y1="36" x2="30" y2="36" stroke="currentColor" strokeWidth="1.5" />
    </motion.svg>
  );
}

function CornerAccents() {
  return (
    <>
      <span className="absolute left-3 top-3 h-4 w-4 border-l border-t border-gold/20" />
      <span className="absolute right-3 top-3 h-4 w-4 border-r border-t border-gold/20" />
      <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-gold/20" />
      <span className="absolute bottom-3 right-3 h-4 w-4 border-b border-r border-gold/20" />
    </>
  );
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.2 },
  },
};

const cardVariantLeft = {
  hidden: { opacity: 0, x: -40, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const cardVariantRight = {
  hidden: { opacity: 0, x: 40, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function WeddingDetails({ locale, showCeremony }: { locale: Locale; showCeremony?: boolean }) {
  const t = getTranslations(locale).details;
  const displayDate = getDisplayDate(locale);

  return (
    <section id="details" className="section-curve-top bg-champagne py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-12">
        <SectionHeading title={t.title} />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className={showCeremony ? "flex flex-col gap-6 md:flex-row md:gap-10" : "mx-auto max-w-lg"}
        >
          {showCeremony && (
            <motion.div variants={cardVariantLeft} className="flex-1">
              <MagneticButton strength={0.15}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="relative h-full overflow-hidden rounded-xl border-t-2 border-gold/40 bg-warm-white p-8 text-center shadow-md transition-shadow duration-300 hover:shadow-lg md:p-12"
                >
                  <CornerAccents />
                  <RingsIcon />
                  <h3 className="font-serif text-2xl font-light text-charcoal">
                    {t.ceremony}
                  </h3>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-gold">
                    {displayDate} &middot; {WEDDING.ceremonyTime}
                  </p>
                  {WEDDING.ceremonyVenue && (
                    <p className="mt-4 font-serif text-lg text-charcoal">
                      {WEDDING.ceremonyVenue}
                    </p>
                  )}
                  <p className={`${WEDDING.ceremonyVenue ? "mt-1" : "mt-4"} text-sm text-stone`}>
                    {WEDDING.ceremonyAddress}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(WEDDING.ceremonyAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative mt-4 inline-block text-sm text-gold"
                  >
                    {t.viewMap}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-100 bg-gold/40 transition-all duration-300 group-hover:scale-x-100 group-hover:bg-gold" />
                  </a>
                </motion.div>
              </MagneticButton>
            </motion.div>
          )}

          <motion.div variants={showCeremony ? cardVariantRight : cardVariantLeft} className={showCeremony ? "flex-1" : ""}>
            <MagneticButton strength={0.15}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="relative h-full overflow-hidden rounded-xl border-t-2 border-gold/40 bg-warm-white p-8 text-center shadow-md transition-shadow duration-300 hover:shadow-lg md:p-12"
              >
                <CornerAccents />
                <ChampagneIcon />
                <h3 className="font-serif text-2xl font-light text-charcoal">
                  {t.reception}
                </h3>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  {displayDate} &middot; {WEDDING.receptionTime}
                </p>
                <p className="mt-4 font-serif text-lg text-charcoal">
                  {WEDDING.receptionVenue}
                </p>
                <p className="mt-1 text-sm text-stone">
                  {WEDDING.receptionAddress}
                </p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(WEDDING.receptionAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative mt-4 inline-block text-sm text-gold"
                >
                  {t.viewMap}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-100 bg-gold/40 transition-all duration-300 group-hover:scale-x-100 group-hover:bg-gold" />
                </a>
              </motion.div>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
