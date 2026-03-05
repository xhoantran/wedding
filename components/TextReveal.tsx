"use client";

import { motion } from "framer-motion";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  splitBy?: "char" | "word";
  stagger?: number;
  animate?: boolean;
}

export default function TextReveal({
  text,
  className,
  delay = 0,
  splitBy = "char",
  stagger = 0.03,
  animate = true,
}: TextRevealProps) {
  const units = splitBy === "char" ? text.split("") : text.split(" ");

  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const child = {
    hidden: { y: "100%", opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const animationProps = animate
    ? { initial: "hidden" as const, animate: "visible" as const }
    : {
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-80px" },
      };

  return (
    <motion.span
      variants={container}
      {...animationProps}
      className={className}
      aria-label={text}
    >
      {units.map((unit, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span variants={child} className="inline-block">
            {unit === " " ? "\u00A0" : unit}
            {splitBy === "word" && i < units.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
