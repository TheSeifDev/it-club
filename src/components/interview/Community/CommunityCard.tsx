"use client";

import Image from "next/image";
import type { TeamMember } from "@/src/components/interview/committee-data";
import {
  formatRoleMetadata,
  formatCommitteeMetadata,
} from "@/src/components/interview/committee-data";
import { CountryFlag } from "@/src/components/interview/Team/CountryFlag";

export interface CommunityCardProps {
  member: TeamMember;
  priority?: boolean;
  onSelect?: (member: TeamMember) => void;
  id?: string;
}

export function CommunityCard({
  member,
  priority = false,
  onSelect,
  id,
}: CommunityCardProps) {
  const countryLabel = member.countryName || "EGYPT";
  const roleLine = formatRoleMetadata(
    member.role,
    member.committee,
    member.needsReview
  );
  const committeeLine = formatCommitteeMetadata(member.committee);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && onSelect) {
      e.preventDefault();
      onSelect(member);
    }
  };

  return (
    <article
      id={id ?? `community-card-${member.id}`}
      tabIndex={0}
      role="button"
      onClick={() => onSelect?.(member)}
      onKeyDown={handleKeyDown}
      aria-label={`${member.name}, ${roleLine}${committeeLine ? ` in ${committeeLine}` : ""}`}
      className="group relative aspect-3/4 w-full overflow-hidden bg-transparent select-none rounded-none border-0 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35d98a] focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer"
    >
      {/* Member Portrait */}
      {member.image ? (
        <Image
          src={member.image}
          alt={`${member.name} — ${roleLine}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16.6vw"
          className="object-cover object-top filter grayscale contrast-[1.05] transition-all duration-300 ease-out group-hover:grayscale-0 group-hover:contrast-100 group-hover:scale-[1.02] group-focus-visible:grayscale-0 group-focus-visible:scale-[1.02] motion-reduce:transition-none motion-reduce:transform-none"
          priority={priority}
          loading={priority ? undefined : "lazy"}
        />
      ) : (
        /* Silhouette Fallback */
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 text-neutral-700">
          <svg
            viewBox="0 0 100 133"
            className="h-3/4 w-full text-neutral-800"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="50" cy="42" r="19" />
            <path d="M8 133c0-30 18-46 42-46s42 16 42 46z" />
          </svg>
        </div>
      )}

      {/* Subtle top vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-black/40 to-transparent"
      />

      {/* Dark bottom gradient overlay ensuring 100% legibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/95 via-black/55 via-40% to-transparent transition-all duration-300 ease-out group-hover:from-black/95 group-hover:via-black/70 group-focus-visible:from-black/95 group-focus-visible:via-black/70"
      />

      {/* Card Content & Metadata */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 md:p-4 flex flex-col justify-end pointer-events-none">
        {/* On-hover emerald accent bar */}
        <div
          aria-hidden="true"
          className="w-6 h-[2px] bg-[#42e895] mb-2 transform origin-left transition-all duration-300 ease-out opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 group-focus-visible:opacity-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
        />

        {/* Country Flag & Label */}
        <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] font-mono font-medium tracking-[0.16em] uppercase text-neutral-400 mb-0.5">
          <CountryFlag
            countryCode={member.countryCode || "EG"}
            countryName={countryLabel}
            className="w-3.5 h-auto aspect-3/2 shrink-0 rounded-[1px] shadow-xs"
          />
          <span className="truncate">{countryLabel}</span>
        </div>

        {/* Member Name */}
        <h3 className="font-sans text-xs sm:text-sm lg:text-[15px] font-bold text-white tracking-tight leading-snug line-clamp-1">
          {member.name}
        </h3>

        {/* Role & Committee line (Visible or enhanced on hover/focus, accessible on touch) */}
        <div className="pt-0.5 flex flex-col gap-0.5">
          <p className="text-neutral-400 text-[9.5px] sm:text-[10px] font-mono font-medium tracking-[0.12em] uppercase truncate">
            {roleLine}
          </p>

          {committeeLine && (
            <p className="text-[#42e895] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase truncate opacity-90 group-hover:opacity-100 transition-opacity">
              {committeeLine}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
