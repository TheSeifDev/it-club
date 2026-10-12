import React from "react";
import Link from "next/link";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Inbox,
  UserCheck,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { requireStaffRole } from "../../lib/auth/page-guard";
import { getDashboardMetrics, listApplications } from "../../lib/admin/queries";
import { TRACK_METADATA, STATUS_METADATA } from "../../lib/admin/transitions";
import type { CommitteeTrack, DashboardMetrics, ApplicationListItem } from "../../lib/admin/types";

const TRACKS: CommitteeTrack[] = ["it", "rnd", "oc", "sm", "pr", "hr"];

export default async function AdminPage() {
  await requireStaffRole(["owner", "admin"]);

  let metrics: DashboardMetrics | null = null;
  let metricsError: string | null = null;
  let recentApplications: ApplicationListItem[] = [];

  try {
    metrics = await getDashboardMetrics();
    const listRes = await listApplications({ pageSize: 5, sortBy: "created_at", sortOrder: "desc" });
    recentApplications = listRes.applications;
  } catch (err: unknown) {
    metricsError = err instanceof Error ? err.message : "Failed to load database records.";
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border border-white/10 bg-[#080a0c] p-6 sm:p-8">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00e599] animate-pulse" />
              <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#00e599] uppercase">
                RECRUITMENT WORKSPACE · SEASON 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Recruitment Dashboard
            </h1>
            <p className="arabic text-sm text-white/50 mt-1 font-medium">
              متابعة وإدارة طلبات التقديم لجميع لجان نادي تكنولوجيا المعلومات.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-2 bg-[#00e599] hover:bg-[#00c985] text-[#050708] font-mono text-xs font-bold tracking-wider uppercase px-4 py-2.5 transition-all shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:shadow-[0_0_30px_rgba(0,229,153,0.45)]"
            >
              <span>MANAGE APPLICANTS</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Database Error Banner if occurred */}
      {metricsError && (
        <div className="border border-rose-500/40 bg-rose-500/10 p-5 flex items-start gap-3 text-rose-300">
          <AlertTriangle size={20} className="shrink-0 text-rose-400 mt-0.5" />
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-200">
              Database Connection Notice
            </h3>
            <p className="text-xs mt-1 text-rose-300/80 leading-relaxed">
              Could not retrieve real-time aggregates: {metricsError}. Please verify database credentials or refresh.
            </p>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      {metrics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Applications */}
            <div className="border border-white/10 bg-[#080a0c] p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-white/40 mb-3">
                <span className="font-mono text-[10px] tracking-widest uppercase">TOTAL SUBMISSIONS</span>
                <Users size={16} className="text-[#18c8ed]" />
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-white">
                {metrics.total}
              </div>
              <p className="text-[11px] font-mono text-white/40 mt-1">
                {metrics.recentCount24h} in the last 24h
              </p>
            </div>

            {/* Pending Review */}
            <div className={`border p-5 relative overflow-hidden ${
              metrics.byStatus.PENDING_REVIEW > 0
                ? "border-amber-500/40 bg-amber-500/[0.04]"
                : "border-white/10 bg-[#080a0c]"
            }`}>
              <div className="flex items-center justify-between text-amber-400 mb-3">
                <span className="font-mono text-[10px] tracking-widest uppercase">PENDING REVIEW</span>
                <Clock size={16} />
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400">
                {metrics.byStatus.PENDING_REVIEW}
              </div>
              <Link
                href="/admin/applications?status=PENDING_REVIEW"
                className="text-[11px] font-mono text-amber-400/80 hover:text-amber-300 mt-1 inline-flex items-center gap-1 transition-colors"
              >
                <span>Needs Review &rarr;</span>
              </Link>
            </div>

            {/* Under Review */}
            <div className="border border-white/10 bg-[#080a0c] p-5">
              <div className="flex items-center justify-between text-sky-400 mb-3">
                <span className="font-mono text-[10px] tracking-widest uppercase">UNDER REVIEW</span>
                <Inbox size={16} />
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-sky-400">
                {metrics.byStatus.UNDER_REVIEW}
              </div>
              <p className="text-[11px] font-mono text-white/40 mt-1">Actively being assessed</p>
            </div>

            {/* Shortlisted */}
            <div className="border border-white/10 bg-[#080a0c] p-5">
              <div className="flex items-center justify-between text-purple-400 mb-3">
                <span className="font-mono text-[10px] tracking-widest uppercase">SHORTLISTED</span>
                <UserCheck size={16} />
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-purple-400">
                {metrics.byStatus.SHORTLISTED}
              </div>
              <p className="text-[11px] font-mono text-white/40 mt-1">Screened for interview</p>
            </div>
          </div>

          {/* Secondary Outcome Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border border-white/10 bg-[#080a0c] p-4">
            <div className="flex items-center justify-between px-3 py-2 border-r border-white/5 last:border-none">
              <div>
                <p className="font-mono text-[10px] uppercase text-white/40">Accepted</p>
                <p className="font-mono text-xl font-bold text-[#00e599]">{metrics.byStatus.ACCEPTED}</p>
              </div>
              <CheckCircle2 size={18} className="text-[#00e599]/60" />
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-r border-white/5 last:border-none">
              <div>
                <p className="font-mono text-[10px] uppercase text-white/40">Waitlisted</p>
                <p className="font-mono text-xl font-bold text-zinc-300">{metrics.byStatus.WAITLISTED}</p>
              </div>
              <HelpCircle size={18} className="text-zinc-400/60" />
            </div>

            <div className="flex items-center justify-between px-3 py-2 border-r border-white/5 last:border-none">
              <div>
                <p className="font-mono text-[10px] uppercase text-white/40">Rejected</p>
                <p className="font-mono text-xl font-bold text-rose-400">{metrics.byStatus.REJECTED}</p>
              </div>
              <XCircle size={18} className="text-rose-400/60" />
            </div>

            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="font-mono text-[10px] uppercase text-white/40">Needs Correction</p>
                <p className="font-mono text-xl font-bold text-orange-400">{metrics.byStatus.NEEDS_CORRECTION}</p>
              </div>
              <AlertTriangle size={18} className="text-orange-400/60" />
            </div>
          </div>

          {/* Track Breakdown Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Applications by Committee Track</h2>
                <p className="arabic text-xs text-white/50">توزيع المتقدمين حسب الرغبة الأولى للجان</p>
              </div>
              <span className="font-mono text-xs text-white/40">6 SPECIALIZED TRACKS</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {TRACKS.map((track) => {
                const meta = TRACK_METADATA[track];
                const count = metrics!.byTrack[track] || 0;
                const percentage = metrics!.total > 0 ? Math.round((count / metrics!.total) * 100) : 0;

                return (
                  <Link
                    key={track}
                    href={`/admin/applications?track=${track}`}
                    className="border border-white/10 bg-[#080a0c] p-4 hover:border-white/20 hover:bg-white/[0.02] transition-all group block"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white uppercase">{meta.abbreviation}</span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                    </div>
                    <div className="text-2xl font-mono font-bold text-white mb-1">{count}</div>
                    <p className="arabic text-[11px] text-white/40 truncate">{meta.arabicName}</p>
                    <div className="mt-3 w-full bg-white/5 h-1">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: meta.color }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Submissions Preview */}
          <div className="border border-white/10 bg-[#080a0c] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Recent Applications</h2>
                <p className="text-xs text-white/50">Latest submissions across all tracks</p>
              </div>
              <Link
                href="/admin/applications"
                className="text-xs font-mono text-[#00e599] hover:text-[#00c985] inline-flex items-center gap-1"
              >
                <span>View All ({metrics.total})</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="p-8 text-center text-white/40 font-mono text-xs">
                No applications submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-white/5 bg-white/[0.02] text-white/40 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Applicant Name</th>
                      <th className="px-5 py-3">Track</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Submitted</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {recentApplications.map((app) => {
                      const trackMeta = TRACK_METADATA[app.primary_track as CommitteeTrack] || {
                        abbreviation: app.primary_track,
                        color: "#fff",
                      };
                      const statusMeta = STATUS_METADATA[app.status as keyof typeof STATUS_METADATA] || {
                        label: app.status,
                        bgClass: "bg-white/10",
                        textClass: "text-white",
                        borderClass: "border-white/20",
                        dotClass: "bg-white",
                      };

                      return (
                        <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-bold text-[#00e599] whitespace-nowrap">
                            {app.application_reference}
                          </td>
                          <td className="px-5 py-3 text-white font-sans font-medium whitespace-nowrap">
                            {app.full_name}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
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
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] uppercase font-semibold ${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-white/40 whitespace-nowrap">
                            {new Date(app.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-5 py-3 text-right whitespace-nowrap">
                            <Link
                              href={`/admin/applications/${app.id}`}
                              className="text-[#00e599] hover:underline font-semibold"
                            >
                              Review &rarr;
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
