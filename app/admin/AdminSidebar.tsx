"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  UserCog,
  Users,
  X,
} from "lucide-react";
import { TRACK_METADATA } from "../../lib/admin/transitions";
import type { CommitteeTrack } from "../../lib/admin/types";

const TRACKS: CommitteeTrack[] = ["hr", "pr", "sm", "oc", "it", "rnd"];

export interface AdminSidebarProps {
  userRole?: string;
  userEmail: string;
  userCommittee?: CommitteeTrack | null;
}

const navItems = [
  { href: "/admin", label: "Recruitment Overview", icon: BarChart3, exact: true },
  { href: "/admin/applications", label: "Applications", icon: Users },
  { href: "/admin/interviews/scan", label: "QR Scanner", icon: QrCode },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

export default function AdminSidebar({ userRole, userEmail, userCommittee }: AdminSidebarProps) {
  const allowedTracks: CommitteeTrack[] =
    userRole === "owner"
      ? TRACKS
      : userCommittee
      ? [userCommittee]
      : [];

  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  const [lastPathname, setLastPathname] = useState(pathname);

  // Close mobile drawer when the route changes
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Sync compact preference from localStorage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("itclub.admin.sidebar.compact");
        if (saved === "true") setCompact(true);
      } catch {
        // Ignore localStorage errors
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleToggleCompact = () => {
    setCompact((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("itclub.admin.sidebar.compact", String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Lock body scroll, trap escape key, and manage focus for mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMobile();
        triggerButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen, closeMobile]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const isInterviewer = userRole === "interviewer";
  const homeHref = isInterviewer ? "/admin/interviews/scan" : "/admin";
  const visibleNavItems = isInterviewer
    ? navItems.filter((item) => item.href === "/admin/interviews/scan")
    : navItems;

  const roleBadgeStyle =
    userRole === "owner"
      ? "bg-purple-500/10 text-purple-400 border border-purple-500/25"
      : userRole === "interviewer"
      ? "bg-sky-500/10 text-sky-400 border border-sky-500/25"
      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";

  // Reusable navigation link rendering
  const renderNavLinks = (isCompactView: boolean, onNavClick?: () => void) => (
    <div className="space-y-1">
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, "exact" in item ? item.exact : false);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavClick}
            title={isCompactView ? item.label : undefined}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
              active
                ? "bg-emerald-400/10 text-emerald-400 font-bold"
                : "text-white/65 hover:bg-white/[0.04] hover:text-white"
            } ${isCompactView ? "justify-center px-2" : ""}`}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-emerald-400"
              />
            )}
            <Icon
              size={18}
              className={`shrink-0 transition-colors ${
                active ? "text-emerald-400" : "text-white/50 group-hover:text-white"
              }`}
            />
            {!isCompactView && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}

      {userRole === "owner" && (
        <Link
          href="/admin/staff"
          onClick={onNavClick}
          title={isCompactView ? "Admin Management" : undefined}
          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-emerald-400 ${
            isActive("/admin/staff")
              ? "bg-emerald-400/10 text-emerald-400 font-bold"
              : "text-white/65 hover:bg-white/[0.04] hover:text-white"
          } ${isCompactView ? "justify-center px-2" : ""}`}
        >
          {isActive("/admin/staff") && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-emerald-400"
            />
          )}
          <UserCog
            size={18}
            className={`shrink-0 transition-colors ${
              isActive("/admin/staff")
                ? "text-emerald-400"
                : "text-white/50 group-hover:text-white"
            }`}
          />
          {!isCompactView && (
            <>
              <span className="truncate">Admin Management</span>
              <span className="ml-auto rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Owner
              </span>
            </>
          )}
        </Link>
      )}

      {userRole === "owner" && (
        <Link
          href="/admin/audit-logs"
          onClick={onNavClick}
          title={isCompactView ? "Audit Logs" : undefined}
          className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-purple-400 ${
            isActive("/admin/audit-logs")
              ? "bg-purple-500/10 text-purple-300 font-bold"
              : "text-white/65 hover:bg-white/[0.04] hover:text-white"
          } ${isCompactView ? "justify-center px-2" : ""}`}
        >
          {isActive("/admin/audit-logs") && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-purple-400"
            />
          )}
          <ClipboardList
            size={18}
            className={`shrink-0 transition-colors ${
              isActive("/admin/audit-logs")
                ? "text-purple-400"
                : "text-white/50 group-hover:text-white"
            }`}
          />
          {!isCompactView && (
            <>
              <span className="truncate">Audit Logs</span>
              <span className="ml-auto rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Owner
              </span>
            </>
          )}
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* ========================================================= */}
      {/* MOBILE TOP HEADER BAR                                     */}
      {/* ========================================================= */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#080a0c]/95 px-4 backdrop-blur-md lg:hidden">
        <Link
          href={homeHref}
          className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
        >
          <Image
            src="/logo.webp"
            alt="IT Club"
            width={30}
            height={30}
            className="h-7 w-7 object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-[0.14em] text-white">
              IT<span className="text-emerald-400 ml-0.5">CLUB</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
              Admin Portal
            </span>
          </div>
        </Link>

        <button
          ref={triggerButtonRef}
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-drawer"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/75 hover:bg-white/[0.06] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 cursor-pointer"
          aria-label="Open administrative navigation menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR (FIXED LEFT)                              */}
      {/* ========================================================= */}
      <aside
        data-sidebar-compact={compact}
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 bg-[#080a0c] transition-[width] duration-200 lg:flex ${
          compact ? "w-[5.5rem]" : "w-[17.5rem]"
        }`}
        aria-label="Administrative sidebar"
      >
        {/* Desktop Branding Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link
            href={homeHref}
            className="flex min-w-0 items-center gap-3 text-white transition-opacity hover:opacity-90"
          >
            <Image
              src="/logo.webp"
              alt="IT Club"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 object-contain"
              priority
            />
            {!compact && (
              <div className="min-w-0">
                <span className="block text-sm font-black uppercase tracking-[0.14em] text-white">
                  IT<span className="text-emerald-400 ml-0.5">CLUB</span>
                </span>
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  Admin Portal
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={handleToggleCompact}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-400 cursor-pointer ${
              compact ? "mx-auto" : "ml-auto"
            }`}
            aria-label={compact ? "Expand admin sidebar" : "Collapse admin sidebar"}
            title={compact ? "Expand admin sidebar" : "Collapse admin sidebar"}
          >
            {compact ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Desktop Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin Operations">
          {!compact && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
              Operations
            </p>
          )}

          {renderNavLinks(compact)}

          {/* Track Filters (Expanded only, non-interviewers) */}
          {!compact && !isInterviewer && allowedTracks.length > 0 && (
            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                {userRole === "owner" ? "Track Filters" : "Authorized Committee"}
              </p>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {allowedTracks.map((track) => {
                  const meta = TRACK_METADATA[track];
                  const isTrackActive = pathname === "/admin/applications" && pathname.includes(`track=${track}`);
                  return (
                    <Link
                      key={track}
                      href={`/admin/applications?track=${track}`}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.04] hover:text-white ${
                        isTrackActive ? "text-emerald-400 font-semibold bg-emerald-400/5" : "text-white/60"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta.color }}
                      />
                      <span className="truncate">{meta.abbreviation}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Desktop Footer: Staff Info & Actions */}
        <div className="border-t border-white/10 p-3">
          {!compact ? (
            <div className="space-y-3 px-1">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                  Signed in staff
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-white/90" title={userEmail}>
                  {userEmail}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <span className={`inline-flex rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${roleBadgeStyle}`}>
                    {userRole || "staff"}
                  </span>
                  {userCommittee && (
                    <span className="inline-flex rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {userCommittee.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/65 hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  <ExternalLink size={13} />
                  <span>Site</span>
                </Link>

                <form action="/auth/signout" method="POST" className="w-full">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/65 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Sign out</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                title="View Website"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white transition-colors"
              >
                <ExternalLink size={16} />
              </Link>

              <form action="/auth/signout" method="POST" className="w-full flex justify-center">
                <button
                  type="submit"
                  title="Sign out"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE ACCESSIBLE NAVIGATION DRAWER                       */}
      {/* ========================================================= */}
      {mobileOpen && (
        <div
          id="admin-mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Administrative navigation menu"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Drawer Content Panel */}
          <div className="relative flex h-full w-[min(85vw,20rem)] max-w-full flex-col border-r border-white/10 bg-[#080a0c] shadow-2xl">
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <Link
                href={homeHref}
                onClick={closeMobile}
                className="flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
              >
                <Image
                  src="/logo.webp"
                  alt="IT Club"
                  width={30}
                  height={30}
                  className="h-7 w-7 object-contain"
                  priority
                />
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-[0.14em] text-white">
                    IT<span className="text-emerald-400 ml-0.5">CLUB</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Admin Portal
                  </span>
                </div>
              </Link>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobile}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:bg-white/[0.08] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-emerald-400 cursor-pointer"
                aria-label="Close navigation drawer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label="Mobile Admin Operations">
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Operations
              </p>
              {renderNavLinks(false, closeMobile)}

              {/* Mobile Track Filters */}
              {!isInterviewer && allowedTracks.length > 0 && (
                <div className="mt-6 pt-5 border-t border-white/10">
                  <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                    {userRole === "owner" ? "Track Filters" : "Authorized Committee"}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {allowedTracks.map((track) => {
                      const meta = TRACK_METADATA[track];
                      const isTrackActive = pathname === "/admin/applications" && pathname.includes(`track=${track}`);
                      return (
                        <Link
                          key={track}
                          href={`/admin/applications?track=${track}`}
                          onClick={closeMobile}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium transition-colors hover:bg-white/[0.04] hover:text-white ${
                            isTrackActive ? "text-emerald-400 font-semibold bg-emerald-400/5" : "text-white/60"
                          }`}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span className="truncate">{meta.abbreviation}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>

            {/* Drawer Footer: Staff Info & Sign out */}
            <div className="border-t border-white/10 p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                    Signed in staff
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-white/90" title={userEmail}>
                    {userEmail}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${roleBadgeStyle}`}>
                      {userRole || "staff"}
                    </span>
                    {userCommittee && (
                      <span className="inline-flex rounded px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {userCommittee.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/65 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Site</span>
                  </Link>

                  <form action="/auth/signout" method="POST" className="w-full">
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/65 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
