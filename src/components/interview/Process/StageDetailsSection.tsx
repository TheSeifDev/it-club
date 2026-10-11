"use client";

import React, { useState } from "react";
import { Check, ArrowRight, Clock, HelpCircle, Compass } from "lucide-react";
import { RECRUITMENT_STAGES, type ProcessStage } from "./process-data";

interface StageDetailsSectionProps {
  selectedStageId?: string;
  onStageChange?: (stageId: string) => void;
}

export default function StageDetailsSection({
  selectedStageId = "application",
  onStageChange,
}: StageDetailsSectionProps) {
  const [internalStageId, setInternalStageId] = useState(selectedStageId);

  const activeId = onStageChange ? selectedStageId : internalStageId;
  const currentStage: ProcessStage =
    RECRUITMENT_STAGES.find((s) => s.id === activeId) || RECRUITMENT_STAGES[0];

  const handleSelect = (stageId: string) => {
    if (onStageChange) {
      onStageChange(stageId);
    } else {
      setInternalStageId(stageId);
    }
  };

  return (
    <section
      id="stage-details"
      aria-label="What Happens at Each Stage Section"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-20 md:py-28 lg:py-32 border-b border-white/10"
    >
      <div className="relative tracks-content-container">
        {/* =============================================================== */}
        {/* 1. SECTION HEADER                                               */}
        {/* =============================================================== */}
        <div className="flex items-center gap-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-xs font-bold text-[#eaff00] tracking-widest uppercase">
              03 • STAGE-BY-STAGE BREAKDOWN
            </span>
            <span className="text-neutral-600">|</span>
            <span className="arabic text-sm text-neutral-400 font-medium">
              تفاصيل كل مرحلة
            </span>
          </div>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.08] text-white">
              No guesswork.
              <br />
              <span className="text-[#eaff00]">What to expect and how to prepare.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              We believe in total candidate clarity. Explore the breakdown below
              for actionable guidance, recommended preparations, and follow-up timelines.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 2. HORIZONTAL STAGE SELECTOR TABS                               */}
        {/* =============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-10">
          {RECRUITMENT_STAGES.map((stage) => {
            const isCurrent = stage.id === currentStage.id;

            return (
              <button
                key={`tab-${stage.id}`}
                type="button"
                onClick={() => handleSelect(stage.id)}
                className={`relative flex flex-col p-3.5 text-left border transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/40 ${
                  isCurrent
                    ? "bg-[#0f1317] border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    : "bg-[#07090b] border-white/10 hover:border-white/20 text-neutral-400"
                }`}
              >
                {/* Top accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300"
                  style={{
                    backgroundColor: stage.color,
                    opacity: isCurrent ? 1 : 0.35,
                  }}
                />

                <span
                  className="font-mono text-[10px] font-bold tracking-wider"
                  style={{ color: isCurrent ? stage.color : undefined }}
                >
                  STAGE {stage.stepNumber}
                </span>

                <span className="text-xs font-bold text-white mt-1 line-clamp-1">
                  {stage.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* =============================================================== */}
        {/* 3. ACTIVE STAGE DEEP-DIVE CARD                                  */}
        {/* =============================================================== */}
        <div
          className="relative p-6 sm:p-10 lg:p-12 bg-[#090b0d] border border-white/15 overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${currentStage.color}0a 0%, rgba(9,11,13,0.98) 100%)`,
          }}
        >
          {/* Top highlight bar */}
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: currentStage.color }}
          />

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-white/10">
            <div>
              <div
                className="font-mono text-xs font-bold tracking-[0.2em] uppercase mb-1.5"
                style={{ color: currentStage.color }}
              >
                STAGE {currentStage.stepNumber} &bull; {currentStage.tag}
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {currentStage.title}
              </h3>

              <h4 className="arabic mt-1 text-base sm:text-lg font-bold text-white/60">
                {currentStage.arabicTitle}
              </h4>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-black/60 border border-white/10 shrink-0 font-mono text-xs text-neutral-300">
              <Clock size={14} style={{ color: currentStage.color }} />
              <span>Typical Window: {currentStage.durationEstimate}</span>
            </div>
          </div>

          {/* 3-Column Deep Breakdown: What to Expect / What to Prepare / What Happens Next */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Col 1: What to Expect (Col 1-5) */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-white mb-4">
                <Compass size={15} style={{ color: currentStage.color }} />
                <span>WHAT APPLICANTS SHOULD EXPECT</span>
              </div>

              <ul className="space-y-3">
                {currentStage.whatToExpect.map((item, idx) => (
                  <li
                    key={`expect-${idx}`}
                    className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5"
                  >
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0"
                      style={{ color: currentStage.color }}
                    />
                    <span className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2: What to Prepare (Col 6-9) */}
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-white mb-4">
                <HelpCircle size={15} style={{ color: currentStage.color }} />
                <span>WHAT TO PREPARE</span>
              </div>

              <ul className="space-y-3">
                {currentStage.whatToPrepare.map((item, idx) => (
                  <li
                    key={`prepare-${idx}`}
                    className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5"
                  >
                    <span
                      className="w-1.5 h-1.5 shrink-0 mt-2"
                      style={{ backgroundColor: currentStage.color }}
                    />
                    <span className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: What Happens Next (Col 10-12) */}
            <div className="lg:col-span-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-white mb-4">
                  <ArrowRight size={15} style={{ color: currentStage.color }} />
                  <span>WHAT HAPPENS NEXT</span>
                </div>

                <div className="p-4 bg-black/60 border border-white/10 text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                  {currentStage.whatHappensNext}
                </div>
              </div>

              <div className="mt-6 p-4 border border-white/5 bg-white/[0.02]">
                <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">
                  COMMUNICATION CHANNELS
                </div>
                <div className="text-xs text-neutral-400 font-light">
                  Official candidate invitations are sent exclusively via registered email and official club messaging.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
