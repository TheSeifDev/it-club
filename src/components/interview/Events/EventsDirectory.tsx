"use client";

import React, { useState, useMemo } from "react";
import EventsHero from "./EventsHero";
import EventsToolbar from "./EventsToolbar";
import EventCard from "./EventCard";
import EventDetailDialog from "./EventDetailDialog";
import {
  IT_CLUB_EVENTS,
  type EventCategory,
  type EventItem,
} from "@/src/data/events";
import { Layers } from "lucide-react";

export default function EventsDirectory() {
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Compute category counts based on master dataset
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: IT_CLUB_EVENTS.length,
      organized: 0,
      attended: 0,
      workshops: 0,
      upcoming: 0,
    };

    IT_CLUB_EVENTS.forEach((e) => {
      if (counts[e.category] !== undefined) {
        counts[e.category] += 1;
      }
    });

    return counts;
  }, []);

  // Filter events based on active category and search query
  const filteredEvents = useMemo(() => {
    return IT_CLUB_EVENTS.filter((event) => {
      // 1. Category filter
      if (selectedCategory !== "all" && event.category !== selectedCategory) {
        return false;
      }

      // 2. Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesArabic = event.arabicTitle.toLowerCase().includes(query);
        const matchesDesc = event.shortDescription.toLowerCase().includes(query);
        const matchesRole = event.role.toLowerCase().includes(query);
        const matchesTrack = event.trackAffiliation.toLowerCase().includes(query);
        const matchesTags = event.tags.some((tag) =>
          tag.toLowerCase().includes(query)
        );

        if (
          !matchesTitle &&
          !matchesArabic &&
          !matchesDesc &&
          !matchesRole &&
          !matchesTrack &&
          !matchesTags
        ) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="w-full">
      {/* 1. Distinctive Events Hero with Featured Highlight */}
      <EventsHero onSelectEvent={(e) => setSelectedEvent(e)} />

      {/* 2. Category Filter & Search Toolbar */}
      <EventsToolbar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryCounts={categoryCounts}
      />

      {/* 3. Event Archive Grid */}
      <section
        aria-label="Events Directory Grid"
        className="mx-auto max-w-7xl px-6 py-12 md:py-16"
      >
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-white/10 bg-white/[0.01] p-8">
            <Layers size={36} className="text-neutral-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              No documented events found
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-6 font-light">
              No events matched the selected filter or search term. Try
              adjusting your query or switching categories.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 text-xs font-mono font-bold tracking-wider uppercase bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onSelect={(e) => setSelectedEvent(e)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Event Detail Modal Dialog */}
      <EventDetailDialog
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
