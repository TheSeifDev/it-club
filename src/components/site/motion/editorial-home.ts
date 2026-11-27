"use client";

import { gsap, motionQueries, ScrollTrigger } from "./gsap";
import { measureAboutWordLayoutStates } from "./about-layout";
import { PRELOADER_EVENT } from "../HomePreloader";

type MotionMedia = ReturnType<typeof gsap.matchMedia>;

/** Source film aspect (1344×768) and the centre of the club object within it. */
const FILM_ASPECT = 1344 / 768;
const FILM_POSITION_X = .64;
const OBJECT_X = .65;
const OBJECT_Y = .5;
const OBJECT_HEIGHT = .7;

type TileGeometry = { top: number; right: number; bottom: number; left: number; radius: number; x: number; y: number; scale: number };

function measureTile(sticky: HTMLElement, tile: HTMLElement): TileGeometry {
  const stage = sticky.getBoundingClientRect();
  const rect = tile.getBoundingClientRect();
  const width = stage.width || window.innerWidth;
  const height = stage.height || window.innerHeight;
  const top = rect.top - stage.top;
  const left = rect.left - stage.left;
  const renderedWidth = Math.max(width, height * FILM_ASPECT);
  const renderedHeight = renderedWidth / FILM_ASPECT;
  const objectX = (width - renderedWidth) * FILM_POSITION_X + OBJECT_X * renderedWidth;
  const objectY = (height - renderedHeight) * .5 + OBJECT_Y * renderedHeight;
  const scale = Math.min(1, Math.max(.08, (rect.height * 1.18) / (OBJECT_HEIGHT * renderedHeight)));
  return {
    top,
    left,
    right: width - (left + rect.width),
    bottom: height - (top + rect.height),
    radius: rect.height * .1,
    scale,
    x: left + rect.width / 2 - scale * objectX,
    y: top + rect.height / 2 - scale * objectY,
  };
}

const inset = (g: TileGeometry) => `inset(${g.top}px ${g.right}px ${g.bottom}px ${g.left}px round ${g.radius}px)`;

function scrollToY(top: number) {
  if (window.__siteLenis) window.__siteLenis.scrollTo(top, { immediate: true, force: true });
  else window.scrollTo({ top, behavior: "instant" });
}

