import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { requireStaffRole } from "../../../../lib/auth/page-guard";
import { getApplicationById, getLatestInvitationNotification } from "../../../../lib/admin/queries";
import { requireApplicationCommitteeAccess } from "../../../../lib/auth/committee-access";
import ApplicantDetailClient from "./ApplicantDetailClient";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: `Applicant ${id} — IT Club Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function ApplicantDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { role } = await requireStaffRole(["owner", "admin"]);
  const { id } = await props.params;

  let application = null;
  let latestInvitation = null;
  let loadError = null;
  let deniedAccessError: string | null = null;

  try {
    application = await getApplicationById(id);
    if (application) {
      const access = await requireApplicationCommitteeAccess(
        application.application_reference,
        application.primary_track,
        "VIEW_APPLICATION_PAGE"
      );
      if (!access.allowed) {
        deniedAccessError =
          access.error || "You do not have authorization to view student applications for this committee.";
      } else {
        latestInvitation = await getLatestInvitationNotification(application.id);
      }
    }
  } catch (err: unknown) {
    loadError = err instanceof Error ? err.message : "Failed to query database.";
  }

  if (deniedAccessError) {
    return (
      <div className="p-12 border border-rose-500/20 bg-rose-500/5 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-white/60 max-w-md mx-auto font-mono">
          {deniedAccessError}
        </p>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
        >
          <ArrowLeft size={14} />
          Return to Applications
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 border border-rose-500/30 bg-rose-500/10 text-rose-300 space-y-4 font-mono text-xs">
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <AlertTriangle size={16} />
          <span>DATABASE QUERY ERROR</span>
        </div>
        <p>{loadError}</p>
        <Link href="/admin/applications" className="underline text-white inline-block">
          &larr; Return to Applications
        </Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-12 border border-white/10 bg-[#080a0c] text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Applicant Not Found</h2>
        <p className="text-xs text-white/50 max-w-sm mx-auto font-mono">
          No recruitment application matches identifier <code className="text-[#00e599]">{id}</code>.
        </p>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
        >
          <ArrowLeft size={13} />
          <span>Back to Applications List</span>
        </Link>
      </div>
    );
  }

  return (
    <ApplicantDetailClient
      application={application}
      latestInvitation={latestInvitation}
      currentStaffRole={role}
      serverTimestamp={new Date().toISOString()}
    />
  );
}
