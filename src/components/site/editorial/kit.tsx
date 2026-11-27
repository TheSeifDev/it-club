import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/**
 * Editorial kit shared by the inner pages. Server components only: motion is
 * attached by `motion/editorial-pages.ts` through data attributes.
 */

export const kit = {
  page: "relative min-w-0 overflow-clip text-[var(--site-ink)]",
  gutter: "px-[var(--site-gutter)]",
  meta: "m-0 text-[.66rem] font-medium uppercase leading-none tracking-[.16em] text-[var(--site-copy)]",
  giant: "m-0 font-normal leading-[.84] tracking-[-.085em] text-[var(--site-ink)]",
  h2: "m-0 text-[clamp(2.6rem,6.4vw,7.4rem)] font-normal leading-[.92] tracking-[-.075em] text-[var(--site-ink)] [&_em]:not-italic [&_em]:text-[var(--site-sky-ink)]",
  lead: "m-0 max-w-[44ch] text-[clamp(.9rem,1.1vw,1.05rem)] leading-[1.75] text-[var(--site-copy)]",
  arabic: "m-0 font-[family-name:var(--font-alexandria)] text-[.86rem] leading-[1.8] text-[var(--site-sky-ink)]",
  outline: "text-transparent [-webkit-text-stroke:1px_var(--stroke,rgb(82_232_209_/_.75))]",
  /** Outlined text that fills with ink as `--fill` goes 0% → 100% (see data-fill). */
  fill: "[--fill:100%] bg-[linear-gradient(90deg,var(--fill-ink,var(--site-ink))_var(--fill),transparent_var(--fill))] bg-clip-text text-transparent [-webkit-text-stroke:1px_var(--stroke,rgb(255_255_255_/_.35))]",
} as const;

/** "( text )" meta labels in the Attio Offsite manner. */
export function Meta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${kit.meta} ${className}`}><span aria-hidden="true">(</span>{children}<span aria-hidden="true">)</span></p>;
}

/** A word whose characters rise out of a line mask on load (hero titles). */
export function Chars({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((char, index) => char === " "
        ? <span key={index} className="inline-block w-[.24em]" />
        : <span key={index} data-k-char className="inline-block will-change-transform">{char}</span>)}
    </>
  );
}

/** One masked line of a kinetic title. `side` lets it drift apart on scroll. */
export function KLine({ children, side, className = "" }: { children: ReactNode; side?: "l" | "r"; className?: string }) {
  return (
    <span data-k-side={side} className={`block overflow-hidden pt-[.04em] pb-[.12em] -mb-[.12em] ${className}`} aria-hidden="true">
      {children}
    </span>
  );
}

/** Rounded media tile set inline between title words; opens sideways on load. */
export function KTile({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span data-k-tile className={`relative mx-[.08em] inline-block h-[.74em] overflow-hidden rounded-[.14em] align-[-.02em] ${className}`} style={style} aria-hidden="true">
      {children}
    </span>
  );
}

/** Masked reveal lines for section headings. */
export function MaskLines({ lines, className = "", as: Tag = "h2", id }: { lines: ReactNode[]; className?: string; as?: "h2" | "h3" | "p"; id?: string }) {
  return (
    <Tag id={id} className={className} data-line-mask>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden pb-[.1em] -mb-[.1em]"><span data-line className="block">{line}</span></span>
      ))}
    </Tag>
  );
}

/** Infinite marquee; speed follows scroll velocity. Content is decorative. */
export function Marquee({ children, dir = "l", speed = 1, className = "" }: { children: ReactNode; dir?: "l" | "r"; speed?: number; className?: string }) {
  return (
    <div data-v-marquee data-dir={dir} data-speed={speed} className={`pointer-events-none select-none overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
      <div data-v-track className="flex w-max will-change-transform">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0">{children}</div>
      </div>
    </div>
  );
}

const pill = "group/pill relative isolate inline-flex min-h-[52px] items-center gap-4 overflow-hidden rounded-full bg-[var(--site-glass-strong)] py-[5px] pr-[5px] pl-5 text-[.8rem] tracking-[-.03em] text-[var(--site-ink)]! transition-colors duration-300 before:absolute before:inset-0 before:-z-[1] before:translate-y-full before:rounded-[inherit] before:bg-[var(--site-ink)] before:transition-transform before:duration-500 before:ease-[cubic-bezier(.2,.8,.2,1)] hover:text-[var(--site-night)]! hover:before:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:before:transition-none [&>span]:grid [&>span]:size-[42px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-sky)] [&>span]:text-[var(--site-night)] [&>span]:transition-transform [&>span]:duration-500 hover:[&>span]:rotate-45 motion-reduce:hover:[&>span]:rotate-0";

export function Pill({ href, children, arrow = "↗", external = false }: { href: string; children: ReactNode; arrow?: string; external?: boolean }) {
  if (external || href.startsWith("mailto:") || href.startsWith("http")) {
    return <a href={href} className={pill} data-magnetic target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{children}<span aria-hidden="true">{arrow}</span></a>;
  }
  return <Link href={href} className={pill} data-magnetic>{children}<span aria-hidden="true">{arrow}</span></Link>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group/link inline-flex min-h-11 items-center gap-2 text-[.76rem] tracking-[-.03em] text-[var(--site-copy)]! transition-colors hover:text-[var(--site-ink)]! [&>span]:inline-block [&>span]:text-[var(--site-sky-ink)] [&>span]:transition-transform [&>span]:duration-300 hover:[&>span]:translate-x-0.5 hover:[&>span]:-translate-y-0.5">
      {children} <span aria-hidden="true">↗</span>
    </Link>
  );
}

/** Section opener: roman numeral, rule, label — and an optional right slot. */
export function ChapterRow({ number, label, aside }: { number: string; label: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <p className="m-0 inline-flex items-baseline gap-3 text-[.72rem] uppercase leading-none tracking-[.16em] text-[var(--site-copy)]">
        <span className="font-medium tracking-[.04em] text-[var(--site-sky-ink)]">{number}</span>
        <i aria-hidden="true" className="block h-px w-8 -translate-y-[.25em] bg-[rgb(255_255_255_/_.25)]" />
        <span>{label}</span>
      </p>
      {aside}
    </div>
  );
}

/** Scroll cue used by every hero. */
export function ScrollCue({ label = "Scroll" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-3 text-[.66rem] uppercase tracking-[.16em] text-[var(--site-copy)]" aria-hidden="true">
      {label}
      <i className="relative block h-px w-12 overflow-hidden bg-[rgb(255_255_255_/_.18)] after:absolute after:inset-0 after:origin-left after:bg-[var(--site-sky-ink)] after:motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]" />
    </span>
  );
}

/** Film-grain + vignette for printed / photographic surfaces. */
export function Grain({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 opacity-[.16] mix-blend-overlay [background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")] ${className}`} />
  );
}
