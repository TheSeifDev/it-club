"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
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
      className="relative w-full overflow-hidden bg-[#050708] text-white border-t border-white/10 scroll-mt-20"
    >
      {/* Invisible anchor targets for aliases (e.g. #sr for public relations) */}
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

      {/* Ambient Track-Colored Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-0 w-[600px] h-[600px] rounded-full opacity-15 blur-[120px]"
        style={{
          background: `radial-gradient(circle, ${track.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* =============================================================== */}
        {/* SECTION INTRO BANNER (Page 1 Reference: 01 FIVE WAYS IN)         */}
        {/* =============================================================== */}
        {isFirst && (
          <div className="mb-20 pb-12 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a]">
              <span>01</span>
              <span>•</span>
              <span className="text-white">SIX WAYS IN</span>
              <span className="text-neutral-500">|</span>
              <span className="arabic text-sm text-neutral-400">
                ستة مسارات للمستقبل
              </span>
            </div>

            <p className="mt-4 max-w-2xl text-lg md:text-xl text-neutral-300 font-light leading-relaxed">
              Every track runs throughout the academic year and recruitment
              season. Pick the one that is yours &mdash; or collaborate across
              teams, because nothing here is built in isolation.
            </p>
          </div>
        )}

        {/* =============================================================== */}
        {/* TRACK HEADER & STATS (Page 1-6 Layout Reference)                 */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* Main Title & Description (Col 1-8) */}
          <div className="lg:col-span-8">
            {/* Monospace Eyebrow Tag */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="font-mono text-xs font-bold tracking-[0.2em] uppercase"
                style={{ color: track.color }}
              >
                {track.number} &mdash; {track.tag}
              </span>
            </div>

            {/* Giant Track Title */}
            <h2
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]"
              style={{ color: track.color }}
            >
              {track.title}
            </h2>

            {/* Arabic Title */}
            <h3 className="arabic mt-2 text-2xl sm:text-3xl font-bold text-white/50">
              {track.arabicTitle}
            </h3>

            {/* Description */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg text-neutral-300 leading-relaxed font-light">
              {track.description}
            </p>

            <p className="arabic mt-3 max-w-2xl text-sm sm:text-base text-neutral-400 leading-relaxed">
              {track.arabicDescription}
            </p>
          </div>

          {/* Quick Metrics Strip (Col 9-12) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 p-4 sm:p-5 bg-white/[0.02] border border-white/10">
            <div className="p-3 border border-white/5 bg-black/40">
              <div
                className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: track.color }}
              >
                {track.stats.sessions}
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                Sessions
              </div>
            </div>

            <div className="p-3 border border-white/5 bg-black/40">
              <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {track.stats.speakers}
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                Workshops
              </div>
            </div>

            <div className="p-3 border border-white/5 bg-black/40">
              <div className="font-mono text-lg sm:text-xl font-bold tracking-tight text-neutral-200">
                {track.stats.days}
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                Duration
              </div>
            </div>

            <div className="p-3 border border-white/5 bg-black/40">
              <div
                className="font-mono text-lg sm:text-xl font-bold tracking-tight"
                style={{ color: track.color }}
              >
                {track.stats.time}
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                Status
              </div>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* EDITORIAL BREAKDOWN: THE TERRAIN & WHO IT'S FOR                  */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 pt-8 border-t border-white/10">
          {/* THE TERRAIN: 6 Focus Disciplines (Col 1-8) */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
                THE TERRAIN
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {track.terrain.map((item, idx) => (
                <div
                  key={`${track.id}-terrain-${idx}`}
                  className="group relative p-4 sm:p-5 bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {/* Subtle hover accent line */}
                  <div
                    className="absolute top-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full"
                    style={{ backgroundColor: track.color }}
                  />

                  <h4 className="text-sm sm:text-base font-semibold text-white group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* WHO IT'S FOR: Target Profiles (Col 9-12) */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-6">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
                WHO IT&apos;S FOR
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <ul className="space-y-4">
              {track.whoItsFor.map((persona, idx) => (
                <li
                  key={`${track.id}-persona-${idx}`}
                  className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5"
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 rounded-none shrink-0"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-sm text-neutral-300 font-light leading-snug">
                    {persona}
                  </span>
                </li>
              ))}
            </ul>

            {/* Direct Track Registration Callout */}
            <div className="mt-8 p-5 bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-neutral-400 uppercase">
                <Sparkles size={14} style={{ color: track.color }} />
                <span>MEMBERSHIP INTAKE</span>
              </div>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                Ready to contribute to {track.title}? Join our upcoming cohort
                and access hands-on training and real projects.
              </p>
              <Link
                href="/register"
                className="mt-4 inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase transition-all duration-300 hover:gap-3"
                style={{ color: track.color }}
              >
                <span>APPLY FOR {track.title.toUpperCase()}</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* ON THIS TRACK: TEAM & LEADERSHIP GRID (Reference PDF Pattern)    */}
        {/* =============================================================== */}
        {trackMembers.length > 0 && (
          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase">
                  ON THIS TRACK
                </span>
                <span className="font-mono text-xs text-neutral-500">
                  {trackMembers.length} ACTIVE CONTRIBUTORS
                </span>
              </div>
              <div className="hidden sm:block h-px flex-1 max-w-xs bg-white/10 ml-4" />
            </div>

            {/* Team Portrait Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {trackMembers.map((member) => (
                <div
                  key={`${track.id}-member-${member.id}`}
                  className="group relative flex flex-col bg-white/[0.02] border border-white/10 overflow-hidden transition-all duration-300 hover:border-white/30"
                >
                  {/* Portrait photo with grayscale aesthetic */}
                  <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>

                  {/* Member Info */}
                  <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                    <div>
                      {/* Country badge */}
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-1">
                        <span>{member.countryFlag || "🇪🇬"}</span>
                        <span>{member.countryName || "EGYPT"}</span>
                      </div>

                      <div className="text-sm font-bold text-white tracking-tight group-hover:text-white transition-colors">
                        {member.name}
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] font-mono tracking-wider text-neutral-400 uppercase">
                      {member.role || "MAIN"} &bull; {member.committee || "IT CLUB"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section Bottom Track Navigation CTA */}
            <div className="mt-10 flex items-center justify-between">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase transition-all duration-300"
                style={{ color: track.color }}
              >
                <span>REGISTER FOR {track.title.toUpperCase()}</span>
                <ArrowUpRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>

              <a
                href="#top"
                className="text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-widest"
              >
                &uarr; BACK TO TOP
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
