"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { RECRUITMENT_STAGES } from "./process-data";

export default function ProcessHero() {
  return (
    <section
      aria-label="Recruitment Process Hero"
      className="relative w-full overflow-hidden bg-[#050708] text-white pt-28 pb-20 md:pt-36 md:pb-28 border-b border-white/10"
    >
      {/* Ambient Overhead Light Bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[420px] opacity-20 blur-[130px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 300px at 50% 0%, #00e599 0%, #18c8ed 40%, transparent 75%)",
        }}
      />

      <div className="relative tracks-content-container">
        {/* =============================================================== */}
        {/* 1. TOP EYEBROW STRIP                                            */}
        {/* =============================================================== */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold text-[#00e599] tracking-widest uppercase">
              01 • SELECTION BLUEPRINT
            </span>
            <span className="text-neutral-600">|</span>
            <span className="arabic text-sm text-neutral-400 font-medium">
              دليل رحلة الانضمام
            </span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* =============================================================== */}
        {/* 2. HEADLINE & INTRODUCTORY COPY                                 */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-end mb-16 sm:mb-20">
          <div className="lg:col-span-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] leading-[1.04] text-white">
              From applicant
              <br />
              <span className="text-[#00e599]">to builder.</span>
              <br />
              The recruitment journey.
            </h1>

            <p className="arabic mt-5 text-lg sm:text-xl text-neutral-300 font-medium leading-relaxed max-w-2xl">
              رحلة واضحة وشفافة لاكتشاف شغفك وإمكانياتك، مبنية على التقدير
              المتبادل والتعلم المستمر، بعيداً عن الاختبارات المعقدة.
            </p>
          </div>

          <div className="lg:col-span-4 lg:pb-2">
            <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed">
              Our recruitment process is designed to understand how you think,
              what you care about, and how you want to grow. We evaluate
              curiosity and commitment rather than pedigree.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#00e599] hover:bg-[#3bf5ad] text-[#050708] font-bold text-xs sm:text-sm tracking-wide uppercase transition-all duration-300 shadow-[0_0_25px_rgba(0,229,153,0.3)] hover:shadow-[0_0_40px_rgba(0,229,153,0.5)]"
              >
                <Sparkles size={16} />
                <span>Apply for Recruitment</span>
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/tracks"
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-white/15 hover:border-white/35 bg-white/[0.03] text-xs font-mono font-bold tracking-wider uppercase text-neutral-300 hover:text-white transition-all"
              >
                <span>Explore Tracks</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 3. PROGRESSION STAGE-METER (Visual Flow Pipeline)               */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-8 bg-[#0a0c0e] border border-white/10 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div>
              <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#00e599] uppercase mb-1">
                STAGE-BY-STAGE PIPELINE
              </div>
              <div className="text-sm font-bold text-white tracking-tight">
                Six Clear Milestones · End-to-End Transparency
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-[#00e599] animate-pulse" />
              <span>Applications Currently Active</span>
            </div>
          </div>

          {/* Connected Pipeline Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative">
            {RECRUITMENT_STAGES.map((stage) => (
              <a
                key={`pipeline-stage-${stage.id}`}
                href={`#stage-${stage.id}`}
                className="group relative flex flex-col justify-between p-3.5 bg-black/50 border border-white/5 hover:border-white/20 transition-all duration-300"
              >
                {/* Stage top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-300 group-hover:h-[3px]"
                  style={{ backgroundColor: stage.color }}
                />

                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: stage.color }}
                  >
                    {stage.stepNumber}
                  </span>
                  <CheckCircle2
                    size={14}
                    className="text-neutral-600 group-hover:text-white transition-colors"
                  />
                </div>

                <div>
                  <div className="text-xs font-bold text-white group-hover:text-white transition-colors leading-snug">
                    {stage.title}
                  </div>
                  <div className="arabic text-[11px] text-neutral-400 mt-1 line-clamp-1">
                    {stage.arabicTitle}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>{stage.durationEstimate}</span>
                  <span className="text-neutral-400 group-hover:translate-x-0.5 transition-transform">
                    &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
