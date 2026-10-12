"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { sanitizeRedirectPath } from "../../lib/auth/redirect";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "unauthorized"
      ? "Access denied. You must be an authorized staff member to view administrative tools."
      : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Generic response prevents account enumeration attacks
        setErrorMessage("Invalid email or password. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // Verify the authenticated user is an authorized staff member
      const verifyRes = await fetch("/api/auth/verify-staff");
      if (!verifyRes.ok) {
        // User is authenticated in Supabase Auth, but NOT a staff member!
        await supabase.auth.signOut();
        setErrorMessage("Access denied: Your account is not an authorized IT Club staff member.");
        setLoading(false);
        return;
      }

      // Safe redirect prevents Open Redirect vulnerabilities
      const targetPath = sanitizeRedirectPath(nextParam, "/admin");
      router.push(targetPath);
      router.refresh();
    } catch {
      setErrorMessage("Authentication failed due to a network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative overflow-hidden border border-white/10 bg-[#080a0c] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Subtle accent border line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00e599] via-[#18c8ed] to-[#9b7cff]" />

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] mb-4">
              <ShieldCheck size={24} />
            </div>

            <p className="font-mono text-[11px] font-bold tracking-[0.24em] uppercase text-[#00e599] mb-1.5">
              RESTRICTED ACCESS · بوابة المشرفين
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-[-0.03em] text-white">
              Staff Sign In
            </h1>
            <p className="arabic mt-2 text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
              تسجيل الدخول مخصص لمسؤولي ورؤساء لجان IT Club فقط.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="staff-email"
                className="block font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/70 mb-2"
              >
                EMAIL ADDRESS <span className="text-[#00e599]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                  <Mail size={15} />
                </div>
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@itclub.one"
                  className="w-full border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-[#00e599] focus:bg-white/[0.06] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="staff-password"
                className="block font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-white/70 mb-2"
              >
                PASSWORD <span className="text-[#00e599]">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                  <Lock size={15} />
                </div>
                <input
                  id="staff-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border border-white/10 bg-white/[0.03] pl-10 pr-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-[#00e599] focus:bg-white/[0.06] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2.5 bg-[#00e599] hover:bg-[#00c985] text-[#050708] font-mono text-xs font-bold tracking-[0.18em] uppercase py-3.5 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(0,229,153,0.3)] hover:shadow-[0_0_35px_rgba(0,229,153,0.45)] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  SIGN IN TO PORTAL
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="font-mono text-[10px] tracking-wider uppercase text-white/30 leading-relaxed">
              SECURITY AUDITED · BENHA APPLIED TECHNOLOGY UNIVERSITY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
