"use client";

import { motion } from "framer-motion";
import TextReveal from "./TextReveal";
import ScrollReveal from "./ScrollReveal";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export default function SectionHeading({
  title,
  subtitle,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 text-center md:mb-16">
      <h2 className="gold-glow font-serif text-4xl font-light tracking-wide text-charcoal md:text-5xl">
        <TextReveal
          text={title}
          splitBy="word"
          animate={false}
          stagger={0.08}
        />
      </h2>
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{
          duration: 0.8,
          delay: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="mx-auto mt-4 flex origin-center items-center justify-center gap-3"
      >
        <span className="block h-px w-12 bg-gold/40" />
        <motion.span
          initial={{ rotate: 0, opacity: 0 }}
          whileInView={{ rotate: 45, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="block h-1.5 w-1.5 bg-gold"
        />
        <span className="block h-px w-12 bg-gold/40" />
      </motion.div>
      {subtitle && (
        <ScrollReveal delay={0.4}>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg italic text-stone">
            {subtitle}
          </p>
        </ScrollReveal>
      )}
    </div>
  );
}
