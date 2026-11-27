import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getCommittedPublicSeed, getOwnerSeed, isVisibleAt, SITE_CONTENT_SEED } from "../lib/site-content/seed.ts";
import { isSafeContentUrl, isValidSlug, validateContentData, validatePublicationWindow, validatePublishReadiness } from "../lib/site-content/validation.ts";
import { prepareSeedForImport } from "../lib/site-content/repository.ts";

describe("site-content validation", () => {
  it("accepts contract-shaped data and rejects malformed or unsafe fields", () => {
    assert.deepEqual(validateContentData("page", { title: "About", body: "Club information" }), []);
    assert.equal(isValidSlug("research-and-development"), true);
    assert.equal(isValidSlug("../admin"), false);
    assert.equal(isSafeContentUrl("/images/team.webp", "image"), true);
    assert.equal(isSafeContentUrl("//evil.example/image.png", "image"), false);
    assert.equal(isSafeContentUrl("javascript:alert(1)"), false);
    assert.ok(validateContentData("page", { title: "Unsafe", href: "data:text/html,bad" }).length > 0);
    assert.ok(validateContentData("page", { title: "Bad", mystery: "not in contract" }).length > 0);
  });

  it("requires actual individual responsibilities and does not count committee mission as personalized work", () => {
    const memberWithoutIndividualDuties = {
      title: "Alex Example",
      role: "Member",
      committee: "Information Technology",
      summary: "Committee mission: building software and systems.",
      responsibilities: ["Committee mission (shared by the Information Technology team; not a claimed individual task): building software and systems."],
    };
    assert.ok(validatePublishReadiness("member", memberWithoutIndividualDuties).some((issue) => issue.includes("actual individual responsibility")));
    assert.deepEqual(validatePublishReadiness("member", { ...memberWithoutIndividualDuties, responsibilities: ["Maintains the club's registration website"] }), []);
    assert.ok(validatePublishReadiness("event", { title: "Annual event", summary: "Event", location: "BATU", date: "Fall 2026" }).some((issue) => issue.includes("ISO date")));
    assert.deepEqual(validatePublishReadiness("sponsor", { title: "Partner", category: "Venue", image: "/sponsors/logo.svg" }), []);
  });

  it("accepts only explicitly zoned publication timestamps and ordered windows", () => {
    assert.deepEqual(validatePublicationWindow("2027-01-01T00:00:00Z", "2027-02-01T00:00:00+02:00"), []);
    assert.ok(validatePublicationWindow("2027-01-01", null).length > 0);
    assert.ok(validatePublicationWindow("2027-02-01T00:00:00Z", "2027-01-01T00:00:00Z").length > 0);
  });
});

describe("site-content seed and publication visibility", () => {
  it("keeps seeded people private while serving published tracks and documented sponsors in Preview", () => {
    const publicSeed = getCommittedPublicSeed(Date.parse("2026-11-18T00:00:00Z"));
    assert.deepEqual(publicSeed.members, []);
    assert.equal(publicSeed.events.length, 0);
    assert.ok(publicSeed.tracks.length >= 6);
    assert.deepEqual(publicSeed.sponsors.map((sponsor) => sponsor.slug).sort(), ["icealex", "wrkr"]);
    assert.ok(SITE_CONTENT_SEED.filter((entry) => entry.kind === "member").every((entry) => entry.status === "draft"));
  });

  it("keeps Omar's record as a draft and all source events as drafts for owner review", () => {
    const seed = getOwnerSeed();
    const omar = seed.find((entry) => entry.slug === "omar-mehawed");
    assert.equal(omar?.status, "draft");
    assert.equal(omar?.data.role, "Head");
    assert.ok(seed.filter((entry) => entry.kind === "event").every((event) => event.status === "draft"));
    const importedMembers = seed.filter((entry) => entry.kind === "member");
    assert.ok(importedMembers.length > 0);
    assert.ok(importedMembers.every((entry) => entry.status === "draft"));
    assert.ok(importedMembers.every((entry) => entry.data.responsibilities === undefined));
    assert.ok(SITE_CONTENT_SEED.some((entry) => entry.kind === "member" && entry.status === "draft"));
  });

  it("downgrades any imported published seed record that fails normal publishing readiness", () => {
    const source = SITE_CONTENT_SEED.find((entry) => entry.kind === "member")!;
    const unsafe = { ...source, status: "published" as const, data: { ...source.data, responsibilities: undefined } };
    const prepared = prepareSeedForImport([unsafe]);
    assert.equal(prepared[0].status, "draft");
    assert.equal(prepareSeedForImport([{ ...unsafe, data: { ...unsafe.data, responsibilities: ["Maintains the club website"] } }])[0].status, "published");
  });

  it("enforces inclusive publish_at and exclusive unpublish_at visibility boundaries", () => {
    const value = { ...SITE_CONTENT_SEED.find((entry) => entry.kind === "sponsor")!, publish_at: "2026-11-01T00:00:00Z", unpublish_at: "2026-12-01T00:00:00Z" };
    assert.equal(isVisibleAt(value, Date.parse("2026-11-01T00:00:00Z")), true);
    assert.equal(isVisibleAt(value, Date.parse("2026-12-01T00:00:00Z")), false);
    assert.equal(isVisibleAt({ ...value, status: "archived" }, Date.parse("2026-11-15T00:00:00Z")), false);
  });
});
