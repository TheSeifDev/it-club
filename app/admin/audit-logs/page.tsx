import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, ClipboardList } from "lucide-react";
import { requireStaffRole } from "../../../lib/auth/page-guard";
import AuditLogClient from "./AuditLogClient";

export const metadata: Metadata = {
  title: "Audit History — IT Club Admin",
  description: "Secure, immutable audit trail for administrative operations and candidate records.",
  robots: { index: false, follow: false },
};

export default async function AdminAuditLogsPage(props: {
  searchParams: Promise<{ actorId?: string }>;
}) {
  // Strictly enforce Owner role (Admins and students rejected)
  const { user, role } = await requireStaffRole(["owner"]);
  const searchParams = await props.searchParams;
  const initialActorId = searchParams?.actorId?.trim() || undefined;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>DASHBOARD</span>
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-xs font-mono text-[#9b7cff] uppercase tracking-wider flex items-center gap-1.5">
            <ClipboardList size={14} />
            <span>SYSTEM AUDIT TRAIL</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 border border-[#9b7cff]/40 bg-[#9b7cff]/10 px-2.5 py-1 text-[11px] font-mono text-[#9b7cff]">
            <ShieldAlert size={13} />
            <span className="uppercase font-semibold">OWNER CLEARANCE REQUIRED: {role.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Interactive Owner Audit Viewer */}
      <AuditLogClient
        ownerEmail={user.email || "owner@itclub.org"}
        initialActorId={initialActorId}
      />
    </div>
  );
}
