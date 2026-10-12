import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateRegistrationPayload } from "../lib/validation/registration-schema.ts";

const validBasePayload = {
  fullName: "Ahmed Mostafa Ali",
  nationalId: "30405150101234", // Synthetic: 2004-05-15 in Cairo
  academicId: "BATU-2024-9876",
  phone: "+201012345678",
  whatsapp: "+201012345678",
  whatsappSame: true,
  universityEmail: "20249876@batechu.com",
  googleEmail: "ahmed.backup@gmail.com",
  year: "first",
  department: "Information Technology",
  experienceLevel: "beginner",
  skills: "HTML, CSS, basic JavaScript and Python",
  experienceDetails: "Completed university introductory programming assignments",
  volunteerExperience: "",
  primaryTrack: "it",
  secondaryTrack: "rnd",
  motivation: "I have been following IT Club workshops and want to contribute and build real projects.",
  learningGoal: "Master web development concepts and collaborate in team software projects.",
  contribution: "Help organize bootcamps and assist other students with lab work.",
  availability: "weekdays",
  consent: true,
};

describe("Registration Schema & Boundary Validation", () => {
  it("accepts a completely valid submission payload", () => {
    const result = validateRegistrationPayload(validBasePayload);
    assert.equal(result.isValid, true);
    assert.ok(result.data);
    assert.equal(result.data.fullName, "Ahmed Mostafa Ali");
    assert.equal(result.data.nationalId, "30405150101234");
    assert.equal(result.data.universityEmail, "20249876@batechu.com");
    assert.equal(result.data.primaryTrack, "it");
    assert.equal(result.data.secondaryTrack, "rnd");
    assert.equal(result.data.consent, true);
  });

  it("rejects non-object or malformed payloads", () => {
    assert.equal(validateRegistrationPayload(null).isValid, false);
    assert.equal(validateRegistrationPayload(undefined).isValid, false);
    assert.equal(validateRegistrationPayload("invalid string").isValid, false);
    assert.equal(validateRegistrationPayload([1, 2, 3]).isValid, false);
  });

  it("strips and ignores client-supplied protected fields (status, reference, review metadata)", () => {
    const maliciousPayload = {
      ...validBasePayload,
      status: "ACCEPTED",
      application_reference: "OVERRIDE-REF-999",
      consented_at: "1970-01-01T00:00:00Z",
      reviewed_by: "00000000-0000-0000-0000-000000000000",
      reviewer_notes: "Auto-approve bypassing interview",
      id: "00000000-0000-0000-0000-000000000000",
    };

    const result = validateRegistrationPayload(maliciousPayload);
    assert.equal(result.isValid, true);
    assert.ok(result.data);

    // Protected fields must not be present in the validated data object
    const dataRecord = result.data as unknown as Record<string, unknown>;
    assert.equal(dataRecord.status, undefined);
    assert.equal(dataRecord.application_reference, undefined);
    assert.equal(dataRecord.consented_at, undefined);
    assert.equal(dataRecord.reviewed_by, undefined);
    assert.equal(dataRecord.reviewer_notes, undefined);
    assert.equal(dataRecord.id, undefined);
  });

  it("detects and rejects automated bot submissions using hidden honeypot field", () => {
    const botPayload = {
      ...validBasePayload,
      hp_confirm: "automated-bot-val",
    };

    const result = validateRegistrationPayload(botPayload);
    assert.equal(result.isValid, false);
    assert.equal(result.isBot, true);
  });

  it("enforces distinct primary and secondary track preferences", () => {
    const duplicateTracksPayload = {
      ...validBasePayload,
      primaryTrack: "it",
      secondaryTrack: "it",
    };

    const result = validateRegistrationPayload(duplicateTracksPayload);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.secondaryTrack);
    assert.match(result.errors.secondaryTrack, /differ/i);
  });

  it("rejects unauthorized enums for tracks and experience levels", () => {
    const invalidEnumsPayload = {
      ...validBasePayload,
      primaryTrack: "invalid_track",
      experienceLevel: "master_hacker",
      year: "tenth_year",
    };

    const result = validateRegistrationPayload(invalidEnumsPayload);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.primaryTrack);
    assert.ok(result.errors.experienceLevel);
    assert.ok(result.errors.year);
  });

  it("requires consent acknowledgement", () => {
    const noConsentPayload = {
      ...validBasePayload,
      consent: false,
    };

    const result = validateRegistrationPayload(noConsentPayload);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.consent);
  });

  it("enforces minimum lengths on motivational answers", () => {
    const shortMotivationPayload = {
      ...validBasePayload,
      motivation: "Too short",
      learningGoal: "Short",
    };

    const result = validateRegistrationPayload(shortMotivationPayload);
    assert.equal(result.isValid, false);
    assert.ok(result.errors.motivation);
    assert.ok(result.errors.learningGoal);
  });
});
