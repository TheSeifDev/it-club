"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  Mail,
  X,
  Loader2,
  Pencil,
  Activity,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Panel } from "../dashboard-ui";
import { type CommitteeTrack, VALID_COMMITTEE_TRACKS } from "../../../lib/auth/roles";
import { TRACK_METADATA } from "../../../lib/admin/transitions";

export interface StaffDirectoryItem {
  user_id: string;
  role: "owner" | "admin" | "interviewer";
  committee?: CommitteeTrack | null;
  email: string | null;
  created_at: string;
  password_change_required?: boolean;
  temporary_password_issued_at?: string | null;
  temporary_password_expires_at?: string | null;
  password_changed_at?: string | null;
}

interface Props {
  initialStaffList: StaffDirectoryItem[];
  currentUserId: string;
  isEmailConfigured: boolean;
}

interface IssuedCredential {
  email: string;
  role: string;
  temporaryPassword: string;
  expiresAt: string;
  emailDelivery?: {
    configured: boolean;
    sent: boolean;
    status?: string;
    messageId?: string;
    response?: string;
    error?: string;
  };
  isReissue?: boolean;
}

interface EditingStaff {
  userId: string;
  email: string;
  role: "admin" | "interviewer";
  committee: CommitteeTrack | null;
  originalEmail: string;
  originalRole: "admin" | "interviewer";
  originalCommittee: CommitteeTrack | null;
}

