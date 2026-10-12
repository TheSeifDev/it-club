import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateEgyptianNationalId,
  normalizeNationalId,
  maskNationalId,
  isLeapYear,
  getDaysInMonth,
} from "../lib/validation/national-id.ts";

describe("Egyptian National ID Structural Validation", () => {
  it("accepts valid synthetic 21st-century ID (century digit 3, born 2004 in Cairo 01)", () => {
    // Synthetic ID: Century 3 (2000s), Year 04, Month 05, Day 15, Gov 01 (Cairo), Seq 012(M), Check 4
    const syntheticId = "30405150101234";
    const result = validateEgyptianNationalId(syntheticId);

    assert.equal(result.isValid, true);
    assert.ok(result.details);
    assert.equal(result.details.birthYear, 2004);
    assert.equal(result.details.birthMonth, 5);
    assert.equal(result.details.birthDay, 15);
    assert.equal(result.details.governorateCode, "01");
    assert.match(result.details.governorateName, /Cairo/i);
    assert.equal(result.details.gender, "male"); // digit 13 (index 12) is '3' (odd -> male)
  });

  it("accepts valid synthetic 20th-century ID (century digit 2, born 1999 in Alexandria 02)", () => {
    // Synthetic ID: Century 2 (1900s), Year 99, Month 11, Day 20, Gov 02 (Alexandria), Seq 013(M), Check 5
    const syntheticId = "29911200201355";
    const result = validateEgyptianNationalId(syntheticId);

    assert.equal(result.isValid, true);
    assert.ok(result.details);
    assert.equal(result.details.birthYear, 1999);
    assert.equal(result.details.birthMonth, 11);
    assert.equal(result.details.birthDay, 20);
    assert.equal(result.details.governorateCode, "02");
    assert.equal(result.details.gender, "male"); // digit 13 is '5' (odd -> male)
  });

  it("verifies leap year calendar rules correctly for February 29", () => {
    // Year 2004 is a leap year (2004 % 4 === 0)
    assert.equal(isLeapYear(2004), true);
    assert.equal(getDaysInMonth(2004, 2), 29);

    // 2004-02-29 in Giza (21)
    const validLeapId = "30402292101234";
    const leapResult = validateEgyptianNationalId(validLeapId);
    assert.equal(leapResult.isValid, true);

    // Year 2005 is NOT a leap year
    assert.equal(isLeapYear(2005), false);
    assert.equal(getDaysInMonth(2005, 2), 28);

    // 2005-02-29 in Giza (21) - MUST BE REJECTED
    const invalidLeapId = "30502292101234";
    const nonLeapResult = validateEgyptianNationalId(invalidLeapId);
    assert.equal(nonLeapResult.isValid, false);
    assert.match(nonLeapResult.error || "", /February 29 is invalid.*not a leap year/i);
  });

  it("verifies century leap year rules (2000 is leap, 1900 is not leap)", () => {
    // 2000 is divisible by 400 -> leap year
    assert.equal(isLeapYear(2000), true);
    const id2000 = "30002291401234"; // 2000-02-29 in Qalyubia (14)
    assert.equal(validateEgyptianNationalId(id2000).isValid, true);

    // 1900 is divisible by 100 but NOT 400 -> NOT a leap year
    assert.equal(isLeapYear(1900), false);
    const id1900 = "20002291401234"; // 1900-02-29
    assert.equal(validateEgyptianNationalId(id1900).isValid, false);
  });

  it("rejects invalid calendar days and months", () => {
    // Month 13 (impossible month)
    assert.equal(validateEgyptianNationalId("30413150101234").isValid, false);

    // Month 00 (impossible month)
    assert.equal(validateEgyptianNationalId("30400150101234").isValid, false);

    // Day 00 (impossible day)
    assert.equal(validateEgyptianNationalId("30405000101234").isValid, false);

    // Day 32 (impossible day)
    assert.equal(validateEgyptianNationalId("30405320101234").isValid, false);

    // April 31 (April only has 30 days)
    assert.equal(validateEgyptianNationalId("30404310101234").isValid, false);
  });

  it("rejects invalid century digits", () => {
    // Century 1 (1800s - not valid for living applicants)
    assert.equal(validateEgyptianNationalId("19801010101234").isValid, false);

    // Century 4 (2100s - impossible)
    assert.equal(validateEgyptianNationalId("40401010101234").isValid, false);

    // Century 0
    assert.equal(validateEgyptianNationalId("00401010101234").isValid, false);
  });

  it("validates registered Egyptian governorate codes including special code 88", () => {
    // Cairo (01), Alexandria (02), Qalyubia (14), Giza (21), Born Abroad (88)
    const validCodes = ["01", "02", "14", "21", "88"];
    for (const code of validCodes) {
      const id = `3040515${code}01234`;
      assert.equal(validateEgyptianNationalId(id).isValid, true, `Expected governorate code ${code} to be valid`);
    }

    // Unassigned / invalid codes: 00, 05, 99
    const invalidCodes = ["00", "05", "10", "20", "30", "99"];
    for (const code of invalidCodes) {
      const id = `3040515${code}01234`;
      assert.equal(validateEgyptianNationalId(id).isValid, false, `Expected governorate code ${code} to be rejected`);
    }
  });

  it("rejects IDs with incorrect lengths or non-numeric characters", () => {
    assert.equal(validateEgyptianNationalId("3040515010123").isValid, false); // 13 digits
    assert.equal(validateEgyptianNationalId("304051501012345").isValid, false); // 15 digits
    assert.equal(validateEgyptianNationalId("").isValid, false);
    assert.equal(validateEgyptianNationalId(null).isValid, false);
  });

  it("masks and normalizes National ID for privacy preservation in review screens", () => {
    assert.equal(normalizeNationalId(" 3040515-010123-4 "), "30405150101234");
    assert.equal(normalizeNationalId(null), "");
    const masked = maskNationalId("30405150101234");
    assert.equal(masked, "•••• •••• •••• 1234");
    assert.equal(maskNationalId("short"), "•••• •••• •••• ••••");
  });
});
