"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useGuest, getGuestDisplayName } from "@/lib/guest-context";
import { getInviteTranslations } from "@/lib/i18n";
import { Locale } from "@/lib/types";
import TextReveal from "@/components/TextReveal";
import ScrollReveal from "@/components/ScrollReveal";

const KENBURNS_DURATIONS = ["20s", "25s", "30s", "22s", "28s", "26s"];

function CinematicPhoto({
  src,
  alt,
  className,
  parallaxRange = [-60, 60],
  kenburnsIndex = 0,
}: {
  src: string;
  alt: string;
  className?: string;
  parallaxRange?: [number, number];
  kenburnsIndex?: number;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], parallaxRange);
  const pad = Math.abs(parallaxRange[0]);
  const duration = KENBURNS_DURATIONS[kenburnsIndex % KENBURNS_DURATIONS.length];
  const animName = kenburnsIndex % 2 === 0 ? "kenburns" : "kenburns-alt";

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ""}`}>
      <motion.div
        className="absolute left-0 right-0"
        style={{ y, top: -pad, bottom: -pad }}
      >
        <div
          className="relative h-full w-full"
          style={{ animation: `${animName} ${duration} ease-in-out infinite` }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-[center_30%]"
            sizes="100vw"
          />
        </div>
      </motion.div>
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.3)_100%)]" />
    </div>
  );
}

function FeaturedHeading({
  heading,
  subheading,
  overlay = false,
}: {
  heading: string;
  subheading: string;
  overlay?: boolean;
}) {
  const wrapperClass = overlay
    ? "absolute inset-0 z-10 flex items-end justify-center pb-16 md:pb-20"
    : "flex items-center justify-center py-16 md:py-24";

  return (
    <div className={wrapperClass}>
      <div className="text-center">
        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 flex origin-center items-center justify-center gap-3"
        >
          <span className="block h-px w-12 bg-white/30" />
          <span className="h-1 w-1 rotate-45 bg-white/50" />
          <span className="block h-px w-12 bg-white/30" />
        </motion.div>

        {/* Heading */}
        <TextReveal
          text={heading}
          splitBy="word"
          stagger={0.08}
          animate={false}
          className="block font-serif text-3xl font-light text-white/90 md:text-5xl"
        />

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 flex origin-center items-center justify-center gap-3"
        >
          <span className="block h-px w-8 bg-white/40" />
          <span className="h-1 w-1 rotate-45 bg-white/60" />
          <span className="block h-px w-8 bg-white/40" />
        </motion.div>

        {/* Subheading */}
        <ScrollReveal delay={0.5}>
          <p className="mt-4 font-serif text-sm tracking-wide text-white/60 italic md:text-base">
            {subheading}
          </p>
        </ScrollReveal>
      </div>
    </div>
  );
}

/* ── Layout: 1 photo — The Portrait ── */
function PortraitLayout({ photos, alt }: { photos: string[]; alt: string }) {
  return (
    <CinematicPhoto
      src={photos[0]}
      alt={alt}
      className="h-screen"
      parallaxRange={[-80, 80]}
      kenburnsIndex={0}
    />
  );
}

/* ── Layout: 2 photos — The Diptych ── */
function DiptychLayout({ photos, alt }: { photos: string[]; alt: string }) {
  return (
    <div className="flex flex-col md:flex-row md:gap-0.5">
      <CinematicPhoto
        src={photos[0]}
        alt={alt}
        className="h-[50vh] md:h-[80vh] md:w-1/2"
        parallaxRange={[-40, 40]}
        kenburnsIndex={0}
      />
      <CinematicPhoto
        src={photos[1]}
        alt={alt}
        className="h-[50vh] md:h-[80vh] md:w-1/2"
        parallaxRange={[-70, 70]}
        kenburnsIndex={1}
      />
    </div>
  );
}

/* ── Layout: 3 photos — The Editorial Spread ── */
function EditorialLayout({ photos, alt }: { photos: string[]; alt: string }) {
  return (
    <div className="flex flex-col md:flex-row md:gap-0.5">
      {/* Large feature photo */}
      <CinematicPhoto
        src={photos[0]}
        alt={alt}
        className="h-[60vh] md:h-[85vh] md:w-[60%]"
        parallaxRange={[-60, 60]}
        kenburnsIndex={0}
      />
      {/* Two stacked photos */}
      <div className="flex gap-0.5 md:w-[40%] md:flex-col">
        <CinematicPhoto
          src={photos[1]}
          alt={alt}
          className="h-[40vh] w-1/2 md:h-1/2 md:w-full"
          parallaxRange={[-40, 40]}
          kenburnsIndex={1}
        />
        <CinematicPhoto
          src={photos[2]}
          alt={alt}
          className="h-[40vh] w-1/2 md:h-1/2 md:w-full"
          parallaxRange={[-50, 50]}
          kenburnsIndex={2}
        />
      </div>
    </div>
  );
}

/* ── Layout: 4 photos — The Mosaic ── */
function MosaicLayout({ photos, alt }: { photos: string[]; alt: string }) {
  const ranges: [number, number][] = [[-30, 30], [-50, 50], [-40, 40], [-60, 60]];
  return (
    <div className="grid grid-cols-2 gap-0.5">
      {photos.map((src, i) => (
        <CinematicPhoto
          key={src}
          src={src}
          alt={alt}
          className="h-[45vh] md:h-[50vh]"
          parallaxRange={ranges[i]}
          kenburnsIndex={i}
        />
      ))}
    </div>
  );
}

/* ── Layout: 5+ photos — Hero + Grid ── */
function HeroGridLayout({ photos, alt }: { photos: string[]; alt: string }) {
  const [hero, ...rest] = photos;
  return (
    <div className="flex flex-col gap-0.5">
      {/* Hero */}
      <CinematicPhoto
        src={hero}
        alt={alt}
        className="h-[70vh] md:h-[80vh]"
        parallaxRange={[-80, 80]}
        kenburnsIndex={0}
      />
      {/* Grid */}
      <div className="grid grid-cols-1 gap-0.5 md:grid-cols-2">
        {rest.map((src, i) => (
          <CinematicPhoto
            key={src}
            src={src}
            alt={alt}
            className="h-[50vh] md:h-[55vh]"
            parallaxRange={i % 2 === 0 ? [-50, 50] : [-35, 35]}
            kenburnsIndex={i + 1}
          />
        ))}
      </div>
    </div>
  );
}

function PhotoLayout({ photos, alt }: { photos: string[]; alt: string }) {
  const count = photos.length;
  if (count === 1) return <PortraitLayout photos={photos} alt={alt} />;
  if (count === 2) return <DiptychLayout photos={photos} alt={alt} />;
  if (count === 3) return <EditorialLayout photos={photos} alt={alt} />;
  if (count === 4) return <MosaicLayout photos={photos} alt={alt} />;
  return <HeroGridLayout photos={photos} alt={alt} />;
}

export default function FeaturedGuestSection({ locale }: { locale: Locale }) {
  const { guest } = useGuest();
  const t = getInviteTranslations(locale, { vnTitle: guest?.vnTitle });

  if (!guest || guest.featuredPhotos.length === 0) return null;

  const displayName = getGuestDisplayName(guest, locale);
  const heading = t.featuredHeading.replace("{name}", displayName);
  const photos = guest.featuredPhotos;
  const isSinglePhoto = photos.length === 1;

  return (
    <section className="relative bg-black">
      {/* Text heading — above photos for multi-photo, overlaid for single */}
      {!isSinglePhoto && (
        <FeaturedHeading heading={heading} subheading={t.featuredSubheading} />
      )}

      {/* Photo layout */}
      <div className="relative">
        <PhotoLayout photos={photos} alt={displayName} />

        {/* Overlay text for single photo */}
        {isSinglePhoto && (
          <>
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
            <FeaturedHeading heading={heading} subheading={t.featuredSubheading} overlay />
          </>
        )}
      </div>
    </section>
  );
}
