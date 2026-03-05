"use client";

import { useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { getNavLinks, WEDDING } from "@/lib/constants";
import { Locale } from "@/lib/types";

const mobileContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const mobileItem = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Navigation({ locale }: { locale: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const navLinks = getNavLinks(locale);
  const otherLocale = locale === "en" ? "vi" : "en";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <>
      <motion.nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-cream/90 shadow-sm backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12">
          <a
            href="#"
            className={`font-serif text-xl font-light tracking-wider transition-colors duration-500 ${
              scrolled ? "text-charcoal" : "text-white"
            }`}
          >
            {WEDDING.groomName[0]} & {WEDDING.brideName[0]}
          </a>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`group relative text-xs font-medium uppercase tracking-[0.2em] transition-colors duration-300 hover:text-gold ${
                  scrolled ? "text-charcoal" : "text-white/90"
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </a>
            ))}

            {/* Language switcher */}
            <a
              href={`/${otherLocale}`}
              className={`rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] transition-all duration-300 hover:border-gold hover:text-gold ${
                scrolled
                  ? "border-charcoal/20 text-charcoal"
                  : "border-white/30 text-white/80"
              }`}
            >
              {otherLocale.toUpperCase()}
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-end gap-1.5 md:hidden"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={
                mobileOpen
                  ? { rotate: 45, y: 5, width: 24 }
                  : { rotate: 0, y: 0, width: 24 }
              }
              className={`block h-px origin-center ${scrolled ? "bg-charcoal" : "bg-white"}`}
              style={{ width: 24 }}
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className={`block h-px ${scrolled ? "bg-charcoal" : "bg-white"}`}
              style={{ width: 16 }}
            />
            <motion.span
              animate={
                mobileOpen
                  ? { rotate: -45, y: -5, width: 24 }
                  : { rotate: 0, y: 0, width: 24 }
              }
              className={`block h-px origin-center ${scrolled ? "bg-charcoal" : "bg-white"}`}
              style={{ width: 24 }}
            />
          </button>
        </div>

        {/* Scroll progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-px origin-left bg-gold"
          style={{ scaleX: scrollYProgress, width: "100%" }}
        />
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream md:hidden"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-6 top-5 text-2xl text-charcoal"
              aria-label="Close menu"
            >
              &times;
            </button>
            <motion.div
              variants={mobileContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col items-center gap-8"
            >
              {navLinks.map((link) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  variants={mobileItem}
                  onClick={() => setMobileOpen(false)}
                  className="font-serif text-3xl font-light tracking-wider text-charcoal transition-colors hover:text-gold"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href={`/${otherLocale}`}
                variants={mobileItem}
                className="mt-4 rounded-full border border-charcoal/20 px-6 py-2 text-xs font-medium uppercase tracking-[0.2em] text-charcoal transition-colors hover:border-gold hover:text-gold"
              >
                {otherLocale === "en" ? "English" : "Tiếng Việt"}
              </motion.a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
