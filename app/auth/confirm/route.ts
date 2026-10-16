import { type EmailOtpType, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server.js";
import { cookies } from "next/headers.js";
import { createClient } from "../../../utils/supabase/server.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Server-side Supabase Auth verification route.
 * Handles both token_hash (verifyOtp) and code (exchangeCodeForSession) flows.
 * Establishes authenticated SSR session cookies before redirecting to the destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/student/activate";

  // Fast check: Fallback if neither token_hash nor code is provided
  if (!tokenHash && !code) {
    return NextResponse.redirect(
      new URL("/student/activate?error=missing_credentials", request.url)
    );
  }

  let supabase: SupabaseClient | null = null;
  try {
    const cookieStore = await cookies();
    supabase = createClient(cookieStore);
  } catch {
    // Fallback for standalone test runners where cookies() request scope is absent
    const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
    supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzendwuoankwiahbrwqt.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy",
      { auth: { persistSession: false } }
    );
  }

  // 1. Token Hash verification (custom email provider link)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    console.warn("[auth/confirm] OTP verification failed:", error.message);
    return NextResponse.redirect(
      new URL("/student/activate?error=invalid_or_expired", request.url)
    );
  }

  // 2. PKCE code exchange (Supabase standard redirect)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    console.warn("[auth/confirm] Code exchange failed:", error.message);
    return NextResponse.redirect(
      new URL("/student/activate?error=invalid_or_expired", request.url)
    );
  }

  // Fallback if neither token_hash nor code is provided
  return NextResponse.redirect(
    new URL("/student/activate?error=missing_credentials", request.url)
  );
}
