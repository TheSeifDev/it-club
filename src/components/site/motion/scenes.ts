"use client";

import { gsap, motionQueries, type ScrollTrigger } from "./gsap";

type MotionMedia = ReturnType<typeof gsap.matchMedia>;
type SceneCleanup = () => void;

const all = (root: ParentNode, selector: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(selector));

const one = <T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string) =>
  root.querySelector<T>(selector);

const first = <T extends HTMLElement = HTMLElement>(root: ParentNode, selectors: string[]) => {
  for (const selector of selectors) {
    const match = one<T>(root, selector);
    if (match) return match;
  }
  return null;
};

const clearTransform = (elements: HTMLElement[]) => {
  if (elements.length) gsap.set(elements, { clearProps: "transform,opacity,clipPath" });
};

/** Publish only meaningful changes; the Three scene listens globally. */
const publishNetworkProgress = (() => {
  let published = -1;
  return (progress: number) => {
    const next = Math.max(0, Math.min(1, progress));
    if (Math.abs(next - published) < 0.002) return;
    published = next;
    window.dispatchEvent(new CustomEvent<{ progress: number }>("club:network", {
      detail: { progress: next },
    }));
  };
})();

function setupGeneralReveals(root: HTMLElement, mm: MotionMedia) {
  mm.add(motionQueries.motion, () => {
    const reveals = all(root, "[data-reveal]").filter((element) => !element.closest("[data-showcase-card]"));
    reveals.forEach((element, index) => {
      gsap.fromTo(element,
        { y: 28, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.72,
          delay: Math.min(index * 0.025, 0.18),
          ease: "power3.out",
          scrollTrigger: {
            id: `site-reveal-${index + 1}`,
            trigger: element,
            start: "top 91%",
            end: "top 68%",
            scrub: 0.45,
          },
        },
      );
    });

    all(root, "[data-line-heading]").forEach((heading, index) => {
      gsap.fromTo(heading,
        { clipPath: "inset(0 0 100% 0)", y: 18 },
        {
          clipPath: "inset(0 0 0% 0)",
          y: 0,
          ease: "power3.out",
          scrollTrigger: {
            id: `site-line-heading-${index + 1}`,
            trigger: heading,
            start: "top 88%",
            end: "top 55%",
            scrub: 0.5,
          },
        },
      );
    });
  });
}

function setupHero(root: HTMLElement, mm: MotionMedia) {
  const hero = first(root, ["[data-hero]", "[data-site-hero]"]);
  if (!hero) return;

  mm.add(motionQueries.stage, () => {
    const content = first(root, ["[data-hero-content]", ".site-home-hero__copy"]);
    const titleLines = all(hero, "[data-hero-title-line]");
    const fallbackTitle = titleLines.length ? titleLines : all(hero, ".site-home-title");
    const role = one(hero, "[data-hero-role], .site-home-kicker");
    const copy = one(hero, "[data-hero-copy], .site-home-intro");
    const actions = one(hero, "[data-hero-actions], .site-home-actions");
    const portrait = one(hero, "[data-hero-portrait-reveal], .site-hero-art");
    const background = one(hero, "[data-hero-bg-inner], [data-hero-bg]");
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (role) timeline.fromTo(role, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.42 }, 0);
    if (fallbackTitle.length) {
      timeline.fromTo(fallbackTitle,
        { yPercent: 112, clipPath: "inset(0 0 100% 0)" },
        { yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 0.82, stagger: 0.075 },
        0.1,
      );
    }
    if (copy) timeline.fromTo(copy, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.52 }, 0.42);
    if (actions) timeline.fromTo(actions, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.42 }, 0.58);
    if (portrait) timeline.fromTo(portrait, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power2.inOut" }, 0.82);
    if (background) timeline.fromTo(background, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: "power2.out" }, 0);

    const paper = first(root, ["[data-club-about]", ".site-home-manifesto"]);
    if (paper) {
      gsap.timeline({
        scrollTrigger: {
          id: "site-hero-paper-overlap",
          trigger: paper,
          start: "top bottom",
          end: "top top",
          scrub: 0.55,
        },
      })
        .to(content, { y: -110, autoAlpha: 0.2, ease: "none" }, 0)
        .to(first(hero, ["[data-hero-portrait]", ".site-hero-art"]), { y: 76, scale: 0.94, ease: "none" }, 0)
        .to(first(hero, ["[data-hero-bg]", ".site-home-hero"]), { yPercent: 7, scale: 1.035, ease: "none" }, 0)
        .to(all(hero, "[data-hero-card], .site-hero-person"), { y: -46, autoAlpha: 0, ease: "none" }, 0)
        .to(one(hero, "[data-hero-shade]"), { autoAlpha: 0.78, ease: "none" }, 0);
    }
  });

  mm.add(motionQueries.compact, () => {
    const background = first(hero, ["[data-hero-bg]", ".site-hero-art"]);
    if (!background) return;
    gsap.to(background, {
      yPercent: 10,
      ease: "none",
      scrollTrigger: { id: "site-hero-parallax", trigger: hero, start: "top top", end: "bottom top", scrub: true },
    });
  });
}

