"use client";

import { useEffect, useRef, type MouseEvent } from "react";
import { ScrollTrigger } from "./motion/gsap";

const chapters = [
  { id: "home", selector: "[data-editorial-hero]", label: "Home" },
  { id: "about", selector: "[data-editorial-about]", label: "About" },
  { id: "tracks", selector: "[data-editorial-tracks]", label: "Tracks" },
  { id: "home-events", selector: "[data-editorial-events]", label: "Events" },
  { id: "home-community", selector: "[data-editorial-community]", label: "Community" },
  { id: "join", selector: "[data-editorial-join]", label: "Find your place" },
] as const;

type ChapterRange = { start: number; end: number; element: HTMLElement };

export function HomeScrollRail() {
  const rail = useRef<HTMLElement>(null);
  const ranges = useRef<ChapterRange[]>([]);

  useEffect(() => {
    const navigation = rail.current;
    const home = navigation?.closest<HTMLElement>("[data-editorial-home]");
    if (!navigation || !home) return;

    const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>("[data-scroll-chapter]"));
    const bars = links.map((link) => link.querySelector<HTMLElement>("[data-scroll-fill]"));
    const values = links.map((link) => link.querySelector<HTMLElement>("[data-scroll-value]"));
    const elements = chapters.map((chapter) => home.querySelector<HTMLElement>(chapter.selector));
    if (elements.some((element) => !element)) return;

    let frame = 0;
    let active = -1;
    let needsMeasure = true;
    const previousPercentages = links.map(() => -1);

    const measure = () => {
      const about = ScrollTrigger.getById("editorial-about-reading");
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const starts = elements.map((element, index) => {
        if (index === 1 && about?.pin) return about.start;
        return Math.max(0, element!.getBoundingClientRect().top + window.scrollY - 106);
      });
      ranges.current = elements.map((element, index) => ({
        element: element!,
        start: starts[index],
        end: Math.max(starts[index] + 1, starts[index + 1] ?? maxScroll),
      }));
      needsMeasure = false;
    };

    const render = () => {
      frame = 0;
      if (needsMeasure) measure();
      const scroll = window.scrollY;
      const about = ScrollTrigger.getById("editorial-about-reading");
      let nextActive = 0;
      ranges.current.forEach((range, index) => {
        if (scroll >= range.start - 1) nextActive = index;
        const progress = index === 1 && about
          ? about.progress
          : (scroll - range.start) / (range.end - range.start);
        const percentage = Math.round(Math.max(0, Math.min(1, progress)) * 100);
        if (percentage === previousPercentages[index]) return;
        previousPercentages[index] = percentage;
        if (bars[index]) bars[index]!.style.transform = `scaleY(${percentage / 100})`;
        if (values[index]) values[index]!.textContent = `${percentage}%`;
        links[index].dataset.progress = String(percentage);
      });
      if (nextActive === active) return;
      active = nextActive;
      links.forEach((link, index) => {
        link.dataset.active = String(index === active);
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };

    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(render); };
    const refresh = () => { needsMeasure = true; schedule(); };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(refresh) : undefined;
    observer?.observe(home);
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

  const navigate = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    const target = ranges.current[index];
    if (!target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, "", `#${chapters[index].id}`);
    window.scrollTo({
      top: target.start + (index === 0 ? 0 : 2),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <nav
      ref={rail}
      aria-label="Home section scroll navigation"
      data-home-scroll-rail
      className="fixed top-1/2 right-[10px] z-40 flex -translate-y-1/2 flex-col gap-1 max-[520px]:right-0 max-[520px]:gap-0"
    >
      {chapters.map((chapter, index) => (
        <a
          key={chapter.id}
          href={`#${chapter.id}`}
          aria-label={`Scroll to ${chapter.label}`}
          data-scroll-chapter={chapter.id}
          data-active={index === 0 ? "true" : "false"}
          onClick={(event) => navigate(event, index)}
          className="group relative grid h-12 w-11 place-items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#c9cdd2] max-[520px]:h-11 max-[520px]:w-6"
        >
          <span aria-hidden="true" className="absolute right-[calc(100%+5px)] min-w-[2ch] text-[.5rem] font-medium leading-none tabular-nums text-[#a1a7ae] group-data-[active=true]:text-[#e1e4e8] max-[520px]:text-[.46rem]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className="absolute right-10 flex translate-x-1 items-center gap-3 whitespace-nowrap rounded-md bg-[#12161b] px-3 py-2 text-[.65rem] text-[#d5d8dd] opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none max-[520px]:right-6">
            <span className="text-[#91969e]">{String(index + 1).padStart(2, "0")}</span>
            {chapter.label}
            <span data-scroll-value className="min-w-[3ch] text-right tabular-nums text-[#91969e]">0%</span>
          </span>
          <span aria-hidden="true" className="relative block h-9 w-[7px] overflow-hidden rounded-full border border-[#9298a0]! max-[520px]:h-8 max-[520px]:w-[5px]">
            <span data-scroll-fill className="absolute inset-0 origin-top scale-y-0 bg-[#b9bec6]" />
          </span>
        </a>
      ))}
    </nav>
  );
}
