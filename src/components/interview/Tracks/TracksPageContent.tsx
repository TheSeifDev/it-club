"use client";

import React, { useEffect, useState } from "react";
import TracksHero from "./TracksHero";
import TrackDetailSection from "./TrackDetailSection";
import TrackOwnershipSection from "./TrackOwnershipSection";
import { IT_CLUB_TRACKS } from "./tracks-data";

const getInitialTrackId = (): string => {
  if (typeof window !== "undefined" && window.location.hash) {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    const matched = IT_CLUB_TRACKS.find(
      (t) => t.id === hash || t.anchorIds.includes(hash)
    );
    if (matched) return matched.id;
  }
  return "hr";
};

export default function TracksPageContent() {
  const [activeTrackId, setActiveTrackId] = useState<string>(getInitialTrackId);

  useEffect(() => {
    // If arriving with a hash, smooth-scroll to that track section
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      const matched = IT_CLUB_TRACKS.find(
        (t) => t.id === hash || t.anchorIds.includes(hash)
      );
      if (matched) {
        const el = document.getElementById(matched.id);
        if (el) {
          requestAnimationFrame(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }
      }
    }

    // Set up IntersectionObserver to update active track based on scroll position
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            const trackId = entry.target.id;
            const matched = IT_CLUB_TRACKS.find(
              (t) => t.id === trackId || t.anchorIds.includes(trackId)
            );
            if (matched) {
              setActiveTrackId(matched.id);
            }
          }
        });
      },
      {
        rootMargin: "-15% 0px -40% 0px",
        threshold: [0.25, 0.5],
      }
    );

    IT_CLUB_TRACKS.forEach((track) => {
      const element = document.getElementById(track.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="w-full">
      {/* Cinematic Hero with Converging Spotlights & 6-Track Selector */}
      <TracksHero
        activeTrackId={activeTrackId}
        onSelectTrack={(id) => setActiveTrackId(id)}
      />

      {/* 6 Dedicated Track Editorial Sections (Pages 1-6 Reference) */}
      <div className="w-full">
        {IT_CLUB_TRACKS.map((track, index) => (
          <TrackDetailSection
            key={track.id}
            track={track}
            isFirst={index === 0}
          />
        ))}
      </div>

      {/* Concluding Track Ownership Section (Page 7 Reference) */}
      <TrackOwnershipSection />
    </div>
  );
}
