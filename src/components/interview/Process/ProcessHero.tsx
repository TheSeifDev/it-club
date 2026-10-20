"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Search,
  MessageSquare,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { PROCESS_STAGES } from "./process-data";

const STAGE_ICONS = [FileText, Search, MessageSquare, CheckCircle, TrendingUp];

const SHORT_STAGE_NAMES: Record<string, string> = {
  application: "Application",
  review: "Initial Review",
  interview: "Interview",
  decision: "Final Decision",
  grow: "Join & Grow",
};

export default function ProcessHero() {
  return (
    <section
      aria-label="Recruitment Process Hero"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10"
      style={{ paddingTop: "6.5rem", paddingBottom: "0" }}
    >
      {/* ── FULL-WIDTH BACKGROUND ARTWORK: Doorway & Radiant Light Rays ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <Image
          src="/images/process-hero-bg.webp"
          alt="Futuristic luminous doorway and light rays representing the IT Club recruitment journey"
          fill
          priority
          className="object-cover object-right md:object-[82%_center]"
          sizes="100vw"
        />

        {/* Subtle radial ambient bloom on top-left over heading */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 w-[600px] h-[500px] opacity-[0.16] blur-[140px]"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, #00e599 0%, #18c8ed 40%, transparent 75%)",
          }}
        />

        {/* Dark gradient overlay: pure dark on left for text legibility, seamlessly revealing the doorway artwork on the right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #050708 0%, #050708 30%, rgba(5,7,8,0.85) 48%, rgba(5,7,8,0.35) 70%, rgba(5,7,8,0.05) 88%, transparent 100%)",
          }}
        />

        {/* Top subtle vignette to blend with fixed navbar */}
        <div
          className="absolute inset-x-0 top-0 h-24"
          style={{
            background:
              "linear-gradient(to bottom, #050708 0%, rgba(5,7,8,0.5) 60%, transparent 100%)",
          }}
        />

        {/* Bottom smooth fade to transition cleanly into the 5-stage progress strip */}
        <div
          className="absolute inset-x-0 bottom-0 h-32"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, rgba(5,7,8,0.7) 60%, #050708 100%)",
          }}
        />
      </div>

      {/* ── HERO CONTENT ── */}
      <div className="relative tracks-content-container">
        {/* Eyebrow */}
        <div className="mb-4">
          <span className="font-mono text-[11px] font-bold tracking-[0.22em] uppercase text-[#00e599]">
            THE JOURNEY
          </span>
        </div>

        {/* 2-col Grid: Left Text Column / Right Atmospheric Foreground Accents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[380px] sm:min-h-[440px] lg:min-h-[490px]">
          {/* LEFT COLUMN — Typography & CTA */}
          <div className="lg:col-span-7 z-10 pb-12 lg:pb-16 pt-2 max-w-xl">
            <h1 className="text-[2.6rem] sm:text-[3.2rem] md:text-[3.8rem] lg:text-[4.3rem] font-black tracking-[-0.03em] leading-[1.03] text-white">
              From Application
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#c084fc]">
                to Impact
              </span>
            </h1>

            <p className="arabic mt-3 text-lg sm:text-xl font-semibold text-white/80 leading-relaxed">
              من التقديم إلى التأثير
            </p>

            <p className="mt-5 text-sm sm:text-[15px] text-[#8f9ea0] leading-[1.75] max-w-md">
              A clear, fair, and transparent journey designed to help us discover
              passionate minds and build the next generation of IT Club leaders.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00e599] text-[#050708] font-bold text-sm tracking-wide uppercase hover:bg-[#3bf5ad] transition-all duration-200 shadow-[0_0_25px_rgba(0,229,153,0.3)] hover:shadow-[0_0_40px_rgba(0,229,153,0.5)]"
                style={{ borderRadius: 0 }}
              >
                Register Now
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN — Floating pills alongside background stairs + stylized annotation */}
          <div className="hidden lg:block lg:col-span-5 relative h-full min-h-[460px] pointer-events-none">
            {/* Floating stage badge pills positioned along the ascending light path */}
            {PROCESS_STAGES.map((stage, i) => {
              const Icon = STAGE_ICONS[i];
              const positions = [
                { bottom: "20%", right: "74%" },
                { bottom: "35%", right: "56%" },
                { bottom: "50%", right: "40%" },
                { bottom: "65%", right: "24%" },
                { top: "12%", right: "10%" },
              ];
              const pos = positions[i] || { top: "20%", right: "20%" };
              return (
                <div
                  key={stage.id}
                  className="absolute flex items-center gap-1.5 px-2.5 py-1.5 bg-[#050708]/85 backdrop-blur-md border pointer-events-auto transition-transform hover:scale-105 duration-200 shadow-lg"
                  style={{
                    ...pos,
                    borderColor: `${stage.color}65`,
                    boxShadow: `0 0 16px ${stage.color}25`,
                    borderRadius: 0,
                  }}
                >
                  <Icon
                    size={11}
                    style={{ color: stage.color, flexShrink: 0 }}
                  />
                  <span
                    className="font-mono text-[9px] font-bold tracking-wider uppercase whitespace-nowrap"
                    style={{ color: stage.color }}
                  >
                    {stage.stepNumber}
                  </span>
                </div>
              );
            })}

            {/* "Same Steps, Bigger Opportunities" stylized annotation under doorway */}
            <div className="absolute right-2 bottom-8 flex flex-col items-end text-right select-none opacity-85 pointer-events-auto">
              <div className="flex flex-col items-end">
                <span className="font-mono text-[11px] text-[#00e599] tracking-wider italic">
                  Same Steps,
                </span>
                <span className="font-mono text-[11px] font-bold text-white tracking-wider italic">
                  Bigger Opportunities
                </span>
              </div>
              <svg
                width="56"
                height="28"
                viewBox="0 0 56 28"
                fill="none"
                className="text-[#00e599] mt-1 -mr-1"
                aria-hidden="true"
              >
                <path
                  d="M 6 24 C 22 26, 40 22, 46 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="3 3"
                />
                <path
                  d="M 40 8 L 46 6 L 48 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── FIVE-STAGE PROGRESS STRIP ── */}
      <div className="relative border-t border-white/10 bg-[#050708]/95 backdrop-blur-md">
        <div className="tracks-content-container">
          <div className="flex items-stretch overflow-x-auto py-2.5">
            {PROCESS_STAGES.map((stage, i) => {
              const label = SHORT_STAGE_NAMES[stage.id] || stage.title;
              return (
                <div
                  key={stage.id}
                  className="flex-1 min-w-[140px] relative flex items-center justify-between px-3 py-2.5 group hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-base font-black tracking-wider"
                      style={{ color: stage.color }}
                    >
                      {stage.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-white tracking-wide whitespace-nowrap">
                      {label}
                    </span>
                  </div>

                  {/* Horizontal connecting line between items */}
                  {i < PROCESS_STAGES.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden sm:block flex-1 mx-3 h-px bg-white/15"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
