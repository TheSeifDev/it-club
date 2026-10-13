import { cookies } from "next/headers.js";
import { NextResponse } from "next/server.js";
import { createClient } from "../../../utils/supabase/server.ts";
import { sanitizeRedirectPath } from "../../../lib/auth/redirect.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  const url = new URL(request.url);
  const nextPath = sanitizeRedirectPath(url.searchParams.get("next"), "/login");
  return NextResponse.redirect(new URL(nextPath, url.origin), {
    status: 303,
  });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  const url = new URL(request.url);
  const nextPath = sanitizeRedirectPath(url.searchParams.get("next"), "/login");
  return NextResponse.redirect(new URL(nextPath, url.origin), {
    status: 303,
  });
}
