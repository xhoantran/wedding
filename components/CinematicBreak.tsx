export default function CinematicBreak() {
  return (
    <section className="relative h-screen overflow-hidden bg-charcoal md:h-[70vh]">
      <video
        autoPlay
        muted
        loop
        playsInline
        src="/videos/tea_ceremony_film_desktop.mp4"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.15)_100%)]" />
    </section>
  );
}
