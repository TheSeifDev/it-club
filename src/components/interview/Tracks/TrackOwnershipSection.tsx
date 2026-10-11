"use client";

import React from "react";
import Link from "next/link";
import { IT_CLUB_TRACKS } from "./tracks-data";

export default function TrackOwnershipSection() {
  const scrollToTrack = (trackId?: string) => {
    if (!trackId) return;
    const el = document.getElementById(trackId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${trackId}`);
    }
  };

  return (
    <section
      id="own-a-track"
      aria-label="Own a Track Sponsorship Section"
      className="relative w-full overflow-hidden bg-[#050708] text-white pt-20 md:pt-28 pb-24 md:pb-32 border-t border-white/5"
    >
      <div className="relative tracks-content-container">
        {/* =============================================================== */}
        {/* 1. TOP SECTION LABEL & HORIZONTAL DIVIDER HAIRLINE              */}
        {/* =============================================================== */}
        <div className="flex items-center gap-4 mb-12 sm:mb-14">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold text-[#6366f1] tracking-wider">
              02
            </span>
            <span className="font-mono text-xs font-bold tracking-[0.2em] text-white uppercase">
              OWN A TRACK
            </span>
            <span className="arabic text-sm text-neutral-400 font-medium">
              رعاية مسار
            </span>
          </div>

          {/* Thin horizontal line stretching to the right boundary */}
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* =============================================================== */}
        {/* 2. HEADLINE (3 LINES, LEFT) & EXPLANATORY TEXT (RIGHT)          */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14 sm:mb-16">
          {/* Left: 3-line Large Display Headline */}
          <div className="lg:col-span-7">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.04] text-white">
              Own a track.
              <br />
              Own the
              <br />
              conversation.
            </h2>
          </div>

          {/* Right: Supporting Description Text */}
          <div className="lg:col-span-5 lg:pb-3">
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-md">
              A track sponsor names one of these six for the full season and
              leads every session and initiative in it. Six exist. Find the one built for you.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 3. ROW OF SIX REAL IT CLUB TRACK SPONSORSHIP CARDS               */}
        {/* =============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
          {IT_CLUB_TRACKS.map((track) => (
            <a
              key={`ownership-${track.id}`}
              href={`#${track.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToTrack(track.id);
              }}
              className="group relative flex flex-col justify-between p-4 bg-[#0a0c0e] border border-white/10 hover:border-white/25 transition-all duration-300 overflow-hidden text-left cursor-pointer"
              style={{
                background: `linear-gradient(180deg, ${track.color}0a 0%, rgba(10,12,14,0.98) 100%)`,
              }}
            >
              {/* Thin Colored Top Border */}
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300"
                style={{ backgroundColor: track.color }}
              />

              {/* Colored Rectangular Visual Element with Glowing Wash */}
              <div className="relative w-full h-14 sm:h-16 overflow-hidden rounded-[2px] mb-5 bg-black/60 border border-white/5">
                <div
                  className="absolute inset-0 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(180deg, ${track.color}66 0%, ${track.color}22 55%, transparent 100%)`,
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 opacity-30 blur-sm"
                  style={{ background: track.color }}
                />
                <div className="absolute top-0 inset-x-0 h-px bg-white/30" />
              </div>

              {/* Card Details: Title & Status */}
              <div>
                <h4 className="text-xs sm:text-[13px] font-bold text-white tracking-tight group-hover:text-white transition-colors leading-tight">
                  {track.title}
                </h4>
                <span className="arabic text-[11px] text-neutral-400 group-hover:text-neutral-300 transition-colors block mt-0.5">
                  {track.arabicTitle}
                </span>
                <div
                  className="mt-2 text-[10px] font-mono font-bold tracking-widest uppercase"
                  style={{ color: track.color }}
                >
                  OPEN
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* =============================================================== */}
        {/* 4. GREEN CTA BUTTON & ADJACENT SUPPORTING TEXT                  */}
        {/* =============================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 pt-2">
          <Link
            href="/sponsors"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-[#00e599] hover:bg-[#35f0ab] text-[#050708] font-bold text-xs sm:text-sm tracking-wide transition-colors duration-200 rounded-none shrink-0"
          >
            Become a track sponsor
          </Link>

          <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-lg">
            Includes the track&apos;s name, its colour across every channel, and a
            speaking slot inside it.
          </p>
        </div>

        {/* =============================================================== */}
        {/* 5. BOTTOM DIVIDER HAIRLINE                                       */}
        {/* =============================================================== */}
        <div className="border-t border-white/10 mt-20 md:mt-24" />
      </div>
    </section>
  );
}
