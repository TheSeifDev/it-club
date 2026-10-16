import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, QrCode } from "lucide-react";
import { requireStaffRole } from "../../../../lib/auth/page-guard";
import ScannerClient from "./ScannerClient";

export const metadata: Metadata = {
  title: "Interview QR Scanner — IT Club Admin",
  description: "Official interview check-in and attendance scanner for IT Club recruitment.",
  robots: { index: false, follow: false },
};

export default async function AdminInterviewScanPage() {
  // Enforce staff authorization on the server
  const { user, role } = await requireStaffRole(["owner", "admin", "interviewer"]);
  const isInterviewer = role === "interviewer";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {!isInterviewer && (
            <>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                <span>DASHBOARD</span>
              </Link>
              <span className="text-white/20">/</span>
            </>
          )}
          <span className="text-xs font-mono text-[#00e599] uppercase tracking-wider flex items-center gap-1.5">
            <QrCode size={13} />
            <span>INTERVIEWS SCANNER &amp; EVALUATION</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-mono ${
            role === "owner"
              ? "border-[#9b7cff]/30 bg-[#9b7cff]/10 text-[#b49dff]"
              : role === "interviewer"
              ? "border-[#38bdf8]/30 bg-[#38bdf8]/10 text-[#38bdf8]"
              : "border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]"
          }`}>
            <ShieldCheck size={13} />
            <span className="uppercase font-semibold">AUTHORIZED STAFF: {role.toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Interactive Client Scanner */}
      <ScannerClient staffEmail={user.email || "staff@itclub.org"} staffRole={role} />
    </div>
  );
}
