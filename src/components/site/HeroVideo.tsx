"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./HomeHero.module.css";

/** Actual MP4 background; never starts automatically for reduced-motion visitors. */
export function HeroVideo() {
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
    }, { threshold: 0.05 });
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
        className={styles.video}
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
      {!failed ? (
        <button
          type="button"
          className={styles.videoControl}
          onClick={toggle}
          aria-label={playing ? "Pause background video" : "Play background video"}
        >
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          <span>{playing ? "Pause film" : "Play film"}</span>
        </button>
      ) : null}
    </>
  );
}
