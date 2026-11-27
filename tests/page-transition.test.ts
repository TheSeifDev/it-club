import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPublicTransitionPath,
  publicTransitionTarget,
  transitionHoneycomb,
  transitionStartsAtTop,
} from "../lib/ui/page-transition.ts";

const basic = {
  href: "/tracks",
  currentHref: "https://itclub.test/",
  sourcePublic: true,
};

describe("public visual page transitions", () => {
  it("only covers the showcase route set and nested content", () => {
    for (const path of [
      "/",
      "/about",
      "/tracks",
      "/events",
      "/community/person",
      "/events/workshop",
      "/pages/club",
      "/alumni",
      "/contact",
      "/privacy",
      "/terms",
    ]) {
      assert.equal(isPublicTransitionPath(path), true, path);
    }
    for (const path of [
      "/admin",
      "/admin/site",
      "/interview/login",
      "/student",
      "/auth/callback",
      "/api/health",
      "/register",
      "/tracks-preview",
      "/pages/club/private",
      "/logo.webp",
    ]) {
      assert.equal(isPublicTransitionPath(path), false, path);
      assert.equal(
        publicTransitionTarget({ ...basic, href: path }),
        null,
        path,
      );
      assert.equal(
        publicTransitionTarget({
          ...basic,
          currentHref: `https://itclub.test${path}`,
        }),
        null,
        path,
      );
    }
  });
  it("preserves the destination query/hash for cross-page links", () => {
    assert.equal(publicTransitionTarget(basic), "/tracks");
    assert.equal(
      publicTransitionTarget({
        ...basic,
        href: "/#about",
        currentHref: "https://itclub.test/tracks",
      }),
      "/#about",
    );
    assert.equal(
      publicTransitionTarget({ ...basic, href: "/events?type=workshop#next" }),
      "/events?type=workshop#next",
    );
  });
  it("leaves same-page anchors and query updates native", () => {
    for (const href of ["#about", "/#about", "/?view=next", "/"]) {
      assert.equal(publicTransitionTarget({ ...basic, href }), null);
    }
  });
  it("does not hijack modified clicks, target/download, reduced motion or non-site links", () => {
    for (const override of [
      { metaKey: true },
      { ctrlKey: true },
      { shiftKey: true },
      { altKey: true },
      { button: 1 },
      { defaultPrevented: true },
      { download: true },
      { target: "_blank" },
      { sourcePublic: false },
      { reducedMotion: true },
      { href: "https://outside.test/tracks" },
      { href: "mailto:club@test.com" },
      { href: "tel:1234" },
      { href: "javascript:void(0)" },
    ])
      assert.equal(
        publicTransitionTarget({ ...basic, ...override }),
        null,
        JSON.stringify(override),
      );
    assert.equal(
      publicTransitionTarget({ ...basic, target: "_self" }),
      "/tracks",
    );
  });
  it("resets ordinary destinations but preserves cross-page section anchors", () => {
    for (const href of [
      "/tracks",
      "/community",
      "/events?type=workshop",
      "/",
    ]) {
      assert.equal(transitionStartsAtTop(href), true, href);
    }
    for (const href of [
      "/#about",
      "/tracks#hr",
      "/events?type=workshop#next",
    ]) {
      assert.equal(transitionStartsAtTop(href), false, href);
    }
  });
  it("uses very small shapes on ordinary desktop and mobile screens", () => {
    assert.ok(transitionHoneycomb(390, 844).radius <= 10);
    assert.ok(transitionHoneycomb(1440, 900).radius <= 15);
    assert.ok(transitionHoneycomb(1920, 1080).radius <= 19);
  });
  it("bounds tile count and staggers top-to-bottom at all viewport sizes", () => {
    for (const [width, height] of [
      [1920, 1080],
      [390, 844],
      [768, 1024],
      [3840, 2160],
      [320, 4000],
    ]) {
      const { radius, tiles } = transitionHoneycomb(width, height);
      assert.ok(
        tiles.length > 10 && tiles.length < 3300,
        `${width}x${height}: ${tiles.length}`,
      );
      assert.ok(radius >= 9);
      assert.ok(
        tiles.every(
          (tile) =>
            Number.isFinite(tile.x + tile.y + tile.delay) && tile.delay >= 0,
        ),
      );
      const bands = new Set(tiles.map((tile) => tile.band));
      assert.ok(
        bands.size <= 38,
        `${width}x${height}: ${bands.size} animated bands`,
      );
      for (const band of bands) {
        assert.equal(
          new Set(
            tiles
              .filter((tile) => tile.band === band)
              .map((tile) => tile.delay),
          ).size,
          1,
        );
      }
      const firstColumn = tiles.filter((tile) => tile.x === 0);
      for (let i = 1; i < firstColumn.length; i += 1)
        assert.ok(firstColumn[i].delay >= firstColumn[i - 1].delay);
      assert.ok(Math.max(...tiles.map((tile) => tile.x)) >= width);
      assert.ok(Math.max(...tiles.map((tile) => tile.y)) >= height);
    }
  });
  it("keeps invalid/zero viewport geometry finite", () => {
    for (const [width, height] of [
      [0, 0],
      [-10, -20],
      [NaN, Infinity],
    ]) {
      const { radius, tiles } = transitionHoneycomb(width, height);
      assert.ok(Number.isFinite(radius));
      assert.ok(
        tiles.every((tile) => Number.isFinite(tile.x + tile.y + tile.delay)),
      );
    }
  });
});
