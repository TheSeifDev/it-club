import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import { requireStaffRole } from "../../../lib/auth/page-guard";
import { listApplications } from "../../../lib/admin/queries";
import ApplicationsListClient from "./ApplicationsListClient";
import type { ApplicationStatus, CommitteeTrack, AcademicYear, ApplicationFilters } from "../../../lib/admin/types";

export const metadata: Metadata = {
  title: "Applications Management — IT Club Admin",
  robots: { index: false, follow: false },
};

export default async function ApplicationsPage(props: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    track?: string;
    trackScope?: string;
    date?: string;
    year?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  await requireStaffRole(["owner", "admin"]);

  const params = await props.searchParams;

  const filters: ApplicationFilters = {
    search: params.search || undefined,
    status: (params.status as ApplicationStatus) || undefined,
    track: (params.track as CommitteeTrack) || undefined,
    trackScope: (params.trackScope as ApplicationFilters["trackScope"]) || undefined,
    date: params.date || undefined,
    year: (params.year as AcademicYear) || undefined,
    sortBy: (params.sortBy as ApplicationFilters["sortBy"]) || "created_at",
    sortOrder: (params.sortOrder as "asc" | "desc") || "desc",
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 20,
  };

  const data = await listApplications(filters);

  return (
    <Suspense
      fallback={
        <div className="p-16 border border-white/10 bg-[#080a0c] flex flex-col items-center justify-center space-y-3 font-mono text-xs">
          <Loader2 size={24} className="animate-spin text-[#00e599]" />
          <span className="text-white/40 uppercase tracking-widest">Loading applications pipeline...</span>
        </div>
      }
    >
      <ApplicationsListClient data={data} filters={filters} />
    </Suspense>
  );
}
