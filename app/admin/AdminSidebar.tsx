"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { TRACK_METADATA } from "../../lib/admin/transitions";
import type { CommitteeTrack } from "../../lib/admin/types";

const TRACKS: CommitteeTrack[] = ["it", "rnd", "oc", "sm", "pr", "hr"];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOverview = pathname === "/admin";
  const isApplications = pathname.startsWith("/admin/applications");

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between border-b border-white/10 bg-[#080a0c] px-4 py-3 mb-6">
        <span className="font-mono text-xs uppercase tracking-wider text-white/60">ADMIN NAVIGATION</span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 border border-white/10 text-white/70 hover:text-white hover:border-white/20"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={`w-full md:w-64 shrink-0 space-y-6 ${
          mobileOpen ? "block mb-8" : "hidden md:block"
        }`}
      >
        {/* Main Navigation Links */}
        <div className="border border-white/10 bg-[#080a0c] p-3 space-y-1">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 px-3 py-1.5">
            WORKSPACE
          </p>

          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              isOverview
                ? "bg-[#00e599]/10 text-[#00e599] border-l-2 border-[#00e599]"
                : "text-white/60 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <LayoutDashboard size={15} />
            <span>OVERVIEW</span>
          </Link>

          <Link
            href="/admin/applications"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              isApplications
                ? "bg-[#00e599]/10 text-[#00e599] border-l-2 border-[#00e599]"
                : "text-white/60 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <Users size={15} />
            <span>APPLICATIONS</span>
          </Link>
        </div>

        {/* Committee Quick Filters */}
        <div className="border border-white/10 bg-[#080a0c] p-3 space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30">
              COMMITTEE TRACKS
            </span>
            <Sparkles size={11} className="text-[#00e599]/50" />
          </div>

          {TRACKS.map((track) => {
            const meta = TRACK_METADATA[track];
            return (
              <Link
                key={track}
                href={`/admin/applications?track=${track}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-mono text-white/60 hover:text-white hover:bg-white/[0.03] transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="tracking-wide uppercase font-semibold">{meta.abbreviation}</span>
                  <span className="text-white/30 text-[10px] hidden lg:inline">({meta.name})</span>
                </div>
                <span className="text-[10px] text-white/30 group-hover:text-white/70">&rarr;</span>
              </Link>
            );
          })}
        </div>

        {/* System Info Card */}
        <div className="border border-white/5 bg-white/[0.01] p-4 text-xs font-mono text-white/40 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span>SYSTEM</span>
            <span className="text-[#00e599]">ONLINE</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            RECRUITMENT 2026 · APPLICANTS DATABASE ACTIVE
          </p>
        </div>
      </aside>
    </>
  );
}
