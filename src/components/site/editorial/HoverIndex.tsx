"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "../motion/gsap";

export type HoverIndexItem = {
  key: string;
  href: string;
  number: string;
  title: string;
  arabic?: string;
  meta?: string;
  code: string;
  color: string;
  image?: { src: string; alt: string; cutout?: boolean };
};

/**
 * Big typographic index. Rows fill with their own colour from below; on fine
 * pointers a print-like preview follows the cursor and swaps per row.
 */
export function HoverIndex({ items, label }: { items: HoverIndexItem[]; label: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const list = listRef.current;
    const preview = previewRef.current;
    if (!list || !preview) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!fine.matches) return;
    gsap.set(preview, { xPercent: -50, yPercent: -50, scale: .6, opacity: 0 });
    const x = gsap.quickTo(preview, "x", { duration: .6, ease: "power3.out" });
    const y = gsap.quickTo(preview, "y", { duration: .6, ease: "power3.out" });
    const rotate = gsap.quickTo(preview, "rotation", { duration: .8, ease: "power3.out" });
    let lastX = 0;
    const onMove = (event: PointerEvent) => {
      const box = list.getBoundingClientRect();
      x(event.clientX - box.left);
      y(event.clientY - box.top);
      rotate(gsap.utils.clamp(-12, 12, (event.clientX - lastX) * .5));
      lastX = event.clientX;
    };
    const onEnter = () => gsap.to(preview, { scale: 1, opacity: 1, duration: .5, ease: "power3.out" });
    const onLeave = () => { gsap.to(preview, { scale: .6, opacity: 0, duration: .4, ease: "power3.in" }); setActive(-1); };
    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerenter", onEnter);
    list.addEventListener("pointerleave", onLeave);
    return () => {
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerenter", onEnter);
      list.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(preview);
    };
  }, []);

  return (
    <div className="relative">
      <ol ref={listRef} className="relative m-0 list-none p-0" aria-label={label} data-rise-group>
        {items.map((item, index) => (
          <li key={item.key} data-rise className="relative border-t border-[rgb(255_255_255_/_.09)] last:border-b">
            <Link
              href={item.href}
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              data-cursor="Open"
              style={{ "--row": item.color } as CSSProperties}
              className="group/row relative isolate grid min-h-[clamp(92px,11vw,170px)] grid-cols-[clamp(44px,6vw,110px)_minmax(0,1fr)_auto] items-center gap-x-[clamp(14px,2vw,36px)] overflow-hidden px-[var(--site-gutter)] text-[var(--site-ink)]! transition-colors duration-500 before:absolute before:inset-0 before:-z-[1] before:origin-bottom before:scale-y-0 before:bg-[var(--row)] before:transition-transform before:duration-[650ms] before:ease-[cubic-bezier(.7,0,.2,1)] hover:text-[var(--site-night)]! hover:before:scale-y-100 focus-visible:outline-none focus-visible:before:scale-y-100 focus-visible:text-[var(--site-night)]! motion-reduce:before:transition-none max-[700px]:grid-cols-[38px_minmax(0,1fr)_auto]"
            >
              <span className="self-start pt-[clamp(18px,2.2vw,34px)] text-[.72rem] tabular-nums tracking-[.04em] opacity-70">{item.number}</span>
              <span className="min-w-0">
                <span className="block truncate text-[clamp(2.1rem,6.6vw,7.6rem)] leading-[1.02] tracking-[-.075em] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/row:translate-x-[clamp(8px,1.6vw,28px)] motion-reduce:transition-none">{item.title}</span>
              </span>
              <span className="flex flex-col items-end gap-1.5 text-right">
                {item.arabic ? <span lang="ar" dir="rtl" className="font-[family-name:var(--font-alexandria)] text-[clamp(.72rem,1vw,.92rem)] text-[var(--row)] transition-colors duration-500 group-hover/row:text-[var(--site-night)] max-[700px]:hidden">{item.arabic}</span> : null}
                <span className="inline-flex items-center gap-3 text-[.68rem] uppercase tracking-[.14em] opacity-80">
                  <span className="max-[700px]:hidden">{item.meta}</span>
                  <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-[rgb(255_255_255_/_.08)] text-[.9rem] transition-transform duration-500 group-hover/row:rotate-45 group-hover/row:bg-[rgb(0_0_0_/_.12)]">↗</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div ref={previewRef} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-10 h-[clamp(220px,22vw,340px)] w-[clamp(176px,17vw,270px)] opacity-0 max-[1023px]:hidden">
        {items.map((item, index) => (
          <div key={item.key} className="absolute inset-0 overflow-hidden rounded-[14px] bg-[#0b1115] shadow-[0_30px_80px_rgb(0_0_0_/_.55)] transition-[clip-path] duration-700 ease-[cubic-bezier(.7,0,.2,1)]" style={{ clipPath: index === active ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)", "--row": item.color } as CSSProperties}>
            {item.image ? (
              item.image.cutout ? (
                <span className="absolute inset-0 [background:radial-gradient(circle_at_50%_38%,color-mix(in_srgb,var(--row)_60%,transparent),transparent_72%),#0b1115]">
                  <Image src={item.image.src} alt="" fill sizes="270px" className="object-contain object-bottom pt-6" />
                </span>
              ) : (
                <Image src={item.image.src} alt="" fill sizes="270px" className="object-cover" unoptimized={item.image.src.startsWith("/manus-storage")} />
              )
            ) : (
              <span className="absolute inset-0 grid place-items-center [background:radial-gradient(circle_at_50%_30%,color-mix(in_srgb,var(--row)_55%,transparent),transparent_70%),#0b1115]">
                <span className="text-[clamp(4.2rem,7vw,6.6rem)] leading-none tracking-[-.08em] text-[var(--site-night)] [-webkit-text-stroke:0]" style={{ color: item.color }}>{item.code}</span>
              </span>
            )}
            <span className="absolute right-3 bottom-3 left-3 flex justify-between text-[.6rem] uppercase tracking-[.14em] text-white/80"><span>{item.number}</span><span>{item.code}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