function setupHero(home: HTMLElement, compact: boolean) {
  const hero = home.querySelector<HTMLElement>("[data-editorial-hero]");
  if (!hero) return () => undefined;
  const sticky = hero.querySelector<HTMLElement>("[data-hero-sticky]");
  const film = hero.querySelector<HTMLElement>("[data-editorial-film]");
  const media = hero.querySelector<HTMLElement>("[data-hero-media]");
  const shade = hero.querySelector<HTMLElement>("[data-hero-shade]");
  const tile = hero.querySelector<HTMLElement>("[data-hero-tile]");
  const left = hero.querySelector<HTMLElement>('[data-hero-word="left"]');
  const right = hero.querySelector<HTMLElement>('[data-hero-word="right"]');
  const lines = hero.querySelectorAll<HTMLElement>("[data-editorial-hero-line]");
  const supports = hero.querySelectorAll<HTMLElement>("[data-editorial-hero-support]");
  const action = hero.querySelector<HTMLElement>("[data-editorial-hero-action]");
  const scrollCue = hero.querySelector<HTMLElement>("[data-hero-scroll]");
  const statementLines = hero.querySelectorAll<HTMLElement>("[data-hero-statement-line]");
  const video = hero.querySelector<HTMLElement>("[data-editorial-video]");
  const rotator = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-rotator-line]"));

  // Entrance, held until the session preloader lifts.
  const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
  if (lines.length) intro.fromTo(lines, { yPercent: 115, rotation: 4 }, { yPercent: 0, rotation: 0, duration: 1.4, stagger: .1 }, .05);
  if (video) intro.fromTo(video, { scale: 1.28, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.9 }, 0);
  if (supports.length) intro.fromTo(supports, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: .08, ease: "power3.out" }, .45);
  if (action) intro.fromTo(action, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, .6);
  if (scrollCue) intro.fromTo(scrollCue.querySelector("i"), { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power3.inOut", repeat: -1, repeatDelay: .6, yoyo: true }, 1);
  const preloading = document.documentElement.classList.contains("itc-preloading");
  const play = () => intro.play();
  if (preloading) window.addEventListener(PRELOADER_EVENT, play, { once: true });
  else intro.play();

  if (rotator.length > 1) {
    gsap.set(rotator, { translate: "none", y: 0, yPercent: (index: number) => index === 0 ? 0 : 105 });
    const cycle = gsap.timeline({ repeat: -1, delay: 2.4 });
    rotator.forEach((line, index) => {
      const next = rotator[(index + 1) % rotator.length];
      const at = index * 2.8;
      cycle.to(line, { yPercent: -105, duration: .8, ease: "power3.inOut" }, at)
        .fromTo(next, { yPercent: 105 }, { yPercent: 0, duration: .8, ease: "power3.inOut", immediateRender: false }, at);
    });
    cycle.to({}, { duration: 2 });
  }

  if (!sticky || !film || !media || !tile || !left || !right) {
    return () => window.removeEventListener(PRELOADER_EVENT, play);
  }

  // Scroll stage: the tile opens into the full-bleed film.
  hero.dataset.heroStage = "scroll";
  gsap.set(tile, { visibility: "hidden" });
  const geometry = () => measureTile(sticky, tile);
  const stage = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id: "editorial-hero-stage",
      trigger: hero,
      start: "top top",
      end: "bottom bottom",
      scrub: compact ? .6 : 1,
      invalidateOnRefresh: true,
    },
  });
  let current = geometry();
  stage
    .fromTo(film, { clipPath: () => inset(current = geometry()) }, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 1, ease: "power2.inOut" }, 0)
    .fromTo(media, { x: () => current.x, y: () => current.y, scale: () => current.scale }, { x: 0, y: 0, scale: 1, duration: 1, ease: "power2.inOut" }, 0)
    .to(left, { x: () => -window.innerWidth * (compact ? .5 : .36), opacity: 0, duration: .75, ease: "power2.in" }, .05)
    .to(right, { x: () => window.innerWidth * (compact ? .5 : .36), opacity: 0, duration: .75, ease: "power2.in" }, .05)
    .to(supports, { y: -30, opacity: 0, duration: .3, ease: "power1.in" }, 0)
    .to(scrollCue, { opacity: 0, duration: .2 }, 0);
  if (shade) stage.fromTo(shade, { opacity: .25 }, { opacity: 1, duration: .5 }, .45);
  if (statementLines.length) {
    gsap.set(statementLines, { yPercent: 115 });
    stage.to(statementLines, { yPercent: 0, duration: .3, stagger: .08, ease: "power3.out" }, .78);
  }
  stage.to({}, { duration: .25 });

  return () => {
    window.removeEventListener(PRELOADER_EVENT, play);
    hero.dataset.heroStage = "static";
  };
}

function setupAbout(home: HTMLElement) {
  // The CSS baseline is 100% painted. Muting/hiding happens only within this
  // matchMedia context, so no-JS, reduced motion and route cleanup stay readable.
  const statement = home.querySelector<HTMLElement>("[data-editorial-statement]");
  if (!statement) return () => undefined;
  const sequence = Array.from(statement.querySelectorAll<HTMLElement>("[data-editorial-word], [data-editorial-chip]"));
  const words = sequence.filter((element) => element.hasAttribute("data-editorial-word"));
  const chips = sequence.filter((element) => element.hasAttribute("data-editorial-chip"));
  const layoutStates = measureAboutWordLayoutStates(statement);
  const hasLayoutStates = layoutStates.length === chips.length + 1 && layoutStates.every((state) => state.length === words.length);
  const aboutSection = statement.closest<HTMLElement>("[data-editorial-about]");
  const pinStory = window.matchMedia(motionQueries.stage).matches && Boolean(aboutSection);
  const depthSeal = aboutSection?.querySelector<HTMLElement>('[data-about-depth="seal"]');
  if (depthSeal) gsap.set(depthSeal, { transformPerspective: 850, transformStyle: "preserve-3d" });
  if (hasLayoutStates) {
    // Lock each word to its natural line baseline; only close/open the inline gaps horizontally.
    layoutStates[0].forEach(({ element, x }) => gsap.set(element, { x, y: 0 }));
  }
  gsap.set(words, { "--word-fill": "0%" });
  gsap.set(chips, { transformPerspective: 1000, transformStyle: "preserve-3d", backfaceVisibility: "hidden", opacity: 0, scale: .48, y: 25, z: -150, rotationX: -36, rotationY: 34, rotation: -16 });
  const reading = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id: "editorial-about-reading",
      trigger: pinStory ? aboutSection : statement,
      start: pinStory ? "top top" : "top 85%",
      end: pinStory ? `+=${Math.round(window.innerHeight * 1.5)}` : "bottom 42%",
      scrub: .85,
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
        if (Math.abs(from.x - to.x) < .5) return;
        reading.fromTo(from.element, { x: from.x, y: 0 }, {
          x: to.x, y: 0, duration: .56, ease: "power2.out", immediateRender: false,
        }, openingPositions[stateIndex - 1]);
      });
    }
  }
  sequence.forEach((element, index) => {
    const position = index * .18;
    if (element.hasAttribute("data-editorial-word")) {
      // Explicit endpoints survive refresh/invalidation of a scrubbed timeline.
      reading.fromTo(element, { "--word-fill": "0%" }, { "--word-fill": "100%", duration: .28, immediateRender: true }, position);
    } else {
      reading.fromTo(element,
        { opacity: 0, scale: .48, y: 25, z: -150, rotationX: -36, rotationY: 34, rotationZ: -16 },
        { opacity: 1, scale: 1, y: 0, z: 20, rotationX: 0, rotationY: 0, rotationZ: element.textContent === "BATU" ? -6 : 0, duration: .56, ease: "power2.out" },
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

  // Word wrapping changes the premeasured FLIP states. Rebuild only after width
  // changes settle, not on scroll or mobile browser URL-bar height changes.
  let aboutWidth = statement.clientWidth;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
    const nextWidth = statement.clientWidth;
    if (!nextWidth || nextWidth === aboutWidth) return;
    aboutWidth = nextWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => gsap.matchMediaRefresh(), 160);
  }) : undefined;
  observer?.observe(statement);
  return () => {
    observer?.disconnect();
    clearTimeout(resizeTimer);
  };
}

