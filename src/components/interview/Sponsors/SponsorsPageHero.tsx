"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Sparkles, Compass } from "lucide-react";
import { verifiedSponsorStats } from "@/src/data/sponsors";

export default function SponsorsPageHero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      aria-label="Sponsors and Partners Hero"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10 select-none pt-16 pb-20 md:pt-24 md:pb-28"
    >
      {/* Cinematic Photographic Background Asset with Dark Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <Image
          src="/images/partnerships/hero_ecosystem.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-35 mix-blend-screen scale-[1.02]"
        />
        {/* Dark readability overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-[#050708]/80 to-[#050708]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_20%,_#050708_75%)]" />
      </div>

      {/* Subtle Ambient Emerald & Cyan Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] opacity-20 blur-[130px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(53,217,138,0.5) 0%, rgba(24,200,237,0.2) 50%, transparent 80%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Top Eyebrow Tag */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-6">
          <span>01</span>
          <span>&bull;</span>
          <span className="text-white">PARTNERSHIPS & COLLABORATION</span>
          <span className="text-neutral-500">|</span>
          <span className="arabic text-sm text-neutral-400">
            بناء شراكات حقيقية تمكّن الطلاب المبتكرين
          </span>
        </div>

        {/* Main Editorial Headline */}
        <div className="max-w-4xl mb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-[-0.035em] leading-[1.05] text-white">
            Build something
            <br />
            <span className="bg-gradient-to-r from-[#35d98a] via-[#18c8ed] to-[#9b7cff] bg-clip-text text-transparent">
              that matters.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-neutral-300 font-light leading-relaxed max-w-2xl">
            We collaborate with technology companies, educational platforms,
            developer communities, and industry leaders to give university
            students real-world experience, production-grade tools, and
            professional mentorship.
          </p>

          <p className="arabic mt-3 text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
            نتعاون مع الشركات التقنية والمؤسسات التعليمية والمجتمعات الرائدة
            لتوفير أدوات حقيقية وفرص تدريب عملية لمهندسي ومطوري المستقبل في مصر.
          </p>
        </div>

        {/* Primary & Secondary Call-to-Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-14">
          <button
            type="button"
            onClick={() => scrollTo("inquiry")}
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-[#35d98a] hover:bg-[#40f09b] text-[#050708] font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(53,217,138,0.25)] hover:shadow-[0_0_40px_rgba(53,217,138,0.45)] focus:outline-none focus:ring-2 focus:ring-[#35d98a]"
          >
            <Sparkles size={16} />
            <span>Become a Partner</span>
            <ArrowRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>

          <button
            type="button"
            onClick={() => scrollTo("opportunities")}
            className="group inline-flex items-center gap-2.5 px-6 py-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/35 text-white font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
          >
            <Compass size={15} className="text-neutral-400 group-hover:text-white" />
            <span>Explore Opportunities</span>
          </button>
        </div>

        {/* Verified Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-5 bg-white/[0.02] border border-white/10 max-w-4xl">
          {verifiedSponsorStats.map((stat, idx) => (
            <div
              key={`stat-${idx}`}
              className="p-3 border border-white/5 bg-black/40"
            >
              <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
                {stat.value}
              </div>
              <div className="mt-1 font-mono text-[11px] font-semibold tracking-widest text-neutral-400 uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
