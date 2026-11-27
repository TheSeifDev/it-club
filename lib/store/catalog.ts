export const STORE_BUNDLE_PRICE_EGP = 250;
export const STORE_CONTACT_EMAIL = "contact@itclub.one";

export type StoreSelection = {
  bundleQuantity: number;
  badgeOnlyQuantity: number;
  eligibility?: "already-paid" | "main-board" | null;
  sizePreference?: string;
  requesterName?: string;
};

export type StoreQuote = {
  bundleQuantity: number;
  badgeOnlyQuantity: number;
  confirmedSubtotalEgp: number;
  hasUnpricedItems: boolean;
  needsTeamConfirmation: boolean;
  total: number | null;
};

function safeQuantity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(20, Math.max(0, Math.trunc(value)));
}

export function quoteStoreSelection(selection: StoreSelection): StoreQuote {
  const bundleQuantity = safeQuantity(selection.bundleQuantity);
  const badgeOnlyQuantity = safeQuantity(selection.badgeOnlyQuantity);
  const confirmedSubtotalEgp = bundleQuantity * STORE_BUNDLE_PRICE_EGP;
  const hasUnpricedItems = badgeOnlyQuantity > 0;
  return {
    bundleQuantity,
    badgeOnlyQuantity,
    confirmedSubtotalEgp,
    hasUnpricedItems,
    needsTeamConfirmation: bundleQuantity > 0 || hasUnpricedItems,
    total: hasUnpricedItems ? null : confirmedSubtotalEgp,
  };
}

export function buildStoreOrderMailto(selection: StoreSelection): string | null {
  const quote = quoteStoreSelection(selection);
  if (!quote.needsTeamConfirmation) return null;
  const eligibility =
    selection.eligibility === "main-board"
      ? "Main Board"
      : selection.eligibility === "already-paid"
        ? "Already paid"
        : null;
  if (quote.badgeOnlyQuantity > 0 && !eligibility) return null;
  const lines = ["Hello IT Club team,", "", "I would like to request these store items:"];
  if (quote.bundleQuantity > 0) {
    lines.push(
      `- Vest + IT Club ID card + lanyard: ${quote.bundleQuantity} × EGP ${STORE_BUNDLE_PRICE_EGP}`,
    );
  }
  if (quote.badgeOnlyQuantity > 0) {
    lines.push(
      `- ID card + lanyard only (${eligibility}): ${quote.badgeOnlyQuantity} × price to confirm`,
    );
  }
  const sizePreference = selection.sizePreference?.trim().slice(0, 80);
  if (sizePreference) lines.push(`Vest size preference: ${sizePreference}`);
  const requesterName = selection.requesterName?.trim().slice(0, 120);
  if (requesterName) lines.push(`Name: ${requesterName}`);
  lines.push(
    "",
    "Please confirm ID-only pricing (if applicable), size availability, and collection/payment details. This email is a request, not a confirmed order or payment.",
  );
  const params = new URLSearchParams({
    subject: "IT Club store order request",
    body: lines.join("\n"),
  });
  return `mailto:${STORE_CONTACT_EMAIL}?${params.toString()}`;
}
