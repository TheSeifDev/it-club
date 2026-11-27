"use client";

import { gsap, motionQueries } from "./gsap";

type MotionMedia = ReturnType<typeof gsap.matchMedia>;

export function setupEditorialHome(root: HTMLElement, media: MotionMedia) {
  const home = root.querySelector<HTMLElement>("[data-editorial-home]");
  if (!home) return;
  media.add(motionQueries.motion, () => {
    const hero = home.querySelector<HTMLElement>("[data-editorial-hero]");
    if (hero) {
      const lines = hero.querySelectorAll("[data-editorial-hero-line]");
      const support = hero.querySelector("[data-editorial-hero-support]");
      const action = hero.querySelector("[data-editorial-hero-action]");
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline.fromTo(lines, { yPercent: 115 }, { yPercent: 0, duration: 1, stagger: .09 }, .12);
      if (support) timeline.fromTo(support, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .75 }, .4);
      if (action) timeline.fromTo(action, { scale: .9, opacity: 0 }, { scale: 1, opacity: 1, duration: .65 }, .75);
      const film = hero.querySelector("[data-editorial-film]");
      if (film) gsap.fromTo(film, { scale: 1.035, yPercent: 0 }, {
        scale: 1.08, yPercent: 12, ease: "none",
        scrollTrigger: { id: "editorial-hero-film", trigger: hero, start: "top top", end: "bottom top", scrub: .8 },
      });
    }

    home.querySelectorAll<HTMLElement>("[data-editorial-reveal]").forEach((element, index) => {
      gsap.fromTo(element, { y: 28, opacity: 0 }, {
        y: 0, opacity: 1, duration: .85, ease: "power3.out",
        scrollTrigger: { id: `editorial-reveal-${index}`, trigger: element, start: "top 92%", once: true },
      });
    });
    home.querySelectorAll<HTMLElement>("[data-editorial-lift]").forEach((element, index) => {
      gsap.fromTo(element, { y: 45 }, {
        y: 0, ease: "none",
        scrollTrigger: { id: `editorial-card-lift-${index}`, trigger: element, start: "top 99%", end: "top 55%", scrub: .7 },
      });
    });
    home.querySelectorAll<HTMLElement>("[data-editorial-symbol]").forEach((element, index) => {
      gsap.to(element, {
        y: index % 2 === 0 ? -14 : 14, rotation: index % 2 === 0 ? 7 : -5, ease: "none",
        scrollTrigger: { id: `editorial-symbol-${index}`, trigger: element, start: "top bottom", end: "bottom top", scrub: 1.1 },
      });
    });
    const accent = home.querySelector<HTMLElement>("[data-editorial-accent]");
    if (accent) gsap.fromTo(accent, { color: "#56675c" }, { color: "#087969", scrollTrigger: { id: "editorial-about-accent", trigger: accent, start: "top 87%", end: "top 50%", scrub: 1 }, ease: "none" });
    const join = home.querySelector<HTMLElement>("[data-editorial-join]");
    const panel = home.querySelector<HTMLElement>("[data-editorial-join-panel]");
    const art = home.querySelector<HTMLElement>("[data-editorial-join-art]");
    if (join && panel) {
      gsap.fromTo(panel, { y: 52, scale: .96 }, { y: 0, scale: 1, ease: "none", scrollTrigger: { id: "editorial-join-panel", trigger: join, start: "top 95%", end: "top 35%", scrub: .8 } });
      if (art) gsap.to(art, { rotation: -8, yPercent: 8, ease: "none", scrollTrigger: { id: "editorial-join-art", trigger: join, start: "top bottom", end: "bottom top", scrub: 1 } });
    }
  });
}
