import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReservationWhatsApp,
  normalizeDigits,
  RESERVATION_SHEET_COLUMNS,
  reservationAttachments,
  reservationCode,
  reservationSheetRow,
  STORE_BUNDLE_PRICE_EGP,
  validateReservation,
  whatsappDigits,
} from "../lib/store/catalog.ts";

const full = {
  edition: "full",
  name: "  Seif   Ayman ",
  academicId: "٢٠٢٤ ١٢٣٤",
  position: "Vice head",
  committee: "IT",
  vestSize: "L",
};

describe("IT Club store reservation", () => {
  it("keeps the approved bundle price", () => {
    assert.equal(STORE_BUNDLE_PRICE_EGP, 250);
  });

  it("accepts one complete reservation and normalises name and Arabic digits", () => {
    const result = validateReservation(full);
    assert.ok(result.ok);
    assert.equal(result.value.name, "Seif Ayman");
    assert.equal(result.value.academicId, "20241234");
    assert.equal(result.value.vestSize, "L");
    assert.equal(result.value.eligibility, null);
  });

  it("requires every field the club asked for", () => {
    const result = validateReservation({});
    assert.equal(result.ok, false);
    if (!result.ok) {
      for (const field of ["edition", "name", "academicId", "position", "committee"]) assert.ok(result.errors[field as keyof typeof result.errors], field);
    }
  });

  it("needs a vest size only for the vest kit, and eligibility only for ID-only", () => {
    const noSize = validateReservation({ ...full, vestSize: undefined });
    assert.ok(!noSize.ok && noSize.errors.vestSize);
    const idOnly = validateReservation({ ...full, edition: "id", vestSize: undefined });
    assert.ok(!idOnly.ok && idOnly.errors.eligibility && !idOnly.errors.vestSize);
    const ok = validateReservation({ ...full, edition: "id", eligibility: "main-board", vestSize: "XL" });
    assert.ok(ok.ok);
    assert.equal(ok.value.vestSize, null);
  });

  it("rejects invalid IDs, positions and committees", () => {
    assert.equal(validateReservation({ ...full, academicId: "abc" }).ok, false);
    assert.equal(validateReservation({ ...full, position: "CEO" }).ok, false);
    assert.equal(validateReservation({ ...full, committee: "RD" }).ok, false);
    assert.equal(validateReservation({ ...full, name: "12345" }).ok, false);
  });

  it("builds readable unambiguous codes", () => {
    const code = reservationCode([0, 1, 31, 32, 200]);
    assert.match(code, /^ITC-[2-9A-HJ-NP-Z]{5}$/);
  });

  it("asks for photo + payment screenshot, and only the photo for Main board ID-only", () => {
    assert.equal(reservationAttachments({ edition: "full", eligibility: null }).length, 2);
    assert.equal(reservationAttachments({ edition: "id", eligibility: "already-paid" }).length, 2);
    assert.equal(reservationAttachments({ edition: "id", eligibility: "main-board" }).length, 1);
  });

  it("normalises WhatsApp numbers and builds a prefilled message", () => {
    assert.equal(whatsappDigits("010 1234 5678"), "201012345678");
    assert.equal(whatsappDigits("+20 101 234 5678"), "201012345678");
    assert.equal(whatsappDigits("٠١٠١٢٣٤٥٦٧٨"), "201012345678");
    assert.equal(whatsappDigits("12"), null);
    const result = validateReservation(full);
    assert.ok(result.ok);
    assert.equal(buildReservationWhatsApp(null, "ITC-ABCDE", result.value), null);
    const url = buildReservationWhatsApp("01012345678", "ITC-ABCDE", result.value);
    assert.ok(url?.startsWith("https://wa.me/201012345678?text="));
    const text = decodeURIComponent(url!.split("text=")[1]);
    assert.match(text, /ITC-ABCDE/);
    assert.match(text, /Academic ID: 20241234/);
    assert.match(text, /Vest size: L/);
    assert.match(text, /سكرين/);
  });

  it("maps a reservation onto the sheet columns", () => {
    assert.equal(normalizeDigits("۱۲۳"), "123");
    const result = validateReservation(full);
    assert.ok(result.ok);
    const row = reservationSheetRow("ITC-ABCDE", result.value, new Date("2026-11-28T00:00:00Z"));
    assert.equal(row.length, RESERVATION_SHEET_COLUMNS.length);
    assert.equal(row[1], "ITC-ABCDE");
    assert.equal(row[4], "250");
    assert.equal(row[6], "'20241234");
    assert.equal(row[8], "Information Technology");
  });
});
