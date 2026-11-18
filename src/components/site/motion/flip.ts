"use client";

import gsap from "gsap";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") gsap.registerPlugin(Flip);

/** Capture an existing layout, synchronously apply a React update, then animate the new layout. */
export function animateCommunityDirectoryFlip(scope: HTMLElement, update: () => void): gsap.core.Timeline | undefined {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return undefined;
  }
  const targets = Array.from(scope.querySelectorAll<HTMLElement>("[data-community-card], [data-community-item], .site-member-row"));
  const state = targets.length ? Flip.getState(targets) : undefined;
  update();
  if (!state) return undefined;
  return Flip.from(state, { duration: 0.58, ease: "power2.inOut", stagger: 0.03, prune: true, scale: true });
}
