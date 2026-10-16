"use client";

import React from "react";
import Image from "next/image";
import { Calendar, MapPin, Sparkles, ArrowRight, Layers } from "lucide-react";
import { IT_CLUB_EVENTS, type EventItem } from "@/src/data/events";

interface EventsHeroProps {
  onSelectEvent: (event: EventItem) => void;
}

export default function EventsHero({ onSelectEvent }: EventsHeroProps) {
  // Find primary featured event
  const featuredEvent =
    IT_CLUB_EVENTS.find((e) => e.id === "it-club-hackathon-2026") ||
    IT_CLUB_EVENTS[0];

  return (
    <section
      aria-label="IT Club Events Archive Hero"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10 select-none pt-12 pb-16 md:pt-16 md:pb-20"
    >
      {/* Background Stage Asset with Dark Vignette */}
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-transparent to-[#050708]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_30%,_#050708_80%)]" />
      </div>

      {/* Volumetric Radial Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] opacity-25 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(53,217,138,0.5) 0%, rgba(24,200,237,0.25) 50%, transparent 80%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* =============================================================== */}
        {/* TOP EDITORIAL HEADLINE & INTRODUCTION                            */}
        {/* =============================================================== */}
        <div className="max-w-3xl mb-12">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-4">
            <span>01</span>
            <span>&bull;</span>
            <span className="text-white">COMMUNITY ARCHIVES</span>
            <span className="text-neutral-500">|</span>
            <span className="arabic text-sm text-neutral-400">
              أرشيف فعاليات نادي تكنولوجيا المعلومات
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.05] text-white">
            Built, hosted,
            <br />
            <span className="bg-gradient-to-r from-[#35d98a] via-[#18c8ed] to-[#9b7cff] bg-clip-text text-transparent">
              and lived together.
            </span>
          </h1>

          {/* Editorial Description */}
          <p className="mt-5 text-base sm:text-lg text-neutral-300 leading-relaxed font-light max-w-2xl">
            A permanent archive of the hackathons, technical bootcamps, and
            external summits organized by IT Club or attended by our student
            delegations across Egypt.
          </p>

          <p className="arabic mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
            توثيق رسمي وشامل لجميع الفعاليات، المعسكرات البرمجية، وورش العمل
            التي نظّمها النادي أو شارك فيها أعضاؤه في مختلف المحافل التقنية.
          </p>
        </div>

        {/* =============================================================== */}
        {/* FEATURED EVENT HIGHLIGHT CARD                                    */}
        {/* =============================================================== */}
        {featuredEvent && (
          <div className="relative overflow-hidden bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all duration-300 mb-12">
            {/* Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{ backgroundColor: featuredEvent.accentColor }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
              {/* Left Column: Event Metadata & Content */}
              <div className="lg:col-span-8 flex flex-col justify-between">
                <div>
                  {/* Category & Status Badges */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-3">
                    <span
                      className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase border"
                      style={{
                        color: featuredEvent.accentColor,
                        borderColor: `${featuredEvent.accentColor}40`,
                        backgroundColor: `${featuredEvent.accentColor}12`,
                      }}
                    >
                      {featuredEvent.categoryLabel}
                    </span>

                    <span className="px-2.5 py-1 text-[10px] font-mono font-medium tracking-wider text-neutral-300 bg-white/5 border border-white/10">
                      FEATURED ARCHIVE
                    </span>
                  </div>

                  {/* Title & Arabic Title */}
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                    {featuredEvent.title}
                  </h2>
                  <h3 className="arabic text-lg sm:text-xl font-medium text-white/50 mb-4">
                    {featuredEvent.arabicTitle}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed max-w-2xl mb-6">
                    {featuredEvent.shortDescription}
                  </p>
                </div>

                {/* Event Location & Date Strip */}
                <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-neutral-400 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: featuredEvent.accentColor }} />
                    <span className="text-neutral-200">{featuredEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: featuredEvent.accentColor }} />
                    <span>{featuredEvent.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers size={14} style={{ color: featuredEvent.accentColor }} />
                    <span className="text-[#35d98a]">Role: {featuredEvent.role}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual CTA Box */}
              <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-8">
                <button
                  type="button"
                  onClick={() => onSelectEvent(featuredEvent)}
                  className="group w-full lg:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/40 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
                >
                  <Sparkles size={14} style={{ color: featuredEvent.accentColor }} />
                  <span>Inspect Event Details</span>
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>

                <p className="mt-3 text-[11px] font-mono text-neutral-400">
                  Click to view agenda highlights & role breakdown
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* STATS METRIC BAR                                                 */}
        {/* =============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-white/[0.02] border border-white/10">
          <div className="p-3 border border-white/5 bg-black/40">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#35d98a]">
              7
            </div>
            <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
              Documented Events
            </div>
          </div>

          <div className="p-3 border border-white/5 bg-black/40">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
              6
            </div>
            <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
              Specialized Tracks
            </div>
          </div>

          <div className="p-3 border border-white/5 bg-black/40">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#18c8ed]">
              500+
            </div>
            <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
              Students Reached
            </div>
          </div>

          <div className="p-3 border border-white/5 bg-black/40">
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#eaff00]">
              BATU
            </div>
            <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
              Host University
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