function setupAbout(root: HTMLElement, mm: MotionMedia) {
  const about = first(root, ["[data-club-about]", ".site-home-manifesto"]);
  if (!about) return;

  mm.add(motionQueries.motion, () => {
    const lines = all(about, "[data-about-line]");
    const art = one(about, "[data-about-art]");
    const artImage = one(about, "[data-about-art-img]");
    const statement = one(about, "[data-about-statement]");
    const statementWords = statement ? all(statement, "[data-word]") : [];
    const intro = gsap.timeline({
      scrollTrigger: {
        id: "site-about-intro",
        trigger: about,
        start: "top 86%",
        end: "top 18%",
        scrub: 0.55,
      },
    });

    if (lines.length) intro.from(lines, { yPercent: 110, stagger: 0.12, ease: "power3.out" }, 0);
    if (art) intro.fromTo(art, { clipPath: "inset(18% 14% 18% 0% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.out" }, 0);
    if (artImage) intro.from(artImage, { scale: 1.16, ease: "power2.out" }, 0);
    if (statementWords.length) {
      gsap.fromTo(statementWords,
        { opacity: 0.28, y: 7 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.045,
          ease: "none",
          scrollTrigger: { id: "site-about-statement", trigger: statement, start: "top 84%", end: "bottom 48%", scrub: true },
        },
      );
    }
  });
}

