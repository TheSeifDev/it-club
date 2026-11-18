"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, motionQueries } from "@/src/components/site/motion/gsap";

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
            { y: 24, autoAlpha: 0, scale: 0.96 },
            {
              y: 0,
              autoAlpha: 1,
              scale: 1,
              duration: 1.15,
              delay: 0.2,
              ease: "power2.out",
            },
          );
          gsap.to(heroVisual, {
            yPercent: 7,
            ease: "none",
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        }

        const scenes = Array.from(
          scope.querySelectorAll<HTMLElement>("[data-tracks-exhibition-scene]"),
        );

        scenes.forEach((scene, index) => {
          const title = scene.querySelector<HTMLElement>(
            "[data-tracks-exhibition-title]",
          );
          const copy = scene.querySelector<HTMLElement>(
            "[data-tracks-exhibition-copy]",
          );
          const visual = scene.querySelector<HTMLElement>(
            "[data-tracks-exhibition-visual]",
          );
          const links = scene.querySelector<HTMLElement>(
            "[data-tracks-exhibition-links]",
          );
          const targets = [title, copy, links].filter(
            (item): item is HTMLElement => Boolean(item),
          );

          if (targets.length) {
            gsap.from(targets, {
              y: 26,
              autoAlpha: 0,
              duration: 0.72,
              stagger: 0.08,
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
              { clipPath: "inset(8% 0 8% 0)", scale: 0.97 },
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
            gsap.to(visual, {
              yPercent: -4,
              ease: "none",
              scrollTrigger: {
                trigger: scene,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.7,
              },
            });
          }

          void index;
        });

        const closing = scope.querySelector<HTMLElement>(
          "[data-tracks-exhibition-closing]",
        );
        if (closing) {
          const closingTargets = closing.querySelectorAll<HTMLElement>(
            "[data-tracks-exhibition-closing-copy] h2, [data-tracks-exhibition-closing-copy] > p:not([data-tracks-exhibition-closing-label]), [data-tracks-exhibition-closing-cta], [data-tracks-exhibition-closing-arabic]",
          );
          gsap.from(closingTargets, {
            y: 28,
            autoAlpha: 0,
            duration: 0.72,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: {
              trigger: closing,
              start: "top 82%",
              toggleActions: "play none none none",
            },
          });
        }

        const cleanupSpotlights = scenes.map((scene) => {
          const move = (event: PointerEvent) => {
            const rect = scene.getBoundingClientRect();
            scene.style.setProperty(
              "--spot-x",
              `${event.clientX - rect.left}px`,
            );
            scene.style.setProperty(
              "--spot-y",
              `${event.clientY - rect.top}px`,
            );
            scene.dataset.isHovering = "true";
          };
          const leave = () => {
            scene.dataset.isHovering = "false";
          };

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

        return () => cleanupSpotlights.forEach((cleanup) => cleanup());
      });

      media.add(motionQueries.compact, () => {
        const index = scope.querySelector<HTMLElement>(
          "[data-tracks-exhibition-index]",
        );
        if (index) {
          gsap.from(index, {
            y: 24,
            autoAlpha: 0,
            duration: 0.65,
            scrollTrigger: {
              trigger: index,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        }
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
