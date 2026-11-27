"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "./motion/gsap";
import { isPublicTransitionPath, publicTransitionTarget, transitionHoneycomb } from "@/lib/ui/page-transition";

const svgNamespace = "http://www.w3.org/2000/svg";
const tileTones = [
  "var(--site-sky, #28cdb7)",
  "color-mix(in srgb, var(--site-sky, #28cdb7) 72%, var(--site-night, #05070a))",
  "color-mix(in srgb, var(--site-sky, #28cdb7) 40%, var(--site-night, #05070a))",
  "color-mix(in srgb, var(--site-sky, #28cdb7) 22%, var(--site-night, #05070a))",
  "var(--site-night-3, #111a22)",
  "color-mix(in srgb, var(--site-sky-ink, #52e8d1) 75%, var(--site-night, #05070a))",
  "color-mix(in srgb, var(--site-sky, #28cdb7) 58%, var(--site-night, #05070a))",
];

type TransitionController = { routeChanged: (from: string, to: string) => void };

/** Persistent at the root; only public showcase-to-showcase links are intercepted. */
export default function PublicPageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const controllerRef = useRef<TransitionController | null>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const overlay = overlayRef.current;
    const svg = svgRef.current;
    if (!overlay || !svg) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: gsap.core.Timeline | null = null;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let tiles: SVGPolygonElement[] = [];
    let delays: number[] = [];
    let viewport = "";
    let busy = false;
    let destination: string | null = null;
    let navigationSent = false;

    const clearWatchdog = () => {
      if (watchdog) clearTimeout(watchdog);
      watchdog = undefined;
    };
    const settle = () => {
      clearWatchdog();
      animation?.kill();
      animation = null;
      destination = null;
      navigationSent = false;
      busy = false;
      overlay.dataset.phase = "idle";
      gsap.set(overlay, { visibility: "hidden", pointerEvents: "none" });
      gsap.set(tiles, { clearProps: "willChange" });
    };
    const prepare = () => {
      // Tokens stay owned by the public theme, not the operational root layout.
      const source = document.querySelector<HTMLElement>('[data-design="club"]');
      if (source) {
        const styles = getComputedStyle(source);
        for (const token of ["--site-sky", "--site-sky-ink", "--site-night", "--site-night-3"]) {
          overlay.style.setProperty(token, styles.getPropertyValue(token));
        }
      }
      const width = window.innerWidth;
      const height = window.innerHeight;
      const key = `${width}:${height}`;
      if (key !== viewport) {
        viewport = key;
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        const grid = transitionHoneycomb(width, height);
        const points = Array.from({ length: 6 }, (_, index) => {
          const angle = index * Math.PI / 3;
          return `${Math.cos(angle) * grid.radius},${Math.sin(angle) * grid.radius}`;
        }).join(" ");
        const fragment = document.createDocumentFragment();
        tiles = [];
        delays = [];
        for (const tile of grid.tiles) {
          const group = document.createElementNS(svgNamespace, "g");
          group.setAttribute("transform", `translate(${tile.x},${tile.y})`);
          const polygon = document.createElementNS(svgNamespace, "polygon");
          polygon.setAttribute("points", points);
          polygon.setAttribute("data-transition-tile", "");
          polygon.style.fill = tileTones[tile.tone];
          group.append(polygon);
          fragment.append(group);
          tiles.push(polygon);
          delays.push(tile.delay);
        }
        svg.replaceChildren(fragment);
      }
      gsap.set(overlay, { visibility: "visible", pointerEvents: "auto" });
      gsap.set(tiles, { transformOrigin: "50% 50%", willChange: "transform,opacity" });
      busy = true;
    };
    const sendNavigation = () => {
      if (!destination || navigationSent) return;
      navigationSent = true;
      overlay.dataset.phase = "hold";
      try {
        router.push(destination);
      } catch {
        // Keep the old page usable if the router rejects navigation synchronously.
        settle();
      }
    };
    const reveal = (alreadyCovered: boolean) => {
      if (media.matches) { settle(); return; }
      animation?.kill();
      clearWatchdog();
      prepare();
      destination = null;
      if (!alreadyCovered) gsap.set(tiles, { scale: 1, opacity: 1 });
      overlay.dataset.phase = "reveal";
      animation = gsap.timeline({ onComplete: settle });
      animation.to(tiles, {
        scale: 0, opacity: 0, duration: 0.36, ease: "power3.inOut",
        stagger: (index: number) => delays[index],
      });
    };
    const start = (href: string) => {
      prepare();
      destination = href;
      navigationSent = false;
      overlay.dataset.phase = "cover";
      gsap.set(tiles, { scale: 0, opacity: 0 });
      // A delayed/failed route must never trap the visitor under the overlay.
      watchdog = setTimeout(() => reveal(false), 8000);
      animation = gsap.timeline({ onComplete: sendNavigation });
      animation.to(tiles, {
        scale: 1, opacity: 1, duration: 0.32, ease: "power3.inOut",
        stagger: (index: number) => delays[index],
      });
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
        button: event.button, defaultPrevented: event.defaultPrevented,
        ctrlKey: event.ctrlKey, metaKey: event.metaKey,
        shiftKey: event.shiftKey, altKey: event.altKey,
        target: link.getAttribute("target"), download: link.hasAttribute("download"),
        reducedMotion: media.matches,
      });
      if (!href) return;
      // Keep React onClick (e.g. closing the mobile menu) but prevent Next Link's push.
      event.preventDefault();
      if (!busy) start(href);
    };
    const onMotionChange = () => {
      if (media.matches) { sendNavigation(); settle(); }
    };
    const onResize = () => {
      // Do not stretch a mid-animation SVG after a viewport/orientation change.
      if (busy) { sendNavigation(); settle(); }
      viewport = "";
    };
    controllerRef.current = {
      routeChanged(from, to) {
        if (!isPublicTransitionPath(from) || !isPublicTransitionPath(to) || media.matches) {
          settle();
          return;
        }
        // Link exits are covered already. Back/forward and programmatic navigation
        // keep native routing/scroll restoration and receive the same entrance wipe.
        reveal(busy && overlay.dataset.phase === "hold");
      },
    };
    document.addEventListener("click", onClick, true);
    media.addEventListener("change", onMotionChange);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("click", onClick, true);
      media.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", onResize);
      controllerRef.current = null;
      settle();
      svg.replaceChildren();
    };
  }, [router]);

  useEffect(() => {
    if (previousPath.current === pathname) return;
    controllerRef.current?.routeChanged(previousPath.current, pathname);
    previousPath.current = pathname;
  }, [pathname]);

  return (
    <div ref={overlayRef} data-page-transition data-phase="idle" aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-[200] overflow-hidden motion-reduce:hidden">
      <svg ref={svgRef} className="block h-full w-full" preserveAspectRatio="none" aria-hidden="true" />
    </div>
  );
}
