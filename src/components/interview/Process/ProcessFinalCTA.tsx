"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function ProcessFinalCTA() {
  return (
    <section
      aria-label="Take the First Step — Final Call to Action"
      className="relative w-full overflow-hidden text-white"
      style={{ background: "#050708", minHeight: "360px" }}
    >
      {/* Full-section background: light paths image */}
      <div className="absolute inset-0">
        <Image
          src="/images/process-cta-lightpaths.webp"
          alt="Colorful light paths converging toward a glowing doorway"
          fill
          className="object-cover object-right"
          sizes="100vw"
          priority={false}
        />
        {/* Dark overlay so text stays readable on the left */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #050708 0%, #050708 40%, rgba(5,7,8,0.7) 65%, rgba(5,7,8,0.2) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative tracks-content-container py-20 md:py-28">
        <div className="max-w-xl">
          {/* Eyebrow */}
          <p className="font-mono text-[10px] font-bold tracking-[0.22em] uppercase text-[#00e599] mb-5">
            READY TO BEGIN?
          </p>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] leading-[1.06] text-white mb-3">
            Take the First Step
          </h2>

          {/* Arabic subtitle */}
          <p className="arabic text-lg font-semibold text-white/70 mb-5">
            ابدأ الآن
          </p>

          {/* Body copy */}
          <p className="text-sm text-[#8f9ea0] leading-[1.8] mb-8 max-w-sm">
            Join a community of passionate students, learn new skills, and make
            a real impact. We can&apos;t wait to see your application!
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#00e599] text-[#050708] font-bold text-sm tracking-wide uppercase hover:bg-[#3bf5ad] transition-colors duration-200 shadow-[0_0_30px_rgba(0,229,153,0.25)] hover:shadow-[0_0_45px_rgba(0,229,153,0.4)]"
              style={{ borderRadius: 0 }}
            >
              Register Now
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/tracks"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/20 font-bold text-xs tracking-widest uppercase text-white/70 hover:text-white hover:border-white/40 transition-colors duration-200"
              style={{ borderRadius: 0 }}
            >
              View Our Tracks
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
