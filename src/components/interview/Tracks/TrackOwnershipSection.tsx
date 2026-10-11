"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { IT_CLUB_TRACKS } from "./tracks-data";

export default function TrackOwnershipSection() {
  const scrollToTrack = (trackId: string) => {
    const el = document.getElementById(trackId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${trackId}`);
    }
  };

  return (
    <section
      aria-label="Track Ownership and Application Section"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-t border-white/10 py-20 md:py-28"
    >
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-20 blur-[140px]"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(53,217,138,0.4) 0%, rgba(24,200,237,0.2) 40%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* =============================================================== */}
        {/* HEADER & HEADLINE (Page 7 Reference: 02 OWN A TRACK)             */}
        {/* =============================================================== */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-6">
          <span>02</span>
          <span>•</span>
          <span className="text-white">OWN A TRACK</span>
          <span className="text-neutral-500">|</span>
          <span className="arabic text-sm text-neutral-400">رحلة مسار</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-8">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-[-0.03em] leading-[1.05] text-white">
              Own a track.
              <br />
              Own the conversation.
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed">
              Join one of our six dedicated technical and operational tracks for
              the full academic season and lead every project in it. Six exist.
              Find the one built for you.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 6 COMPACT COLORED TRACK PANELS (Page 7 Reference)                */}
        {/* =============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-12">
          {IT_CLUB_TRACKS.map((track) => (
            <button
              key={`ownership-${track.id}`}
              type="button"
              onClick={() => scrollToTrack(track.id)}
              className="group relative flex flex-col justify-between p-4 sm:p-5 bg-white/[0.02] border border-white/10 hover:border-white/30 text-left transition-all duration-300 cursor-pointer overflow-hidden focus:outline-none focus:ring-1 focus:ring-white/40"
              style={{
                background: `linear-gradient(180deg, ${track.color}0a 0%, rgba(5,7,8,0.9) 100%)`,
              }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] transition-all duration-300"
                style={{ backgroundColor: track.color }}
              />

              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${track.color}20 0%, transparent 70%)`,
                }}
              />

              {/* Track Title */}
              <div className="relative z-10 mb-6">
                <span className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase block mb-1">
                  {track.number}
                </span>
                <span className="text-sm sm:text-base font-bold text-white group-hover:text-white transition-colors block leading-snug">
                  {track.title}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono">
                <span
                  className="font-bold tracking-wider uppercase"
                  style={{ color: track.color }}
                >
                  OPEN
                </span>
                <span className="text-neutral-500 group-hover:text-neutral-300 transition-colors">
                  &darr;
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* =============================================================== */}
        {/* PRIMARY CTA BAR                                                  */}
        {/* =============================================================== */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t border-white/10">
          <Link
            href="/register"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#35d98a] hover:bg-[#40f09b] text-[#050708] font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_30px_rgba(53,217,138,0.3)] hover:shadow-[0_0_45px_rgba(53,217,138,0.5)] focus:outline-none focus:ring-2 focus:ring-[#35d98a]"
          >
            <Sparkles size={16} />
            <span>Register for Recruitment</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>

          <p className="text-xs sm:text-sm text-neutral-400 font-light max-w-md">
            Official recruitment is open for all university students. Includes
            access to technical mentorship, workshops, and cross-track projects.
          </p>
        </div>
      </div>
    </section>
  );
}
