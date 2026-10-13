import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HelpCircle,
  ListChecks,
  ScanLine,
  Users,
  XCircle,
} from "lucide-react";
import { requireStaffRole } from "../../lib/auth/page-guard";
import { getDashboardMetrics, listApplications } from "../../lib/admin/queries";
import { STATUS_METADATA, TRACK_METADATA } from "../../lib/admin/transitions";
import type { ApplicationListItem, ApplicationStatus, CommitteeTrack, DashboardMetrics } from "../../lib/admin/types";
import { AdminPageHeader, ErrorState, MetricCard, Panel, StatusBadge, EmptyState } from "./dashboard-ui";
import {
  ApplicationsOverTimeChart,
  ReviewPipelineChart,
  StatusDistributionChart,
  TrackDistributionChart,
} from "./DashboardCharts";

const kpis: Array<{
  status?: ApplicationStatus;
  label: string;
  icon: typeof Users;
  tone: string;
  href?: string;
  value: (metrics: DashboardMetrics) => number;
  detail?: (metrics: DashboardMetrics) => string;
}> = [
  {
    label: "Total applications",
    icon: Users,
    tone: "#18c8ed",
    href: "/admin/applications",
    value: (metrics) => metrics.total,
    detail: (metrics) => `${metrics.recentCount24h} submitted in the last 24 hours`,
  },
  {
    status: "PENDING_REVIEW",
    label: "Pending review",
    icon: Clock3,
    tone: "#f59e0b",
    href: "/admin/applications?status=PENDING_REVIEW",
    value: (metrics) => metrics.byStatus.PENDING_REVIEW,
  },
  {
    status: "UNDER_REVIEW",
    label: "Under review",
    icon: ListChecks,
    tone: "#38bdf8",
    href: "/admin/applications?status=UNDER_REVIEW",
    value: (metrics) => metrics.byStatus.UNDER_REVIEW,
  },
  {
    status: "SHORTLISTED",
    label: "Shortlisted",
    icon: ListChecks,
    tone: "#a78bfa",
    href: "/admin/applications?status=SHORTLISTED",
    value: (metrics) => metrics.byStatus.SHORTLISTED,
  },
  {
    status: "INTERVIEW_SCHEDULED",
    label: "Interview scheduled",
    icon: CalendarClock,
    tone: "#2dd4bf",
    href: "/admin/applications?status=INTERVIEW_SCHEDULED",
    value: (metrics) => metrics.byStatus.INTERVIEW_SCHEDULED,
  },
  {
    status: "ACCEPTED",
    label: "Accepted",
    icon: CheckCircle2,
    tone: "#00e599",
    href: "/admin/applications?status=ACCEPTED",
    value: (metrics) => metrics.byStatus.ACCEPTED,
  },
  {
    status: "REJECTED",
    label: "Rejected",
    icon: XCircle,
    tone: "#fb7185",
    href: "/admin/applications?status=REJECTED",
    value: (metrics) => metrics.byStatus.REJECTED,
  },
  {
    status: "WAITLISTED",
    label: "Waitlisted",
    icon: HelpCircle,
    tone: "#d4d4d8",
    href: "/admin/applications?status=WAITLISTED",
    value: (metrics) => metrics.byStatus.WAITLISTED,
  },
];

