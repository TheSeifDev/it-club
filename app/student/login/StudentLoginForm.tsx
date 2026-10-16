"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "../../../utils/supabase/client";

export default function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activatedParam = searchParams.get("activated");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showActivationGuidance, setShowActivationGuidance] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    activatedParam === "true"
      ? "Account activated successfully! Please sign in with your password."
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setShowActivationGuidance(false);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both your university email address and password.");
      return;
    }

    if (!cleanEmail.endsWith("@batechu.com")) {
      setErrorMessage(
        "Student accounts use your official university email (@batechu.com), not your personal email. Please use your student ID email address (e.g. 2024XXXX@batechu.com)."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        setErrorMessage("Invalid email or password. Please verify your credentials.");
        setShowActivationGuidance(true);
        setLoading(false);
        return;
      }

      // Verify the authenticated user is an activated student member
      const verifyRes = await fetch("/api/student/me");
      if (!verifyRes.ok) {
        const verifyJson = await verifyRes.json().catch(() => ({}));

        if (verifyJson.code === "PASSWORD_CHANGE_REQUIRED") {
          setSuccessMessage("Sign in successful. Temporary credential detected — redirecting to password update...");
          setTimeout(() => {
            router.push("/student/change-password");
          }, 800);
          return;
        }

        if (verifyJson.code === "CREDENTIAL_EXPIRED") {
          setErrorMessage(
            "Your temporary password has expired (24-hour deadline exceeded). Access is locked. Please contact the IT Club administration in person to reissue a fresh temporary password."
          );
          setLoading(false);
          return;
        }

        setErrorMessage("No active student account found for this user. If you received an invitation email, please complete account activation first.");
        setShowActivationGuidance(true);
        setLoading(false);
        return;
      }

      // Successful student login
      setSuccessMessage("Sign in successful! Entering student portal...");
      setTimeout(() => {
        router.push("/student");
      }, 1000);
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto border border-white/10 bg-[#080a0c] p-8 sm:p-10 relative">
      <div className="h-1 w-full absolute top-0 left-0 bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Image
            src="/logo.webp"
            alt="IT Club"
            width={18}
            height={18}
            className="object-contain"
          />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#00e599] font-bold">
            IT CLUB STUDENT PORTAL
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Member Sign In
        </h2>
        <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
          Sign in to access your recruitment onboarding and club membership.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-3.5 border border-[#00e599]/30 bg-[#00e599]/10 flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-[#00e599] shrink-0 mt-0.5" />
          <p className="text-xs text-[#00e599] leading-relaxed font-sans">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-3.5 border border-red-500/30 bg-red-500/10 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200 leading-relaxed font-sans">{errorMessage}</p>
        </div>
      )}

      {showActivationGuidance && (
        <div className="mb-6 p-4 border border-[#00e599]/30 bg-[#00e599]/5 flex items-start gap-3">
          <CheckCircle2 size={16} className="text-[#00e599] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white font-mono tracking-wide">
              First time signing in?
            </p>
            <p className="text-xs text-white/70 leading-relaxed">
              Shortlisted and accepted applicants receive their activation invitation at the personal notification email supplied during registration. Complete activation and create a password first, then sign in here with your official <span className="text-[#00e599] font-mono">@batechu.com</span> university email.
            </p>
            <div>
              <Link
                href="/student/activate"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#00e599] hover:text-white transition-colors"
              >
                <span>Go to Account Activation</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-[10px] tracking-wider uppercase text-white/60 mb-1.5">
            UNIVERSITY EMAIL
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="e.g. 20245555@batechu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full bg-[#050708] border border-white/10 focus:border-[#00e599] text-white px-3.5 py-2.5 text-sm font-mono tracking-wider focus:outline-none placeholder:text-white/20 transition-colors"
            />
            <Mail
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-mono text-[10px] tracking-wider uppercase text-white/60 mb-1.5">
            PASSWORD
          </label>
          <div className="relative">
            <input
              type="password"
              required
              placeholder="••••••••••••"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 h-12 bg-[#00e599] text-[#050708] font-mono font-bold text-xs tracking-widest uppercase hover:bg-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>AUTHENTICATING...</span>
            </>
          ) : (
            <>
              <span>SIGN IN TO PORTAL</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-2">
        <p className="text-xs text-white/40 font-mono">
          Shortlisted or accepted applicant?{" "}
          <Link
            href="/student/activate"
            className="text-[#00e599] hover:underline"
          >
            Activate Account
          </Link>
        </p>
        <p className="text-[11px] text-white/30 font-mono">
          Staff member?{" "}
          <Link href="/login" className="text-white/60 hover:underline">
            Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
