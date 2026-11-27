import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPublicSiteContent, SiteContentUnavailableError } from "../lib/site-content/public.ts";
import { activeAnnouncements, formatEventDate, publicEventTimeline } from "../src/components/site/content-utils.ts";
import { communityBoards, communityMembers } from "../src/components/site/community-content.ts";
import type { ContentEntry } from "../lib/site-content/types.ts";

const environmentKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

function communityFixture(
  kind: "member" | "board",
  slug: string,
  data: Partial<ContentEntry["data"]> = {},
  overrides: Partial<ContentEntry> = {},
): ContentEntry {
  return {
    id: `${kind}-${slug}`,
    kind,
    slug,
    status: "published",
    sort_order: 1,
    featured: false,
    publish_at: null,
    unpublish_at: null,
    revision: 1,
    data: {
      title: `Fixture ${slug}`,
      role: "Team member",
      committee: "IT",
      summary: "Builds software",
      ...data,
    },
    ...overrides,
  };
}

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

describe("Community R&D content presentation", () => {
  const researchAndDevelopmentAliases = [
    "R&D",
    "r-and-d",
    "rnd",
    "r-d",
    "Research & Development",
    "Research and Development",
    "research-development",
    "البحث والتطوير",
    "R&D Committee",
    "Research and Development Team",
    "IT Club / R&D Board",
    "research-and-development-team",
    "لجنة البحث والتطوير",
  ];

  it("excludes R&D aliases from board slugs, titles, committee identifiers, and member committees", () => {
    const boards = researchAndDevelopmentAliases.flatMap((identifier, index) => [
      communityFixture("board", `board-slug-${index}`, { title: `Board ${index}` }, { slug: identifier }),
      communityFixture("board", `board-title-${index}`, { title: identifier }),
      communityFixture("board", `board-committee-${index}`, { committee: identifier }),
    ]);
    boards.push(
      communityFixture("board", "arabic-title", {
        title: "Arabic title fixture",
        arabicTitle: "البحث والتطوير",
      }),
    );
    const members = researchAndDevelopmentAliases.map((identifier, index) =>
      communityFixture("member", `member-${index}`, { committee: identifier }),
    );

    assert.deepEqual(communityBoards(boards), []);
    assert.deepEqual(communityMembers(members), []);
  });

  it("applies published, draft, future, and expired visibility before the Community exclusion", () => {
    const boards = [
      communityFixture("board", "published-rnd", { committee: "rnd" }),
      communityFixture("board", "draft-rnd", { committee: "rnd" }, { status: "draft" }),
      communityFixture("board", "future-rnd", { committee: "rnd" }, { publish_at: "2999-01-01T00:00:00Z" }),
      communityFixture("board", "expired-rnd", { committee: "rnd" }, { unpublish_at: "2000-01-01T00:00:00Z" }),
      communityFixture("board", "visible-it-board", { title: "IT Board", committee: "IT" }),
    ];
    const members = [
      communityFixture("member", "published-rnd-member", { committee: "research-development" }),
      communityFixture("member", "draft-rnd-member", { committee: "rnd" }, { status: "draft" }),
      communityFixture("member", "future-rnd-member", { committee: "rnd" }, { publish_at: "2999-01-01T00:00:00Z" }),
      communityFixture("member", "expired-rnd-member", { committee: "rnd" }, { unpublish_at: "2000-01-01T00:00:00Z" }),
      communityFixture("member", "visible-it-member", { committee: "IT" }),
    ];

    assert.deepEqual(communityBoards(boards).map((entry) => entry.slug), ["visible-it-board"]);
    assert.deepEqual(communityMembers(members).map((entry) => entry.slug), ["visible-it-member"]);
  });

  it("keeps leadership and IT members when development appears in role or summary", () => {
    const boards = [
      communityFixture("board", "leadership-board", { title: "Club Leadership", committee: "Executive" }),
      communityFixture("board", "it-board", { title: "IT Board", committee: "IT" }),
      communityFixture("board", "software-development", { title: "Software Development", committee: "IT" }),
      communityFixture("board", "public-relations", { title: "Public Relations", committee: "PR" }),
    ];
    const members = [
      communityFixture("member", "club-president", {
        title: "Club President",
        role: "President",
        committee: "Executive",
        summary: "Leads the club team",
      }),
      communityFixture("member", "it-development-lead", {
        title: "IT Development Lead",
        role: "Research and Development Lead",
        committee: "IT",
        summary: "Leads software development",
      }),
    ];

    assert.deepEqual(communityBoards(boards).map((entry) => entry.slug), ["leadership-board", "it-board", "software-development", "public-relations"]);
    assert.deepEqual(communityMembers(members).map((entry) => entry.slug), ["club-president", "it-development-lead"]);
  });

  it("does not mutate fixture entries and returns empty arrays for empty input", () => {
    const entries = [
      communityFixture("member", "it-member-later", { committee: "IT" }, { sort_order: 2 }),
      communityFixture("board", "research-and-development", { title: "R&D Board" }),
      communityFixture("member", "rnd-member", { committee: "rnd" }),
      communityFixture("board", "it-board", { title: "IT Board", committee: "IT" }, { sort_order: 2 }),
    ];
    const originalEntries = JSON.parse(JSON.stringify(entries)) as ContentEntry[];

    communityMembers(entries);
    communityBoards(entries);

    assert.deepEqual(entries, originalEntries);
    assert.deepEqual(communityMembers([]), []);
    assert.deepEqual(communityBoards([]), []);
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

// Home presentation tests use fixtures only; they never publish or mutate CMS records.
import { editorialEvents } from "../src/components/site/editorial-events.ts";

function eventFixture(slug: string, data: ContentEntry["data"], overrides: Partial<ContentEntry> = {}): ContentEntry {
  return {
    id: slug, slug, kind: "event", status: "published", sort_order: 1, featured: false,
    publish_at: null, unpublish_at: null, revision: 1, data, ...overrides,
  };
}

const eventNow = Date.parse("2026-11-27T12:00:00Z");

describe("Home featured-event presentation data", () => {
  it("selects the nearest published upcoming date, never drafts or other content kinds", () => {
    const result = editorialEvents([
      eventFixture("later", { title: "Later", date: "2027-01-10" }, { featured: true }),
      eventFixture("nearest", { title: "Nearest", date: "2026-11-28" }),
      eventFixture("draft", { title: "Draft", date: "2026-11-27" }, { status: "draft" }),
      eventFixture("archived", { title: "Archived", date: "2026-11-27" }, { status: "archived" }),
      eventFixture("track", { title: "Track", date: "2026-11-27" }, { kind: "track" }),
      eventFixture("past", { title: "Past", date: "2026-11-20" }),
      eventFixture("undated", { title: "Undated" }),
    ], eventNow);
    assert.equal(result.eventMode, "upcoming");
    assert.deepEqual(result.events.map((event) => event.slug), ["nearest", "later"]);
  });

  it("keeps same-day dates upcoming and calendar badges consistent with Cairo timestamps", () => {
    const { events } = editorialEvents([
      eventFixture("same-day", { title: "Same day", date: "2026-11-27" }),
      eventFixture("cairo", { title: "Cairo", date: "2026-11-27T23:30:00Z" }),
    ], eventNow);
    assert.equal(events[0].date, "27 November 2026");
    assert.equal(events[0].dateTime, "2026-11-27");
    assert.equal(events[0].day, "27");
    assert.equal(events[1].date, "28 November 2026");
    assert.equal(events[1].day, "28");
    assert.equal(events[1].month, "Nov");
    assert.equal(events[1].year, "2026");
  });

  it("preserves approved optional details and filters unsafe image and event URLs", () => {
    const { events } = editorialEvents([
      eventFixture("approved", { title: "Approved", date: "2026-11-28", time: " 14:00 ", location: " BATU ", category: " Workshop ", summary: " A summary ", image: "https://example.invalid/event.webp", href: "https://example.invalid/event" }),
      eventFixture("unsafe", { title: "Unsafe", date: "2026-11-29", image: "javascript:alert(1)", href: "//example.invalid" }),
      eventFixture("local", { title: "Local", date: "2026-11-30", image: "/events/approved.webp", href: "/events/local" }),
    ], eventNow);
    assert.equal(events[0].image, "https://example.invalid/event.webp");
    assert.equal(events[0].href, "https://example.invalid/event");
    assert.equal(events[0].time, "14:00");
    assert.equal(events[0].location, "BATU");
    assert.equal(events[0].category, "Workshop");
    assert.equal(events[0].summary, "A summary");
    assert.equal(events[1].image, undefined);
    assert.equal(events[1].href, undefined);
    assert.equal(events[2].image, "/events/approved.webp");
    assert.equal(events[2].href, "/events/local");
  });

  it("uses newest-first archive mode rather than calling past events upcoming", () => {
    const result = editorialEvents([
      eventFixture("older", { title: "Older", date: "2026-10-01" }),
      eventFixture("recent", { title: "Recent", date: "2026-11-20" }),
      eventFixture("undated", { title: "Undated" }),
    ], eventNow);
    assert.equal(result.eventMode, "archive");
    assert.deepEqual(result.events.map((event) => event.slug), ["recent", "older"]);
  });

  it("does not invent a date, image, venue, category, or external link for undated events", () => {
    const result = editorialEvents([
      eventFixture("no-date", { title: "No date" }),
      eventFixture("unusable-date", { title: "Unusable date", date: "To be confirmed" }),
      eventFixture("impossible-date", { title: "Impossible date", date: "2027-02-30" }),
      eventFixture("invalid-time", { title: "Invalid timestamp", date: "2027-02-01Tinvalid" }),
    ], eventNow);
    assert.equal(result.eventMode, "undated");
    for (const event of result.events) {
      assert.equal(event.date, "Date not listed");
      for (const field of ["dateTime", "day", "month", "year", "image", "time", "location", "category", "href"] as const) {
        assert.equal(event[field], undefined);
      }
    }
  });

  it("keeps the empty state honest and limits the Home excerpt to four real links", () => {
    assert.deepEqual(editorialEvents([], eventNow), { events: [], eventMode: "undated" });
    const invalid = [
      eventFixture("not/a/slug", { title: "Invalid", date: "2026-11-28" }),
      eventFixture("empty-title", { title: "   ", date: "2026-11-28" }),
      eventFixture("not-yet-published", { title: "Future publication", date: "2026-11-28" }, { publish_at: "2999-01-01T00:00:00Z" }),
      eventFixture("expired", { title: "Expired", date: "2026-11-28" }, { unpublish_at: "2000-01-01T00:00:00Z" }),
    ];
    assert.deepEqual(editorialEvents(invalid, eventNow).events, []);
    const entries = Array.from({ length: 6 }, (_, index) => eventFixture(`event-${index}`, { title: `Event ${index}`, date: `2026-12-0${index + 1}` }));
    assert.equal(editorialEvents(entries, eventNow).events.length, 4);
  });
});
