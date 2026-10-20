import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  teamMembers,
  unverifiedLeadershipPositions,
  getTeamMemberById,
  getLegitimateMembers,
  getGalleryMembers,
  getFeaturedHeroMembers,
  getVerifiedMembers,
  getPendingReviewMembers,
  getMembersByCommittee,
  getAlumniMembers,
  getMemberCutoutImage,
  MEMBER_CUTOUT_MAP,
  validateTeamData,
  formatRoleMetadata,
  formatCommitteeMetadata,
} from "../src/components/interview/committee-data.ts";
import { IT_CLUB_TRACKS } from "../src/components/interview/Tracks/tracks-data.ts";

describe("IT Club — Committee Data, Leadership Hierarchy & Cutout Transparency", () => {
  describe("1. Canonical Member Assignments & Roles", () => {
    const expectedAssignments: Record<string, { committee: string; role: string }> = {
      // IT Club Executive Leadership
      "ahmed-samir": { committee: "IT Club", role: "Head" },
      "ahmed-mohsen": { committee: "IT Club", role: "Vice Head" },
      "adham-ahmed": { committee: "IT Club", role: "Head" },
      "fares": { committee: "IT Club", role: "Vice Head" },

      // Information Technology (IT)
      "mohamed-ibrahim": { committee: "Information Technology", role: "Supervisor " },
      "seif-ayman": { committee: "Information Technology", role: "Vice Head" },
      "ziad-ayman": { committee: "Information Technology", role: "Leader" },

      // Public Relations (PR)
      "omar-mehawed": { committee: "Public Relations", role: "Head" },

      // Human Resources (HR)
      "marwan-awad": { committee: "Human Resources", role: "Head" },
      "islam-el-sayed": { committee: "Human Resources", role: "Vice Head" },

      // Social Media (SM)
      "nour": { committee: "Social Media", role: "Leader" },
      "abdulrahman-ashraf": { committee: "Social Media", role: "Head" },
      "mohamed-al-amir": { committee: "Social Media", role: "Vice Head" },
      "menna": { committee: "Social Media", role: "leader" },
      "merna": { committee: "Social Media", role: "Vice Head" },
      "youssef-soliman": { committee: "Social Media", role: "leader" },

      // Organizing Committee (OC)
      "habiba-mounir": { committee: "Organizing Committee", role: "Head" },
      "mahmoud-sameh": { committee: "Organizing Committee", role: "Vice Head" },
      "farida-mohamed": { committee: "Organizing Committee", role: "Supervisor" },
      "shahd-ahssen": { committee: "Organizing Committee", role: "Supervisor" },
      "habiba-ahmed": { committee: "Organizing Committee", role: "Supervisor" },
      "mohamed-nagi": { committee: "Organizing Committee", role: "Supervisor" },
      "saber": { committee: "Organizing Committee", role: "Supervisor" },
      "saif-kambo": { committee: "Organizing Committee", role: "Main" },
      "benjamin": { committee: "Organizing Committee", role: "Supervisor of sm" },
    };

    it("verifies all 25 active members have exact confirmed committees and roles", () => {
      for (const [memberId, expected] of Object.entries(expectedAssignments)) {
        const member = teamMembers.find((m) => m.id === memberId);
        assert.ok(member, `Member record '${memberId}' must exist in teamMembers`);
        assert.equal(
          member.committee,
          expected.committee,
          `Member '${memberId}' expected committee '${expected.committee}', found '${member.committee}'`
        );
        assert.equal(
          member.role,
          expected.role,
          `Member '${memberId}' expected role '${expected.role}', found '${member.role}'`
        );
        assert.equal(
          member.needsReview,
          false,
          `Confirmed member '${memberId}' must have needsReview: false`
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

  describe("2. Official Hierarchy & Role Representation", () => {
    it("verifies Club Head and Club Vice Head positions are represented distinctly", () => {
      const adham = teamMembers.find((m) => m.id === "adham-ahmed");
      const fares = teamMembers.find((m) => m.id === "fares");

      assert.ok(adham);
      assert.equal(adham.committee, "IT Club");
      assert.equal(adham.role, "Head");
      assert.equal(formatRoleMetadata(adham.role, adham.committee), "HEAD OF CLUB");
      assert.equal(formatCommitteeMetadata(adham.committee), "IT CLUB");

      assert.ok(fares);
      assert.equal(fares.committee, "IT Club");
      assert.equal(fares.role, "Vice Head");
      assert.equal(formatRoleMetadata(fares.role, fares.committee), "VICE HEAD OF CLUB");
      assert.equal(formatCommitteeMetadata(fares.committee), "IT CLUB");
    });

    it("verifies Organizing Committee Supervisors are represented distinctly", () => {
      const ocSupervisors = [
        "farida-mohamed",
        "shahd-ahssen",
        "habiba-ahmed",
        "mohamed-nagi",
        "saber",
      ];

      for (const id of ocSupervisors) {
        const member = teamMembers.find((m) => m.id === id);
        assert.ok(member, `Supervisor '${id}' must exist`);
        assert.equal(member.role, "Supervisor", `'${id}' must have role: 'Supervisor'`);
        assert.equal(member.committee, "Organizing Committee");
        assert.equal(formatRoleMetadata(member.role, member.committee), "SUPERVISOR OF OC");
      }
    });

    it("verifies Committee Heads are represented distinctly", () => {
      const heads = [
        { id: "omar-mehawed", committee: "Public Relations", expectedMeta: "HEAD OF PR" },
        { id: "marwan-awad", committee: "Human Resources", expectedMeta: "HEAD OF HR" },
        { id: "abdulrahman-ashraf", committee: "Social Media", expectedMeta: "HEAD OF SM" },
        { id: "habiba-mounir", committee: "Organizing Committee", expectedMeta: "HEAD OF OC" },
      ];

      for (const h of heads) {
        const member = teamMembers.find((m) => m.id === h.id);
        assert.ok(member, `Head '${h.id}' must exist`);
        assert.equal(member.role, "Head", `'${h.id}' must have role: 'Head'`);
        assert.equal(member.committee, h.committee);
        assert.equal(formatRoleMetadata(member.role, member.committee), h.expectedMeta);
      }
    });

    it("verifies explicit user corrections for Ziad Ayman and Nour are preserved", () => {
      const ziad = teamMembers.find((m) => m.id === "ziad-ayman");
      assert.ok(ziad, "Ziad Ayman must exist");
      assert.equal(ziad.role, "Leader");
      assert.equal(ziad.committee, "Information Technology");
      assert.equal(formatRoleMetadata(ziad.role, ziad.committee), "LEADER OF IT");

      const nour = teamMembers.find((m) => m.id === "nour");
      assert.ok(nour, "Nour must exist");
      assert.equal(nour.role, "Leader");
      assert.equal(nour.committee, "Social Media");
      assert.equal(formatRoleMetadata(nour.role, nour.committee), "LEADER OF SM");
    });

    it("verifies unverified leadership positions are tracked and documented with explanations", () => {
      assert.ok(unverifiedLeadershipPositions.length >= 4);

      const fatma = unverifiedLeadershipPositions.find((p) => p.name.includes("Fatma"));
      assert.ok(fatma, "Fatma (Club Supervisor) must be recorded in unverifiedLeadershipPositions");
      assert.equal(fatma.role, "CLUB_SUP");

      const hosny = unverifiedLeadershipPositions.find((p) => p.name.includes("Hosny"));
      assert.ok(hosny, "Hosny (SM Supervisor) must be recorded in unverifiedLeadershipPositions");
      assert.equal(hosny.committee, "Social Media");

      const mariam = unverifiedLeadershipPositions.find((p) => p.name.includes("Mariam"));
      assert.ok(mariam, "Mariam (OC Co-Head) must be recorded in unverifiedLeadershipPositions");
      assert.equal(mariam.committee, "Organizing Committee");
    });
  });

  describe("3. Marwan Profile & Asset Resolution", () => {
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

  describe("4. Alumni Marking & Roster Exclusion", () => {
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

      assert.equal(legitimate.length, 25, "There must be exactly 25 active legitimate members");
    });

    it("excludes alumni from getVerifiedMembers() and getMembersByCommittee()", () => {
      const verified = getVerifiedMembers();
      const ocMembers = getMembersByCommittee("Organizing Committee");

      assert.ok(!verified.some((m) => m.id === "sherif-hamdy"));
      assert.ok(!verified.some((m) => m.id === "mohamed-sherif"));

      assert.ok(!ocMembers.some((m) => m.id === "sherif-hamdy"));
      assert.ok(!ocMembers.some((m) => m.id === "mohamed-sherif"));
      assert.equal(ocMembers.length, 9, "Organizing Committee must have exactly 9 active members");
    });

    it("includes both graduates in getAlumniMembers()", () => {
      const alumni = getAlumniMembers();
      assert.equal(alumni.length, 2, "There must be exactly 2 alumni members");
      const alumniIds = alumni.map((m) => m.id);
      assert.ok(alumniIds.includes("sherif-hamdy"));
      assert.ok(alumniIds.includes("mohamed-sherif"));
    });
  });

  describe("5. Track Membership Synchronization", () => {
    const expectedTrackMembers: Record<string, string[]> = {
      hr: ["marwan-awad", "islam-el-sayed"],
      pr: ["omar-mehawed"],
      sm: ["nour", "abdulrahman-ashraf", "mohamed-al-amir", "menna", "merna", "youssef-soliman"],
      oc: [
        "habiba-mounir",
        "mahmoud-sameh",
        "farida-mohamed",
        "shahd-ahssen",
        "habiba-ahmed",
        "mohamed-nagi",
        "saber",
        "saif-kambo",
        "benjamin",
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

    it("verifies tracks do not contain Club Executive Leadership (Ahmed Samir, Ahmed Mohsen, Adham Ahmed, Fares)", () => {
      const clubExecIds = ["ahmed-samir", "ahmed-mohsen", "adham-ahmed", "fares"];
      for (const track of IT_CLUB_TRACKS) {
        for (const execId of clubExecIds) {
          assert.ok(
            !track.memberIds.includes(execId),
            `Executive member '${execId}' must not be listed in track '${track.id}'`
          );
        }
      }
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

  describe("6. WebP Asset Validation", () => {
    it("verifies all referenced images use .webp extension and physically exist on disk", () => {
      for (const member of teamMembers) {
        assert.ok(
          member.image.endsWith(".webp"),
          `Member '${member.id}' image '${member.image}' must use .webp extension`
        );
        const assetPath = path.join(process.cwd(), "public", member.image.replace(/^\//, ""));
        assert.ok(fs.existsSync(assetPath), `Asset file must exist at ${assetPath}`);
        const stat = fs.statSync(assetPath);
        assert.ok(stat.size > 0, `Asset file at ${assetPath} must not be empty`);
      }
    });
  });

  describe("7. Cutout Assets & Genuine Transparency Validation", () => {
    it("verifies every single member in teamMembers has an explicit cutoutImage defined", () => {
      for (const member of teamMembers) {
        assert.ok(
          member.cutoutImage,
          `Member '${member.id}' must have cutoutImage property defined`
        );
        assert.ok(
          member.cutoutImage.endsWith(".webp"),
          `Member '${member.id}' cutout '${member.cutoutImage}' must end with .webp`
        );
      }
    });

    it("verifies MEMBER_CUTOUT_MAP contains all 27 canonical member IDs", () => {
      for (const member of teamMembers) {
        assert.ok(
          MEMBER_CUTOUT_MAP[member.id],
          `MEMBER_CUTOUT_MAP must have entry for member '${member.id}'`
        );
      }
      assert.equal(
        Object.keys(MEMBER_CUTOUT_MAP).filter((k) => k !== "marwan").length,
        27,
        "MEMBER_CUTOUT_MAP must contain all 27 canonical member IDs"
      );
    });

    it("verifies all 27 cutout .webp files physically exist on disk in public/COMMITTEES/cutouts/", () => {
      for (const member of teamMembers) {
        const cutoutPath = path.join(process.cwd(), "public", member.cutoutImage!.replace(/^\//, ""));
        assert.ok(
          fs.existsSync(cutoutPath),
          `Cutout file for '${member.id}' must exist on disk at '${cutoutPath}'`
        );
        const stat = fs.statSync(cutoutPath);
        assert.ok(
          stat.size > 0,
          `Cutout file for '${member.id}' at '${cutoutPath}' must not be empty (found size: ${stat.size} bytes)`
        );
      }
    });

    it("verifies all 10 featured members in CommunityHero resolve to a valid transparent cutout", () => {
      const heroMembers = getFeaturedHeroMembers();
      assert.equal(heroMembers.length, 10, "Must have exactly 10 featured hero members");

      for (const member of heroMembers) {
        const cutout = getMemberCutoutImage(member);
        assert.ok(
          cutout,
          `Featured hero member '${member.name}' (${member.id}) must resolve a cutoutImage`
        );
        assert.ok(
          cutout.startsWith("/COMMITTEES/cutouts/"),
          `Featured hero member '${member.id}' cutout must be from /COMMITTEES/cutouts/ directory, got '${cutout}'`
        );
        const assetPath = path.join(process.cwd(), "public", cutout.replace(/^\//, ""));
        assert.ok(
          fs.existsSync(assetPath),
          `Physical cutout file must exist for hero member '${member.id}' at '${assetPath}'`
        );
      }
    });

    it("specifically verifies newly processed members resolve to genuine WebP cutouts", () => {
      const newlyProcessed = [
        "fares",
        "islam-el-sayed",
        "nour",
        "menna",
        "habiba-mounir",
        "saber",
        "benjamin",
      ];

      for (const id of newlyProcessed) {
        const member = teamMembers.find((m) => m.id === id);
        assert.ok(member, `Member '${id}' must exist in teamMembers`);
        assert.equal(
          member.cutoutImage,
          `/COMMITTEES/cutouts/${id}.webp`,
          `Member '${id}' cutoutImage must be '/COMMITTEES/cutouts/${id}.webp'`
        );
        const cutout = getMemberCutoutImage(id);
        assert.equal(
          cutout,
          `/COMMITTEES/cutouts/${id}.webp`,
          `getMemberCutoutImage('${id}') must resolve to '/COMMITTEES/cutouts/${id}.webp'`
        );
        const assetPath = path.join(process.cwd(), "public", "COMMITTEES", "cutouts", `${id}.webp`);
        assert.ok(fs.existsSync(assetPath), `Cutout must exist at '${assetPath}'`);
      }
    });
  });

  describe("8. Diagnostics & Cleanliness Validation", () => {
    it("passes validateTeamData with zero duplicates and expected counts", () => {
      const diagnostics = validateTeamData();
      assert.equal(diagnostics.duplicateIds.length, 0, "Must have zero duplicate IDs");
      assert.equal(diagnostics.duplicateNames.length, 0, "Must have zero duplicate names");
      assert.equal(diagnostics.missingNames.length, 0, "Must have zero missing names");
      assert.equal(diagnostics.missingImages.length, 0, "Must have zero missing images");
      assert.equal(diagnostics.needsReviewCount, 0, "Must have zero pending review members");
      assert.equal(diagnostics.totalRecords, 27, "Total team members records must be 27");
      assert.equal(diagnostics.legitimateMembersCount, 25, "Active legitimate members must be 25");
      assert.equal(diagnostics.alumniCount, 2, "Alumni members must be 2");
    });
  });
});
