import { NextResponse } from "next/server.js";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { validateRegistrationPayload } from "../../../lib/validation/registration-schema.ts";
import {
  checkRateLimit,
  extractClientIp,
  hashRateLimitKey,
} from "../../../lib/security/rate-limiter.ts";
import { sendRegistrationReceipt } from "../../../lib/email/notification-service.ts";
import { recordAuditEvent } from "../../../lib/audit/service.ts";
import { logRegistrationDiagnostic } from "../../../lib/observability/logger.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB limit

export async function POST(request: Request) {
  const startTime = performance.now();
  const requestId =
    request.headers.get("x-request-id") ||
    `req_${randomUUID().replaceAll("-", "").slice(0, 8)}`;

  // 1. Enforce JSON content-type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "VALIDATION_FAILED",
      httpStatus: 415,
      errorCategory: "UNSUPPORTED_MEDIA_TYPE",
    });
    return NextResponse.json(
      {
        error: "Content-Type must be application/json.",
        code: "UNSUPPORTED_MEDIA_TYPE",
        requestId,
      },
      {
        status: 415,
        headers: { "x-request-id": requestId },
      }
    );
  }

  // 2. Enforce request size limit to prevent memory exhaustion / DoS
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "VALIDATION_FAILED",
      httpStatus: 413,
      errorCategory: "PAYLOAD_TOO_LARGE",
    });
    return NextResponse.json(
      {
        error: "Request payload too large (maximum 64KB).",
        code: "PAYLOAD_TOO_LARGE",
        requestId,
      },
      {
        status: 413,
        headers: { "x-request-id": requestId },
      }
    );
  }

  // 3. Rate limiting by client IP
  // Allows higher limits for campus Wi-Fi NAT gateways (configurable via RATE_LIMIT_IP_MAX, default 6)
  const clientIp = extractClientIp(request);
  const maxIpRequests = Number(process.env.RATE_LIMIT_IP_MAX) || 6;
  const ipRateKey = hashRateLimitKey("reg-ip", clientIp);
  const ipRateCheck = await checkRateLimit(ipRateKey, {
    maxRequests: maxIpRequests,
    windowSeconds: 900,
    prefix: "reg_ip",
  });

  if (!ipRateCheck.allowed) {
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "RATE_LIMITED",
      httpStatus: 429,
      clientIpHash: ipRateKey,
      rateLimitDecision: {
        allowed: false,
        source: ipRateCheck.source,
        limit: ipRateCheck.limit,
        remaining: 0,
      },
      errorCategory: "IP_RATE_LIMITED",
    });
    return NextResponse.json(
      {
        error: "Too many submission attempts from this network. Please wait a few minutes before trying again.",
        code: "RATE_LIMITED",
        retryAfter: ipRateCheck.retryAfter,
        requestId,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipRateCheck.retryAfter),
          "x-request-id": requestId,
        },
      }
    );
  }

  // 4. Safe body reading and parsing
  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
    if (rawBodyText.length > MAX_PAYLOAD_BYTES) {
      logRegistrationDiagnostic({
        requestId,
        durationMs: performance.now() - startTime,
        outcome: "VALIDATION_FAILED",
        httpStatus: 413,
        errorCategory: "PAYLOAD_TOO_LARGE",
      });
      return NextResponse.json(
        {
          error: "Request payload too large.",
          code: "PAYLOAD_TOO_LARGE",
          requestId,
        },
        {
          status: 413,
          headers: { "x-request-id": requestId },
        }
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: "Could not read request body.",
        code: "BAD_REQUEST",
        requestId,
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBodyText);
  } catch {
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "VALIDATION_FAILED",
      httpStatus: 400,
      errorCategory: "MALFORMED_JSON",
    });
    return NextResponse.json(
      {
        error: "Invalid JSON format in request body.",
        code: "MALFORMED_JSON",
        requestId,
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      }
    );
  }

  // 5. Strict schema validation and protected fields stripping
  const validation = validateRegistrationPayload(body);
  if (!validation.isValid) {
    if (validation.isBot) {
      logRegistrationDiagnostic({
        requestId,
        durationMs: performance.now() - startTime,
        outcome: "VALIDATION_FAILED",
        httpStatus: 400,
        errorCategory: "AUTOMATION_DETECTED",
      });
      return NextResponse.json(
        {
          error: "Automated submission detected. Please submit using the official IT Club registration form.",
          code: "AUTOMATION_DETECTED",
          requestId,
        },
        {
          status: 400,
          headers: { "x-request-id": requestId },
        }
      );
    }

    const firstError = Object.values(validation.errors)[0] || "Invalid submission details.";
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "VALIDATION_FAILED",
      httpStatus: 400,
      errorCategory: "VALIDATION_FAILED",
    });
    return NextResponse.json(
      {
        error: firstError,
        errors: validation.errors,
        code: "VALIDATION_FAILED",
        requestId,
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      }
    );
  }

  const { data } = validation;
  if (!data) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        code: "VALIDATION_FAILED",
        requestId,
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      }
    );
  }

  // 6. Secondary rate limiting by student email (strictly prevents student spam while sharing campus Wi-Fi)
  const maxEmailRequests = Number(process.env.RATE_LIMIT_EMAIL_MAX) || 3;
  const emailRateKey = hashRateLimitKey("reg-email", data.universityEmail);
  const emailRateCheck = await checkRateLimit(emailRateKey, {
    maxRequests: maxEmailRequests,
    windowSeconds: 3600,
    prefix: "reg_email",
  });

  if (!emailRateCheck.allowed) {
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "RATE_LIMITED",
      httpStatus: 429,
      clientIpHash: ipRateKey,
      rateLimitDecision: {
        allowed: false,
        source: emailRateCheck.source,
        limit: emailRateCheck.limit,
        remaining: 0,
      },
      errorCategory: "EMAIL_RATE_LIMITED",
    });
    return NextResponse.json(
      {
        error: "Multiple applications received for this student account. Please wait before retrying.",
        code: "RATE_LIMITED",
        retryAfter: emailRateCheck.retryAfter,
        requestId,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(emailRateCheck.retryAfter),
          "x-request-id": requestId,
        },
      }
    );
  }

  // 7. Supabase Database Insertion (Consolidated single round-trip query)
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  const clientKey = serviceRoleKey || publishableKey;

  if (!supabaseUrl || !clientKey) {
    console.error(`[${requestId}] Supabase URL or database API key is missing in environment.`);
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "INTERNAL_ERROR",
      httpStatus: 503,
      errorCategory: "CONFIGURATION_MISSING",
    });
    return NextResponse.json(
      {
        error: "Registration service is temporarily unconfigured. Please try again later.",
        code: "CONFIGURATION_MISSING",
        requestId,
      },
      {
        status: 503,
        headers: { "x-request-id": requestId },
      }
    );
  }

  const supabase = createClient(supabaseUrl, clientKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-application-source": "it-club-register" } },
  });

  // Reference generated exclusively on server
  const reference = `ITC-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  let insertedApp: { id: string } | null = null;
  const dbStartTime = performance.now();

  try {
    const insertQuery = supabase.from("applications").insert({
      application_reference: reference,
      full_name: data.fullName,
      national_id: data.nationalId,
      academic_id: data.academicId,
      phone: data.phone,
      whatsapp: data.whatsapp,
      university_email: data.universityEmail,
      google_email: data.googleEmail,
      academic_year: data.academicYear,
      department: data.department,
      experience_level: data.experienceLevel,
      skills: data.skills,
      experience_details: data.experienceDetails,
      volunteer_experience: data.volunteerExperience,
      primary_track: data.primaryTrack,
      secondary_track: data.secondaryTrack,
      motivation: data.motivation,
      learning_goal: data.learningGoal,
      contribution: data.contribution,
      availability: data.availability,
      status: "PENDING_REVIEW",
      consented_at: new Date().toISOString(),
    });

    const result = serviceRoleKey
      ? await insertQuery.select("id").maybeSingle()
      : await insertQuery;

    const error = result.error;
    if ("data" in result && result.data) {
      insertedApp = result.data as { id: string };
    }

    if (error) {
      const dbDurationMs = performance.now() - dbStartTime;

      if (error.code === "23505") {
        logRegistrationDiagnostic({
          requestId,
          durationMs: performance.now() - startTime,
          outcome: "DUPLICATE",
          httpStatus: 409,
          databaseTimingMs: dbDurationMs,
          errorCategory: "DUPLICATE_APPLICATION",
        });
        return NextResponse.json(
          {
            error:
              "An application has already been registered with one or more of these details (National ID, Academic ID, or University Email). If you believe this is an error, please reach out to IT Club recruitment.",
            code: "DUPLICATE_APPLICATION",
            requestId,
          },
          {
            status: 409,
            headers: { "x-request-id": requestId },
          }
        );
      }

      if (error.code === "23514") {
        console.error(`[${requestId}] Database check constraint violation (23514): ${error.message}`);
        logRegistrationDiagnostic({
          requestId,
          durationMs: performance.now() - startTime,
          outcome: "DATABASE_ERROR",
          httpStatus: 400,
          databaseTimingMs: dbDurationMs,
          errorCategory: "CONSTRAINT_VIOLATION",
        });
        return NextResponse.json(
          {
            error: "Submitted data does not satisfy registration constraints.",
            code: "CONSTRAINT_VIOLATION",
            requestId,
          },
          {
            status: 400,
            headers: { "x-request-id": requestId },
          }
        );
      }

      if (error.code === "42501") {
        console.error(
          `[${requestId}] Supabase permission denied (42501). Server credentials or RLS policies need review.`
        );
        logRegistrationDiagnostic({
          requestId,
          durationMs: performance.now() - startTime,
          outcome: "DATABASE_ERROR",
          httpStatus: 503,
          databaseTimingMs: dbDurationMs,
          errorCategory: "DATABASE_PERMISSION_DENIED",
        });
        return NextResponse.json(
          {
            error:
              "Registration database permission error. Server credentials or RLS policies need review.",
            code: "DATABASE_PERMISSION_DENIED",
            requestId,
          },
          {
            status: 503,
            headers: { "x-request-id": requestId },
          }
        );
      }

      logRegistrationDiagnostic({
        requestId,
        durationMs: performance.now() - startTime,
        outcome: "DATABASE_ERROR",
        httpStatus: 500,
        databaseTimingMs: dbDurationMs,
        errorCategory: `DB_${error.code || "UNKNOWN"}`,
      });
      return NextResponse.json(
        {
          error: "We could not save your application right now. Please try again later.",
          code: "INTERNAL_DATABASE_ERROR",
          requestId,
        },
        {
          status: 500,
          headers: { "x-request-id": requestId },
        }
      );
    }
  } catch (err: unknown) {
    const dbDurationMs = performance.now() - dbStartTime;
    console.error(
      `[${requestId}] Database network or execution failure:`,
      err instanceof Error ? err.name : "UnknownError"
    );
    logRegistrationDiagnostic({
      requestId,
      durationMs: performance.now() - startTime,
      outcome: "DATABASE_ERROR",
      httpStatus: 503,
      databaseTimingMs: dbDurationMs,
      errorCategory: "SERVICE_UNAVAILABLE",
    });
    return NextResponse.json(
      {
        error: "Unable to communicate with the database service. Please try again shortly.",
        code: "SERVICE_UNAVAILABLE",
        requestId,
      },
      {
        status: 503,
        headers: { "x-request-id": requestId },
      }
    );
  }

  const dbDurationMs = performance.now() - dbStartTime;

  // 8. Transactional Confirmation Receipt Dispatch & Audit Logging
  // Application is already safely persisted with PENDING_REVIEW in PostgreSQL.
  let emailDelivery = {
    status: "pending",
    message: "Confirmation receipt delivery queued.",
  };

  const applicationId: string | undefined = insertedApp?.id;

  // Record audit log for new application submission
  await recordAuditEvent({
    actor: {
      role: "applicant",
      email: data.universityEmail,
    },
    action: "APPLICATION_SUBMITTED",
    entityType: "application",
    entityId: applicationId,
    entityReference: reference,
    newStatus: "PENDING_REVIEW",
    metadata: {
      fullName: data.fullName,
      academicId: data.academicId,
      primaryTrack: data.primaryTrack,
      department: data.department,
      academicYear: data.academicYear,
    },
    requestId,
    outcome: "SUCCESS",
    ipAddress: clientIp,
  });

  let smtpDurationMs = 0;
  if (applicationId) {
    const emailStartTime = performance.now();
    try {
      // Non-blocking outbox delivery when EMAIL_DELIVERY_MODE=outbox or BURST_MODE=true
      const isOutboxMode =
        process.env.EMAIL_DELIVERY_MODE === "outbox" ||
        process.env.BURST_MODE === "true";

      const notifyRes = await sendRegistrationReceipt(
        {
          applicationId,
          applicationReference: reference,
          recipientEmail: data.universityEmail,
          fullName: data.fullName,
          academicId: data.academicId,
          academicYear: data.academicYear,
          department: data.department,
          primaryTrack: data.primaryTrack,
          secondaryTrack: data.secondaryTrack,
          universityEmail: data.universityEmail,
          googleEmail: data.googleEmail,
          phone: data.phone,
          whatsapp: data.whatsapp,
          experienceLevel: data.experienceLevel,
          skills: data.skills,
          experienceDetails: data.experienceDetails,
          volunteerExperience: data.volunteerExperience,
          motivation: data.motivation,
          learningGoal: data.learningGoal,
          contribution: data.contribution,
          availability: data.availability,
        },
        {
          dispatchMode: isOutboxMode ? "queue" : "sync",
          timeoutMs: 3500, // Bounded 3.5s timeout prevents slow SMTP from delaying student
        }
      );

      smtpDurationMs = performance.now() - emailStartTime;

      if (notifyRes.status === "sent" || notifyRes.status === "already_sent") {
        emailDelivery = {
          status: "sent",
          message: "Confirmation receipt sent to student email.",
        };
      } else if (notifyRes.status === "pending") {
        emailDelivery = {
          status: "pending",
          message: "Application received. Confirmation receipt queued for delivery.",
        };
      } else if (notifyRes.status === "unconfigured") {
        emailDelivery = {
          status: "unconfigured",
          message: "Email provider is not configured. Delivery is queued.",
        };
      } else {
        emailDelivery = {
          status: "failed",
          message: "Confirmation receipt delivery delayed or failed.",
        };
      }
    } catch (notifyErr: unknown) {
      smtpDurationMs = performance.now() - emailStartTime;
      console.error(
        `[${requestId}] Notification dispatch unexpected error:`,
        notifyErr instanceof Error ? notifyErr.message : "Unknown error"
      );
      emailDelivery = {
        status: "failed",
        message: "Confirmation receipt delivery delayed.",
      };
    }
  }

  const totalDurationMs = performance.now() - startTime;

  logRegistrationDiagnostic({
    requestId,
    durationMs: totalDurationMs,
    outcome: "SUCCESS",
    httpStatus: 201,
    clientIpHash: ipRateKey,
    rateLimitDecision: {
      allowed: true,
      source: ipRateCheck.source,
      remaining: ipRateCheck.remaining,
      limit: ipRateCheck.limit,
    },
    databaseTimingMs: dbDurationMs,
    smtpTimingMs: smtpDurationMs,
    emailStatus: emailDelivery.status as "queued" | "sent" | "failed" | "unconfigured" | "pending",
  });

  return NextResponse.json(
    {
      ok: true,
      reference,
      status: "PENDING_REVIEW",
      emailDelivery,
    },
    {
      status: 201,
      headers: {
        "x-request-id": requestId,
        "x-response-time": `${Math.round(totalDurationMs)}ms`,
      },
    }
  );
}
