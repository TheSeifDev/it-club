/**
 * Structured Observability Logger for Burst Readiness and Production Operations.
 * 
 * Captures request correlation IDs, latency percentiles, safe error categories,
 * and rate-limiting decisions.
 * Strictly redacts and NEVER logs:
 * - Full Egyptian National IDs
 * - Student passwords / credentials
 * - Raw email contents or bodies
 * - Raw QR tokens or bearer tokens
 */

export interface RegistrationDiagnosticLog {
  requestId: string;
  durationMs: number;
  outcome: "SUCCESS" | "VALIDATION_FAILED" | "RATE_LIMITED" | "DUPLICATE" | "DATABASE_ERROR" | "INTERNAL_ERROR";
  httpStatus: number;
  clientIpHash?: string;
  rateLimitDecision?: {
    allowed: boolean;
    source: "redis" | "memory" | "database" | "fail_open" | "bypassed";
    remaining?: number;
    limit?: number;
  };
  databaseTimingMs?: number;
  smtpTimingMs?: number;
  emailStatus?: "queued" | "sent" | "failed" | "unconfigured" | "pending";
  errorCategory?: string;
  safeMessage?: string;
}

/**
 * Emits a structured diagnostic log line for request observability.
 */
export function logRegistrationDiagnostic(log: RegistrationDiagnosticLog): void {
  const payload = {
    timestamp: new Date().toISOString(),
    event: "registration_request",
    requestId: log.requestId,
    durationMs: Math.round(log.durationMs * 10) / 10,
    outcome: log.outcome,
    httpStatus: log.httpStatus,
    clientIpHash: log.clientIpHash,
    rateLimit: log.rateLimitDecision,
    dbTimingMs: log.databaseTimingMs !== undefined ? Math.round(log.databaseTimingMs * 10) / 10 : undefined,
    smtpTimingMs: log.smtpTimingMs !== undefined ? Math.round(log.smtpTimingMs * 10) / 10 : undefined,
    emailStatus: log.emailStatus,
    errorCategory: log.errorCategory,
  };

  if (log.httpStatus >= 500) {
    console.error(`[observability] ${JSON.stringify(payload)}`);
  } else if (log.httpStatus >= 400) {
    console.warn(`[observability] ${JSON.stringify(payload)}`);
  } else {
    console.info(`[observability] ${JSON.stringify(payload)}`);
  }
}
