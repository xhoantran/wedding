"use client";

import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import { cancelFrame, frame } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { Locale } from "@/lib/types";
import Preloader from "@/components/Preloader";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PhotoBreak from "@/components/PhotoBreak";
import WeddingDetails from "@/components/WeddingDetails";
import RomanticQuote from "@/components/RomanticQuote";
import Gallery from "@/components/Gallery";
import Rsvp from "@/components/Rsvp";
import Footer from "@/components/Footer";
import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  const lenisRef = useRef<LenisRef>(null);
  const [loaded, setLoaded] = useState(false);
  const params = useParams<{ locale: Locale }>();
  const locale = params.locale === "en" ? "en" : "vi";

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  // Block scrolling while preloader is visible
  useEffect(() => {
    const lenis = lenisRef.current?.lenis;
    if (!lenis) return;
    if (loaded) {
      lenis.start();
    } else {
      lenis.stop();
    }
  }, [loaded]);

  return (
    <>
      {!loaded && <Preloader locale={locale} onComplete={() => setLoaded(true)} />}
      <ReactLenis root options={{ autoRaf: false, lerp: 0.06, duration: 1.4 }} ref={lenisRef}>
        <Navigation locale={locale} />
      <Hero locale={locale} />
      <PhotoBreak />
      <WeddingDetails locale={locale} />
      <RomanticQuote locale={locale} />
      <Gallery locale={locale} />
      <Rsvp locale={locale} />
      <Footer locale={locale} />
      </ReactLenis>
      <MusicPlayer locale={locale} />
    </>
  );
}
