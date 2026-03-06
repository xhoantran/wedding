"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { GalleryImage } from "@/lib/types";
import Lightbox from "./Lightbox";

interface GalleryModalProps {
  images: GalleryImage[];
  onClose: () => void;
}

export default function GalleryModal({ images, onClose }: GalleryModalProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lenis = useLenis();

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
          <div className="sticky top-0 z-10 flex items-center justify-end bg-cream/80 px-6 py-4 backdrop-blur-md">
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
            {images.map((image, index) => (
              <motion.div
                key={image.src}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.6) }}
                className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg"
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
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
