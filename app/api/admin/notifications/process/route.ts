import { NextResponse } from "next/server.js";
import { verifyStaffApiRequest } from "../../../../../lib/auth/server.ts";
import { processPendingNotifications } from "../../../../../lib/email/notification-service.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Authorization: either via CRON_SECRET header or authenticated staff session
  const authHeader = request.headers.get("authorization") || "";
  const cronSecret = process.env.CRON_SECRET;
  let isAuthorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true;
  } else {
    const staffAuth = await verifyStaffApiRequest(request, ["owner", "admin"]);
    if (staffAuth.authorized) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized access to notification processor.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // 2. Optional query params or body for batch size and delay
  let batchSize = 25;
  let delayBetweenMs = 250;

  try {
    const body = await request.json().catch(() => null);
    if (body) {
      if (typeof body.batchSize === "number") batchSize = body.batchSize;
      if (typeof body.delayBetweenMs === "number") delayBetweenMs = body.delayBetweenMs;
    }
  } catch {
    // Ignore JSON parsing error for empty requests
  }

  try {
    const result = await processPendingNotifications({ batchSize, delayBetweenMs });
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    console.error(
      "[outbox-worker] Failed to process pending notifications:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Notification processor execution failure.", code: "WORKER_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
