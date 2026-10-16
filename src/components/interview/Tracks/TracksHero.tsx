"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { IT_CLUB_TRACKS, type TrackDefinition } from "./tracks-data";

interface TracksHeroProps {
  activeTrackId?: string;
  onSelectTrack?: (trackId: string) => void;
}

/* ========================================================================= */
/* 6 DETERMINISTIC HOLOGRAPHIC 3D / SVG MOTION GRAPHICS FOR THE RUNWAYS      */
/* (Unconditional DOM nodes to guarantee 100% hydration matching)            */
/* ========================================================================= */

// Track 1: Human Resources (Interconnected Community Constellation)
function HRIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-700 ${
        active
          ? "scale-110 drop-shadow-[0_0_18px_rgba(53,217,138,0.7)]"
          : "scale-90 opacity-30"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
        fill="none"
      >
        {/* Core Node */}
        <circle
          cx="50"
          cy="50"
          r="10"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}33` : "none"}
        />
        <circle cx="50" cy="50" r="4" fill={color} />
        {/* Member Nodes */}
        <circle
          cx="30"
          cy="30"
          r="6"
          stroke={color}
          strokeWidth="1.5"
          fill={active ? `${color}22` : "none"}
        />
        <circle
          cx="70"
          cy="30"
          r="6"
          stroke={color}
          strokeWidth="1.5"
          fill={active ? `${color}22` : "none"}
        />
        <circle cx="24" cy="65" r="5" stroke={color} strokeWidth="1.5" />
        <circle cx="76" cy="65" r="5" stroke={color} strokeWidth="1.5" />
        <circle cx="50" cy="80" r="6" stroke={color} strokeWidth="1.5" />
        {/* Connecting Synaptic Fibers */}
        <line
          x1="50"
          y1="50"
          x2="30"
          y2="30"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={active ? "3 2" : "none"}
        />
        <line
          x1="50"
          y1="50"
          x2="70"
          y2="30"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={active ? "3 2" : "none"}
        />
        <line
          x1="50"
          y1="50"
          x2="24"
          y2="65"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={active ? "3 2" : "none"}
        />
        <line
          x1="50"
          y1="50"
          x2="76"
          y2="65"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={active ? "3 2" : "none"}
        />
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="80"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray={active ? "3 2" : "none"}
        />
        {/* Orbital Pulse Wave (Unconditional node to prevent hydration mismatch) */}
        <circle
          cx="50"
          cy="50"
          r="26"
          stroke={color}
          strokeWidth="1"
          opacity={active ? 0.6 : 0}
          className={active ? "animate-ping" : ""}
          style={{ transformOrigin: "50px 50px" }}
        />
      </svg>
    </div>
  );
}

// Track 2: Public Relations (3D Broadcast Waves & Radar Horn)
function PRIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-700 ${
        active
          ? "scale-110 drop-shadow-[0_0_18px_rgba(255,60,167,0.7)]"
          : "scale-90 opacity-30"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
        fill="none"
      >
        {/* Transmitter Horn */}
        <path
          d="M26 40 L46 30 L46 70 L26 60 Z"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}25` : "none"}
        />
        <rect
          x="18"
          y="44"
          width="8"
          height="12"
          rx="1"
          stroke={color}
          strokeWidth="1.5"
          fill={active ? color : "none"}
        />
        <line
          x1="34"
          y1="55"
          x2="31"
          y2="76"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Concentric Broadcast Waves */}
        <path
          d="M54 35 A 18 18 0 0 1 54 65"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          className={active ? "animate-pulse" : ""}
          opacity={active ? 1 : 0.35}
        />
        <path
          d="M64 27 A 28 28 0 0 1 64 73"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={active ? 0.8 : 0.25}
        />
        <path
          d="M74 19 A 38 38 0 0 1 74 81"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          opacity={active ? 0.6 : 0.15}
        />
      </svg>
    </div>
  );
}

