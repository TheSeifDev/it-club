"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./motion/gsap";

declare global {
  interface Window { __siteLenis?: Lenis }
}

/**
 * Public-site inertial scrolling. Native scroll stays the source of truth, so
 * CSS sticky stages, ScrollTrigger pins, anchors and the page transition reset
 * all keep working. Reduced-motion visitors and touch devices keep native scroll.
 */
export function SmoothScroll() {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      anchors: { offset: -88 },
      autoRaf: false,
    });
    window.__siteLenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    const onMotion = (event: MediaQueryListEvent) => { if (event.matches) lenis.destroy(); };
    motion.addEventListener("change", onMotion);
    return () => {
      motion.removeEventListener("change", onMotion);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      if (window.__siteLenis === lenis) delete window.__siteLenis;
    };
  }, []);
  return null;
}
