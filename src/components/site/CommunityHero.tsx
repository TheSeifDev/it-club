"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "./motion/gsap";
import type { CommunityOrbHandle } from "@/lib/visuals/community-orb-scene";

export type CommunityHeroTeam = { name: string; short: string; color: string };
const tagPositions = [
  "left-[11%] top-[24%]",
  "right-[9%] top-[17%]",
  "right-[7%] top-[51%] sm:right-[1%]",
  "right-[19%] bottom-[12%]",
  "left-[6%] bottom-[24%] sm:left-[3%]",
  "left-[40%] top-[7%]",
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
        gsap.fromTo(
          "[data-community-entrance]",
          { y: 34, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.15,
            stagger: 0.09,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
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
      data-renderer="fallback"
      data-motion={paused ? "paused" : "auto"}
      aria-labelledby="community-title"
      className="group/hero relative isolate min-h-[min(950px,100svh)] overflow-hidden px-[clamp(20px,3.5vw,64px)] pt-[calc(var(--site-header-clearance,112px)+30px)] pb-8 lg:flex lg:min-h-[max(780px,100svh)] lg:flex-col lg:justify-between lg:pt-[calc(var(--site-header-clearance,112px)+48px)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_74%_50%,rgb(40_205_183_/_7%),transparent_49%)]"
      />
      <div
        data-community-entrance
        className="relative z-10 flex items-center justify-between gap-4 text-[10px] font-medium tracking-[0.13em] text-[var(--site-copy)] sm:text-xs"
      >
        <p className="m-0 inline-flex items-center gap-3">
          <span
            className="size-1.5 rounded-full bg-[var(--site-sky-ink)]"
            aria-hidden="true"
          />
          IT CLUB / COMMUNITY
        </p>
        <span
          className="hidden text-[var(--site-sky-ink)] sm:block"
          lang="ar"
          dir="rtl"
        >
          الناس اللي بتصنع الفرق
        </span>
      </div>
      <div className="relative mt-10 grid items-center lg:mt-0 lg:grid-cols-[1.04fr_1fr]">
        <div className="relative z-10 lg:py-10">
          <h1
            id="community-title"
            className="m-0 text-[clamp(3.6rem,8.9vw,9.1rem)] leading-[0.98] font-medium tracking-[-0.075em] sm:text-[clamp(4.5rem,8.9vw,9.1rem)]"
          >
            <span className="block" data-community-entrance>
              A club is{" "}
            </span>
            <span
              className="block text-[var(--site-sky-ink)]"
              data-community-entrance
            >
              its people<span className="text-[var(--site-ink)]">.</span>
            </span>
          </h1>
          <p
            data-community-entrance
            className="mt-7 max-w-[36ch] text-[clamp(0.9rem,1.15vw,1.06rem)] leading-[1.8] text-[var(--site-copy)] lg:mt-9"
          >
            Different minds. Shared purpose. Meet the teams turning curiosity
            into something we build together.
          </p>
          <Link
            data-community-entrance
            href="#community-committees"
            className="mt-5 inline-flex min-h-12 items-center gap-6 rounded-full bg-[var(--site-sky-ink)] py-2 pr-2 pl-6 text-sm font-medium text-[#05070a] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:transition-none"
          >
            Meet the committees
            <span
              className="grid size-8 place-items-center rounded-full bg-black/10"
              aria-hidden="true"
            >
              <ArrowDown size={17} />
            </span>
          </Link>
        </div>
        <div
          data-orb-layer
          className="pointer-events-none relative mx-auto -mt-2 aspect-square w-[min(100%,580px)] max-w-none sm:w-[min(100%,620px)] lg:-ml-[4%] lg:mt-0 lg:w-[min(118%,67svh)] lg:max-w-[760px]"
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
          <span className="absolute top-[48%] left-[43%] text-[clamp(0.7rem,1.1vw,0.95rem)] font-medium tracking-[0.25em] text-white/90">
            IT CLUB
          </span>
          {teams.slice(0, 6).map((team, index) => (
            <span
              key={`${team.name}-${index}`}
              className={`absolute ${tagPositions[index]} flex items-center gap-2.5 rounded-full bg-[#0b1216]/90 px-3.5 py-2.5 text-[11px] text-white shadow-[0_5px_30px_rgb(0_0_0_/_24%)] sm:px-4 sm:text-xs`}
              style={{ "--team-color": team.color } as CSSProperties}
            >
              <span className="size-1.5 rounded-full bg-[var(--team-color)]" />
              {team.short === "CLUB" ? team.name : team.short}
            </span>
          ))}
          <span className="absolute right-[8%] bottom-[4%] text-[9px] tracking-[0.2em] text-[var(--site-copy)] sm:text-[10px]">
            MANY MINDS / ONE NETWORK
          </span>
        </div>
      </div>
      <div
        data-community-entrance
        className="relative z-10 flex items-end justify-between gap-6 text-[10px] tracking-[0.12em] text-[var(--site-copy)] sm:text-xs"
      >
        <div>
          <span className="block">LEARN. BUILD. BELONG.</span>
          <span
            className="mt-2 block tracking-normal text-[var(--site-sky-ink)]"
            lang="ar"
            dir="rtl"
          >
            كلنا بنكمل بعض
          </span>
        </div>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
            className="flex min-h-11 items-center gap-2 rounded-full px-3 text-[10px] tracking-normal text-[var(--site-copy)] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:hidden"
            aria-label={
              paused ? "Play community animation" : "Pause community animation"
            }
          >
            {paused ? (
              <Play size={12} aria-hidden="true" />
            ) : (
              <Pause size={12} aria-hidden="true" />
            )}
            {paused ? "Play motion" : "Pause motion"}
          </button>
          <Link
            href="#community-committees"
            className="inline-flex min-h-11 items-center gap-2 rounded-sm text-[var(--site-ink)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)]"
          >
            <span className="hidden sm:inline">EXPLORE THE TEAMS</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
