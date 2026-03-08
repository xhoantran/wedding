"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import { GALLERY_IMAGES, ALL_GALLERY_IMAGES } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n";
import { Locale, GalleryImage } from "@/lib/types";
import { useGuest } from "@/lib/guest-context";
import SectionHeading from "./SectionHeading";
import TiltCard from "./TiltCard";
import Lightbox from "./Lightbox";
import GalleryModal from "./GalleryModal";
import MagneticButton from "./MagneticButton";

function ImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-champagne to-blush">
      <span className="text-4xl text-rose">&#x2661;</span>
    </div>
  );
}

export default function Gallery({ locale }: { locale: Locale }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { guestPhotos } = useGuest();

  // Merge guest's tea-ceremony photos into the modal image list
  const modalImages = useMemo(() => {
    if (guestPhotos.size === 0) return ALL_GALLERY_IMAGES;
    const existingSrcs = new Set(ALL_GALLERY_IMAGES.map((img) => img.src));
    const extra: GalleryImage[] = [];
    for (const src of guestPhotos) {
      if (!existingSrcs.has(src)) {
        extra.push({ src, alt: "Guest photo" });
      }
    }
    return [...ALL_GALLERY_IMAGES, ...extra];
  }, [guestPhotos]);
  const targetRef = useRef(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef(0);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });
  const rawX = useTransform(scrollYProgress, (v) => -v * overflowRef.current);
  const x = useSpring(rawX, { stiffness: 80, damping: 30, mass: 0.5 });

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      overflowRef.current = el.scrollWidth - el.parentElement!.clientWidth;
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const t = getTranslations(locale).gallery;

  return (
    <>
      <section ref={targetRef} className="relative h-[900vh] md:h-[450vh]" id="gallery">
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
              ref={contentRef}
              style={{ x }}
              className="flex gap-5 pl-[8vw] pr-[20vw] md:gap-7"
            >
              {GALLERY_IMAGES.map((image, index) => {
                const isGuestPhoto = guestPhotos.has(image.src);
                return (
                  <TiltCard
                    key={image.src}
                    className={`relative shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-lg ${
                      isGuestPhoto ? "ring-2 ring-gold ring-offset-2 ring-offset-cream" : ""
                    } ${
                      index % 3 === 0
                        ? "h-[45vh] w-[65vw] md:w-[22vw]"
                        : index % 3 === 1
                          ? "h-[55vh] w-[60vw] md:w-[20vw]"
                          : "h-[42vh] w-[70vw] md:w-[24vw]"
                    }`}
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
                    {isGuestPhoto && (
                      <span className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[10px] text-white shadow">
                        &#x2605;
                      </span>
                    )}
                  </TiltCard>
                );
              })}

              {/* View All button */}
              <div className="flex h-[45vh] w-[50vw] shrink-0 items-center justify-center md:w-[16vw]">
                <MagneticButton strength={0.3}>
                  <button
                    onClick={() => setShowModal(true)}
                    className="group flex flex-col items-center gap-3 text-stone transition-colors hover:text-charcoal"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 text-gold transition-all group-hover:scale-110 group-hover:border-gold group-hover:bg-gold/10">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="7" height="7" rx="1" />
                        <rect x="12" y="1" width="7" height="7" rx="1" />
                        <rect x="1" y="12" width="7" height="7" rx="1" />
                        <rect x="12" y="12" width="7" height="7" rx="1" />
                      </svg>
                    </span>
                    <span className="text-xs font-medium tracking-widest uppercase">
                      {t.viewAll}
                    </span>
                  </button>
                </MagneticButton>
              </div>
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

      {showModal && (
        <GalleryModal
          images={modalImages}
          guestPhotos={guestPhotos}
          locale={locale}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
