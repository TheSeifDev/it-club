"use client";

import React from "react";
import { EVALUATION_PILLARS } from "./process-data";

export default function EvaluationPrinciplesSection() {
  return (
    <section
      id="evaluation-principles"
      aria-label="Evaluation and Expectations Section"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-20 md:py-28 lg:py-32 border-b border-white/10"
    >
      <div className="relative tracks-content-container">
        {/* =============================================================== */}
        {/* 1. SECTION HEADER                                               */}
        {/* =============================================================== */}
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold text-[#ff3ca7] tracking-widest uppercase">
              04 • EVALUATION VALUES
            </span>
            <span className="text-neutral-600">|</span>
            <span className="arabic text-sm text-neutral-400 font-medium">
              معايير وما نبحث عنه
            </span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
              What we value.
              <br />
              <span className="text-[#ff3ca7]">Curiosity, character & commitment.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              We do not look for finished experts. We look for builders eager to learn,
              collaborate, and show up consistently for their team.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 2. FOUR EVALUATION PILLARS GRID                                 */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {EVALUATION_PILLARS.map((pillar) => (
            <div
              key={`pillar-${pillar.number}`}
              className="group relative flex flex-col justify-between p-6 sm:p-8 bg-[#0a0c0e] border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden"
              style={{
                background: `linear-gradient(180deg, ${pillar.color}08 0%, rgba(10,12,14,0.95) 100%)`,
              }}
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300"
                style={{ backgroundColor: pillar.color }}
              />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-mono text-xs font-bold tracking-widest uppercase"
                    style={{ color: pillar.color }}
                  >
                    PILLAR {pillar.number} &bull; {pillar.tag}
                  </span>

                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: pillar.color }}
                  />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {pillar.title}
                </h3>

                <h4 className="arabic mt-1 text-sm sm:text-base font-bold text-white/60">
                  {pillar.arabicTitle}
                </h4>

                <p className="mt-4 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  {pillar.description}
                </p>

                <p className="arabic mt-2 text-xs text-neutral-400 font-light leading-relaxed">
                  {pillar.arabicDescription}
                </p>
              </div>

              {/* Concrete Indicators */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-2.5">
                  WHAT THIS LOOKS LIKE IN PRACTICE:
                </div>

                <ul className="space-y-2">
                  {pillar.indicators.map((ind, idx) => (
                    <li
                      key={`ind-${idx}`}
                      className="flex items-start gap-2.5 text-xs text-neutral-400 font-light leading-relaxed"
                    >
                      <span
                        className="w-1 h-1 shrink-0 mt-1.5"
                        style={{ backgroundColor: pillar.color }}
                      />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* =============================================================== */}
        {/* 3. TRANSPARENCY NOTICE (Honest & Grounded)                      */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-8 bg-black/60 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-[10px] font-mono font-bold tracking-widest text-[#00e599] uppercase mb-1">
              IMPORTANT CANDIDATE NOTICE
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
              Applying to IT Club is free and open to all registered university students.
              We evaluate each candidate objectively based on track fit, potential, and availability.
              No specific technical background is an absolute guarantee of selection, and no prior experience is a prerequisite for beginner learning tracks.
            </p>
          </div>

          <div className="arabic text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-sm sm:text-right">
            التقديم مفتوح لجميع الطلاب بدون أي مقابل، والتقييم يتم بشفافية
            كاملة وفق الإمكانيات والشغف المتاح.
          </div>
        </div>
      </div>
    </section>
  );
}
