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

      const verifyData = await verifyRes.json();
      if (verifyData.isTempPasswordExpired) {
        setAuthStatus("success");
        router.push("/admin/change-password?error=expired");
        router.refresh();
        return;
      }

      if (verifyData.passwordChangeRequired) {
        setAuthStatus("success");
        router.push("/admin/change-password");
        router.refresh();
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
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080b0e]/85 backdrop-blur-xl p-6 sm:p-9 shadow-[0_0_50px_rgba(0,0,0,0.6)]">
        {/* Subtle accent highlight at top edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
        />

        {/* Header with lock icon */}
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 mb-3.5">
            <ShieldCheck size={22} />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-[10.5px] font-bold tracking-[0.2em] text-emerald-400 uppercase">
              STAFF PORTAL
            </span>
            <span className="text-white/20">·</span>
            <span className="arabic text-xs text-white/50" dir="rtl">
              بوابة المخولين
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Staff Sign In
          </h2>

          <p className="arabic mt-1.5 text-xs sm:text-sm text-neutral-400 leading-relaxed font-medium" dir="rtl">
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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
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
                    : "border-white/10 hover:border-white/20 focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400"
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
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
                    : "border-white/10 hover:border-white/20 focus:border-emerald-400 focus:bg-white/[0.05] focus:ring-1 focus:ring-emerald-400"
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
            className="w-full mt-2 inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-sans text-sm font-bold tracking-wide py-3.5 px-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_24px_rgba(52,211,153,0.22)] hover:shadow-[0_0_36px_rgba(52,211,153,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : authStatus === "success" ? (
              <>
                <CheckCircle2 size={18} className="text-zinc-950" />
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

        {/* Security Notice & Student Switch */}
        <div className="mt-7 pt-5 border-t border-white/10 space-y-3">
          <p className="font-sans text-xs text-white/50 leading-relaxed text-center sm:text-left">
            This gateway is restricted to authorized IT Club staff members and committee leads.
          </p>

          <div className="pt-2 text-center sm:text-left">
            <p className="font-sans text-xs text-white/45">
              Candidate or student member?{" "}
              <Link
                href="/student/login"
                className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 transition-colors hover:underline"
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

