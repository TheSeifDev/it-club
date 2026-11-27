import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildStoreOrderMailto,
  quoteStoreSelection,
  STORE_BUNDLE_PRICE_EGP,
  STORE_CONTACT_EMAIL,
} from "../lib/store/catalog.ts";

describe("IT Club store request catalog", () => {
  it("uses the approved EGP bundle price and never assigns a price to ID-only", () => {
    assert.equal(STORE_BUNDLE_PRICE_EGP, 250);
    const bundle = quoteStoreSelection({ bundleQuantity: 2, badgeOnlyQuantity: 0 });
    assert.equal(bundle.confirmedSubtotalEgp, 500);
    assert.equal(bundle.total, 500);
    const badgeOnly = quoteStoreSelection({ bundleQuantity: 0, badgeOnlyQuantity: 1 });
    assert.equal(badgeOnly.hasUnpricedItems, true);
    assert.equal(badgeOnly.total, null);
    assert.equal(badgeOnly.confirmedSubtotalEgp, 0);
  });

  it("keeps a mixed request subtotal explicit while ID-only remains unpriced", () => {
    const quote = quoteStoreSelection({ bundleQuantity: 1, badgeOnlyQuantity: 2 });
    assert.equal(quote.confirmedSubtotalEgp, 250);
    assert.equal(quote.total, null);
    assert.equal(quote.needsTeamConfirmation, true);
  });

  it("bounds quantities and ignores invalid numbers", () => {
    assert.equal(quoteStoreSelection({ bundleQuantity: 30, badgeOnlyQuantity: -2 }).bundleQuantity, 20);
    assert.equal(quoteStoreSelection({ bundleQuantity: Number.NaN, badgeOnlyQuantity: Number.POSITIVE_INFINITY }).needsTeamConfirmation, false);
  });

  it("prepares a user-reviewed order inquiry without claiming checkout or sending it", () => {
    const url = buildStoreOrderMailto({
      bundleQuantity: 1,
      badgeOnlyQuantity: 1,
      eligibility: "main-board",
      sizePreference: "Large",
      requesterName: "Student Example",
    });
    assert.ok(url?.startsWith(`mailto:${STORE_CONTACT_EMAIL}?`));
    const parsed = new URL(url!);
    const body = parsed.searchParams.get("body") ?? "";
    assert.match(body, /EGP 250/);
    assert.match(body, /Main Board/);
    assert.match(body, /price to confirm/);
    assert.match(body, /Vest size preference: Large/);
    assert.match(body, /not a confirmed order or payment/);
  });

  it("requires explicit eligibility for an ID-only inquiry", () => {
    assert.equal(
      buildStoreOrderMailto({ bundleQuantity: 0, badgeOnlyQuantity: 1 }),
      null,
    );
    assert.ok(
      buildStoreOrderMailto({
        bundleQuantity: 0,
        badgeOnlyQuantity: 1,
        eligibility: "already-paid",
      }),
    );
  });

  it("returns no request link until at least one item is selected", () => {
    assert.equal(buildStoreOrderMailto({ bundleQuantity: 0, badgeOnlyQuantity: 0 }), null);
  });
});
