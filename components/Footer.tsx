"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WEDDING, getDisplayDate, getExtraLinks } from "@/lib/constants";
import { Locale } from "@/lib/types";

export default function Footer({ locale }: { locale: Locale }) {
  const extraLinks = getExtraLinks(locale);

  return (
    <footer className="bg-charcoal py-16 text-center md:py-20">
      <motion.p
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="font-serif text-3xl font-light tracking-wider text-gold"
      >
        {WEDDING.groomName[0]} & {WEDDING.brideName[0]}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60"
      >
        {getDisplayDate(locale)}
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mx-auto mt-4 flex origin-center items-center justify-center gap-3"
      >
        <span className="block h-px w-8 bg-white/20" />
        <span className="text-sm text-gold/60">&#x2665;</span>
        <span className="block h-px w-8 bg-white/20" />
      </motion.div>
      {/* Extra links */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-5 flex items-center justify-center gap-6"
      >
        {extraLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-xs uppercase tracking-[0.15em] text-white/40 transition-colors hover:text-gold"
          >
            {link.label}
          </Link>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-4 text-xs text-white/40"
      >
        {WEDDING.hashtag}
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-2 text-[10px] tracking-[0.15em] text-white/25"
      >
        Nha Trang, Vietnam
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-6 text-[10px] text-white/20"
      >
        Made with &#x2665; by H & T
      </motion.p>
    </footer>
  );
}