// Track 3: Social Media (Holographic Viral Prism & Spark Beacon)
function SMIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-700 ${
        active
          ? "scale-110 drop-shadow-[0_0_18px_rgba(234,255,0,0.6)]"
          : "scale-90 opacity-30"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
        fill="none"
      >
        {/* Outer Prism Triangle */}
        <polygon
          points="50,18 82,74 18,74"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}20` : "none"}
        />
        {/* Inner Core Prism */}
        <polygon points="50,36 68,66 32,66" stroke={color} strokeWidth="1.5" />
        <circle cx="50" cy="54" r="5" fill={color} />
        {/* Viral Spark Sparks */}
        <circle
          cx="20"
          cy="34"
          r="2.5"
          fill={color}
          className={active ? "animate-ping" : ""}
          opacity={active ? 1 : 0.3}
        />
        <circle
          cx="80"
          cy="36"
          r="2"
          fill={color}
          className={active ? "animate-pulse" : ""}
          opacity={active ? 1 : 0.3}
        />
        <circle cx="50" cy="10" r="2.5" fill={color} opacity={active ? 1 : 0.3} />
      </svg>
    </div>
  );
}

// Track 4: Organizing Committee (3D Event Arena & Compass Timeline)
function OCIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-700 ${
        active
          ? "scale-110 drop-shadow-[0_0_18px_rgba(255,171,24,0.7)]"
          : "scale-90 opacity-30"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
        fill="none"
      >
        {/* Elliptical Tiered Amphitheater */}
        <ellipse
          cx="50"
          cy="66"
          rx="36"
          ry="14"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}18` : "none"}
        />
        <ellipse
          cx="50"
          cy="55"
          rx="26"
          ry="10"
          stroke={color}
          strokeWidth="1.5"
        />
        <ellipse
          cx="50"
          cy="44"
          rx="16"
          ry="6"
          stroke={color}
          strokeWidth="1.5"
          fill={active ? `${color}35` : "none"}
        />
        {/* Stage Focus Rays */}
        <line
          x1="28"
          y1="20"
          x2="42"
          y2="44"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity={active ? 0.9 : 0.3}
        />
        <line
          x1="72"
          y1="20"
          x2="58"
          y2="44"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="2 2"
          opacity={active ? 0.9 : 0.3}
        />
        <line
          x1="50"
          y1="16"
          x2="50"
          y2="40"
          stroke={color}
          strokeWidth="1.5"
          opacity={active ? 1.0 : 0.4}
        />
        <circle cx="50" cy="44" r="3" fill={color} />
      </svg>
    </div>
  );
}

// Track 5: Information Technology (3D Cybernetic Microchip & Code Cube)
function ITIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-700 ${
        active
          ? "scale-110 drop-shadow-[0_0_18px_rgba(24,200,237,0.7)]"
          : "scale-90 opacity-30"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
        fill="none"
      >
        {/* Isometric Cube Top Face */}
        <polygon
          points="50,20 78,35 50,50 22,35"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}30` : "none"}
        />
        {/* Isometric Cube Left Face */}
        <polygon
          points="22,35 50,50 50,78 22,63"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}15` : "none"}
        />
        {/* Isometric Cube Right Face */}
        <polygon
          points="50,50 78,35 78,63 50,78"
          stroke={color}
          strokeWidth="2"
          fill={active ? `${color}25` : "none"}
        />
        {/* Bus Trace Circuits */}
        <line x1="50" y1="24" x2="50" y2="46" stroke={color} strokeWidth="1.5" />
        <line
          x1="32"
          y1="32"
          x2="68"
          y2="38"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <circle cx="50" cy="50" r="3" fill={color} />
        {/* Data Outflow Pins */}
        <line x1="36" y1="71" x2="28" y2="76" stroke={color} strokeWidth="1.5" />
        <line x1="64" y1="71" x2="72" y2="76" stroke={color} strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// Track 6: Research & Development (3D Quantum Atomic Orbitals & AI Synapse)
function RNDIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-700 ${
        active
          ? "scale-110 drop-shadow-[0_0_18px_rgba(155,124,255,0.7)]"
          : "scale-90 opacity-30"
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
        fill="none"
      >
        {/* Quantum Core */}
        <circle
          cx="50"
          cy="50"
          r="7"
          fill={color}
          className={active ? "animate-pulse" : ""}
        />
        {/* 3 Elliptical Orbital Rings */}
        <ellipse
          cx="50"
          cy="50"
          rx="36"
          ry="14"
          stroke={color}
          strokeWidth="1.8"
          transform="rotate(0 50 50)"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="36"
          ry="14"
          stroke={color}
          strokeWidth="1.8"
          transform="rotate(60 50 50)"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="36"
          ry="14"
          stroke={color}
          strokeWidth="1.8"
          transform="rotate(120 50 50)"
        />
        {/* Orbiting Quantum Particles */}
        <circle
          cx="86"
          cy="50"
          r="2.5"
          fill={color}
          opacity={active ? 1 : 0.4}
        />
        <circle
          cx="32"
          cy="20"
          r="2.5"
          fill={color}
          opacity={active ? 1 : 0.4}
        />
        <circle
          cx="68"
          cy="80"
          r="2.5"
          fill={color}
          opacity={active ? 1 : 0.4}
        />
      </svg>
    </div>
  );
}

const emptySubscribe = () => () => {};

function useIsMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function TracksHero({
  activeTrackId,
  onSelectTrack,
}: TracksHeroProps) {
  // Deterministic initial state: 0 (HR) for both server and initial client render
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isMounted = useIsMounted();
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active track index when activeTrackId prop changes (render-time state adjustment)
  const [prevActiveTrackId, setPrevActiveTrackId] = useState<string | undefined>(
    activeTrackId
  );
  if (activeTrackId !== prevActiveTrackId) {
    setPrevActiveTrackId(activeTrackId);
    if (activeTrackId) {
      const idx = IT_CLUB_TRACKS.findIndex((t) => t.id === activeTrackId);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }

  // Continuous Auto-Cycle Spotlight Animation (Runs only after mounting)
  useEffect(() => {
    if (!isMounted || isPaused) return;

    // Respect prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % IT_CLUB_TRACKS.length);
    }, 4200);

    return () => clearInterval(interval);
  }, [isMounted, isPaused]);

  // Handle manual track selection
  const handleTrackClick = useCallback(
    (
      e: React.MouseEvent<HTMLAnchorElement>,
      track: TrackDefinition,
      index: number
    ) => {
      e.preventDefault();
      setCurrentIndex(index);
      setIsPaused(true);
      onSelectTrack?.(track.id);

      const target = document.getElementById(track.id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.pushState(null, "", `#${track.id}`);
      }

      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => {
        setIsPaused(false);
      }, 5000);
    },
    [onSelectTrack]
  );

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  };

  const activeIndex = hoveredIndex !== null ? hoveredIndex : currentIndex;
  const currentActiveTrack = IT_CLUB_TRACKS[activeIndex] || IT_CLUB_TRACKS[0];

  const renderTrackEmblem = (index: number, active: boolean, color: string) => {
    switch (index) {
      case 0:
        return <HRIcon active={active} color={color} />;
      case 1:
        return <PRIcon active={active} color={color} />;
      case 2:
        return <SMIcon active={active} color={color} />;
      case 3:
        return <OCIcon active={active} color={color} />;
      case 4:
        return <ITIcon active={active} color={color} />;
      case 5:
        return <RNDIcon active={active} color={color} />;
      default:
        return <HRIcon active={active} color={color} />;
    }
  };

  return (
    <section
      aria-label="IT Club Tracks Hero"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10 select-none min-h-[580px] sm:min-h-[640px] md:h-[calc(100vh-64px)] md:max-h-[740px] flex flex-col justify-between"
    >
      {/* ================================================================= */}
      {/* 1. CINEMATIC BACKGROUND: STAGE BACKDROP & REALISTIC SMOKE         */}
      {/* ================================================================= */}

      {/* Stage Backdrop Image Layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <Image
          src="/spotlight-stage.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-35 mix-blend-screen scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-[#050708]/65 to-[#050708]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_20%,_#050708_75%)]" />
      </div>

      {/* Realistic Billowing Atmospheric Smoke Cloud Formations (Left & Right) */}
      <div
        aria-hidden="true"
        className="tracks-smoke-left pointer-events-none absolute top-12 -left-20 w-[420px] h-[340px] opacity-40 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.3) 0%, rgba(200,225,255,0.15) 35%, transparent 70%)",
          filter: "blur(42px)",
        }}
      />
      <div
        aria-hidden="true"
        className="tracks-smoke-right pointer-events-none absolute top-16 -right-20 w-[440px] h-[360px] opacity-35 mix-blend-screen"
        style={{
          background:
            "radial-gradient(ellipse at 60% 45%, rgba(255,255,255,0.28) 0%, rgba(200,240,255,0.12) 40%, transparent 70%)",
          filter: "blur(46px)",
        }}
      />

      {/* Subtle Overhead Ambient Stage Haze */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-25"
      >
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-48 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, rgba(24,200,237,0.1) 40%, transparent 75%)",
            filter: "blur(32px)",
          }}
        />
      </div>

      {/* ================================================================= */}
      {/* 2. COMPACT, CENTERED EDITORIAL HEADLINE (Independent from Lights) */}
      {/* ================================================================= */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-10 sm:pt-14 md:pt-16 text-center flex flex-col items-center">
        {/* Arabic Eyebrow above headline */}
        <p className="arabic text-sm sm:text-base md:text-lg font-medium text-neutral-300/90 tracking-wide mb-2">
          مسارات نادي تكنولوجيا المعلومات
        </p>

        {/* 2-Line Headline: Six tracks. One community, split six ways. */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-extrabold tracking-[-0.035em] leading-[1.08] text-white">
          Six tracks.
          <br />
          <span className="text-white">One community, </span>
          <span style={{ color: "#35d98a" }}>split </span>
          <span style={{ color: "#ff3ca7" }}>six </span>
          <span style={{ color: "#18c8ed" }}>ways.</span>
        </h1>
      </div>

      {/* ================================================================= */}
      {/* 3. PERSPECTIVE FLOOR STAGE WITH UPWARD SPOTLIGHTS & 3D EMBLEMS     */}
      {/* (Beams originate at the bottom navigation boundary and shoot UP)  */}
      {/* ================================================================= */}
      <div className="relative z-[5] w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-12 flex-1 flex flex-col justify-end min-h-[240px] sm:min-h-[280px] md:min-h-[320px] overflow-hidden">
        {/* DESKTOP 6-COLUMN UPWARD VOLUMETRIC SPOTLIGHT BEAMS RIG */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden"
        >
          {IT_CLUB_TRACKS.map((track, idx) => {
            const isActive = idx === activeIndex;
            const colWidth = 100 / 6;

            // Base footprint at bottom boundary (y = 100%): exactly matches card column
            const bottomLeft = idx * colWidth;
            const bottomRight = (idx + 1) * colWidth;

            // Top coordinates at upper boundary (y = 0%):
            // Beams project UPWARD, spreading gently toward the stage center
            const centerOffset = idx - 2.5; // -2.5, -1.5, -0.5, +0.5, +1.5, +2.5
            const topCenter = 50 + centerOffset * 11.5; // 21.25% to 78.75%
            const topHalfWidth = 9.5; // width at top is 19%
            const topLeft = topCenter - topHalfWidth;
            const topRight = topCenter + topHalfWidth;

            const polygon = `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`;
            const corePolygon = `polygon(${topLeft + 2.5}% 0%, ${topRight - 2.5}% 0%, ${bottomRight - 1.5}% 100%, ${bottomLeft + 1.5}% 100%)`;

            return (
              <React.Fragment key={`upward-beam-${track.id}`}>
                {/* Volumetric Upward Projector Beam */}
                <div
                  className="absolute inset-0 transition-all duration-700 ease-out"
                  style={{
                    clipPath: polygon,
                    opacity: isActive ? 0.92 : 0.16,
                    filter: isActive ? "blur(4px) brightness(1.25)" : "blur(8px)",
                    mixBlendMode: "screen",
                    background: isActive
                      ? `linear-gradient(0deg, ${track.color}ee 0%, ${track.color}aa 25%, ${track.color}44 65%, transparent 100%)`
                      : `linear-gradient(0deg, ${track.color}44 0%, ${track.color}22 35%, transparent 100%)`,
                  }}
                />

                {/* Core Filament Beam */}
                <div
                  className="absolute inset-0 transition-opacity duration-700 ease-out"
                  style={{
                    clipPath: corePolygon,
                    opacity: isActive ? 0.8 : 0.05,
                    filter: "blur(2px)",
                    mixBlendMode: "screen",
                    background: `linear-gradient(0deg, #ffffff 0%, ${track.color}dd 25%, ${track.color}22 75%, transparent 100%)`,
                  }}
                />

                {/* Emitter Origin Wash right at the card top edge (navigation boundary) */}
                <div
                  className="absolute bottom-0 h-28 transition-all duration-700 ease-out"
                  style={{
                    left: `${bottomLeft}%`,
                    width: `${colWidth}%`,
                    opacity: isActive ? 1.0 : 0.2,
                    background: `radial-gradient(ellipse at 50% 100%, ${track.color} 0%, ${track.color}66 35%, transparent 75%)`,
                    filter: "blur(10px)",
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* TABLET / MOBILE UPWARD STAGE LIGHT BLOOM */}
        <div
          aria-hidden="true"
          className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div
            className="absolute inset-0 transition-all duration-700 ease-out opacity-65"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${currentActiveTrack.color}88 0%, ${currentActiveTrack.color}22 55%, transparent 80%)`,
              filter: "blur(24px)",
            }}
          />
        </div>

        {/* 6 3D HOLOGRAPHIC EMBLEMS (Positioned directly above each card inside the beam) */}
        <div className="relative z-10 w-full pb-3 sm:pb-4 pointer-events-none">
          <div className="grid grid-cols-6 items-end">
            {IT_CLUB_TRACKS.map((track, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={`emblem-${track.id}`}
                  className="flex flex-col items-center justify-end"
                >
                  {renderTrackEmblem(idx, isActive, track.color)}
                </div>
              );
            })}
          </div>
        </div>

        {/* =============================================================== */}
        {/* 4. TRACK NAVIGATION BAR (Docked directly at the bottom boundary) */}
        {/* =============================================================== */}
        <nav
          aria-label="Track Navigation Selector"
          className="relative z-20 w-full border-t border-white/10 bg-[#07090b]/95 backdrop-blur-md shadow-2xl"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-white/10">
            {IT_CLUB_TRACKS.map((track, idx) => {
              const isActive = idx === activeIndex;
              const isSelected = track.id === activeTrackId;

              return (
                <a
                  key={track.id}
                  href={`#${track.id}`}
                  onClick={(e) => handleTrackClick(e, track, idx)}
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={handleMouseLeave}
                  tabIndex={0}
                  className="group relative flex flex-col justify-between p-3.5 sm:p-4 text-left transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white/40 overflow-hidden"
                  style={{
                    background: isActive
                      ? `linear-gradient(180deg, ${track.color}22 0%, rgba(7,9,11,0.95) 100%)`
                      : "transparent",
                  }}
                >
                  {/* Top Track Accent Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300"
                    style={{
                      backgroundColor: track.color,
                      opacity: isActive ? 1 : 0.35,
                      boxShadow: isActive ? `0 0 10px ${track.color}` : "none",
                    }}
                  />

                  {/* Progress Line During Active Cycle (Mounted only to ensure hydration match) */}
                  {isMounted && isActive && !isPaused && (
                    <div
                      key={`progress-${track.id}-${currentIndex}`}
                      className="tracks-active-progress absolute top-0 left-0 h-[2.5px] bg-white z-10"
                      style={{
                        boxShadow: `0 0 8px #ffffff`,
                      }}
                    />
                  )}

                  {/* Row 1: English Title (Left) & Arabic Title (Right) */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <h3 className="text-xs sm:text-[13px] lg:text-sm font-bold text-white group-hover:text-white transition-colors leading-tight">
                      {track.title}
                    </h3>
                    <span className="arabic text-[11px] sm:text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors text-right shrink-0">
                      {track.arabicTitle}
                    </span>
                  </div>

                  {/* Row 2: Sessions count in track accent color */}
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase mt-1">
                    <span style={{ color: track.color }}>
                      {track.stats.sessions}
                    </span>

                    {/* Subtle active / selected arrow */}
                    <span
                      className="text-xs transition-transform duration-300 group-hover:translate-y-0.5"
                      style={{
                        color:
                          isActive || isSelected ? track.color : "transparent",
                      }}
                    >
                      &darr;
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