export default async function AdminPage() {
  await requireStaffRole(["owner", "admin"]);

  let metrics: DashboardMetrics | null = null;
  let metricsError: string | null = null;
  let recentApplications: ApplicationListItem[] = [];

  try {
    metrics = await getDashboardMetrics();
    const listRes = await listApplications({ pageSize: 8, sortBy: "created_at", sortOrder: "desc" });
    recentApplications = listRes.applications;
  } catch (err: unknown) {
    metricsError = err instanceof Error ? err.message : "Failed to load database records.";
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Recruitment operations"
        title="Recruitment Overview"
        description={`Live operational view for IT Club applications. ${today}`}
      >
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-2 bg-[#00e599] px-4 py-2.5 text-sm font-black text-[#050708] transition-colors hover:bg-[#00c985]"
        >
          Manage applications
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/admin/interviews/scan"
          className="inline-flex items-center gap-2 border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-bold text-white/78 transition-colors hover:border-white/25 hover:text-white"
        >
          <ScanLine size={16} />
          Open scanner
        </Link>
      </AdminPageHeader>

      {metricsError ? <ErrorState message={metricsError} /> : null}

      {metrics ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <MetricCard
                key={item.label}
                label={item.label}
                value={item.value(metrics)}
                icon={item.icon}
                tone={item.tone}
                href={item.href}
                detail={item.detail?.(metrics) || (item.status ? STATUS_METADATA[item.status].description : undefined)}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
            <Panel
              title="Applications Over Time"
              description="Daily submissions from the applications table over the last 14 days."
              className="overflow-hidden p-0"
            >
              <div className="p-4 sm:p-5">
                <ApplicationsOverTimeChart data={metrics.submissionsByDay} />
              </div>
            </Panel>

            <Panel
              title="Status Distribution"
              description="Current application counts grouped by review status."
            >
              <StatusDistributionChart byStatus={metrics.byStatus} />
            </Panel>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <Panel
              title="Committee Preference Distribution"
              description="Compare primary choices, optional secondary choices, and combined interest across all tracks."
            >
              <TrackDistributionChart
                trackMetrics={metrics.trackMetrics}
                totalApplicants={metrics.total}
              />
            </Panel>
            <Panel
              title="Review Pipeline"
              description="Real-time progression through applicant evaluation stages. Click any stage to drill down."
            >
              <ReviewPipelineChart pipeline={metrics.pipeline} total={metrics.total} />
            </Panel>
          </section>

          <Panel
            title="Recent Applications"
            description="Latest submissions with direct access to the applicant detail workflow."
            className="overflow-hidden"
          >
            {recentApplications.length === 0 ? (
              <EmptyState title="No applications submitted yet" />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.025] text-[11px] uppercase tracking-[0.14em] text-white/38">
                      <tr>
                        <th className="px-5 py-3.5">Applicant</th>
                        <th className="px-5 py-3.5">Reference</th>
                        <th className="px-5 py-3.5">Track</th>
                        <th className="px-5 py-3.5">Academic year</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Submitted</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentApplications.map((app) => (
                        <RecentApplicationRow key={app.id} app={app} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-white/10 lg:hidden">
                  {recentApplications.map((app) => (
                    <RecentApplicationCard key={app.id} app={app} />
                  ))}
                </div>
              </>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function RecentApplicationRow({ app }: { app: ApplicationListItem }) {
  const trackMeta = TRACK_METADATA[app.primary_track as CommitteeTrack];
  const statusMeta = STATUS_METADATA[app.status];

  return (
    <tr className="transition-colors hover:bg-white/[0.025]">
      <td className="px-5 py-4">
        <Link
          href={`/admin/applications/${app.id}`}
          className="font-bold text-white hover:text-[#00e599] transition-colors"
        >
          {app.full_name}
        </Link>
        <p className="mt-0.5 text-xs text-white/40">{app.university_email}</p>
      </td>
      <td className="px-5 py-4 font-mono font-bold text-[#00e599]">{app.application_reference}</td>
      <td className="px-5 py-4">
        <Link
          href={`/admin/applications?track=${app.primary_track}`}
          className="inline-flex border px-2.5 py-1 text-[11px] font-black transition-opacity hover:opacity-80"
          style={{
            borderColor: `${trackMeta.color}40`,
            color: trackMeta.color,
            backgroundColor: `${trackMeta.color}12`,
          }}
          title={`Filter by ${trackMeta.name}`}
        >
          {trackMeta.abbreviation}
        </Link>
      </td>
      <td className="px-5 py-4 text-white/58">{app.academic_year}</td>
      <td className="px-5 py-4">
        <Link
          href={`/admin/applications?status=${app.status}`}
          className="inline-block transition-opacity hover:opacity-85"
          title={`Filter by ${statusMeta.label}`}
        >
          <StatusBadge className={`${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dotClass}`} />
            {statusMeta.label}
          </StatusBadge>
        </Link>
      </td>
      <td className="px-5 py-4 text-white/45">
        {new Date(app.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="px-5 py-4 text-right">
        <Link
          href={`/admin/applications/${app.id}`}
          className="inline-flex items-center gap-1 font-bold text-[#00e599] hover:underline"
        >
          Open
          <ArrowRight size={13} />
        </Link>
      </td>
    </tr>
  );
}

function RecentApplicationCard({ app }: { app: ApplicationListItem }) {
  const trackMeta = TRACK_METADATA[app.primary_track as CommitteeTrack];
  const statusMeta = STATUS_METADATA[app.status];

  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/admin/applications/${app.id}`}
            className="font-bold text-white hover:text-[#00e599] transition-colors"
          >
            {app.full_name}
          </Link>
          <p className="mt-1 font-mono text-xs font-bold text-[#00e599]">{app.application_reference}</p>
        </div>
        <Link href={`/admin/applications?status=${app.status}`}>
          <StatusBadge className={`${statusMeta.bgClass} ${statusMeta.borderClass} ${statusMeta.textClass}`}>
            {statusMeta.label}
          </StatusBadge>
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
        <Link
          href={`/admin/applications?track=${app.primary_track}`}
          style={{ color: trackMeta.color }}
          className="font-bold hover:underline"
        >
          {trackMeta.abbreviation}
        </Link>
        <span>·</span>
        <span>{app.academic_year}</span>
        <span>·</span>
        <span>{new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
      <Link
        href={`/admin/applications/${app.id}`}
        className="inline-flex items-center gap-1 text-sm font-bold text-[#00e599]"
      >
        Open applicant
        <ArrowRight size={14} />
      </Link>
    </article>
  );
}
