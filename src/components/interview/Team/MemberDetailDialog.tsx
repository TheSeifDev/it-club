"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { TeamMember } from "@/src/components/interview/committee-data";

export interface MemberDetailDialogProps {
  member: TeamMember | null;
  onClose: () => void;
}

export const MemberDetailDialog = ({
  member,
  onClose,
}: MemberDetailDialogProps) => {
  useEffect(() => {
    if (!member) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [member, onClose]);

  if (!member) return null;

  const countryLabel = member.countryName || "EGYPT";
  const countryFlag = member.countryFlag || "🇪🇬";

  const formatRoleTitle = () => {
    if (
      member.committee &&
      member.committee !== "IT Club" &&
      member.committee !== "PENDING_VERIFICATION"
    ) {
      return `${member.role} of ${member.committee}`;
    }
    if (member.committee === "IT Club") {
      return `${member.role} of IT Club`;
    }
    return member.role || "Leader";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden bg-[#0c0f12] border border-white/10 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-20 p-2 text-neutral-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Portrait Column */}
          <div className="relative aspect-3/4 sm:w-1/2 shrink-0 bg-neutral-900 overflow-hidden">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.name}
                fill
                sizes="(max-width: 640px) 100vw, 250px"
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-700">
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
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Details Column */}
          <div className="p-6 flex flex-col justify-between sm:w-1/2">
            <div>
              {/* Country */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium tracking-[0.16em] uppercase text-neutral-400 mb-2">
                <span className="text-sm select-none" aria-hidden="true">
                  {countryFlag}
                </span>
                <span>{countryLabel}</span>
              </div>

              {/* Name */}
              <h2
                id="member-modal-title"
                className="text-2xl font-bold tracking-tight text-white"
              >
                {member.name}
              </h2>

              {/* Emerald Accent Line */}
              <div className="w-8 h-[2px] bg-[#35d98a] my-3" />

              {/* Role */}
              <p className="text-sm text-neutral-300 font-medium">
                {formatRoleTitle()}
              </p>

              {/* Committee */}
              <p className="text-xs font-bold font-mono tracking-wider text-[#35d98a] uppercase mt-1">
                {member.committee}
              </p>

              {/* Review status if applicable */}
              {member.needsReview && (
                <div className="mt-4 p-2.5 bg-white/5 border border-white/10 text-[11px] text-neutral-400">
                  <span className="text-neutral-300 font-semibold block mb-0.5">
                    Assignment Note:
                  </span>
                  {member.reviewNotes || "Role pending official committee confirmation."}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
              <span>IT CLUB LEADERSHIP</span>
              <span>2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
