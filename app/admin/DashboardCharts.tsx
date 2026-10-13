"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Info } from "lucide-react";
import {
  COMMITTEE_TRACKS,
  STATUS_METADATA,
  TRACK_METADATA,
} from "../../lib/admin/transitions";
import type {
  ApplicationStatus,
  DashboardMetrics,
  TrackDistributionMetrics,
} from "../../lib/admin/types";

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// 1. Applications Over Time Chart
// ============================================================================
export function ApplicationsOverTimeChart({
  data,
}: {
  data: DashboardMetrics["submissionsByDay"];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...data.map((item) => item.count));
  const width = 720;
  const height = 230;
  const padding = { top: 24, right: 24, bottom: 44, left: 42 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const points = data.map((item, index) => {
    const x = padding.left + (plotWidth / Math.max(1, data.length - 1)) * index;
    const y = padding.top + plotHeight - (item.count / max) * plotHeight;
    return { ...item, x, y };
  });

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + plotHeight} ${line} ${padding.left + plotWidth},${padding.top + plotHeight}`;

  const startDate = data.length > 0 ? formatShortDate(data[0].date) : "";
  const endDate = data.length > 0 ? formatShortDate(data[data.length - 1].date) : "";

  // Filter dates with actual submissions (> 0) for quick-click pills
  const activeDays = data.filter((d) => d.count > 0);

  if (total === 0) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center">
        <Calendar size={28} className="text-white/20 mb-3" />
        <p className="text-sm font-semibold text-white/70">No Submissions in Past 14 Days</p>
        <p className="mt-1 text-xs text-white/40">New candidate applications will be recorded here automatically.</p>
      </div>
    );
  }

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="space-y-4">
      {/* Date Range & Total Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3 text-xs">
        <div className="flex items-center gap-2 text-white/50">
          <Calendar size={14} className="text-[#00e599]" />
          <span>Timeline: <strong className="text-white">{startDate} — {endDate}</strong></span>
          <span className="text-white/20">·</span>
          <span><strong className="text-white tabular-nums">{total}</strong> total submissions</span>
        </div>
        <p className="text-[11px] text-white/40">
          Click any day to filter applications
        </p>
      </div>

      {/* SVG Chart with interactive columns */}
      <div className="relative">
        <svg
          role="img"
          aria-label={`Applications over time from ${startDate} to ${endDate}. Total submissions: ${total}`}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full select-none"
        >
          <defs>
            <linearGradient id="applicationsAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#00e599" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#00e599" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((tick) => {
            const y = padding.top + plotHeight * tick;
            const val = Math.round(max * (1 - tick));
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.07)"
                  strokeDasharray="3 3"
                />
                <text x={8} y={y + 4} className="fill-white/40 text-[10px] font-mono tabular-nums">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Shaded Area and Stroke Line */}
          <polygon points={area} fill="url(#applicationsAreaGradient)" />
          <polyline
            points={line}
            fill="none"
            stroke="#00e599"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Interactive vertical column hit areas and data points */}
          {points.map((point, index) => {
            const isHovered = hoveredIndex === index;
            const colWidth = plotWidth / Math.max(1, points.length);
            const colX = point.x - colWidth / 2;

            return (
              <Link
                key={point.date}
                href={`/admin/applications?date=${point.date}`}
                aria-label={`View ${point.count} application(s) submitted on ${formatFullDate(point.date)}`}
                className="cursor-pointer focus:outline-none"
              >
                {/* Hit area */}
                <rect
                  x={colX}
                  y={padding.top}
                  width={colWidth}
                  height={plotHeight}
                  fill={isHovered ? "rgba(0, 229, 153, 0.08)" : "transparent"}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="transition-colors duration-150"
                />

                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={point.x}
                    x2={point.x}
                    y1={padding.top}
                    y2={padding.top + plotHeight}
                    stroke="#00e599"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Data point circle */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : point.count > 0 ? 4.5 : 3}
                  fill={isHovered ? "#00e599" : "#050708"}
                  stroke="#00e599"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="transition-all duration-150"
                />

                {/* X-axis date labels */}
                {(index % 2 === 0 || index === points.length - 1) && (
                  <text
                    x={point.x}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-white/45 text-[10px] font-mono tabular-nums"
                  >
                    {formatShortDate(point.date)}
                  </text>
                )}
              </Link>
            );
          })}
        </svg>

        {/* Hover / Active Tooltip */}
        {activePoint && (
          <div
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded border border-[#00e599]/40 bg-[#080a0c]/95 px-3 py-1.5 shadow-xl backdrop-blur text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{formatFullDate(activePoint.date)}</span>
              <span className="border-l border-white/20 pl-2 font-mono font-bold text-[#00e599]">
                {activePoint.count} {activePoint.count === 1 ? "submission" : "submissions"}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-white/50">Click to filter applications</p>
          </div>
        )}
      </div>

      {/* Quick Click Date Pills for active days */}
      {activeDays.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            Active Days:
          </span>
          {activeDays.map((d) => (
            <Link
              key={d.date}
              href={`/admin/applications?date=${d.date}`}
              className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-white/80 transition-colors hover:border-[#00e599]/40 hover:bg-[#00e599]/10 hover:text-[#00e599]"
            >
              <span>{formatShortDate(d.date)}:</span>
              <span className="font-bold text-[#00e599]">{d.count}</span>
              <ArrowRight size={11} className="text-white/30" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. Status Distribution Chart (All Clickable)
// ============================================================================
export function StatusDistributionChart({
  byStatus,
}: {
  byStatus: DashboardMetrics["byStatus"];
}) {
  const entries = Object.entries(byStatus) as Array<[ApplicationStatus, number]>;
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const max = Math.max(1, ...entries.map(([, count]) => count));

  if (total === 0) {
    return <ChartEmpty label="No application statuses recorded yet." />;
  }

  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 text-xs text-white/50">
        <span>Click any status to filter applications</span>
        <span className="font-mono text-white/80">
          Total: <strong className="text-[#00e599]">{total}</strong> (100% reconciled)
        </span>
      </div>

      <div className="space-y-1.5">
        {entries.map(([status, count]) => {
          const meta = STATUS_METADATA[status];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = `${Math.max(count > 0 ? 3 : 0, (count / max) * 100)}%`;

          return (
            <Link
              key={status}
              href={`/admin/applications?status=${status}`}
              className="group block rounded border border-transparent p-2 transition-all hover:border-white/10 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00e599]"
              aria-label={`Filter by ${meta.label}: ${count} applications (${pct}%)`}
            >
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-semibold text-white/75 transition-colors group-hover:text-white">
                  <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                  <span>{meta.label}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-white/50 transition-colors group-hover:text-white">
                  <span className="font-bold text-white">{count}</span>
                  <span className="text-[10px] text-white/35">({pct}%)</span>
                  <ArrowRight
                    size={12}
                    className="text-[#00e599] opacity-0 transition-all -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.05] overflow-hidden">
                <div
                  className={`h-full ${meta.dotClass} transition-all duration-300 group-hover:brightness-125`}
                  style={{ width }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 3. Track Distribution Chart (Primary, Secondary, Combined with truthful semantics)
// ============================================================================
export function TrackDistributionChart({
  trackMetrics,
  totalApplicants,
}: {
  trackMetrics: TrackDistributionMetrics;
  totalApplicants: number;
}) {
  const [mode, setMode] = useState<"primary" | "secondary" | "combined">("combined");

  const { byPrimary, bySecondary, byCombined, totalPrimary, totalSecondary, totalSelections } =
    trackMetrics;

  const currentCounts =
    mode === "primary" ? byPrimary : mode === "secondary" ? bySecondary : byCombined;

  const currentTotal =
    mode === "primary" ? totalPrimary : mode === "secondary" ? totalSecondary : totalSelections;

  const maxVal = Math.max(1, ...Object.values(currentCounts));

  return (
    <div className="space-y-4 p-5">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-1 rounded border border-white/10 bg-[#050708] p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("combined")}
            className={`px-3 py-1 font-bold transition-colors ${
              mode === "combined"
                ? "bg-[#00e599] text-[#050708]"
                : "text-white/60 hover:text-white"
            }`}
          >
            All Selections ({totalSelections})
          </button>
          <button
            type="button"
            onClick={() => setMode("primary")}
            className={`px-3 py-1 font-bold transition-colors ${
              mode === "primary"
                ? "bg-[#00e599] text-[#050708]"
                : "text-white/60 hover:text-white"
            }`}
          >
            Primary ({totalPrimary})
          </button>
          <button
            type="button"
            onClick={() => setMode("secondary")}
            className={`px-3 py-1 font-bold transition-colors ${
              mode === "secondary"
                ? "bg-[#00e599] text-[#050708]"
                : "text-white/60 hover:text-white"
            }`}
          >
            Secondary ({totalSecondary})
          </button>
        </div>

        {/* Truthful Metric Breakdown Chips */}
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span title="Distinct applicants">
            Applicants: <strong className="text-white">{totalApplicants}</strong>
          </span>
          <span className="text-white/20">·</span>
          <span title="Total preference selections across primary and optional secondary">
            Preferences: <strong className="text-[#00e599]">{totalSelections}</strong>
          </span>
        </div>
      </div>

      {/* Semantic Explanatory Banner */}
      <div className="flex items-start gap-2.5 rounded border border-white/5 bg-white/[0.02] p-2.5 text-xs text-white/55">
        <Info size={15} className="mt-0.5 shrink-0 text-[#00e599]" />
        <div>
          {mode === "primary" && (
            <p>
              Showing <strong>Primary Preferences</strong>: Exactly 1 primary choice per applicant ({totalPrimary} total).
              Clicking a committee filters applicants who selected it as their #1 choice.
            </p>
          )}
          {mode === "secondary" && (
            <p>
              Showing <strong>Secondary Preferences</strong>: Optional 2nd choice ({totalSecondary} of {totalApplicants} applicants chose a secondary committee).
              Clicking a committee filters applicants who selected it as their #2 choice.
            </p>
          )}
          {mode === "combined" && (
            <p>
              Showing <strong>All Preferences Combined</strong> ({totalSelections} selections across {totalApplicants} unique applicants).
              Clicking any committee displays applicants who chose it as <em>either</em> first or second preference without duplication.
            </p>
          )}
        </div>
      </div>

      {/* Track Bars */}
      <div className="space-y-2.5">
        {COMMITTEE_TRACKS.map((track) => {
          const meta = TRACK_METADATA[track];
          const primaryCount = byPrimary[track] || 0;
          const secondaryCount = bySecondary[track] || 0;
          const combinedCount = byCombined[track] || 0;
          const activeCount = currentCounts[track] || 0;

          const pct = currentTotal > 0 ? Math.round((activeCount / currentTotal) * 100) : 0;
          const barWidth = `${Math.max(activeCount > 0 ? 3 : 0, (activeCount / maxVal) * 100)}%`;

          const targetScope = mode === "primary" ? "primary" : mode === "secondary" ? "secondary" : "either";

          return (
            <Link
              key={track}
              href={`/admin/applications?track=${track}&trackScope=${targetScope}`}
              className="group block rounded border border-white/5 bg-[#050708] p-3 transition-all hover:border-white/20 hover:bg-[#0c0f13] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00e599]"
              aria-label={`View ${meta.name} applications in ${mode} mode: ${activeCount} selections`}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                {/* Track ID & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="inline-flex w-10 items-center justify-center border px-1.5 py-0.5 text-[10px] font-black uppercase"
                    style={{
                      borderColor: `${meta.color}40`,
                      color: meta.color,
                      backgroundColor: `${meta.color}15`,
                    }}
                  >
                    {meta.abbreviation}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-white group-hover:text-white transition-colors truncate">
                      {meta.name}
                    </p>
                    <p dir="rtl" className="arabic text-[11px] text-white/40 truncate">
                      {meta.arabicName}
                    </p>
                  </div>
                </div>

                {/* Counts Breakdown & Filter Arrow */}
                <div className="flex items-center gap-3 shrink-0">
                  {mode === "combined" ? (
                    <div className="text-right text-[11px] font-mono">
                      <span className="font-bold text-white tabular-nums">{combinedCount}</span>
                      <span className="text-white/40 text-[10px] ml-1">
                        (1st: {primaryCount}, 2nd: {secondaryCount})
                      </span>
                    </div>
                  ) : (
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-white tabular-nums">{activeCount}</span>
                      <span className="text-[10px] text-white/40 ml-1">({pct}%)</span>
                    </div>
                  )}

                  <ArrowRight
                    size={14}
                    className="text-[#00e599] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5 h-1.5 w-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full transition-all duration-300 group-hover:brightness-125"
                  style={{ width: barWidth, backgroundColor: meta.color }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. Review Pipeline Chart (All Stages Clickable)
// ============================================================================
export function ReviewPipelineChart({
  pipeline,
  total,
}: {
  pipeline: DashboardMetrics["pipeline"];
  total: number;
}) {
  if (total === 0) {
    return <ChartEmpty label="The review pipeline currently has no candidates." />;
  }

  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 text-xs text-white/50">
        <span>Click any stage to filter current applications</span>
        <span className="font-mono text-white/80">{total} in pipeline</span>
      </div>

      <div className="space-y-1.5">
        {pipeline.map(({ status, count }, index) => {
          const meta = STATUS_METADATA[status];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const width = `${Math.max(count > 0 ? 3 : 0, (count / Math.max(1, total)) * 100)}%`;

          return (
            <Link
              key={status}
              href={`/admin/applications?status=${status}`}
              className="group block rounded border border-transparent p-2 transition-all hover:border-white/10 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00e599]"
              aria-label={`View stage ${index + 1}: ${meta.label} (${count} applicants)`}
            >
              <div className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3">
                {/* Stage number */}
                <span className="flex h-6 w-6 items-center justify-center border border-white/10 bg-white/[0.03] text-[10px] font-bold text-white/50 transition-colors group-hover:border-[#00e599]/40 group-hover:text-[#00e599]">
                  {index + 1}
                </span>

                {/* Stage title & bar */}
                <div className="min-w-0">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/80 transition-colors group-hover:text-white truncate">
                      {meta.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] overflow-hidden">
                    <div
                      className={`h-full ${meta.dotClass} transition-all duration-300 group-hover:brightness-125`}
                      style={{ width }}
                    />
                  </div>
                </div>

                {/* Count & drilldown indicator */}
                <div className="flex items-center gap-2 font-mono text-xs text-right tabular-nums">
                  <span className="font-bold text-white">{count}</span>
                  <span className="text-[10px] text-white/40">({pct}%)</span>
                  <ArrowRight
                    size={12}
                    className="text-[#00e599] opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex min-h-56 items-center justify-center p-6 text-center">
      <p className="max-w-xs text-sm leading-6 text-white/45">{label}</p>
    </div>
  );
}
