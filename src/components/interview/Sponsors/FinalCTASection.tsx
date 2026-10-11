"use client";

import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTASection() {
  const scrollToInquiry = () => {
    const el = document.getElementById("inquiry");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      aria-label="Partnership Final Call to Action"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-24 md:py-32 border-t border-white/10"
    >
      {/* Background Radial Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-25 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at bottom, rgba(53,217,138,0.4) 0%, rgba(24,200,237,0.15) 50%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 text-neutral-400 font-mono text-[11px] uppercase tracking-widest mb-6">
          <Sparkles size={13} className="text-[#35d98a]" />
          <span>COLLABORATIVE ECOSYSTEM</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white mb-6">
          Have something valuable
          <br />
          <span className="text-[#35d98a]">to contribute?</span>
        </h2>

        {/* Description */}
        <p className="text-base sm:text-lg text-neutral-300 font-light leading-relaxed max-w-2xl mx-auto mb-10">
          Whether it&apos;s software access, cloud quotas, engineering mentorship,
          hardware components, or community co-hosting &mdash; we welcome
          conversations with organizations that care about the next generation
          of builders.
        </p>

        {/* Action Button */}
        <div>
          <button
            type="button"
            onClick={scrollToInquiry}
            className="group inline-flex items-center justify-center gap-3 px-9 py-4 bg-[#35d98a] hover:bg-[#40f09b] text-[#050708] font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_30px_rgba(53,217,138,0.3)] hover:shadow-[0_0_45px_rgba(53,217,138,0.5)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#35d98a]"
          >
            <span>Start a Conversation</span>
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
