"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  ExternalLink,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Settings,
  Users,
  X,
} from "lucide-react";
import { TRACK_METADATA } from "../../lib/admin/transitions";
import type { CommitteeTrack } from "../../lib/admin/types";

const TRACKS: CommitteeTrack[] = ["hr", "pr", "sm", "oc", "it", "rnd"];

export interface AdminSidebarProps {
  userRole?: string;
  userEmail: string;
}

const navItems = [
  { href: "/admin", label: "Recruitment Overview", icon: BarChart3, exact: true },
  { href: "/admin/applications", label: "Applications", icon: Users },
  { href: "/admin/interviews/scan", label: "QR Scanner", icon: QrCode },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export default function AdminSidebar({ userRole, userEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("itclub.admin.sidebar.compact");
        if (saved === "true") setCompact(true);
      } catch {
        // Ignore localStorage access errors
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (mobileOpen) closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const handleToggleCompact = () => {
    setCompact((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("itclub.admin.sidebar.compact", String(next));
      } catch {
        // Ignore localStorage access errors
      }
      return next;
    });
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const isInterviewer = userRole === "interviewer";
  const homeHref = isInterviewer ? "/admin/interviews/scan" : "/admin";
  const visibleNavItems = isInterviewer
    ? navItems.filter((item) => item.href === "/admin/interviews/scan")
    : navItems;

  const sidebar = (
    <aside
      data-sidebar-compact={compact}
      className={`flex h-full flex-col border-r border-white/10 bg-[#080a0c] transition-[width] duration-200 ${
        compact ? "w-[5.5rem]" : "w-[17.5rem]"
      }`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <Link
          href={homeHref}
          onClick={() => setMobileOpen(false)}
          className="flex min-w-0 items-center gap-3 text-white transition-colors hover:text-[#00e599]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#00e599]/40 bg-[#00e599]/10 p-1">
            <Image
              src="/logo.webp"
              alt="IT Club"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </span>
          {!compact && (
            <span className="min-w-0">
              <span className="block text-sm font-black uppercase tracking-[0.12em]">
                IT Club
              </span>
              <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Staff Portal
              </span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={handleToggleCompact}
          className="ml-auto hidden border border-white/10 p-1.5 text-white/45 transition-colors hover:border-white/25 hover:text-white lg:inline-flex"
          aria-label={compact ? "Expand admin sidebar" : "Collapse admin sidebar"}
        >
          {compact ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin navigation">
        <p className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 ${compact ? "sr-only" : ""}`}>
          Operations
        </p>
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={compact ? item.label : undefined}
                className={`flex items-center gap-3 border px-3 py-2.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00e599] ${active
                    ? "border-[#00e599]/35 bg-[#00e599]/10 text-[#00e599]"
                    : "border-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.035] hover:text-white"
                  } ${compact ? "justify-center" : ""}`}
              >
                <Icon size={17} />
                {!compact && <span>{item.label}</span>}
              </Link>
            );
          })}

          {userRole === "owner" && (
            <Link
              href="/admin/audit-logs"
              onClick={() => setMobileOpen(false)}
              title={compact ? "Audit Logs" : undefined}
              className={`flex items-center gap-3 border px-3 py-2.5 text-sm font-bold transition-colors ${isActive("/admin/audit-logs")
                  ? "border-[#9b7cff]/35 bg-[#9b7cff]/10 text-[#b49dff]"
                  : "border-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.035] hover:text-white"
                } ${compact ? "justify-center" : ""}`}
            >
              <ClipboardList size={17} />
              {!compact && (
                <>
                  <span>Audit Logs</span>
                  <span className="ml-auto border border-[#9b7cff]/30 bg-[#9b7cff]/10 px-1.5 py-0.5 text-[9px] uppercase text-[#b49dff]">
                    Owner
                  </span>
                </>
              )}
            </Link>
          )}
        </div>

        {!compact && !isInterviewer && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
              Track filters
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {TRACKS.map((track) => {
                const meta = TRACK_METADATA[track];
                return (
                  <Link
                    key={track}
                    href={`/admin/applications?track=${track}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs font-bold text-white/62 transition-colors hover:border-white/20 hover:text-white"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span>{meta.abbreviation}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        {!compact ? (
          <div className="space-y-3 border border-white/10 bg-[#050708] p-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                Signed in staff
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-white">{userEmail}</p>
              <p className={`mt-1 inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase ${
                userRole === "owner"
                  ? "border-[#9b7cff]/35 bg-[#9b7cff]/10 text-[#b49dff]"
                  : userRole === "interviewer"
                  ? "border-[#38bdf8]/35 bg-[#38bdf8]/10 text-[#38bdf8]"
                  : "border-[#00e599]/35 bg-[#00e599]/10 text-[#00e599]"
              }`}>
                {userRole || "staff"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 border border-white/10 px-2 py-2 text-xs font-bold text-white/55 hover:text-white"
              >
                <ExternalLink size={13} />
                Site
              </Link>
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 border border-white/10 px-2 py-2 text-xs font-bold text-white/55 hover:text-white"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="flex w-full items-center justify-center border border-white/10 p-2.5 text-white/55 hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </form>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#080a0c]/95 px-4 backdrop-blur lg:hidden">
        <Link href={homeHref} className="flex items-center gap-2.5 text-sm font-black uppercase tracking-[0.12em] text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-[#00e599]/40 bg-[#00e599]/10 p-0.5">
            <Image
              src="/logo.webp"
              alt="IT Club"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </span>
          IT Club Staff
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="border border-white/10 p-2 text-white/70"
          aria-label="Open admin navigation"
        >
          <Menu size={19} />
        </button>
      </div>

      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close admin navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[min(88vw,21rem)]">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 border border-white/10 bg-[#050708] p-2 text-white/70"
              aria-label="Close admin navigation"
            >
              <X size={18} />
            </button>
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
