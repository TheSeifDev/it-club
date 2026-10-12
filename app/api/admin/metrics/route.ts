import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../lib/auth/server.ts";
import { getDashboardMetrics } from "../../../../lib/admin/queries.ts";

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

  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json({ ok: true, metrics });
  } catch (err: unknown) {
    console.error("Failed to load recruitment metrics:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not load recruitment metrics.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
