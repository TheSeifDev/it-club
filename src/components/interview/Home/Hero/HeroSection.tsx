"use client";

import { useEffect, useState } from "react";

import { SpeakerColumns } from "./SpeakerColumns";
import { TracksTicker } from "./TracksTicker";
import {
  TARGET_DATE,
  stats,
} from "./hero-data";

const pad = (value: number) =>
  String(value).padStart(2, "0");

export default function HeroSection() {
  const [time, setTime] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
  });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(
        0,
        TARGET_DATE - Date.now(),
      );

      setTime({
        d: Math.floor(diff / 86_400_000),
        h: Math.floor(
          (diff / 3_600_000) % 24,
        ),
        m: Math.floor(
          (diff / 60_000) % 60,
        ),
        s: Math.floor(
          (diff / 1000) % 60,
        ),
      });
    };

    tick();

    const interval = setInterval(
      tick,
      1000,
    );

    return () => clearInterval(interval);
  }, []);

  const timer = [
    {
      value: String(time.d),
      unit: "d",
    },
    {
      value: pad(time.h),
      unit: "h",
    },
    {
      value: pad(time.m),
      unit: "m",
    },
    {
      value: pad(time.s),
      unit: "s",
    },
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="relative h-[94vh] min-h-135 w-full overflow-hidden bg-[#0a0d10] text-white"
    >
      <style>{`
        @keyframes hero-col-up {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(-50%);
          }
        }

        @keyframes hero-col-down {
          from {
            transform: translateY(-50%);
          }

          to {
            transform: translateY(0);
          }
        }

        @keyframes hero-ticker {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }

        .hero-col-up {
          animation: hero-col-up linear infinite;
        }

        .hero-col-down {
          animation: hero-col-down linear infinite;
        }

        .hero-ticker {
          animation: hero-ticker 35s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-col-up,
          .hero-col-down,
          .hero-ticker {
            animation: none;
          }
        }
      `}</style>

      {/* Scrolling speaker columns */}
      <SpeakerColumns />

      {/* Dim overlays */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/35"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-black/60 via-black/25 to-transparent"
      />

      {/* Left Content */}
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-17 md:px-16 lg:px-50">
        <p className="arabic mb-3 text-4xl md:text-5xl">
          نادي تكنولوجيا المعلومات
        </p>

        <h1
          id="hero-title"
          className="text-5xl font-extrabold leading-[0.9] tracking-[-0.04em] md:text-6xl lg:text-6xl"
        >
          <span className="block">
            IT CLUB IS
          </span>

          <span className="block">
            LOOKING FOR REAL{" "}
            <span className="text-[#35d98a] transition-all duration-300 hover:[text-shadow:0_0_28px_rgba(53,217,138,0.35)]">
              BUILDERS
            </span>.
          </span>
        </h1>

        <p className="mt-8 text-[28px] font-bold leading-none tracking-tight">
          10 – 31 October 2026
        </p>

        {/* Countdown */}
        <div
          className="mt-5 flex items-baseline gap-3"
          aria-label="Countdown to event"
        >
          <span className="font-mono text-[10px] tracking-[0.2em] text-neutral-300">
            on unv in
          </span>

          <div className="flex items-baseline gap-2 text-3xl font-bold leading-none tabular-nums">
            {timer.map((item) => (
              <span key={item.unit}>
                {item.value}

                <span className="text-sm font-normal text-neutral-400">
                  {item.unit}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex w-fit gap-19 border-t border-white/15 pt-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold leading-none">
                {stat.value}
              </p>

              <p className="mt-1.5 font-mono text-[8px] tracking-[0.15em] text-neutral-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-7">
          <button
            type="button"
            className="h-13 w-full cursor-pointer bg-[#42e895] text-sm font-semibold text-black transition hover:bg-[#6af0ad] sm:w-70"
          >
            Applay Now
          </button>

          <p className="mt-3 text-xs text-neutral-300">
            Registration is open. Secure your place
          </p>
        </div>
      </div>

      {/* Tracks Timeline */}
      <TracksTicker />
    </section>
  );
}