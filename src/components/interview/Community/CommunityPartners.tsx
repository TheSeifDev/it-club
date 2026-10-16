"use client";

import React from "react";
import { Handshake } from "lucide-react";
import { approvedCommunityPartners } from "@/src/data/sponsors";

export function CommunityPartners() {
  return (
    <section
      id="community-partners"
      aria-labelledby="community-partners-heading"
      className="w-full border-t border-white/10 bg-[#050708] py-16 sm:py-20 lg:py-24 text-white"
    >
      <div className="mx-auto w-full max-w-[1520px] px-6 md:px-10 lg:px-12">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-4">
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a]">
            COMMUNITY PARTNERS · شركاء المجتمع
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2
              id="community-partners-heading"
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight"
            >
              Approved <span className="text-[#35d98a]">Partners.</span>
            </h2>
            <p className="mt-2 text-base text-[#aeb4bb] max-w-xl font-sans">
              Collaborating with verified innovation and ecosystem partners to support student builders.
            </p>
          </div>

          <p className="arabic text-sm text-neutral-400 font-medium" dir="rtl">
            المنظمات والجهات الشريكة المعتمدة لمجتمع نادي تكنولوجيا المعلومات
          </p>
        </div>

        {/* Balanced Two-Partner Layout: Desktop Side-by-Side, Mobile Stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {approvedCommunityPartners.map((partner) => (
            <div
              key={partner.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#080b0e] p-8 sm:p-10 transition-all duration-300 hover:border-[#35d98a]/40 hover:shadow-[0_0_30px_rgba(53,217,138,0.08)]"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-2xl bg-transparent transition-colors duration-300 group-hover:bg-[#35d98a]" />

              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#35d98a]">
                    COMMUNITY PARTNER
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-neutral-400 group-hover:text-[#35d98a] group-hover:border-[#35d98a]/30 transition-colors">
                    <Handshake size={18} />
                  </div>
                </div>

                {/* Restrained Typographic Presentation */}
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white group-hover:text-[#35d98a] transition-colors">
                  {partner.name}
                </h3>

                {partner.arabicName && (
                  <p className="arabic text-base sm:text-lg text-neutral-400 font-medium mt-1.5" dir="rtl">
                    {partner.arabicName}
                  </p>
                )}
              </div>

              <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span>VERIFIED PARTNER</span>
                <span className="text-[#35d98a]">&bull; ACTIVE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommunityPartners;
