import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../lib/auth/server.ts";
import { listApplications } from "../../../../lib/admin/queries.ts";
import type { ApplicationStatus, CommitteeTrack, AcademicYear, ApplicationFilters } from "../../../../lib/admin/types.ts";

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
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const status = (url.searchParams.get("status") as ApplicationStatus) || undefined;
    const track = (url.searchParams.get("track") as CommitteeTrack) || undefined;
    const year = (url.searchParams.get("year") as AcademicYear) || undefined;
    const sortBy = (url.searchParams.get("sortBy") as ApplicationFilters["sortBy"]) || undefined;
    const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") || undefined;
    const page = url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!, 10) : undefined;
    const pageSize = url.searchParams.get("pageSize") ? parseInt(url.searchParams.get("pageSize")!, 10) : undefined;

    const data = await listApplications({
      search,
      status,
      track,
      year,
      sortBy,
      sortOrder,
      page,
      pageSize,
    });

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    console.error("Failed to query applications list:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Could not retrieve applications list.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
