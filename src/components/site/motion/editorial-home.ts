"use client";

import { gsap, motionQueries } from "./gsap";
import { measureAboutWordLayoutStates } from "./about-layout";

type MotionMedia = ReturnType<typeof gsap.matchMedia>;

export function setupEditorialHome(root: HTMLElement, media: MotionMedia) {
  const home = root.querySelector<HTMLElement>("[data-editorial-home]");
  if (!home) return;

  media.add({
    motion: motionQueries.motion,
    compact: "(max-width: 800px)",
    mobile: "(max-width: 520px)",
    pinned: motionQueries.stage,
  }, (context) => {
    if (!context.conditions?.motion) return;
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
      const layoutStates = measureAboutWordLayoutStates(statement);
      const hasLayoutStates = layoutStates.length === chips.length + 1 && layoutStates.every((state) => state.length === words.length);
      const aboutSection = statement.closest<HTMLElement>("[data-editorial-about]");
      const pinStory = window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (min-height: 760px)").matches && Boolean(aboutSection);
      const depthTile = aboutSection?.querySelector<HTMLElement>('[data-about-depth="tile"]');
      const depthSeal = aboutSection?.querySelector<HTMLElement>('[data-about-depth="seal"]');
      if (depthTile) gsap.set(depthTile, { transformPerspective: 1000, transformStyle: "preserve-3d" });
      if (depthSeal) gsap.set(depthSeal, { transformPerspective: 850, transformStyle: "preserve-3d" });
      if (hasLayoutStates) {
        layoutStates[0].forEach(({ element, x, y }) => gsap.set(element, { x, y }));
      }
      gsap.set(words, { "--word-fill": "0%" });
      gsap.set(chips, { transformPerspective: 1000, transformStyle: "preserve-3d", backfaceVisibility: "hidden", opacity: 0, scale: .48, y: 25, z: -150, rotationX: -36, rotationY: 34, rotation: -16 });
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
      if (hasLayoutStates) {
        const openingPositions = chips.map((chip) => sequence.indexOf(chip) * .18);
        for (let stateIndex = 1; stateIndex < layoutStates.length; stateIndex += 1) {
          const previousState = layoutStates[stateIndex - 1];
          const nextState = layoutStates[stateIndex];
          previousState.forEach((from, wordIndex) => {
            const to = nextState[wordIndex];
            if (Math.abs(from.x - to.x) < .5 && Math.abs(from.y - to.y) < .5) return;
            reading.fromTo(from.element, { x: from.x, y: from.y }, {
              x: to.x, y: to.y, duration: .56, ease: "power2.out", immediateRender: false,
            }, openingPositions[stateIndex - 1]);
          });
        }
      }
      if (depthTile) {
        reading.fromTo(depthTile,
          { opacity: 0, x: -34, y: 62, z: -260, rotationX: -42, rotationY: 52, rotationZ: -43, scale: .58 },
          { opacity: .88, x: 0, y: -7, z: 75, rotationX: 0, rotationY: 0, rotationZ: -24, scale: 1, duration: .82, ease: "power2.out" },
          .18,
        );
      }
      sequence.forEach((element, index) => {
        const position = index * .18;
        if (element.hasAttribute("data-editorial-word")) {
          // Explicit endpoints survive refresh/invalidation of a scrubbed timeline.
          reading.fromTo(element, { "--word-fill": "0%" }, { "--word-fill": "100%", duration: .28, immediateRender: true }, position);
        } else {
          reading.fromTo(element,
            { opacity: 0, scale: .48, y: 25, z: -150, rotationX: -36, rotationY: 34, rotationZ: -16 },
            { opacity: 1, scale: 1, y: 0, z: 20, rotationX: 0, rotationY: 0, rotationZ: element.textContent === "BATU" ? -8 : 0, duration: .56, ease: "power2.out" },
            position,
          );
        }
      });
      if (depthSeal) {
        reading.fromTo(depthSeal,
          { opacity: 0, y: 22, z: -170, rotationX: -62, rotationY: 38, scale: .62 },
          { opacity: 1, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, duration: .7, ease: "power2.out" },
          Math.max(.4, sequence.length * .18 - 1.05),
        );
      }
    }

    home.querySelectorAll<HTMLElement>("[data-editorial-reveal]").forEach((element, index) => {
      gsap.fromTo(element, { y: distance, opacity: .08 }, {
        y: 0, opacity: 1, ease: "power2.out",
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
      if (element.hasAttribute("data-about-depth")) return;
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

    // Word wrapping changes the premeasured FLIP states. Rebuild only after width
    // changes settle, not on scroll or mobile browser URL-bar height changes.
    let aboutWidth = statement?.clientWidth ?? 0;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = statement && typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      const nextWidth = statement.clientWidth;
      if (!nextWidth || nextWidth === aboutWidth) return;
      aboutWidth = nextWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => gsap.matchMediaRefresh(), 160);
    }) : undefined;
    if (statement) observer?.observe(statement);
    return () => {
      observer?.disconnect();
      clearTimeout(resizeTimer);
    };
  });
}
