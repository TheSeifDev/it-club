/**
 * IT Club store — reservation rules (pure, no I/O).
 * A visitor reserves exactly one kit for themselves; it is not a cart.
 * The record goes to the club Google Sheet; the personal photo and payment
 * screenshot are sent on WhatsApp with the reservation code.
 */
export const STORE_BUNDLE_PRICE_EGP = 250;
export const STORE_CONTACT_EMAIL = "contact@itclub.one";

export const STORE_EDITIONS = {
  full: { code: "A", label: "Vest + ID + lanyard", priceEgp: STORE_BUNDLE_PRICE_EGP },
  id: { code: "B", label: "ID card + lanyard", priceEgp: null },
} as const;
export type StoreEdition = keyof typeof STORE_EDITIONS;

export const STORE_ELIGIBILITY = {
  "already-paid": "Already paid",
  "main-board": "Main board",
} as const;
export type StoreEligibility = keyof typeof STORE_ELIGIBILITY;

export const STORE_POSITIONS = ["Member", "Main board", "Leader", "Supervisor", "Vice head", "Head"] as const;
export type StorePosition = (typeof STORE_POSITIONS)[number];

export const STORE_COMMITTEES = [
  { value: "HR", label: "Human Resources" },
  { value: "PR", label: "Public Relations" },
  { value: "SM", label: "Social Media" },
  { value: "OC", label: "Organizing Committee" },
  { value: "IT", label: "Information Technology" },
  { value: "CLUB", label: "Club leadership" },
] as const;
export type StoreCommittee = (typeof STORE_COMMITTEES)[number]["value"];

export const STORE_VEST_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type StoreVestSize = (typeof STORE_VEST_SIZES)[number];

export type StoreReservation = {
  edition: StoreEdition;
  eligibility: StoreEligibility | null;
  name: string;
  academicId: string;
  position: StorePosition;
  committee: StoreCommittee;
  vestSize: StoreVestSize | null;
};

export type ReservationField = "edition" | "eligibility" | "name" | "academicId" | "position" | "committee" | "vestSize";
export type ReservationResult =
  | { ok: true; value: StoreReservation }
  | { ok: false; errors: Partial<Record<ReservationField, string>> };

const CONTROL = /[\u0000-\u001f\u007f]/;
/** Arabic-Indic and Persian digits → Latin, so "٢٠٢٤١٢٣" is accepted as typed. */
export function normalizeDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) & 0xf));
}

function includes<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export function validateReservation(raw: unknown): ReservationResult {
  const input = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const errors: Partial<Record<ReservationField, string>> = {};

  const edition = input.edition;
  if (edition !== "full" && edition !== "id") errors.edition = "Choose what you’re reserving.";

  let eligibility: StoreEligibility | null = null;
  if (edition === "id") {
    if (input.eligibility === "already-paid" || input.eligibility === "main-board") eligibility = input.eligibility;
    else errors.eligibility = "ID-only is for members who already paid or Main board.";
  }

  const name = typeof input.name === "string" ? input.name.replace(/\s+/g, " ").trim() : "";
  if (name.length < 3 || name.length > 80 || CONTROL.test(name) || !/\p{L}/u.test(name)) errors.name = "Write your full name.";

  const academicId = typeof input.academicId === "string" ? normalizeDigits(input.academicId).replace(/\s+/g, "").toUpperCase() : "";
  if (!/^[A-Z0-9-]{4,20}$/.test(academicId) || !/\d/.test(academicId)) errors.academicId = "Enter your academic ID (numbers only, as on your card).";

  if (!includes(STORE_POSITIONS, input.position)) errors.position = "Choose your position.";
  const committeeValues = STORE_COMMITTEES.map((item) => item.value);
  if (!includes(committeeValues, input.committee)) errors.committee = "Choose your committee.";

  let vestSize: StoreVestSize | null = null;
  if (edition === "full") {
    if (includes(STORE_VEST_SIZES, input.vestSize)) vestSize = input.vestSize;
    else errors.vestSize = "Choose your vest size.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      edition: edition as StoreEdition,
      eligibility,
      name,
      academicId,
      position: input.position as StorePosition,
      committee: input.committee as StoreCommittee,
      vestSize,
    },
  };
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
/** Human-readable, unambiguous code (no 0/O/1/I). `bytes` should be cryptographically random. */
export function reservationCode(bytes: ArrayLike<number>): string {
  let out = "";
  for (let index = 0; index < 5; index += 1) out += CODE_ALPHABET[(bytes[index] ?? 0) % CODE_ALPHABET.length];
  return `ITC-${out}`;
}

