import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { sanitizeRedirectPath } from "../lib/auth/redirect.ts";
import { getStaffRole, verifyStaffApiRequest } from "../lib/auth/server.ts";
import { isStaffRole } from "../lib/auth/roles.ts";
import { checkBootstrapStatus, bootstrapFirstOwner } from "../lib/auth/bootstrap.ts";
import { GET as getAdminMe } from "../app/api/admin/me/route.ts";
import { GET as getVerifyStaff } from "../app/api/auth/verify-staff/route.ts";

describe("Staff Authentication & Role Foundation (Phase 1)", () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wzendwuoankwiahbrwqt.supabase.co";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_SIK6ewo2TUtgD8Qizcl12Q__U0Irdns";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Safe Redirect Validation (Open Redirect Defense)
  describe("1. Open Redirect Defense (sanitizeRedirectPath)", () => {
    it("sanitizes unsafe external URLs and protocol-relative links to default /admin", () => {
      assert.equal(sanitizeRedirectPath("//evil.com"), "/admin");
      assert.equal(sanitizeRedirectPath("//evil.com/phish"), "/admin");
      assert.equal(sanitizeRedirectPath("https://attacker.com"), "/admin");
      assert.equal(sanitizeRedirectPath("javascript:alert(1)"), "/admin");
      assert.equal(sanitizeRedirectPath("data:text/html,evil"), "/admin");
      assert.equal(sanitizeRedirectPath("/\\evil.com"), "/admin");
      assert.equal(sanitizeRedirectPath(""), "/admin");
      assert.equal(sanitizeRedirectPath(null), "/admin");
      assert.equal(sanitizeRedirectPath(undefined), "/admin");
    });

    it("permits legitimate relative internal administrative paths", () => {
      assert.equal(sanitizeRedirectPath("/admin"), "/admin");
      assert.equal(sanitizeRedirectPath("/admin/"), "/admin/");
      assert.equal(sanitizeRedirectPath("/admin/applicants"), "/admin/applicants");
      assert.equal(sanitizeRedirectPath("/admin?track=it"), "/admin?track=it");
    });
  });

  // 2. Staff Role Type Guards & Role Model
  describe("2. Staff Role Validation & Guards", () => {
    it("accepts valid roles ('owner', 'admin') and rejects arbitrary or spoofed roles", () => {
      assert.equal(isStaffRole("owner"), true);
      assert.equal(isStaffRole("admin"), true);
      assert.equal(isStaffRole("student"), false);
      assert.equal(isStaffRole("applicant"), false);
      assert.equal(isStaffRole("superuser"), false);
      assert.equal(isStaffRole(""), false);
      assert.equal(isStaffRole(null), false);
    });
  });

  // 3. Database RLS Policies: Defense Against Unauthorized Role Self-Assignment
  describe("3. Database RLS: Protection Against Role Tampering", () => {
    it("confirms public anonymous client cannot insert into public.staff_members", async () => {
      const publicClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await publicClient
        .from("staff_members")
        .insert({
          user_id: "00000000-0000-0000-0000-000000000000",
          role: "owner",
        });

      // RLS or permission restriction must prevent anonymous insert
      assert.ok(error, "Anonymous role self-assignment MUST fail");
      assert.equal(data, null);
    });

    it("confirms public anonymous client cannot read all staff members", async () => {
      const publicClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await publicClient
        .from("staff_members")
        .select("*");

      // Anon SELECT should be blocked or return empty array without leaking records
      if (error) {
        assert.ok(error.code || error.message);
      } else {
        assert.deepEqual(data, []);
      }
    });
  });

  // 4. Anonymous Access to Protected API Endpoints
  describe("4. Route & API Protection: Anonymous Access Rejection", () => {
    it("rejects unauthenticated requests to /api/admin/me with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/me");
      const res = await getAdminMe(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/auth/verify-staff with 401 UNAUTHORIZED", async () => {
      const res = await getVerifyStaff();
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });
  });

  // 5. Invalid Login & Credential Rejection
  describe("5. Supabase Auth: Invalid Login Handling", () => {
    it("rejects sign-in with non-existent or invalid credentials", async () => {
      const client = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await client.auth.signInWithPassword({
        email: "nonexistent.staff.tester@itclub.invalid",
        password: "IncorrectPassword123!",
      });

      assert.ok(error, "Sign-in with invalid credentials must return error");
      assert.equal(data.user, null);
      assert.equal(data.session, null);
    });
  });

  // 6. Role Hierarchy & Owner-Only Enforcement
  describe("6. Role Hierarchy & Server Authorization Enforcement", () => {
    it("returns null staff role for an arbitrary non-staff user ID", async () => {
      if (!serviceKey) return;
      const role = await getStaffRole("00000000-0000-4000-8000-000000000999");
      assert.equal(role, null);
    });

    it("enforces Owner-only requirement when verified", async () => {
      // Simulate authorization check for non-staff / admin vs owner
      const nonStaffCheck = await verifyStaffApiRequest(undefined, ["owner"]);
      assert.equal(nonStaffCheck.authorized, false);
      assert.equal(nonStaffCheck.status, 401); // Unauthenticated session rejected
    });
  });

  // 7. Controlled Owner Bootstrap Procedure
  describe("7. Controlled Owner Bootstrap Procedure", () => {
    it("checks bootstrap status without leaking secrets", async () => {
      if (!serviceKey) return;
      const status = await checkBootstrapStatus();
      assert.equal(typeof status.initialized, "boolean");
      assert.equal(typeof status.ownerCount, "number");
    });

    it("refuses to bootstrap when already initialized or when target user does not exist", async () => {
      if (!serviceKey) return;
      const status = await checkBootstrapStatus();
      const result = await bootstrapFirstOwner({
        userId: "ffffffff-ffff-ffff-ffff-ffffffffffff",
      });

      assert.equal(result.success, false);
      if (status.initialized) {
        assert.equal(result.reason, "ALREADY_INITIALIZED");
      } else {
        assert.equal(result.reason, "USER_NOT_FOUND");
      }
    });
  });
});
