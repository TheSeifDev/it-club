"use client";

import React from "react";
import Image from "next/image";
import { ExternalLink, Handshake } from "lucide-react";
import { verifiedPartners, type Sponsor } from "@/src/data/sponsors";

interface LogoCardProps {
  sponsor: Sponsor;
}

function LogoCard({ sponsor }: LogoCardProps) {
  const content = (
    <div className="group relative flex h-36 sm:h-40 flex-col items-center justify-between border border-white/10 bg-[#080b0d] p-6 transition-all duration-300 hover:border-[#35d98a]/40 hover:bg-[#0c1013] hover:shadow-[0_0_25px_rgba(53,217,138,0.08)]">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent transition-colors duration-300 group-hover:bg-[#35d98a]" />

      <div className="relative flex h-16 w-full items-center justify-center">
        <Image
          src={sponsor.logo}
          alt={`${sponsor.name} logo`}
          width={180}
          height={60}
          className="h-10 w-auto max-w-[85%] object-contain opacity-75 grayscale contrast-125 transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105"
        />
      </div>

      <div className="text-center w-full">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400 group-hover:text-white transition-colors block font-semibold">
          {sponsor.tierLabel || sponsor.name}
        </span>
        <span className="text-[11px] text-neutral-500 font-light truncate block mt-0.5">
          {sponsor.description}
        </span>
      </div>

      {sponsor.website && (
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 text-neutral-600 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-[#35d98a]"
        >
          <ExternalLink size={12} />
        </span>
      )}
    </div>
  );

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${sponsor.name} website (opens in new tab)`}
        className="block focus:outline-none focus:ring-1 focus:ring-[#35d98a]"
      >
        {content}
      </a>
    );
  }

  return content;
}

export function SponsorsDirectory() {
  const scrollToInquiry = () => {
    const el = document.getElementById("inquiry");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      id="directory"
      aria-label="Verified Partners and Collaborators"
      className="w-full border-b border-white/10 bg-[#050708] py-20 md:py-28 text-white"
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a] mb-4">
          <span>04</span>
          <span>&bull;</span>
          <span className="text-white">VERIFIED COLLABORATORS</span>
          <span className="text-neutral-500">|</span>
          <span className="arabic text-sm text-neutral-400">
            الشركاء والمساحات الداعمة
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
              Organizations that
              <br />
              <span className="text-neutral-400">support our mission.</span>
            </h2>
          </div>

          <div className="lg:col-span-4">
            <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
              We collaborate with innovation hubs and creative spaces across
              Egypt to host hackathons, technical sessions, and community events.
            </p>
          </div>
        </div>

        {/* Real Logos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {verifiedPartners.map((partner) => (
            <LogoCard key={partner.id} sponsor={partner} />
          ))}

          {/* Become a Partner Card */}
          <button
            type="button"
            onClick={scrollToInquiry}
            className="group relative flex h-36 sm:h-40 flex-col items-center justify-center border border-dashed border-[#35d98a]/30 bg-[#06110a]/40 p-6 transition-all duration-300 hover:border-[#35d98a] hover:bg-[#06110a]/80 cursor-pointer text-center w-full focus:outline-none focus:ring-1 focus:ring-[#35d98a]"
          >
            <div className="flex items-center gap-2 text-[#35d98a] font-mono text-xs font-bold uppercase tracking-wider mb-1.5">
              <Handshake size={16} />
              <span>Partner With IT Club</span>
            </div>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400 group-hover:text-white transition-colors">
              START A COLLABORATION &rarr;
            </span>
          </button>
        </div>

        <p className="text-xs text-neutral-500 font-light max-w-xl">
          * Confirmed community &amp; venue partners. All other categories listed on
          this page describe potential collaboration pathways open for discussion.
        </p>
      </div>
    </section>
  );
}

export default SponsorsDirectory;
