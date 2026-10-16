"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { createClient } from "../../../utils/supabase/client";

interface Props {
  isExpired: boolean;
  expiresAt: string | null;
  staffEmail: string;
  role: string;
  isMandatory: boolean;
}

export default function AdminChangePasswordForm({
  isExpired,
  expiresAt,
  staffEmail,
  role,
  isMandatory,
}: Props) {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const formattedExpiry = expiresAt
    ? new Date(expiresAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : null;

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signout error
    }
    router.push("/login");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify your entries.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === "TEMPORARY_PASSWORD_EXPIRED") {
          setErrorMessage(
            "Your temporary administrative credential has expired (24-hour limit exceeded). Access is locked. Please contact the IT Club Owner to reissue your temporary credentials."
          );
        } else {
          setErrorMessage(data.error || "Failed to update your password. Please try again.");
        }
        setLoading(false);
        return;
      }

      setSuccessMessage("Password successfully updated! Redirecting to the administrative dashboard...");
      setLoading(false);

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 1200);
    } catch {
      setErrorMessage("Network error occurred while updating password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative border border-white/10 bg-[#080b0e] p-6 sm:p-8 rounded-lg shadow-2xl backdrop-blur-sm">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff] rounded-t-lg" />

        {/* Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-[#00e599]/10 border border-[#00e599]/20 text-[#00e599] mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Montserrat']">
            {isExpired ? "Temporary Credential Expired" : "Set Your Administrator Password"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed font-sans">
            {isExpired
              ? "Your 24-hour temporary administrative credential has expired. Please contact the Owner."
              : isMandatory
              ? "Mandatory first-login security setup. You must set a permanent private password to access the administrative dashboard."
              : "Update your administrative account password."}
          </p>
        </div>

        {/* Account Details Banner */}
        <div className="mb-6 p-4 rounded-md border border-white/8 bg-white/[0.02] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-white/40 uppercase tracking-wider text-[11px]">Staff Account</span>
            <span className="text-white font-bold">{staffEmail}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/40 uppercase tracking-wider text-[11px]">Clearance Role</span>
            <span className="border border-[#00e599]/30 bg-[#00e599]/10 px-2 py-0.5 text-[10px] uppercase font-bold text-[#00e599] rounded">
              {role}
            </span>
          </div>
          {expiresAt && (
            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-white/40 uppercase tracking-wider text-[11px] flex items-center gap-1">
                <Clock size={12} className={isExpired ? "text-rose-400" : "text-[#00e599]"} />
                {isExpired ? "Expired At" : "Expires At"}
              </span>
              <span className={isExpired ? "text-rose-400 font-bold" : "text-white/70"}>
                {formattedExpiry}
              </span>
            </div>
          )}
        </div>

        {/* Expired Alert Panel */}
        {isExpired ? (
          <div className="space-y-6">
            <div className="p-4 rounded-md bg-rose-950/30 border border-rose-500/40 text-rose-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-rose-300">24-Hour Expiration Deadline Passed</p>
                  <p className="text-xs text-rose-200/80 leading-relaxed font-sans">
                    Temporary administrative passwords are strictly enforced with a 24-hour validity window.
                    Access to administrative endpoints and dashboard views is locked until the IT Club Owner
                    reissues a new temporary credential from the Owner settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-white/10 bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-white hover:bg-white/[0.07] transition-colors"
              >
                <LogOut size={14} />
                <span>Return to Staff Sign In</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-md bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-md bg-[#00e599]/10 border border-[#00e599]/40 text-[#00e599] text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 size={16} className="text-[#00e599] shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans font-bold">{successMessage}</span>
              </div>
            )}

            {/* New Password Input */}
            <div>
              <label
                htmlFor="new-admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-admin-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  disabled={loading || Boolean(successMessage)}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 pr-10 rounded border border-white/15 bg-[#050708] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-white/40">
                Minimum 8 characters. Use a combination of letters, numbers, and symbols.
              </p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirm-admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-admin-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  disabled={loading || Boolean(successMessage)}
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 pr-10 rounded border border-white/15 bg-[#050708] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00e599] focus:ring-1 focus:ring-[#00e599] transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || Boolean(successMessage)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded bg-[#00e599] text-[#050708] font-bold text-sm uppercase tracking-wider hover:bg-[#00c985] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00e599]/10"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Set Password & Access Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {/* Sign Out Option */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="text-xs text-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <LogOut size={12} />
                <span>Sign out from this session</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
