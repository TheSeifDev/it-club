import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPublicTransitionPath,
  publicTransitionTarget,
  transitionHoneycomb,
  transitionLabel,
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
      "/store",
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
  it("uses prominent hex blocks on ordinary desktop and mobile screens", () => {
    assert.ok(transitionHoneycomb(390, 844).radius >= 24);
    assert.ok(transitionHoneycomb(1440, 900).radius >= 44);
    assert.ok(transitionHoneycomb(1920, 1080).radius >= 50);
    assert.ok(transitionHoneycomb(3840, 2160).radius <= 73);
  });
  it("bounds tile count and staggers a radial wave from the top-centre", () => {
    for (const [width, height] of [
      [1920, 1080],
      [390, 844],
      [768, 1024],
      [3840, 2160],
      [320, 4000],
    ]) {
      const { radius, tiles } = transitionHoneycomb(width, height);
      assert.ok(
        tiles.length > 10 && tiles.length < 2000,
        `${width}x${height}: ${tiles.length}`,
      );
      assert.ok(radius >= 24);
      assert.ok(
        tiles.every(
          (tile) =>
            Number.isFinite(tile.x + tile.y + tile.delay) &&
            tile.delay >= 0 &&
            tile.delay <= 0.62,
        ),
      );
      const nearest = tiles.reduce((best, tile) =>
        Math.hypot(tile.x - width / 2, tile.y) <
        Math.hypot(best.x - width / 2, best.y)
          ? tile
          : best,
      );
      assert.ok(nearest.delay < 0.05, `${width}x${height}: origin delay`);
      assert.ok(Math.max(...tiles.map((tile) => tile.delay)) > 0.5);
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
  it("names the destination page on the covered screen", () => {
    assert.deepEqual(transitionLabel("/community"), { label: "Community", arabic: "المجتمع" });
    assert.equal(transitionLabel("/sponsors?x=1").label, "Partners");
    assert.equal(transitionLabel("/events/hackathon").label, "Events");
    assert.equal(transitionLabel("/").label, "Home");
    assert.equal(transitionLabel("/#about").label, "Home");
    assert.equal(transitionLabel("/pages/legal").label, "IT Club");
  });
});
