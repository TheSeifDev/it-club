"use client";

import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { gsap } from "../site/motion/gsap";
import type { StoreBadgeSceneHandle } from "@/lib/visuals/store-badge-scene";

type StoreBadgeProps = { className?: string };
type Pose = { yaw: number; pitch: number };
type PointerDrag = {
  id: number | null;
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** A concept-only store visual; no personal or credential data is represented. */
export default function StoreBadge({ className = "" }: StoreBadgeProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StoreBadgeSceneHandle | null>(null);
  const pausedRef = useRef(false);
  const dragRef = useRef<PointerDrag>({ id: null, x: 0, y: 0 });
  const fallbackPoseRef = useRef<Pose>({ yaw: 0, pitch: 0 });
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fallbackPose, setFallbackPose] = useState<Pose>({ yaw: 0, pitch: 0 });
  const [fallbackHover, setFallbackHover] = useState<Pose>({ yaw: 0, pitch: 0 });

  const updateFallbackPose = (next: Pose) => {
    fallbackPoseRef.current = next;
    setFallbackPose(next);
  };

  const rotate = (direction: -1 | 1) => {
    const amount = direction * 0.38;
    const current = fallbackPoseRef.current;
    updateFallbackPose({ yaw: clamp(current.yaw + amount * 48, -58, 58), pitch: current.pitch });
    sceneRef.current?.rotateBy(amount);
  };

  const resetOrientation = () => {
    updateFallbackPose({ yaw: 0, pitch: 0 });
    setFallbackHover({ yaw: 0, pitch: 0 });
    sceneRef.current?.reset();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = "grabbing";
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag.id === event.pointerId) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      const current = fallbackPoseRef.current;
      updateFallbackPose({
        yaw: clamp(current.yaw + dx * 0.58, -58, 58),
        pitch: clamp(current.pitch - dy * 0.3, -22, 22),
      });
      sceneRef.current?.rotateBy(dx * 0.009, -dy * 0.006);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5) * 2;
    sceneRef.current?.setPointer(x, y);
    setFallbackHover({ yaw: x * 5, pitch: -y * 3 });
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current.id !== event.pointerId) return;
    dragRef.current.id = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.style.cursor = "grab";
    sceneRef.current?.setPointer(0, 0);
  };

  const onPointerLeave = () => {
    if (dragRef.current.id !== null) return;
    sceneRef.current?.setPointer(0, 0);
    setFallbackHover({ yaw: 0, pitch: 0 });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      rotate(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      rotate(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      resetOrientation();
    }
  };

  useEffect(() => {
    const root = rootRef.current;
    const art = artRef.current;
    const host = hostRef.current;
    if (!root || !art || !host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(reduced.matches);
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
      deviceMemory?: number;
    };
    const lowPower = Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 4) <= 2;
    let disposed = false;
    let visible = false;
    let loading = false;
    let failed = false;
    let entered = false;
    let handle: StoreBadgeSceneHandle | null = null;
    let entranceContext: gsap.Context | undefined;

    root.dataset.renderer = "fallback";
    const eligible = () => !disposed && !failed && !reduced.matches && !lowPower;
    const stop = () => {
      handle?.dispose();
      handle = null;
      sceneRef.current = null;
      root.dataset.renderer = "fallback";
    };
    const playEntrance = () => {
      if (entered || !eligible() || pausedRef.current) return;
      entered = true;
      entranceContext = gsap.context(() => {
        gsap.fromTo(
          art,
          { y: 14, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: "power3.out",
            clearProps: "transform,opacity",
          },
        );
      }, root);
    };
    const activate = async () => {
      if (!eligible() || !visible || document.hidden || loading || handle) return;
      loading = true;
      try {
        const { createStoreBadgeScene } = await import(
          "@/lib/visuals/store-badge-scene"
        );
        if (!eligible() || !visible || document.hidden) return;
        const created = createStoreBadgeScene(host, () => {
          if (disposed) return;
          failed = true;
          stop();
        });
        if (!created) {
          failed = true;
          return;
        }
        if (!eligible() || !visible || disposed) {
          created.dispose();
          return;
        }
        handle = created;
        sceneRef.current = created;
        created.setPaused(pausedRef.current);
        created.setVisible(visible && !document.hidden);
        root.dataset.renderer = "webgl";
      } catch {
        failed = true;
        stop();
      } finally {
        loading = false;
      }
    };
    const onPreferenceChange = () => {
      setReducedMotion(reduced.matches);
      if (reduced.matches) {
        entranceContext?.revert();
        entranceContext = undefined;
        stop();
      } else if (visible) {
        playEntrance();
        void activate();
      }
    };
    const onVisibilityChange = () => {
      handle?.setVisible(visible && !document.hidden);
      if (!document.hidden && visible) void activate();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        handle?.setVisible(visible && !document.hidden);
        if (visible) {
          playEntrance();
          void activate();
        }
      },
      { threshold: 0.03 },
    );
    const resizeObserver = new ResizeObserver(() => handle?.resize());

    observer.observe(root);
    resizeObserver.observe(host);
    reduced.addEventListener("change", onPreferenceChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      entranceContext?.revert();
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      reduced.removeEventListener("change", onPreferenceChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    sceneRef.current?.setPaused(paused);
    rootRef.current?.setAttribute("data-motion", paused ? "paused" : "playing");
  }, [paused]);

  const poseStyle = {
    transform: `perspective(1100px) rotateX(${fallbackPose.pitch + fallbackHover.pitch}deg) rotateY(${fallbackPose.yaw + fallbackHover.yaw}deg)`,
    transition:
      paused || reducedMotion
        ? "none"
        : "transform 620ms cubic-bezier(0.2, 0.7, 0.2, 1)",
  };

  return (
    <div
      ref={rootRef}
      data-store-badge
      data-renderer="fallback"
      data-motion="playing"
      role="group"
      aria-label="Interactive IT Club badge and lanyard concept preview"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`group/store-badge relative isolate mx-auto aspect-[4/5] min-h-[420px] w-full max-w-[760px] overflow-hidden rounded-[18px] md:min-h-[500px] ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_43%,rgb(40_205_183_/_14%),transparent_48%),radial-gradient(ellipse_at_50%_78%,rgb(5_7_10_/_10%),transparent_58%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[15%] left-1/2 h-[58%] w-[62%] -translate-x-1/2 rounded-full bg-[var(--site-sky,#28cdb7)]/10 blur-[70px]"
      />

      <div ref={artRef} data-store-art className="absolute inset-0">
        <div
          ref={hostRef}
          data-store-badge-webgl
          aria-hidden="true"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onPointerLeave={onPointerLeave}
          className="pointer-events-auto absolute inset-0 z-[1] cursor-grab touch-pan-y opacity-0 transition-opacity duration-700 group-data-[renderer=webgl]/store-badge:opacity-100 motion-reduce:transition-none"
          style={{ touchAction: "pan-y" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-100 transition-opacity duration-700 group-data-[renderer=webgl]/store-badge:opacity-0 motion-reduce:transition-none"
        >
          <div className="absolute inset-0" style={poseStyle}>
            <svg viewBox="0 0 400 650" className="size-full" fill="none">
              <path
                d="M154 276 C151 222 128 176 135 128 C141 86 169 59 200 57 C231 59 259 86 265 128 C272 176 249 222 246 276"
                stroke="#102d37"
                strokeWidth="25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M154 276 C151 222 128 176 135 128 C141 86 169 59 200 57 C231 59 259 86 265 128 C272 176 249 222 246 276"
                stroke="#52e8d1"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.78"
              />
              <circle cx="154" cy="267" r="12" stroke="#b7cccb" strokeWidth="5" />
              <circle cx="246" cy="267" r="12" stroke="#b7cccb" strokeWidth="5" />
              <rect x="143" y="263" width="22" height="24" rx="4" fill="#d1e4e0" />
              <rect x="235" y="263" width="22" height="24" rx="4" fill="#d1e4e0" />
              <circle cx="154" cy="274" r="3" fill="#526d70" />
              <circle cx="246" cy="274" r="3" fill="#526d70" />
              <rect x="80" y="276" width="240" height="330" rx="28" fill="#07121a" />
              <rect
                x="84"
                y="280"
                width="232"
                height="322"
                rx="25"
                fill="#0d1c27"
                stroke="#d3e8e4"
                strokeOpacity="0.3"
                strokeWidth="2"
              />
              <rect
                x="101"
                y="297"
                width="198"
                height="288"
                rx="19"
                fill="#10242e"
                stroke="#52e8d1"
                strokeOpacity="0.18"
                strokeWidth="1.5"
              />
              <path d="M116 313 H284" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5" />
              <image
                href="/logo.webp"
                x="127"
                y="368"
                width="146"
                height="76"
                preserveAspectRatio="xMidYMid meet"
              />
              <path d="M119 548 l20 -31 h10 l-20 31z" fill="#28cdb7" opacity="0.9" />
              <path d="M145 548 l17 -27 h8 l-17 27z" fill="#a2c4c2" opacity="0.44" />
              <path d="M168 548 l14 -22 h6 l-14 22z" fill="#a2c4c2" opacity="0.28" />
              <path d="M230 548 H280" stroke="#52e8d1" strokeOpacity="0.24" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      <div className="absolute right-4 bottom-11 left-4 z-10 flex items-center justify-between gap-3 sm:right-6 sm:left-6">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? "Resume badge rotation" : "Pause badge rotation"}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-[#081116]/75 px-3.5 text-[11px] font-medium text-white/85 shadow-[0_6px_24px_rgb(0_0_0_/_18%)] backdrop-blur-md transition-colors hover:border-[var(--site-sky-ink,#52e8d1)]/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink,#52e8d1)] motion-reduce:transition-none"
        >
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
          {paused ? "Resume" : "Pause"}
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => rotate(-1)}
            aria-label="Rotate badge left"
            title="Rotate left"
            className="grid size-11 place-items-center rounded-full border border-white/12 bg-[#081116]/75 text-white/80 shadow-[0_6px_24px_rgb(0_0_0_/_18%)] backdrop-blur-md transition-colors hover:border-[var(--site-sky-ink,#52e8d1)]/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink,#52e8d1)] motion-reduce:transition-none"
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => rotate(1)}
            aria-label="Rotate badge right"
            title="Rotate right"
            className="grid size-11 place-items-center rounded-full border border-white/12 bg-[#081116]/75 text-white/80 shadow-[0_6px_24px_rgb(0_0_0_/_18%)] backdrop-blur-md transition-colors hover:border-[var(--site-sky-ink,#52e8d1)]/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink,#52e8d1)] motion-reduce:transition-none"
          >
            <RotateCw size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={resetOrientation}
            aria-label="Reset badge rotation"
            title="Reset rotation"
            className="ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/12 bg-[#081116]/75 px-3 text-[10px] font-medium text-white/80 shadow-[0_6px_24px_rgb(0_0_0_/_18%)] backdrop-blur-md transition-colors hover:border-[var(--site-sky-ink,#52e8d1)]/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink,#52e8d1)] motion-reduce:transition-none"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Reset
          </button>
        </div>
      </div>

      <p className="absolute right-4 bottom-2 left-4 z-10 m-0 text-center text-[9px] font-medium tracking-[0.22em] text-white/48 sm:text-[10px]">
        ID + LANYARD / CONCEPT PREVIEW
      </p>
    </div>
  );
}