export default function OwnerStaffManagement({
  initialStaffList,
  currentUserId,
  isEmailConfigured,
}: Props) {
  const [staffList, setStaffList] = useState<StaffDirectoryItem[]>(initialStaffList);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "interviewer">("admin");
  const [inviteCommittee, setInviteCommittee] = useState<CommitteeTrack | "">("hr");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [reissuingUserId, setReissuingUserId] = useState<string | null>(null);
  const [retryingUserId, setRetryingUserId] = useState<string | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState<string | null>(null);

  // Active one-time credential panel (never saved to localStorage or sessionStorage)
  const [issuedCredential, setIssuedCredential] = useState<IssuedCredential | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit Account Dialog state
  const [editingStaff, setEditingStaff] = useState<EditingStaff | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccessMessage, setEditSuccessMessage] = useState("");

  const handleCopyPassword = async () => {
    if (!issuedCredential) return;
    try {
      await navigator.clipboard.writeText(issuedCredential.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = issuedCredential.temporaryPassword;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");

    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setInviteError("Please enter an email address for the new staff member.");
      return;
    }

    setInviting(true);

    try {
      const res = await fetch("/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          role: inviteRole,
          committee: inviteCommittee || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setInviteError(data.error || "Failed to invite staff account.");
        setInviting(false);
        return;
      }

      // Add to local staff directory
      const newItem: StaffDirectoryItem = {
        user_id: data.userId,
        role: inviteRole,
        committee: (inviteCommittee as CommitteeTrack) || null,
        email: cleanEmail,
        created_at: data.issuedAt || new Date().toISOString(),
        password_change_required: true,
        temporary_password_issued_at: data.issuedAt,
        temporary_password_expires_at: data.expiresAt,
        password_changed_at: null,
      };

      setStaffList((prev) => [...prev, newItem]);
      setInviteEmail("");
      setIssuedCredential({
        email: cleanEmail,
        role: inviteRole,
        temporaryPassword: data.temporaryPassword,
        expiresAt: data.expiresAt,
        emailDelivery: data.emailDelivery,
        isReissue: false,
      });
      setInviting(false);
    } catch {
      setInviteError("Network failure while creating staff account. Please try again.");
      setInviting(false);
    }
  };

  const handleResetPassword = async (targetUserId: string, targetEmail: string | null) => {
    setReissuingUserId(targetUserId);

    try {
      const res = await fetch("/api/admin/staff/reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to reset temporary credentials.");
        setReissuingUserId(null);
        return;
      }

      // Update in local staff list
      setStaffList((prev) =>
        prev.map((item) =>
          item.user_id === targetUserId
            ? {
                ...item,
                password_change_required: true,
                temporary_password_issued_at: data.issuedAt,
                temporary_password_expires_at: data.expiresAt,
                password_changed_at: null,
              }
            : item
        )
      );

      setIssuedCredential({
        email: targetEmail || targetUserId,
        role: "admin",
        temporaryPassword: data.temporaryPassword,
        expiresAt: data.expiresAt,
        emailDelivery: data.emailDelivery,
        isReissue: true,
      });

      setReissuingUserId(null);
    } catch {
      alert("Network error while resetting administrator password.");
      setReissuingUserId(null);
    }
  };

  const handleRetryEmail = async (targetUserId: string, targetEmail: string | null) => {
    setRetryingUserId(targetUserId);

    try {
      const res = await fetch("/api/admin/staff/retry-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to resend invitation email.");
        setRetryingUserId(null);
        return;
      }

      setEditSuccessMessage(
        `Invitation re-sent: Accepted by mail provider for ${targetEmail || targetUserId} (Delivery not confirmed).`
      );
      setTimeout(() => setEditSuccessMessage(""), 6000);
      setRetryingUserId(null);
    } catch {
      alert("Network failure while retrying email dispatch.");
      setRetryingUserId(null);
    }
  };

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagnosticFeedback(null);

    try {
      const res = await fetch("/api/admin/staff/email-diagnostics", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setDiagnosticFeedback(
          `Diagnostic Check: ${data.verifyError || data.error || "SMTP verification could not complete."}`
        );
      } else {
        setDiagnosticFeedback(
          `Diagnostics Passed: SMTP verified & test email accepted by provider for ${data.testEmail?.recipient} (ID: ${data.testEmail?.messageId || "accepted"}). Delivery not confirmed until checked in mailbox.`
        );
      }
    } catch {
      setDiagnosticFeedback("Network error while running email diagnostics.");
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleOpenEdit = (member: StaffDirectoryItem) => {
    if (member.role === "owner") return;
    setEditError("");
    setEditSuccessMessage("");
    setEditingStaff({
      userId: member.user_id,
      email: member.email || "",
      role: member.role === "interviewer" ? "interviewer" : "admin",
      committee: member.committee || null,
      originalEmail: member.email || "",
      originalRole: member.role === "interviewer" ? "interviewer" : "admin",
      originalCommittee: member.committee || null,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError("");
    setEditSuccessMessage("");

    const cleanEmail = editingStaff.email.trim().toLowerCase();
    if (!cleanEmail) {
      setEditError("Please enter a valid email address.");
      return;
    }

    // Role cannot be owner
    if (editingStaff.role !== "admin" && editingStaff.role !== "interviewer") {
      setEditError("Role must be either 'admin' or 'interviewer'.");
      return;
    }

    setSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/staff/${editingStaff.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          role: editingStaff.role,
          committee: editingStaff.committee,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setEditError(data.error || "Failed to update staff account.");
        setSavingEdit(false);
        return;
      }

      // Update in local staff list
      setStaffList((prev) =>
        prev.map((item) =>
          item.user_id === editingStaff.userId
            ? {
                ...item,
                email: cleanEmail,
                role: editingStaff.role,
                committee: editingStaff.committee,
              }
            : item
        )
      );

      setSavingEdit(false);
      setEditingStaff(null);
      setEditSuccessMessage(`Account updated successfully: ${cleanEmail}`);
      setTimeout(() => setEditSuccessMessage(""), 5000);
    } catch {
      setEditError("Network error while saving staff account modifications.");
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Invite New Admin Form Panel */}
      <Panel
        title="Invite Administrator (Owner Clearance)"
        description={`Provision an administrative staff account with mandatory first-login password replacement and 24-hour temporary credential enforcement. ${
          isEmailConfigured
            ? "SMTP automated dispatch is configured."
            : "SMTP automated dispatch is not configured (manual delivery required)."
        }`}
      >
        <div className="p-5">
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-12 sm:items-end">
              <div className="sm:col-span-5">
                <label
                  htmlFor="invite-admin-email"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Staff Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/30">
                    <Mail size={15} />
                  </div>
                  <input
                    id="invite-admin-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="e.g. administrator@itclub.one"
                    required
                    disabled={inviting}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded border border-white/15 bg-[#050708] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="invite-staff-role"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Role
                </label>
                <select
                  id="invite-staff-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "interviewer")}
                  disabled={inviting}
                  className="w-full px-3 py-2.5 rounded border border-white/15 bg-[#050708] text-white text-xs font-mono focus:outline-none focus:border-[#00e599] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="interviewer">Interviewer</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="invite-staff-committee"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Committee Scope
                </label>
                <select
                  id="invite-staff-committee"
                  value={inviteCommittee}
                  onChange={(e) => setInviteCommittee(e.target.value as CommitteeTrack | "")}
                  disabled={inviting}
                  className="w-full px-3 py-2.5 rounded border border-white/15 bg-[#050708] text-white text-xs font-mono focus:outline-none focus:border-[#00e599] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {VALID_COMMITTEE_TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {TRACK_METADATA[t].name} ({t.toUpperCase()})
                    </option>
                  ))}
                  <option value="">Unassigned (Access Denied)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-[#00e599] text-[#050708] font-bold text-xs uppercase tracking-wider hover:bg-[#00c985] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#00e599]/10 cursor-pointer"
                >
                  {inviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Invite</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {inviteError && (
              <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{inviteError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
              <p className="text-xs text-white/40 leading-relaxed max-w-xl">
                New accounts are assigned the <strong className="text-white">Admin</strong> role with
                the standardized temporary credential <code className="text-[#00e599] bg-[#00e599]/10 px-1 py-0.5 rounded font-mono">0123456789</code> and a 24-hour expiration window. The invitee must replace this password immediately upon their first sign in.
              </p>
              <button
                type="button"
                onClick={handleRunDiagnostics}
                disabled={runningDiagnostics}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/15 bg-white/[0.04] text-white/70 hover:text-white hover:border-[#00e599]/40 hover:bg-[#00e599]/10 text-xs font-mono transition-colors disabled:opacity-50 cursor-pointer"
              >
                {runningDiagnostics ? (
                  <Loader2 size={13} className="animate-spin text-[#00e599]" />
                ) : (
                  <Activity size={13} className="text-[#00e599]" />
                )}
                <span>Run Email Diagnostics</span>
              </button>
            </div>
          </form>
        </div>
      </Panel>

      {/* Diagnostics Feedback Banner */}
      {diagnosticFeedback && (
        <div className="p-3.5 rounded bg-[#071310] border border-[#00e599]/40 text-[#00e599] text-xs flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#00e599] shrink-0" />
            <span className="font-mono text-white/90">{diagnosticFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setDiagnosticFeedback(null)}
            className="text-white/40 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Global Success Feedback Banner */}
      {editSuccessMessage && (
        <div className="p-3.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <span>{editSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditSuccessMessage("")}
            className="text-white/40 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. One-Time Credential Modal / Banner */}
      {issuedCredential && (
        <div className="relative border-2 border-[#00e599]/60 bg-[#080d0a] p-5 sm:p-6 rounded-lg shadow-2xl animate-fadeIn">
          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setIssuedCredential(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss credential panel"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-full bg-[#00e599]/10 border border-[#00e599]/30 text-[#00e599] shrink-0">
              <KeyRound size={22} />
            </div>

            <div className="space-y-3 flex-1 min-w-0 pr-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#00e599]/20 text-[#00e599] rounded border border-[#00e599]/30">
                    {issuedCredential.isReissue
                      ? "Temporary Credential Reissued"
                      : "Admin Account Created"}
                  </span>
                  <span className="text-xs text-white/40 font-mono">{issuedCredential.email}</span>
                </div>
                <h3 className="mt-1 text-base font-bold text-white">One-Time Temporary Credential</h3>
              </div>

              {/* Account Creation & Email Status Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 pb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#00e599]/15 border border-[#00e599]/40 text-[#00e599] font-mono text-[11px] font-bold">
                  <CheckCircle2 size={12} />
                  Account Created
                </span>
                {issuedCredential.emailDelivery?.sent ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#18c8ed]/15 border border-[#18c8ed]/40 text-[#18c8ed] font-mono text-[11px] font-bold">
                    <CheckCircle2 size={12} />
                    Accepted by mail provider
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
                    <AlertTriangle size={12} />
                    Email Acceptance Pending / Failed
                  </span>
                )}
              </div>

              {/* Password Display Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded border border-[#00e599]/30 bg-[#050708]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Temporary Password
                  </span>
                  <div className="font-mono text-xl font-black tracking-wider text-[#00e599] selection:bg-white selection:text-black">
                    {issuedCredential.temporaryPassword}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-white/20 active:scale-95 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="text-[#00e599]" />
                      <span className="text-[#00e599]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Credential</span>
                    </>
                  )}
                </button>
              </div>

              {/* Expiration Note */}
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Clock size={13} className="text-[#00e599]" />
                <span>
                  Valid for 24 hours (until{" "}
                  <strong className="text-white">
                    {new Date(issuedCredential.expiresAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>
                  ). First login requires immediate password update.
                </span>
              </div>

              {/* Email Delivery Feedback */}
              <div className="pt-2 border-t border-white/10 text-xs">
                {issuedCredential.emailDelivery?.sent ? (
                  <div className="flex items-start gap-2 text-[#00e599]">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-[#00e599]">
                        Accepted by mail provider — delivery not confirmed.
                      </p>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        The SMTP server accepted this notification for {issuedCredential.email}{" "}
                        {issuedCredential.emailDelivery.messageId && (
                          <span className="font-mono text-white/40">
                            ({issuedCredential.emailDelivery.messageId})
                          </span>
                        )}
                        . Because destination providers may delay, filter, or quarantine automated messages, please also provide the temporary credential above to the Administrator directly if needed.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-amber-300">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-xs text-amber-300">
                        {issuedCredential.emailDelivery?.configured
                          ? `SMTP acceptance unconfirmed (${
                              issuedCredential.emailDelivery.error ||
                              issuedCredential.emailDelivery.status ||
                              "undelivered"
                            }).`
                          : "Email provider is not configured."}
                      </p>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Automatic email could not be confirmed. Please copy and securely deliver the temporary password above to the Administrator directly in person or via an authenticated channel.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-white/40 italic">
                Notice: For security, this temporary password is never stored in plain text and will
                not be displayed again after you dismiss this panel or refresh the page.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Staff Account Directory Panel */}
      <Panel
        title="Administrative Staff Directory (Owner Clearance)"
        description="Verified staff memberships recorded in public.staff_members. Role alterations, credential resets, and activity audit trails require Owner clearance."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Account / User ID</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Committee</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Enrolled Date</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Temporary Credential</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Password Status</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staffList.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                const isOwner = member.role === "owner";
                const isPending = Boolean(member.password_change_required);
                const isExpired = Boolean(
                  isPending &&
                    member.temporary_password_expires_at &&
                    new Date() > new Date(member.temporary_password_expires_at)
                );

                return (
                  <tr key={member.user_id} className="hover:bg-white/[0.01] transition-colors">
                    {/* Account / User ID */}
                    <td className="px-5 py-3 font-mono text-white/80">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">
                            {member.email || "No email recorded"}
                          </span>
                          {isCurrentUser && (
                            <span className="border border-[#00e599]/30 bg-[#00e599]/10 px-1.5 py-0.2 text-[9px] uppercase font-bold text-[#00e599] rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[11px] text-white/30 truncate max-w-[220px]"
                          title={member.user_id}
                        >
                          {member.user_id}
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          member.role === "owner"
                            ? "border-[#9b7cff]/40 bg-[#9b7cff]/10 text-[#b49dff]"
                            : member.role === "admin"
                            ? "border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]"
                            : "border-sky-500/40 bg-sky-500/10 text-sky-400"
                        }`}
                      >
                        {member.role === "owner" ? (
                          <ShieldCheck size={11} />
                        ) : (
                          <UserCheck size={11} />
                        )}
                        <span>{member.role}</span>
                      </span>
                    </td>

                    {/* Committee Scope */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {member.role === "owner" ? (
                        <span className="inline-flex items-center gap-1 border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase rounded text-white/80">
                          All Committees
                        </span>
                      ) : member.committee ? (
                        <span className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase rounded text-[#00e599]">
                          {TRACK_METADATA[member.committee]?.name || member.committee.toUpperCase()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase rounded text-amber-300">
                          Unassigned (Denied)
                        </span>
                      )}
                    </td>

                    {/* Enrolled Date */}
                    <td className="px-5 py-3 text-white/50 whitespace-nowrap">
                      {new Date(member.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Temporary Credential Status */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {isExpired ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-400 rounded">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Expired (24h)
                          </span>
                          {member.temporary_password_expires_at && (
                            <div className="text-[10px] text-rose-400/60 font-mono">
                              {new Date(member.temporary_password_expires_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      ) : isPending ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400 rounded">
                            <Clock size={11} />
                            Change Pending
                          </span>
                          {member.temporary_password_expires_at && (
                            <div className="text-[10px] text-white/40 font-mono">
                              Expires:{" "}
                              {new Date(member.temporary_password_expires_at).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-mono text-white/40 rounded">
                          None Active
                        </span>
                      )}
                    </td>

                    {/* Password Status */}
                    <td className="px-5 py-3 whitespace-nowrap">
                      {member.password_changed_at ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1.5 border border-[#00e599]/30 bg-[#00e599]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00e599] rounded">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#00e599]" />
                            Replaced
                          </span>
                          <div className="text-[10px] text-white/40 font-mono">
                            {new Date(member.password_changed_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400/80 rounded font-mono">
                          Temporary Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 border border-[#00e599]/30 bg-[#00e599]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00e599] rounded">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {/* 1. Inspect Admin Audit History */}
                        <Link
                          href={`/admin/audit-logs?actorId=${member.user_id}`}
                          title={`Inspect audit history for ${member.email || member.user_id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/[0.04] text-[11px] font-mono font-medium text-white/70 hover:border-[#9b7cff]/40 hover:bg-[#9b7cff]/10 hover:text-[#b49dff] transition-colors"
                        >
                          <Activity size={12} className="text-[#9b7cff]" />
                          <span>Audit</span>
                        </Link>

                        {/* Actions for Non-Owner accounts */}
                        {!isOwner ? (
                          <>
                            {/* 2. Edit Account */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(member)}
                              title="Edit email address or administrative role"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/[0.04] text-[11px] font-mono font-medium text-white/70 hover:border-[#00e599]/40 hover:bg-[#00e599]/10 hover:text-[#00e599] transition-colors cursor-pointer"
                            >
                              <Pencil size={11} />
                              <span>Edit</span>
                            </button>

                            {/* 3. Retry Invitation Email (for pending administrators) */}
                            {member.role === "admin" && member.password_change_required && (
                              <button
                                type="button"
                                onClick={() => handleRetryEmail(member.user_id, member.email)}
                                disabled={retryingUserId === member.user_id}
                                title="Resend invitation notification without changing password"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/[0.04] text-[11px] font-mono font-medium text-white/70 hover:border-[#18c8ed]/40 hover:bg-[#18c8ed]/10 hover:text-[#18c8ed] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {retryingUserId === member.user_id ? (
                                  <Loader2 size={11} className="animate-spin text-[#18c8ed]" />
                                ) : (
                                  <Mail size={11} />
                                )}
                                <span>Retry Email</span>
                              </button>
                            )}

                            {/* 4. Reset Password (Available for ALL non-owner accounts) */}
                            <button
                              type="button"
                              onClick={() => handleResetPassword(member.user_id, member.email)}
                              disabled={reissuingUserId === member.user_id}
                              title="Reset to 0123456789 with new 24-hour expiry"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 bg-white/[0.04] text-[11px] font-mono font-medium text-white/70 hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <RefreshCw
                                size={11}
                                className={reissuingUserId === member.user_id ? "animate-spin" : ""}
                              />
                              <span>Reset Password</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-white/30 uppercase px-1">
                            Protected Owner
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* 4. Edit Account Modal Dialog */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md border border-white/20 bg-[#080d0a] p-6 rounded-lg shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-[#00e599]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Edit Staff Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-white/40 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target Account Reference */}
            <div className="bg-[#050708] p-3 rounded border border-white/10 text-xs font-mono space-y-1">
              <div className="text-white/40 text-[10px] uppercase tracking-wider">User ID</div>
              <div className="text-white/80 truncate">{editingStaff.userId}</div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="edit-staff-email"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Staff Email Address
                </label>
                <input
                  id="edit-staff-email"
                  type="email"
                  value={editingStaff.email}
                  onChange={(e) =>
                    setEditingStaff((prev) => (prev ? { ...prev, email: e.target.value } : null))
                  }
                  required
                  disabled={savingEdit}
                  className="w-full px-3 py-2 rounded border border-white/15 bg-[#050708] text-white text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-staff-role"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Administrative Role
                </label>
                <select
                  id="edit-staff-role"
                  value={editingStaff.role}
                  onChange={(e) =>
                    setEditingStaff((prev) =>
                      prev
                        ? { ...prev, role: e.target.value as "admin" | "interviewer" }
                        : null
                    )
                  }
                  disabled={savingEdit}
                  className="w-full px-3 py-2 rounded border border-white/15 bg-[#050708] text-white text-xs font-mono focus:outline-none focus:border-[#00e599] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="admin">Admin (Operational Administration)</option>
                  <option value="interviewer">Interviewer (QR Scanner Clearance)</option>
                </select>
                <p className="mt-1 text-[11px] text-white/40">
                  Note: The Owner role is protected and cannot be assigned through this interface.
                </p>
              </div>

              <div>
                <label
                  htmlFor="edit-staff-committee"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Assigned Committee Scope
                </label>
                <select
                  id="edit-staff-committee"
                  value={editingStaff.committee || ""}
                  onChange={(e) =>
                    setEditingStaff((prev) =>
                      prev
                        ? {
                            ...prev,
                            committee: (e.target.value as CommitteeTrack) || null,
                          }
                        : null
                    )
                  }
                  disabled={savingEdit}
                  className="w-full px-3 py-2 rounded border border-white/15 bg-[#050708] text-white text-xs font-mono focus:outline-none focus:border-[#00e599] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="">Unassigned (No Access to Applications)</option>
                  {VALID_COMMITTEE_TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {TRACK_METADATA[t].name} ({t.toUpperCase()})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-white/40">
                  Staff can only view, evaluate, and manage applications belonging to their assigned committee.
                </p>
              </div>

              {editError && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-sans">{editError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  disabled={savingEdit}
                  className="px-3.5 py-2 rounded border border-white/15 text-white/70 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[#00e599] text-[#050708] font-bold text-xs uppercase tracking-wider hover:bg-[#00c985] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#00e599]/10 cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
