"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function ProcessFinalCTA() {
  return (
    <section
      aria-label="Final Application Call to Action"
      className="relative w-full overflow-hidden bg-[#050708] text-white py-24 md:py-32"
    >
      {/* Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[320px] opacity-15 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse at bottom, #00e599 0%, #18c8ed 50%, transparent 75%)",
        }}
      />

      <div className="relative tracks-content-container">
        <div className="p-8 sm:p-12 lg:p-16 bg-[#080a0c] border border-white/10 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-[#00e599]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Headline (Col 1-8) */}
            <div className="lg:col-span-8">
              <div className="font-mono text-xs font-bold tracking-[0.2em] text-[#00e599] uppercase mb-3">
                06 • READY TO TAKE THE FIRST STEP?
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-white">
                Your journey starts
                <br />
                with a single application.
              </h2>

              <p className="arabic mt-3 text-base sm:text-lg text-neutral-300 font-medium">
                ابدأ رحلتك معنا اليوم. التقديم مفتوح لكل من يريد أن يتعلم ويبني ويترك أثراً حقيقياً.
              </p>

              <p className="mt-4 text-xs sm:text-sm text-neutral-400 font-light leading-relaxed max-w-xl">
                Choose your track, fill out your application, and take the first step toward working on real projects alongside an ambitious community of peers and mentors.
              </p>
            </div>

            {/* Right Buttons (Col 9-12) */}
            <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-4">
              <Link
                href="/register"
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#00e599] hover:bg-[#3af0ad] text-[#050708] font-bold text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_30px_rgba(0,229,153,0.3)] hover:shadow-[0_0_45px_rgba(0,229,153,0.5)]"
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/15 hover:border-white/35 bg-white/[0.02] text-xs font-mono font-bold tracking-wider uppercase text-neutral-300 hover:text-white transition-all"
              >
                <span>Review All Six Tracks</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
