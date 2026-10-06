"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const TARGET_DATE = new Date("2026-10-10T00:00:00").getTime();

function getDaysRemaining() {
  const difference = TARGET_DATE - Date.now();

  if (difference <= 0) {
    return 0;
  }

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

export default function JoinSection() {
  const [days, setDays] = useState(getDaysRemaining);

  useEffect(() => {
    const updateCountdown = () => {
      setDays(getDaysRemaining());
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="join"
      className="w-full border-t border-white/10 bg-[#050708] text-white"
    >
      <div className="mx-auto w-full max-w-342.5 px-6 py-28 md:px-10 lg:px-0 lg:py-36">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_240px] lg:gap-24">
          {/* Main CTA */}
          <div>
            <h2 className="max-w-190 text-[52px] font-bold leading-[0.9] tracking-tighter md:text-[72px] lg:text-[88px]">
              Your place is
              <br />
              waiting.
              <br />
              <span className="text-[#42e895]">Join IT Club.</span>
            </h2>

            <p className="arabic mt-8 max-w-155 text-[18px] leading-[1.8] text-[#8f969d]">
              مكانك مستنيك.
              <br />
              ابدأ رحلتك مع نادي تكنولوجيا المعلومات.
            </p>

            <Link
              href="/apply"
              className="group mt-12 flex h-14 w-full items-center justify-center gap-3 bg-[#42e895] px-8 text-sm font-bold text-[#050708] transition-all duration-300 hover:brightness-110 lg:max-w-190"
            >
              APPLY NOW
              <ArrowRight
                size={19}
                strokeWidth={2}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>

          {/* Countdown */}
          <div className="flex flex-col lg:items-end lg:text-right">
            <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-white/35">
              APPLICATIONS
            </span>

            <div className="mt-4 flex items-end lg:flex-col lg:items-end">
              <span className="text-[82px] font-bold leading-[0.82] tracking-[-0.06em] md:text-[100px]">
                {days}
              </span>

              <span className="ml-4 pb-1 text-[22px] font-bold leading-none md:text-[25px] lg:ml-0 lg:mt-5">
                days left
              </span>
            </div>

            <span className="arabic mt-7 text-[19px] text-[#737a82]">
              التقديم مفتوح
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}