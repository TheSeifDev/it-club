"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "./motion/gsap";
import { bindMotionRefresh } from "./motion/refresh";
import { setupSiteScenes } from "./motion/scenes";

export default function SiteMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const scope = root.current;
    if (!scope) return;

    let media: ReturnType<typeof gsap.matchMedia> | undefined;
    const context = gsap.context(() => {
      media = gsap.matchMedia();
      setupSiteScenes(scope, media);
    }, scope);

    const unbindRefresh = bindMotionRefresh();
    return () => {
      unbindRefresh();
      media?.revert();
      context.revert();
    };
  }, [pathname]);

  return <div className="site-motion-root" ref={root}>{children}</div>;
}
