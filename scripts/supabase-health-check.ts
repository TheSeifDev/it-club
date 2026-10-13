/**
 * Supabase External Activity Health Check Script
 * 
 * Invokes the read-only RPC `public.health_ping()` to prevent inactivity pausing
 * on Supabase Free projects without storing state, creating log rows, or reading data.
 * 
 * Safety & Security Rules:
 * - Uses ONLY public/anonymous publishable credentials (never service-role key).
 * - Bounded network timeout (default 5000ms).
 * - Verifies `{ ok: true }` output.
 * - Redacts all credentials and URLs from log output.
 */

import { performance } from "node:perf_hooks";

export interface HealthCheckOptions {
  supabaseUrl?: string;
  publishableKey?: string;
  timeoutMs?: number;
}

export interface HealthCheckResult {
  ok: boolean;
  status: number;
  durationMs: number;
  response: unknown;
  error?: string;
}

export async function runSupabaseHealthCheck(
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const url =
    options.supabaseUrl ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    options.publishableKey ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing SUPABASE_URL environment variable. Configure SUPABASE_URL in GitHub Actions secrets or environment."
    );
  }

  if (!key) {
    throw new Error(
      "Missing SUPABASE_PUBLISHABLE_KEY environment variable. Configure SUPABASE_PUBLISHABLE_KEY in GitHub Actions secrets or environment."
    );
  }

  // Safety check: ensure service role key is not accidentally used
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && key === serviceRoleKey) {
    throw new Error(
      "SECURITY VIOLATION: SUPABASE_SERVICE_ROLE_KEY was provided for the public health check. Only anonymous/publishable keys are permitted."
    );
  }

  const timeoutMs = options.timeoutMs ?? 5000;
  const endpoint = `${url.replace(/\/+$/, "")}/rest/v1/rpc/health_ping`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = performance.now();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      signal: controller.signal,
    });

    clearTimeout(timer);
    const durationMs = Math.round((performance.now() - start) * 10) / 10;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        status: res.status,
        durationMs,
        response: null,
        error: `Supabase RPC returned HTTP ${res.status}: ${errText.slice(0, 100)}`,
      };
    }

    const json = await res.json().catch(() => null);
    const isHealthy =
      json &&
      typeof json === "object" &&
      (json as Record<string, unknown>).ok === true;

    if (!isHealthy) {
      return {
        ok: false,
        status: res.status,
        durationMs,
        response: json,
        error: `Unexpected payload received from public.health_ping: ${JSON.stringify(json)}`,
      };
    }

    return {
      ok: true,
      status: res.status,
      durationMs,
      response: json,
    };
  } catch (err) {
    clearTimeout(timer);
    const durationMs = Math.round((performance.now() - start) * 10) / 10;
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      status: 0,
      durationMs,
      response: null,
      error: isAbort
        ? `Request timed out after ${timeoutMs}ms`
        : err instanceof Error
        ? err.message
        : "Unknown network error",
    };
  }
}

// CLI Execution entry point
if (
  process.argv[1]?.endsWith("supabase-health-check.ts") ||
  process.argv[1]?.endsWith("supabase-health-check.js") ||
  process.argv[1]?.endsWith("supabase-health-check.mjs")
) {
  const timestamp = new Date().toISOString();
  console.log(`[health-check] Starting external Supabase activity ping at ${timestamp}...`);

  runSupabaseHealthCheck()
    .then((result) => {
      if (result.ok) {
        console.log(
          `[health-check] SUCCESS: Supabase project is active and healthy (status: ${result.status}, duration: ${result.durationMs}ms, payload: ${JSON.stringify(result.response)})`
        );
        process.exitCode = 0;
      } else {
        console.error(
          `[health-check] FAILED: Health ping was unsuccessful (status: ${result.status}, duration: ${result.durationMs}ms, error: ${result.error})`
        );
        process.exitCode = 1;
      }
    })
    .catch((err) => {
      console.error(
        `[health-check] FATAL: ${err instanceof Error ? err.message : "Initialization error"}`
      );
      process.exitCode = 1;
    });
}
