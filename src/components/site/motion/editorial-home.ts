"use client";

import { gsap, motionQueries } from "./gsap";

type MotionMedia = ReturnType<typeof gsap.matchMedia>;

export function setupEditorialHome(root: HTMLElement, media: MotionMedia) {
  const home = root.querySelector<HTMLElement>("[data-editorial-home]");
  if (!home) return;

  media.add(motionQueries.motion, () => {
    const compact = window.matchMedia("(max-width: 800px)").matches;
    const distance = compact ? 58 : 96;
    const hero = home.querySelector<HTMLElement>("[data-editorial-hero]");
    if (hero) {
      const lines = hero.querySelectorAll("[data-editorial-hero-line]");
      const support = hero.querySelector("[data-editorial-hero-support]");
      const action = hero.querySelector("[data-editorial-hero-action]");
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (lines.length) timeline.fromTo(lines, { yPercent: 120, rotation: 3 }, { yPercent: 0, rotation: 0, duration: 1.15, stagger: .12 }, .12);
      if (support) timeline.fromTo(support, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .85 }, .4);
      if (action) timeline.fromTo(action, { scale: .65, opacity: 0, rotation: -18 }, { scale: 1, opacity: 1, rotation: 0, duration: .85 }, .75);

      const film = hero.querySelector("[data-editorial-film]");
      if (film) gsap.fromTo(film, { scale: 1.035, yPercent: 0 }, {
        scale: 1.15, yPercent: 18, ease: "none",
        scrollTrigger: { id: "editorial-hero-film", trigger: hero, start: "top top", end: "bottom top", scrub: .7 },
      });
      const title = hero.querySelector("h1");
      if (title) gsap.fromTo(title, { y: 0, opacity: 1 }, {
        y: compact ? -65 : -135, opacity: 0, ease: "none", immediateRender: false,
        scrollTrigger: { id: "editorial-hero-exit", trigger: hero, start: "top -12%", end: "bottom 14%", scrub: .65 },
      });
    }

    // The CSS baseline is 100% painted. Muting/hiding happens only within this
    // matchMedia context, so no-JS, reduced motion and route cleanup stay readable.
    const statement = home.querySelector<HTMLElement>("[data-editorial-statement]");
    if (statement) {
      const sequence = Array.from(statement.querySelectorAll<HTMLElement>("[data-editorial-word], [data-editorial-chip]"));
      const words = sequence.filter((element) => element.hasAttribute("data-editorial-word"));
      const chips = sequence.filter((element) => element.hasAttribute("data-editorial-chip"));
      const aboutSection = statement.closest<HTMLElement>("[data-editorial-about]");
      const pinStory = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (min-height: 760px)").matches && Boolean(aboutSection);
      gsap.set(words, { "--word-fill": "0%" });
      gsap.set(chips, { opacity: 0, scale: .35, y: 26, rotation: -24, filter: "blur(8px)" });
      const reading = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          id: "editorial-about-reading",
          trigger: pinStory ? aboutSection : statement,
          start: pinStory ? "top top+=106" : "top 85%",
          end: pinStory ? `+=${Math.round(window.innerHeight * .92)}` : "bottom 88%",
          scrub: .55,
          pin: pinStory ? aboutSection : false,
          pinSpacing: pinStory,
          anticipatePin: pinStory ? 1 : 0,
          invalidateOnRefresh: true,
        },
      });
      sequence.forEach((element, index) => {
        const position = index * .18;
        if (element.hasAttribute("data-editorial-word")) {
          // Explicit endpoints survive refresh/invalidation of a scrubbed timeline.
          reading.fromTo(element, { "--word-fill": "0%" }, { "--word-fill": "100%", duration: .28, immediateRender: true }, position);
        } else {
          reading.to(element, {
            opacity: 1, scale: 1, y: 0, rotation: element.textContent === "BATU" ? -8 : 0,
            filter: "blur(0px)", duration: .48, ease: "back.out(1.4)",
          }, position);
        }
      });
    }

    home.querySelectorAll<HTMLElement>("[data-editorial-reveal]").forEach((element, index) => {
      gsap.fromTo(element, { y: distance, opacity: .08, clipPath: "inset(12% 0 0 0)" }, {
        y: 0, opacity: 1, clipPath: "inset(0% 0 0 0)", ease: "power2.out",
        scrollTrigger: {
          id: `editorial-reveal-${index}`, trigger: element,
          start: "top 96%", end: "top 66%", scrub: .6,
        },
      });
    });
    home.querySelectorAll<HTMLElement>("[data-editorial-lift]").forEach((element, index) => {
      gsap.fromTo(element, { y: distance + 30, scale: .92, opacity: .12, rotation: index % 2 ? 2.5 : -2 }, {
        y: 0, scale: 1, opacity: 1, rotation: 0, ease: "power2.out",
        scrollTrigger: {
          id: `editorial-card-lift-${index}`, trigger: element,
          start: "top 99%", end: "top 57%", scrub: .65,
        },
      });
    });
    home.querySelectorAll<HTMLElement>("[data-editorial-symbol]").forEach((element, index) => {
      const trigger = element.closest("section") || element;
      const tilt = index % 2 === 0 ? -12 : 10;
      const drift = gsap.timeline({
        scrollTrigger: {
          id: `editorial-symbol-${index}`, trigger,
          start: "top 94%", end: "bottom 6%", scrub: .8,
        },
      });
      drift.fromTo(element, { y: compact ? 34 : 64, opacity: 0, scale: .8, rotation: tilt }, {
        y: 0, opacity: 1, scale: 1, rotation: 0, duration: .35, ease: "power2.out",
      }, 0);
      drift.to(element, { y: compact ? -18 : -35, rotation: -tilt * .6, duration: .45, ease: "none" }, .35);
      // Decorative symbols depart; information and interactive links never disappear.
      if (element.getAttribute("aria-hidden") === "true" || !element.matches("a, button")) {
        drift.to(element, { y: compact ? -58 : -110, opacity: 0, scale: .85, duration: .2, ease: "power2.in" }, .8);
      }
    });

    const join = home.querySelector<HTMLElement>("[data-editorial-join]");
    const panel = home.querySelector<HTMLElement>("[data-editorial-join-panel]");
    const art = home.querySelector<HTMLElement>("[data-editorial-join-art]");
    if (join && panel) {
      gsap.fromTo(panel, { y: compact ? 88 : 155, scale: .86, opacity: .12, rotation: 3 }, {
        y: 0, scale: 1, opacity: 1, rotation: 0, ease: "power2.out",
        scrollTrigger: { id: "editorial-join-panel", trigger: join, start: "top 94%", end: "top 25%", scrub: .65 },
      });
      if (art) gsap.fromTo(art, { rotation: -25, yPercent: -8, scale: 1.12 }, {
        rotation: 8, yPercent: 15, scale: .9, ease: "none",
        scrollTrigger: { id: "editorial-join-art", trigger: join, start: "top bottom", end: "bottom top", scrub: .9 },
      });
    }
  });
}
