import { NextResponse } from "next/server.js";
import { getCurrentUser, getStaffRole } from "../../../../lib/auth/server.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const role = await getStaffRole(user.id);
  if (!role) {
    return NextResponse.json(
      {
        error: "Access denied. User account is not an authorized staff member.",
        code: "NOT_STAFF",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
    },
    role,
  });
}
