"use client";

import { gsap, motionQueries } from "./gsap";

/** Delegation also covers cards recreated by directory search / Flip. */
export function setupSpotlights(
  root: HTMLElement,
  media: ReturnType<typeof gsap.matchMedia>,
) {
  media.add(motionQueries.finePointer, () => {
    let frame = 0;
    let x = 0;
    let y = 0;
    let targets: HTMLElement[] = [];
    const active = new Set<HTMLElement>();
    const touched = new Set<HTMLElement>();

    const reset = (node: HTMLElement) => {
      node.classList.remove("is-hovering");
      node.removeAttribute("data-is-hovering");
      node.style.removeProperty("--spot-x");
      node.style.removeProperty("--spot-y");
    };
    const render = () => {
      frame = 0;
      for (const node of active) {
        if (!targets.includes(node)) {
          reset(node);
          active.delete(node);
        }
      }
      for (const node of targets) {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--spot-x", `${x - rect.left}px`);
        node.style.setProperty("--spot-y", `${y - rect.top}px`);
        node.classList.add("is-hovering");
        node.setAttribute("data-is-hovering", "true");
        active.add(node);
        touched.add(node);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      targets = [];
      let node =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-spotlight]")
          : null;
      while (node && root.contains(node)) {
        targets.push(node);
        node =
          node.parentElement?.closest<HTMLElement>("[data-spotlight]") ?? null;
      }
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      targets = [];
      active.forEach(reset);
      active.clear();
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      onLeave();
      touched.forEach(reset);
    };
  });
}
