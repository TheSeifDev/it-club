"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { type TrackDefinition } from "./tracks-data";
import { teamMembers, type TeamMember } from "../committee-data";

interface TrackDetailSectionProps {
  track: TrackDefinition;
  isFirst?: boolean;
}

export default function TrackDetailSection({
  track,
  isFirst = false,
}: TrackDetailSectionProps) {
  // Find verified team members assigned to this track
  const trackMembers: TeamMember[] = track.memberIds
    .map((id) => teamMembers.find((m) => m.id === id))
    .filter((m): m is TeamMember => !!m);

  return (
    <section
      id={track.id}
      aria-label={`${track.title} Track Section`}
      className="relative w-full overflow-hidden bg-[#050708] text-white border-t border-white/5 scroll-mt-16 py-20 md:py-28 lg:py-32"
    >
      {/* Invisible anchor targets for aliases (e.g. #sr for public relations, #rd for rnd) */}
      {track.anchorIds
        .filter((alias) => alias !== track.id)
        .map((alias) => (
          <span
            key={`alias-${alias}`}
            id={alias}
            className="absolute top-0 -mt-20"
            aria-hidden="true"
          />
        ))}

      {/* Ambient Overhead Track-Colored Glow (Exact Reference Radial Wash) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[360px] opacity-15 blur-[100px]"
        style={{
          background: `radial-gradient(ellipse 70% 280px at 50% 0%, ${track.color} 0%, transparent 75%)`,
        }}
      />

      <div className="tracks-content-container">
        {/* =============================================================== */}
        {/* 1. TRACK HEADER & STATS (Exact Reference Match)                 */}
        {/* =============================================================== */}
        <div className="mb-10">
          {/* Eyebrow Tag in Track Color */}
          <div className="mb-2.5">
            <span
              className="font-mono text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: track.color }}
            >
              {track.tag}
            </span>
          </div>

          {/* Giant Track Title */}
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
            style={{ color: track.color }}
          >
            {track.title}
          </h2>

          {/* Arabic Subtitle */}
          <h3 className="arabic mt-2 text-xl sm:text-2xl font-bold text-white/80">
            {track.arabicTitle}
          </h3>

          {/* Description Paragraph & 2x2 Stats Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-8">
            {/* Description (Col 1-8 / ~65%) */}
            <div className="lg:col-span-8">
              <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed max-w-3xl">
                {track.description}
              </p>

              <p className="arabic mt-3 text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-3xl">
                {track.arabicDescription}
              </p>
            </div>

            {/* Quick Metrics 2x2 Grid (Col 9-12 / ~35%) with Hairline Divider */}
            <div className="lg:col-span-4 border-l border-white/10 pl-6 sm:pl-8 lg:pl-10">
              <div className="grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-5">
                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {track.stats.sessions}
                  </div>
                  <div className="font-mono text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mt-0.5">
                    SESSIONS
                  </div>
                </div>

                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {track.stats.speakers}
                  </div>
                  <div className="font-mono text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mt-0.5">
                    WORKSHOPS
                  </div>
                </div>

                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {track.stats.days}
                  </div>
                  <div className="font-mono text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mt-0.5">
                    DURATION
                  </div>
                </div>

                <div>
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {track.stats.time}
                  </div>
                  <div className="font-mono text-[10px] font-semibold tracking-widest text-neutral-500 uppercase mt-0.5">
                    STATUS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 2. HORIZONTAL DIVIDER HAIRLINE                                   */}
        {/* =============================================================== */}
        <div className="border-t border-white/10 mt-12 mb-10" />

        {/* =============================================================== */}
        {/* 3. THE TERRAIN & WHO IT'S FOR                                    */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* THE TERRAIN: 2-Column Grid (Col 1-8 / ~65%) */}
          <div className="lg:col-span-8">
            <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-6">
              THE TERRAIN
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7">
              {track.terrain.map((item, idx) => (
                <div
                  key={`${track.id}-terrain-${idx}`}
                  className="group p-2.5 -m-2.5 rounded transition-colors duration-200 hover:bg-white/[0.04]"
                >
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* WHO IT'S FOR: Bulleted Persona List (Col 9-12 / ~35%) */}
          <div className="lg:col-span-4">
            <div className="font-mono text-[10px] tracking-[0.2em] text-neutral-500 uppercase mb-6">
              WHO IT&apos;S FOR
            </div>

            <ul className="space-y-4">
              {track.whoItsFor.map((persona, idx) => (
                <li
                  key={`${track.id}-persona-${idx}`}
                  className="flex items-start gap-3"
                >
                  <span
                    className="w-1.5 h-1.5 shrink-0 mt-1.5"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-xs sm:text-sm text-neutral-300 font-light leading-snug">
                    {persona}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 4. SPONSOR / PARTNER BOX ("BROUGHT TO YOU BY")                   */}
        {/* =============================================================== */}
        <div
          className="mt-12 mb-12 p-6 sm:p-8 lg:p-10 bg-black/60 border backdrop-blur-sm"
          style={{ borderColor: track.color }}
        >
          <div className="flex flex-col gap-6">
            {/* Section Eyebrow */}
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase"
                style={{ color: track.color }}
              >
                BROUGHT TO YOU BY
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Partner Logos: Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
              {/* CREATIVA Hub */}
              <a
                href="https://creativa.gov.eg/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit CREATIVA Hub official website"
                aria-label="CREATIVA Hub official website (opens in a new tab)"
                className="group relative flex items-center justify-center p-5 sm:p-6 bg-white/[0.97] hover:bg-white border border-white/20 hover:border-white/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e599] focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[92px] sm:min-h-[104px]"
              >
                <div className="relative h-12 sm:h-14 w-full max-w-[170px] sm:max-w-[190px] flex items-center justify-center">
                  <Image
                    src="/images/partners/creativa-logo.webp"
                    alt="CREATIVA Hub official logo"
                    width={600}
                    height={535}
                    className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                    priority={isFirst}
                  />
                </div>
              </a>

              {/* VentureX */}
              <a
                href="https://www.theventurex.com/"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit VentureX official website"
                aria-label="VentureX official website (opens in a new tab)"
                className="group relative flex items-center justify-center p-5 sm:p-6 bg-white/[0.97] hover:bg-white border border-white/20 hover:border-white/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e599] focus-visible:ring-offset-2 focus-visible:ring-offset-black min-h-[92px] sm:min-h-[104px]"
              >
                <div className="relative h-8 sm:h-9 w-full max-w-[210px] sm:max-w-[240px] flex items-center justify-center">
                  <Image
                    src="/images/partners/venturex-logo.webp"
                    alt="VentureX official logo"
                    width={577}
                    height={53}
                    className="max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                    priority={isFirst}
                  />
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 5. ON THIS TRACK: MEMBER ROSTER GRID (6 COLUMNS)                 */}
        {/* =============================================================== */}
        {trackMembers.length > 0 && (
          <div className="mt-12">
            {/* Eyebrow Header */}
            <div className="flex items-center gap-2 mb-6 font-mono text-[10px] tracking-[0.2em] uppercase">
              <span className="text-neutral-500">ON THIS TRACK</span>
              <span style={{ color: track.color }} className="font-bold">
                {trackMembers.length} ANNOUNCED SO FAR
              </span>
            </div>

            {/* 6-Column Responsive Editorial Portrait Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {trackMembers.map((member) => (
                <div
                  key={`${track.id}-member-${member.id}`}
                  className="group relative flex flex-col overflow-hidden bg-neutral-900 border border-white/5 hover:border-white/20 transition-all duration-300"
                >
                  {/* Editorial grayscale portrait with 4:5 aspect ratio */}
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                    {/* Bottom info pinned neatly to the bottom of the portrait */}
                    <div className="absolute bottom-0 inset-x-0 p-3 flex flex-col justify-end">
                      {/* Country */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-400 uppercase tracking-widest mb-0.5">
                        <span>{member.countryFlag || "🇪🇬"}</span>
                        <span>{member.countryName || "EGYPT"}</span>
                      </div>

                      {/* Name */}
                      <div className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight line-clamp-1">
                        {member.name}
                      </div>

                      {/* Role & Committee */}
                      <div className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase mt-0.5 line-clamp-1">
                        {member.role || "MAIN"} • {member.committee || "IT CLUB"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Track Bottom CTA Button: Matching Reference Screenshot 3 & 1 */}
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 border text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 hover:brightness-110"
                style={{
                  borderColor: track.color,
                  color: track.color,
                  backgroundColor: `${track.color}10`,
                }}
              >
                <span>See {track.title} on the agenda</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
