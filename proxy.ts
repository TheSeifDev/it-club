import { NextResponse, type NextRequest } from "next/server";
import { getLegacyRouteRedirect } from "./lib/auth/route-policy.ts";
import { createClient as refreshSupabaseSession } from "./utils/supabase/middleware.ts";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const legacyDestination = getLegacyRouteRedirect(pathname);
  if (legacyDestination) {
    const destination = request.nextUrl.clone();
    destination.pathname = legacyDestination;
    return NextResponse.redirect(destination, 307);
  }

  // Proxy is an optimistic session-refresh layer only. Page and API guards
  // continue to verify the authenticated user and database-backed staff role.
  return refreshSupabaseSession(request);
}

export const config = {
  // APIs keep their own authorization and static/SEO files are served directly.
  // All page routes (including future routes and CMS entry points) pass through.
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|.*\\..*).*)"],
};
