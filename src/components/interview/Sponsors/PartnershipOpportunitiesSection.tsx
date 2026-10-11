"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, PlusCircle } from "lucide-react";
import { PARTNERSHIP_OPPORTUNITIES } from "@/src/data/sponsors";

interface PartnershipOpportunitiesSectionProps {
  onSelectCategory?: (categoryId: string) => void;
}

export default function PartnershipOpportunitiesSection({
  onSelectCategory,
}: PartnershipOpportunitiesSectionProps) {
  const handleSelect = (categoryId: string) => {
    onSelectCategory?.(categoryId);
    const el = document.getElementById("inquiry");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="opportunities"
      aria-label="Partnership Opportunities"
      className="relative w-full overflow-hidden bg-[#050708] text-white border-b border-white/10 py-20 md:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-6">
        {/* =============================================================== */}
        {/* SECTION HEADER                                                  */}
        {/* =============================================================== */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-4">
          <span>02</span>
          <span>&bull;</span>
          <span className="text-white">PARTNERSHIP OPPORTUNITIES</span>
          <span className="text-neutral-500">|</span>
          <span className="arabic text-sm text-neutral-400">
            مجالات الشراكة والمساهمة
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
              Meaningful ways
              <br />
              <span className="text-neutral-400">to collaborate.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
              We structure collaborations around real contributions and mutual
              impact &mdash; not artificial tiers. Choose the area that aligns
              with your organization&apos;s resources and goals.
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* 6 OPPORTUNITY CARDS RESPONSIVE GRID                             */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PARTNERSHIP_OPPORTUNITIES.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col justify-between bg-[#080b0d] border border-white/10 hover:border-white/30 transition-all duration-300 overflow-hidden"
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] z-20 transition-all duration-300"
                style={{ backgroundColor: item.accentColor }}
              />

              {/* Photographic Header Asset */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-950 border-b border-white/10">
                <Image
                  src={item.bgImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-500"
                />
                {/* Gradient Readability Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080b0d] via-[#080b0d]/50 to-transparent" />

                {/* Category Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span
                    className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase border backdrop-blur-md"
                    style={{
                      color: item.accentColor,
                      borderColor: `${item.accentColor}50`,
                      backgroundColor: "rgba(5, 7, 8, 0.85)",
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1">
                <div>
                  {/* Category Label & Subtitle */}
                  <div className="text-xs font-mono font-medium tracking-wider text-neutral-400 uppercase mb-1">
                    {item.categoryLabel}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-white transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <h4 className="arabic text-sm font-medium text-white/50 mt-1 mb-4">
                    {item.arabicTitle}
                  </h4>

                  <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed mb-6">
                    {item.description}
                  </p>

                  {/* What Partner Contributes */}
                  <div className="mb-5 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-neutral-300 uppercase mb-3">
                      <PlusCircle size={13} style={{ color: item.accentColor }} />
                      <span>What You Could Contribute</span>
                    </div>

                    <ul className="space-y-2">
                      {item.contributions.map((c, i) => (
                        <li
                          key={`c-${i}`}
                          className="flex items-start gap-2 text-xs text-neutral-400 font-light leading-relaxed"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 rounded-none shrink-0"
                            style={{ backgroundColor: item.accentColor }}
                          />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What IT Club Offers */}
                  <div className="mb-6 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-neutral-300 uppercase mb-3">
                      <CheckCircle2 size={13} style={{ color: item.accentColor }} />
                      <span>What IT Club Offers</span>
                    </div>

                    <ul className="space-y-2">
                      {item.clubOffers.map((o, i) => (
                        <li
                          key={`o-${i}`}
                          className="flex items-start gap-2 text-xs text-neutral-300 font-light leading-relaxed"
                        >
                          <span
                            className="mt-1.5 h-1 w-1 rounded-none shrink-0"
                            style={{ backgroundColor: item.accentColor }}
                          />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA Trigger */}
                <div className="pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className="group/btn w-full inline-flex items-center justify-between px-4 py-3 text-xs font-mono font-bold tracking-wider uppercase transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/30 focus:outline-none focus:ring-1 focus:ring-white"
                    style={{
                      backgroundColor: `${item.accentColor}10`,
                      color: item.accentColor,
                    }}
                  >
                    <span>{item.ctaLabel}</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-300 group-hover/btn:translate-x-1"
                    />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
