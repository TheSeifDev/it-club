import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../lib/auth/server.ts";
import { getDashboardMetrics } from "../../../../lib/admin/queries.ts";
import { getAuthorizedApplicationScope } from "../../../../lib/auth/committee-access.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyStaffApiRequest(request, ["owner", "admin"]);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error, code: auth.code },
      { status: auth.status }
    );
  }

  // Resolve committee scope from trusted server-side staff record
  const appScope = await getAuthorizedApplicationScope();
  if (!appScope) {
    return NextResponse.json(
      { error: "Could not resolve authorization scope.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  if (!appScope.isOwner && !appScope.committee) {
    return NextResponse.json(
      {
        error: "Access denied: your account has no committee assignment.",
        code: "COMMITTEE_SCOPE_DENIED",
      },
      { status: 403 }
    );
  }

  try {
    // Owner: null scope = all committees. Non-owner: scoped to their committee.
    const committeeScope = appScope.isOwner ? null : appScope.committee;
    const metrics = await getDashboardMetrics(committeeScope);
    return NextResponse.json({ ok: true, metrics });
  } catch (err: unknown) {
    console.error("Failed to load recruitment metrics:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not load recruitment metrics.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}