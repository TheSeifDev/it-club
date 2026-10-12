import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateUniversityEmail,
  normalizeUniversityEmail,
  validatePersonalEmail,
} from "../lib/validation/university-email.ts";

describe("University Email Validation (@batechu.com)", () => {
  it("accepts valid numeric student IDs at batechu.com", () => {
    const validEmails = [
      "123456@batechu.com",
      "2026123456@batechu.com",
      "1@batechu.com",
      "999999999@batechu.com",
      "001234@batechu.com",
    ];

    for (const email of validEmails) {
      const result = validateUniversityEmail(email);
      assert.equal(result.isValid, true, `Expected ${email} to be valid`);
      assert.equal(result.normalized, email);
    }
  });

  it("normalizes case-insensitive domains without modifying student ID", () => {
    const mixedCase = "2026123456@BATECHU.COM";
    assert.equal(normalizeUniversityEmail(mixedCase), "2026123456@batechu.com");
    assert.equal(normalizeUniversityEmail("  9876@Batechu.COM  "), "9876@batechu.com");
    assert.equal(normalizeUniversityEmail(null), "");
    const result = validateUniversityEmail(mixedCase);
    assert.equal(result.isValid, true);
    assert.equal(result.normalized, "2026123456@batechu.com");
    assert.equal(result.studentId, "2026123456");
  });

  it("trims surrounding whitespace", () => {
    const padded = "   2026123456@batechu.com   ";
    const result = validateUniversityEmail(padded);
    assert.equal(result.isValid, true);
    assert.equal(result.normalized, "2026123456@batechu.com");
  });

  it("rejects non-numeric characters in the student number local part", () => {
    const invalidLocalParts = [
      "student@batechu.com",
      "123abc@batechu.com",
      "abc123@batechu.com",
      "123-456@batechu.com",
      "123.456@batechu.com",
      "123_456@batechu.com",
      "+123456@batechu.com",
    ];

    for (const email of invalidLocalParts) {
      const result = validateUniversityEmail(email);
      assert.equal(result.isValid, false, `Expected ${email} to be rejected for non-numeric local part`);
      assert.match(result.error || "", /numbers only/i);
    }
  });

  it("rejects invalid domains and subdomains", () => {
    const invalidDomains = [
      "123456@gmail.com",
      "123456@batechu.com.example.org",
      "123456@notbatechu.com",
      "123456@batu.edu.eg",
      "123456@batechu.org",
      "123456@sub.batechu.com",
    ];

    for (const email of invalidDomains) {
      const result = validateUniversityEmail(email);
      assert.equal(result.isValid, false, `Expected ${email} to be rejected for invalid domain`);
      assert.match(result.error || "", /@batechu\.com/i);
    }
  });

  it("rejects malformed and empty inputs", () => {
    const malformed = [
      "",
      "   ",
      "@batechu.com",
      "123456",
      "123456@",
      "123@456@batechu.com",
      null,
      undefined,
    ];

    for (const val of malformed) {
      const result = validateUniversityEmail(val);
      assert.equal(result.isValid, false);
    }
  });
});

describe("Personal / Google Email Validation", () => {
  it("accepts valid personal emails", () => {
    const valid = [
      "applicant@gmail.com",
      "student.name@yahoo.com",
      "user+tag@outlook.com",
    ];

    for (const email of valid) {
      const result = validatePersonalEmail(email);
      assert.equal(result.isValid, true);
    }
  });

  it("accepts empty or null personal email (since it is optional)", () => {
    assert.equal(validatePersonalEmail("").isValid, true);
    assert.equal(validatePersonalEmail(null).isValid, true);
    assert.equal(validatePersonalEmail(undefined).isValid, true);
  });

  it("rejects malformed personal emails if provided", () => {
    const invalid = ["invalid-email", "user@", "@domain.com", "user@domain"];
    for (const email of invalid) {
      assert.equal(validatePersonalEmail(email).isValid, false);
    }
  });
});
