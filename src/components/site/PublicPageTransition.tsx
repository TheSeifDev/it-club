"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "./motion/gsap";
import {
  isPublicTransitionPath,
  publicTransitionTarget,
  transitionHoneycomb,
  transitionLabel,
  transitionStartsAtTop,
} from "@/lib/ui/page-transition";

const svgNamespace = "http://www.w3.org/2000/svg";
/** Night-on-night field: the blocks read as texture, the teal lives only in the wavefront. */
const tileTones = [
  "var(--site-night, #05070a)",
  "var(--site-night-2, #0a1016)",
  "color-mix(in srgb, var(--site-sky, #28cdb7) 7%, var(--site-night-2, #0a1016))",
  "var(--site-night-3, #111a22)",
];
const copiedTokens = [
  "--site-sky",
  "--site-sky-ink",
  "--site-night",
  "--site-night-2",
  "--site-night-3",
  "--site-ink",
  "--site-copy",
  "--font-alexandria",
];
/** Minimum time the destination name stays readable before the reveal. */
const MIN_HOLD = 0.32;

type TransitionController = {
  routeChanged: (from: string, to: string) => void;
};

/** Persistent at the root; only public showcase-to-showcase links are intercepted. */
export default function PublicPageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const arabicRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<TransitionController | null>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const overlay = overlayRef.current;
    const svg = svgRef.current;
    const label = labelRef.current;
    const title = titleRef.current;
    const arabic = arabicRef.current;
    const bar = barRef.current;
    if (!overlay || !svg || !label || !title || !arabic || !bar) return;
    const labelParts = label.querySelectorAll<HTMLElement>("[data-transition-line]");

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: gsap.core.Timeline | null = null;
    let labelAnimation: gsap.core.Timeline | null = null;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let tiles: SVGUseElement[] = [];
    let flashes: SVGUseElement[] = [];
    let delays: number[] = [];
    let viewport = "";
    let busy = false;
    let destination: string | null = null;
    let navigationSent = false;
    let resetOnArrival = false;
    let readyAt = 0;

    const clearTimers = () => {
      if (watchdog) clearTimeout(watchdog);
      if (revealTimer) clearTimeout(revealTimer);
      watchdog = undefined;
      revealTimer = undefined;
    };
    const settle = () => {
      clearTimers();
      animation?.kill();
      labelAnimation?.kill();
      animation = null;
      labelAnimation = null;
      destination = null;
      navigationSent = false;
      busy = false;
      overlay.dataset.phase = "idle";
      gsap.set(overlay, { visibility: "hidden", pointerEvents: "none" });
      if (tiles.length)
        gsap.set([...tiles, ...flashes], { clearProps: "transform,opacity,willChange" });
      gsap.set(labelParts, { yPercent: 110 });
      gsap.set(bar, { scaleX: 0 });
    };
    const prepare = () => {
      // Tokens stay owned by the public theme, not the operational root layout.
      const source = document.querySelector<HTMLElement>('[data-design="club"]');
      if (source) {
        const styles = getComputedStyle(source);
        for (const token of copiedTokens) {
          const value = styles.getPropertyValue(token);
          if (value) overlay.style.setProperty(token, value);
        }
        overlay.style.fontFamily = styles.fontFamily;
      }
      const width = window.innerWidth;
      const height = window.innerHeight;
      const key = `${width}:${height}`;
      if (key !== viewport) {
        viewport = key;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        const grid = transitionHoneycomb(width, height);
        const points = Array.from({ length: 6 }, (_, index) => {
          const angle = (index * Math.PI) / 3;
          return `${Math.cos(angle) * grid.radius},${Math.sin(angle) * grid.radius}`;
        }).join(" ");
        const fragment = document.createDocumentFragment();
        const defs = document.createElementNS(svgNamespace, "defs");
        const shape = document.createElementNS(svgNamespace, "polygon");
        shape.setAttribute("id", "club-transition-hex");
        shape.setAttribute("points", points);
        defs.append(shape);
        fragment.append(defs);
        const base: SVGUseElement[] = [];
        const glow: SVGUseElement[] = [];
        const tileDelays: number[] = [];
        const make = (x: number, y: number, fill: string) => {
          const hex = document.createElementNS(svgNamespace, "use");
          hex.setAttribute("href", "#club-transition-hex");
          hex.setAttribute("x", String(x));
          hex.setAttribute("y", String(y));
          hex.style.fill = fill;
          return hex;
        };
        const baseLayer = document.createElementNS(svgNamespace, "g");
        const glowLayer = document.createElementNS(svgNamespace, "g");
        glowLayer.style.mixBlendMode = "screen";
        for (const tile of grid.tiles) {
          const hex = make(tile.x, tile.y, tileTones[tile.tone]);
          const flash = make(tile.x, tile.y, "var(--site-sky, #28cdb7)");
          flash.style.opacity = "0";
          baseLayer.append(hex);
          glowLayer.append(flash);
          base.push(hex);
          glow.push(flash);
          tileDelays.push(tile.delay);
        }
        fragment.append(baseLayer, glowLayer);
        tiles = base;
        flashes = glow;
        delays = tileDelays;
        svg.replaceChildren(fragment);
        gsap.set(tiles, { transformOrigin: "50% 50%" });
      }
      gsap.set(overlay, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(tiles, { willChange: "transform" });
      busy = true;
    };
    const stagger = (index: number) => delays[index];
    const sendNavigation = () => {
      if (!destination || navigationSent) return;
      navigationSent = true;
      overlay.dataset.phase = "hold";
      try {
        resetOnArrival = transitionStartsAtTop(destination);
        router.push(destination, { scroll: true });
      } catch {
        // Keep the old page usable if the router rejects navigation synchronously.
        resetOnArrival = false;
        settle();
      }
    };
    const runReveal = (alreadyCovered: boolean) => {
      animation?.kill();
      labelAnimation?.kill();
      clearTimers();
      prepare();
      destination = null;
      if (!alreadyCovered) {
        gsap.set(tiles, { scale: 1, opacity: 1 });
        gsap.set(flashes, { opacity: 0 });
        gsap.set(labelParts, { yPercent: 110 });
      }
      overlay.dataset.phase = "reveal";
      animation = gsap.timeline({ onComplete: settle });
      animation
        .to(labelParts, { yPercent: -110, duration: 0.42, ease: "power3.in", stagger: 0.04 }, 0)
        .to(bar, { scaleX: 1, transformOrigin: "0% 50%", duration: 0.2, ease: "power2.out" }, 0)
        .to(bar, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.34, ease: "power3.in" }, 0.16)
        // The curtain lifts in the same top-first order it fell.
        .to(
          flashes,
          { keyframes: { opacity: [0, 0.26, 0] }, duration: 0.3, ease: "sine.inOut", stagger },
          0.22,
        )
        .to(tiles, { scale: 0, duration: 0.48, ease: "power3.in", stagger }, 0.26);
    };
    const reveal = (alreadyCovered: boolean) => {
      if (media.matches) {
        settle();
        return;
      }
      const wait = alreadyCovered ? Math.max(0, readyAt - performance.now()) : 0;
      if (wait > 16) {
        clearTimers();
        revealTimer = setTimeout(() => runReveal(true), wait);
        return;
      }
      runReveal(alreadyCovered);
    };
    const start = (href: string) => {
      prepare();
      destination = href;
      navigationSent = false;
      overlay.dataset.phase = "cover";
      const name = transitionLabel(href);
      title.textContent = name.label;
      arabic.textContent = name.arabic;
      gsap.set(tiles, { scale: 0, opacity: 1 });
      gsap.set(flashes, { opacity: 0 });
      gsap.set(labelParts, { yPercent: 110 });
      gsap.set(bar, { scaleX: 0, transformOrigin: "0% 50%" });
      // A delayed/failed route must never trap the visitor under the overlay.
      watchdog = setTimeout(() => reveal(false), 8000);
      const fall = 0.5 + Math.max(0, ...delays);
      readyAt = performance.now() + (fall + MIN_HOLD) * 1000;
      animation = gsap.timeline();
      animation
        .to(tiles, { scale: 1, duration: 0.5, ease: "power3.out", stagger }, 0)
        // A thin teal wavefront rides the leading edge of the curtain, then settles to night.
        .to(
          flashes,
          { keyframes: { opacity: [0, 0.34, 0] }, duration: 0.34, ease: "sine.inOut", stagger },
          0.08,
        )
        .call(sendNavigation, [], fall);
      labelAnimation = gsap.timeline({ delay: fall * 0.62 });
      labelAnimation
        .to(labelParts, { yPercent: 0, duration: 0.7, ease: "expo.out", stagger: 0.06 }, 0)
        .to(bar, { scaleX: 0.72, duration: 1.4, ease: "power2.out" }, 0.1);
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = publicTransitionTarget({
        href: link.href,
        currentHref: window.location.href,
        sourcePublic: Boolean(link.closest('[data-design="club"]')),
        button: event.button,
        defaultPrevented: event.defaultPrevented,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        target: link.getAttribute("target"),
        download: link.hasAttribute("download"),
        reducedMotion: media.matches,
      });
      if (!href) return;
      // Keep React onClick (e.g. closing the mobile menu) but prevent Next Link's push.
      event.preventDefault();
      if (!busy) start(href);
    };
    const onMotionChange = () => {
      if (media.matches) {
        sendNavigation();
        settle();
      }
    };
    const onResize = () => {
      // Do not stretch a mid-animation SVG after a viewport/orientation change.
      if (busy) {
        sendNavigation();
        settle();
      }
      viewport = "";
    };
    controllerRef.current = {
      routeChanged(from, to) {
        // Commit-time, instant positioning avoids smooth-scroll from the old
        // page's bottom. Do not alter the source page's history scroll position.
        if (resetOnArrival) {
          if (window.__siteLenis) window.__siteLenis.scrollTo(0, { immediate: true, force: true });
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          resetOnArrival = false;
        }
        if (!isPublicTransitionPath(from) || !isPublicTransitionPath(to) || media.matches) {
          settle();
          return;
        }
        // Link exits are covered already. Back/forward and programmatic navigation
        // keep native routing/scroll restoration and receive the same entrance lift.
        const covered = busy && overlay.dataset.phase === "hold";
        if (!covered) {
          const name = transitionLabel(to);
          title.textContent = name.label;
          arabic.textContent = name.arabic;
        }
        reveal(covered);
      },
    };
    gsap.set(labelParts, { yPercent: 110 });
    document.addEventListener("click", onClick, true);
    media.addEventListener("change", onMotionChange);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onClick, true);
      media.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", onResize);
      controllerRef.current = null;
      resetOnArrival = false;
      settle();
      svg.replaceChildren();
    };
  }, [router]);

  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    controllerRef.current?.routeChanged(previousPath.current, pathname);
    previousPath.current = pathname;
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      data-page-transition
      data-phase="idle"
      aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-[200] overflow-hidden motion-reduce:hidden"
    >
      <svg ref={svgRef} className="block h-full w-full" preserveAspectRatio="none" aria-hidden="true" />
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center px-6 [background:radial-gradient(42%_38%_at_50%_52%,rgba(40,205,183,.09),transparent_72%)]"
      >
        <div className="flex flex-col items-center text-center">
          <span className="block overflow-hidden pb-[.2em]">
            <span
              data-transition-line
              className="block text-[.62rem] font-medium uppercase leading-none tracking-[.32em] text-[var(--site-copy,#8a9a99)]"
            >
              IT Club <span className="text-[var(--site-sky-ink,#52e8d1)]">—</span> Next
            </span>
          </span>
          <span className="mt-4 block overflow-hidden px-[.12em] pb-[.16em] text-[clamp(3.4rem,11vw,10.5rem)]">
            <span
              ref={titleRef}
              data-transition-line
              className="block font-normal leading-[.9] tracking-[-.075em] text-[var(--site-ink,#f1f6f5)]"
            />
          </span>
          <span className="block overflow-hidden">
            <span
              ref={arabicRef}
              data-transition-line
              dir="rtl"
              className="block font-[family-name:var(--font-alexandria)] text-[clamp(.95rem,1.6vw,1.25rem)] leading-[1.7] text-[var(--site-sky-ink,#52e8d1)]"
            />
          </span>
          <span className="mt-7 block h-px w-[min(14rem,46vw)] overflow-hidden bg-[rgba(241,246,245,.08)]">
            <span ref={barRef} className="block h-full w-full origin-left scale-x-0 bg-[var(--site-sky,#28cdb7)]" />
          </span>
        </div>
      </div>
    </div>
  );
}
