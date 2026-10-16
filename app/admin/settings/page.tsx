import React from "react";
import type { Metadata } from "next";
import {
  Server,
  Mail,
  ShieldCheck,
  Activity,
  Database,
  Users,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { requireStaffRole } from "../../../lib/auth/page-guard";
import { getAuditStats } from "../../../lib/audit/service";
import { getEmailConfig, isEmailConfigured } from "../../../lib/email/config";
import { getServiceRoleClient } from "../../../lib/auth/service-role";
import { AdminPageHeader, Panel } from "../dashboard-ui";
import AdminSettingsClient from "./AdminSettingsClient";
import OwnerStaffManagement, { type StaffDirectoryItem } from "./OwnerStaffManagement";

export const metadata: Metadata = {
  title: "Settings - IT Club Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  const { user, role } = await requireStaffRole(["owner", "admin"]);

  // Fetch real telemetry in parallel
  const [auditStats, emailConfigured, emailConfig] = await Promise.all([
    getAuditStats().catch(() => ({
      total: 0,
      recent24h: 0,
      successful: 0,
      failed: 0,
      byEntityType: {},
    })),
    Promise.resolve(isEmailConfigured()),
    Promise.resolve(getEmailConfig()),
  ]);

  // If user is owner, fetch verified staff roster from database
  let staffList: StaffDirectoryItem[] = [];
  if (role === "owner") {
    try {
      const serviceClient = getServiceRoleClient();
      const { data, error } = await serviceClient
        .from("staff_members")
        .select("user_id, role, email, created_at, password_change_required, temporary_password_issued_at, temporary_password_expires_at, password_changed_at")
        .order("created_at", { ascending: true });

      if (!error && data) {
        staffList = data as StaffDirectoryItem[];
      }
    } catch {
      // Gracefully handle query fallback
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Admin workspace"
        title="Settings & System Health"
        description="Manage your staff session, account credentials, and interface preferences. Review live infrastructure telemetry and recruitment system boundaries."
      />

      {/* Live Operational Telemetry Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* PostgreSQL Database */}
        <div className="border border-white/10 bg-[#080a0c] p-4">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Database Engine</span>
            <Database size={16} className="text-[#00e599]" />
          </div>
          <p className="mt-3 text-lg font-black text-white">PostgreSQL 15</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#00e599]">
            <CheckCircle2 size={13} />
            <span>RLS Enforced · Supabase SSR</span>
          </div>
        </div>

        {/* Audit Trail Telemetry */}
        <div className="border border-white/10 bg-[#080a0c] p-4">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Audit Trail</span>
            <Activity size={16} className="text-[#9b7cff]" />
          </div>
          <p className="mt-3 text-lg font-black tabular-nums text-white">
            {auditStats.total} <span className="text-xs font-normal text-white/50">events</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
            <span className="inline-block h-2 w-2 rounded-full bg-[#9b7cff]" />
            <span>{auditStats.recent24h} in past 24h · Immutable</span>
          </div>
        </div>

        {/* Email Dispatcher */}
        <div className="border border-white/10 bg-[#080a0c] p-4">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Mail Dispatcher</span>
            <Mail size={16} className={emailConfigured ? "text-[#00e599]" : "text-amber-400"} />
          </div>
          <p className="mt-3 text-lg font-black text-white">
            {emailConfigured ? "Gmail SMTP" : "Setup Required"}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {emailConfigured ? (
              <>
                <CheckCircle2 size={13} className="text-[#00e599]" />
                <span className="text-white/60">Port {emailConfig.smtpPort} · SSL/TLS</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} className="text-amber-400" />
                <span className="text-amber-300/80">Missing Gmail credentials</span>
              </>
            )}
          </div>
        </div>

        {/* Security & Access */}
        <div className="border border-white/10 bg-[#080a0c] p-4">
          <div className="flex items-center justify-between text-white/50">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em]">Staff Clearance</span>
            <ShieldCheck size={16} className="text-[#00e599]" />
          </div>
          <p className="mt-3 text-lg font-black uppercase text-white">{role}</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
            <Lock size={13} className="text-[#00e599]" />
            <span>Server Role-Guarded</span>
          </div>
        </div>
      </div>

      {/* Account Profile, Password & Interface Preferences */}
      <AdminSettingsClient
        userEmail={user.email || "staff@itclub.org"}
        userId={user.id}
        role={role}
      />

      {/* Verified Staff Management & Directory (Owner Clearance Only) */}
      {role === "owner" && (
        <OwnerStaffManagement
          initialStaffList={staffList}
          currentUserId={user.id}
          isEmailConfigured={emailConfigured}
        />
      )}

      {/* Recruitment Operations & Governance Boundaries */}
      <Panel
        title="Recruitment Operations & Architecture"
        description="Global settings reflect actual database capabilities and server-enforced rules. Cosmetic or non-persisted controls are intentionally omitted."
      >
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="border border-white/10 bg-[#050708] p-4">
            <div className="flex items-center gap-2 text-white">
              <Server size={15} className="text-[#00e599]" />
              <p className="text-sm font-bold">Registration Gate</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Registration opens/closes via environment and server validation routes. No fake client-side toggle is displayed without backed database persistence.
            </p>
          </div>
          <div className="border border-white/10 bg-[#050708] p-4">
            <div className="flex items-center gap-2 text-white">
              <Users size={15} className="text-[#00e599]" />
              <p className="text-sm font-bold">Privilege Escalation</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Staff roles are stored in <code>public.staff_members</code>. Admins cannot elevate themselves to Owner, preserving strict multi-tier clearance.
            </p>
          </div>
          <div className="border border-white/10 bg-[#050708] p-4">
            <div className="flex items-center gap-2 text-white">
              <Activity size={15} className="text-[#9b7cff]" />
              <p className="text-sm font-bold">Immutable Audit Trail</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Every sensitive status change, QR check-in, and note update is permanently appended to <code>public.audit_events</code> with sanitized metadata.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}

