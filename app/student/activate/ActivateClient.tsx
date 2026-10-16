"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";

interface Props {
  userEmail: string | null;
  isAlreadyActivated: boolean;
  urlError: string | null;
}

export default function ActivateClient({
  userEmail,
  isAlreadyActivated,
  urlError,
}: Props) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Case 1: Account is already activated
  if (isAlreadyActivated) {
    return (
      <div className="w-full max-w-md mx-auto border border-[#00e599]/30 bg-[#080a0c] p-8 sm:p-10 relative">
        <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 border border-[#00e599]/30 bg-[#00e599]/10 flex items-center justify-center text-[#00e599]">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#00e599] font-bold">
              ACCOUNT ACTIVE
            </span>
            <h2 className="text-xl font-bold text-white">Already Activated</h2>
          </div>
        </div>

        <p className="text-sm text-white/70 mb-6 leading-relaxed">
          Your IT Club student account for <strong className="text-white">{userEmail}</strong> is already active and linked to your recruitment application.
        </p>

        <Link
          href="/student/login"
          className="w-full h-12 inline-flex items-center justify-center gap-2 bg-[#00e599] text-[#050708] font-mono font-bold text-xs tracking-widest uppercase hover:bg-white transition-colors"
        >
          GO TO STUDENT LOGIN <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // Case 2: No valid session / link expired or invalid
  if (!userEmail) {
    return (
      <div className="w-full max-w-md mx-auto border border-red-500/20 bg-[#080a0c] p-8 sm:p-10 relative">
        <div className="h-1 w-full absolute top-0 left-0 bg-red-500" />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 border border-red-500/30 bg-red-500/10 flex items-center justify-center text-red-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="font-mono text-[10px] tracking-widest uppercase text-red-400 font-bold">
              INVITATION REQUIRED
            </span>
            <h2 className="text-xl font-bold text-white">Link Expired or Invalid</h2>
          </div>
        </div>

        <p className="text-sm text-white/70 mb-6 leading-relaxed">
          {urlError === "invalid_or_expired"
            ? "Your account activation link has expired or has already been used. Please check your invitation email or request a new link from IT Club organizers."
            : "To activate your student account, please open the personalized activation link sent to the personal notification email you supplied during registration."}
        </p>

        <div className="space-y-3">
          <Link
            href="/student/login?activation=help"
            className="w-full h-12 inline-flex items-center justify-center gap-2 border border-white/15 bg-white/[0.03] text-white hover:bg-white/10 font-mono text-xs tracking-wider uppercase transition-colors"
          >
            ACTIVATION HELP
          </Link>
          <Link
            href="/"
            className="w-full h-10 inline-flex items-center justify-center text-white/40 hover:text-white font-mono text-xs tracking-wider uppercase transition-colors"
          >
            RETURN HOME
          </Link>
        </div>
      </div>
    );
  }

  // Case 3: Verified invitation session -> Complete activation form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/student/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Activation failed. Please check your reference code.");
        setLoading(false);
        return;
      }

      setSuccessMessage(json.message || "Account activated! Redirecting to sign in...");
      setTimeout(() => {
        router.push(json.redirect || "/student");
      }, 1500);
    } catch {
      setErrorMessage("Network error during activation. Please retry.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto border border-white/10 bg-[#080a0c] p-8 sm:p-10 relative">
      <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Image
            src="/logo.webp"
            alt="IT Club"
            width={18}
            height={18}
            className="object-contain"
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#00e599] font-bold">
            APPLICANT ACCOUNT ACTIVATION
          </span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Activate Your Account
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Your verified university identity is shown below. Create a password to finish activation.
        </p>
      </div>

      {/* Verified Email Identity Badge */}
      <div className="mb-6 p-3 border border-white/10 bg-[#050708] flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase text-white/40 tracking-wider">
          VERIFIED IDENTITY
        </span>
        <span className="font-mono text-xs text-[#00e599] font-bold">
          {userEmail}
        </span>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 border border-red-500/30 bg-red-500/10 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200 leading-relaxed font-sans">{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3.5 border border-[#00e599]/30 bg-[#00e599]/10 flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-[#00e599] shrink-0 mt-0.5" />
          <p className="text-xs text-[#00e599] leading-relaxed font-sans">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password Field */}
        <div>
          <label className="block font-mono text-[10px] tracking-wider uppercase text-white/60 mb-1.5">
            NEW PASSWORD
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#050708] border border-white/10 focus:border-[#00e599] text-white px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-white/20 transition-colors"
            />
            <Lock
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block font-mono text-[10px] tracking-wider uppercase text-white/60 mb-1.5">
            CONFIRM PASSWORD
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-[#050708] border border-white/10 focus:border-[#00e599] text-white px-3.5 py-2.5 text-sm focus:outline-none placeholder:text-white/20 transition-colors"
            />
            <Lock
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
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
              <span>ACTIVATING ACCOUNT...</span>
            </>
          ) : (
            <>
              <span>COMPLETE ACTIVATION</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
