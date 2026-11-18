import { type EmailOtpType, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server.js";
import { cookies } from "next/headers.js";
import { getCurrentStaff } from "../../../lib/auth/server.ts";
import { getAuthConfirmationDestination } from "../../../lib/auth/redirect.ts";
import { createClient } from "../../../utils/supabase/server.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function studentActivationDestination(rawNext: string | null): string {
  // Auth redirects must remain inside this application. The activation endpoint
  // does not need arbitrary query parameters or external destinations.
  return rawNext === "/student/activate" ? rawNext : "/student/activate";
}

async function confirmationDestination(type: string | null, rawNext: string | null): Promise<string> {
  const staff = type === "recovery" ? await getCurrentStaff() : null;
  return getAuthConfirmationDestination({
    verificationType: type,
    verifiedStaffRole: staff?.role,
    studentNext: studentActivationDestination(rawNext),
  });
}

function isSupportedActivationVerificationType(
  type: EmailOtpType | null
): type is "invite" | "recovery" {
  return type === "invite" || type === "recovery";
}

function activationError(request: NextRequest, code: string) {
  const response = NextResponse.redirect(
    new URL(`/student/activate?error=${code}`, request.url)
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

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
  const rawNext = searchParams.get("next");

  // Fast check: Fallback if neither token_hash nor code is provided
  if (!tokenHash && !code) {
    return activationError(request, "missing_credentials");
  }

  let supabase: SupabaseClient;
  try {
    const cookieStore = await cookies();
    supabase = createClient(cookieStore);
  } catch {
    return activationError(request, "auth_unavailable");
  }

  // 1. Token Hash verification (custom email provider link)
  if (tokenHash && isSupportedActivationVerificationType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const destination = await confirmationDestination(type, rawNext);
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    console.warn("[auth/confirm] OTP verification failed:", error.message);
    return activationError(request, "invalid_or_expired");
  }

  if (tokenHash) {
    return activationError(request, "invalid_verification_type");
  }

  // 2. PKCE code exchange (Supabase standard redirect)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = await confirmationDestination(type, rawNext);
      const response = NextResponse.redirect(new URL(destination, request.url));
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    console.warn("[auth/confirm] Code exchange failed:", error.message);
    return activationError(request, "invalid_or_expired");
  }

  // Fallback if neither token_hash nor code is provided
  return activationError(request, "missing_credentials");
}
