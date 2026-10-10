"use client";

import React from "react";
import { Search, X, Filter } from "lucide-react";
import { COMMITTEES } from "@/src/components/interview/committee-data";

export interface CommunityToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCommittee: string;
  onCommitteeChange: (committee: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const ROLE_OPTIONS = [
  { label: "All Roles", value: "ALL" },
  { label: "Heads", value: "HEAD" },
  { label: "Vice Heads", value: "VICE HEAD" },
  { label: "Leaders", value: "LEADER" },
  { label: "Main Team", value: "MAIN" },
] as const;

export function CommunityToolbar({
  searchQuery,
  onSearchChange,
  selectedCommittee,
  onCommitteeChange,
  selectedRole,
  onRoleChange,
  onResetFilters,
  filteredCount,
  totalCount,
}: CommunityToolbarProps) {
  const isFiltered =
    searchQuery.trim().length > 0 ||
    selectedCommittee !== "ALL" ||
    selectedRole !== "ALL";

  return (
    <div className="w-full bg-[#050708] border-b border-white/10 py-6">
      <div className="mx-auto w-full max-w-[1520px] px-6 md:px-10 lg:px-12 flex flex-col gap-5">
        {/* Top line of toolbar: Search bar + Role selector + Result Count */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <label htmlFor="community-search" className="sr-only">
              Search community members by name, committee, or role
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
              <Search size={16} aria-hidden="true" />
            </div>

            <input
              id="community-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search members by name, committee, or role..."
              className="w-full bg-[#0e1215] border border-white/10 pl-10 pr-9 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#42e895] focus:ring-1 focus:ring-[#42e895] transition-all"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search query"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Controls Right: Role Select & Result Counter & Reset */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter Selector */}
            <div className="relative">
              <label htmlFor="role-select" className="sr-only">
                Filter by Role
              </label>
              <select
                id="role-select"
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value)}
                className="bg-[#0e1215] border border-white/10 px-3.5 py-2.5 text-xs sm:text-sm font-mono uppercase text-neutral-300 focus:outline-none focus:border-[#42e895] focus:ring-1 focus:ring-[#42e895] transition-all cursor-pointer"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0e1215] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear All Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-[#42e895] border border-white/10 hover:border-[#42e895]/30 bg-white/5 transition-all cursor-pointer"
              >
                <X size={13} />
                <span>Reset</span>
              </button>
            )}

            {/* Result Counter */}
            <div className="ml-auto md:ml-2 flex items-center gap-2 font-mono text-xs tracking-[0.16em] uppercase text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#42e895]" />
              <span>
                {filteredCount} {filteredCount === 1 ? "MEMBER" : "MEMBERS"}
                {filteredCount !== totalCount && (
                  <span className="text-neutral-500"> / {totalCount}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom line of toolbar: Committee Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [scrollbar-width:none]">
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-neutral-500 shrink-0 mr-1 hidden sm:inline-flex">
            <Filter size={12} />
            COMMITTEES:
          </span>

          {/* "All" Committee Pill */}
          <button
            type="button"
            onClick={() => onCommitteeChange("ALL")}
            className={`shrink-0 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              selectedCommittee === "ALL"
                ? "bg-[#42e895] text-[#050708] font-bold shadow-[0_0_15px_rgba(66,232,149,0.25)]"
                : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            All Committees
          </button>

          {/* Specific Committee Pills */}
          {COMMITTEES.map((comm) => {
            const isSelected = selectedCommittee.toLowerCase() === comm.toLowerCase();
            return (
              <button
                key={comm}
                type="button"
                onClick={() => onCommitteeChange(comm)}
                className={`shrink-0 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#42e895] text-[#050708] font-bold shadow-[0_0_15px_rgba(66,232,149,0.25)]"
                    : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                {comm}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
