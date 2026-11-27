"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "./motion/gsap";
import { Chars, KLine, Meta, ScrollCue } from "./editorial/kit";
import type { CommunityOrbHandle } from "@/lib/visuals/community-orb-scene";

export type CommunityHeroTeam = { name: string; short: string; color: string };
const tagPositions = [
  "left-[16%] top-[26%]",
  "right-[14%] top-[20%]",
  "right-[10%] top-[52%]",
  "right-[24%] bottom-[16%]",
  "left-[10%] bottom-[30%]",
  "left-[44%] top-[11%]",
];

function OrbFallback() {
  const dots = Array.from({ length: 680 }, (_, index) => {
    const y = 1 - (index / 679) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    const z = Math.sin(angle) * radius;
    // Round serialized attributes: server and browser trig can differ at the last bit.
    return (
      <circle
        key={index}
        cx={(300 + Math.cos(angle) * radius * 174).toFixed(3)}
        cy={(300 + y * 174).toFixed(3)}
        r={z > 0 ? 1.75 : 1.1}
        opacity={(0.2 + (z + 1) * 0.34).toFixed(3)}
      />
    );
  });
  return (
    <svg
      viewBox="0 0 600 600"
      className="size-full text-[var(--site-sky-ink,#52e8d1)]"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse
        cx="300"
        cy="300"
        rx="230"
        ry="83"
        transform="rotate(-24 300 300)"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.22"
      />
      <ellipse
        cx="300"
        cy="300"
        rx="242"
        ry="124"
        transform="rotate(49 300 300)"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.1"
      />
      {dots}
    </svg>
  );
}

