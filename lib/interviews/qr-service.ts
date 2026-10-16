import crypto from "node:crypto";
import QRCode from "qrcode";
import { getServiceRoleClient } from "../auth/service-role.ts";
import { isQrEligibleStatus } from "../auth/student.ts";
import { recordAuditEvent } from "../audit/service.ts";
import type { StaffRole } from "../auth/roles.ts";

export type InterviewRating = "STRONG_HIRE" | "HIRE" | "NEUTRAL" | "NO_HIRE";

export interface InterviewEvaluationRecord {
  id: string;
  applicationId: string;
  interviewerId: string;
  evaluationNotes: string;
  rating: InterviewRating | null;
  recommendation: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateInterviewProfile {
  applicationId: string;
  applicationReference: string;
  fullName: string;
  academicId: string;
  primaryTrack: string;
  secondaryTrack: string | null;
  academicYear: string;
  department: string;
  experienceLevel: string;
  skills: string | null;
  experienceDetails: string | null;
  volunteerExperience: string | null;
  motivation: string;
  learningGoal: string;
  status: string;
  checkedInAt: string;
  interviewDate: string | null;
  interviewTime: string | null;
  interviewLocation: string | null;
}

export interface CandidateLookupResult {
  success: boolean;
  code:
    | "LOOKUP_SUCCESS"
    | "NOT_CHECKED_IN"
    | "INVALID_TOKEN"
    | "REVOKED_TOKEN"
    | "EXPIRED_TOKEN"
    | "INELIGIBLE_STATUS"
    | "DATABASE_ERROR";
  error?: string;
  candidate?: CandidateInterviewProfile;
  evaluation?: InterviewEvaluationRecord | null;
  allEvaluations?: InterviewEvaluationRecord[];
}

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
        "Interview QR credentials are only issued for shortlisted, scheduled, or accepted applications.",
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

  await recordAuditEvent({
    actor: { role: "system" },
    action: "INTERVIEW_QR_ISSUED",
    entityType: "interview_qr",
    entityId: applicationId,
    metadata: { status: "ACTIVE" },
    outcome: "SUCCESS",
  });

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
  staffUserId: string,
  staffRole: StaffRole = "admin"
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

  // 3. Fetch linked application
  const { data: app, error: appErr } = await serviceClient
    .from("applications")
    .select(
      "id, application_reference, full_name, academic_id, primary_track, academic_year, department, status"
    )
    .eq("id", tokenRow.application_id)
    .single();

  if (appErr || !app) {
    return {
      success: false,
      code: "INVALID_TOKEN",
      error: "Linked application record could not be found.",
    };
  }

