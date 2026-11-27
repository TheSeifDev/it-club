"use client";
import { useEffect, useRef } from "react";
import { gsap } from "./motion/gsap";

const INTERACTIVE = "a, button, [role='button'], summary, label, [data-cursor]";

/** Fine-pointer cursor: a dot that follows exactly and a ring that trails, with contextual labels. */
export function SiteCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const dotEl = dot.current;
    const ringEl = ring.current;
    const labelEl = label.current;
    if (!query.matches || !dotEl || !ringEl || !labelEl) return;
    const root = document.documentElement;
    root.classList.add("has-site-cursor");
    const dotX = gsap.quickTo(dotEl, "x", { duration: .08, ease: "power3.out" });
    const dotY = gsap.quickTo(dotEl, "y", { duration: .08, ease: "power3.out" });
    const ringX = gsap.quickTo(ringEl, "x", { duration: .45, ease: "power3.out" });
    const ringY = gsap.quickTo(ringEl, "y", { duration: .45, ease: "power3.out" });
    let shown = false;
    let current: Element | null = null;
    const setState = (target: Element | null) => {
      if (target === current) return;
      current = target;
      const text = target instanceof HTMLElement ? target.dataset.cursor || "" : "";
      labelEl.textContent = text;
      const field = target?.matches("input, textarea, select");
      gsap.to(ringEl, { scale: text ? 3.4 : target ? 1.9 : 1, backgroundColor: text ? "rgba(82,232,209,1)" : "rgba(82,232,209,0)", duration: .45, ease: "power3.out" });
      gsap.to(dotEl, { scale: target ? 0 : 1, autoAlpha: field ? 0 : 1, duration: .3 });
      gsap.to(labelEl, { autoAlpha: text ? 1 : 0, duration: .25 });
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!shown) {
        shown = true;
        gsap.set([dotEl, ringEl], { x: event.clientX, y: event.clientY });
        gsap.to([dotEl, ringEl], { autoAlpha: 1, duration: .3 });
      }
      dotX(event.clientX); dotY(event.clientY);
      ringX(event.clientX); ringY(event.clientY);
      const target = event.target instanceof Element ? event.target.closest(`${INTERACTIVE}, input, textarea, select`) : null;
      setState(target);
    };
    const onLeave = () => { shown = false; gsap.to([dotEl, ringEl], { autoAlpha: 0, duration: .25 }); };
    const onDown = () => gsap.to(ringEl, { scale: "-=.25", duration: .15 });
    const onUp = () => { const target = current; current = null; setState(target); };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      root.classList.remove("has-site-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      gsap.killTweensOf([dotEl, ringEl, labelEl]);
    };
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9998] mix-blend-difference max-[1023px]:hidden">
      <div ref={ring} className="invisible absolute top-0 left-0 -mt-[18px] -ml-[18px] grid size-9 place-items-center rounded-full border border-[var(--site-sky-ink)] opacity-0">
        <span ref={label} className="invisible text-[.18rem] font-semibold uppercase tracking-[.14em] text-black opacity-0" />
      </div>
      <div ref={dot} className="invisible absolute top-0 left-0 -mt-[3px] -ml-[3px] size-1.5 rounded-full bg-[var(--site-sky-ink)] opacity-0" />
    </div>
  );
}
