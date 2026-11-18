import { createHash } from "node:crypto";
import { NextResponse } from "next/server.js";
import { getServiceRoleClient } from "../../../lib/auth/service-role.ts";
import { checkContactRateLimit } from "../../../lib/site-content/rate-limit.ts";
import { NO_STORE_HEADERS, jsonError } from "../site-admin/_shared.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 10_000;

interface ContactPayload {
  kind: "contact" | "partnership";
  name: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function extractClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  const normalized = candidate.slice(0, 128).replace(/[\r\n\u0000-\u001f]/g, "");
  return createHash("sha256").update(normalized || "unknown").digest("hex");
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) return jsonError(413, "Request body is too large.", "BODY_TOO_LARGE");
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return jsonError(400, "Invalid request body.", "INVALID_BODY");
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return jsonError(413, "Request body is too large.", "BODY_TOO_LARGE");
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return jsonError(400, "Invalid JSON request body.", "MALFORMED_JSON");
  }
  if (!isRecord(body)) return jsonError(400, "A JSON object is required.", "INVALID_INPUT");
  const allowed = new Set(["kind", "name", "email", "subject", "message", "website"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return jsonError(400, "Unsupported request field.", "INVALID_INPUT");
  if ("website" in body && typeof body.website !== "string") return jsonError(400, "Invalid form submission.", "INVALID_SUBMISSION");
  if (typeof body.website === "string" && body.website.trim()) return jsonError(400, "Invalid form submission.", "INVALID_SUBMISSION");
  if (body.kind !== "contact" && body.kind !== "partnership") return jsonError(400, "kind must be contact or partnership.", "INVALID_KIND");
  const fields: Array<[keyof ContactPayload, number]> = [["name", 120], ["email", 254], ["subject", 180], ["message", 5_000]];
  for (const [field, maxLength] of fields) {
    const value = body[field];
    if (typeof value !== "string" || !value.trim() || value.length > maxLength || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
      return jsonError(400, `${field} is required and must be at most ${maxLength} characters.`, "INVALID_INPUT");
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email as string)) return jsonError(400, "A valid email address is required.", "INVALID_EMAIL");

  const rateLimit = await checkContactRateLimit(extractClientKey(request));
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Too many inquiries. Please try again later.", code: "RATE_LIMITED" }, {
      status: 429,
      headers: { ...NO_STORE_HEADERS, "Retry-After": String(rateLimit.retryAfterSeconds) },
    });
  }

  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY);
  if (!hasUrl || !hasServiceKey) return jsonError(503, "Contact service is unavailable.", "CONTACT_UNAVAILABLE");

  try {
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("site_inquiries").insert({
      kind: body.kind,
      name: (body.name as string).trim(),
      email: (body.email as string).trim().toLowerCase(),
      subject: (body.subject as string).trim(),
      message: (body.message as string).trim(),
    });
    if (error) return jsonError(503, "Contact service is unavailable.", "CONTACT_UNAVAILABLE");
    return NextResponse.json({ ok: true, received: true, status: "stored" }, { status: 201, headers: NO_STORE_HEADERS });
  } catch {
    return jsonError(503, "Contact service is unavailable.", "CONTACT_UNAVAILABLE");
  }
}
