import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTrackTheme } from "../lib/ui/track-theme.ts";
import { IT_CLUB_TRACKS } from "../src/components/interview/Tracks/tracks-data.ts";

const luminance = (hex: string) =>
  [1, 3, 5]
    .map((start) => {
      const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );

describe("canonical track identity", () => {
  it("keeps every original committee hue and Arabic heading", () => {
    for (const track of IT_CLUB_TRACKS) {
      const theme = getTrackTheme(track.id);
      assert.equal(theme.color, track.color);
      assert.equal(theme.arabic, track.arabicTitle);
      assert.equal(getTrackTheme(track.title).color, track.color);
      assert.equal(getTrackTheme(track.arabicTitle).color, track.color);
      for (const alias of track.anchorIds)
        assert.equal(getTrackTheme(alias).color, track.color);
    }
  });

  it("uses a readable shade on portfolio Paper without changing the bright swatch", () => {
    for (const track of IT_CLUB_TRACKS) {
      const theme = getTrackTheme(track.id);
      const contrast =
        (luminance("#f3f4f6") + 0.05) / (luminance(theme.ink) + 0.05);
      assert.ok(contrast >= 4.5, `${track.id}: ${contrast}`);
      assert.equal(theme.color, track.color);
    }
  });

  it("keeps active filter labels readable against every original bright hue", () => {
    for (const track of IT_CLUB_TRACKS) {
      const contrast =
        (luminance(track.color) + 0.05) / (luminance("#0a0d12") + 0.05);
      assert.ok(contrast >= 4.5, `${track.id}: ${contrast}`);
    }
  });

  it("normalizes R&D and keeps unknown future content on the club Teal accent", () => {
    assert.equal(getTrackTheme("R&D").color, getTrackTheme("rnd").color);
    assert.equal(getTrackTheme("research-and-development").short, "R&D");
    assert.equal(getTrackTheme("new-committee").color, "#28cdb7");
    assert.equal(getTrackTheme().short, "CLUB");
  });

  it("uses readable Logo Teal ink on Paper without collapsing committee colors", () => {
    const brand = getTrackTheme("IT Club");
    assert.equal(brand.rgb, "40, 205, 183");
    const contrast =
      (luminance("#f3f4f6") + 0.05) / (luminance(brand.ink) + 0.05);
    assert.ok(contrast >= 4.5, `Logo Teal: ${contrast}`);
    assert.notEqual(brand.color, getTrackTheme("hr").color);
    assert.notEqual(brand.color, getTrackTheme("it").color);
  });
});