export function committeeLabel(value: StoreCommittee): string {
  return STORE_COMMITTEES.find((item) => item.value === value)?.label ?? value;
}

/** What the member still has to send on WhatsApp for this reservation. */
export function reservationAttachments(value: Pick<StoreReservation, "edition" | "eligibility">) {
  const items: Array<{ en: string; ar: string }> = [{ en: "A clear personal photo (for the ID card)", ar: "صورة شخصية واضحة للكارنيه" }];
  if (value.edition === "full") items.push({ en: "Screenshot of your EGP 250 payment", ar: "سكرين دفع الـ250 جنيه" });
  else if (value.eligibility === "already-paid") items.push({ en: "Screenshot of your earlier payment", ar: "سكرين الدفع اللي دفعته قبل كده" });
  return items;
}

export function editionSummary(value: Pick<StoreReservation, "edition" | "eligibility">): string {
  const edition = STORE_EDITIONS[value.edition];
  if (edition.priceEgp) return `${edition.label} — EGP ${edition.priceEgp}`;
  return `${edition.label} — ${value.eligibility ? STORE_ELIGIBILITY[value.eligibility] : "eligibility to confirm"}`;
}

/** Normalises a WhatsApp number to wa.me digits (Egyptian 01… numbers get the 20 prefix). */
export function whatsappDigits(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let digits = normalizeDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^01\d{9}$/.test(digits)) digits = `2${digits}`;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

export function buildReservationWhatsApp(number: string | null, code: string, value: StoreReservation): string | null {
  const digits = whatsappDigits(number);
  if (!digits) return null;
  const lines = [
    `IT Club kit reservation · ${code}`,
    "",
    `Kit: ${editionSummary(value)}`,
    `Name: ${value.name}`,
    `Academic ID: ${value.academicId}`,
    `Position: ${value.position}`,
    `Committee: ${committeeLabel(value.committee)}`,
  ];
  if (value.vestSize) lines.push(`Vest size: ${value.vestSize}`);
  lines.push("", "مرفق مع الرسالة:", ...reservationAttachments(value).map((item, index) => `${index + 1}. ${item.ar}`));
  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/** Column order of the club Google Sheet (see docs/store-reservations-sheet.md). */
export const RESERVATION_SHEET_COLUMNS = [
  "Submitted at",
  "Code",
  "Kit",
  "Eligibility",
  "Price (EGP)",
  "Name",
  "Academic ID",
  "Position",
  "Committee",
  "Vest size",
  "Photo",
  "Payment screenshot",
  "Status",
] as const;

export function reservationSheetRow(code: string, value: StoreReservation, at: Date): string[] {
  const edition = STORE_EDITIONS[value.edition];
  const needsPayment = value.edition === "full" || value.eligibility === "already-paid";
  return [
    at.toISOString(),
    code,
    edition.label,
    value.eligibility ? STORE_ELIGIBILITY[value.eligibility] : "",
    edition.priceEgp ? String(edition.priceEgp) : "",
    value.name,
    // Leading apostrophe keeps long IDs as text in Sheets.
    `'${value.academicId}`,
    value.position,
    committeeLabel(value.committee),
    value.vestSize ?? "",
    "Pending on WhatsApp",
    needsPayment ? "Pending on WhatsApp" : "Not required",
    "Reserved",
  ];
}
