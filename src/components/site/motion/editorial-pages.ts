"use client";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { gsap, motionQueries, ScrollTrigger } from "./gsap";

type MotionMedia = ReturnType<typeof gsap.matchMedia>;
type Cleanup = () => void;

if (typeof window !== "undefined") gsap.registerPlugin(Draggable, InertiaPlugin);

const all = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));

/**
 * Shared choreography for the editorial inner pages. Every effect is opt-in via
 * data attributes and starts from the readable SSR state, so no-JS and
 * reduced-motion visitors always see finished, static content.
 */

/** Hero titles: characters rise out of their line masks, inline tiles open. */
function kineticTitles(page: HTMLElement) {
  all(page, "[data-k-title]").forEach((title) => {
    const chars = all(title, "[data-k-char]");
    const tiles = all(title, "[data-k-tile]");
    const support = all(page, "[data-k-fade]");
    const tl = gsap.timeline({ delay: .32, defaults: { ease: "expo.out" } });
    if (chars.length) tl.fromTo(chars, { yPercent: 118, rotation: 7 }, { yPercent: 0, rotation: 0, duration: 1.25, stagger: { each: .028 } }, 0);
    tiles.forEach((tile) => {
      const width = tile.offsetWidth;
      if (width) tl.fromTo(tile, { width: 0, opacity: 0 }, { width, opacity: 1, duration: 1.2, ease: "expo.inOut", clearProps: "width" }, .35);
    });
    if (support.length) tl.fromTo(support, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .07, ease: "power3.out" }, .55);
  });
}

/** Lines inside [data-k-spread] drift apart while the hero scrolls away. */
function spreadLines(page: HTMLElement) {
  all(page, "[data-k-spread]").forEach((hero) => {
    const sides = all(hero, "[data-k-side]");
    if (!sides.length) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: .7 } });
    sides.forEach((side) => {
      const dir = side.dataset.kSide === "r" ? 1 : -1;
      tl.to(side, { xPercent: dir * 14, opacity: .15, ease: "none" }, 0);
    });
    const sink = all(hero, "[data-k-sink]");
    if (sink.length) tl.to(sink, { yPercent: 30, scale: 1.08, ease: "none" }, 0);
  });
}

/** Infinite marquees whose speed and direction follow scroll velocity. */
function velocityMarquees(page: HTMLElement): Cleanup {
  const rows = all(page, "[data-v-marquee]");
  if (!rows.length) return () => undefined;
  const states = rows.map((row) => {
    const track = row.querySelector<HTMLElement>("[data-v-track]");
    const base = Number(row.dataset.speed ?? 1) * (row.dataset.dir === "r" ? 1 : -1);
    if (track) gsap.set(track, { translate: "none", xPercent: row.dataset.dir === "r" ? -50 : 0 });
    return { row, track, base, x: row.dataset.dir === "r" ? -50 : 0, skew: track ? gsap.quickTo(track, "skewX", { duration: .5, ease: "power3.out" }) : undefined };
  });
  let boost = 0;
  let direction = 1;
  const watcher = ScrollTrigger.create({
    trigger: page, start: "top bottom", end: "bottom top",
    onUpdate: (self) => {
      const velocity = self.getVelocity();
      direction = self.direction;
      boost = Math.min(9, Math.abs(velocity) / 220);
      states.forEach(({ skew }) => skew?.(gsap.utils.clamp(-7, 7, velocity / -420)));
    },
  });
  const tick = () => {
    const delta = gsap.ticker.deltaRatio(60);
    boost *= .93;
    states.forEach((state) => {
      if (!state.track) return;
      state.x += state.base * .022 * delta * (1 + boost) * direction;
      if (state.x <= -50) state.x += 50;
      if (state.x > 0) state.x -= 50;
      gsap.set(state.track, { xPercent: state.x });
    });
  };
  gsap.ticker.add(tick);
  return () => { gsap.ticker.remove(tick); watcher.kill(); };
}

/** Media frames open from a clip mask while the image inside settles. */
function clipReveals(page: HTMLElement) {
  all(page, "[data-clip]").forEach((frame) => {
    const inner = frame.querySelector<HTMLElement>("[data-clip-inner]");
    const from = frame.dataset.clip === "side" ? "inset(0% 100% 0% 0% round 14px)" : "inset(100% 0% 0% 0% round 14px)";
    gsap.timeline({ scrollTrigger: { trigger: frame, start: "top 88%", once: true } })
      .fromTo(frame, { clipPath: from }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.4, ease: "expo.inOut", clearProps: "clipPath" }, 0)
      .fromTo(inner, { scale: 1.28 }, { scale: 1, duration: 1.8, ease: "expo.out" }, .1);
  });
}

