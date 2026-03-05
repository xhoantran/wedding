"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const PHOTOS = [
  "/images/gallery/LEE_8756.JPG",
  "/images/gallery/LEE_8938.JPG",
  "/images/gallery/LEE_9293.JPG",
];

function ParallaxPhoto({ src, index }: { src: string; index: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <div
      ref={ref}
      className={`relative h-[70vh] overflow-hidden ${index === 0 ? "section-curve-top" : ""}`}
    >
      <motion.div className="absolute inset-[-80px]" style={{ y }}>
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
    </div>
  );
}

export default function PhotoBreak() {
  return (
    <section id="photos" className="bg-black">
      {PHOTOS.map((src, i) => (
        <ParallaxPhoto key={src} src={src} index={i} />
      ))}
    </section>
  );
}
