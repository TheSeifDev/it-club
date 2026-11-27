"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, motionQueries } from "@/src/components/site/motion/gsap";
import { setupTrackStack } from "@/src/components/site/motion/track-stack";

export default function TracksExperienceMotion({
  children,
}: {
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const scope = root.current;
    if (!scope) return;

    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      const scenes = Array.from(
        scope.querySelectorAll<HTMLElement>("[data-tracks-exhibition-scene]"),
      );

      media.add(motionQueries.motion, () => {
        const hero = scope.querySelector<HTMLElement>(
          "[data-tracks-exhibition-hero]",
        );
        const heroTitle = hero?.querySelectorAll<HTMLElement>(
          "[data-tracks-exhibition-title] span, [data-tracks-exhibition-title] em",
        );
        const heroCopy = hero?.querySelector<HTMLElement>(
          "[data-tracks-exhibition-copy]",
        );
        const heroVisual = hero?.querySelector<HTMLElement>(
          "[data-tracks-exhibition-visual]",
        );

        if (heroTitle?.length) {
          gsap.fromTo(
            heroTitle,
            { yPercent: 112, clipPath: "inset(0 0 100% 0)" },
            {
              yPercent: 0,
              clipPath: "inset(0 0 0% 0)",
              duration: 0.9,
              stagger: 0.1,
              ease: "power3.out",
            },
          );
        }
        if (heroCopy) {
          gsap.fromTo(
            heroCopy,
            { y: 22, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.7,
              delay: 0.35,
              ease: "power3.out",
            },
          );
        }
        if (heroVisual) {
          gsap.fromTo(
            heroVisual,
            { y: 24, autoAlpha: 0, scale: 0.97 },
            {
              y: 0,
              autoAlpha: 1,
              scale: 1,
              duration: 1.05,
              delay: 0.2,
              ease: "power2.out",
            },
          );
          gsap.to(heroVisual, {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        }

        const closing = scope.querySelector<HTMLElement>(
          "[data-tracks-exhibition-closing]",
        );
        if (closing) {
          const closingTargets = closing.querySelectorAll<HTMLElement>(
            "[data-tracks-exhibition-closing-copy] h2, [data-tracks-exhibition-closing-copy] > p:not([data-tracks-exhibition-closing-label]), [data-tracks-exhibition-closing-cta], [data-tracks-exhibition-closing-arabic]",
          );
          gsap.from(closingTargets, {
            y: 24,
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: closing,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          });
        }
      });

      setupTrackStack(scope, media, {
        selector: "[data-exhibition-stack]",
        id: "site-tracks-exhibition-stack",
        hashNavigation: true,
      });

      // In compact layouts the stack is a natural document flow, so reveal scenes individually.
      media.add(motionQueries.compact, () => {
        const index = scope.querySelector<HTMLElement>(
          "[data-tracks-exhibition-index]",
        );
        if (index) {
          gsap.from(index, {
            y: 20,
            autoAlpha: 0,
            duration: 0.62,
            scrollTrigger: {
              trigger: index,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        }
        scenes.forEach((scene) => {
          const targets = Array.from(
            scene.querySelectorAll<HTMLElement>(
              "[data-tracks-exhibition-title], [data-tracks-exhibition-copy], [data-tracks-exhibition-links]",
            ),
          );
          const visual = scene.querySelector<HTMLElement>(
            "[data-tracks-exhibition-visual]",
          );
          if (targets.length) {
            gsap.from(targets, {
              y: 22,
              autoAlpha: 0,
              duration: 0.68,
              stagger: 0.07,
              ease: "power3.out",
              scrollTrigger: {
                trigger: scene,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            });
          }
          if (visual) {
            gsap.fromTo(
              visual,
              { clipPath: "inset(7% 0 7% 0)", scale: 0.98 },
              {
                clipPath: "inset(0% 0 0% 0)",
                scale: 1,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: scene,
                  start: "top 91%",
                  end: "top 55%",
                  scrub: 0.6,
                },
              },
            );
          }
        });
      });
      return () => media.revert();
    }, scope);

    return () => context.revert();
  }, []);

  return (
    <div ref={root} data-tracks-exhibition-motion-root>
      {children}
    </div>
  );
}