  if (tokenRow.status === "CHECKED_IN") {
    await recordAuditEvent({
      actor: { id: staffUserId, role: staffRole },
      action: "INTERVIEW_CHECK_IN_DUPLICATE",
      entityType: "interview_qr",
      entityId: tokenRow.id,
      entityReference: app.application_reference,
      previousStatus: "CHECKED_IN",
      metadata: {
        candidateName: app.full_name,
        track: app.primary_track,
        originalCheckInAt: tokenRow.checked_in_at,
      },
      outcome: "FAILURE",
      errorCategory: "ALREADY_CHECKED_IN",
    });

    return {
      success: false,
      code: "ALREADY_CHECKED_IN",
      error: "Candidate has already checked in for this interview.",
      checkedInAt: tokenRow.checked_in_at || undefined,
      candidate: {
        applicationReference: app.application_reference,
        fullName: app.full_name,
        academicId: app.academic_id,
        primaryTrack: app.primary_track,
        academicYear: app.academic_year,
        department: app.department,
        status: app.status,
        checkedInAt: tokenRow.checked_in_at || "",
      },
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

  await recordAuditEvent({
    actor: { id: staffUserId, role: staffRole },
    action: "INTERVIEW_CHECK_IN_SUCCESS",
    entityType: "interview_qr",
    entityId: tokenRow.id,
    entityReference: app.application_reference,
    previousStatus: "ACTIVE",
    newStatus: "CHECKED_IN",
    metadata: {
      candidateName: app.full_name,
      track: app.primary_track,
      academicYear: app.academic_year,
    },
    outcome: "SUCCESS",
  });

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

  await recordAuditEvent({
    actor: { role: "admin" },
    action: "INTERVIEW_QR_REVOKED",
    entityType: "interview_qr",
    entityId: applicationId,
    metadata: { reason: reason || "Revoked by administrative action" },
    outcome: "SUCCESS",
  });

  return { success: true };
}

/**
 * Looks up a checked-in candidate for Station Two (Interview Stage).
 * - Requires candidate to have already checked in at Station One.
 * - Returns only authorized interview details (no national IDs, passwords, or unrelated records).
 * - Never increments attendance or marks attendance again.
 * - Audits the interview-stage lookup.
 */
export async function lookupInterviewCandidateByQr(
  rawToken: string,
  staffUserId: string,
  staffRole: StaffRole = "interviewer"
): Promise<CandidateLookupResult> {
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

  // 2. Validate token lifecycle status
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

  // 3. Station Two requirement: Candidate MUST be checked in at Station One first!
  if (tokenRow.status !== "CHECKED_IN" || !tokenRow.checked_in_at) {
    return {
      success: false,
      code: "NOT_CHECKED_IN",
      error: "Candidate has not checked in at Station One yet. Attendance check-in is required before interview lookup.",
    };
  }

  // 4. Fetch linked application (authorized interview profile - sensitive national ID & contact omitted)
  const { data: app, error: appErr } = await serviceClient
    .from("applications")
    .select(
      "id, application_reference, full_name, academic_id, primary_track, secondary_track, academic_year, department, experience_level, skills, experience_details, volunteer_experience, motivation, learning_goal, status, interview_date, interview_time, interview_location"
    )
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

  // 5. Query evaluations:
  // For interviewers: load their own evaluation.
  // For owners/admins: load their own and all evaluations for complete review.
  let myEvaluation: InterviewEvaluationRecord | null = null;
  let allEvaluations: InterviewEvaluationRecord[] | undefined = undefined;

  const { data: evals, error: evalErr } = await serviceClient
    .from("interview_evaluations")
    .select("id, application_id, interviewer_id, evaluation_notes, rating, recommendation, created_at, updated_at")
    .eq("application_id", app.id);

  if (!evalErr && evals) {
    const matched = evals.find((e) => e.interviewer_id === staffUserId);
    if (matched) {
      myEvaluation = {
        id: matched.id,
        applicationId: matched.application_id,
        interviewerId: matched.interviewer_id,
        evaluationNotes: matched.evaluation_notes,
        rating: matched.rating as InterviewRating | null,
        recommendation: matched.recommendation,
        createdAt: matched.created_at,
        updatedAt: matched.updated_at,
      };
    }
    if (staffRole === "owner" || staffRole === "admin") {
      allEvaluations = evals.map((e) => ({
        id: e.id,
        applicationId: e.application_id,
        interviewerId: e.interviewer_id,
        evaluationNotes: e.evaluation_notes,
        rating: e.rating as InterviewRating | null,
        recommendation: e.recommendation,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      }));
    }
  }

  // 6. Record audit event for interview lookup
  await recordAuditEvent({
    actor: { id: staffUserId, role: staffRole },
    action: "INTERVIEW_CANDIDATE_LOOKUP",
    entityType: "interview_qr",
    entityId: tokenRow.id,
    entityReference: app.application_reference,
    metadata: {
      candidateName: app.full_name,
      track: app.primary_track,
      checkedInAt: tokenRow.checked_in_at,
    },
    outcome: "SUCCESS",
  });

  return {
    success: true,
    code: "LOOKUP_SUCCESS",
    candidate: {
      applicationId: app.id,
      applicationReference: app.application_reference,
      fullName: app.full_name,
      academicId: app.academic_id,
      primaryTrack: app.primary_track,
      secondaryTrack: app.secondary_track || null,
      academicYear: app.academic_year,
      department: app.department,
      experienceLevel: app.experience_level,
      skills: app.skills || null,
      experienceDetails: app.experience_details || null,
      volunteerExperience: app.volunteer_experience || null,
      motivation: app.motivation,
      learningGoal: app.learning_goal,
      status: app.status,
      checkedInAt: tokenRow.checked_in_at,
      interviewDate: app.interview_date || null,
      interviewTime: app.interview_time || null,
      interviewLocation: app.interview_location || null,
    },
    evaluation: myEvaluation,
    allEvaluations,
  };
}

export interface SaveEvaluationInput {
  applicationId: string;
  interviewerId: string;
  interviewerRole: StaffRole;
  evaluationNotes: string;
  rating?: InterviewRating | null;
  recommendation?: string | null;
}

/**
 * Creates or updates an interview evaluation note for a specific candidate.
 * Strictly attributed to the authenticated interviewer.
 * Does not overwrite applications.reviewer_notes or modify candidate recruitment status.
 */
export async function saveInterviewEvaluation(
  input: SaveEvaluationInput
): Promise<{ success: boolean; evaluation?: InterviewEvaluationRecord; error?: string; code?: string }> {
  const serviceClient = getServiceRoleClient();

  const validRatings: InterviewRating[] = ["STRONG_HIRE", "HIRE", "NEUTRAL", "NO_HIRE"];
  if (input.rating && !validRatings.includes(input.rating)) {
    return { success: false, code: "INVALID_RATING", error: "Invalid rating specified." };
  }

  // Fetch application reference for audit logging
  const { data: app } = await serviceClient
    .from("applications")
    .select("application_reference")
    .eq("id", input.applicationId)
    .maybeSingle();

  const appRef = app?.application_reference || input.applicationId;

  // Check if evaluation already exists for this candidate by this interviewer
  const { data: existing } = await serviceClient
    .from("interview_evaluations")
    .select("id, interviewer_id")
    .eq("application_id", input.applicationId)
    .eq("interviewer_id", input.interviewerId)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    const { data: updated, error: updateErr } = await serviceClient
      .from("interview_evaluations")
      .update({
        evaluation_notes: input.evaluationNotes || "",
        rating: input.rating || null,
        recommendation: input.recommendation || null,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("id, application_id, interviewer_id, evaluation_notes, rating, recommendation, created_at, updated_at")
      .single();

    if (updateErr || !updated) {
      return { success: false, code: "DATABASE_ERROR", error: updateErr?.message || "Failed to update evaluation." };
    }

    await recordAuditEvent({
      actor: { id: input.interviewerId, role: input.interviewerRole },
      action: "INTERVIEW_EVALUATION_UPDATED",
      entityType: "interview_evaluation",
      entityId: updated.id,
      entityReference: appRef,
      metadata: {
        rating: updated.rating,
        hasNotes: Boolean(updated.evaluation_notes?.trim()),
      },
      outcome: "SUCCESS",
    });

    return {
      success: true,
      evaluation: {
        id: updated.id,
        applicationId: updated.application_id,
        interviewerId: updated.interviewer_id,
        evaluationNotes: updated.evaluation_notes,
        rating: updated.rating as InterviewRating | null,
        recommendation: updated.recommendation,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    };
  }

  // Insert new evaluation
  const { data: inserted, error: insertErr } = await serviceClient
    .from("interview_evaluations")
    .insert({
      application_id: input.applicationId,
      interviewer_id: input.interviewerId,
      evaluation_notes: input.evaluationNotes || "",
      rating: input.rating || null,
      recommendation: input.recommendation || null,
      created_at: now,
      updated_at: now,
    })
    .select("id, application_id, interviewer_id, evaluation_notes, rating, recommendation, created_at, updated_at")
    .single();

  if (insertErr || !inserted) {
    return { success: false, code: "DATABASE_ERROR", error: insertErr?.message || "Failed to save evaluation." };
  }

  await recordAuditEvent({
    actor: { id: input.interviewerId, role: input.interviewerRole },
    action: "INTERVIEW_EVALUATION_CREATED",
    entityType: "interview_evaluation",
    entityId: inserted.id,
    entityReference: appRef,
    metadata: {
      rating: inserted.rating,
      hasNotes: Boolean(inserted.evaluation_notes?.trim()),
    },
    outcome: "SUCCESS",
  });

  return {
    success: true,
    evaluation: {
      id: inserted.id,
      applicationId: inserted.application_id,
      interviewerId: inserted.interviewer_id,
      evaluationNotes: inserted.evaluation_notes,
      rating: inserted.rating as InterviewRating | null,
      recommendation: inserted.recommendation,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    },
  };
}

