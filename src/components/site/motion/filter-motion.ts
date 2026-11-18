"use client";

import { flushSync } from "react-dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Flip);
}

/**
 * Animate a directory filter without retaining stale nodes from a previous
 * React render. The callback is flushed synchronously so Flip captures the
 * post-filter layout before the browser paints it.
 *
 * Usage:
 *   animateFilterLayout(container, () => setSelectedFilter(next));
 */
export function animateFilterLayout(container: HTMLElement, update: () => void): gsap.core.Timeline | undefined {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    flushSync(update);
    return undefined;
  }

  const before = Array.from(
    container.querySelectorAll<HTMLElement>("[data-community-card], [data-community-item], .site-member-row"),
  );
  const state = before.length ? Flip.getState(before) : undefined;

  flushSync(update);

  // React may have removed filtered nodes. Flip only receives elements that
  // still exist after the update, avoiding stale hidden targets and warnings.
  if (!state) return undefined;
  const after = before.filter((element) => element.isConnected && container.contains(element));
  if (!after.length) return undefined;

  return Flip.from(state, {
    targets: after,
    duration: 0.62,
    ease: "power2.inOut",
    stagger: 0.035,
    absolute: false,
    prune: true,
    scale: true,
    toggleClass: "is-flipping",
  });
}
