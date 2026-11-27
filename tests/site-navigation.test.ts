import { stackPanelIndex, stackPanelTime } from "../lib/ui/stack-navigation.ts";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ABOUT_HREF,
  SITE_NAV_LINKS,
  isSitePageActive,
} from "../lib/ui/site-navigation.ts";

describe("public section navigation", () => {
  it("About identifies the real home section rather than a standalone page", () => {
    assert.equal(ABOUT_HREF, "/#about");
    assert.equal(
      SITE_NAV_LINKS.find((link) => link.label === "About")?.href,
      ABOUT_HREF,
    );
    assert.equal(
      SITE_NAV_LINKS.some((link) => String(link.href) === "/about"),
      false,
    );
  });
  it("does not mistake section hash links for the active page", () => {
    assert.equal(isSitePageActive("/", ABOUT_HREF), false);
    assert.equal(isSitePageActive("/about", ABOUT_HREF), false);
  });
  it("marks both the index and nested detail route active", () => {
    assert.equal(isSitePageActive("/events", "/events"), true);
    assert.equal(isSitePageActive("/events/workshop", "/events"), true);
    assert.equal(isSitePageActive("/community/person", "/community"), true);
    assert.equal(isSitePageActive("/store", "/store"), true);
  });
  it("does not match unrelated prefixes or protected workspaces", () => {
    assert.equal(isSitePageActive("/events-preview", "/events"), false);
    assert.equal(isSitePageActive("/interview", "/community"), false);
    assert.equal(isSitePageActive("/admin", "/tracks"), false);
    assert.equal(SITE_NAV_LINKS.find((link) => link.label === "Store")?.href, "/store");
  });
});

it("stack keyboard targets select the fully visible requested chapter", () => {
  for (const count of [2, 3, 6, 8]) {
    const duration = count - 1 + 1.04 + 0.72;
    for (let index = 0; index < count; index += 1) {
      const time = stackPanelTime(index, count, duration);
      assert.equal(stackPanelIndex(time, count), index);
      if (index > 0) assert.ok(time >= index + 0.04);
    }
  }
});
