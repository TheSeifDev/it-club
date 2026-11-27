"use client";

import {
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ScrollTrigger } from "./motion/gsap";

const DIAL_SWEEP = 300;

const chapters = [
  { id: "home", selector: "[data-editorial-hero]", label: "Home" },
  { id: "about", selector: "[data-editorial-about]", label: "About" },
  { id: "tracks", selector: "[data-editorial-tracks]", label: "Tracks" },
  { id: "home-events", selector: "[data-editorial-events]", label: "Events" },
  { id: "home-community", selector: "[data-editorial-community]", label: "Community" },
  { id: "join", selector: "[data-editorial-join]", label: "Find your place" },
] as const;

type ChapterRange = { start: number; end: number; element: HTMLElement };
type DragState = { pointerId: number; lastAngle: number; rotation: number };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function angleAtPointer(event: Pick<ReactPointerEvent<HTMLDivElement>, "clientX" | "clientY">, element: HTMLDivElement) {
  const rect = element.getBoundingClientRect();
  return Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2) * 180 / Math.PI;
}

function shortestAngleDelta(next: number, previous: number) {
  return ((next - previous + 540) % 360) - 180;
}

export function HomeScrollRail() {
  const rail = useRef<HTMLElement>(null);
  const dial = useRef<HTMLDivElement>(null);
  const wheel = useRef<HTMLDivElement>(null);
  const markerLayer = useRef<HTMLDivElement>(null);
  const ranges = useRef<ChapterRange[]>([]);
  const maxScroll = useRef(0);
  const rotation = useRef(0);
  const drag = useRef<DragState | null>(null);

  useEffect(() => {
    const navigation = rail.current;
    const slider = dial.current;
    const rotatingWheel = wheel.current;
    const markers = markerLayer.current;
    const home = navigation?.closest<HTMLElement>("[data-editorial-home]");
    if (!navigation || !slider || !rotatingWheel || !markers || !home) return;

    const links = Array.from(navigation.querySelectorAll<HTMLAnchorElement>("[data-scroll-chapter]"));
    const elements = chapters.map((chapter) => home.querySelector<HTMLElement>(chapter.selector));
    const count = navigation.querySelector<HTMLElement>("[data-dial-count]");
    const label = navigation.querySelector<HTMLElement>("[data-dial-label]");
    const percentage = navigation.querySelector<HTMLElement>("[data-dial-progress]");
    if (elements.some((element) => !element) || links.length !== chapters.length) return;

    let frame = 0;
    let active = -1;
    let needsMeasure = true;
    const previousPercentages = links.map(() => -1);

    const measure = () => {
      const about = ScrollTrigger.getById("editorial-about-reading");
      const pageEnd = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      maxScroll.current = pageEnd;
      const starts = elements.map((element, index) => {
        if (index === 1 && about?.pin) return about.start;
        return Math.max(0, element!.getBoundingClientRect().top + window.scrollY - 106);
      });
      ranges.current = elements.map((element, index) => ({
        element: element!,
        start: starts[index],
        end: Math.max(starts[index] + 1, starts[index + 1] ?? pageEnd),
      }));

      const markerRadius = Math.max(0, markers.clientWidth / 2 - 11);
      links.forEach((link, index) => {
        const markerAngle = pageEnd > 0 ? -(starts[index] / pageEnd) * DIAL_SWEEP : 0;
        link.style.transform = `translate(-50%, -50%) rotate(${markerAngle}deg) translateY(-${markerRadius}px)`;
      });
      needsMeasure = false;
    };

    const render = () => {
      frame = 0;
      if (needsMeasure) measure();
      const scroll = clamp(window.scrollY, 0, maxScroll.current);
      const dialRotation = maxScroll.current > 0 ? scroll / maxScroll.current * DIAL_SWEEP : 0;
      rotation.current = dialRotation;
      rotatingWheel.style.transform = `rotate(${dialRotation}deg)`;
      markers.style.transform = `rotate(${dialRotation}deg)`;

      const about = ScrollTrigger.getById("editorial-about-reading");
      let nextActive = 0;
      let currentPercentage = 0;
      ranges.current.forEach((range, index) => {
        if (scroll >= range.start - 1) nextActive = index;
        const progress = index === 1 && about
          ? about.progress
          : (scroll - range.start) / (range.end - range.start);
        const value = Math.round(clamp(progress, 0, 1) * 100);
        if (value !== previousPercentages[index]) {
          previousPercentages[index] = value;
          links[index].dataset.progress = String(value);
        }
        if (index === nextActive) currentPercentage = value;
      });

      if (nextActive !== active) {
        active = nextActive;
        links.forEach((link, index) => {
          link.dataset.active = String(index === active);
          if (index === active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
        if (count) count.textContent = `${String(active + 1).padStart(2, "0")} / 06`;
        if (label) label.textContent = chapters[active].label.toUpperCase();
        if (drag.current) window.history.replaceState(window.history.state, "", `#${chapters[active].id}`);
      }

      if (percentage) percentage.textContent = `${currentPercentage}%`;
      const overall = Math.round(maxScroll.current > 0 ? scroll / maxScroll.current * 100 : 0);
      slider.setAttribute("aria-valuenow", String(overall));
      slider.setAttribute("aria-valuetext", `${chapters[active].label}, ${currentPercentage}% through section`);
    };

    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(render); };
    const refresh = () => { needsMeasure = true; schedule(); };
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
      drag.current = null;
    };
  }, []);

  const scrollToPosition = (position: number, behavior?: ScrollBehavior) => {
    const pageEnd = maxScroll.current || Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: clamp(position, 0, pageEnd),
      behavior: behavior ?? (reducedMotion ? "instant" : "smooth"),
    });
  };

  const navigate = (event: ReactMouseEvent<HTMLAnchorElement>, index: number) => {
    const target = ranges.current[index];
    if (!target || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, "", `#${chapters[index].id}`);
    scrollToPosition(target.start + (index === 0 ? 0 : 2));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const distanceFromCenter = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
    if (distanceFromCenter < rect.width * 0.25) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      lastAngle: angleAtPointer(event, event.currentTarget),
      rotation: rotation.current,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const activeDrag = drag.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId || maxScroll.current <= 0) return;
    const nextAngle = angleAtPointer(event, event.currentTarget);
    activeDrag.rotation = clamp(activeDrag.rotation + shortestAngleDelta(nextAngle, activeDrag.lastAngle), 0, DIAL_SWEEP);
    activeDrag.lastAngle = nextAngle;
    scrollToPosition(activeDrag.rotation / DIAL_SWEEP * maxScroll.current, "instant");
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const currentScroll = window.scrollY;
    const currentIndex = ranges.current.reduce((index, range, i) => currentScroll >= range.start - 1 ? i : index, 0);
    const step = Math.max(72, window.innerHeight * 0.12);
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        scrollToPosition(currentScroll + step);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        scrollToPosition(currentScroll - step);
        break;
      case "PageDown":
        event.preventDefault();
        if (currentIndex < chapters.length - 1) scrollToPosition(ranges.current[currentIndex + 1].start + 2);
        else scrollToPosition(currentScroll + window.innerHeight);
        break;
      case "PageUp":
        event.preventDefault();
        if (currentIndex > 0) scrollToPosition(ranges.current[currentIndex - 1].start + 2);
        else scrollToPosition(0);
        break;
      case "Home":
        event.preventDefault();
        scrollToPosition(0);
        break;
      case "End":
        event.preventDefault();
        scrollToPosition(maxScroll.current);
        break;
    }
  };

  const ticks = Array.from({ length: 48 }, (_, index) => {
    const major = index % 8 === 0;
    return (
      <line
        key={index}
        x1="50"
        y1={major ? "7" : "9"}
        x2="50"
        y2={major ? "15" : "12"}
        transform={`rotate(${index * 7.5} 50 50)`}
        stroke={major ? "#d1d5da" : "#9298a0"}
        strokeOpacity={major ? ".9" : ".64"}
        strokeWidth={major ? "1.15" : ".8"}
        strokeLinecap="round"
      />
    );
  });

  return (
    <nav
      ref={rail}
      aria-label="Home section lens navigation"
      data-home-scroll-rail
      className="fixed top-1/2 right-[12px] z-40 size-[108px] -translate-y-1/2 [--marker-radius:43px] max-[520px]:right-[7px] max-[520px]:size-[82px] max-[520px]:[--marker-radius:30px]"
    >
      <div ref={markerLayer} data-lens-markers className="pointer-events-none absolute inset-0 z-30">
        {chapters.map((chapter, index) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            title={`${String(index + 1).padStart(2, "0")} · ${chapter.label}`}
            aria-label={`Scroll to ${chapter.label}`}
            data-scroll-chapter={chapter.id}
            data-active={index === 0 ? "true" : "false"}
            onClick={(event) => navigate(event, index)}
            className="group pointer-events-auto absolute left-1/2 top-1/2 grid size-6 place-items-center rounded-full focus-visible:z-40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#e2e5e9]"
            style={{ transform: `translate(-50%, -50%) rotate(${-(index * DIAL_SWEEP / (chapters.length - 1))}deg) translateY(calc(0px - var(--marker-radius)))` }}
          >
            <span
              aria-hidden="true"
              className="block h-[11px] w-[5px] rounded-[2px] border border-[#9298a0]! bg-[#171d22] shadow-[0_1px_3px_rgb(0_0_0_/_75%)] transition-[background,border-color,box-shadow] duration-150 group-data-[active=true]:border-[#e2e5e9]! group-data-[active=true]:bg-[#c2c7ce] group-data-[active=true]:shadow-[0_0_10px_rgb(194_199_206_/_75%)] group-hover:border-[#e2e5e9]! max-[520px]:h-[9px]"
            />
          </a>
        ))}
      </div>

      <div
        ref={dial}
        role="slider"
        tabIndex={0}
        aria-label="Turn the camera-lens dial to scroll through Home"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        aria-valuetext="Home, 0% through section"
        data-camera-scroll-dial
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        className="relative z-10 grid size-[108px] cursor-grab touch-none select-none place-items-center rounded-full outline-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7dbe0] max-[520px]:size-[82px]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#9298a0]! bg-[radial-gradient(circle_at_32%_25%,#414a50,#171d22_49%,#070a0c_78%)] shadow-[0_12px_38px_rgb(0_0_0_/_58%),inset_0_1px_0_rgb(255_255_255_/_25%),inset_0_-5px_9px_rgb(0_0_0_/_80%)]"
        />
        <div
          ref={wheel}
          aria-hidden="true"
          data-lens-wheel
          className="pointer-events-none absolute inset-[6px] rounded-full border border-[#9298a0]! bg-[conic-gradient(from_0deg,#535c63,#161c21_19%,#70797f_23%,#141a1f_29%,#454d53_51%,#11171c_72%,#535c63)] shadow-[inset_0_2px_4px_rgb(255_255_255_/_19%),inset_0_-5px_9px_rgb(0_0_0_/_78%),0_2px_4px_rgb(0_0_0_/_75%)] will-change-transform"
        >
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#9298a0" strokeOpacity=".72" strokeWidth=".8" />
            {ticks}
            <circle cx="50" cy="50" r="34" fill="none" stroke="#9298a0" strokeOpacity=".52" strokeWidth=".7" />
          </svg>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[1px] left-1/2 z-40 -translate-x-1/2 border-x-[4px] border-t-[7px] border-x-transparent border-t-[#e1e5e9] drop-shadow-[0_0_5px_rgb(225_229_233_/_65%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none relative z-20 grid size-[66px] place-items-center content-center rounded-full border border-[#9298a0]! bg-[radial-gradient(circle_at_35%_27%,#39434a,#10161b_67%,#080b0e)] text-center shadow-[inset_0_1px_0_rgb(255_255_255_/_23%),inset_0_-3px_7px_rgb(0_0_0_/_85%),0_0_6px_rgb(0_0_0_/_65%)] max-[520px]:size-[52px]"
        >
          <svg className="mb-[1px] size-[14px] text-[#c4c9cf] max-[520px]:size-3" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeOpacity=".66" strokeWidth="1.2" />
            <path d="M16 5.5 21.8 9l4.7 5.4-2.1 7-6.2 4.8-7-2.2-4.1-6.2 2.7-7.1L16 5.5Z" stroke="currentColor" strokeOpacity=".82" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="4.2" fill="#9298a0" fillOpacity=".78" />
            <circle cx="16" cy="16" r="2" fill="#d9dde2" />
          </svg>
          <span data-dial-count className="text-[.37rem] leading-none tracking-[.13em] text-[#aeb5bc]">01 / 06</span>
          <span data-dial-label className="mt-[3px] max-w-[58px] text-[.48rem] font-medium leading-[1.05] tracking-[.04em] text-[#eef0f3] max-[520px]:max-w-[48px] max-[520px]:text-[.4rem]">HOME</span>
          <span data-dial-progress className="mt-[3px] text-[.4rem] leading-none tabular-nums text-[#aeb5bc]">0%</span>
        </div>
      </div>
    </nav>
  );
}
