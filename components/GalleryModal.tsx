"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useLenis } from "lenis/react";
import { GalleryImage, Locale } from "@/lib/types";
import { getTranslations } from "@/lib/i18n";
import Lightbox from "./Lightbox";

interface GalleryModalProps {
  images: GalleryImage[];
  guestPhotos: Set<string>;
  locale: Locale;
  onClose: () => void;
}

export default function GalleryModal({
  images,
  guestPhotos,
  locale,
  onClose,
}: GalleryModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">(
    guestPhotos.size > 0 ? "mine" : "all"
  );
  const lenis = useLenis();
  const t = getTranslations(locale).invite;

  const hasGuest = guestPhotos.size > 0;
  const myCount = useMemo(
    () => images.filter((img) => guestPhotos.has(img.src)).length,
    [images, guestPhotos]
  );

  const displayImages = useMemo(() => {
    if (filter === "mine" && hasGuest) {
      return images.filter((img) => guestPhotos.has(img.src));
    }
    return images;
  }, [images, guestPhotos, filter, hasGuest]);

  useEffect(() => {
    lenis?.stop();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxIndex === null) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      lenis?.start();
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, lightboxIndex, lenis]);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          data-lenis-prevent
          className="fixed inset-0 z-50 overflow-y-auto bg-cream/98 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between bg-cream/80 px-6 py-4 backdrop-blur-md">
            <div className="flex gap-2">
              {hasGuest && (
                <>
                  <button
                    onClick={() => setFilter("mine")}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                      filter === "mine"
                        ? "bg-gold text-white shadow-sm"
                        : "bg-gold/10 text-stone hover:bg-gold/20"
                    }`}
                  >
                    {t.yourPhotos} ({myCount})
                  </button>
                  <button
                    onClick={() => setFilter("all")}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-all ${
                      filter === "all"
                        ? "bg-gold text-white shadow-sm"
                        : "bg-gold/10 text-stone hover:bg-gold/20"
                    }`}
                  >
                    {t.allPhotos}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-2xl text-stone transition-colors hover:text-charcoal"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 pb-12 md:grid-cols-3 lg:grid-cols-4 md:gap-4 md:px-6"
          >
            {displayImages.map((image, index) => (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(index * 0.03, 0.6),
                }}
                className={`group relative aspect-3/4 cursor-pointer overflow-hidden rounded-lg ${
                  hasGuest && guestPhotos.has(image.src)
                    ? "ring-2 ring-gold ring-offset-1 ring-offset-cream"
                    : ""
                }`}
                onClick={() => setLightboxIndex(index)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {lightboxIndex !== null && (
        <Lightbox
          images={displayImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