function setupIdentity(root: HTMLElement, mm: MotionMedia) {
  const identity = one(root, "[data-club-identity]");
  if (!identity) return;
  const pin = one(identity, "[data-identity-pin]");
  if (!pin) return;

  mm.add(motionQueries.stage, () => {
    const heading = one(identity, "[data-identity-heading]");
    const headingLines = heading ? all(heading, "[data-identity-line], [data-identity-line-inner]") : [];
    const headingTargets = headingLines.length ? headingLines : heading ? [heading] : [];
    const halfA = one(identity, '[data-identity-half="a"]');
    const halfB = one(identity, '[data-identity-half="b"]');
    const copyA = one(identity, '[data-identity-copy="a"]');
    const copyB = one(identity, '[data-identity-copy="b"]');
    const visual = one(identity, "[data-identity-visual]");
    const halves = [halfA, halfB].filter((element): element is HTMLElement => Boolean(element));
    const copies = [copyA, copyB].filter((element): element is HTMLElement => Boolean(element));

    identity.dataset.sequence = "pinned";
    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "site-identity-sequence",
        trigger: pin,
        pin: true,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * 3.05)}`,
        scrub: 0.62,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self: ScrollTrigger) => publishNetworkProgress(self.progress),
      },
    });

    if (headingTargets.length) timeline.fromTo(headingTargets, { yPercent: 112 }, { yPercent: 0, duration: 1.2, stagger: 0.18, ease: "power3.out" }, 0);
    if (halves.length) timeline.fromTo(halves, { y: 38 }, { y: 0, duration: 2.2, stagger: 0.08 }, 0);
    if (halfA) timeline.fromTo(halfA, { xPercent: 0, scale: 1 }, { xPercent: -8, scale: 0.78, duration: 1.9, ease: "power2.inOut" }, 2.5);
    if (halfB) timeline.fromTo(halfB, { xPercent: 0, scale: 1 }, { xPercent: 8, scale: 0.78, duration: 1.9, ease: "power2.inOut" }, 2.5);
    if (visual) {
      timeline.fromTo(visual, { clipPath: "inset(0% 50% 0% 50%)", scale: 0.92, autoAlpha: 0.65 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, autoAlpha: 1, duration: 1.8, ease: "power2.inOut" }, 2.85);
      timeline.to(visual, { yPercent: -7, scale: 1.04, duration: 2.8, ease: "power1.inOut" }, 4.45);
    }
    if (copyA) timeline.fromTo(copyA, { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power2.out" }, 4.1);
    if (copyB) timeline.fromTo(copyB, { y: 32, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, ease: "power2.out" }, 4.35);
    if (halves.length) timeline.to(halves, { y: -window.innerHeight * 0.08, autoAlpha: 0, duration: 1.15, stagger: 0.08, ease: "power2.in" }, 7.6);
    if (copies.length) timeline.to(copies, { y: -window.innerHeight * 0.08, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: "power2.in" }, 7.75);
    if (visual) timeline.to(visual, { yPercent: -13, autoAlpha: 0, duration: 1.2, ease: "power2.in" }, 8.1);

    publishNetworkProgress(0);
    return () => {
      identity.removeAttribute("data-sequence");
      publishNetworkProgress(0);
      clearTransform([...headingTargets, ...halves, ...copies, ...(visual ? [visual] : [])]);
    };
  });

  mm.add(motionQueries.compact, () => {
    const heading = one(identity, "[data-identity-heading]");
    const lines = heading ? all(heading, "[data-identity-line], [data-identity-line-inner]") : [];
    const visual = one(identity, "[data-identity-visual]");
    const copies = all(identity, '[data-identity-copy="a"], [data-identity-copy="b"]');
    const timeline = gsap.timeline({
      scrollTrigger: { id: "site-identity-reveal", trigger: identity, start: "top 82%", end: "bottom 72%", scrub: 0.55 },
    });
    if (lines.length) timeline.fromTo(lines, { yPercent: 112 }, { yPercent: 0, stagger: 0.1, duration: 0.75, ease: "power2.out" }, 0);
    if (visual) timeline.fromTo(visual, { clipPath: "inset(0% 50% 0% 50%)", autoAlpha: 0.55 }, { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1, duration: 0.9, ease: "power2.inOut" }, 0.32);
    if (copies.length) timeline.fromTo(copies, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.18, duration: 0.65, ease: "power2.out" }, 0.7);
  });
}

function setupShowcase(root: HTMLElement, mm: MotionMedia) {
  const showcase = one(root, "[data-showcase]");
  if (!showcase) return;
  const viewport = one(showcase, "[data-showcase-viewport]");
  const track = one(showcase, "[data-showcase-track]");
  if (!viewport || !track) return;
  const cards = () => all(showcase, "[data-showcase-card]");

  mm.add(motionQueries.stage, () => {
    const progress = one(showcase, "[data-showcase-progress]");
    const current = one(showcase, "[data-showcase-current]");
    const slides = cards();
    if (slides.length < 2) return;

    showcase.dataset.showcaseMode = "horizontal";
    let active = -1;
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    const setCurrent = (index: number) => {
      const next = Math.max(0, Math.min(index, slides.length - 1));
      if (next === active && slides.every((slide, slideIndex) => slide.hasAttribute("data-current") === (slideIndex === next))) return;
      active = next;
      slides.forEach((slide, slideIndex) => slide.toggleAttribute("data-current", slideIndex === next));
      if (current) current.textContent = String(next + 1).padStart(2, "0");
    };

    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        id: "site-showcase-horizontal",
        trigger: showcase,
        pin: true,
        start: "top top",
        end: () => `+=${Math.max(1, distance())}`,
        scrub: 0.62,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        snap: { snapTo: 1 / (slides.length - 1), duration: { min: 0.24, max: 0.56 }, delay: 0.08, ease: "power2.inOut", inertia: false },
        onUpdate: (self: ScrollTrigger) => {
          if (progress) {
            progress.style.setProperty("--showcase-progress", String(self.progress));
            progress.setAttribute("aria-valuenow", String(Math.round(self.progress * 100)));
            gsap.set(progress, { scaleX: self.progress });
          }
          setCurrent(Math.round(self.progress * (slides.length - 1)));
        },
      },
    });
    setCurrent(0);

    const onFocusIn = (event: FocusEvent) => {
      const slide = (event.target as HTMLElement).closest<HTMLElement>("[data-showcase-card]");
      const trigger = tween.scrollTrigger;
      if (!slide || !trigger) return;
      const index = slides.indexOf(slide);
      if (index < 0 || slides.length < 2) return;
      window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (index / (slides.length - 1)) });
    };
    track.addEventListener("focusin", onFocusIn);

    return () => {
      track.removeEventListener("focusin", onFocusIn);
      showcase.removeAttribute("data-showcase-mode");
      slides.forEach((slide) => slide.removeAttribute("data-current"));
      gsap.set(track, { clearProps: "transform" });
      if (progress) gsap.set(progress, { clearProps: "transform" });
    };
  });

  mm.add(motionQueries.compact, () => {
    const slides = cards();
    slides.forEach((slide, index) => {
      gsap.fromTo(slide,
        { y: 42, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          ease: "power2.out",
          scrollTrigger: { id: `site-showcase-card-${index + 1}`, trigger: slide, start: "top 92%", end: "top 64%", scrub: 0.52 },
        },
      );
    });
  });
}

function setupMagnetic(root: HTMLElement, mm: MotionMedia) {
  mm.add(motionQueries.finePointer, () => {
    const nodes = all(root, "[data-magnetic]");
    const cleanups: SceneCleanup[] = [];
    nodes.forEach((element) => {
      const strength = Number(element.dataset.magneticStrength ?? 0.18);
      const moveX = gsap.quickTo(element, "x", { duration: 0.36, ease: "power3.out" });
      const moveY = gsap.quickTo(element, "y", { duration: 0.36, ease: "power3.out" });
      const onMove = (event: PointerEvent) => {
        const rect = element.getBoundingClientRect();
        moveX((event.clientX - (rect.left + rect.width / 2)) * strength);
        moveY((event.clientY - (rect.top + rect.height / 2)) * strength);
      };
      const onLeave = () => { moveX(0); moveY(0); };
      element.addEventListener("pointermove", onMove, { passive: true });
      element.addEventListener("pointerleave", onLeave, { passive: true });
      cleanups.push(() => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
        gsap.killTweensOf(element);
        gsap.set(element, { clearProps: "x,y" });
      });
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  });
}

export function setupSiteScenes(root: HTMLElement, mm: MotionMedia) {
  setupGeneralReveals(root, mm);
  setupHero(root, mm);
  setupAbout(root, mm);
  setupIdentity(root, mm);
  setupShowcase(root, mm);
  setupMagnetic(root, mm);
}
