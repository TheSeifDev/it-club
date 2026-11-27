"use client";

import {
  useEffect,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { ScrollTrigger } from "./motion/gsap";

const chapters = [
  { id: "home", selector: "[data-editorial-hero]", label: "Home" },
  { id: "about", selector: "[data-editorial-about]", label: "About" },
  { id: "tracks", selector: "[data-editorial-tracks]", label: "Tracks" },
  { id: "home-events", selector: "[data-editorial-events]", label: "Events" },
  { id: "home-community", selector: "[data-editorial-community]", label: "Community" },
  { id: "join", selector: "[data-editorial-join]", label: "Find your place" },
] as const;

type ChapterRange = { start: number; end: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function HomeScrollRail() {
  const rail = useRef<HTMLElement>(null);
  const ranges = useRef<ChapterRange[]>([]);
  const maxScroll = useRef(0);

  useEffect(() => {
    const navigation = rail.current;
    const home = navigation?.closest<HTMLElement>("[data-editorial-home]");
    if (!navigation || !home) return;

    const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>("[data-scroll-chapter]"));
    const elements = chapters.map((chapter) => home.querySelector<HTMLElement>(chapter.selector));
    if (elements.some((element) => !element) || links.length !== chapters.length) return;

    let frame = 0;
    let active = -1;
    let needsMeasure = true;

    const measure = () => {
      const about = ScrollTrigger.getById("editorial-about-reading");
      const pageEnd = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      maxScroll.current = pageEnd;
      const starts = elements.map((element, index) => {
        if (index === 1 && about?.pin) return about.start;
        return Math.max(0, element!.getBoundingClientRect().top + window.scrollY - 106);
      });
      ranges.current = elements.map((_, index) => ({
        start: starts[index],
        end: Math.max(starts[index] + 1, starts[index + 1] ?? pageEnd),
      }));
      needsMeasure = false;
    };

    const render = () => {
      frame = 0;
      if (needsMeasure) measure();
      const scroll = clamp(window.scrollY, 0, maxScroll.current);
      let nextActive = 0;
      ranges.current.forEach((range, index) => {
        if (scroll >= range.start - 1) nextActive = index;
      });

      if (nextActive !== active) {
        active = nextActive;
        links.forEach((link, index) => {
          const isActive = index === active;
          link.dataset.active = String(isActive);
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    const refresh = () => {
      needsMeasure = true;
      schedule();
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refresh) : undefined;

    observer?.observe(home);
    observer?.observe(document.documentElement);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", refresh, { passive: true });
    ScrollTrigger.addEventListener("refresh", refresh);
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", refresh);
      ScrollTrigger.removeEventListener("refresh", refresh);
      observer?.disconnect();
      ranges.current = [];
    };
  }, []);

  const navigate = (event: ReactMouseEvent<HTMLAnchorElement>, index: number) => {
    const target = ranges.current[index];
    if (!target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, "", `#${chapters[index].id}`);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: target.start + (index === 0 ? 0 : 2),
      behavior: reducedMotion ? "instant" : "smooth",
    });
  };

  return (
    <nav
      ref={rail}
      aria-label="Home section navigation"
      data-home-scroll-rail
      className="fixed top-1/2 right-[14px] z-40 -translate-y-1/2 max-[520px]:right-[8px]"
    >
      <div className="flex h-[240px] w-9 flex-col items-end justify-between">
        {chapters.map((chapter, index) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            aria-label={`Go to ${chapter.label}`}
            data-scroll-chapter={chapter.id}
            data-active={index === 0 ? "true" : "false"}
            onClick={(event) => navigate(event, index)}
            className="group relative flex h-6 w-9 shrink-0 items-center justify-end rounded-sm outline-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[#d9d9d9]"
          >
            <span
              aria-hidden="true"
              className="block h-[2px] w-3 bg-[#606060] transition-[width,background-color] duration-150 group-data-[active=true]:w-8 group-data-[active=true]:bg-[var(--site-sky)] motion-reduce:transition-none"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium uppercase leading-none tracking-[.02em] text-[#f2f2f2] opacity-0 transition-opacity duration-150 group-data-[active=true]:opacity-100 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
            >
              {chapter.label}
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}
