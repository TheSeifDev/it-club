import crypto from "node:crypto";
import QRCode from "qrcode";
import { getServiceRoleClient } from "../auth/service-role.ts";
import { isQrEligibleStatus } from "../auth/student.ts";

export interface QrTokenResult {
  eligible: boolean;
  token?: string;
  qrPayload?: string;
  status?: "ACTIVE" | "CHECKED_IN" | "REVOKED" | "EXPIRED";
  checkedInAt?: string | null;
  expiresAt?: string;
  code?: string;
  error?: string;
}

export interface CandidateCheckInResult {
  success: boolean;
  code:
    | "CHECK_IN_SUCCESS"
    | "ALREADY_CHECKED_IN"
    | "INVALID_TOKEN"
    | "REVOKED_TOKEN"
    | "EXPIRED_TOKEN"
    | "INELIGIBLE_STATUS"
    | "DATABASE_ERROR";
  error?: string;
  checkedInAt?: string;
  candidate?: {
    applicationReference: string;
    fullName: string;
    academicId: string;
    primaryTrack: string;
    academicYear: string;
    department: string;
    status: string;
    checkedInAt: string;
  };
}

/**
 * Returns the stable check-in payload encoded into the QR image.
 * Notice: Encodes only protocol and opaque token; NEVER includes student personal data!
 */
export function buildQrPayload(token: string): string {
  return JSON.stringify({
    protocol: "itc-interview-v1",
    token,
  });
}

/**
 * Parses the raw QR scan string into a valid token.
 */
export function parseQrPayload(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.token === "string") {
      return parsed.token.trim();
    }
  } catch {
    // If raw token or URL string was scanned directly
  }
  return trimmed;
}

/**
 * Retrieves the currently valid QR token for an eligible application,
 * or generates a new durable token if one does not yet exist.
 * Ensures an activated student gets the same token across sessions without invalidating downloaded cards.
 */
export async function getOrCreateInterviewQrToken(
  applicationId: string,
  applicationStatus: string
): Promise<QrTokenResult> {
  if (!isQrEligibleStatus(applicationStatus)) {
    return {
      eligible: false,
      code: "NOT_ELIGIBLE",
      error:
        "Interview QR credentials are only issued for accepted or scheduled applications.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 1. Check for existing token
  const { data: existing, error: fetchErr } = await serviceClient
    .from("interview_qr_tokens")
    .select("id, token, status, expires_at, checked_in_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (fetchErr) {
    console.error(
      "[qr-service] Error fetching QR token for application:",
      fetchErr.message
    );
    return {
      eligible: false,
      code: "DATABASE_ERROR",
      error: "Unable to retrieve interview credentials.",
    };
  }

  if (existing) {
    if (existing.status === "REVOKED") {
      return {
        eligible: false,
        code: "REVOKED",
        status: "REVOKED",
        error: "Your interview QR code has been revoked by committee organizers.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(existing.expires_at);

    if (now > expiresAt || existing.status === "EXPIRED") {
      return {
        eligible: false,
        code: "EXPIRED",
        status: "EXPIRED",
        error: "Your interview QR code has expired.",
      };
    }

    return {
      eligible: true,
      token: existing.token,
      qrPayload: buildQrPayload(existing.token),
      status: existing.status as "ACTIVE" | "CHECKED_IN",
      checkedInAt: existing.checked_in_at,
      expiresAt: existing.expires_at,
    };
  }

  // 2. Generate a new cryptographically unpredictable opaque token
  const rawToken = "itc_qr_" + crypto.randomBytes(24).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error: insertErr } = await serviceClient
    .from("interview_qr_tokens")
    .insert({
      application_id: applicationId,
      token: rawToken,
      token_hash: tokenHash,
      status: "ACTIVE",
      expires_at: expiresAt,
    })
    .select("token, status, expires_at")
    .single();

  if (insertErr || !inserted) {
    console.error("[qr-service] Error creating QR token:", insertErr?.message);
    return {
      eligible: false,
      code: "DATABASE_ERROR",
      error: "Unable to create interview credentials.",
    };
  }

  return {
    eligible: true,
    token: inserted.token,
    qrPayload: buildQrPayload(inserted.token),
    status: inserted.status as "ACTIVE",
    expiresAt: inserted.expires_at,
  };
}

/**
 * Renders QR code as high-resolution PNG Buffer for download or server-side image generation.
 */
export async function renderQrPngBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    width: 600,
    margin: 3,
    errorCorrectionLevel: "H",
    color: {
      dark: "#050708",
      light: "#ffffff",
    },
  });
}

