"use client";

import React from "react";
import { Search, X } from "lucide-react";
import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/src/data/events";

interface EventsToolbarProps {
  selectedCategory: EventCategory | "all";
  onSelectCategory: (category: EventCategory | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryCounts: Record<string, number>;
}

export default function EventsToolbar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  categoryCounts,
}: EventsToolbarProps) {
  return (
    <div className="w-full border-b border-white/10 bg-[#050708]/90 backdrop-blur-md sticky top-16 z-30 py-4">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {EVENT_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.id] ?? 0;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 text-xs font-mono font-medium tracking-wider uppercase transition-all duration-200 shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/40 ${
                  isSelected
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/[0.02] text-neutral-400 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {/* Active indicator line */}
                {isSelected && (
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: cat.accentColor }}
                  />
                )}

                <span>{cat.label}</span>

                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-xs font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-neutral-500 group-hover:text-neutral-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, topics, or roles..."
            className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-[#35d98a] text-xs text-white pl-9 pr-8 py-2 rounded-none placeholder:text-neutral-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 cursor-pointer"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
