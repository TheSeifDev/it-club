import { cookies } from "next/headers.js";
import { NextResponse } from "next/server.js";
import { createClient } from "../../../utils/supabase/server.ts";
import { sanitizeRedirectPath } from "../../../lib/auth/redirect.ts";
import { hasSupabasePublicConfig } from "../../../utils/supabase/config.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function signOut(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeRedirectPath(
    url.searchParams.get("next"),
    "/interview/login"
  );

  if (hasSupabasePublicConfig()) {
    try {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      await supabase.auth.signOut();
    } catch {
      // Config/cookie failures leave the user logged out at the app boundary;
      // no alternate identity or synthetic session is created.
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin), { status: 303 });
}

export async function POST(request: Request) {
  return signOut(request);
}

export async function GET(request: Request) {
  return signOut(request);
}
