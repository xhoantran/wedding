"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { getTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import Lightbox from "@/components/Lightbox";

interface Photo {
  id: string;
  guest_name: string;
  file_url: string;
  caption: string;
  created_at: string;
}

export default function PhotosPage() {
  const params = useParams<{ locale: Locale }>();
  const locale = params.locale === "en" ? "en" : "vi";
  const t = getTranslations(locale).photos;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPhotos(data);
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const urls: string[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        urls.push(URL.createObjectURL(file));
      }
    });
    setPreviews(urls);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (fileRef.current && e.dataTransfer.files.length) {
        fileRef.current.files = e.dataTransfer.files;
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      const form = e.currentTarget;
      const guest_name = (form.elements.namedItem("guest_name") as HTMLInputElement).value.trim();
      const caption = (form.elements.namedItem("caption") as HTMLInputElement).value.trim();
      const files = fileRef.current?.files;

      if (!guest_name || !files?.length) {
        setError(t.errorRequired);
        return;
      }

      setSubmitting(true);

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          setError(t.errorSize);
          setSubmitting(false);
          return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("wedding-photos")
          .upload(fileName, file, {
            contentType: file.type,
            cacheControl: "3600",
          });

        if (uploadError) {
          setError(t.errorGeneric);
          setSubmitting(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("wedding-photos").getPublicUrl(fileName);

        const { error: dbError } = await supabase
          .from("photos")
          .insert({ guest_name, file_url: publicUrl, caption });

        if (dbError) {
          setError(t.errorGeneric);
          setSubmitting(false);
          return;
        }
      }

      setSubmitting(false);
      setJustUploaded(true);
      setPreviews([]);
      if (fileRef.current) fileRef.current.value = "";
      fetchPhotos();
      setTimeout(() => setJustUploaded(false), 2000);
    },
    [t, fetchPhotos]
  );

  const lightboxImages = photos.map((p) => ({
    src: p.file_url,
    alt: p.caption || `Photo by ${p.guest_name}`,
  }));

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-20 md:px-12 md:py-32">
        {/* Back link */}
        <Link
          href={`/${locale}`}
          className="mb-12 inline-flex items-center gap-2 text-sm text-stone transition-colors hover:text-charcoal"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8L10 4" />
          </svg>
          {t.backHome}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12 text-center"
        >
          <motion.svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            className="mx-auto mb-6 text-gold"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <rect x="8" y="12" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="18" cy="22" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 32L16 24L22 30L30 20L40 32" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </motion.svg>
          <h1 className="font-serif text-4xl font-light tracking-wide text-charcoal md:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg italic text-stone">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Upload form */}
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16 space-y-5 rounded-2xl border border-champagne bg-warm-white/50 p-6 shadow-sm md:p-8"
        >
          <div className="input-underline">
            <input
              type="text"
              name="guest_name"
              placeholder={t.nameLabel}
              required
              className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
          </div>
          <div className="input-underline">
            <input
              type="text"
              name="caption"
              placeholder={t.captionLabel}
              className="w-full border-b border-rose/30 bg-transparent px-1 py-3 text-charcoal outline-none placeholder:text-stone/40"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragOver
                ? "border-gold bg-gold/5"
                : "border-rose/30 hover:border-gold/40"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              name="photos"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-3 text-stone/40"
            >
              <path d="M16 22V10M12 14L16 10L20 14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 20V24C6 25.1 6.9 26 8 26H24C25.1 26 26 25.1 26 24V20" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-stone/60">{t.dragDrop}</p>
            <p className="mt-1 text-xs text-stone/40">{t.maxSize}</p>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image
                    src={url}
                    alt={`Preview ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <AnimatePresence>
            {justUploaded && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-sage"
              >
                {t.thankYou}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="pt-2 text-center">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-gold px-10 py-3 text-sm font-medium uppercase tracking-[0.15em] text-white transition-all hover:bg-gold-light hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? t.uploading : t.upload}
            </button>
          </div>
        </motion.form>

        {/* Photo grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {photos.length === 0 ? (
            <p className="text-center font-serif italic text-stone/60">
              {t.emptyGallery}
            </p>
          ) : (
            <div className="columns-2 gap-3 md:columns-3">
              {photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="mb-3 cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => setLightboxIndex(i)}
                >
                  <Image
                    src={photo.file_url}
                    alt={photo.caption || `Photo by ${photo.guest_name}`}
                    width={400}
                    height={400}
                    className="w-full object-cover transition-transform duration-300 hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {(photo.caption || photo.guest_name) && (
                    <div className="bg-warm-white/80 px-3 py-2">
                      {photo.caption && (
                        <p className="text-xs text-charcoal">{photo.caption}</p>
                      )}
                      <p className="text-[10px] text-stone/50">{photo.guest_name}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
