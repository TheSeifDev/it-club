import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireStaffRole } from "../../../lib/auth/page-guard.ts";
import AdminChangePasswordForm from "./AdminChangePasswordForm";

export const metadata: Metadata = {
  title: "Update Password — IT Club Admin",
  description: "Mandatory administrative password setup and credential verification.",
  robots: { index: false, follow: false },
};

export default async function AdminChangePasswordPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const isExpiredQuery = searchParams.error === "expired";

  const staff = await requireStaffRole(["owner", "admin", "interviewer"], {
    allowPendingPasswordChange: true,
  });

  const isExpired = Boolean(staff.isTempPasswordExpired || isExpiredQuery);
  const isMandatory = Boolean(staff.passwordChangeRequired);

  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#00e599] selection:text-[#050708]">
      {/* Ambient Emerald Aurora Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] opacity-[0.12] blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 280px at 50% 50%, #00e599 0%, #18c8ed 40%, transparent 80%)",
        }}
      />

      <div className="relative w-full max-w-lg mx-auto mb-6">
        {!isMandatory ? (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 font-mono text-xs tracking-wider uppercase text-white/40 hover:text-[#00e599] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400/90">
            <ShieldAlert size={14} />
            <span>Administrative Clearance Gate · Password Replacement Required</span>
          </div>
        )}
      </div>

      <div className="relative">
        <AdminChangePasswordForm
          isExpired={isExpired}
          expiresAt={staff.staffMember?.temporary_password_expires_at || null}
          staffEmail={staff.staffMember?.email || staff.user.email || "staff@itclub.org"}
          role={staff.role}
          isMandatory={isMandatory}
        />
      </div>
    </div>
  );
}
