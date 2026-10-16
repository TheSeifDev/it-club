"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  issuedAt: string | null;
  universityEmail: string;
  applicationReference: string;
  isMandatory: boolean;
}

export default function ChangePasswordForm({
  isExpired,
  expiresAt,
  issuedAt,
  universityEmail,
  applicationReference,
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

  const formattedIssued = issuedAt
    ? new Date(issuedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/student/login");
    } catch {
      router.push("/student/login");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    const cleanRef = applicationReference.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanPwd = newPassword.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (cleanPwd === cleanRef || cleanPwd.includes(cleanRef)) {
      setErrorMessage(
        "For security, your password cannot be or contain your application reference code."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/student/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to update password. Please retry.");
        setLoading(false);
        return;
      }

      setSuccessMessage(
        "Password successfully updated! Redirecting to your Student Dashboard..."
      );
      setTimeout(() => {
        router.push("/student");
      }, 1200);
    } catch {
      setErrorMessage("A network error occurred. Please check your connection and retry.");
      setLoading(false);
    }
  };

  // State 1: Credential Has Expired (24-hour limit exceeded)
  if (isExpired) {
    return (
      <div className="w-full max-w-lg mx-auto border border-rose-500/30 bg-[#080a0c] p-8 sm:p-10 relative">
        <div className="h-1 w-full absolute top-0 left-0 bg-rose-500" />

        <div className="flex items-center gap-2 mb-3">
          <Image
            src="/logo.webp"
            alt="IT Club"
            width={18}
            height={18}
            className="object-contain"
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-rose-400 font-bold">
            CREDENTIAL EXPIRED · ACCESS LOCKED
          </span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <AlertTriangle size={24} className="text-rose-400 shrink-0" />
          <span>Temporary Password Expired</span>
        </h2>

        <p className="text-xs text-white/70 mt-2 leading-relaxed">
          The 24-hour validity window for your temporary credential has passed. For your protection and account security, access to the Student Portal has been locked.
        </p>

        <div className="my-6 p-4 border border-white/10 bg-white/[0.02] font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-white/50 text-[11px]">
            <span>ACCOUNT:</span>
            <span className="text-white select-all">{universityEmail}</span>
          </div>
          <div className="flex items-center justify-between text-white/50 text-[11px]">
            <span>REFERENCE:</span>
            <span className="text-[#00e599] font-bold">{applicationReference}</span>
          </div>
          {formattedExpiry && (
            <div className="flex items-center justify-between text-white/50 text-[11px]">
              <span>EXPIRED AT:</span>
              <span className="text-rose-400 font-semibold">{formattedExpiry}</span>
            </div>
          )}
        </div>

        <div className="p-3.5 border border-white/10 bg-white/[0.01] text-xs text-white/60 space-y-2 mb-6">
          <p className="font-semibold text-white/80">Next Steps:</p>
          <p>
            Your recruitment application, track preferences, and interview history are completely safe and preserved.
          </p>
          <p>
            Please contact an IT Club administrator or your interviewer in person to reissue a fresh temporary password.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full h-11 bg-white/10 hover:bg-white/20 text-white font-mono text-xs uppercase tracking-wider font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    );
  }

  // State 2: Mandatory or Voluntary Password Change
  return (
    <div className="w-full max-w-lg mx-auto border border-white/10 bg-[#080a0c] p-8 sm:p-10 relative">
      <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Image
            src="/logo.webp"
            alt="IT Club"
            width={18}
            height={18}
            className="object-contain"
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#00e599] font-bold">
            {isMandatory ? "MANDATORY SECURITY UPDATE" : "PASSWORD SETTINGS"}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Create New Password
        </h2>

        <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
          {isMandatory
            ? "You have signed in using a temporary password. You must set a permanent private password to continue using your account."
            : "Update your Student Portal password below."}
        </p>
      </div>

      {/* 24-Hour Expiration Notice */}
      {isMandatory && formattedExpiry && (
        <div className="mb-6 p-3.5 border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5">
          <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-relaxed font-sans space-y-1">
            <p className="font-semibold font-mono text-[11px] text-amber-300">
              24-HOUR DEADLINE ENFORCEMENT
            </p>
            <p>
              This temporary credential expires on <span className="font-bold underline">{formattedExpiry}</span>
              {formattedIssued ? ` (issued ${formattedIssued})` : ""}. If not changed before the deadline, account access will be locked until reissued.
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3.5 border border-[#00e599]/30 bg-[#00e599]/10 flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-[#00e599] shrink-0 mt-0.5" />
          <p className="text-xs text-[#00e599] leading-relaxed font-sans">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-3.5 border border-red-500/30 bg-red-500/10 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200 leading-relaxed font-sans">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] tracking-wider uppercase text-white/60 mb-1.5">
            NEW PRIVATE PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#050708] border border-white/10 focus:border-[#00e599] text-white px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-white/20 transition-colors pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block font-mono text-[10px] tracking-wider uppercase text-white/60 mb-1.5">
            CONFIRM NEW PASSWORD
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#050708] border border-white/10 focus:border-[#00e599] text-white px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-white/20 transition-colors pr-10"
            />
            <Lock
              size={15}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
          </div>
        </div>

        {/* Validation Criteria */}
        <div className="p-3 border border-white/5 bg-white/[0.01] text-[11px] font-mono space-y-1 text-white/50">
          <div className="flex items-center gap-1.5">
            <span className={newPassword.length >= 8 ? "text-[#00e599]" : "text-white/30"}>
              &bull;
            </span>
            <span className={newPassword.length >= 8 ? "text-white/80" : ""}>
              At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={
                newPassword && confirmPassword && newPassword === confirmPassword
                  ? "text-[#00e599]"
                  : "text-white/30"
              }
            >
              &bull;
            </span>
            <span
              className={
                newPassword && confirmPassword && newPassword === confirmPassword
                  ? "text-white/80"
                  : ""
              }
            >
              Passwords match
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={
                newPassword &&
                !newPassword.toLowerCase().includes(applicationReference.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
                  ? "text-[#00e599]"
                  : "text-white/30"
              }
            >
              &bull;
            </span>
            <span>Does not match your application reference ({applicationReference})</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-12 bg-[#00e599] text-[#050708] font-mono font-bold text-xs tracking-widest uppercase hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>SAVING NEW PASSWORD...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>SET PASSWORD & ACCESS PORTAL</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/40">
        <span className="truncate max-w-[220px]">{universityEmail}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-white/50 hover:text-white underline transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
