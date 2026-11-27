import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPublicSiteContent, SiteContentUnavailableError } from "../lib/site-content/public.ts";
import { activeAnnouncements, formatEventDate, publicEventTimeline } from "../src/components/site/content-utils.ts";
import type { ContentEntry } from "../lib/site-content/types.ts";

const environmentKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;
const originalEnvironment = new Map(environmentKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

function clearSupabaseEnvironment(): void {
  for (const key of environmentKeys) delete process.env[key];
}

describe("public content configuration behavior", () => {
  it("returns published non-person seed only when database configuration is absent", async () => {
    clearSupabaseEnvironment();
    const content = await getPublicSiteContent();
    assert.deepEqual(content.members, []);
    assert.ok(content.tracks.length > 0);
    assert.ok(content.sponsors.length > 0);
  });

  it("does not resurrect seed when configuration exists but the database read fails", async () => {
    clearSupabaseEnvironment();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://site-content-test.invalid";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
    globalThis.fetch = async () => { throw new Error("simulated local fetch failure"); };
    await assert.rejects(getPublicSiteContent(), SiteContentUnavailableError);
  });
});

describe("public event and notice display", () => {
  it("keeps a date-only event upcoming through the whole Cairo calendar day", () => {
    const entry: ContentEntry = {
      id: "event-same-day", kind: "event", slug: "same-day", status: "published",
      sort_order: 1, featured: false, publish_at: null, unpublish_at: null, revision: 1,
      data: { title: "A same-day workshop", date: "2026-11-18" },
    };
    const { upcoming, archive } = publicEventTimeline([entry], Date.parse("2026-11-18T21:00:00Z"));
    assert.equal(upcoming.length, 1);
    assert.equal(archive.length, 0);
    assert.equal(formatEventDate("2026-11-18"), "18 November 2026");
  });

  it("keeps a published no-link notice visible", () => {
    const entry: ContentEntry = {
      id: "notice", kind: "announcement", slug: "notice", status: "published",
      sort_order: 1, featured: false, publish_at: null, unpublish_at: null, revision: 1,
      data: { title: "A campus update", summary: "Room change" },
    };
    assert.deepEqual(activeAnnouncements([entry]).map((item) => item.slug), ["notice"]);
  });
});

process.on("exit", () => {
  for (const key of environmentKeys) {
    const original = originalEnvironment.get(key);
    if (original === undefined) delete process.env[key];
    else process.env[key] = original;
  }
  globalThis.fetch = originalFetch;
});
