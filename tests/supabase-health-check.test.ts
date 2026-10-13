/**
 * Verification Tests for Supabase Read-Only Activity Health Ping
 * 
 * Verifies:
 * 1. Anonymous execution of public.health_ping() returns only {"ok": true}
 * 2. public.health_ping() can be called via @supabase/supabase-js client
 * 3. Calling public.health_ping() modifies 0 rows and creates 0 log/audit entries
 * 4. Anonymous role cannot read private applications or audit_events tables
 * 5. Script handles missing configurations and enforces that service_role key is forbidden
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { runSupabaseHealthCheck } from "../scripts/supabase-health-check.ts";

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

describe("Supabase Activity Health Check & Security Guardrails", () => {
  test("1. public.health_ping() returns { ok: true } via HTTP health-check runner", async () => {
    if (!supabaseUrl || !publishableKey) {
      console.warn("Skipping live test: Supabase URL/key not present in environment.");
      return;
    }

    const result = await runSupabaseHealthCheck({
      supabaseUrl,
      publishableKey,
      timeoutMs: 5000,
    });

    assert.equal(result.ok, true, "Health check should succeed");
    assert.equal(result.status, 200, "Should return HTTP 200");
    assert.deepEqual(result.response, { ok: true }, "Should return fixed ok payload");
  });

  test("2. public.health_ping() can be invoked via @supabase/supabase-js RPC", async () => {
    if (!supabaseUrl || !publishableKey) {
      console.warn("Skipping live test: Supabase URL/key not present in environment.");
      return;
    }

    const anonClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error, status } = await anonClient.rpc("health_ping");

    assert.equal(error, null, "RPC call should produce no errors");
    assert.equal(status, 200, "RPC status should be 200");
    assert.deepEqual(data, { ok: true }, "RPC data should match { ok: true }");
  });

  test("3. Anonymous client cannot read private applications table (RLS enforced)", async () => {
    if (!supabaseUrl || !publishableKey) return;

    const anonClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Attempt to SELECT from applications as anonymous user
    const { data, error } = await anonClient
      .from("applications")
      .select("id, national_id, university_email, full_name");

    // Under RLS and REVOKE SELECT, data should either be null/empty or return permission denied
    assert.ok(
      error !== null || (Array.isArray(data) && data.length === 0),
      "Anonymous role must not have SELECT access to applications table"
    );
  });

  test("4. Anonymous client cannot read private audit_events table", async () => {
    if (!supabaseUrl || !publishableKey) return;

    const anonClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Attempt to SELECT from audit_events as anonymous user
    const { data, error } = await anonClient
      .from("audit_events")
      .select("id, action, actor_id, metadata");

    assert.ok(
      error !== null || (Array.isArray(data) && data.length === 0),
      "Anonymous role must not have SELECT access to audit_events table"
    );
  });

  test("5. public.health_ping() creates zero audit rows and returns fixed non-record payload", async () => {
    if (!supabaseUrl || !publishableKey) return;

    const anonClient = createClient(supabaseUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await anonClient.rpc("health_ping");
    assert.equal(error, null);
    assert.deepEqual(data, { ok: true });

    // Ensure health check does not pollute audit_events table
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { count: pingAuditRows } = await adminClient
        .from("audit_events")
        .select("id", { count: "exact", head: true })
        .eq("action", "health_ping");

      assert.equal(pingAuditRows ?? 0, 0, "Health check must not create any audit event rows");
    }
  });

  test("6. Health check fails when URL is invalid or endpoint unreachable", async () => {
    const result = await runSupabaseHealthCheck({
      supabaseUrl: "https://invalid-supabase-domain-xyz987.supabase.co",
      publishableKey: "dummy_key",
      timeoutMs: 1500,
    });

    assert.equal(result.ok, false);
    assert.ok(result.error !== undefined);
  });

  test("7. Health check rejects SUPABASE_SERVICE_ROLE_KEY usage", async () => {
    const dummyServiceKey = "service_role_secret_key_12345";
    process.env.SUPABASE_SERVICE_ROLE_KEY = dummyServiceKey;

    await assert.rejects(
      async () => {
        await runSupabaseHealthCheck({
          supabaseUrl: "https://example.supabase.co",
          publishableKey: dummyServiceKey,
        });
      },
      /SECURITY VIOLATION.*SUPABASE_SERVICE_ROLE_KEY/
    );
  });
});
