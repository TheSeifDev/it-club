"use client";

import { ScrollTrigger } from "./gsap";

export function bindMotionRefresh(onRefresh: () => void = () => ScrollTrigger.refresh()) {
  let frame = 0;
  let disposed = false;
  const schedule = () => {
    if (disposed || frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      if (!disposed) onRefresh();
    });
  };
  const onFontsLoaded = () => schedule();

  schedule();
  if (document.fonts?.status !== "loaded") document.fonts?.ready.then(schedule).catch(() => undefined);
  document.fonts?.addEventListener("loadingdone", onFontsLoaded);

  return () => {
    disposed = true;
    window.cancelAnimationFrame(frame);
    document.fonts?.removeEventListener("loadingdone", onFontsLoaded);
  };
}
