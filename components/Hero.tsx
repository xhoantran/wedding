"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { WEDDING, HERO_IMAGE, getDisplayDate } from "@/lib/constants";
import { getTranslations, getInviteTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import { useGuest, getGuestDisplayName } from "@/lib/guest-context";
import CountdownTimer from "./CountdownTimer";
import TextReveal from "./TextReveal";

export default function Hero({ locale }: { locale: Locale }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const t = getTranslations(locale);
  const { guest } = useGuest();
  const inviteT = guest ? getInviteTranslations(locale, { vnTitle: guest.vnTitle }) : null;
  const greeting = guest && inviteT
    ? inviteT.greeting.replace("{name}", getGuestDisplayName(guest, locale))
    : null;

  return (
    <section
      ref={ref}
      className="relative flex h-screen items-center justify-center overflow-hidden bg-black"
    >
      {/* Background image with parallax */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        {/* Gradient fallback — behind the image */}
        <div className="absolute inset-0 bg-linear-to-br from-champagne via-rose to-blush" />
        <Image
          src={HERO_IMAGE}
          alt="Hoan and Thy"
          fill
          className="relative z-1 object-cover"
          priority
          sizes="100vw"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Vignette — moves with the image */}
        <div className="absolute inset-0 z-2 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_100%)]" />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-3 text-center"
        style={{ opacity: contentOpacity }}
      >
        {greeting && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4 font-serif text-lg italic text-gold-light md:text-xl"
          >
            {greeting}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: greeting ? 0.3 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs font-medium uppercase tracking-[0.3em] text-white/70"
        >
          {t.hero.familyLine}
        </motion.p>

        {/* Names — dramatic character reveal with ornamental frame */}
        <div className="relative px-8 py-6 md:px-16 md:py-10">
          {/* Corner flourishes */}
          {[
            "top-0 left-0 border-t border-l",
            "top-0 right-0 border-t border-r",
            "bottom-0 left-0 border-b border-l",
            "bottom-0 right-0 border-b border-r",
          ].map((pos, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 1.2 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`absolute ${pos} h-6 w-6 border-gold-light/40 md:h-8 md:w-8`}
            />
          ))}

          <div className="flex flex-col items-center gap-1">
            <TextReveal
              text={WEDDING.groomName}
              delay={0.4}
              stagger={0.06}
              className="font-serif text-7xl font-light tracking-wider text-white md:text-9xl lg:text-[10rem] lg:leading-none"
            />

            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.8,
                delay: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex items-center gap-3 font-serif text-3xl font-light italic text-white/90 md:gap-4 md:text-5xl"
            >
              <span className="h-px w-8 bg-gold-light/30 md:w-12" />
              &amp;
              <span className="h-px w-8 bg-gold-light/30 md:w-12" />
            </motion.span>

            <TextReveal
              text={WEDDING.brideName}
              delay={0.9}
              stagger={0.06}
              className="font-serif text-7xl font-light tracking-wider text-white md:text-9xl lg:text-[10rem] lg:leading-none"
            />
          </div>
        </div>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: 1,
            delay: 1.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex origin-center items-center gap-4"
        >
          <span className="block h-px w-16 bg-white/30" />
          <motion.span
            initial={{ rotate: 0, opacity: 0 }}
            animate={{ rotate: 45, opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="block h-1.5 w-1.5 bg-gold-light"
          />
          <span className="block h-px w-16 bg-white/30" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-sm uppercase tracking-[0.25em] text-white/80"
        >
          {getDisplayDate(locale)}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-xs tracking-[0.2em] text-white/60"
        >
          {t.hero.location}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <CountdownTimer locale={locale} />
        </motion.div>
      </motion.div>
    </section>
  );
}
