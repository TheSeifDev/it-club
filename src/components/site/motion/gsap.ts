"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // Do not rebuild pinned layouts for every mobile browser URL-bar resize.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export const motionQueries = {
  stage: "(min-width: 1024px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)",
  motion: "(prefers-reduced-motion: no-preference)",
  compact: "(prefers-reduced-motion: no-preference) and ((max-width: 1023px) or (max-height: 759px))",
  finePointer: "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
} as const;

export { gsap, ScrollTrigger };
