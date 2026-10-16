import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("Tracks Page Partner Branding: CREATIVA Hub & VentureX", () => {
  const partnersDir = path.join(process.cwd(), "public", "images", "partners");

  it("verifies genuine partner logo assets exist locally in public/images/partners/", () => {
    const requiredFiles = [
      "creativa-logo.png",
      "creativa-logo.webp",
      "venturex-logo.png",
      "venturex-logo.webp",
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(partnersDir, file);
      assert.equal(
        fs.existsSync(filePath),
        true,
        `Expected partner logo asset to exist: ${file}`
      );
      const stat = fs.statSync(filePath);
      assert.ok(stat.size > 0, `Asset ${file} must not be empty`);
    }
  });

  it("verifies TrackDetailSection renders exact official partner links and attributes", () => {
    const componentPath = path.join(
      process.cwd(),
      "src",
      "components",
      "interview",
      "Tracks",
      "TrackDetailSection.tsx"
    );
    const content = fs.readFileSync(componentPath, "utf-8");

    // Must feature "BROUGHT TO YOU BY"
    assert.ok(
      content.includes("BROUGHT TO YOU BY"),
      "TrackDetailSection must render 'BROUGHT TO YOU BY'"
    );

    // CREATIVA Hub link, alt, and asset
    assert.ok(
      content.includes('href="https://creativa.gov.eg/"'),
      "CREATIVA Hub must link to https://creativa.gov.eg/"
    );
    assert.ok(
      content.includes('alt="CREATIVA Hub official logo"'),
      "CREATIVA Hub must have alt text 'CREATIVA Hub official logo'"
    );
    assert.ok(
      content.includes("/images/partners/creativa-logo"),
      "CREATIVA Hub must reference local partner logo asset"
    );

    // VentureX link, alt, and asset
    assert.ok(
      content.includes('href="https://www.theventurex.com/"'),
      "VentureX must link to https://www.theventurex.com/"
    );
    assert.ok(
      content.includes('alt="VentureX official logo"'),
      "VentureX must have alt text 'VentureX official logo'"
    );
    assert.ok(
      content.includes("/images/partners/venturex-logo"),
      "VentureX must reference local partner logo asset"
    );

    // Security & Accessibility attributes
    assert.ok(
      content.includes('target="_blank"'),
      "External partner links must open in a new tab"
    );
    assert.ok(
      content.includes('rel="noopener noreferrer"'),
      "External partner links must have rel='noopener noreferrer'"
    );
  });

  it("confirms obsolete partner references are removed from TrackDetailSection and tracks-data", () => {
    const trackDetailPath = path.join(
      process.cwd(),
      "src",
      "components",
      "interview",
      "Tracks",
      "TrackDetailSection.tsx"
    );
    const trackDetailContent = fs.readFileSync(trackDetailPath, "utf-8");

    assert.equal(
      trackDetailContent.includes("track.partner"),
      false,
      "TrackDetailSection must not reference obsolete track.partner"
    );

    const tracksDataPath = path.join(
      process.cwd(),
      "src",
      "components",
      "interview",
      "Tracks",
      "tracks-data.ts"
    );
    const tracksDataContent = fs.readFileSync(tracksDataPath, "utf-8");

    assert.equal(
      tracksDataContent.includes("wrkr.space"),
      false,
      "tracks-data must not contain obsolete wrkr references"
    );
    assert.equal(
      tracksDataContent.includes("icealex.com"),
      false,
      "tracks-data must not contain obsolete icealex references"
    );
  });
});