/**
 * Renders QR code as Data URL for inline browser rendering.
 */
export async function renderQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "H",
    color: {
      dark: "#050708",
      light: "#ffffff",
    },
  });
}

/**
 * Validates an interview QR token and executes check-in for authorized staff.
 * Guarantees duplicate check-in prevention, safe state transitions, and audit-friendly results.
 */
export async function verifyAndCheckInInterviewQr(
  rawToken: string,
  staffUserId: string
): Promise<CandidateCheckInResult> {
  const token = parseQrPayload(rawToken);

  if (!token || !token.startsWith("itc_qr_") || token.length < 20) {
    return {
      success: false,
      code: "INVALID_TOKEN",
      error: "Invalid or unrecognized interview QR token format.",
    };
  }

  const serviceClient = getServiceRoleClient();

  // 1. Fetch token record
  const { data: tokenRow, error: tokenErr } = await serviceClient
    .from("interview_qr_tokens")
    .select("id, application_id, status, checked_in_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenErr || !tokenRow) {
    return {
      success: false,
      code: "INVALID_TOKEN",
      error: "No matching candidate found for this QR credential.",
    };
  }

  // 2. Status validation
  if (tokenRow.status === "REVOKED") {
    return {
      success: false,
      code: "REVOKED_TOKEN",
      error: "This interview QR code has been revoked.",
    };
  }

  if (tokenRow.status === "EXPIRED" || new Date() > new Date(tokenRow.expires_at)) {
    return {
      success: false,
      code: "EXPIRED_TOKEN",
      error: "This interview QR code has expired.",
    };
  }

  if (tokenRow.status === "CHECKED_IN") {
    return {
      success: false,
      code: "ALREADY_CHECKED_IN",
      error: "Candidate has already checked in for this interview.",
      checkedInAt: tokenRow.checked_in_at || undefined,
    };
  }

  // 3. Fetch linked application
  const { data: app, error: appErr } = await serviceClient
    .from("applications")
    .select("id, application_reference, full_name, academic_id, primary_track, academic_year, department, status")
    .eq("id", tokenRow.application_id)
    .single();

  if (appErr || !app) {
    return {
      success: false,
      code: "INVALID_TOKEN",
      error: "Linked application record could not be found.",
    };
  }

  if (!isQrEligibleStatus(app.status)) {
    return {
      success: false,
      code: "INELIGIBLE_STATUS",
      error: `Application is not in an approved interview status (currently '${app.status}').`,
    };
  }

  // 4. Atomically record check-in
  const now = new Date().toISOString();
  const { error: updateErr } = await serviceClient
    .from("interview_qr_tokens")
    .update({
      status: "CHECKED_IN",
      checked_in_at: now,
      checked_in_by: staffUserId,
      updated_at: now,
    })
    .eq("id", tokenRow.id)
    .eq("status", "ACTIVE"); // Optimistic concurrency check

  if (updateErr) {
    console.error("[qr-service] Failed to record check-in:", updateErr.message);
    return {
      success: false,
      code: "DATABASE_ERROR",
      error: "Failed to record check-in timestamp.",
    };
  }

  return {
    success: true,
    code: "CHECK_IN_SUCCESS",
    checkedInAt: now,
    candidate: {
      applicationReference: app.application_reference,
      fullName: app.full_name,
      academicId: app.academic_id,
      primaryTrack: app.primary_track,
      academicYear: app.academic_year,
      department: app.department,
      status: app.status,
      checkedInAt: now,
    },
  };
}

/**
 * Revokes an existing interview QR token.
 */
export async function revokeInterviewQrToken(
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const serviceClient = getServiceRoleClient();
  const now = new Date().toISOString();

  const { error } = await serviceClient
    .from("interview_qr_tokens")
    .update({
      status: "REVOKED",
      revoked_at: now,
      revoked_reason: reason || "Revoked by administrative action",
      updated_at: now,
    })
    .eq("application_id", applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
