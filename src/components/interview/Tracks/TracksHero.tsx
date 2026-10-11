"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Megaphone,
  Share2,
  Calendar,
  Code2,
  FlaskConical,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { IT_CLUB_TRACKS, type TrackDefinition } from "./tracks-data";

interface TracksHeroProps {
  activeTrackId?: string;
  onSelectTrack?: (trackId: string) => void;
}

export default function TracksHero({
  activeTrackId,
  onSelectTrack,
}: TracksHeroProps) {
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);

  const getTrackIcon = (iconName: TrackDefinition["iconName"], size = 20) => {
    switch (iconName) {
      case "users":
        return <Users size={size} />;
      case "megaphone":
        return <Megaphone size={size} />;
      case "share2":
        return <Share2 size={size} />;
      case "calendar":
        return <Calendar size={size} />;
      case "code2":
        return <Code2 size={size} />;
      case "flask":
        return <FlaskConical size={size} />;
      default:
        return <Sparkles size={size} />;
    }
  };

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      onSelectTrack?.(id);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        // Update URL hash without instant jump
        window.history.pushState(null, "", `#${id}`);
      }
    },
    [onSelectTrack]
  );

  return (
    <section
      aria-label="IT Club Tracks Hero"
      className="relative w-full overflow-hidden bg-[#050708] text-white select-none border-b border-white/10"
    >
      {/* ================================================================= */}
      {/* 1. CINEMATIC STAGE BACKGROUND & PROCEDURAL MIST LAYERS             */}
      {/* ================================================================= */}

      {/* Deep Stage Background Asset */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <Image
          src="/spotlight-stage.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top opacity-45 mix-blend-screen scale-[1.03]"
        />
        {/* Dark stage vignette & gradient falls */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-transparent to-[#050708]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_30%,_#050708_85%)]" />
      </div>

      {/* Layer A: Atmospheric Mist Layer 1 (Slow Drift) */}
      <div
        aria-hidden="true"
        className="tracks-mist-layer-1 pointer-events-none absolute -inset-x-1/2 top-0 h-full opacity-35 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.12) 0%, transparent 60%), radial-gradient(circle at 75% 65%, rgba(66,232,149,0.08) 0%, transparent 55%)",
          filter: "blur(40px)",
        }}
      />

      {/* Layer B: Atmospheric Mist Layer 2 (Cross Drift) */}
      <div
        aria-hidden="true"
        className="tracks-mist-layer-2 pointer-events-none absolute -inset-x-1/2 top-0 h-full opacity-30 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 65% 35%, rgba(24,200,237,0.1) 0%, transparent 55%), radial-gradient(circle at 25% 70%, rgba(155,124,255,0.08) 0%, transparent 60%)",
          filter: "blur(50px)",
        }}
      />

      {/* ================================================================= */}
      {/* 2. LAYERED CONVERGING VOLUMETRIC SPOTLIGHT BEAMS                  */}
      {/* ================================================================= */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      >
        {/* Overhead Apex Stage Bloom */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[120px] rounded-[100%] opacity-40 blur-3xl pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(53,217,138,0.3) 45%, transparent 75%)",
          }}
        />

        {/* 6 Layered Spotlight Beams targeting the 6 track positions below */}
        {IT_CLUB_TRACKS.map((track, index) => {
          const isHovered = hoveredTrackId === track.id;
          const hasHoveredOther =
            hoveredTrackId !== null && hoveredTrackId !== track.id;
          const isActive = activeTrackId === track.id;

          // Horizontal center distribution for 6 beams at bottom (0% to 100%)
          // Index 0: ~8.3%, 1: ~25%, 2: ~41.6%, 3: ~58.3%, 4: ~75%, 5: ~91.6%
          const centerPercent = (index * 100) / 6 + 100 / 12;
          const bottomSpan = 14; // width percentage at bottom
          const bottomLeft = Math.max(0, centerPercent - bottomSpan / 2);
          const bottomRight = Math.min(100, centerPercent + bottomSpan / 2);

          // Apex convergence overhead with slight natural angle distribution
          const apexCenter = 44 + index * 2.4;
          const apexWidth = 3.5;
          const apexLeft = apexCenter - apexWidth / 2;
          const apexRight = apexCenter + apexWidth / 2;

          const clipPolygon = `polygon(${apexLeft}% 0%, ${apexRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`;

          // Opacity calculations:
          let opacity = 0.42;
          if (isHovered) opacity = 0.95;
          else if (isActive) opacity = 0.75;
          else if (hasHoveredOther) opacity = 0.18;

          return (
            <React.Fragment key={`beam-group-${track.id}`}>
              {/* Main Volumetric Light Cone */}
              <div
                className="absolute inset-0 transition-all duration-500 ease-out pointer-events-none"
                style={{
                  clipPath: clipPolygon,
                  opacity,
                  filter: isHovered
                    ? "blur(6px) brightness(1.35)"
                    : "blur(12px) brightness(1.05)",
                  mixBlendMode: "screen",
                  background: `linear-gradient(180deg, rgba(255,255,255,0.7) 0%, ${track.color}cc 18%, ${track.color}66 55%, ${track.color}20 88%, transparent 100%)`,
                }}
              />

              {/* Intense Inner Core Filament for Stage Realism */}
              <div
                className="absolute inset-0 transition-opacity duration-500 ease-out pointer-events-none"
                style={{
                  clipPath: `polygon(${apexLeft + 0.8}% 0%, ${apexRight - 0.8}% 0%, ${bottomRight - 3}% 100%, ${bottomLeft + 3}% 100%)`,
                  opacity: isHovered ? 0.8 : hasHoveredOther ? 0.08 : 0.28,
                  filter: "blur(4px)",
                  mixBlendMode: "screen",
                  background: `linear-gradient(180deg, #ffffff 0%, ${track.color}ee 25%, ${track.color}44 75%, transparent 100%)`,
                }}
              />

              {/* Ground Pool of Light above the Track Selector Button */}
              <div
                className="absolute bottom-0 h-32 transition-all duration-500 ease-out pointer-events-none"
                style={{
                  left: `${bottomLeft}%`,
                  width: `${bottomSpan}%`,
                  opacity: isHovered ? 0.9 : isActive ? 0.65 : 0.25,
                  background: `radial-gradient(ellipse at 50% 100%, ${track.color}88 0%, ${track.color}22 50%, transparent 80%)`,
                  filter: "blur(14px)",
                }}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* 3. HERO CONTENT: EDITORIAL HEADLINE & ARABIC TYPOGRAPHY           */}
      {/* ================================================================= */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28 text-center flex flex-col items-center">
        {/* Top Status Pill Banner */}
        <Link
          href="/register"
          className="group inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-xs font-medium text-neutral-300 hover:text-white hover:border-[#35d98a]/50 hover:bg-[#35d98a]/10 transition-all duration-300 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35d98a] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#35d98a]" />
          </span>
          <span className="tracking-wide">
            RECRUITMENT OPEN &mdash; EXPLORE THE 6 SPECIALIZED TRACKS
          </span>
          <ArrowRight
            size={13}
            className="text-neutral-400 group-hover:text-[#35d98a] transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>

        {/* Small Arabic Eyebrow above headline (Page 1 Reference) */}
        <p className="arabic text-sm md:text-base lg:text-lg font-medium text-neutral-400/90 tracking-wide mb-3">
          مسارات نادي تكنولوجيا المعلومات
        </p>

        {/* Large Centered 2-Line Headline */}
        <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] leading-[1.05] text-white">
          Six tracks.
          <br />
          <span className="text-white">One community, </span>
          <span className="bg-gradient-to-r from-[#35d98a] via-[#ff3ca7] via-[#eaff00] via-[#ffab18] via-[#18c8ed] to-[#9b7cff] bg-clip-text text-transparent font-black drop-shadow-[0_0_35px_rgba(24,200,237,0.3)]">
            split six ways.
          </span>
        </h1>

        {/* Supporting Editorial Description */}
        <p className="mt-6 max-w-2xl text-base md:text-lg text-neutral-300 leading-relaxed font-normal">
          Six specialized tracks, one unified community. Each track represents a
          dedicated craft inside IT Club &mdash; from software engineering and
          applied research to visual media, operations, and people leadership.
        </p>

        <p className="arabic mt-3 max-w-2xl text-sm md:text-base text-neutral-400 leading-relaxed">
          ستة مسارات ومجتمع واحد. كل مسار يمثل طريقة مختلفة للمساهمة والإبداع
          والتطور داخل النادي، بدايةً من البرمجيات والبحث وصولًا إلى الإعلام
          والتنظيم وإدارة الأفراد.
        </p>
      </div>

      {/* ================================================================= */}
      {/* 4. HORIZONTAL TRACK SELECTOR STRIP (Page 1 Bottom Reference)       */}
      {/* ================================================================= */}
      <div className="relative z-20 w-full bg-[#050708]/85 backdrop-blur-md border-t border-white/10">
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Track Navigation Strip"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-white/10"
          >
            {IT_CLUB_TRACKS.map((track) => {
              const isHovered = hoveredTrackId === track.id;
              const isActive = activeTrackId === track.id;

              return (
                <a
                  key={track.id}
                  href={`#${track.id}`}
                  onClick={(e) => handleTrackClick(e, track.id)}
                  onMouseEnter={() => setHoveredTrackId(track.id)}
                  onMouseLeave={() => setHoveredTrackId(null)}
                  onFocus={() => setHoveredTrackId(track.id)}
                  onBlur={() => setHoveredTrackId(null)}
                  tabIndex={0}
                  className="group relative flex flex-col justify-between p-4 sm:p-5 text-left transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-inset focus:ring-white/40 overflow-hidden"
                  style={{
                    backgroundColor: isHovered
                      ? `${track.color}10`
                      : isActive
                      ? `${track.color}08`
                      : "transparent",
                  }}
                >
                  {/* Top Animated Accent Border Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300"
                    style={{
                      backgroundColor: track.color,
                      opacity: isHovered || isActive ? 1 : 0.4,
                      transform: isHovered ? "scaleY(1.4)" : "scaleY(1)",
                    }}
                  />

                  {/* Header Row: Icon & Status indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className="p-1.5 rounded-sm transition-all duration-300"
                      style={{
                        color: track.color,
                        backgroundColor: isHovered
                          ? `${track.color}25`
                          : `${track.color}12`,
                        transform: isHovered ? "scale(1.1) rotate(-3deg)" : "none",
                      }}
                    >
                      {getTrackIcon(track.iconName, 18)}
                    </div>

                    <span
                      className="font-mono text-[10px] font-bold tracking-widest uppercase transition-colors duration-300"
                      style={{
                        color: isHovered || isActive ? track.color : "#737a82",
                      }}
                    >
                      {track.number}
                    </span>
                  </div>

                  {/* Track Title */}
                  <div>
                    <h3
                      className="text-sm sm:text-base font-bold tracking-tight text-white transition-colors duration-300 leading-snug group-hover:text-white"
                      style={{
                        color: isHovered ? "#ffffff" : undefined,
                        textShadow: isHovered
                          ? `0 0 16px ${track.color}88`
                          : "none",
                      }}
                    >
                      {track.title}
                    </h3>

                    {/* Arabic Subtitle & Session count */}
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="arabic text-neutral-400 group-hover:text-neutral-200 transition-colors text-[11px]">
                        {track.arabicTitle}
                      </span>
                      <span
                        className="font-mono text-[9px] tracking-wider uppercase opacity-75 font-semibold"
                        style={{ color: track.color }}
                      >
                        {track.stats.sessions}
                      </span>
                    </div>
                  </div>

                  {/* Active Indicator Triangle / Glow Bar */}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] transition-all"
                      style={{ backgroundColor: track.color }}
                    />
                  )}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ================================================================= */}
      {/* STYLES FOR CINEMATIC MIST ANIMATIONS & REDUCED MOTION             */}
      {/* ================================================================= */}
      <style jsx>{`
        @keyframes mistDrift1 {
          0% {
            transform: translateX(-8%) scale(1);
            opacity: 0.28;
          }
          50% {
            transform: translateX(6%) scale(1.08);
            opacity: 0.42;
          }
          100% {
            transform: translateX(-8%) scale(1);
            opacity: 0.28;
          }
        }

        @keyframes mistDrift2 {
          0% {
            transform: translateX(8%) scale(1.04);
            opacity: 0.35;
          }
          50% {
            transform: translateX(-6%) scale(0.96);
            opacity: 0.22;
          }
          100% {
            transform: translateX(8%) scale(1.04);
            opacity: 0.35;
          }
        }

        .tracks-mist-layer-1 {
          animation: mistDrift1 32s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .tracks-mist-layer-2 {
          animation: mistDrift2 42s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .tracks-mist-layer-1,
          .tracks-mist-layer-2 {
            animation: none !important;
            transform: none !important;
            opacity: 0.3 !important;
          }
        }
      `}</style>
    </section>
  );
}
