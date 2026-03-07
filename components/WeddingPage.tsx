"use client";

import { ReactLenis } from "lenis/react";
import type { LenisRef } from "lenis/react";
import { cancelFrame, frame } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { Locale } from "@/lib/types";
import { useWeddingStore } from "@/lib/store";
import { useGuest } from "@/lib/guest-context";
import Preloader from "@/components/Preloader";
import PersonalizedPreloader from "@/components/PersonalizedPreloader";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PhotoBreak from "@/components/PhotoBreak";
import WeddingDetails from "@/components/WeddingDetails";
import RomanticQuote from "@/components/RomanticQuote";
import FeaturedGuestSection from "@/components/FeaturedGuestSection";
import Gallery from "@/components/Gallery";
import CinematicBreak from "@/components/CinematicBreak";
import Rsvp from "@/components/Rsvp";
import TeamPoll from "@/components/TeamPoll";
import GuestWishes from "@/components/GuestWishes";
import Footer from "@/components/Footer";
import MusicPlayer from "@/components/MusicPlayer";

export default function WeddingPage({ locale }: { locale: Locale }) {
  const lenisRef = useRef<LenisRef>(null);
  const [loaded, setLoaded] = useState(false);
  const hasRsvped = useWeddingStore((s) => s.hasRsvped);
  const { guest } = useGuest();

  useEffect(() => {
    function update(data: { timestamp: number }) {
      lenisRef.current?.lenis?.raf(data.timestamp);
    }
    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  // Block all scrolling while preloader is visible
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    if (!loaded) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      // Lenis may not be ready yet — poll until we can stop it
      const id = setInterval(() => {
        const lenis = lenisRef.current?.lenis;
        if (lenis) {
          lenis.stop();
          clearInterval(id);
        }
      }, 50);
      return () => clearInterval(id);
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
      lenisRef.current?.lenis?.start();
    }
  }, [loaded]);

  return (
    <>
      {!loaded &&
        (guest ? (
          <PersonalizedPreloader
            locale={locale}
            guest={guest}
            onComplete={() => setLoaded(true)}
          />
        ) : (
          <Preloader locale={locale} onComplete={() => setLoaded(true)} />
        ))}
      <ReactLenis
        root
        options={{ autoRaf: false, lerp: 0.06, duration: 1.4 }}
        ref={lenisRef}
      >
        <Navigation locale={locale} />
        <Hero locale={locale} />
        <PhotoBreak />
        <FeaturedGuestSection locale={locale} />
        <RomanticQuote locale={locale} />
        <CinematicBreak />
        <WeddingDetails locale={locale} showCeremony={guest?.ceremony} />
        <Gallery locale={locale} />
        <Rsvp locale={locale} />
        {hasRsvped && (
          <>
            <TeamPoll locale={locale} />
            <GuestWishes locale={locale} />
          </>
        )}
        <Footer locale={locale} />
      </ReactLenis>
      <MusicPlayer locale={locale} />
    </>
  );
}
