import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  teamMembers,
  getTeamMemberById,
  getLegitimateMembers,
  getGalleryMembers,
  getFeaturedHeroMembers,
  getVerifiedMembers,
  getPendingReviewMembers,
  getMembersByCommittee,
  getAlumniMembers,
  getMemberCutoutImage,
  validateTeamData,
} from "../src/components/interview/committee-data.ts";
import { IT_CLUB_TRACKS } from "../src/components/interview/Tracks/tracks-data.ts";

describe("IT Club — Committee Data, Member Photos & Alumni Synchronization", () => {
  describe("1. Canonical Member Assignments", () => {
    const expectedAssignments: Record<string, string> = {
      "ahmed-samir": "IT Club",
      "ahmed-mohsen": "IT Club",
      "mohamed-ibrahim": "Information Technology",
      "seif-ayman": "Information Technology",
      "ziad-ayman": "Information Technology",
      "mohamed-al-amir": "Social Media",
      "abdulrahman-ashraf": "Social Media",
      "youssef-soliman": "Social Media",
      "merna": "Social Media",
      "adham-ahmed": "Human Resources",
      "marwan-awad": "Human Resources",
      "omar-mehawed": "Public Relations",
      "farida-mohamed": "Organizing Committee",
      "mahmoud-sameh": "Organizing Committee",
      "shahd-ahssen": "Organizing Committee",
      "habiba-ahmed": "Organizing Committee",
      "mohamed-nagi": "Organizing Committee",
      "saif-kambo": "Organizing Committee",
    };

    it("verifies all explicitly assigned members belong to their confirmed committees", () => {
      for (const [memberId, expectedCommittee] of Object.entries(expectedAssignments)) {
        const member = teamMembers.find((m) => m.id === memberId);
        assert.ok(member, `Member record '${memberId}' must exist in teamMembers`);
        assert.equal(
          member.committee,
          expectedCommittee,
          `Member '${memberId}' expected to be in '${expectedCommittee}', found '${member.committee}'`
        );
        assert.equal(
          member.needsReview,
          false,
          `Confirmed member '${memberId}' must not have needsReview: true`
        );
      }
    });

    it("verifies default rule: all remaining members belong to Organizing Committee", () => {
      const explicitIds = new Set(Object.keys(expectedAssignments));
      const remainingMembers = teamMembers.filter(
        (m) => !explicitIds.has(m.id) && !m.isAlternate
      );

      for (const member of remainingMembers) {
        assert.equal(
          member.committee,
          "Organizing Committee",
          `Unassigned/remaining member '${member.id}' must default to Organizing Committee`
        );
      }
    });

    it("ensures no records remain in pending review state", () => {
      const pending = getPendingReviewMembers();
      assert.equal(
        pending.length,
        0,
        `All confirmed members should have needsReview cleared. Found ${pending.length} pending.`
      );
    });
  });

  describe("2. Marwan Profile & Image Resolution", () => {
    it("verifies canonical Marwan record uses /COMMITTEES/marwan.webp and Human Resources", () => {
      const marwan = teamMembers.find((m) => m.id === "marwan-awad");
      assert.ok(marwan, "Canonical 'marwan-awad' record must exist");
      assert.equal(marwan.committee, "Human Resources");
      assert.equal(marwan.image, "/COMMITTEES/marwan.webp");
      assert.equal(marwan.needsReview, false);
    });

    it("verifies duplicate alternate Marwan record has been removed from teamMembers", () => {
      const duplicate = teamMembers.find((m) => m.id === "marwan");
      assert.equal(
        duplicate,
        undefined,
        "Duplicate record with id 'marwan' must be removed from teamMembers"
      );
    });

    it("verifies compatibility: getTeamMemberById resolves 'marwan' and 'marwan-alt' to canonical record", () => {
      const byMarwan = getTeamMemberById("marwan");
      assert.ok(byMarwan, "getTeamMemberById('marwan') must resolve");
      assert.equal(byMarwan.id, "marwan-awad");

      const byMarwanAlt = getTeamMemberById("marwan-alt");
      assert.ok(byMarwanAlt, "getTeamMemberById('marwan-alt') must resolve");
      assert.equal(byMarwanAlt.id, "marwan-awad");
    });

    it("verifies cutout map resolves for both 'marwan-awad' and 'marwan' alias", () => {
      const cutoutCanonical = getMemberCutoutImage("marwan-awad");
      const cutoutAlias = getMemberCutoutImage("marwan");
      assert.ok(cutoutCanonical, "Cutout for 'marwan-awad' must be defined");
      assert.equal(cutoutCanonical, cutoutAlias);
    });

    it("verifies the physical asset /COMMITTEES/marwan.webp exists on disk", () => {
      const assetPath = path.join(process.cwd(), "public", "COMMITTEES", "marwan.webp");
      assert.ok(fs.existsSync(assetPath), `Asset file must exist at ${assetPath}`);
      const stat = fs.statSync(assetPath);
      assert.ok(stat.size > 0, "Asset file must not be empty");
    });
  });

  describe("3. Alumni Marking & Roster Exclusion", () => {
    it("verifies Sherif Hamdy and Mohamed Sherif are marked as alumni and retained in teamMembers", () => {
      const sherif = teamMembers.find((m) => m.id === "sherif-hamdy");
      const mohamedSherif = teamMembers.find((m) => m.id === "mohamed-sherif");

      assert.ok(sherif, "Sherif Hamdy must remain in teamMembers");
      assert.equal(sherif.isAlumni, true, "Sherif Hamdy must be marked isAlumni: true");
      assert.equal(sherif.committee, "Organizing Committee");

      assert.ok(mohamedSherif, "Mohamed Sherif must remain in teamMembers");
      assert.equal(mohamedSherif.isAlumni, true, "Mohamed Sherif must be marked isAlumni: true");
      assert.equal(mohamedSherif.committee, "Organizing Committee");
    });

    it("excludes alumni from getLegitimateMembers(), getGalleryMembers(), and getFeaturedHeroMembers()", () => {
      const legitimate = getLegitimateMembers();
      const gallery = getGalleryMembers();
      const hero = getFeaturedHeroMembers();

      const alumniIds = ["sherif-hamdy", "mohamed-sherif"];
      for (const id of alumniIds) {
        assert.ok(!legitimate.some((m) => m.id === id), `'${id}' must not be in legitimate members`);
        assert.ok(!gallery.some((m) => m.id === id), `'${id}' must not be in gallery members`);
        assert.ok(!hero.some((m) => m.id === id), `'${id}' must not be in hero featured members`);
      }

      assert.equal(legitimate.length, 18, "There must be exactly 18 active legitimate members");
    });

    it("excludes alumni from getVerifiedMembers() and getMembersByCommittee()", () => {
      const verified = getVerifiedMembers();
      const ocMembers = getMembersByCommittee("Organizing Committee");

      assert.ok(!verified.some((m) => m.id === "sherif-hamdy"));
      assert.ok(!verified.some((m) => m.id === "mohamed-sherif"));

      assert.ok(!ocMembers.some((m) => m.id === "sherif-hamdy"));
      assert.ok(!ocMembers.some((m) => m.id === "mohamed-sherif"));
      assert.equal(ocMembers.length, 6, "Organizing Committee must have exactly 6 active members");
    });

    it("includes both graduates in getAlumniMembers()", () => {
      const alumni = getAlumniMembers();
      assert.equal(alumni.length, 2, "There must be exactly 2 alumni members");
      const alumniIds = alumni.map((m) => m.id);
      assert.ok(alumniIds.includes("sherif-hamdy"));
      assert.ok(alumniIds.includes("mohamed-sherif"));
    });
  });

  describe("4. Track Membership Synchronization", () => {
    const expectedTrackMembers: Record<string, string[]> = {
      hr: ["adham-ahmed", "marwan-awad"],
      pr: ["omar-mehawed"],
      sm: ["mohamed-al-amir", "abdulrahman-ashraf", "youssef-soliman", "merna"],
      oc: [
        "farida-mohamed",
        "mahmoud-sameh",
        "shahd-ahssen",
        "habiba-ahmed",
        "mohamed-nagi",
        "saif-kambo",
      ],
      it: ["mohamed-ibrahim", "seif-ayman", "ziad-ayman"],
      rnd: [],
    };

    it("verifies tracks-data memberIds match the confirmed specification exactly", () => {
      for (const track of IT_CLUB_TRACKS) {
        const expected = expectedTrackMembers[track.id];
        assert.ok(expected !== undefined, `Track id '${track.id}' must be in expectedTrackMembers`);
        assert.deepEqual(
          track.memberIds,
          expected,
          `Track '${track.title}' memberIds mismatch`
        );
      }
    });

    it("verifies all track memberIds exist in teamMembers and are active members", () => {
      for (const track of IT_CLUB_TRACKS) {
        for (const memberId of track.memberIds) {
          const member = teamMembers.find((m) => m.id === memberId);
          assert.ok(member, `Member '${memberId}' on track '${track.id}' must exist in teamMembers`);
          assert.ok(!member.isAlumni, `Track '${track.id}' must not contain alumni member '${memberId}'`);
          assert.ok(!member.isAlternate, `Track '${track.id}' must not contain alternate record '${memberId}'`);
        }
      }
    });

    it("verifies IT track does not contain IT Club members (Ahmed Samir / Ahmed Mohsen)", () => {
      const itTrack = IT_CLUB_TRACKS.find((t) => t.id === "it");
      assert.ok(itTrack);
      assert.ok(!itTrack.memberIds.includes("ahmed-samir"), "Ahmed Samir must not be in IT track");
      assert.ok(!itTrack.memberIds.includes("ahmed-mohsen"), "Ahmed Mohsen must not be in IT track");
    });

    it("verifies no track contains graduates (Sherif Hamdy or Mohamed Sherif)", () => {
      for (const track of IT_CLUB_TRACKS) {
        assert.ok(!track.memberIds.includes("sherif-hamdy"));
        assert.ok(!track.memberIds.includes("mohamed-sherif"));
      }
    });

    it("verifies track members have matching committee assignments", () => {
      const trackCommitteeMap: Record<string, string> = {
        hr: "Human Resources",
        pr: "Public Relations",
        sm: "Social Media",
        oc: "Organizing Committee",
        it: "Information Technology",
        rnd: "Research & Development",
      };

      for (const track of IT_CLUB_TRACKS) {
        const expectedCommittee = trackCommitteeMap[track.id];
        for (const memberId of track.memberIds) {
          const member = teamMembers.find((m) => m.id === memberId);
          assert.equal(
            member?.committee,
            expectedCommittee,
            `Member '${memberId}' in track '${track.id}' must belong to '${expectedCommittee}'`
          );
        }
      }
    });
  });

  describe("5. Diagnostics & Cleanliness Validation", () => {
    it("passes validateTeamData with zero duplicates and expected counts", () => {
      const diagnostics = validateTeamData();
      assert.equal(diagnostics.duplicateIds.length, 0, "Must have zero duplicate IDs");
      assert.equal(diagnostics.duplicateNames.length, 0, "Must have zero duplicate names");
      assert.equal(diagnostics.missingNames.length, 0, "Must have zero missing names");
      assert.equal(diagnostics.missingImages.length, 0, "Must have zero missing images");
      assert.equal(diagnostics.needsReviewCount, 0, "Must have zero pending review members");
      assert.equal(diagnostics.totalRecords, 20, "Total team members records must be 20");
      assert.equal(diagnostics.legitimateMembersCount, 18, "Active legitimate members must be 18");
      assert.equal(diagnostics.alumniCount, 2, "Alumni members must be 2");
    });
  });
});
