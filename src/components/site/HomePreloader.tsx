"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./motion/gsap";

export const PRELOADER_EVENT = "itc:preloader-done";

/**
 * Runs during HTML parsing on the first document load of "/" in a session.
 * It only adds a class; the preloader is hidden by default, so no-JS visitors,
 * reduced-motion visitors and client-side navigations never see it. A timer
 * removes the class even if the JavaScript bundle never arrives.
 */
const BOOT = `(function(){try{var d=document.documentElement;if(location.pathname!=="/")return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("itc-preloaded"))return;sessionStorage.setItem("itc-preloaded","1");d.classList.add("itc-preloading");setTimeout(function(){if(d.classList.contains("itc-preloading")){d.classList.remove("itc-preloading");window.dispatchEvent(new Event("${PRELOADER_EVENT}"))}},6500)}catch(e){}})();`;

export function PreloaderBoot() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}

export function HomePreloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = root.current;
    const counter = count.current;
    const html = document.documentElement;
    if (!element || !counter || !html.classList.contains("itc-preloading")) return;
    window.__siteLenis?.stop();
    const finish = () => {
      html.classList.remove("itc-preloading");
      window.__siteLenis?.start();
      window.dispatchEvent(new Event(PRELOADER_EVENT));
    };
    const progress = { value: 0 };
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: finish });
      timeline
        .fromTo("[data-preloader-letter]", { yPercent: 110 }, { yPercent: 0, duration: .9, stagger: .05, ease: "expo.out" }, 0)
        .fromTo("[data-preloader-meta]", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .6, stagger: .08, ease: "power3.out" }, .15)
        .to(progress, {
          value: 100, duration: 1.55, ease: "power2.inOut",
          onUpdate: () => { counter.textContent = String(Math.round(progress.value)).padStart(3, "0"); },
        }, .1)
        .fromTo("[data-preloader-bar]", { scaleX: 0 }, { scaleX: 1, duration: 1.55, ease: "power2.inOut" }, .1)
        .to("[data-preloader-letter]", { yPercent: -110, duration: .6, stagger: .03, ease: "power3.in" }, 1.75)
        .to("[data-preloader-meta]", { opacity: 0, duration: .3 }, 1.75)
        .to(element, { yPercent: -100, duration: 1, ease: "expo.inOut" }, 2.05)
        .to("[data-preloader-curtain]", { scaleY: 0, duration: .9, ease: "expo.inOut" }, 2.15);
    }, element);
    return () => {
      context.revert();
      // StrictMode re-runs effects on a still-mounted node; finish only on a real unmount.
      window.setTimeout(() => {
        if (!element.isConnected && html.classList.contains("itc-preloading")) finish();
      }, 0);
    };
  }, []);
  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[9997] hidden flex-col justify-between bg-[var(--site-night)] px-[var(--site-gutter)] py-[clamp(24px,4vh,44px)] text-[var(--site-ink)] [.itc-preloading_&]:flex motion-reduce:hidden!"
    >
      <div className="flex items-start justify-between text-[.68rem] uppercase tracking-[.16em] text-[var(--site-copy)]">
        <span data-preloader-meta>IT Club — BATU</span>
        <span data-preloader-meta lang="ar" dir="rtl" className="tracking-normal normal-case">نادي تكنولوجيا المعلومات</span>
      </div>
      <div className="flex items-end justify-between gap-6">
        <p className="m-0 flex overflow-hidden text-[clamp(4rem,15vw,15rem)] leading-[.86] tracking-[-.085em]">
          {"IT Club".split("").map((letter, index) => (
            <span key={index} className="block whitespace-pre" data-preloader-letter>{letter}</span>
          ))}
        </p>
        <span ref={count} className="pb-[.6em] text-[clamp(1rem,2vw,1.6rem)] tabular-nums tracking-[-.04em] text-[var(--site-sky-ink)]">000</span>
      </div>
      <span className="absolute right-0 bottom-0 left-0 block h-[2px] origin-left bg-[var(--site-sky-ink)]" data-preloader-bar />
      <span className="absolute top-full right-0 left-0 block h-[18vh] origin-top rounded-b-[50%_100%] bg-[var(--site-night)]" data-preloader-curtain />
    </div>
  );
}
