"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SiteMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.72,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 91%", once: true },
          },
        );
      });

      const hero = root.current?.querySelector<HTMLElement>("[data-site-hero]");
      const portrait = root.current?.querySelector<HTMLElement>("[data-parallax]");
      if (hero && portrait) {
        gsap.to(portrait, {
          yPercent: -3,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      }
    }, root);
    return () => context.revert();
  }, []);

  return <div className="site-motion-root" ref={root}>{children}</div>;
}
