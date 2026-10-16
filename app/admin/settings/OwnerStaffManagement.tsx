"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Panel } from "../dashboard-ui";

export interface StaffDirectoryItem {
  user_id: string;
  role: "owner" | "admin" | "interviewer";
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
    error?: string;
  };
  isReissue?: boolean;
}

export default function OwnerStaffManagement({
  initialStaffList,
  currentUserId,
  isEmailConfigured,
}: Props) {
  const [staffList, setStaffList] = useState<StaffDirectoryItem[]>(initialStaffList);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [reissuingUserId, setReissuingUserId] = useState<string | null>(null);

  // Active one-time credential panel (never saved to localStorage or sessionStorage)
  const [issuedCredential, setIssuedCredential] = useState<IssuedCredential | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = async () => {
    if (!issuedCredential) return;
    try {
      await navigator.clipboard.writeText(issuedCredential.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
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
      setInviteError("Please enter an email address for the new Administrator.");
      return;
    }

    setInviting(true);

    try {
      const res = await fetch("/api/admin/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setInviteError(data.error || "Failed to invite administrator account.");
        setInviting(false);
        return;
      }

      // Add to local staff list
      const newItem: StaffDirectoryItem = {
        user_id: data.userId,
        role: "admin",
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
        role: "admin",
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

  const handleReissueTemporaryPassword = async (targetUserId: string, targetEmail: string | null) => {
    setReissuingUserId(targetUserId);

    try {
      const res = await fetch("/api/admin/staff/reissue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Failed to reissue temporary credentials.");
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
      alert("Network error while reissuing temporary password.");
      setReissuingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Invite New Admin Form Panel */}
      <Panel
        title="Invite Administrator (Owner Clearance)"
        description={`Provision an administrative staff account with mandatory first-login password replacement and 24-hour temporary credential enforcement. ${isEmailConfigured ? "SMTP automated dispatch is configured." : "SMTP automated dispatch is not configured (manual delivery required)."}`}
      >
        <div className="p-5">
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
              <div className="sm:col-span-2">
                <label
                  htmlFor="invite-admin-email"
                  className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
                >
                  Candidate Email Address
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
                    placeholder="e.g. new.admin@itclub.one"
                    required
                    disabled={inviting}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded border border-white/15 bg-[#050708] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-[#00e599] text-[#050708] font-bold text-xs uppercase tracking-wider hover:bg-[#00c985] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#00e599]/10"
                >
                  {inviting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Invite Admin</span>
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

            <p className="text-xs text-white/40 leading-relaxed">
              New accounts are assigned the <strong className="text-white">Admin</strong> role. An unpredictable 14-character temporary credential with a 24-hour expiration will be generated. The invitee must change this password immediately upon their first sign in.
            </p>
          </form>
        </div>
      </Panel>

      {/* 2. One-Time Credential Modal / Banner */}
      {issuedCredential && (
        <div className="relative border-2 border-[#00e599]/60 bg-[#080d0a] p-5 sm:p-6 rounded-lg shadow-2xl animate-fadeIn">
          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setIssuedCredential(null)}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
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
                    {issuedCredential.isReissue ? "Temporary Credential Reissued" : "Admin Account Created"}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    {issuedCredential.email}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-white">
                  One-Time Temporary Credential
                </h3>
              </div>

              {/* Password Display Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded border border-[#00e599]/30 bg-[#050708]">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Temporary Password</span>
                  <div className="font-mono text-lg font-black tracking-wider text-[#00e599] selection:bg-white selection:text-black">
                    {issuedCredential.temporaryPassword}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors border border-white/20 active:scale-95"
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
                  ). First login requires password update.
                </span>
              </div>

              {/* Email Delivery Feedback */}
              <div className="pt-2 border-t border-white/10 text-xs">
                {issuedCredential.emailDelivery?.sent ? (
                  <div className="flex items-center gap-1.5 text-[#00e599]">
                    <CheckCircle2 size={13} />
                    <span>Invitation notification successfully delivered via SMTP to {issuedCredential.email}.</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 text-amber-300">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                    <span>
                      {issuedCredential.emailDelivery?.configured
                        ? `SMTP delivery could not be confirmed (${issuedCredential.emailDelivery.error || "undelivered"}). Please copy and share this temporary password with the Admin directly.`
                        : "Email provider is not configured. Please securely copy and communicate this temporary password to the Admin in person."}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-white/40 italic">
                Notice: For security, this temporary password is never stored in plain text and will not be displayed again after you dismiss this panel or leave this page.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Staff Account Directory Panel */}
      <Panel
        title="Staff Account Directory (Owner Clearance)"
        description="Verified staff memberships recorded in public.staff_members. Role alterations and temporary password reissues require Owner clearance."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-white/40">
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Account / User ID</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Enrolled Date</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider">Password Status</th>
                <th className="px-5 py-3 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {staffList.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                const isPending = Boolean(member.password_change_required);
                const isExpired = Boolean(
                  isPending &&
                    member.temporary_password_expires_at &&
                    new Date() > new Date(member.temporary_password_expires_at)
                );

                return (
                  <tr key={member.user_id} className="hover:bg-white/[0.01]">
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
                        <div className="text-[11px] text-white/30 truncate max-w-[200px]" title={member.user_id}>
                          {member.user_id}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                          member.role === "owner"
                            ? "border-[#9b7cff]/40 bg-[#9b7cff]/10 text-[#b49dff]"
                            : member.role === "admin"
                            ? "border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]"
                            : "border-sky-500/40 bg-sky-500/10 text-sky-400"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>

                    {/* Enrolled Date */}
                    <td className="px-5 py-3 text-white/50">
                      {new Date(member.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Password Status */}
                    <td className="px-5 py-3">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-400 rounded">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          Credential Expired
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400 rounded">
                          <Clock size={11} />
                          Change Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 border border-[#00e599]/30 bg-[#00e599]/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#00e599] rounded">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#00e599]" />
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3 text-right">
                      {member.role === "admin" && (isPending || isExpired) ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleReissueTemporaryPassword(member.user_id, member.email)
                          }
                          disabled={reissuingUserId === member.user_id}
                          className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-white/80 hover:border-white/20 hover:text-white rounded transition-colors disabled:opacity-50"
                        >
                          <RefreshCw
                            size={12}
                            className={reissuingUserId === member.user_id ? "animate-spin" : ""}
                          />
                          <span>Reissue Temp Password</span>
                        </button>
                      ) : (
                        <span className="text-white/20 text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
