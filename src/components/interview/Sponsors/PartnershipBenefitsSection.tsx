"use client";

import React from "react";
import {
  Users,
  Code2,
  GraduationCap,
  Sparkles,
  Network,
} from "lucide-react";
import { PARTNERSHIP_BENEFITS, type PartnershipBenefit } from "@/src/data/sponsors";

export default function PartnershipBenefitsSection() {
  const getIcon = (iconName: PartnershipBenefit["iconName"], color: string) => {
    switch (iconName) {
      case "users":
        return <Users size={22} style={{ color }} />;
      case "code":
        return <Code2 size={22} style={{ color }} />;
      case "graduation":
        return <GraduationCap size={22} style={{ color }} />;
      case "sparkles":
        return <Sparkles size={22} style={{ color }} />;
      case "network":
        return <Network size={22} style={{ color }} />;
      default:
        return <Sparkles size={22} style={{ color }} />;
    }
  };

  return (
    <section
      aria-label="Partnership Benefits and Outcomes"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10 py-20 md:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-4">
          <span>03</span>
          <span>&bull;</span>
          <span className="text-white">WHY COLLABORATE</span>
          <span className="text-neutral-500">|</span>
          <span className="arabic text-sm text-neutral-400">
            أهداف وقيم الشراكة
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
              An ecosystem built
              <br />
              <span className="text-neutral-400">on mutual growth.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
              We focus on reciprocal, long-term partnerships that advance student
              capabilities while connecting partner organizations with motivated,
              curious developers.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PARTNERSHIP_BENEFITS.map((benefit, idx) => (
            <div
              key={`benefit-${idx}`}
              className="group relative p-6 sm:p-8 bg-white/[0.02] border border-white/10 hover:border-white/25 transition-all duration-300"
            >
              {/* Top Accent Hover Line */}
              <div
                className="absolute top-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full"
                style={{ backgroundColor: benefit.accentColor }}
              />

              <div
                className="p-3 w-fit rounded-none mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${benefit.accentColor}12`,
                  border: `1px solid ${benefit.accentColor}30`,
                }}
              >
                {getIcon(benefit.iconName, benefit.accentColor)}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                {benefit.title}
              </h3>

              <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
