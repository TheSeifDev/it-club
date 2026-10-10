"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getLegitimateMembers,
  type TeamMember,
} from "@/src/components/interview/committee-data";
import { CommunityHero } from "./CommunityHero";
import { CommunityToolbar } from "./CommunityToolbar";
import { CommunityGrid } from "./CommunityGrid";
import { SpeakerApplicationSection } from "./SpeakerApplicationSection";
import { MemberDetailDialog } from "@/src/components/interview/Team/MemberDetailDialog";

export function CommunityDirectory() {
  const allMembers = useMemo(() => getLegitimateMembers(), []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommittee, setSelectedCommittee] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("ALL");

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const lastTriggeredCardId = useRef<string | null>(null);

  // Combined search and filter logic operating on canonical dataset
  const filteredMembers = useMemo(() => {
    return allMembers.filter((member) => {
      // 1. Search Query filter (matches name, committee, or role)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const nameMatch = member.name.toLowerCase().includes(query);
        const committeeMatch = (member.committee || "").toLowerCase().includes(query);
        const roleMatch = (member.role || "").toLowerCase().includes(query);
        if (!nameMatch && !committeeMatch && !roleMatch) {
          return false;
        }
      }

      // 2. Committee filter
      if (selectedCommittee !== "ALL") {
        const sel = selectedCommittee.toLowerCase();
        const memComm = (member.committee || "").toLowerCase();
        if (memComm !== sel) {
          return false;
        }
      }

      // 3. Role filter
      if (selectedRole !== "ALL") {
        const r = (member.role || "").toUpperCase();
        if (selectedRole === "HEAD") {
          if (!r.includes("HEAD") || r.includes("VICE HEAD")) return false;
        } else if (selectedRole === "VICE HEAD") {
          if (!r.includes("VICE HEAD")) return false;
        } else if (selectedRole === "LEADER") {
          if (!r.includes("LEADER")) return false;
        } else if (selectedRole === "MAIN") {
          if (r.includes("HEAD") || r.includes("LEADER")) return false;
        }
      }

      return true;
    });
  }, [allMembers, searchQuery, selectedCommittee, selectedRole]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCommittee("ALL");
    setSelectedRole("ALL");
  }, []);

  const handleSelectMember = useCallback((member: TeamMember) => {
    lastTriggeredCardId.current = `community-card-${member.id}`;
    setSelectedMember(member);
  }, []);

  const handleClosing = useCallback(() => {
    // Dialog animation closing phase
  }, []);

  const handleClose = useCallback(() => {
    setSelectedMember(null);

    if (lastTriggeredCardId.current) {
      const element = document.getElementById(lastTriggeredCardId.current);
      element?.focus();
    }
  }, []);

  return (
    <div className="w-full bg-[#050708] text-white">
      {/* ============================================================= */}
      {/* SECTION B: CINEMATIC SPOTLIGHT HERO WITH AUTO ROTATION        */}
      {/* ============================================================= */}
      <CommunityHero onSelectMember={handleSelectMember} />

      {/* ============================================================= */}
      {/* SECTION C: DIRECTORY INTRODUCTION                            */}
      {/* ============================================================= */}
      <section className="mx-auto w-full max-w-[1520px] px-6 pt-16 md:px-10 lg:px-12">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-[#35d98a]">
            01 · THE DIRECTORY
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mt-8 mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              The community, <span className="text-[#35d98a]">up close.</span>
            </h2>
            <p className="mt-2 text-base text-[#aeb4bb] max-w-xl font-sans">
              Explore the people contributing to every corner of IT Club.
            </p>
          </div>
          <span className="arabic text-sm text-neutral-400">
            أعضاء وقادة مجتمع نادي تكنولوجيا المعلومات
          </span>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECTION D: SEARCH AND FILTERS TOOLBAR                        */}
      {/* ============================================================= */}
      <CommunityToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCommittee={selectedCommittee}
        onCommitteeChange={setSelectedCommittee}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        onResetFilters={handleResetFilters}
        filteredCount={filteredMembers.length}
        totalCount={allMembers.length}
      />

      {/* ============================================================= */}
      {/* SECTION E: FULL MEMBER DIRECTORY (TRANSPARENT CARDS)          */}
      {/* ============================================================= */}
      <section
        id="directory-grid"
        aria-label="Community members directory"
        className="mx-auto w-full max-w-[1520px] px-6 py-10 md:px-10 lg:px-12 lg:py-14"
      >
        <CommunityGrid
          members={filteredMembers}
          onSelectMember={handleSelectMember}
          onResetFilters={handleResetFilters}
        />

        {/* Bottom Section Metadata */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-white/30">
          <span className="font-mono text-[10px] tracking-[0.18em]">
            IT CLUB — COMMUNITY DIRECTORY
          </span>

          <span className="font-mono text-[10px] tracking-[0.18em]">
            {filteredMembers.length} OF {allMembers.length} MEMBERS DISPLAYED
          </span>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECTION F: CLOSING MEMBERSHIP CTA                            */}
      {/* ============================================================= */}
      <section className="w-full border-t border-white/10 bg-[#050708] py-20 sm:py-24 text-white">
        <div className="mx-auto w-full max-w-[1520px] px-6 md:px-10 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 p-8 sm:p-12 md:p-14 bg-gradient-to-r from-white/[0.03] to-transparent border border-white/10">
            <div className="max-w-2xl">
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#35d98a] uppercase">
                JOIN THE TEAM
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Your place in the <span className="text-[#35d98a]">community.</span>
              </h2>
              <p className="arabic mt-3 text-lg text-neutral-400">
                مكانك في مجتمع نادي تكنولوجيا المعلومات مستنيك.
              </p>
              <p className="mt-3 text-base text-[#aeb4bb]">
                Ready to build, learn, collaborate, and grow with ambitious students? Apply to join IT Club today.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/register"
                className="group inline-flex items-center gap-3 bg-[#35d98a] px-8 py-4 text-sm font-bold text-[#050708] transition-all duration-300 hover:bg-[#5cf2a9] hover:shadow-[0_0_30px_rgba(53,217,138,0.4)] cursor-pointer"
              >
                <span>Apply Now</span>
                <ArrowRight
                  size={18}
                  strokeWidth={2.2}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= */}
      {/* SECTION G: SPEAKER APPLICATION SECTION (REFERENCE 2)          */}
      {/* ============================================================= */}
      <SpeakerApplicationSection />

      {/* ============================================================= */}
      {/* REUSED MEMBER PROFILE DIALOG                                  */}
      {/* ============================================================= */}
      <MemberDetailDialog
        member={selectedMember}
        onClosing={handleClosing}
        onClose={handleClose}
      />
    </div>
  );
}