/** This hero owns its motion; shared page reveals do not target its elements. */
export default function CommunityHero({
  teams,
}: {
  teams: CommunityHeroTeam[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const host = hostRef.current;
    if (!root || !host) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    const lowPower =
      Boolean(nav.connection?.saveData) ||
      (nav.deviceMemory ?? 4) <= 2 ||
      (nav.hardwareConcurrency ?? 4) <= 2;
    let handle: CommunityOrbHandle | null = null;
    let disposed = false;
    let loading = false;
    let visible = false;
    let failed = false;
    let context: gsap.Context | undefined;
    let floatX: ((value: number) => void) | undefined;
    let floatY: ((value: number) => void) | undefined;
    root.dataset.renderer = "fallback";
    const allowed = () =>
      !paused && !reduced.matches && !lowPower && !disposed && !failed;
    const stop = () => {
      handle?.dispose();
      handle = null;
      context?.revert();
      context = undefined;
      floatX = undefined;
      floatY = undefined;
      root.dataset.renderer = "fallback";
    };
    const activate = async () => {
      if (!allowed() || !visible || loading || handle) return;
      loading = true;
      try {
        const { createCommunityOrb } = await import(
          "@/lib/visuals/community-orb-scene"
        );
        if (!allowed()) return;
        const created = createCommunityOrb(host, () => {
          failed = true;
          stop();
        });
        if (!created) {
          failed = true;
          return;
        }
        if (!allowed()) {
          created.dispose();
          return;
        }
        handle = created;
        handle.setVisible(visible && !document.hidden);
        root.dataset.renderer = "webgl";
      } catch {
        failed = true;
        stop();
      } finally {
        loading = false;
      }
    };
    const setupMotion = () => {
      if (!allowed() || context) return;
      context = gsap.context(() => {
        const layer = root.querySelector<HTMLElement>("[data-orb-layer]");
        if (layer && pointer.matches) {
          floatX = gsap.quickTo(layer, "x", {
            duration: 1.2,
            ease: "power3.out",
          });
          floatY = gsap.quickTo(layer, "y", {
            duration: 1.2,
            ease: "power3.out",
          });
        }
      }, root);
    };
    const onPointer = (event: PointerEvent) => {
      if (
        !allowed() ||
        !visible ||
        !pointer.matches ||
        event.pointerType === "touch"
      )
        return;
      const box = root.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width - 0.5) * 2;
      const y = ((event.clientY - box.top) / box.height - 0.5) * 2;
      handle?.setPointer(x, y);
      floatX?.(x * 13);
      floatY?.(y * 9);
    };
    const onLeave = () => {
      handle?.setPointer(0, 0);
      floatX?.(0);
      floatY?.(0);
    };
    const onPreference = () => {
      stop();
      if (allowed()) {
        setupMotion();
        void activate();
      }
    };
    const onVisibility = () => handle?.setVisible(visible && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        handle?.setVisible(visible && !document.hidden);
        if (visible) void activate();
      },
      { threshold: 0.02 },
    );
    const resize = new ResizeObserver(() => handle?.resize());
    setupMotion();
    observer.observe(root);
    resize.observe(host);
    root.addEventListener("pointermove", onPointer, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    reduced.addEventListener("change", onPreference);
    pointer.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      resize.disconnect();
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerleave", onLeave);
      reduced.removeEventListener("change", onPreference);
      pointer.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused]);

  return (
    <section
      ref={rootRef}
      data-community-hero
      data-k-spread
      data-renderer="fallback"
      data-motion={paused ? "paused" : "auto"}
      aria-labelledby="community-title"
      className="group/hero relative isolate flex min-h-[max(720px,100svh)] flex-col justify-between overflow-hidden px-[var(--site-gutter)] pt-[calc(var(--site-header-clearance,112px)+18px)] pb-[clamp(22px,3vw,40px)]"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_50%_46%,rgb(40_205_183_/_9%),transparent_56%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 grid place-items-center" data-k-sink>
        <div
          data-orb-layer
          className="relative aspect-square w-[min(118vw,96svh)] max-w-[980px] max-[700px]:w-[128vw] max-[700px]:-translate-y-[6%]"
          aria-hidden="true"
        >
          <div className="absolute inset-0 transition-opacity duration-700 group-data-[renderer=webgl]/hero:opacity-0 motion-reduce:transition-none">
            <OrbFallback />
          </div>
          <div
            ref={hostRef}
            data-community-orb
            className="absolute inset-0 opacity-0 transition-opacity duration-700 group-data-[renderer=webgl]/hero:opacity-100 motion-reduce:transition-none"
          />
          {teams.slice(0, 6).map((team, index) => (
            <span
              key={`${team.name}-${index}`}
              className={`absolute ${tagPositions[index]} flex items-center gap-2 rounded-full bg-[rgb(8_13_18_/_.78)] px-3 py-2 text-[10px] tracking-[.12em] text-white shadow-[0_5px_30px_rgb(0_0_0_/_24%)] backdrop-blur-[6px] sm:px-3.5 sm:text-[11px]`}
              style={{ "--team-color": team.color } as CSSProperties}
            >
              <span className="size-1.5 rounded-full bg-[var(--team-color)] shadow-[0_0_10px_var(--team-color)]" />
              {team.short === "CLUB" ? team.name : team.short}
            </span>
          ))}
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-3 items-start gap-4 max-[700px]:grid-cols-2" data-k-fade>
        <Meta>IT Club — Community</Meta>
        <Meta className="justify-self-center max-[700px]:hidden">{String(teams.length).padStart(2, "0")} boards · one club</Meta>
        <p className="m-0 justify-self-end font-[family-name:var(--font-alexandria)] text-[.8rem] text-[var(--site-sky-ink)]" lang="ar" dir="rtl">الناس اللي بتصنع الفرق</p>
      </div>
      <div className="relative z-10">
        <h1
          id="community-title"
          aria-label="A club is its people."
          data-k-title
          className="m-0 text-[clamp(3.9rem,15.2vw,17.5rem)] font-normal leading-[.84] tracking-[-.085em]"
        >
          <KLine side="l"><Chars text="A club is" /></KLine>
          <KLine side="r" className="text-right"><span className="text-[var(--site-sky-ink)]"><Chars text="its people" /></span><Chars text="." /></KLine>
        </h1>
        <div className="mt-[clamp(22px,3vw,44px)] flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-5">
          <p data-k-fade className="m-0 max-w-[40ch] text-[clamp(.88rem,1.05vw,1rem)] leading-[1.75] text-[var(--site-copy)]">
            Different minds, one shared purpose. Move your cursor through the network —
            then meet the boards that turn curiosity into work we build together.
          </p>
          <div data-k-fade className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
              className="flex min-h-11 items-center gap-2 rounded-full px-1 text-[.66rem] uppercase tracking-[.16em] text-[var(--site-copy)] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:hidden"
              aria-label={paused ? "Play community animation" : "Pause community animation"}
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full ${paused ? "bg-[var(--site-copy)]" : "bg-[var(--site-sky-ink)] motion-safe:animate-pulse"}`} />
              {paused ? "Play" : "Pause"}
            </button>
            <Link href="#community-boards" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)]">
              <ScrollCue label="Meet the boards" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
