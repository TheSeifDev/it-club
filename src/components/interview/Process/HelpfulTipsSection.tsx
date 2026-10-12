"use client";

import React from "react";
import { Shield, FileText, Heart, CheckCircle } from "lucide-react";
import { HELPFUL_TIPS } from "./process-data";

const TIP_ICONS = {
  shield: Shield,
  "file-text": FileText,
  heart: Heart,
  "check-circle": CheckCircle,
};

export default function HelpfulTipsSection() {
  return (
    <section
      id="helpful-tips"
      aria-label="Helpful Tips for Applicants"
      className="relative w-full overflow-hidden text-white border-b border-white/10"
      style={{ background: "#050708" }}
    >
      <div className="relative tracks-content-container py-14 md:py-18">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase text-[#8f9ea0] mb-2">
            TIPS FOR A STRONG APPLICATION
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.025em] text-white">
            Helpful Tips
          </h2>
          <p className="arabic mt-1.5 text-base sm:text-lg font-semibold text-white/50">
            نصائح مهمة
          </p>
        </div>

        {/* 4 Compact Horizontal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HELPFUL_TIPS.map((tip) => {
            const Icon = TIP_ICONS[tip.icon as keyof typeof TIP_ICONS];
            return (
              <div
                key={tip.title}
                className="flex items-center gap-3.5 p-4 bg-[#0a0d10] border border-white/10 hover:border-white/20 transition-all duration-200 group"
                style={{ borderRadius: 0 }}
              >
                {/* Glowing icon box */}
                <div
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 duration-200"
                  style={{
                    borderColor: tip.color,
                    background: `${tip.color}15`,
                    boxShadow: `0 0 12px ${tip.color}25`,
                    borderRadius: "6px",
                  }}
                >
                  <Icon size={18} style={{ color: tip.color }} />
                </div>

                {/* Content: Title + Description */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-0.5 whitespace-nowrap">
                    {tip.title}
                  </h3>
                  <p className="text-[11px] text-[#8f9ea0] leading-[1.4] line-clamp-2">
                    {tip.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
