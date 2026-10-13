import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../lib/auth/server.ts";
import { queryAuditLogs, getAuditStats } from "../../../../lib/audit/service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Enforce Owner-only authorization
  const auth = await verifyStaffApiRequest(request, ["owner"]);
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(
      {
        error:
          auth.status === 403
            ? "Access restricted: Only the Committee Owner can inspect audit logs."
            : auth.error,
        code: auth.code,
      },
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(request.url);

  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("pageSize") || "20";
  const action = searchParams.get("action") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const outcome = searchParams.get("outcome") || undefined;
  const actorRole = searchParams.get("actorRole") || undefined;
  const search = searchParams.get("search") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  try {
    const [result, stats] = await Promise.all([
      queryAuditLogs({
        page,
        pageSize,
        action,
        entityType,
        outcome,
        actorRole,
        search,
        from,
        to,
      }),
      getAuditStats(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        data: result,
        stats,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    console.error("[audit-api] Error querying audit events:", err);
    return NextResponse.json(
      {
        error: "Failed to query audit history.",
        code: "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }
}
