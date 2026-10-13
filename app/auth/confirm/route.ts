import { type EmailOtpType } from "@supabase/supabase-js";
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

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
