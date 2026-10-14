"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "../../utils/supabase/client";
import { sanitizeRedirectPath } from "../../lib/auth/redirect";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const getInitialErrorMessage = () => {
    if (errorParam === "unauthorized") {
      return "Access restricted: You must be an authorized IT Club staff member to access administrative tools.";
    }
    if (errorParam === "session_expired") {
      return "Your session has expired. Please sign in again with your staff credentials.";
    }
    if (errorParam === "invalid_session") {
      return "Your session is invalid or has ended. Please sign in again.";
    }
    return "";
  };

  const [errorMessage, setErrorMessage] = useState(getInitialErrorMessage());
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validateInputs = () => {
    const trimmed = email.trim();
    const errors: { email?: string; password?: string } = {};

    if (!trimmed) {
      errors.email = "Please enter your staff email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors.email = "Please enter a valid email address format (e.g. staff@itclub.one).";
    }

    if (!password) {
      errors.password = "Please enter your password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setAuthStatus("submitting");

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        // Generic response prevents account enumeration attacks
        setErrorMessage("Invalid email or password. Please verify your staff credentials.");
        setLoading(false);
        setAuthStatus("error");
        return;
      }

      // Verify the authenticated user is an authorized staff member in public.staff_members
      const verifyRes = await fetch("/api/auth/verify-staff");
      if (!verifyRes.ok) {
        // User is authenticated in Supabase Auth, but NOT a staff member!
        await supabase.auth.signOut();
        setErrorMessage(
          "Access denied: Your account is not recognized as an authorized IT Club staff member. Student members should use the Student Portal."
        );
        setLoading(false);
        setAuthStatus("error");
        return;
      }

      // Safe redirect prevents Open Redirect vulnerabilities
      setAuthStatus("success");
      const targetPath = sanitizeRedirectPath(nextParam, "/admin");
      router.push(targetPath);
      router.refresh();
    } catch {
      setErrorMessage("Authentication failed due to a network or server issue. Please try again.");
      setLoading(false);
      setAuthStatus("error");
    }
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl border border-emerald-500/20 bg-[#080d0b]/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,229,153,0.06),0_25px_60px_rgba(0,0,0,0.85)] transition-all">
        {/* Subtle Inner Glow Border */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl lg:rounded-3xl border border-white/5"
        />

        <div className="p-6 sm:p-9 lg:p-11">
          {/* Centered Security Badge & Header */}
          <div className="text-center mb-7 sm:mb-9">
            <div className="mx-auto w-14 h-14 rounded-2xl border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599] flex items-center justify-center shadow-[0_0_24px_rgba(0,229,153,0.25)] mb-4 transition-transform hover:scale-105">
              <ShieldCheck size={28} />
            </div>

            <p className="font-sans text-[11px] font-bold tracking-[0.22em] uppercase text-[#00e599] mb-1.5">
              RESTRICTED ACCESS · <span className="arabic" dir="rtl">بوابة المخولين</span>
            </p>

            <h2 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Staff Sign In
            </h2>

            <p className="arabic mt-2 text-xs sm:text-sm text-white/55 leading-relaxed font-medium" dir="rtl">
              تسجيل الدخول مخصص لمسؤولي ورؤساء لجان IT Club فقط
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs sm:text-sm text-rose-200"
            >
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed font-sans">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="staff-email"
                className="flex items-center gap-1.5 font-sans text-xs font-semibold text-white/80 mb-2"
              >
                <span>Email Address</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00e599]" aria-hidden="true" />
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
                  <Mail size={17} />
                </div>
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  disabled={loading || authStatus === "success"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="name@itclub.one"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "staff-email-error" : undefined}
                  className={`w-full rounded-xl border bg-white/[0.03] pl-11 pr-4 py-3.5 font-sans text-sm text-white placeholder:text-white/25 transition-all duration-200 focus:outline-none ${
                    fieldErrors.email
                      ? "border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-500/[0.02]"
                      : "border-white/10 hover:border-white/20 focus:border-[#00e599] focus:bg-white/[0.05] focus:ring-1 focus:ring-[#00e599]"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p id="staff-email-error" className="mt-1.5 font-sans text-xs text-rose-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="staff-password"
                  className="flex items-center gap-1.5 font-sans text-xs font-semibold text-white/80"
                >
                  <span>Password</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00e599]" aria-hidden="true" />
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/40">
                  <Lock size={17} />
                </div>
                <input
                  id="staff-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  disabled={loading || authStatus === "success"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (errorMessage) setErrorMessage("");
                  }}
                  placeholder="••••••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "staff-password-error" : undefined}
                  className={`w-full rounded-xl border bg-white/[0.03] pl-11 pr-12 py-3.5 font-sans text-sm text-white placeholder:text-white/25 transition-all duration-200 focus:outline-none ${
                    fieldErrors.password
                      ? "border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-500/[0.02]"
                      : "border-white/10 hover:border-white/20 focus:border-[#00e599] focus:bg-white/[0.05] focus:ring-1 focus:ring-[#00e599]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-white focus-visible:text-white focus-visible:outline-none transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  disabled={loading || authStatus === "success"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="staff-password-error" className="mt-1.5 font-sans text-xs text-rose-400">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || authStatus === "success"}
              className="w-full mt-2 inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#00e599] hover:bg-[#00c985] text-[#050708] font-sans text-sm font-bold tracking-wide py-3.5 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(0,229,153,0.28)] hover:shadow-[0_0_36px_rgba(0,229,153,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e599] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d0b] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : authStatus === "success" ? (
                <>
                  <CheckCircle2 size={18} className="text-[#050708]" />
                  <span>Access Granted · Redirecting...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Reference Card Security Notice */}
          <div className="mt-7 pt-6 border-t border-white/10 flex items-start gap-3 text-left">
            <Shield size={18} className="text-[#00e599] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-sans text-xs text-white/60 leading-relaxed">
                This portal is restricted to authorized IT Club staff members.
              </p>
              <p className="arabic text-xs text-white/45 leading-relaxed font-medium" dir="rtl">
                هذه البوابة متاحة فقط لأعضاء لجان IT Club المصرح لهم.
              </p>
            </div>
          </div>

          {/* Student Portal Switcher */}
          <div className="mt-4 pt-3 text-center border-t border-white/5">
            <p className="font-sans text-xs text-white/45">
              Accepted student candidate?{" "}
              <Link
                href="/student/login"
                className="text-[#00e599] hover:text-[#00c985] font-semibold inline-flex items-center gap-1 transition-colors hover:underline"
              >
                <span>Sign in to Student Portal</span>
                <ArrowUpRight size={13} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
