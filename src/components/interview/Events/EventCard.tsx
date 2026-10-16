"use client";

import React from "react";
import Image from "next/image";
import { MapPin, ArrowUpRight, Layers } from "lucide-react";
import { type EventItem } from "@/src/data/events";

interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(event);
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelect(event)}
      onKeyDown={handleKeyDown}
      className="group relative flex flex-col justify-between bg-white/[0.02] border border-white/10 hover:border-white/30 transition-all duration-300 text-left cursor-pointer overflow-hidden focus:outline-none focus:ring-1 focus:ring-white/50"
    >
      {/* Top Accent Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300 group-hover:h-[3.5px]"
        style={{ backgroundColor: event.accentColor }}
      />

      {/* Visual Header / Cover Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950 border-b border-white/10">
        <Image
          src={event.coverImage || "/spotlight-stage.webp"}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover opacity-50 group-hover:opacity-75 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050708] via-transparent to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
          <span
            className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest uppercase border backdrop-blur-md"
            style={{
              color: event.accentColor,
              borderColor: `${event.accentColor}50`,
              backgroundColor: "rgba(5, 7, 8, 0.8)",
            }}
          >
            {event.categoryLabel}
          </span>

          <span className="px-2 py-0.5 text-[10px] font-mono text-neutral-300 bg-black/75 border border-white/10 backdrop-blur-md">
            {event.date}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
        <div>
          {/* Track Affiliation pill */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
            <Layers size={12} style={{ color: event.accentColor }} />
            <span>{event.trackAffiliation}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-white transition-colors leading-snug">
            {event.title}
          </h3>

          {/* Arabic Subtitle */}
          <h4 className="arabic text-sm text-white/50 mt-1 mb-3">
            {event.arabicTitle}
          </h4>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed mb-4 line-clamp-3">
            {event.shortDescription}
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
          {/* Location & Role */}
          <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400 gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin size={12} className="shrink-0" style={{ color: event.accentColor }} />
              <span className="truncate">{event.location}</span>
            </div>

            <span className="font-semibold" style={{ color: event.accentColor }}>
              {event.role}
            </span>
          </div>

          {/* Tags & Action trigger */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {event.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={`${event.id}-tag-${idx}`}
                  className="px-1.5 py-0.5 text-[9px] font-mono text-neutral-400 bg-white/5 border border-white/5"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div
              className="flex items-center gap-1 text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-300 group-hover:gap-1.5"
              style={{ color: event.accentColor }}
            >
              <span>DETAILS</span>
              <ArrowUpRight size={13} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
