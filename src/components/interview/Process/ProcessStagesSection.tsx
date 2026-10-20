"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  BookOpen,
  Star,
  Target,
  CheckCircle2,
  CheckSquare,
  Heart,
  Users,
  Smile,
  Compass,
  UserCheck,
  CheckCircle,
  Clock,
  XCircle,
  Layers,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react";
import {
  PROCESS_STAGES,
  APPLICATION_CHECKLIST,
  REVIEW_CARDS,
  INTERVIEW_CARDS,
  OUTCOME_CARDS,
  GROW_FEATURES,
} from "./process-data";

// ────────────────────────────────────────────────────────────
// Stage 01 — Application Checklist visual
// ────────────────────────────────────────────────────────────

const CHECKLIST_ICONS = {
  user: User,
  book: BookOpen,
  star: Star,
  target: Target,
  check: CheckCircle2,
};

function ApplicationVisual() {
  return (
    <div className="w-full max-w-xs lg:max-w-sm">
      <div
        className="bg-[#0a0d10] border border-white/10 overflow-hidden"
        style={{ borderRadius: 0 }}
      >
        {/* Header bar */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 bg-[#00e599]" />
          <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#00e599]">
            Application Form
          </span>
        </div>

        <div className="p-4 space-y-2">
          {APPLICATION_CHECKLIST.map((item, i) => {
            const Icon = CHECKLIST_ICONS[item.icon];
            const isLast = i === APPLICATION_CHECKLIST.length - 1;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 border"
                style={{
                  borderColor: isLast
                    ? "rgba(0,229,153,0.4)"
                    : "rgba(255,255,255,0.07)",
                  background: isLast
                    ? "rgba(0,229,153,0.06)"
                    : "rgba(255,255,255,0.02)",
                }}
              >
                <Icon
                  size={14}
                  style={{ color: isLast ? "#00e599" : "#4a5568", flexShrink: 0 }}
                />
                <span
                  className="text-xs font-medium"
                  style={{ color: isLast ? "#00e599" : "#8f9ea0" }}
                >
                  {item.label}
                </span>
                {isLast && (
                  <CheckCircle2
                    size={13}
                    className="ml-auto text-[#00e599]"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Stage 02 — Review cards visual
// ────────────────────────────────────────────────────────────

const REVIEW_ICON_MAP = {
  "check-square": CheckSquare,
  heart: Heart,
  star: Star,
  users: Users,
};

function ReviewVisual() {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-xs lg:max-w-sm">
      {REVIEW_CARDS.map((card) => {
        const Icon = REVIEW_ICON_MAP[card.icon];
        return (
          <div
            key={card.label}
            className="flex flex-col gap-2 p-4 bg-[#0a0d10] border"
            style={{ borderColor: `${card.color}30`, borderRadius: 0 }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: `${card.color}18` }}
            >
              <Icon size={15} style={{ color: card.color }} />
            </div>
            <span className="text-[11px] font-bold text-white leading-tight">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Stage 03 — Interview cards visual
// ────────────────────────────────────────────────────────────

const INTERVIEW_ICON_MAP = {
  smile: Smile,
  compass: Compass,
  "user-check": UserCheck,
};

function InterviewVisual() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs lg:max-w-sm">
      {INTERVIEW_CARDS.map((card) => {
        const Icon = INTERVIEW_ICON_MAP[card.icon];
        return (
          <div
            key={card.title}
            className="flex items-start gap-3 p-4 bg-[#0a0d10] border"
            style={{ borderColor: `${card.color}30`, borderRadius: 0 }}
          >
            <div
              className="w-9 h-9 shrink-0 flex items-center justify-center"
              style={{ background: `${card.color}18` }}
            >
              <Icon size={16} style={{ color: card.color }} />
            </div>
            <div>
              <div
                className="text-xs font-bold"
                style={{ color: card.color }}
              >
                {card.title}
              </div>
              <p className="text-[11px] text-[#8f9ea0] mt-0.5 leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Stage 04 — Outcome cards visual
// ────────────────────────────────────────────────────────────

const OUTCOME_ICON_MAP = {
  "check-circle": CheckCircle,
  clock: Clock,
  "x-circle": XCircle,
};

function DecisionVisual() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs lg:max-w-sm">
      {OUTCOME_CARDS.map((card) => {
        const Icon = OUTCOME_ICON_MAP[card.icon];
        return (
          <div
            key={card.title}
            className="flex items-start gap-3 p-4 border"
            style={{
              borderColor: `${card.color}35`,
              background: card.bgColor,
              borderRadius: 0,
            }}
          >
            <Icon size={18} style={{ color: card.color, flexShrink: 0 }} />
            <div>
              <div
                className="text-sm font-bold"
                style={{ color: card.color }}
              >
                {card.title}
              </div>
              <p className="text-[11px] text-[#8f9ea0] mt-0.5 leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Stage 05 — IT Club orbital / feature labels visual (CSS only)
// ────────────────────────────────────────────────────────────

const GROW_ICON_MAP = {
  layers: Layers,
  users: Users,
  zap: Zap,
  globe: Globe,
};

function GrowVisual() {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Orbital rings (circles — CSS artwork, allowed per spec) */}
      <div
        className="absolute inset-8"
        style={{
          border: "1px solid rgba(155,124,255,0.3)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          border: "1px solid rgba(155,124,255,0.15)",
          borderRadius: "50%",
        }}
      />
      <div
        className="absolute"
        style={{
          inset: "-20px",
          border: "1px dashed rgba(155,124,255,0.08)",
          borderRadius: "50%",
        }}
      />

      {/* Center badge with official IT Club logo */}
      <div
        className="relative z-10 flex items-center justify-center w-20 h-20 bg-[#0e1112] border-2 border-[#9b7cff]/50 shadow-[0_0_24px_rgba(155,124,255,0.25)] p-3"
        style={{ borderRadius: "50%" }}
      >
        <Image
          src="/logo.webp"
          alt="IT Club"
          width={46}
          height={46}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Feature labels — absolute positioned around the circle */}
      {GROW_FEATURES.map((feature, i) => {
        const Icon = GROW_ICON_MAP[feature.icon];
        // Position each label at a cardinal point
        const positions = [
          { top: "4px", left: "50%", transform: "translateX(-50%)" },
          { bottom: "4px", left: "50%", transform: "translateX(-50%)" },
          { left: "4px", top: "50%", transform: "translateY(-50%)" },
          { right: "4px", top: "50%", transform: "translateY(-50%)" },
        ];
        const pos = positions[i] ?? {};
        return (
          <div
            key={feature.label}
            className="absolute flex items-center gap-1 px-2 py-1 bg-[#0c0f12]/90 border"
            style={{
              ...pos,
              borderColor: `${feature.color}40`,
              borderRadius: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon size={10} style={{ color: feature.color }} />
            <span
              className="text-[9px] font-bold tracking-wide"
              style={{ color: feature.color }}
            >
              {feature.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Visuals map
// ────────────────────────────────────────────────────────────

const STAGE_VISUALS = [
  ApplicationVisual,
  ReviewVisual,
  InterviewVisual,
  DecisionVisual,
  GrowVisual,
];

// ────────────────────────────────────────────────────────────
// Main component — Five Alternating Editorial Stages
// ────────────────────────────────────────────────────────────

export default function ProcessStagesSection() {
  return (
    <div className="w-full">
      {PROCESS_STAGES.map((stage, index) => {
        const isEven = index % 2 === 0;
        const Visual = STAGE_VISUALS[index];
        const isFirst = index === 0;
        const isLast = index === PROCESS_STAGES.length - 1;

        // Text column comes first (order:1) for even stages,
        // visual column first (order:1) for odd stages.
        const textOrder = isEven ? 1 : 2;
        const visualOrder = isEven ? 2 : 1;

        return (
          <section
            key={stage.id}
            id={`stage-${stage.id}`}
            aria-label={`${stage.title} Stage`}
            className="relative w-full bg-[#050708] text-white border-b border-white/10"
            style={{
              paddingTop: isFirst ? "4rem" : "3.5rem",
              paddingBottom: isLast ? "4.5rem" : "3.5rem",
            }}
          >
            {/* Left-edge accent glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 opacity-50"
              style={{
                background: `linear-gradient(to bottom, transparent, ${stage.color}60, transparent)`,
              }}
            />

            <div className="relative tracks-content-container">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                {/* TEXT COLUMN */}
                <div
                  className="flex flex-col justify-center"
                  style={{ order: textOrder }}
                >
                  {/* Ghost step number */}
                  <div
                    className="font-black text-[5.5rem] sm:text-[7rem] leading-none tracking-tighter mb-2 select-none"
                    style={{ color: `${stage.color}18` }}
                    aria-hidden="true"
                  >
                    {stage.stepNumber}
                  </div>

                  {/* Tag */}
                  <div
                    className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase mb-3"
                    style={{ color: stage.color }}
                  >
                    {stage.tag}
                  </div>

                  {/* English Title */}
                  <h2 className="text-[1.75rem] sm:text-3xl md:text-[2.1rem] font-black tracking-[-0.025em] leading-[1.1] text-white mb-1">
                    {stage.title}
                  </h2>

                  {/* Arabic Title */}
                  <p
                    className="arabic text-lg font-bold mb-4"
                    style={{ color: `${stage.color}BB` }}
                  >
                    {stage.arabicTitle}
                  </p>

                  {/* Color accent divider */}
                  <div
                    className="w-10 h-[2px] mb-5"
                    style={{ background: stage.color }}
                  />

                  {/* Description */}
                  <p className="text-[13.5px] text-[#8f9ea0] leading-[1.85] max-w-[420px]">
                    {stage.description}
                  </p>

                  {/* CTAs */}
                  {stage.id === "application" && (
                    <div className="mt-7">
                      <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00e599] text-[#050708] font-bold text-[11px] tracking-widest uppercase hover:bg-[#3bf5ad] transition-colors duration-200"
                        style={{ borderRadius: 0 }}
                      >
                        Register Now
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}

                  {stage.id === "interview" && (
                    <div className="mt-7">
                      <Link
                        href="/process#faq"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border font-bold text-[11px] tracking-widest uppercase transition-colors duration-200"
                        style={{
                          borderColor: `${stage.color}50`,
                          color: stage.color,
                          borderRadius: 0,
                        }}
                      >
                        Learn About Interviews
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  )}

                  {stage.id === "grow" && (
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        href="/tracks"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border font-bold text-[11px] tracking-widest uppercase transition-colors duration-200"
                        style={{
                          borderColor: `${stage.color}50`,
                          color: stage.color,
                          borderRadius: 0,
                        }}
                      >
                        Discover Our Tracks
                        <ArrowRight size={13} />
                      </Link>
                      <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3.5 py-2">
                        <Image
                          src="/logo.webp"
                          alt="IT Club"
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">
                          IT Club Family
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* VISUAL COLUMN */}
                <div
                  className={`flex items-center justify-center ${isEven ? "lg:justify-end" : "lg:justify-start"
                    }`}
                  style={{ order: visualOrder }}
                >
                  <Visual />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
