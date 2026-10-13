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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB limit

export async function POST(request: Request) {
  const requestId = `req_${randomUUID().replaceAll("-", "").slice(0, 8)}`;

  // 1. Enforce JSON content-type
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      {
        error: "Content-Type must be application/json.",
        code: "UNSUPPORTED_MEDIA_TYPE",
      },
      { status: 415 }
    );
  }

  // 2. Enforce request size limit to prevent memory exhaustion / DoS
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      {
        error: "Request payload too large (maximum 64KB).",
        code: "PAYLOAD_TOO_LARGE",
      },
      { status: 413 }
    );
  }

  // 3. Rate limiting by client IP
  const clientIp = extractClientIp(request);
  const ipRateKey = hashRateLimitKey("reg-ip", clientIp);
  const ipRateCheck = await checkRateLimit(ipRateKey, {
    maxRequests: 6,
    windowSeconds: 900, // 6 attempts per 15 minutes per IP
  });

  if (!ipRateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Too many submission attempts from this network. Please wait a few minutes before trying again.",
        code: "RATE_LIMITED",
        retryAfter: ipRateCheck.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipRateCheck.retryAfter),
        },
      }
    );
  }

  // 4. Safe body reading and parsing
  let rawBodyText: string;
  try {
    rawBodyText = await request.text();
    if (rawBodyText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          error: "Request payload too large.",
          code: "PAYLOAD_TOO_LARGE",
        },
        { status: 413 }
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: "Could not read request body.",
        code: "BAD_REQUEST",
      },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBodyText);
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON format in request body.",
        code: "MALFORMED_JSON",
      },
      { status: 400 }
    );
  }

  // 5. Strict schema validation and protected fields stripping
  const validation = validateRegistrationPayload(body);
  if (!validation.isValid) {
    if (validation.isBot) {
      return NextResponse.json(
        {
          error: "Automated submission detected. Please submit using the official IT Club registration form.",
          code: "AUTOMATION_DETECTED",
        },
        { status: 400 }
      );
    }

    const firstError = Object.values(validation.errors)[0] || "Invalid submission details.";
    return NextResponse.json(
      {
        error: firstError,
        errors: validation.errors,
        code: "VALIDATION_FAILED",
      },
      { status: 400 }
    );
  }

  const { data } = validation;
  if (!data) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        code: "VALIDATION_FAILED",
      },
      { status: 400 }
    );
  }

  // 6. Secondary rate limiting by student email to protect shared campus Wi-Fi
  const emailRateKey = hashRateLimitKey("reg-email", data.universityEmail);
  const emailRateCheck = await checkRateLimit(emailRateKey, {
    maxRequests: 3,
    windowSeconds: 3600, // 3 attempts per hour per university email
  });

  if (!emailRateCheck.allowed) {
    return NextResponse.json(
      {
        error: "Multiple applications received for this student account. Please wait before retrying.",
        code: "RATE_LIMITED",
        retryAfter: emailRateCheck.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(emailRateCheck.retryAfter),
        },
      }
    );
  }

  // 7. Supabase Database Insertion
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
    return NextResponse.json(
      {
        error: "Registration service is temporarily unconfigured. Please try again later.",
        code: "CONFIGURATION_MISSING",
        requestId,
      },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, clientKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-application-source": "it-club-register" } },
  });

  // Reference generated exclusively on server
  const reference = `ITC-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;

  // Safe parameterized insertion: only explicit, validated fields are included.
  // Status and consent timestamps are server-controlled.
  let insertedApp: { id: string } | null = null;
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
      if (error.code === "23505") {
        // Friendly, non-enumerating message for duplicate conflict
        return NextResponse.json(
          {
            error:
              "An application has already been registered with one or more of these details (National ID, Academic ID, or University Email). If you believe this is an error, please reach out to IT Club recruitment.",
            code: "DUPLICATE_APPLICATION",
            requestId,
          },
          { status: 409 }
        );
      }

      if (error.code === "23514") {
        console.error(`[${requestId}] Database check constraint violation (23514): ${error.message}`);
        return NextResponse.json(
          {
            error: "Submitted data does not satisfy registration constraints.",
            code: "CONSTRAINT_VIOLATION",
            requestId,
          },
          { status: 400 }
        );
      }

      if (error.code === "42501") {
        console.error(
          `[${requestId}] Supabase permission denied (42501). Server credentials or RLS policies need review.`
        );
        return NextResponse.json(
          {
            error:
              "Registration database permission error. Server credentials or RLS policies need review.",
            code: "DATABASE_PERMISSION_DENIED",
            requestId,
          },
          { status: 503 }
        );
      }

      if (error.code === "42P01" || error.code === "42703") {
        console.error(`[${requestId}] Database schema mismatch (code ${error.code}): ${error.message}`);
        return NextResponse.json(
          {
            error: "Database configuration error. The system is undergoing maintenance.",
            code: "DATABASE_SCHEMA_ERROR",
            requestId,
          },
          { status: 500 }
        );
      }

      // Do not leak database internals, stack traces, or credentials to client
      console.error(`[${requestId}] Supabase insert failed: code ${error.code}`);
      return NextResponse.json(
        {
          error: "We could not save your application right now. Please try again later.",
          code: "INTERNAL_DATABASE_ERROR",
          requestId,
        },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    console.error(
      `[${requestId}] Database network or execution failure:`,
      err instanceof Error ? err.name : "UnknownError"
    );
    return NextResponse.json(
      {
        error: "Unable to communicate with the database service. Please try again shortly.",
        code: "SERVICE_UNAVAILABLE",
        requestId,
      },
      { status: 503 }
    );
  }

  // 8. Transactional Confirmation Receipt Dispatch
  // Persisted application is preserved regardless of email provider outcome.
  let emailDelivery = {
    status: "pending",
    message: "Confirmation receipt delivery pending.",
  };

  let applicationId: string | undefined = insertedApp?.id;
  if (!applicationId && serviceRoleKey) {
    try {
      const { data: foundApp } = await supabase
        .from("applications")
        .select("id")
        .eq("application_reference", reference)
        .maybeSingle();
      if (foundApp) {
        applicationId = (foundApp as { id: string }).id;
      }
    } catch {
      // Suppress secondary lookup error
    }
  }

  if (applicationId) {
    try {
      const notifyRes = await sendRegistrationReceipt({
        applicationId,
        applicationReference: reference,
        recipientEmail: data.universityEmail,
        fullName: data.fullName,
        academicId: data.academicId,
        academicYear: data.academicYear,
        department: data.department,
        primaryTrack: data.primaryTrack,
        secondaryTrack: data.secondaryTrack,
      });

      if (notifyRes.status === "sent" || notifyRes.status === "already_sent") {
        emailDelivery = {
          status: "sent",
          message: "Confirmation receipt sent to student email.",
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

  return NextResponse.json(
    {
      ok: true,
      reference,
      status: "PENDING_REVIEW",
      emailDelivery,
    },
    { status: 201 }
  );
}