function setupTracks(home: HTMLElement) {
  const section = home.querySelector<HTMLElement>("[data-editorial-tracks]");
  const pinTarget = section?.querySelector<HTMLElement>("[data-tracks-pin]");
  const viewport = section?.querySelector<HTMLElement>("[data-tracks-viewport]");
  const strip = section?.querySelector<HTMLElement>("[data-tracks-strip]");
  if (!section || !pinTarget || !viewport || !strip) return () => undefined;
  const panels = Array.from(strip.querySelectorAll<HTMLElement>("[data-tracks-panel]"));
  const counter = section.querySelector<HTMLElement>("[data-tracks-counter]");
  const bar = section.querySelector<HTMLElement>("[data-tracks-progress]");
  const total = String(panels.length).padStart(2, "0");
  let shown = -1;
  const report = (progress: number) => {
    if (bar) gsap.set(bar, { scaleX: progress });
    const index = Math.min(panels.length - 1, Math.max(0, Math.round(progress * (panels.length - 1))));
    if (counter && index !== shown) {
      shown = index;
      counter.textContent = `${String(index + 1).padStart(2, "0")} / ${total}`;
    }
  };

  const heads = section.querySelectorAll<HTMLElement>("[data-tracks-pin] h2, [data-tracks-pin] [data-tracks-counter]");
  gsap.fromTo(heads, { y: 50, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1, stagger: .08, ease: "power3.out",
    scrollTrigger: { trigger: section, start: "top 78%", once: true },
  });

  const pinned = window.matchMedia(motionQueries.stage).matches;
  if (!pinned) {
    // Native horizontal scrolling with snap; only reflect position in the counter.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = viewport.scrollWidth - viewport.clientWidth;
        report(max > 0 ? viewport.scrollLeft / max : 0);
      });
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    gsap.fromTo(panels, { x: 80, opacity: 0 }, {
      x: 0, opacity: 1, duration: 1, stagger: .07, ease: "power3.out",
      scrollTrigger: { trigger: viewport, start: "top 85%", once: true },
    });
    return () => { viewport.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }

  pinTarget.dataset.pinned = "true";
  viewport.dataset.pinned = "true";
  gsap.set(viewport, { overflow: "hidden" });
  const distance = () => Math.max(0, strip.scrollWidth - viewport.clientWidth);
  const rail = gsap.to(strip, {
    x: () => -distance(),
    ease: "none",
    scrollTrigger: {
      id: "editorial-tracks-rail",
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(1, distance())}`,
      pin: section,
      scrub: .9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => report(self.progress),
    },
  });
  panels.forEach((panel) => {
    const code = panel.querySelector<HTMLElement>("[data-tracks-code]");
    const card = panel.firstElementChild as HTMLElement | null;
    if (code) gsap.fromTo(code, { xPercent: 22 }, {
      xPercent: -22, ease: "none",
      scrollTrigger: { containerAnimation: rail, trigger: panel, start: "left right", end: "right left", scrub: true },
    });
    if (card) gsap.fromTo(card, { scale: .9, rotation: 2.5, opacity: .35 }, {
      scale: 1, rotation: 0, opacity: 1, ease: "power2.out",
      scrollTrigger: { containerAnimation: rail, trigger: panel, start: "left 105%", end: "left 62%", scrub: true },
    });
  });
  // Keyboard focus inside the transformed strip scrolls the page to that panel.
  const onFocus = (event: FocusEvent) => {
    const panel = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-tracks-panel]");
    const trigger = rail.scrollTrigger;
    if (!panel || !trigger) return;
    const offset = Math.min(distance(), Math.max(0, panel.offsetLeft - strip.offsetLeft - 24));
    scrollToY(trigger.start + offset);
    viewport.scrollLeft = 0;
  };
  strip.addEventListener("focusin", onFocus);
  return () => {
    strip.removeEventListener("focusin", onFocus);
    delete pinTarget.dataset.pinned;
    delete viewport.dataset.pinned;
  };
}

function setupReveals(home: HTMLElement, compact: boolean) {
  const distance = compact ? 58 : 96;
  home.querySelectorAll<HTMLElement>("[data-editorial-reveal]").forEach((element, index) => {
    gsap.fromTo(element, { y: distance, opacity: .08 }, {
      y: 0, opacity: 1, ease: "power2.out",
      scrollTrigger: { id: `editorial-reveal-${index}`, trigger: element, start: "top 96%", end: "top 66%", scrub: .6 },
    });
  });
  home.querySelectorAll<HTMLElement>("[data-editorial-lift]").forEach((element, index) => {
    gsap.fromTo(element, { y: distance + 30, scale: .92, opacity: .12, rotation: index % 2 ? 2.5 : -2 }, {
      y: 0, scale: 1, opacity: 1, rotation: 0, ease: "power2.out",
      scrollTrigger: { id: `editorial-card-lift-${index}`, trigger: element, start: "top 99%", end: "top 57%", scrub: .65 },
    });
  });
  home.querySelectorAll<HTMLElement>("[data-editorial-symbol]").forEach((element, index) => {
    if (element.hasAttribute("data-about-depth")) return;
    const trigger = element.closest("section") || element;
    const tilt = index % 2 === 0 ? -12 : 10;
    gsap.timeline({
      scrollTrigger: { id: `editorial-symbol-${index}`, trigger, start: "top 94%", end: "bottom 6%", scrub: .8 },
    })
      .fromTo(element, { y: compact ? 34 : 64, opacity: 0, scale: .8, rotation: tilt }, { y: 0, opacity: 1, scale: 1, rotation: 0, duration: .35, ease: "power2.out" }, 0)
      .to(element, { y: compact ? -18 : -35, rotation: -tilt * .6, duration: .45, ease: "none" }, .35);
  });
}

function setupJoin(home: HTMLElement, compact: boolean) {
  const join = home.querySelector<HTMLElement>("[data-editorial-join]");
  if (!join) return;
  const panel = join.querySelector<HTMLElement>("[data-editorial-join-panel]");
  const rows = join.querySelectorAll<HTMLElement>("[data-marquee-row]");
  rows.forEach((row, index) => {
    gsap.set(row, { translate: "none", x: 0 });
    gsap.fromTo(row, { xPercent: index % 2 ? -25 : 0 }, {
      xPercent: index % 2 ? 0 : -25, ease: "none",
      scrollTrigger: { id: `editorial-join-marquee-${index}`, trigger: join, start: "top bottom", end: "bottom top", scrub: .6 },
    });
  });
  if (panel) gsap.fromTo(panel, { y: compact ? 70 : 120, opacity: .1 }, {
    y: 0, opacity: 1, ease: "power2.out",
    scrollTrigger: { id: "editorial-join-panel", trigger: join, start: "top 80%", end: "top 20%", scrub: .65 },
  });
}

export function setupEditorialHome(root: HTMLElement, media: MotionMedia) {
  const home = root.querySelector<HTMLElement>("[data-editorial-home]");
  if (!home) return;

  media.add({ motion: motionQueries.motion }, (context) => {
    if (!context.conditions?.motion) return;
    const compact = window.matchMedia("(max-width: 800px)").matches;
    // Creation order matches page order so ScrollTrigger refreshes pins top-down.
    const cleanups = [
      setupHero(home, compact),
      setupAbout(home),
      setupTracks(home),
    ];
    setupReveals(home, compact);
    setupJoin(home, compact);
    ScrollTrigger.refresh();
    return () => cleanups.forEach((cleanup) => cleanup());
  });
}
