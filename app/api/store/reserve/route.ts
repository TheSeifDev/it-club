import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server.js";
import {
  buildReservationWhatsApp,
  RESERVATION_SHEET_COLUMNS,
  reservationCode,
  reservationSheetRow,
  validateReservation,
} from "../../../../lib/store/catalog.ts";
import { checkContactRateLimit } from "../../../../lib/site-content/rate-limit.ts";
import { NO_STORE_HEADERS, jsonError } from "../../site-admin/_shared.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 4_000;
const SHEET_TIMEOUT_MS = 9_000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(`store:${candidate.slice(0, 128)}`).digest("hex");
}

/** Appends the row through the club's Apps Script web app (docs/store-reservations-sheet.md). */
async function appendToSheet(row: string[]): Promise<boolean> {
  const url = process.env.STORE_SHEET_WEBHOOK_URL;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SHEET_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      redirect: "follow",
      signal: controller.signal,
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: process.env.STORE_SHEET_SECRET ?? "", columns: RESERVATION_SHEET_COLUMNS, row }),
    });
    if (!response.ok) return false;
    const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;
    return data?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_BODY_BYTES) return jsonError(413, "Request body is too large.", "BODY_TOO_LARGE");
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return jsonError(413, "Request body is too large.", "BODY_TOO_LARGE");
    body = JSON.parse(raw) as unknown;
  } catch {
    return jsonError(400, "Invalid JSON request body.", "MALFORMED_JSON");
  }
  // Honeypot: real visitors never see or fill this field.
  if (body && typeof body === "object" && typeof (body as { website?: unknown }).website === "string" && (body as { website: string }).website.trim()) {
    return jsonError(400, "Invalid form submission.", "INVALID_SUBMISSION");
  }
  const result = validateReservation(body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, code: "INVALID_INPUT", errors: result.errors }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const limit = await checkContactRateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many reservations from this connection. Try again later.", code: "RATE_LIMITED" },
      { status: 429, headers: { ...NO_STORE_HEADERS, "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const code = reservationCode(randomBytes(5));
  const stored = await appendToSheet(reservationSheetRow(code, result.value, new Date()));
  const whatsappUrl = buildReservationWhatsApp(process.env.STORE_WHATSAPP_NUMBER ?? null, code, result.value);
  if (!stored && !whatsappUrl) return jsonError(503, "Reservations are not open yet. Please try again soon.", "STORE_UNAVAILABLE");

  return NextResponse.json({ ok: true, reservation: code, stored, whatsappUrl }, { status: 201, headers: NO_STORE_HEADERS });
}
