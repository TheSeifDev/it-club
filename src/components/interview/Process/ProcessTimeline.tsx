"use client";

import React from "react";
import {
  Calendar,
  FileText,
  Search,
  MessageSquare,
  Award,
} from "lucide-react";
import { KEY_DATES } from "./process-data";

const DATE_ICONS = {
  calendar: Calendar,
  "file-text": FileText,
  search: Search,
  "message-circle": MessageSquare,
  award: Award,
};

export default function ProcessTimeline() {
  return (
    <section
      id="key-dates"
      aria-label="Key Recruitment Dates Timeline"
      className="relative w-full overflow-hidden text-white border-b border-white/10"
      style={{ background: "#050708" }}
    >
      {/* ── Top Emerald-Cyan Aurora Ambient Bloom ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-44 opacity-[0.22] blur-[80px]"
        style={{
          background:
            "radial-gradient(ellipse 85% 150px at 50% 0%, #00e599 0%, #18c8ed 45%, transparent 80%)",
        }}
      />

      <div className="relative tracks-content-container py-16 md:py-20">
        {/* Eyebrow */}
        <div className="mb-2">
          <span className="font-mono text-[11px] font-bold tracking-[0.22em] uppercase text-[#00e599]">
            APPLICATION TIMELINE
          </span>
        </div>

        {/* Heading */}
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.025em] text-white">
            Key Dates
          </h2>
          <p className="arabic mt-1.5 text-base sm:text-lg font-semibold text-white/70">
            المواعيد المهمة
          </p>
        </div>

        {/* ── Timeline Track ── */}
        <div className="relative overflow-x-auto pb-4 pt-2 no-scrollbar">
          <div className="min-w-[680px] md:min-w-0 relative flex items-start justify-between">
            {/* The continuous connecting line running through the center of all circular nodes */}
            <div
              aria-hidden="true"
              className="absolute top-[22px] sm:top-[24px] left-[24px] right-[24px] h-[2px] z-0 flex pointer-events-none"
            >
              {KEY_DATES.slice(0, -1).map((date, i) => (
                <div
                  key={`line-${i}`}
                  className="flex-1 h-full"
                  style={{
                    background: `linear-gradient(to right, ${date.color}, ${KEY_DATES[i + 1].color})`,
                    boxShadow: `0 0 8px ${date.color}60`,
                  }}
                />
              ))}
            </div>

            {/* 5 Milestone Nodes */}
            {KEY_DATES.map((date) => {
              const Icon = DATE_ICONS[date.icon];
              return (
                <div
                  key={date.id}
                  className="relative z-10 flex flex-col items-center text-center flex-1 px-2"
                >
                  {/* Circular Node with neon ring & glow */}
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 bg-[#050708] flex items-center justify-center transition-transform hover:scale-110 duration-200 cursor-default select-none"
                    style={{
                      borderColor: date.color,
                      boxShadow: `0 0 18px ${date.color}45, inset 0 0 10px ${date.color}20`,
                    }}
                  >
                    <Icon size={17} style={{ color: date.color }} />
                  </div>

                  {/* Label in white */}
                  <span className="text-xs sm:text-sm font-semibold text-white tracking-wide mt-3.5 whitespace-nowrap">
                    {date.label}
                  </span>

                  {/* Date range in accent color */}
                  <span
                    className="text-[11px] sm:text-xs font-mono font-semibold mt-1 whitespace-nowrap"
                    style={{ color: date.color }}
                  >
                    {date.dateRange}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