/** Scrubbed vertical drift. data-parallax="-0.2" etc (fraction of own height). */
function parallax(page: HTMLElement) {
  all(page, "[data-parallax]").forEach((element) => {
    const amount = Number(element.dataset.parallax || .15) * 100;
    gsap.set(element, { translate: "none" });
    gsap.fromTo(element, { yPercent: -amount }, { yPercent: amount, ease: "none", scrollTrigger: { trigger: element.closest("section") ?? element, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/** One-shot rises for rows/blocks; grouped siblings stagger. */
function rises(page: HTMLElement, compact: boolean) {
  all(page, "[data-rise-group]").forEach((group) => {
    const items = all(group, "[data-rise]");
    if (!items.length) return;
    gsap.fromTo(items, { y: compact ? 44 : 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: .08, ease: "power3.out", scrollTrigger: { trigger: group, start: "top 86%", once: true } });
  });
  all(page, "[data-rise]").filter((element) => !element.closest("[data-rise-group]")).forEach((element) => {
    gsap.fromTo(element, { y: compact ? 44 : 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 90%", once: true } });
  });
  all(page, "[data-line-mask]").forEach((block) => {
    const lines = all(block, "[data-line]");
    gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.15, stagger: .09, ease: "expo.out", scrollTrigger: { trigger: block, start: "top 86%", once: true } });
  });
}

/** Large outlined words that fill with ink as they cross the viewport. */
function fillText(page: HTMLElement) {
  all(page, "[data-fill]").forEach((element) => {
    gsap.fromTo(element, { "--fill": "0%" }, { "--fill": "100%", ease: "none", scrollTrigger: { trigger: element, start: "top 85%", end: "bottom 40%", scrub: .6 } });
  });
}

/** Count-up numerals. */
function counters(page: HTMLElement) {
  all(page, "[data-count]").forEach((element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    const pad = Number(element.dataset.countPad ?? 2);
    const state = { value: 0 };
    const render = () => { element.textContent = String(Math.round(state.value)).padStart(pad, "0"); };
    gsap.to(state, { value: target, duration: 1.8, ease: "power3.out", onUpdate: render, scrollTrigger: { trigger: element, start: "top 92%", once: true, onEnter: render } });
  });
}

/** Page tint follows the chapter in view (Tracks colour chapters). */
function tints(page: HTMLElement) {
  const scope = page.querySelector<HTMLElement>("[data-tint-scope]") ?? page;
  const sections = all(page, "[data-tint]");
  if (!sections.length) return () => undefined;
  const base = getComputedStyle(scope).getPropertyValue("--tint").trim() || "#28cdb7";
  const to = (color: string) => gsap.to(scope, { "--tint": color, duration: .9, ease: "power2.out", overwrite: true });
  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section, start: "top 55%", end: "bottom 45%",
      onToggle: (self) => { if (self.isActive) to(section.dataset.tint || base); },
    });
  });
  return () => gsap.set(scope, { clearProps: "--tint" });
}

/** Sticky stacked cards: each one tucks back as the next slides over it. */
function stacks(page: HTMLElement) {
  if (!window.matchMedia("(min-width: 900px) and (min-height: 640px)").matches) return;
  all(page, "[data-stack]").forEach((stack) => {
    const cards = all(stack, "[data-stack-card]");
    cards.forEach((card, index) => {
      const next = cards[index + 1];
      const body = card.querySelector<HTMLElement>("[data-stack-body]") ?? card;
      if (next) {
        gsap.fromTo(body, { scale: 1, filter: "brightness(1)" }, {
          scale: .9, filter: "brightness(.45)", ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true },
        });
      }
      const photo = card.querySelector<HTMLElement>("[data-stack-photo]");
      if (photo) gsap.fromTo(photo, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });
}

/** Elements that rotate with page scroll (partners × mark). */
function spins(page: HTMLElement) {
  all(page, "[data-spin]").forEach((element) => {
    gsap.fromTo(element, { rotation: 0 }, { rotation: Number(element.dataset.spin || 180), ease: "none", scrollTrigger: { trigger: element.closest("section") ?? element, start: "top bottom", end: "bottom top", scrub: .8 } });
  });
}

/** Printed photos drop onto the table; on fine pointers they can be thrown around. */
function printTables(page: HTMLElement, finePointer: boolean): Cleanup {
  const cleanups: Cleanup[] = [];
  all(page, "[data-print-table]").forEach((table) => {
    const prints = all(table, "[data-print]");
    prints.forEach((print) => gsap.set(print, { rotation: Number(print.dataset.rotate ?? 0) }));
    gsap.fromTo(prints, { y: -window.innerHeight * .6, opacity: 0, rotation: (index: number) => Number(prints[index].dataset.rotate ?? 0) * 3.2 }, {
      y: 0, opacity: 1, rotation: (index: number) => Number(prints[index].dataset.rotate ?? 0),
      duration: 1.2, ease: "back.out(1.15)", stagger: { each: .12, from: "random" },
      scrollTrigger: { trigger: table, start: "top 72%", once: true },
    });
    if (!finePointer) return;
    let z = prints.length + 1;
    const draggables = Draggable.create(prints, {
      type: "x,y", bounds: table, inertia: true, edgeResistance: .7, zIndexBoost: false,
      onPress() { z += 1; gsap.set(this.target, { zIndex: z }); gsap.to(this.target, { scale: 1.04, boxShadow: "0 40px 80px rgb(0 0 0 / .55)", duration: .25 }); },
      onRelease() { gsap.to(this.target, { scale: 1, boxShadow: "0 18px 40px rgb(0 0 0 / .45)", duration: .4 }); },
      onDrag() { gsap.to(this.target, { rotation: gsap.utils.clamp(-14, 14, this.deltaX * .6), duration: .4, overwrite: "auto" }); },
    });
    table.dataset.printReady = "true";
    cleanups.push(() => { draggables.forEach((draggable) => draggable.kill()); delete table.dataset.printReady; });
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}

export function setupEditorialPages(root: HTMLElement, media: MotionMedia) {
  const page = root.querySelector<HTMLElement>("[data-editorial-page]");
  if (!page) return;
  media.add({ motion: motionQueries.motion, fine: motionQueries.finePointer }, (context) => {
    if (!context.conditions?.motion) return;
    const compact = window.matchMedia("(max-width: 800px)").matches;
    kineticTitles(page);
    spreadLines(page);
    const cleanups: Cleanup[] = [velocityMarquees(page)];
    clipReveals(page);
    parallax(page);
    rises(page, compact);
    fillText(page);
    counters(page);
    cleanups.push(tints(page));
    stacks(page);
    spins(page);
    cleanups.push(printTables(page, Boolean(context.conditions?.fine)));
    ScrollTrigger.refresh();
    return () => cleanups.forEach((cleanup) => cleanup());
  });
}
