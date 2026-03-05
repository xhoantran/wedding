"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { GALLERY_IMAGES } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import SectionHeading from "./SectionHeading";
import Lightbox from "./Lightbox";

function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-champagne to-blush">
      <span className="text-4xl text-rose">&#x2661;</span>
    </div>
  );
}

export default function Gallery({ locale }: { locale: Locale }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-65%"]);
  const t = getTranslations(locale).gallery;

  return (
    <>
      <section ref={targetRef} className="relative h-[300vh]" id="gallery">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          {/* Heading */}
          <div className="px-6 pt-20 md:px-12">
            <SectionHeading title={t.title} subtitle={t.subtitle} />
          </div>

          {/* Horizontal scroll gallery */}
          <div className="relative flex flex-1 items-center overflow-hidden">
            {/* Edge fade gradients */}
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-linear-to-r from-cream to-transparent md:w-24" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-linear-to-l from-cream to-transparent md:w-24" />

            <motion.div
              style={{ x }}
              className="flex gap-5 pl-[8vw] pr-[20vw] md:gap-7"
            >
              {GALLERY_IMAGES.map((image, index) => (
                <motion.div
                  key={image.src}
                  whileHover={{ scale: 1.03, rotateY: 2, rotateX: -2 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-lg ${
                    index % 3 === 0
                      ? "h-[55vh] w-[38vw] md:w-[28vw]"
                      : index % 3 === 1
                        ? "h-[65vh] w-[35vw] md:w-[25vw]"
                        : "h-[50vh] w-[40vw] md:w-[30vw]"
                  }`}
                  style={{ perspective: 800 }}
                  onClick={() => setLightboxIndex(index)}
                >
                  <ImagePlaceholder />
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="relative z-1 object-cover"
                    sizes="40vw"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          images={GALLERY_IMAGES}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
