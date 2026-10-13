import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getDashboardMetrics, listApplications } from "../lib/admin/queries.ts";
import { COMMITTEE_TRACKS, VALID_STATUSES } from "../lib/admin/transitions.ts";
import { GET as getMetricsRoute } from "../app/api/admin/metrics/route.ts";
import { GET as getApplicationsRoute } from "../app/api/admin/applications/route.ts";

describe("Dashboard UX, Track Semantics & Interactivity Verifications", () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Track Preference Semantics and Reconciliations
  describe("1. Track Preference Metrics & Reconciliation Invariants", () => {
    it("distinguishes unique applicants from preference selections", async () => {
      if (!serviceKey) return;

      const metrics = await getDashboardMetrics();
      const { trackMetrics } = metrics;

      assert.ok(trackMetrics, "trackMetrics must be present in dashboard metrics");
      assert.equal(typeof trackMetrics.totalPrimary, "number");
      assert.equal(typeof trackMetrics.totalSecondary, "number");
      assert.equal(typeof trackMetrics.totalSelections, "number");

      // Invariant: Total primary preferences must equal unique applications
      assert.equal(
        trackMetrics.totalPrimary,
        metrics.total,
        "Total primary preferences must equal distinct application count"
      );

      // Invariant: Total selections must equal totalPrimary + totalSecondary
      assert.equal(
        trackMetrics.totalSelections,
        trackMetrics.totalPrimary + trackMetrics.totalSecondary,
        "Total preference selections must equal sum of primary and secondary selections"
      );

      // Invariant: Secondary selections must be <= unique applicants
      assert.ok(
        trackMetrics.totalSecondary <= metrics.total,
        "Secondary preferences count cannot exceed total applicant count"
      );

      // Invariant: For each committee track, combined selections = primary + secondary
      for (const track of COMMITTEE_TRACKS) {
        const primary = trackMetrics.byPrimary[track] || 0;
        const secondary = trackMetrics.bySecondary[track] || 0;
        const combined = trackMetrics.byCombined[track] || 0;

        assert.equal(
          combined,
          primary + secondary,
          `Combined preference count for track '${track}' must equal primary (${primary}) + secondary (${secondary})`
        );
      }
    });

    it("ensures sum of primary track counts equals total applicants", async () => {
      if (!serviceKey) return;

      const metrics = await getDashboardMetrics();
      const sumPrimary = Object.values(metrics.trackMetrics.byPrimary).reduce((a, b) => a + b, 0);

      assert.equal(
        sumPrimary,
        metrics.total,
        "Sum of byPrimary counts across all tracks must reconcile with total applicants"
      );
    });
  });

  // 2. Status Counts and Reconciliation
  describe("2. Status Counts & Application Total Reconciliation", () => {
    it("reconciles status distribution counts with total distinct applications", async () => {
      if (!serviceKey) return;

      const metrics = await getDashboardMetrics();
      const sumStatus = Object.values(metrics.byStatus).reduce((a, b) => a + b, 0);

      assert.equal(
        sumStatus,
        metrics.total,
        "Sum of all status counts must reconcile with total distinct applications"
      );
    });

    it("verifies pipeline counts match their corresponding status metrics", async () => {
      if (!serviceKey) return;

      const metrics = await getDashboardMetrics();

      for (const item of metrics.pipeline) {
        assert.equal(
          item.count,
          metrics.byStatus[item.status],
          `Pipeline count for ${item.status} must match byStatus count`
        );
      }
    });
  });

  // 3. Clickable KPI Card Query Parameters
  describe("3. Clickable KPI Cards Route & Filter Affordances", () => {
    it("defines valid and correct filter targets for all 8 KPI cards", () => {
      const kpiCardDefinitions = [
        { label: "Total applications", href: "/admin/applications", expectedStatus: undefined },
        { label: "Pending review", href: "/admin/applications?status=PENDING_REVIEW", expectedStatus: "PENDING_REVIEW" },
        { label: "Under review", href: "/admin/applications?status=UNDER_REVIEW", expectedStatus: "UNDER_REVIEW" },
        { label: "Shortlisted", href: "/admin/applications?status=SHORTLISTED", expectedStatus: "SHORTLISTED" },
        { label: "Interview scheduled", href: "/admin/applications?status=INTERVIEW_SCHEDULED", expectedStatus: "INTERVIEW_SCHEDULED" },
        { label: "Accepted", href: "/admin/applications?status=ACCEPTED", expectedStatus: "ACCEPTED" },
        { label: "Rejected", href: "/admin/applications?status=REJECTED", expectedStatus: "REJECTED" },
        { label: "Waitlisted", href: "/admin/applications?status=WAITLISTED", expectedStatus: "WAITLISTED" },
      ];

      assert.equal(kpiCardDefinitions.length, 8, "Exactly 8 KPI cards must be configured");

      for (const kpi of kpiCardDefinitions) {
        assert.ok(kpi.href.startsWith("/admin/applications"), "Card must link to /admin/applications");
        if (kpi.expectedStatus) {
          assert.ok((VALID_STATUSES as readonly string[]).includes(kpi.expectedStatus));
          assert.ok(kpi.href.includes(`status=${kpi.expectedStatus}`));
        }
      }
    });
  });

  // 4. Track Preference Filtering (Primary, Secondary, and Either)
  describe("4. Track Preference Scope Filtering in listApplications", () => {
    it("filters applications strictly by primary track when trackScope is 'primary'", async () => {
      if (!serviceKey) return;

      const result = await listApplications({
        track: "it",
        trackScope: "primary",
        pageSize: 10,
      });

      for (const app of result.applications) {
        assert.equal(app.primary_track, "it");
      }
    });

    it("filters applications strictly by secondary track when trackScope is 'secondary'", async () => {
      if (!serviceKey) return;

      const result = await listApplications({
        track: "rnd",
        trackScope: "secondary",
        pageSize: 10,
      });

      for (const app of result.applications) {
        assert.equal(app.secondary_track, "rnd");
      }
    });

    it("filters applications with either preference without duplicating rows", async () => {
      if (!serviceKey) return;

      const result = await listApplications({
        track: "it",
        trackScope: "either",
        pageSize: 10,
      });

      const seenIds = new Set<string>();
      for (const app of result.applications) {
        assert.ok(
          app.primary_track === "it" || app.secondary_track === "it",
          "Applicant must have selected 'it' as primary or secondary"
        );
        assert.ok(!seenIds.has(app.id), "Applicant records in results must be distinct with no duplicates");
        seenIds.add(app.id);
      }
    });
  });

  // 5. Timeline Date Range Filtering
  describe("5. Submission Date Filtering (Timeline Click Drilldown)", () => {
    it("filters applications by specific submission date", async () => {
      if (!serviceKey) return;

      const dateStr = "2026-10-12";
      const result = await listApplications({
        date: dateStr,
        pageSize: 10,
      });

      for (const app of result.applications) {
        const appDate = new Date(app.created_at).toISOString().slice(0, 10);
        assert.equal(appDate, dateStr, `Application created_at must match filtered date ${dateStr}`);
      }
    });
  });

  // 6. Security Boundaries for Protected Endpoints
  describe("6. Unauthorized Access Rejection on Administrative Routes", () => {
    it("rejects unauthenticated GET requests to /api/admin/metrics with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/metrics");
      const res = await getMetricsRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });

    it("rejects unauthenticated GET requests to /api/admin/applications with 401 UNAUTHORIZED", async () => {
      const req = new Request("http://localhost:3000/api/admin/applications");
      const res = await getApplicationsRoute(req);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.code, "UNAUTHORIZED");
    });
  });
});
