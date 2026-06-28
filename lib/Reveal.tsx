"use client";
// lib/Reveal.tsx — scroll-triggered reveal (the "action" as you scroll). Reduced-motion safe
// (CSS shows content immediately under prefers-reduced-motion).
import React, { useEffect, useRef, useState } from "react";

export function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal${seen ? " in" : ""}`} style={{ transitionDelay: `${delay}ms`, ...style }}>{children}</div>;
}
