"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedY: number;
  phase: number;
  wobbleAmp: number;
}

interface GoldenParticlesProps {
  count?: number;
  color?: string; // e.g. "212, 168, 67" (RGB without alpha)
}

function parseColor(color: string): string {
  return color;
}

export default function GoldenParticles({
  count: countProp,
  color = "212, 168, 67",
}: GoldenParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rgb = parseColor(color);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = parent.clientWidth;
    let h = parent.clientHeight;
    const count = countProp ?? (w < 768 ? 12 : 20);

    canvas.width = w;
    canvas.height = h;

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 1 + Math.random() * 2.5,
      opacity: 0.1 + Math.random() * 0.3,
      speedY: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.3 + Math.random() * 0.5,
    }));

    let rafId: number;

    function draw(time: number) {
      ctx!.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.y -= p.speedY;
        p.x += Math.sin(time * 0.0008 + p.phase) * p.wobbleAmp;

        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const grad = ctx!.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.size * 2
        );
        grad.addColorStop(0, `rgba(${rgb}, ${p.opacity})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx!.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);

    const ro = new ResizeObserver(() => {
      w = parent.clientWidth;
      h = parent.clientHeight;
      canvas.width = w;
      canvas.height = h;
    });
    ro.observe(parent);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [countProp, rgb]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
    />
  );
}
