"use client";

import React from "react";
import type { TeamMember } from "@/src/components/interview/committee-data";
import { CommunityCard } from "./CommunityCard";

export interface CommunityGridProps {
  members: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
  className?: string;
  onResetFilters?: () => void;
}

export function CommunityGrid({
  members,
  onSelectMember,
  className = "",
  onResetFilters,
}: CommunityGridProps) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-4">
          <span className="font-mono text-lg font-bold">∅</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No members match your criteria</h3>
        <p className="text-sm text-neutral-400 max-w-md mb-6">
          Try adjusting your search terms or clearing current committee and role filters.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-[#42e895] text-[#050708] hover:bg-[#6af0ad] transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-4.5 ${className}`}
    >
      {members.map((member, index) => (
        <CommunityCard
          key={member.id}
          id={`community-card-${member.id}`}
          member={member}
          priority={index < 6}
          onSelect={onSelectMember}
        />
      ))}
    </div>
  );
}
