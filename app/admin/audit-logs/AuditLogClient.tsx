"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";
import type { AuditEventRecord, AuditStats } from "../../../lib/audit/types";

export interface AuditLogClientProps {
  ownerEmail: string;
  initialActorId?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  APPLICATION_SUBMITTED: { label: "Application Submitted", color: "#18c8ed" },
  APPLICATION_STATUS_UPDATED: { label: "Status Updated", color: "#00e599" },
  APPLICATION_REVIEW_NOTE_UPDATED: { label: "Reviewer Note Saved", color: "#eab308" },
  NOTIFICATION_ATTEMPTED: { label: "Notification Queued", color: "#a855f7" },
  NOTIFICATION_DELIVERED: { label: "SMTP Accepted", color: "#00e599" },
  NOTIFICATION_FAILED: { label: "Email Failed", color: "#f43f5e" },
  STUDENT_ACCOUNT_ACTIVATED: { label: "Account Activated", color: "#10b981" },
  INTERVIEW_SCHEDULED: { label: "Interview Scheduled", color: "#14b8a6" },
  INTERVIEW_QR_ISSUED: { label: "QR Token Issued", color: "#06b6d4" },
  INTERVIEW_QR_REVOKED: { label: "QR Revoked", color: "#ef4444" },
  INTERVIEW_CHECK_IN_SUCCESS: { label: "Check-In Verified", color: "#00e599" },
  INTERVIEW_CHECK_IN_DUPLICATE: { label: "Duplicate Check-In", color: "#f59e0b" },
  INTERVIEW_CANDIDATE_LOOKUP: { label: "Interview Lookup", color: "#38bdf8" },
  INTERVIEW_EVALUATION_CREATED: { label: "Evaluation Created", color: "#a855f7" },
  INTERVIEW_EVALUATION_UPDATED: { label: "Evaluation Updated", color: "#c084fc" },
  STAFF_ROLE_ASSIGNED: { label: "Staff Role Assigned", color: "#9b7cff" },
  OWNER_BOOTSTRAP: { label: "Owner Bootstrapped", color: "#9b7cff" },
  ADMIN_INVITATION_INITIATED: { label: "Admin Invite Queued", color: "#38bdf8" },
  ADMIN_ACCOUNT_CREATED: { label: "Admin Account Created", color: "#00e599" },
  ADMIN_INVITATION_DELIVERY_SUCCESS: { label: "Invite Email Sent", color: "#00e599" },
  ADMIN_INVITATION_DELIVERY_FAILURE: { label: "Invite Email Failed", color: "#f43f5e" },
  ADMIN_TEMPORARY_PASSWORD_REISSUED: { label: "Password Reissued", color: "#f59e0b" },
  ADMIN_EMAIL_UPDATED: { label: "Admin Email Updated", color: "#38bdf8" },
  ADMIN_ROLE_UPDATED: { label: "Admin Role Updated", color: "#9b7cff" },
  STAFF_PASSWORD_CHANGED: { label: "Password Replaced", color: "#00e599" },
  EXPIRED_STAFF_CREDENTIAL_REJECTED: { label: "Expired Credential Blocked", color: "#ef4444" },
};

