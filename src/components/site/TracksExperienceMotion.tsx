"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, motionQueries } from "@/src/components/site/motion/gsap";

export default function TracksExperienceMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();

      media.add(motionQueries.motion, () => {
        const hero = scope.querySelector<HTMLElement>("[data-tracks-exhibition-hero]");
        const heroTitle = hero?.querySelectorAll<HTMLElement>("[data-tracks-exhibition-title] span, [data-tracks-exhibition-title] em");
        const heroCopy = hero?.querySelector<HTMLElement>("[data-tracks-exhibition-copy]");
        const heroVisual = hero?.querySelector<HTMLElement>("[data-tracks-exhibition-visual]");

        if (heroTitle?.length) {
          gsap.fromTo(
            heroTitle,
            { yPercent: 112, clipPath: "inset(0 0 100% 0)" },
            { yPercent: 0, clipPath: "inset(0 0 0% 0)", duration: 0.9, stagger: 0.1, ease: "power3.out" },
          );
        }
        if (heroCopy) {
          gsap.fromTo(heroCopy, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, delay: 0.35, ease: "power3.out" });
        }
        if (heroVisual) {
          gsap.fromTo(heroVisual, { y: 24, autoAlpha: 0, scale: 0.96 }, { y: 0, autoAlpha: 1, scale: 1, duration: 1.15, delay: 0.2, ease: "power2.out" });
          gsap.to(heroVisual, {
            yPercent: 8,
            ease: "none",
            scrollTrigger: { id: "tracks-exhibition-hero-parallax", trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
          });
        }

        const scenes = Array.from(scope.querySelectorAll<HTMLElement>("[data-tracks-exhibition-scene]"));
        scenes.forEach((scene, index) => {
          const title = scene.querySelector<HTMLElement>("[data-tracks-exhibition-title]");
          const copy = scene.querySelector<HTMLElement>("[data-tracks-exhibition-copy]");
          const visual = scene.querySelector<HTMLElement>("[data-tracks-exhibition-visual]");
          const links = scene.querySelector<HTMLElement>("[data-tracks-exhibition-links]");
          const targets = [title, copy, links].filter((item): item is HTMLElement => Boolean(item));

          if (targets.length) {
            gsap.fromTo(
              targets,
              { y: 32, autoAlpha: 0 },
              {
                y: 0,
                autoAlpha: 1,
                duration: 0.85,
                stagger: 0.08,
                ease: "power3.out",
                scrollTrigger: { id: `tracks-exhibition-copy-${index + 1}`, trigger: scene, start: "top 82%", end: "top 52%", scrub: 0.55 },
              },
            );
          }
          if (visual) {
            gsap.fromTo(
              visual,
              { clipPath: "inset(9% 0 9% 0)", scale: 0.96 },
              { clipPath: "inset(0% 0 0% 0)", scale: 1, ease: "power2.out", scrollTrigger: { id: `tracks-exhibition-visual-${index + 1}`, trigger: scene, start: "top 91%", end: "top 55%", scrub: 0.6 } },
            );
            gsap.to(visual, {
              yPercent: -5,
              ease: "none",
              scrollTrigger: { id: `tracks-exhibition-depth-${index + 1}`, trigger: scene, start: "top bottom", end: "bottom top", scrub: 0.7 },
            });
          }
        });

        const closing = scope.querySelector<HTMLElement>("[data-tracks-exhibition-closing]");
        if (closing) {
          gsap.fromTo(
            closing.querySelectorAll<HTMLElement>("[data-tracks-exhibition-closing-copy] h2, [data-tracks-exhibition-closing-copy] > p:not([data-tracks-exhibition-closing-label]), [data-tracks-exhibition-closing-cta], [data-tracks-exhibition-closing-arabic]"),
            { y: 28, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.72, stagger: 0.08, ease: "power3.out", scrollTrigger: { id: "tracks-exhibition-closing", trigger: closing, start: "top 82%", end: "top 56%", scrub: 0.5 } },
          );
        }

        const spotlights = scenes;
        const handlers = spotlights.map((scene) => {
          const move = (event: PointerEvent) => {
            const rect = scene.getBoundingClientRect();
            scene.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
            scene.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
            scene.dataset.isHovering = "true";
          };
          const leave = () => { scene.dataset.isHovering = "false"; };
          scene.addEventListener("pointermove", move, { passive: true });
          scene.addEventListener("pointerleave", leave, { passive: true });
          return () => {
            scene.removeEventListener("pointermove", move);
            scene.removeEventListener("pointerleave", leave);
            scene.dataset.isHovering = "false";
            scene.style.removeProperty("--spot-x");
            scene.style.removeProperty("--spot-y");
          };
        });

        return () => handlers.forEach((cleanup) => cleanup());
      });

      media.add(motionQueries.compact, () => {
        const index = scope.querySelector<HTMLElement>("[data-tracks-exhibition-root] .jumpIndex");
        if (index) {
          gsap.fromTo(index, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65, scrollTrigger: { id: "tracks-exhibition-index", trigger: index, start: "top 88%", end: "top 66%", scrub: 0.5 } });
        }
      });

      return () => media.revert();
    }, scope);

    return () => {
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars.id?.toString().startsWith("tracks-exhibition-")) trigger.kill();
      });
    };
  }, []);

  return <div ref={root} data-tracks-exhibition-motion-root>{children}</div>;
}
