"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export default function ColorTemperature() {
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.6, 1.0],
    [
      "rgba(212, 168, 67, 0.03)",
      "rgba(220, 170, 80, 0.05)",
      "rgba(200, 150, 100, 0.04)",
      "rgba(180, 140, 90, 0.03)",
    ]
  );

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[9980]"
      style={{ backgroundColor, mixBlendMode: "soft-light" }}
      aria-hidden="true"
    />
  );
}
