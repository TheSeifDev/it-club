import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isApplicationStatus,
  isValidStatusTransition,
  maskNationalId,
} from "../lib/admin/transitions.ts";
import {
  getDashboardMetrics,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
} from "../lib/admin/queries.ts";
import { getServiceRoleClient } from "../lib/auth/service-role.ts";
import { GET as getMetricsRoute } from "../app/api/admin/metrics/route.ts";
import { GET as getApplicationsRoute } from "../app/api/admin/applications/route.ts";
import {
  GET as getApplicantDetailRoute,
  PATCH as patchApplicantDetailRoute,
} from "../app/api/admin/applications/[id]/route.ts";

describe("Admin Dashboard & Application Management (Phase 2)", () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Unauthenticated Access Rejection
  describe("1. Unauthenticated Route & API Rejection", () => {
    it("rejects unauthenticated requests to /api/admin/metrics with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/metrics");
      const res = await getMetricsRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/admin/applications with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications");
      const res = await getApplicationsRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated requests to /api/admin/applications/[id] with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications/test-id");
      const res = await getApplicantDetailRoute(req, {
        params: Promise.resolve({ id: "test-id" }),
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated PATCH decisions with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications/test-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus: "UNDER_REVIEW" }),
      });
      const res = await patchApplicantDetailRoute(req, {
        params: Promise.resolve({ id: "test-id" }),
      });
      assert.equal(res.status, 401);
    });
  });

  // 2. Status Transition Rules & Validation
  describe("2. Status Transitions & State Machine Integrity", () => {
    it("permits valid workflow transitions", () => {
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "UNDER_REVIEW"), true);
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "SHORTLISTED"), true);
      assert.equal(isValidStatusTransition("UNDER_REVIEW", "ACCEPTED"), true);
      assert.equal(isValidStatusTransition("UNDER_REVIEW", "REJECTED"), true);
      assert.equal(isValidStatusTransition("SHORTLISTED", "INTERVIEW_SCHEDULED"), true);
    });

    it("rejects identical status transition (no-op)", () => {
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "PENDING_REVIEW"), false);
      assert.equal(isValidStatusTransition("UNDER_REVIEW", "UNDER_REVIEW"), false);
    });

    it("rejects invalid or arbitrary status jumps", () => {
      assert.equal(isValidStatusTransition("PENDING_REVIEW", "INTERVIEWED"), false);
      assert.equal(isValidStatusTransition("NEEDS_CORRECTION", "ACCEPTED"), false);
    });

    it("validates application status type guards", () => {
      assert.equal(isApplicationStatus("PENDING_REVIEW"), true);
      assert.equal(isApplicationStatus("ACCEPTED"), true);
      assert.equal(isApplicationStatus("INVALID_STATUS"), false);
      assert.equal(isApplicationStatus(""), false);
      assert.equal(isApplicationStatus(null), false);
    });
  });

  // 3. National ID Privacy Masking
  describe("3. Sensitive Data Masking (maskNationalId)", () => {
    it("masks the last 6 serial digits of a 14-digit Egyptian National ID", () => {
      const rawNid = "30408250101234";
      const masked = maskNationalId(rawNid);
      assert.equal(masked, "30408250******");
      assert.equal(masked.length, 14);
      assert.notEqual(masked, rawNid);
    });

    it("returns placeholder for short or missing identifiers", () => {
      assert.equal(maskNationalId(""), "**************");
      assert.equal(maskNationalId("123"), "**************");
    });
  });

  // 4. Live Database Aggregates & Metrics
  describe("4. Database Metrics (getDashboardMetrics)", () => {
    it("queries real database aggregates and returns valid structured metrics", async () => {
      if (!serviceKey) return;

      const metrics = await getDashboardMetrics();
      assert.equal(typeof metrics.total, "number");
      assert.ok(metrics.total >= 0);
      assert.ok(metrics.byStatus);
      assert.equal(typeof metrics.byStatus.PENDING_REVIEW, "number");
      assert.equal(typeof metrics.byStatus.ACCEPTED, "number");
      assert.ok(metrics.byTrack);
      assert.equal(typeof metrics.byTrack.it, "number");
      assert.equal(typeof metrics.byTrack.rnd, "number");
    });
  });

  // 5. Listing, Filtering, and Pagination
  describe("5. Application Listing & Search (listApplications)", () => {
    it("lists applications with pagination and masks National IDs", async () => {
      if (!serviceKey) return;

      const result = await listApplications({
        page: 1,
        pageSize: 5,
        sortBy: "created_at",
        sortOrder: "desc",
      });

      assert.equal(typeof result.totalCount, "number");
      assert.equal(result.page, 1);
      assert.equal(result.pageSize, 5);
      assert.ok(Array.isArray(result.applications));

      if (result.applications.length > 0) {
        const item = result.applications[0];
        assert.ok(item.application_reference);
        assert.ok(item.full_name);
        assert.ok(item.national_id_masked);
        assert.match(item.national_id_masked, /\*+/);
        // Sensitive raw national_id must NOT be exposed in list item
        assert.equal((item as unknown as Record<string, unknown>).national_id, undefined);
      }
    });

    it("filters applications by status", async () => {
      if (!serviceKey) return;

      const result = await listApplications({
        status: "PENDING_REVIEW",
        page: 1,
        pageSize: 10,
      });

      for (const app of result.applications) {
        assert.equal(app.status, "PENDING_REVIEW");
      }
    });

    it("searches applications by reference code or academic ID", async () => {
      if (!serviceKey) return;

      const result = await listApplications({
        search: "ITC",
        page: 1,
        pageSize: 5,
      });

      assert.ok(Array.isArray(result.applications));
    });
  });

  // 6. Applicant Detail Retrieval
  describe("6. Applicant Detail Query (getApplicationById)", () => {
    it("retrieves existing application record by reference code", async () => {
      if (!serviceKey) return;

      const serviceClient = getServiceRoleClient();
      const { data: firstApp } = await serviceClient
        .from("applications")
        .select("application_reference")
        .limit(1)
        .maybeSingle();

      const ref = firstApp?.application_reference || "ITC-60037746";
      const app = await getApplicationById(ref);
      assert.ok(app, `Existing application ${ref} must be retrievable`);
      assert.equal(app.application_reference, ref);
      assert.ok(app.status);
      assert.ok(app.full_name);
      assert.ok(app.national_id);
      assert.ok(app.national_id_masked);
    });

    it("returns null for non-existent application identifier", async () => {
      if (!serviceKey) return;

      const app = await getApplicationById("00000000-0000-0000-0000-000000000000");
      assert.equal(app, null);
    });
  });

  // 7. Review Actions, Status Transitions & Concurrency
  describe("7. Review Status Transitions & Concurrency Defense", () => {
    it("rejects invalid status strings with INVALID_STATUS code", async () => {
      const result = await updateApplicationStatus({
        id: "test-id",
        nextStatus: "FAKE_UNSUPPORTED_STATUS",
        reviewerUserId: "test-reviewer",
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "INVALID_STATUS");
    });

    it("detects and rejects conflicting concurrent updates", async () => {
      if (!serviceKey) return;

      const app = await getApplicationById("ITC-5035B6CD");
      if (!app) return;

      // Simulate a concurrent collision: client expects status to be "ACCEPTED",
      // but live status in database is actually different
      const result = await updateApplicationStatus({
        id: app.id,
        nextStatus: "UNDER_REVIEW",
        reviewerUserId: "test-reviewer",
        expectedCurrentStatus: "REJECTED", // Incorrect expectation!
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "CONFLICT");
    });

    it("rejects illegal state transition", async () => {
      if (!serviceKey) return;

      const app = await getApplicationById("ITC-5035B6CD");
      if (!app) return;

      // Transitioning directly to PENDING_REVIEW from an advanced status is illegal
      const result = await updateApplicationStatus({
        id: app.id,
        nextStatus: "PENDING_REVIEW",
        reviewerUserId: "test-reviewer",
        expectedCurrentStatus: app.status,
      });

      assert.equal(result.success, false);
      assert.equal(result.code, "INVALID_TRANSITION");
    });
  });
});
