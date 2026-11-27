"use client";

import { useEffect, useRef, useState } from "react";

type HeroVideoProps = {
  /** Classes for the <video>; defaults to a full-bleed cover crop. */
  className?: string;
  /** Show the text-only pause/play control. */
  control?: boolean;
  controlClassName?: string;
};

/** Actual MP4 background; never starts automatically for reduced-motion visitors. */
export function HeroVideo({
  className = "h-full w-full object-cover object-center",
  control = true,
  controlClassName = "absolute top-[104px] right-[var(--site-gutter)] z-[5]",
}: HeroVideoProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const manuallyStarted = useRef(false);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let active = true;
    const synchronize = () => {
      const allowed = active && visible && !document.hidden && !paused &&
        (!motion.matches || manuallyStarted.current) && !failed;
      if (allowed) {
        void element.play().catch(() => { if (active) setPlaying(false); });
      } else {
        element.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      synchronize();
    }, { threshold: 0.02 });
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        manuallyStarted.current = false;
        setPaused(true);
      }
      synchronize();
    };
    observer.observe(element);
    document.addEventListener("visibilitychange", synchronize);
    motion.addEventListener("change", onMotionChange);
    return () => {
      active = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      motion.removeEventListener("change", onMotionChange);
      element.pause();
    };
  }, [paused, failed]);

  const toggle = () => {
    if (playing) {
      setPaused(true);
      video.current?.pause();
    } else {
      manuallyStarted.current = true;
      setPaused(false);
      void video.current?.play().catch(() => setPlaying(false));
    }
  };

  return (
    <>
      <video
        ref={video}
        className={className}
        data-editorial-video
        poster="/media/club-hero-poster.webp"
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => { setFailed(true); setPlaying(false); }}
      >
        <source src="/media/club-hero.mp4" type="video/mp4" />
      </video>
      {control && !failed ? (
        <button
          type="button"
          className={`${controlClassName} inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full bg-[rgb(5_7_10_/_42%)] px-3 text-[.58rem] uppercase tracking-[.14em] text-[var(--site-ink)] backdrop-blur-[10px] transition-colors hover:bg-[rgb(5_7_10_/_62%)] motion-reduce:backdrop-blur-none max-[900px]:backdrop-blur-none`}
          onClick={toggle}
          aria-label={playing ? "Pause background video" : "Play background video"}
          data-cursor={playing ? "Pause" : "Play"}
        >
          <span aria-hidden="true" className={`block size-1.5 rounded-full ${playing ? "bg-[var(--site-sky-ink)] shadow-[0_0_10px_var(--site-sky-ink)]" : "bg-[var(--site-mist)]"}`} />
          <span>{playing ? "Pause film" : "Play film"}</span>
        </button>
      ) : null}
    </>
  );
}

/** Small inline film used inside headings; plays only while visible and motion is allowed. */
export function MiniFilm({ className = "" }: { className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden) void element.play().catch(() => undefined);
      else element.pause();
    }, { threshold: 0.1 });
    observer.observe(element);
    return () => { observer.disconnect(); element.pause(); };
  }, []);
  return (
    <video
      ref={video}
      className={className}
      poster="/media/club-hero-poster.webp"
      loop
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src="/media/club-hero.mp4" type="video/mp4" />
    </video>
  );
}
