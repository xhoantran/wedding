"use client";

import { useRef, useEffect, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function TiltCard({
  children,
  maxTilt = 8,
  scale = 1.03,
  className,
  style,
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasMouse, setHasMouse] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const scaleVal = useMotionValue(1);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 20 });
  const springScale = useSpring(scaleVal, { stiffness: 300, damping: 20 });
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.1), transparent 60%)`;

  useEffect(() => {
    setHasMouse(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rx = ((e.clientY - centerY) / (rect.height / 2)) * -maxTilt;
    const ry = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
    rotateX.set(rx);
    rotateY.set(ry);
    scaleVal.set(scale);
    glareX.set(((e.clientX - rect.left) / rect.width) * 100);
    glareY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    scaleVal.set(1);
  };

  if (!hasMouse) {
    return (
      <div className={className} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        ...style,
        perspective: 800,
        rotateX: springRotateX,
        rotateY: springRotateY,
        scale: springScale,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
      {/* Glare overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 rounded-xl"
        style={{ background: glareBackground }}
      />
    </motion.div>
  );
}
