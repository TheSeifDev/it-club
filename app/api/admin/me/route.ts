import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../lib/auth/server.ts";

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

  return NextResponse.json({
    ok: true,
    user: {
      id: auth.user!.id,
      email: auth.user!.email,
    },
    role: auth.role,
  });
}
