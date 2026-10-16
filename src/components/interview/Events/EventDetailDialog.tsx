"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Calendar,
  MapPin,
  Layers,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { type EventItem } from "@/src/data/events";

interface EventDetailDialogProps {
  event: EventItem | null;
  onClose: () => void;
}

export default function EventDetailDialog({
  event,
  onClose,
}: EventDetailDialogProps) {
  const [prevEvent, setPrevEvent] = useState<EventItem | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isClosingRef = useRef(false);

  // Sync state during render when event changes
  if (event !== prevEvent) {
    setPrevEvent(event);
    if (!event) {
      setIsEntering(false);
    }
  }

  useEffect(() => {
    if (!event) return;

    isClosingRef.current = false;
    const raf = requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => cancelAnimationFrame(raf);
  }, [event]);

  // Handle coordinated closing
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsEntering(false);
    setTimeout(() => {
      isClosingRef.current = false;
      onClose();
    }, 250);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (event || isEntering) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [event, isEntering]);

  // Handle Escape key
  useEffect(() => {
    if (!event && !isEntering) return;

    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [event, isEntering, handleClose]);

  if (!event) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-300 ${
          isEntering ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Dialog Modal Container */}
      <div
        className={`relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#080a0c] border border-white/15 text-white shadow-2xl transition-all duration-300 ${
          isEntering ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Accent Top Border */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ backgroundColor: event.accentColor }}
        />

        {/* Close Button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-white bg-black/50 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Cover Banner (if available) */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-neutral-950 border-b border-white/10">
          <Image
            src={event.coverImage || "/spotlight-stage.webp"}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover opacity-45 mix-blend-screen scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a0c] via-[#080a0c]/40 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center gap-2">
            <span
              className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-widest uppercase border backdrop-blur-md"
              style={{
                color: event.accentColor,
                borderColor: `${event.accentColor}50`,
                backgroundColor: "rgba(5,7,8,0.85)",
              }}
            >
              {event.categoryLabel}
            </span>

            <span className="px-2.5 py-1 text-[10px] font-mono text-neutral-200 bg-black/80 border border-white/10">
              {event.date}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-2">
              <Layers size={13} style={{ color: event.accentColor }} />
              <span className="uppercase tracking-wider">{event.trackAffiliation}</span>
            </div>

            <h2
              id="event-dialog-title"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight"
            >
              {event.title}
            </h2>

            <h3 className="arabic mt-1 text-lg sm:text-xl font-medium text-white/50">
              {event.arabicTitle}
            </h3>
          </div>

          {/* Quick Details Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white/[0.02] border border-white/10 font-mono text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Calendar size={14} style={{ color: event.accentColor }} />
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">DATE</div>
                <div className="font-semibold">{event.date}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin size={14} style={{ color: event.accentColor }} />
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">VENUE</div>
                <div className="font-semibold truncate">{event.location}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-neutral-300">
              <Sparkles size={14} style={{ color: event.accentColor }} />
              <div>
                <div className="text-[10px] text-neutral-500 uppercase">CLUB ROLE</div>
                <div className="font-semibold" style={{ color: event.accentColor }}>
                  {event.role}
                </div>
              </div>
            </div>
          </div>

          {/* Event Overview */}
          <div>
            <div className="flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-neutral-400 uppercase mb-3">
              <span>EVENT OVERVIEW</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed">
              {event.fullDescription}
            </p>
          </div>

          {/* Outcomes & Highlights (if available) */}
          {event.highlights && event.highlights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 font-mono text-xs tracking-[0.16em] text-neutral-400 uppercase mb-3">
                <span>KEY HIGHLIGHTS & OUTCOMES</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <ul className="space-y-2.5">
                {event.highlights.map((highlight, idx) => (
                  <li
                    key={`highlight-${idx}`}
                    className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5"
                  >
                    <CheckCircle2
                      size={16}
                      className="shrink-0 mt-0.5"
                      style={{ color: event.accentColor }}
                    />
                    <span className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          <div className="pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {event.tags.map((tag, idx) => (
                <span
                  key={`tag-${idx}`}
                  className="px-2.5 py-1 text-[11px] font-mono text-neutral-400 bg-white/5 border border-white/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Callout (if available) */}
          {event.externalLink && (
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs font-mono text-neutral-400">
                Official registration & intake workflows:
              </span>

              <Link
                href={event.externalLink}
                onClick={handleClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 font-bold text-xs font-mono tracking-wider uppercase transition-all duration-300"
                style={{
                  backgroundColor: event.accentColor,
                  color: "#050708",
                }}
              >
                <span>OPEN REGISTRATION</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
