"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type {
  AcademicYear,
  ApplicationFilters,
  ApplicationListItem,
  PaginatedApplications,
} from "../../../lib/admin/types";
import {
  ACADEMIC_YEAR_METADATA,
  COMMITTEE_TRACKS,
  STATUS_METADATA,
  TRACK_METADATA,
  VALID_STATUSES,
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
    const merged = { ...filters, ...newParams };

    if (merged.search) params.set("search", merged.search);
    if (merged.status && merged.status !== "ALL") params.set("status", merged.status);
    if (merged.track && merged.track !== "ALL") {
      params.set("track", merged.track);
      if (merged.trackScope && merged.trackScope !== "primary") {
        params.set("trackScope", merged.trackScope);
      }
    }
    if (merged.date) params.set("date", merged.date);
    if (merged.year && merged.year !== "ALL") params.set("year", merged.year);
    if (merged.sortBy) params.set("sortBy", merged.sortBy);
    if (merged.sortOrder) params.set("sortOrder", merged.sortOrder);
    if (merged.pageSize && merged.pageSize !== 20) params.set("pageSize", String(merged.pageSize));
    if (merged.page && merged.page > 1) params.set("page", String(merged.page));

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  const removeSingleFilter = (key: keyof ApplicationFilters) => {
    const nextFilters = { ...filters };
    delete nextFilters[key];
    if (key === "track") {
      delete nextFilters.trackScope;
    }
    if (key === "search") {
      setSearchInput("");
    }
    updateFilters({ ...nextFilters, [key]: undefined, page: 1 });
  };

  useEffect(() => {
    if (filters.pageSize && filters.pageSize !== 20) return;
    try {
      const raw = window.localStorage.getItem("itclub.admin.preferences");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { pageSize?: number };
      if (parsed.pageSize && parsed.pageSize !== filters.pageSize) {
        updateFilters({ pageSize: parsed.pageSize, page: 1 });
      }
    } catch {
      // Ignore malformed preference data.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
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
      filters.trackScope ||
      filters.date ||
      (filters.year && filters.year !== "ALL") ||
      filters.sortBy !== "created_at" ||
      filters.sortOrder !== "desc" ||
      (filters.pageSize && filters.pageSize !== 20)
  );

  const startRecord = data.totalCount === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const endRecord = Math.min(data.page * data.pageSize, data.totalCount);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 transition-colors hover:text-[#00e599]"
            >
              <ArrowLeft size={13} />
              <span>DASHBOARD OVERVIEW</span>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00e599]">
              Applications
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Applicant Submissions
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Search, filter, and review real applicant records. National IDs stay masked in this workspace.
          </p>
        </div>

        <div className="text-xs text-white/50">
          Showing <span className="font-bold text-[#00e599]">{startRecord}-{endRecord}</span> of{" "}
          <span className="font-bold text-white">{data.totalCount}</span> applicants
        </div>
      </div>

      <div className="space-y-4 border border-white/10 bg-[#080a0c] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <SlidersHorizontal size={16} className="text-[#00e599]" />
            Filters
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw size={13} />
              Reset all filters
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
              <Search size={15} />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name, ITC reference, academic ID, or university email..."
              className="w-full border border-white/10 bg-white/[0.02] py-3 pl-10 pr-4 text-sm text-white transition-colors placeholder:text-white/30 focus:border-[#00e599] focus:bg-white/[0.04] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-[#00e599] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#050708] transition-colors hover:bg-[#00c985]"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 gap-3 pt-2 text-xs sm:grid-cols-2 xl:grid-cols-6">
          <FilterSelect
            label="Status"
            value={filters.status || "ALL"}
            onChange={(value) => updateFilters({ status: value as ApplicationFilters["status"], page: 1 })}
          >
            <option value="ALL">All statuses</option>
            {VALID_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_METADATA[status].label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Track"
            value={filters.track || "ALL"}
            onChange={(value) => {
              updateFilters({
                track: value as ApplicationFilters["track"],
                trackScope: value === "ALL" ? undefined : (filters.trackScope || "primary"),
                page: 1,
              });
            }}
          >
            <option value="ALL">All tracks</option>
            {COMMITTEE_TRACKS.map((track) => (
              <option key={track} value={track}>
                {TRACK_METADATA[track].abbreviation} - {TRACK_METADATA[track].name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Track Preference"
            value={filters.trackScope || "primary"}
            onChange={(value) => updateFilters({ trackScope: value as ApplicationFilters["trackScope"], page: 1 })}
          >
            <option value="primary">1st Preference (Primary)</option>
            <option value="secondary">2nd Preference (Secondary)</option>
            <option value="either">Either (1st or 2nd)</option>
          </FilterSelect>

          <FilterSelect
            label="Academic Year"
            value={filters.year || "ALL"}
            onChange={(value) => updateFilters({ year: value as ApplicationFilters["year"], page: 1 })}
          >
            <option value="ALL">All years</option>
            {(Object.keys(ACADEMIC_YEAR_METADATA) as AcademicYear[]).map((year) => (
              <option key={year} value={year}>
                {ACADEMIC_YEAR_METADATA[year]}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Sort"
            value={`${filters.sortBy || "created_at"}-${filters.sortOrder || "desc"}`}
            onChange={(value) => {
              const [sortBy, sortOrder] = value.split("-");
              updateFilters({
                sortBy: sortBy as ApplicationFilters["sortBy"],
                sortOrder: sortOrder as ApplicationFilters["sortOrder"],
                page: 1,
              });
            }}
          >
            <option value="created_at-desc">Newest first</option>
            <option value="created_at-asc">Oldest first</option>
            <option value="full_name-asc">Name A-Z</option>
            <option value="full_name-desc">Name Z-A</option>
            <option value="status-asc">Status</option>
          </FilterSelect>

          <FilterSelect
            label="Page Size"
            value={String(filters.pageSize || 20)}
            onChange={(value) => updateFilters({ pageSize: Number(value), page: 1 })}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </FilterSelect>
        </div>

        {/* Removable Active Filter Badges */}
        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-white/40">Active Filters:</span>
            {filters.search ? (
              <RemovableFilter
                label={`Search: "${filters.search}"`}
                onRemove={() => removeSingleFilter("search")}
              />
            ) : null}
            {filters.status && filters.status !== "ALL" ? (
              <RemovableFilter
                label={`Status: ${STATUS_METADATA[filters.status].label}`}
                onRemove={() => removeSingleFilter("status")}
              />
            ) : null}
            {filters.track && filters.track !== "ALL" ? (
              <RemovableFilter
                label={`Track: ${TRACK_METADATA[filters.track].abbreviation} (${
                  filters.trackScope === "secondary"
                    ? "2nd Preference"
                    : filters.trackScope === "either"
                    ? "Either Preference"
                    : "1st Preference"
                })`}
                onRemove={() => removeSingleFilter("track")}
              />
            ) : null}
            {filters.date ? (
              <RemovableFilter
                label={`Submitted: ${filters.date}`}
                onRemove={() => removeSingleFilter("date")}
              />
            ) : null}
            {filters.year && filters.year !== "ALL" ? (
              <RemovableFilter
                label={`Year: ${ACADEMIC_YEAR_METADATA[filters.year] || filters.year}`}
                onRemove={() => removeSingleFilter("year")}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden border border-white/10 bg-[#080a0c]">
        {data.applications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-white/10 text-white/30">
              <Filter size={20} />
            </div>
            <h3 className="text-base font-bold text-white">No applicants match your filters</h3>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/40">
              Adjust the filters or reset the workspace to return to all submissions.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
              >
                <RotateCcw size={13} />
                Reset filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-[0.14em] text-white/40">
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Applicant</th>
                    <th className="px-5 py-3.5">Primary Track</th>
                    <th className="px-5 py-3.5">Academic Year</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Submitted</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.applications.map((app) => (
                    <ApplicationRow key={app.id} app={app} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-white/10 lg:hidden">
              {data.applications.map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
            </div>
          </>
        )}
      </div>

      {data.totalPages > 1 ? (
        <div className="flex flex-col items-center justify-between gap-4 pt-2 text-xs text-white/50 sm:flex-row">
          <div>
            Page <span className="font-bold text-white">{data.page}</span> of{" "}
            <span className="font-bold text-white">{data.totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => updateFilters({ page: data.page - 1 })}
              className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => updateFilters({ page: data.page + 1 })}
              className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[9px] uppercase tracking-wider text-white/40">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-white/10 bg-[#050708] px-2.5 py-2.5 text-xs text-white focus:border-[#00e599] focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function RemovableFilter({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-[#00e599]/30 bg-[#00e599]/10 px-2.5 py-1 font-bold text-[#00e599]">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="rounded p-0.5 text-[#00e599]/70 hover:bg-[#00e599]/20 hover:text-white transition-colors"
      >
        <X size={12} />
      </button>
    </span>
  );
}

function ApplicationRow({ app }: { app: ApplicationListItem }) {
  const trackMeta = TRACK_METADATA[app.primary_track];
  const statusMeta = STATUS_METADATA[app.status];

  return (
    <tr className="transition-colors hover:bg-white/[0.025]">
      <td className="whitespace-nowrap px-5 py-4">
        <Link href={`/admin/applications/${app.id}`} className="font-black text-[#00e599] hover:underline">
          {app.application_reference}
        </Link>
      </td>
      <td className="px-5 py-4">
        <p className="font-bold text-white">{app.full_name}</p>
        <p className="mt-0.5 max-w-xs truncate text-xs text-white/42">
          {app.academic_id} / {app.university_email}
        </p>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <div className="flex flex-col gap-1 items-start">
          <span
            className="border px-2 py-0.5 text-[11px] font-black uppercase tracking-wide"
            style={{
              borderColor: `${trackMeta.color}40`,
              color: trackMeta.color,
              backgroundColor: `${trackMeta.color}12`,
            }}
            title={`Primary Preference: ${trackMeta.name}`}
          >
            1st: {trackMeta.abbreviation}
          </span>
          {app.secondary_track && TRACK_METADATA[app.secondary_track] ? (
            <span
              className="border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{
                borderColor: `${TRACK_METADATA[app.secondary_track].color}30`,
                color: TRACK_METADATA[app.secondary_track].color,
                backgroundColor: `${TRACK_METADATA[app.secondary_track].color}08`,
              }}
              title={`Secondary Preference: ${TRACK_METADATA[app.secondary_track].name}`}
            >
              2nd: {TRACK_METADATA[app.secondary_track].abbreviation}
            </span>
          ) : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-white/48">
        {ACADEMIC_YEAR_METADATA[app.academic_year]}
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-bold uppercase ${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
          {statusMeta.label}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-xs text-white/45">
        {new Date(app.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-right">
        <Link
          href={`/admin/applications/${app.id}`}
          className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:border-[#00e599] hover:bg-[#00e599]/10 hover:text-[#00e599]"
        >
          Review
          <ExternalLink size={12} />
        </Link>
      </td>
    </tr>
  );
}

function ApplicationCard({ app }: { app: ApplicationListItem }) {
  const trackMeta = TRACK_METADATA[app.primary_track];
  const statusMeta = STATUS_METADATA[app.status];

  return (
    <article className="space-y-3 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/applications/${app.id}`} className="font-black text-[#00e599]">
            {app.application_reference}
          </Link>
          <h2 className="mt-1 text-base font-bold text-white">{app.full_name}</h2>
          <p className="mt-1 break-all text-xs text-white/45">
            {app.academic_id} / {app.university_email}
          </p>
        </div>
        <span className={`shrink-0 border px-2 py-1 text-[10px] font-bold uppercase ${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}>
          {statusMeta.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 text-xs text-white/45">
        <span
          className="border px-2 py-0.5 font-black"
          style={{
            borderColor: `${trackMeta.color}40`,
            color: trackMeta.color,
            backgroundColor: `${trackMeta.color}12`,
          }}
        >
          1st: {trackMeta.abbreviation}
        </span>
        {app.secondary_track && TRACK_METADATA[app.secondary_track] ? (
          <span
            className="border px-2 py-0.5 font-bold"
            style={{
              borderColor: `${TRACK_METADATA[app.secondary_track].color}30`,
              color: TRACK_METADATA[app.secondary_track].color,
              backgroundColor: `${TRACK_METADATA[app.secondary_track].color}08`,
            }}
          >
            2nd: {TRACK_METADATA[app.secondary_track].abbreviation}
          </span>
        ) : null}
        <span>{ACADEMIC_YEAR_METADATA[app.academic_year]}</span>
        <span>{new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
      <Link href={`/admin/applications/${app.id}`} className="inline-flex text-sm font-bold text-[#00e599]">
        Review applicant
      </Link>
    </article>
  );
}
