"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Locale } from "@/lib/types";
import { getTranslations } from "@/lib/i18n";
import GoldenParticles from "./GoldenParticles";

const PHOTOS = [
  "/images/gallery/LEE_8756.JPG",
  "/images/gallery/LEE_8938.JPG",
  "/images/gallery/LEE_9293.JPG",
];

function ParallaxPhoto({
  src,
  index,
  word,
}: {
  src: string;
  index: number;
  word: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-80, 80]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.0, 1.06]);
  const blur = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [2, 0, 0, 2]);
  const blurFilter = useMotionTemplate`blur(${blur}px)`;
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0]);
  const textY = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [20, 0, -20]);

  // Bokeh circles drift at different parallax rates for depth
  const bokeh1Y = useTransform(scrollYProgress, [0, 1], [-40, 60]);
  const bokeh2Y = useTransform(scrollYProgress, [0, 1], [-20, 100]);

  return (
    <div
      ref={ref}
      className={`relative h-[70vh] overflow-hidden ${index === 0 ? "section-curve-top" : ""}`}
    >
      <motion.div
        className="absolute -inset-20"
        style={{ y, scale, filter: blurFilter }}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </motion.div>
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_100%)]" />
      {/* Bokeh light circles */}
      <motion.div
        style={{ y: bokeh1Y }}
        className={`absolute z-5 h-50 w-50 rounded-full bg-gold/4 blur-3xl md:h-62.5 md:w-62.5 ${
          index % 2 === 0 ? "left-[10%] top-[20%]" : "right-[15%] top-[30%]"
        }`}
      />
      <motion.div
        style={{ y: bokeh2Y }}
        className={`absolute z-5 h-37.5 w-37.5 rounded-full bg-gold/6 blur-2xl md:h-45 md:w-45 ${
          index % 2 === 0 ? "right-[20%] bottom-[25%]" : "left-[25%] bottom-[15%]"
        }`}
      />
      {/* Editorial text overlay */}
      <motion.p
        style={{ opacity: textOpacity, y: textY }}
        className="absolute inset-0 z-10 flex items-center justify-center font-serif text-7xl font-light tracking-[0.2em] text-white/15 uppercase select-none md:text-9xl"
      >
        {word}
      </motion.p>
    </div>
  );
}

export default function PhotoBreak({ locale }: { locale: Locale }) {
  const t = getTranslations(locale);
  const words = t.photoBreak.words;

  return (
    <section id="photos" className="relative bg-black">
      <GoldenParticles count={15} />
      {PHOTOS.map((src, i) => (
        <ParallaxPhoto key={src} src={src} index={i} word={words[i]} />
      ))}
    </section>
  );
}