export default function AuditLogClient({ ownerEmail, initialActorId }: AuditLogClientProps) {
  // Data state
  const [events, setEvents] = useState<AuditEventRecord[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [actorId, setActorId] = useState(initialActorId || "");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityTypeFilter, setEntityTypeFilter] = useState("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState<"ALL" | "24H" | "7D" | "30D">("ALL");

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEventRecord | null>(null);

  // Fetch audit history via effect without synchronous setState in effect body
  useEffect(() => {
    let ignore = false;

    const loadAuditLogs = async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (entityTypeFilter !== "ALL") params.set("entityType", entityTypeFilter);
      if (outcomeFilter !== "ALL") params.set("outcome", outcomeFilter);
      if (actorId.trim()) params.set("actorId", actorId.trim());
      if (search.trim()) params.set("search", search.trim());

      if (datePreset !== "ALL") {
        const now = Date.now();
        let ms = 24 * 60 * 60 * 1000;
        if (datePreset === "7D") ms = 7 * 24 * 60 * 60 * 1000;
        if (datePreset === "30D") ms = 30 * 24 * 60 * 60 * 1000;
        params.set("from", new Date(now - ms).toISOString());
      }

      try {
        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();

        if (ignore) return;

        if (!res.ok) {
          throw new Error(data.error || "Failed to load audit history.");
        }

        setEvents(data.data.events || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalCount(data.data.totalCount || 0);
        setStats(data.stats || null);
        setError(null);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load audit records.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadAuditLogs();

    return () => {
      ignore = true;
    };
  }, [page, pageSize, actionFilter, entityTypeFilter, outcomeFilter, actorId, search, datePreset, refreshKey]);

  // Trigger manual refresh
  const handleRefresh = () => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setLoading(true);
    setSearch("");
    setActorId("");
    setActionFilter("ALL");
    setEntityTypeFilter("ALL");
    setOutcomeFilter("ALL");
    setDatePreset("ALL");
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const getActionBadge = (action: string) => {
    const meta = ACTION_LABELS[action] || { label: action, color: "#9ca3af" };
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold px-2 py-0.5 border"
        style={{
          borderColor: `${meta.color}40`,
          backgroundColor: `${meta.color}15`,
          color: meta.color,
        }}
      >
        <span>{meta.label}</span>
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const isOwner = role === "owner";
    const isAdmin = role === "admin";
    const isSystem = role === "system";
    return (
      <span
        className={`font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border ${
          isOwner
            ? "border-[#9b7cff]/40 bg-[#9b7cff]/10 text-[#9b7cff]"
            : isAdmin
            ? "border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]"
            : isSystem
            ? "border-[#18c8ed]/40 bg-[#18c8ed]/10 text-[#18c8ed]"
            : "border-white/20 bg-white/5 text-white/60"
        }`}
      >
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Station Operator Info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] font-mono text-white/40">
        <div className="flex items-center gap-2">
          <Shield size={13} className="text-[#9b7cff]" />
          <span className="uppercase text-white/70">VERIFIED OWNER AUDIT TERMINAL</span>
          <span className="text-white/20">|</span>
          <span className="text-[#9b7cff] font-semibold">{ownerEmail}</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-white/30 text-[10px]">
          <span>APPEND-ONLY PERSISTENCE</span>
          <span>·</span>
          <span>STRICT CAIRO TIME (UTC+3)</span>
        </div>
      </div>

      {/* Top Banner & Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-white/10 bg-[#080a0c] p-4 relative overflow-hidden">
          <div className="h-0.5 w-full absolute top-0 left-0 bg-[#00e599]" />
          <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
            <span>TOTAL AUDIT EVENTS</span>
            <Activity size={14} className="text-[#00e599]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats ? stats.total.toLocaleString() : "--"}
          </div>
          <p className="text-[10px] font-mono text-white/40 mt-1">Immutable recorded actions</p>
        </div>

        <div className="border border-white/10 bg-[#080a0c] p-4 relative overflow-hidden">
          <div className="h-0.5 w-full absolute top-0 left-0 bg-[#18c8ed]" />
          <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
            <span>PAST 24 HOURS</span>
            <Clock size={14} className="text-[#18c8ed]" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {stats ? stats.recent24h.toLocaleString() : "--"}
          </div>
          <p className="text-[10px] font-mono text-[#18c8ed] mt-1">Recent station activity</p>
        </div>

        <div className="border border-white/10 bg-[#080a0c] p-4 relative overflow-hidden">
          <div className="h-0.5 w-full absolute top-0 left-0 bg-[#00e599]" />
          <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
            <span>SUCCESSFUL</span>
            <CheckCircle2 size={14} className="text-[#00e599]" />
          </div>
          <div className="text-2xl font-mono font-bold text-[#00e599]">
            {stats ? stats.successful.toLocaleString() : "--"}
          </div>
          <p className="text-[10px] font-mono text-white/40 mt-1">Normal verified actions</p>
        </div>

        <div className="border border-white/10 bg-[#080a0c] p-4 relative overflow-hidden">
          <div className="h-0.5 w-full absolute top-0 left-0 bg-amber-400" />
          <div className="flex items-center justify-between text-white/50 text-xs font-mono mb-2">
            <span>REJECTED / DUPLICATES</span>
            <AlertTriangle size={14} className="text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400">
            {stats ? stats.failed.toLocaleString() : "--"}
          </div>
          <p className="text-[10px] font-mono text-white/40 mt-1">Blocked or duplicate events</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="border border-white/10 bg-[#080a0c] p-4 space-y-4">
        {/* Active Actor Filter Pill */}
        {actorId && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border border-[#9b7cff]/40 bg-[#9b7cff]/10 rounded text-xs font-mono">
            <div className="flex items-center gap-2 text-[#9b7cff] min-w-0">
              <Shield size={14} className="shrink-0" />
              <span className="font-semibold uppercase tracking-wider shrink-0">Admin Filter Active:</span>
              <span className="truncate text-white bg-black/50 px-2 py-0.5 rounded border border-[#9b7cff]/30 font-bold" title={actorId}>
                {actorId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActorId("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded transition-colors shrink-0 cursor-pointer"
            >
              <X size={12} />
              <span>Clear Filter</span>
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference (ITC-...), actor email, or entity ID..."
              className="w-full bg-[#050708] border border-white/10 pl-9 pr-4 py-2 font-mono text-xs text-white placeholder-white/30 focus:border-[#9b7cff] focus:outline-none transition-colors"
            />
          </div>

          {/* Date Presets */}
          <div className="flex items-center gap-1 bg-[#050708] p-1 border border-white/10 shrink-0">
            {(["ALL", "24H", "7D", "30D"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setDatePreset(preset);
                  setPage(1);
                }}
                className={`px-3 py-1 font-mono text-xs uppercase transition-colors cursor-pointer ${
                  datePreset === preset
                    ? "bg-[#9b7cff]/20 text-[#9b7cff] font-semibold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#050708] border border-white/10 text-xs font-mono text-white/80 px-3 py-1.5 focus:border-[#9b7cff] focus:outline-none"
          >
            <option value="ALL">ALL ACTIONS</option>
            <option value="ADMIN_ACCOUNT_CREATED">ADMIN_ACCOUNT_CREATED</option>
            <option value="ADMIN_INVITATION_DELIVERY_SUCCESS">ADMIN_INVITATION_DELIVERY_SUCCESS</option>
            <option value="ADMIN_INVITATION_DELIVERY_FAILURE">ADMIN_INVITATION_DELIVERY_FAILURE</option>
            <option value="ADMIN_TEMPORARY_PASSWORD_REISSUED">ADMIN_TEMPORARY_PASSWORD_REISSUED</option>
            <option value="ADMIN_EMAIL_UPDATED">ADMIN_EMAIL_UPDATED</option>
            <option value="ADMIN_ROLE_UPDATED">ADMIN_ROLE_UPDATED</option>
            <option value="STAFF_PASSWORD_CHANGED">STAFF_PASSWORD_CHANGED</option>
            <option value="EXPIRED_STAFF_CREDENTIAL_REJECTED">EXPIRED_STAFF_CREDENTIAL_REJECTED</option>
            <option value="APPLICATION_SUBMITTED">APPLICATION_SUBMITTED</option>
            <option value="APPLICATION_STATUS_UPDATED">APPLICATION_STATUS_UPDATED</option>
            <option value="APPLICATION_REVIEW_NOTE_UPDATED">APPLICATION_REVIEW_NOTE_UPDATED</option>
            <option value="INTERVIEW_CHECK_IN_SUCCESS">INTERVIEW_CHECK_IN_SUCCESS</option>
            <option value="INTERVIEW_CHECK_IN_DUPLICATE">INTERVIEW_CHECK_IN_DUPLICATE</option>
            <option value="INTERVIEW_QR_ISSUED">INTERVIEW_QR_ISSUED</option>
            <option value="INTERVIEW_QR_REVOKED">INTERVIEW_QR_REVOKED</option>
            <option value="NOTIFICATION_DELIVERED">NOTIFICATION_DELIVERED</option>
            <option value="NOTIFICATION_FAILED">NOTIFICATION_FAILED</option>
            <option value="STUDENT_ACCOUNT_ACTIVATED">STUDENT_ACCOUNT_ACTIVATED</option>
            <option value="OWNER_BOOTSTRAP">OWNER_BOOTSTRAP</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#050708] border border-white/10 text-xs font-mono text-white/80 px-3 py-1.5 focus:border-[#9b7cff] focus:outline-none"
          >
            <option value="ALL">ALL ENTITIES</option>
            <option value="application">APPLICATION</option>
            <option value="interview_qr">INTERVIEW_QR</option>
            <option value="notification">NOTIFICATION</option>
            <option value="student_account">STUDENT_ACCOUNT</option>
            <option value="staff_member">STAFF_MEMBER</option>
          </select>

          {/* Outcome Filter */}
          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#050708] border border-white/10 text-xs font-mono text-white/80 px-3 py-1.5 focus:border-[#9b7cff] focus:outline-none"
          >
            <option value="ALL">ALL OUTCOMES</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE / REJECTED</option>
          </select>

          {/* Reload & Reset */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 border border-white/10 bg-white/[0.02] text-white/50 hover:text-white font-mono text-xs uppercase cursor-pointer"
            >
              RESET
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              title="Refresh audit events"
              className="p-2 border border-white/10 bg-white/[0.02] text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Events Table Container */}
      <div className="border border-white/10 bg-[#080a0c] overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw size={24} className="text-[#9b7cff] animate-spin" />
            <p className="font-mono text-xs text-white/50 uppercase tracking-wider">
              LOADING AUDIT TRAIL...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle size={24} className="text-rose-400 mx-auto" />
            <p className="font-mono text-xs text-rose-400">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 border border-white/10 bg-white/5 text-xs font-mono uppercase text-white hover:bg-white/10"
            >
              RETRY
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <FileText size={24} className="text-white/20 mx-auto" />
            <p className="font-mono text-xs text-white/50 uppercase">NO AUDIT RECORDS FOUND</p>
            <p className="text-xs text-white/30">
              No events matched the current search and filter criteria.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-3 px-3 py-1.5 border border-white/10 text-xs font-mono text-white/70 hover:text-white"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#050708] font-mono text-[10px] text-white/40 uppercase tracking-wider">
                  <th className="py-3 px-4">TIMESTAMP</th>
                  <th className="py-3 px-4">ACTION</th>
                  <th className="py-3 px-4">OUTCOME</th>
                  <th className="py-3 px-4">ACTOR</th>
                  <th className="py-3 px-4">ENTITY & REF</th>
                  <th className="py-3 px-4">STATUS CHANGE</th>
                  <th className="py-3 px-4 text-right">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-white/70 whitespace-nowrap">
                      <div>
                        {new Date(ev.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {new Date(ev.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}{" "}
                        (CAI)
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(ev.action)}</td>

                    {/* Outcome */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase px-2 py-0.5 border ${
                          ev.outcome === "SUCCESS"
                            ? "border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {ev.outcome === "SUCCESS" ? (
                          <CheckCircle2 size={11} />
                        ) : (
                          <XCircle size={11} />
                        )}
                        <span>{ev.outcome}</span>
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(ev.actor_role)}
                        <span className="text-white/80 max-w-[140px] truncate block" title={ev.actor_email || ev.actor_id || "System"}>
                          {ev.actor_email || (ev.actor_id ? `${ev.actor_id.slice(0, 8)}...` : "System")}
                        </span>
                      </div>
                    </td>

                    {/* Entity & Reference */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-white font-medium">
                        {ev.entity_reference || ev.entity_id || "--"}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase">
                        {ev.entity_type}
                      </div>
                    </td>

                    {/* Status Change */}
                    <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                      {ev.previous_status || ev.new_status ? (
                        <div className="flex items-center gap-1.5 text-white/70">
                          {ev.previous_status && (
                            <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 text-white/50 text-[10px]">
                              {ev.previous_status}
                            </span>
                          )}
                          {ev.previous_status && ev.new_status && (
                            <ArrowRight size={11} className="text-white/40" />
                          )}
                          {ev.new_status && (
                            <span className="px-1.5 py-0.5 bg-[#00e599]/10 border border-[#00e599]/30 text-[#00e599] text-[10px] font-semibold">
                              {ev.new_status}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/30">--</span>
                      )}
                    </td>

                    {/* Details Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="px-2.5 py-1 border border-white/10 hover:border-white/30 text-white/60 hover:text-white transition-colors text-[10px] uppercase font-mono cursor-pointer"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && events.length > 0 && (
          <div className="border-t border-white/10 bg-[#050708] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-white/50">
            <div>
              Showing {events.length} of {totalCount} total audit records · Page {page} of {totalPages}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-[#080a0c] border border-white/10 text-xs font-mono text-white/70 px-2 py-1"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1 border border-white/10 disabled:opacity-30 hover:border-white/20 text-white/70 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 border border-white/10 disabled:opacity-30 hover:border-white/20 text-white/70 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Drawer Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-[#050708]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border border-white/20 bg-[#080a0c] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative animate-fadeIn">
            {/* Header Strip */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[9px] uppercase px-2 py-0.5 border border-[#9b7cff]/40 bg-[#9b7cff]/10 text-[#9b7cff] font-bold">
                    AUDIT RECORD
                  </span>
                  <span className="font-mono text-xs text-white/40">
                    ID: {selectedEvent.id}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-mono uppercase tracking-tight">
                  {selectedEvent.action}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 border border-white/10 text-white/60 hover:text-white hover:border-white/30"
              >
                <X size={18} />
              </button>
            </div>

            {/* Core Fields Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="border border-white/5 bg-[#050708] p-3">
                <span className="text-[10px] text-white/40 uppercase block">OUTCOME</span>
                <span
                  className={`font-bold ${
                    selectedEvent.outcome === "SUCCESS"
                      ? "text-[#00e599]"
                      : "text-rose-400"
                  }`}
                >
                  {selectedEvent.outcome}
                </span>
              </div>

              <div className="border border-white/5 bg-[#050708] p-3">
                <span className="text-[10px] text-white/40 uppercase block">ACTOR ROLE</span>
                <span className="text-white capitalize">{selectedEvent.actor_role}</span>
              </div>

              <div className="border border-white/5 bg-[#050708] p-3">
                <span className="text-[10px] text-white/40 uppercase block">ENTITY TYPE</span>
                <span className="text-white uppercase">{selectedEvent.entity_type}</span>
              </div>

              <div className="border border-white/5 bg-[#050708] p-3 sm:col-span-2">
                <span className="text-[10px] text-white/40 uppercase block">ACTOR IDENTITY</span>
                <span className="text-white/90 truncate block">
                  {selectedEvent.actor_email || selectedEvent.actor_id || "System"}
                </span>
              </div>

              <div className="border border-white/5 bg-[#050708] p-3">
                <span className="text-[10px] text-white/40 uppercase block">REFERENCE</span>
                <span className="text-[#00e599] font-bold">
                  {selectedEvent.entity_reference || "--"}
                </span>
              </div>
            </div>

            {/* Timestamps & Security Correlation */}
            <div className="border border-white/10 bg-[#050708] p-4 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/40">EXACT UTC TIME:</span>
                <span className="text-white">{new Date(selectedEvent.created_at).toISOString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/40">CAIRO LOCAL TIME:</span>
                <span className="text-white/80">{new Date(selectedEvent.created_at).toLocaleString("en-GB")}</span>
              </div>
              {selectedEvent.request_id && (
                <div className="flex items-center justify-between">
                  <span className="text-white/40">REQUEST / CORRELATION ID:</span>
                  <span className="text-[#18c8ed]">{selectedEvent.request_id}</span>
                </div>
              )}
              {selectedEvent.error_category && (
                <div className="flex items-center justify-between">
                  <span className="text-rose-400">ERROR CATEGORY:</span>
                  <span className="text-rose-400 font-bold">{selectedEvent.error_category}</span>
                </div>
              )}
            </div>

            {/* Sanitized Metadata JSON Viewer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={13} className="text-[#00e599]" />
                  <span>SANITIZED OPERATION METADATA</span>
                </span>
                <span className="text-[10px] font-mono text-white/30 uppercase">
                  CONFIDENTIAL · PII REDACTED
                </span>
              </div>

              <pre className="border border-white/10 bg-[#050708] p-4 font-mono text-xs text-[#00e599]/90 overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedEvent.metadata || {}, null, 2)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 border border-white/10 text-xs font-mono text-white hover:bg-white/10 uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
