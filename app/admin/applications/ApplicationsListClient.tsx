"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type {
  PaginatedApplications,
  ApplicationFilters,
  AcademicYear,
} from "../../../lib/admin/types";
import {
  STATUS_METADATA,
  TRACK_METADATA,
  ACADEMIC_YEAR_METADATA,
  VALID_STATUSES,
  COMMITTEE_TRACKS,
} from "../../../lib/admin/transitions";

interface Props {
  data: PaginatedApplications;
  filters: ApplicationFilters;
}

export default function ApplicationsListClient({ data, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchInput, setSearchInput] = useState(filters.search || "");

  const updateFilters = (newParams: Partial<ApplicationFilters>) => {
    const params = new URLSearchParams();

    const merged = {
      ...filters,
      ...newParams,
    };

    if (merged.search) params.set("search", merged.search);
    if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
    if (merged.track && merged.track !== "ALL") params.set("track", merged.track);
    if (merged.year && merged.year !== "ALL") params.set("year", merged.year);
    if (merged.sortBy) params.set("sortBy", merged.sortBy);
    if (merged.sortOrder) params.set("sortOrder", merged.sortOrder);
    if (merged.pageSize && merged.pageSize !== 10) params.set("pageSize", String(merged.pageSize));
    if (merged.page && merged.page > 1) params.set("page", String(merged.page));

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim(), page: 1 });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status !== "ALL") ||
    (filters.track && filters.track !== "ALL") ||
    (filters.year && filters.year !== "ALL") ||
    filters.sortBy !== "created_at"
  );

  const startRecord = data.totalCount === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const endRecord = Math.min(data.page * data.pageSize, data.totalCount);

  return (
    <div className="space-y-6">
      {/* Page Title & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#00e599] uppercase">
              RECRUITMENT PIPELINE
            </span>
            <span className="text-white/20">·</span>
            <span className="arabic text-xs text-white/50 font-medium">إدارة طلبات التقديم</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Applicant Submissions
          </h1>
        </div>

        <div className="font-mono text-xs text-white/50">
          Showing <span className="text-[#00e599] font-bold">{startRecord}–{endRecord}</span> of{" "}
          <span className="text-white font-bold">{data.totalCount}</span> applicants
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="border border-white/10 bg-[#080a0c] p-4 sm:p-5 space-y-4">
        {/* Search Input Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by student name, reference code (ITC-...), academic ID, or email..."
              className="w-full border border-white/10 bg-white/[0.02] pl-10 pr-4 py-2.5 font-mono text-xs text-white placeholder:text-white/30 focus:border-[#00e599] focus:bg-white/[0.04] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="bg-[#00e599] hover:bg-[#00c985] text-[#050708] font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer"
            >
              SEARCH
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white font-mono text-xs px-3 py-2.5 transition-colors cursor-pointer"
                title="Reset all search filters"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">RESET</span>
              </button>
            )}
          </div>
        </form>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5 font-mono text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1.5">
              STATUS
            </label>
            <select
              value={filters.status || "ALL"}
              onChange={(e) =>
                updateFilters({
                  status: e.target.value as ApplicationFilters["status"],
                  page: 1,
                })
              }
              className="w-full border border-white/10 bg-[#050708] text-white px-2.5 py-2 text-xs focus:border-[#00e599] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              {VALID_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_METADATA[st].label}
                </option>
              ))}
            </select>
          </div>

          {/* Committee Track Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1.5">
              PRIMARY TRACK
            </label>
            <select
              value={filters.track || "ALL"}
              onChange={(e) =>
                updateFilters({
                  track: e.target.value as ApplicationFilters["track"],
                  page: 1,
                })
              }
              className="w-full border border-white/10 bg-[#050708] text-white px-2.5 py-2 text-xs focus:border-[#00e599] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Tracks</option>
              {COMMITTEE_TRACKS.map((tr) => (
                <option key={tr} value={tr}>
                  {TRACK_METADATA[tr].abbreviation} — {TRACK_METADATA[tr].name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1.5">
              ACADEMIC YEAR
            </label>
            <select
              value={filters.year || "ALL"}
              onChange={(e) =>
                updateFilters({
                  year: e.target.value as ApplicationFilters["year"],
                  page: 1,
                })
              }
              className="w-full border border-white/10 bg-[#050708] text-white px-2.5 py-2 text-xs focus:border-[#00e599] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Years</option>
              {(Object.keys(ACADEMIC_YEAR_METADATA) as AcademicYear[]).map((yr) => (
                <option key={yr} value={yr}>
                  {ACADEMIC_YEAR_METADATA[yr]}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1.5">
              SORT ORDER
            </label>
            <select
              value={`${filters.sortBy || "created_at"}-${filters.sortOrder || "desc"}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-");
                updateFilters({
                  sortBy: sb as ApplicationFilters["sortBy"],
                  sortOrder: so as ApplicationFilters["sortOrder"],
                  page: 1,
                });
              }}
              className="w-full border border-white/10 bg-[#050708] text-white px-2.5 py-2 text-xs focus:border-[#00e599] focus:outline-none cursor-pointer"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="full_name-asc">Name (A &rarr; Z)</option>
              <option value="full_name-desc">Name (Z &rarr; A)</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table / Cards */}
      <div className="border border-white/10 bg-[#080a0c] overflow-hidden">
        {data.applications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full border border-white/10 flex items-center justify-center text-white/30">
              <Filter size={20} />
            </div>
            <h3 className="text-base font-bold text-white">No applicants match your filters</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto font-mono">
              Try adjusting your search criteria or resetting filters to see all submissions.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-mono text-xs px-4 py-2 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-white/10 bg-white/[0.02] text-white/40 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Applicant Details</th>
                    <th className="px-5 py-3.5">Primary Track</th>
                    <th className="px-5 py-3.5">National ID</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Submitted</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {data.applications.map((app) => {
                    const trackMeta = TRACK_METADATA[app.primary_track] || {
                      abbreviation: app.primary_track,
                      color: "#fff",
                      name: app.primary_track,
                    };
                    const statusMeta = STATUS_METADATA[app.status] || {
                      label: app.status,
                      bgClass: "bg-white/10",
                      textClass: "text-white",
                      borderClass: "border-white/20",
                      dotClass: "bg-white",
                    };

                    return (
                      <tr key={app.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="font-bold text-[#00e599] hover:underline"
                          >
                            {app.application_reference}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-sans font-semibold text-white text-[13px]">
                            {app.full_name}
                          </div>
                          <div className="text-[11px] text-white/40 truncate max-w-xs">
                            {app.academic_id} · {app.university_email}
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className="px-2.5 py-1 border text-[10px] uppercase font-bold tracking-wider"
                            style={{
                              borderColor: `${trackMeta.color}40`,
                              color: trackMeta.color,
                              backgroundColor: `${trackMeta.color}10`,
                            }}
                          >
                            {trackMeta.abbreviation}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-white/50 text-[11px] whitespace-nowrap">
                          {app.national_id_masked}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase font-semibold ${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-white/40 text-[11px] whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="inline-flex items-center gap-1.5 border border-white/10 hover:border-[#00e599] bg-white/[0.03] hover:bg-[#00e599]/10 text-white hover:text-[#00e599] px-3 py-1.5 text-xs font-semibold transition-all"
                          >
                            <span>Review</span>
                            <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="lg:hidden divide-y divide-white/10">
              {data.applications.map((app) => {
                const trackMeta = TRACK_METADATA[app.primary_track] || {
                  abbreviation: app.primary_track,
                  color: "#fff",
                };
                const statusMeta = STATUS_METADATA[app.status] || {
                  label: app.status,
                  bgClass: "bg-white/10",
                  textClass: "text-white",
                  borderClass: "border-white/20",
                  dotClass: "bg-white",
                };

                return (
                  <div key={app.id} className="p-4 sm:p-5 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="font-bold text-[#00e599] text-sm hover:underline"
                      >
                        {app.application_reference}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase font-semibold ${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                        {statusMeta.label}
                      </span>
                    </div>

                    <div>
                      <div className="font-sans font-bold text-white text-base">
                        {app.full_name}
                      </div>
                      <div className="text-white/50 text-[11px]">
                        {app.academic_id} · {app.university_email}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/40">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 border text-[10px] uppercase font-bold"
                          style={{
                            borderColor: `${trackMeta.color}40`,
                            color: trackMeta.color,
                            backgroundColor: `${trackMeta.color}10`,
                          }}
                        >
                          {trackMeta.abbreviation}
                        </span>
                        <span>{app.national_id_masked}</span>
                      </div>

                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="text-[#00e599] font-bold underline"
                      >
                        Review &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination Footer Controls */}
      {data.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-white/50 pt-2">
          <div>
            Page <span className="text-white font-bold">{data.page}</span> of{" "}
            <span className="text-white font-bold">{data.totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => updateFilters({ page: data.page - 1 })}
              className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Numeric page buttons */}
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (data.totalPages > 5 && data.page > 3) {
                pageNum = data.page - 3 + i;
                if (pageNum > data.totalPages) pageNum = data.totalPages - 4 + i;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => updateFilters({ page: pageNum })}
                  className={`w-8 h-8 flex items-center justify-center border text-xs font-bold transition-colors cursor-pointer ${
                    data.page === pageNum
                      ? "border-[#00e599] bg-[#00e599]/10 text-[#00e599]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/10 text-white/70"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => updateFilters({ page: data.page + 1 })}
              className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
