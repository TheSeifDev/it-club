"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { RECRUITMENT_STAGES, type ProcessStage } from "./process-data";

interface ProcessTimelineProps {
  activeStageId?: string;
  onSelectStage?: (stageId: string) => void;
}

export default function ProcessTimeline({
  activeStageId = "application",
  onSelectStage,
}: ProcessTimelineProps) {
  return (
    <section
      id="timeline"
      aria-label="Recruitment Timeline Section"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-20 md:py-28 lg:py-32 border-b border-white/10"
    >
      <div className="relative tracks-content-container">
        {/* =============================================================== */}
        {/* 1. SECTION HEADER                                               */}
        {/* =============================================================== */}
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold text-[#18c8ed] tracking-widest uppercase">
              02 • CHRONOLOGICAL TIMELINE
            </span>
            <span className="text-neutral-600">|</span>
            <span className="arabic text-sm text-neutral-400 font-medium">
              الجدول الزمني للقبول
            </span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
              A structured roadmap,
              <br />
              <span className="text-[#18c8ed]">from first click to kickoff.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              Every applicant moves through the exact same transparent evaluation checkpoints.
              Select any stage below to inspect what happens, what to prepare, and next steps.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 2. CONNECTED TIMELINE JOURNEY                                   */}
        {/* =============================================================== */}
        <div className="relative">
          {/* Continuous Vertical Center Spine on Desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-gradient-to-b from-[#35d98a]/40 via-[#18c8ed]/40 to-[#9b7cff]/40"
          />

          <div className="space-y-8 lg:space-y-12">
            {RECRUITMENT_STAGES.map((stage: ProcessStage, index: number) => {
              const isEven = index % 2 === 0;
              const isSelected = activeStageId === stage.id;

              return (
                <div
                  key={`timeline-node-${stage.id}`}
                  id={`stage-${stage.id}`}
                  className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center"
                >
                  {/* Left Column (Even on Desktop, Full on Mobile) */}
                  <div
                    className={`lg:col-span-5 ${
                      isEven
                        ? "lg:text-right"
                        : "lg:order-last lg:col-span-5 lg:text-left"
                    }`}
                  >
                    <div
                      className={`group relative p-6 sm:p-7 bg-[#0a0c0e] border transition-all duration-300 text-left ${
                        isSelected
                          ? "border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.06)]"
                          : "border-white/10 hover:border-white/20"
                      }`}
                      style={{
                        background: isSelected
                          ? `linear-gradient(180deg, ${stage.color}0f 0%, rgba(10,12,14,0.95) 100%)`
                          : undefined,
                      }}
                    >
                      {/* Top colored indicator line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300"
                        style={{ backgroundColor: stage.color }}
                      />

                      <div className="flex items-center justify-between mb-3">
                        <span
                          className="font-mono text-xs font-bold tracking-widest uppercase"
                          style={{ color: stage.color }}
                        >
                          {stage.stepNumber} &bull; {stage.tag}
                        </span>

                        <span className="font-mono text-[11px] text-neutral-500">
                          {stage.durationEstimate}
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {stage.title}
                      </h3>

                      <h4 className="arabic mt-1 text-sm sm:text-base font-bold text-white/70">
                        {stage.arabicTitle}
                      </h4>

                      <p className="mt-4 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                        {stage.shortDesc}
                      </p>

                      <p className="arabic mt-2 text-xs text-neutral-400 font-light leading-relaxed">
                        {stage.arabicShortDesc}
                      </p>

                      {/* Interactive Deep-dive Switcher */}
                      {onSelectStage && (
                        <button
                          type="button"
                          onClick={() => onSelectStage(stage.id)}
                          className="mt-5 inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors"
                          style={{ color: stage.color }}
                        >
                          <span>Inspect Stage Deep-Dive</span>
                          <ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Center Node on Desktop */}
                  <div className="hidden lg:flex lg:col-span-2 justify-center items-center">
                    <div
                      className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#050708] border-2 transition-transform duration-300 group-hover:scale-110"
                      style={{ borderColor: stage.color }}
                    >
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: stage.color }}
                      >
                        {stage.stepNumber}
                      </span>

                      {/* Radial pulse glow behind active node */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 -m-1 rounded-full opacity-20 blur-md"
                        style={{ backgroundColor: stage.color }}
                      />
                    </div>
                  </div>

                  {/* Empty Spacer Column on Desktop */}
                  <div
                    className={`hidden lg:block lg:col-span-5 ${
                      isEven ? "lg:order-last" : ""
                    }`}
                  >
                    <div className="p-4 text-xs font-mono text-neutral-600 uppercase tracking-widest">
                      MILESTONE {stage.stepNumber} / 06
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
