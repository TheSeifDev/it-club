"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Code2,
  Cpu, FlaskConical, Handshake, Lightbulb, Megaphone, Plus, Share2, Users,
} from "lucide-react";
import { gsap } from "./motion/gsap";
import type { EditorialEvent, EditorialPartner, EditorialPerson, EditorialTrack } from "./editorial-types";

// Static Tailwind v4 utilities keep this public page themeable without a CSS module.
const styles = {
  fillWord: "[--word-fill:100%] [--word-ink:var(--site-ink)] inline-block bg-[linear-gradient(90deg,var(--word-ink)_var(--word-fill),var(--site-word-muted)_var(--word-fill))] bg-clip-text text-transparent data-[word-accent]:[--word-ink:var(--site-sky-ink)] supports-[not_(background-clip:text)]:bg-none supports-[not_(background-clip:text)]:text-[var(--word-ink)] forced-colors:bg-none forced-colors:text-[CanvasText]",
  pill: "group inline-flex min-h-[47px] items-center gap-[15px] rounded-full bg-[var(--site-glass-strong)] py-[5px] pr-[5px] pl-[17px] text-[.76rem] tracking-[-.04em] text-[var(--site-ink)]! transition-colors duration-200 [&>span]:grid [&>span]:size-[37px] [&>span]:place-items-center [&>span]:rounded-full [&>span]:bg-[var(--site-glass-soft)] [&>span]:text-[var(--site-ink)] [&>span]:transition-[background,transform] [&>span]:duration-300 hover:[&>span]:rotate-45 hover:[&>span]:bg-[rgb(40_205_183_/_20%)] motion-reduce:hover:[&>span]:rotate-0",
  empty: "rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[38px] text-[var(--site-copy)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] [&_h3]:mt-0 [&_h3]:text-[2rem] [&_h3]:font-normal [&_h3]:leading-[1.1] [&_h3]:tracking-[-.055em] [&_h3]:text-[var(--site-ink)] [&_p]:text-[.83rem] max-[520px]:p-[25px]",
  about: "scroll-mt-[88px] bg-transparent px-[var(--site-gutter)] pt-[clamp(66px,7vw,112px)] pb-[68px] text-[var(--site-ink)] max-[520px]:pt-[50px] max-[520px]:pb-12",
  sectionTop: "flex items-start justify-between gap-8 max-[520px]:items-center max-[520px]:gap-3",
  quietLink: "inline-flex min-h-11 items-center gap-[13px] text-[.77rem] tracking-[-.035em] max-[520px]:gap-[6px] max-[520px]:text-[.62rem]",
  aboutStatement: "relative px-[4.5vw] pt-[91px] max-[800px]:px-0 max-[800px]:pt-[75px] [&>h2]:mx-auto [&>h2]:my-0 [&>h2]:text-center [&>h2]:text-[clamp(1.6rem,2.9vw,3.5rem)] [&>h2]:font-normal [&>h2]:leading-[1.44] [&>h2]:tracking-[-.063em] max-[800px]:[&>h2]:text-[clamp(1.6rem,3.9vw,2.6rem)] max-[520px]:[&>h2]:text-[1.54rem] max-[520px]:[&>h2]:leading-[1.53]",
  aboutTile: "absolute top-[15px] left-[20%] grid size-[139px] rotate-[-24deg] place-items-center rounded-[17px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] text-[var(--site-sky-ink)] opacity-[.82] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] max-[800px]:top-[6px] max-[800px]:left-[13%] max-[800px]:size-[101px] max-[520px]:left-[10%] max-[800px]:[&_svg]:w-[51px]",
  inlineIcon: "mx-[3px] inline-flex h-[42px] w-[65px] items-center justify-center rounded-full border border-[rgb(81_234_213_/_32%)] bg-[rgb(40_205_183_/_13%)] align-middle text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_0_28px_rgb(40_205_183_/_10%)] max-[800px]:h-8 max-[800px]:w-[49px] max-[800px]:[&_svg]:w-6",
  inlinePill: "inline-block -rotate-2 rounded-full border border-[rgb(81_234_213_/_32%)] bg-[rgb(40_205_183_/_13%)] px-[13px] align-middle text-[.72em] leading-[1.7] text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_0_28px_rgb(40_205_183_/_10%)]",
  aboutArabic: "mt-[26px] mb-0 text-center text-[.87rem] text-[var(--site-copy)] max-[520px]:text-[.7rem]",
  aboutSeal: "mt-[54px] flex items-center justify-center gap-[22px] [&>span]:h-px [&>span]:w-[100px] [&>span]:bg-[linear-gradient(90deg,transparent,rgb(40_205_183_/_0.45))] [&>span:last-child]:rotate-180 [&>div]:grid [&>div]:size-[56px] [&>div]:h-[68px] [&>div]:place-items-center [&>div]:rounded-full [&>div]:border [&>div]:border-[var(--site-glass-border)] [&>div]:text-[var(--site-sky-ink)] [&>div]:shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[520px]:mt-[38px] max-[520px]:[&>span]:w-[58px]",
  tracks: "scroll-mt-[88px] border-t-0 bg-transparent px-[var(--site-gutter)] pt-[58px] pb-[74px] text-[var(--site-ink)] max-[520px]:pt-[44px] max-[520px]:pb-[46px]",
  splitTop: "flex items-start justify-between gap-8 [&>h2]:w-[49%] [&>h2]:m-0 [&>h2]:text-[clamp(2rem,3.8vw,4.5rem)] [&>h2]:font-normal [&>h2]:leading-[1.08] [&>h2]:tracking-[-.068em] max-[800px]:flex-col max-[800px]:gap-7 max-[800px]:[&>h2]:w-full max-[520px]:[&>h2]:text-[2.15rem]",
  trackGrid: "mt-[62px] grid grid-cols-2 gap-[26px] max-[1100px]:gap-5 max-[800px]:mt-9 max-[800px]:grid-cols-1",
  staticTrackCatalog: "mt-4 grid grid-cols-6 gap-[10px] data-[hydrated=true]:hidden [&>a]:grid [&>a]:min-h-[49px] [&>a]:min-w-0 [&>a]:grid-cols-[auto_1fr_auto] [&>a]:items-center [&>a]:gap-[10px] [&>a]:rounded-xl [&>a]:bg-[var(--site-glass-soft)] [&>a]:px-3 [&>a]:text-[.66rem] [&>a]:leading-[1.3] [&>a]:text-[var(--site-ink)] [&>a]:focus-visible:outline [&>a]:focus-visible:outline-2 [&>a]:focus-visible:outline-[var(--site-sky-ink)] [&>a]:focus-visible:outline-offset-[3px] [&>a>span:first-child]:text-[.59rem] [&>a>span:first-child]:[font-variant-numeric:tabular-nums] [&>a>span:nth-child(2)]:overflow-hidden [&>a>span:nth-child(2)]:text-ellipsis [&>a>span:nth-child(2)]:whitespace-nowrap [&>a>svg]:text-[var(--catalog-accent,var(--site-sky-ink))] max-[800px]:grid-cols-3 max-[520px]:grid-cols-2 max-[520px]:gap-2 max-[520px]:[&>a]:min-h-11 max-[520px]:[&>a]:px-[9px] max-[520px]:[&>a]:text-[.61rem] [&>a>span:first-child]:text-[var(--catalog-accent,var(--site-sky-ink))]",
  featureCard: "group relative flex min-h-[clamp(355px,32vw,540px)] flex-col justify-between overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--card-accent)_25%,var(--site-glass-border))] bg-[radial-gradient(ellipse_at_75%_15%,color-mix(in_srgb,var(--card-accent)_15%,transparent),transparent_60%),var(--site-glass)] p-6 shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] transition-shadow duration-300 hover:shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_28%),0_0_40px_color-mix(in_srgb,var(--card-accent,var(--site-sky))_9%,transparent)] max-[800px]:min-h-[385px] max-[520px]:min-h-[355px] max-[520px]:p-5",
  featureMeta: "relative z-[2] flex gap-[7px] text-[.66rem] max-[520px]:text-[.57rem] [&>span]:inline-flex [&>span]:min-h-[35px] [&>span]:items-center [&>span]:rounded-full [&>span]:border [&>span]:border-[var(--site-glass-border)] [&>span]:px-[13px] [&>span]:shadow-[inset_0_1px_0_var(--site-glass-highlight)]",
  featureWatermark: "pointer-events-none absolute top-[-25px] right-[-85px] rotate-[16deg] text-[var(--card-accent,var(--site-sky))] opacity-[.12]",
  featureIcon: "absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--card-accent,var(--site-sky-ink))] before:absolute before:inset-[-21px] before:rounded-[35%] before:bg-[color-mix(in_srgb,var(--card-accent)_12%,transparent)] before:content-[''] [&_svg]:relative",
  featureBottom: "relative mt-auto flex items-end justify-between gap-[22px] [&_h3]:m-0 [&_h3]:max-w-[11ch] [&_h3]:text-[clamp(2.4rem,4.9vw,5.3rem)] [&_h3]:font-normal [&_h3]:leading-[.99] [&_h3]:tracking-[-.075em] [&_p]:mt-[13px] [&_p]:mb-0 [&_p]:w-fit [&_p]:text-[.81rem] [&_p]:text-[var(--site-copy)] max-[800px]:[&_h3]:text-[3.4rem] max-[520px]:[&_h3]:text-[3.2rem]",
  roundArrow: "grid size-[60px] shrink-0 place-items-center rounded-full border border-[var(--site-glass-border)] bg-[rgb(40_205_183_/_14%)] text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-[transform,background] duration-300 group-hover:rotate-45 group-hover:bg-[rgb(40_205_183_/_20%)] motion-reduce:group-hover:rotate-0 max-[520px]:size-12",
  trackAside: "flex min-w-0 flex-col max-[800px]:grid max-[800px]:grid-cols-1",
  smallCards: "grid grid-cols-2 gap-[22px] max-[1100px]:gap-[14px] max-[800px]:gap-[18px]",
  smallCard: "group relative min-h-[clamp(190px,17vw,285px)] cursor-pointer overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--card-accent)_22%,var(--site-glass-border))] bg-[radial-gradient(ellipse_at_90%_0%,color-mix(in_srgb,var(--card-accent)_12%,transparent),transparent_70%),var(--site-glass)] p-[20px_17px] text-left text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] transition-shadow duration-300 hover:shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_28%),0_0_40px_color-mix(in_srgb,var(--card-accent,var(--site-sky))_9%,transparent)] [&_h3]:relative [&_h3]:mt-[121px] [&_h3]:mb-0 [&_h3]:text-[clamp(1.35rem,2.25vw,2.6rem)] [&_h3]:font-normal [&_h3]:leading-[1.04] [&_h3]:tracking-[-.063em] max-[1100px]:[&_h3]:text-[1.6rem] max-[800px]:min-h-[193px] max-[800px]:[&_h3]:mt-[116px] max-[800px]:[&_h3]:text-[1.8rem] max-[520px]:min-h-[195px] max-[520px]:p-4 max-[520px]:[&_h3]:text-[1.65rem]",
  smallPlus: "absolute top-[17px] left-[17px] grid size-[35px] place-items-center rounded-full border border-[var(--site-glass-border)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[1100px]:top-[17px] max-[1100px]:left-[13px] max-[1100px]:size-7 max-[520px]:top-[13px] max-[520px]:left-[13px]",
  smallIcon: "absolute top-[22px] right-[17px] text-[var(--card-accent,var(--site-sky-ink))] before:absolute before:inset-[-10px] before:rounded-[15px] before:bg-[color-mix(in_srgb,var(--card-accent)_13%,transparent)] before:content-[''] [&_svg]:relative max-[1100px]:right-[13px] max-[1100px]:[&_svg]:w-[47px] max-[800px]:[&_svg]:w-[63px] max-[520px]:top-10 max-[520px]:right-[14px] max-[520px]:[&_svg]:w-12",
  carouselControls: "mt-6 flex items-center justify-end gap-[10px]",
  carouselStatus: "mr-auto text-[.66rem] tabular-nums text-[var(--site-copy)]",
  previous: "grid size-[45px] place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-[background,transform] duration-200 hover:translate-x-[2px] hover:bg-[rgb(40_205_183_/_20%)] disabled:transform-none disabled:cursor-default disabled:opacity-[.35] motion-reduce:hover:translate-x-0 max-[520px]:size-10",
  next: "grid size-[45px] place-items-center rounded-full border border-[var(--site-glass-border)] bg-[rgb(40_205_183_/_14%)] text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-[background,transform] duration-200 hover:translate-x-[2px] hover:bg-[rgb(40_205_183_/_20%)] disabled:transform-none disabled:cursor-default disabled:opacity-[.35] motion-reduce:hover:translate-x-0 max-[520px]:size-10",
  trackDescription: "mt-auto ml-auto w-[51%] pt-[34px] [&_p]:m-0 [&_p]:text-[.78rem] [&_p]:leading-[1.65] [&_p]:tracking-[-.025em] [&_p]:text-[var(--site-copy)] [&_a]:mt-[13px] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:text-[.69rem] [&_a]:text-[var(--site-sky-ink)] max-[800px]:ml-0 max-[800px]:w-[68%] max-[800px]:pt-6 max-[520px]:w-full",
  events: "border-t-0 bg-transparent px-[var(--site-gutter)] pt-[65px] pb-[74px] text-[var(--site-ink)] max-[520px]:pt-[44px] max-[520px]:pb-[46px]",
  eventsGrid: "mt-[35px] grid grid-cols-[1fr_1.2fr] gap-[clamp(46px,8vw,140px)] max-[1100px]:gap-[50px] max-[800px]:grid-cols-1 max-[800px]:gap-9",
  eventsIntro: "[&_h2]:m-0 [&_h2]:text-[clamp(2rem,3.8vw,4.5rem)] [&_h2]:font-normal [&_h2]:leading-[1.08] [&_h2]:tracking-[-.068em] [&_h2>span]:text-[var(--site-sky-ink)] [&>p]:mt-[26px] [&>p]:mb-0 [&>p]:max-w-[410px] [&>p]:text-[.82rem] [&>p]:leading-[1.7] [&>p]:tracking-[-.025em] [&>p]:text-[var(--site-copy)] max-[800px]:[&>p]:max-w-none max-[520px]:[&_h2]:text-[2.15rem]",
  eventLandscape: "mt-[47px] grid min-h-[clamp(220px,23vw,360px)] place-items-center content-center gap-[30px] rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] [&>span]:text-[.6rem] [&>span]:tracking-[.12em] [&>span]:text-[var(--site-copy)] max-[800px]:mt-[30px] max-[800px]:min-h-[225px]",
  eventList: "pt-[6px]",
  eventRow: "grid grid-cols-[26px_1fr_38px] items-center gap-[14px] py-[21px] [&_h3]:m-0 [&_h3]:text-[clamp(1.2rem,2.25vw,2.8rem)] [&_h3]:font-normal [&_h3]:leading-[1.15] [&_h3]:tracking-[-.065em] max-[800px]:[&_h3]:text-[clamp(1.6rem,4.8vw,2.2rem)]",
  eventExpanded: "grid-cols-[26px_1fr_118px] items-start pt-0 pb-7 max-[1100px]:grid-cols-[21px_1fr_88px] max-[800px]:grid-cols-[24px_1fr_96px] max-[520px]:grid-cols-[18px_1fr_69px] max-[520px]:gap-[10px]",
  eventNumber: "self-start pt-[5px] text-[.69rem] text-[var(--site-copy)]",
  eventDate: "mt-[14px] mb-0 text-[.65rem] text-[var(--site-sky-ink)]",
  eventSummary: "mt-[10px] mb-0 text-[.77rem] leading-[1.7] text-[var(--site-copy)] max-[520px]:text-[.7rem]",
  detailLink: "mt-[22px] inline-flex min-h-[39px] items-center gap-[10px] rounded-full border border-[var(--site-glass-border)] px-[14px] text-[.66rem]",
  eventThumbnail: "mt-[10px] grid size-[118px] place-items-center rounded-[15px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] text-[var(--site-copy)]! shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[1100px]:size-[88px] max-[1100px]:h-[100px] max-[800px]:size-[96px] max-[800px]:h-[106px] max-[520px]:size-[69px] max-[520px]:h-[82px] max-[520px]:[&_svg]:w-[37px]",
  eventArrow: "relative grid size-9 place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] [&>svg:first-child]:hidden",
  eventCta: "mt-[26px] flex justify-end",
  eventEmpty: "flex min-h-[310px] flex-col justify-center rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-8 text-[var(--site-copy)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] [&_h3]:mt-[26px] [&_h3]:mb-3 [&_h3]:text-[clamp(1.6rem,2.8vw,3rem)] [&_h3]:font-normal [&_h3]:leading-[1.07] [&_h3]:tracking-[-.055em] [&_h3]:text-[var(--site-ink)] [&_p]:max-w-[400px] [&_p]:text-[.82rem] [&_p]:leading-[1.8] [&_p]:text-[var(--site-copy)] max-[520px]:min-h-[275px] max-[520px]:p-[25px]",
  community: "border-t-0 bg-transparent px-[var(--site-gutter)] pt-[68px] pb-[54px] text-[var(--site-ink)] max-[520px]:pt-[44px] max-[520px]:pb-[46px]",
  peopleGrid: "mt-[37px] grid grid-cols-[.95fr_2fr] gap-7 max-[1100px]:grid-cols-[.85fr_2fr] max-[1100px]:gap-5 max-[800px]:grid-cols-1 max-[800px]:gap-[30px]",
  peopleIntro: "flex min-w-0 flex-col justify-between gap-[68px] [&_h2]:m-0 [&_h2]:text-[clamp(2rem,3.5vw,4.2rem)] [&_h2]:font-normal [&_h2]:leading-[1.08] [&_h2]:tracking-[-.068em] max-[800px]:grid max-[800px]:grid-cols-[auto_1fr] max-[800px]:items-end max-[800px]:gap-[30px] max-[800px]:[&_h2]:text-[clamp(1.8rem,4.5vw,3rem)] max-[520px]:gap-[17px] max-[520px]:[&_h2]:text-[1.75rem]",
  peopleSymbol: "grid size-[160px] place-items-center rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] max-[800px]:size-[110px] max-[800px]:h-[120px] max-[800px]:[&_svg]:w-[60px] max-[520px]:size-[82px] max-[520px]:h-[92px] max-[520px]:[&_svg]:w-11",
  peopleArabic: "mt-[18px] mb-0 w-fit text-[.74rem] text-[var(--site-copy)]",
  peopleControls: "mt-6 flex items-center gap-[10px] max-[520px]:mt-5 max-[520px]:gap-[7px]",
  peopleCards: "grid grid-cols-2 gap-[22px] max-[1100px]:gap-4 max-[800px]:gap-[18px] max-[520px]:grid-cols-1 max-[520px]:gap-4",
  personCard: "flex min-h-[470px] flex-col rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[clamp(22px,2vw,34px)] text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] transition-shadow duration-300 hover:shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_28%),0_0_40px_color-mix(in_srgb,var(--card-accent,var(--site-sky))_9%,transparent)] max-[1100px]:min-h-[470px] max-[1100px]:p-[22px] max-[800px]:min-h-[420px] max-[520px]:min-h-[360px] max-[520px]:p-[26px]",
  personTop: "flex items-center justify-between gap-3 max-[1100px]:items-start max-[520px]:items-center [&>span:first-child]:inline-flex [&>span:first-child]:items-center [&>span:first-child]:gap-[7px] [&>span:first-child]:text-[.65rem] [&>span:first-child]:leading-[1.4]",
  personSymbol: "grid size-[58px] shrink-0 place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] text-[var(--site-copy)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[1100px]:size-11 max-[520px]:size-[52px]",
  personScope: "mt-[43px] [&>span]:mb-[17px] [&>span]:block [&>span]:text-[var(--site-sky-ink)] [&>small]:text-[.57rem] [&>small]:text-[var(--site-copy)] [&>p]:mt-[9px] [&>p]:mb-0 [&>p]:text-[clamp(1.2rem,1.85vw,2.2rem)] [&>p]:font-normal [&>p]:leading-[1.3] [&>p]:tracking-[-.06em] max-[800px]:[&>p]:text-[clamp(1.1rem,2.8vw,1.6rem)] max-[520px]:mt-[26px] max-[520px]:[&>p]:text-[1.48rem]",
  scopeIcon: "mb-[17px] block text-[var(--site-sky-ink)]",
  personBottom: "mt-auto pt-[35px] [&_h3]:m-0 [&_h3]:text-[.88rem] [&_h3]:font-medium [&_h3]:leading-[1.3] [&_h3]:tracking-[-.035em] [&_p]:mt-[7px] [&_p]:mb-0 [&_p]:text-[.69rem] [&_p]:leading-[1.6] [&_p]:text-[var(--site-copy)] [&>span]:mt-[13px] [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[6px] [&>span]:text-[.62rem] [&>span]:text-[var(--site-sky-ink)]",
  profileCount: "ml-[2px] text-[.58rem] text-[var(--site-copy)]",
  partners: "mt-[42px] flex flex-wrap items-center gap-[22px] text-[.7rem] text-[var(--site-copy)] [&_a]:inline-flex [&_a]:items-center [&_a]:gap-[7px] [&_a]:text-[var(--site-copy)] [&_a:last-child]:ml-auto [&_a:last-child]:text-[var(--site-sky-ink)] max-[520px]:mt-7 max-[520px]:gap-4 max-[520px]:[&_a:last-child]:ml-0",
  joinScene: "isolate relative min-h-[640px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_0%,rgb(40_205_183_/_12%),transparent_62%),linear-gradient(145deg,#0c141c,#05070a)] px-[var(--site-gutter)] pt-[43px] pb-[70px] max-[800px]:min-h-[570px] max-[800px]:pb-[75px] max-[520px]:min-h-[590px] max-[520px]:pt-[30px]",
  joinChapter: "relative z-[2]",
  joinBackdrop: "pointer-events-none absolute inset-[-12%_-6%] -z-[1] flex rotate-[-18deg] items-center justify-center text-[#3f706e] opacity-[.45] [&>svg]:h-auto [&>svg]:w-[70%] [&>span]:absolute [&>span]:top-[17%] [&>span]:right-[1%] [&>span]:rotate-[26deg] [&>span]:text-[#4f777d]",
  joinPanel: "relative mx-auto mt-[60px] flex min-h-[413px] w-[min(62%,780px)] flex-col justify-between gap-14 rounded-[18px] border border-[var(--site-glass-border)] bg-[rgb(14_22_29_/_68%)] px-[clamp(26px,3vw,46px)] pt-[clamp(37px,4vw,62px)] pb-[38px] text-center text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] [&_h2]:m-0 [&_h2]:text-[clamp(2rem,3.5vw,4.25rem)] [&_h2]:font-normal [&_h2]:leading-[1.17] [&_h2]:tracking-[-.064em] max-[800px]:mt-[47px] max-[800px]:min-h-[380px] max-[800px]:w-[85%] max-[800px]:px-[25px] max-[800px]:[&_h2]:text-[clamp(1.9rem,4.5vw,2.8rem)] max-[520px]:mt-[47px] max-[520px]:min-h-[395px] max-[520px]:w-[calc(100%_-_18px)] max-[520px]:gap-12 max-[520px]:px-5 max-[520px]:pt-8 max-[520px]:pb-9 max-[520px]:[&_h2]:text-[1.82rem]",
  joinCopy: "mx-auto w-4/5 [&>a]:inline-flex [&>a]:items-center [&>a]:gap-[6px] [&>a]:text-[.76rem] [&>a]:underline [&>a]:underline-offset-[3px] [&>a_svg]:text-[var(--site-sky-ink)] [&>p]:mt-2 [&>p]:mb-0 [&>p]:text-[.72rem] [&>p]:leading-[1.6] [&>p]:tracking-[-.025em] [&>p]:text-[var(--site-copy)] [&>span]:mt-3 [&>span]:block [&>span]:text-[.66rem] [&>span]:text-[var(--site-copy)] max-[520px]:w-[92%]",
  joinTile: "absolute right-[-65px] bottom-[-37px] grid size-[140px] place-items-center rounded-[18px] border border-[var(--site-glass-border)] bg-[rgb(21_47_48_/_85%)] text-[var(--site-sky-ink)]! shadow-[inset_0_1px_0_var(--site-glass-highlight),0_24px_70px_rgb(0_0_0_/_24%)] max-[800px]:right-[-26px] max-[800px]:bottom-[-38px] max-[800px]:size-[105px] max-[800px]:[&>svg:first-child]:w-[53px] max-[520px]:right-[-8px] max-[520px]:bottom-[-51px] max-[520px]:size-[94px] [&>svg:last-child]:absolute [&>svg:last-child]:right-3 [&>svg:last-child]:bottom-3",
  notice: "flex items-center gap-5 bg-[rgb(40_205_183_/_7%)] px-[var(--site-gutter)] py-[22px] text-[.78rem] [&>span]:whitespace-nowrap [&>span]:text-[var(--site-sky-ink)] [&>p]:m-0 [&>a]:ml-auto [&>a]:flex [&>a]:items-center [&>a]:gap-[7px] [&>a]:whitespace-nowrap [&>a]:text-[var(--site-sky-ink)] max-[800px]:flex-wrap max-[800px]:gap-[9px]",
} as const;

type HomeProps = {
  tracks: EditorialTrack[];
  people: EditorialPerson[];
  events: EditorialEvent[];
  eventMode: "upcoming" | "archive" | "undated";
  partners: EditorialPartner[];
  notice?: { title: string; summary?: string; href?: string };
};

const trackIcons: Record<string, typeof Users> = {
  hr: Users, pr: Megaphone, sm: Share2, oc: CalendarDays, it: Code2, rnd: FlaskConical,
};

/** Each word keeps its semantic text in SSR; only its paint is scroll-driven. */
function FillWords({ text, accent = false }: { text: string; accent?: boolean }) {
  return text.split(/(\s+)/).filter(Boolean).map((word, index) => /^\s+$/.test(word) ? word : (
    <span key={index} className={styles.fillWord} data-editorial-word data-word-accent={accent || undefined}>{word}</span>
  ));
}

function Chapter({ number, children }: { number: string; children: string }) {
  return <p className="m-0 inline-flex items-center text-[.77rem] font-normal leading-none tracking-[-.04em] max-[520px]:text-[.71rem] [&>span:first-child]:grid [&>span:first-child]:size-[43px] [&>span:first-child]:place-items-center [&>span:first-child]:rounded-full [&>span:first-child]:bg-[var(--site-glass-soft)] [&>span:first-child]:text-[.7rem] [&>span:first-child]:[font-variant-numeric:tabular-nums] [&>span:first-child]:text-[var(--site-sky-ink)] [&>span:last-child]:inline-flex [&>span:last-child]:min-h-[43px] [&>span:last-child]:items-center [&>span:last-child]:rounded-full [&>span:last-child]:bg-[var(--site-glass-soft)] [&>span:last-child]:px-[19px] [&>span:last-child]:text-[var(--site-ink)] max-[520px]:[&>span:first-child]:size-[38px] max-[520px]:[&>span:last-child]:min-h-[38px] max-[520px]:[&>span:last-child]:px-[15px]"><span>{number}</span><span>{children}</span></p>;
}

function PillLink({ href, children }: { href: string; children: string }) {
  return <Link href={href} className={styles.pill} data-magnetic>{children}<span><ArrowUpRight size={20} strokeWidth={1.5} aria-hidden="true" /></span></Link>;
}

function TrackCarousel({ tracks }: { tracks: EditorialTrack[] }) {
  const [index, setIndex] = useState(0);
  const catalog = useRef<HTMLElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [active, ...rest] = Array.from({ length: Math.min(3, tracks.length) }, (_, offset) => tracks[(index + offset) % tracks.length]);

  useEffect(() => {
    const element = catalog.current;
    if (element) element.dataset.hydrated = "true";
    return () => { if (element) delete element.dataset.hydrated; };
  }, []);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const gridElement = grid.current;
    if (!gridElement || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = gsap.context(() => {
      gsap.fromTo("[data-carousel-detail]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .045, ease: "power3.out" });
      gsap.fromTo("[data-carousel-icon]", { scale: .88, rotation: -7 }, { scale: 1, rotation: 0, duration: .8, ease: "power3.out" });
    }, gridElement);
    return () => context.revert();
  }, [index]);

  if (!active) return <div className={styles.empty}><Cpu size={46} strokeWidth={1.2} aria-hidden="true" /><h3>The next chapter is taking shape.</h3><p>No tracks have been published yet.</p><PillLink href="/community">Meet the community</PillLink></div>;
  const ActiveIcon = trackIcons[active.slug] || Code2;
  const move = (amount: number) => setIndex((value) => (value + amount + tracks.length) % tracks.length);

  return (
    <>
      <div className={styles.trackGrid} ref={grid} role="region" aria-label="Explore published tracks" aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
      }}>
      <Link href={`/tracks#${active.slug}`} className={styles.featureCard} data-editorial-lift style={{ "--card-accent": active.color, "--card-ink": active.ink } as CSSProperties} aria-label={`Explore ${active.title}`}>
        <div className={styles.featureMeta} data-carousel-detail><span>{active.category || "Our tracks"}</span><span>{active.slug.toUpperCase()}</span></div>
        <span className={styles.featureWatermark} aria-hidden="true"><ActiveIcon size={330} strokeWidth={.7} /></span>
        <span className={styles.featureIcon} data-carousel-icon aria-hidden="true"><ActiveIcon size={115} strokeWidth={1.05} /></span>
        <div className={styles.featureBottom} data-carousel-detail>
          <div><h3>{active.title}</h3>{active.arabicTitle ? <p lang="ar" dir="rtl">{active.arabicTitle}</p> : null}</div>
          <span className={styles.roundArrow}><ArrowUpRight size={27} strokeWidth={1.4} aria-hidden="true" /></span>
        </div>
      </Link>
      <div className={styles.trackAside}>
        <div className={styles.smallCards}>
          {rest.map((track, offset) => {
            const Icon = trackIcons[track.slug] || Code2;
            return <button key={track.id} type="button" className={styles.smallCard} onClick={() => move(offset + 1)} aria-label={`Feature ${track.title}`} style={{ "--card-accent": track.color, "--card-ink": track.ink } as CSSProperties} data-editorial-lift>
              <span className={styles.smallPlus}><Plus size={17} strokeWidth={1.4} aria-hidden="true" /></span>
              <span className={styles.smallIcon} data-carousel-icon><Icon size={59} strokeWidth={1.05} aria-hidden="true" /></span>
              <h3 data-carousel-detail>{track.title}</h3>
            </button>;
          })}
        </div>
        <div className={styles.carouselControls}>
          <span className={styles.carouselStatus} aria-live="polite" aria-atomic="true">{String(index + 1).padStart(2, "0")} / {String(tracks.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => move(-1)} className={styles.previous} disabled={tracks.length < 2} aria-label="Previous track"><ArrowLeft size={18} aria-hidden="true" /></button>
          <button type="button" onClick={() => move(1)} className={styles.next} disabled={tracks.length < 2} aria-label="Next track"><ArrowRight size={18} aria-hidden="true" /></button>
        </div>
        <div className={styles.trackDescription} data-carousel-detail><p>{active.summary || "Different ways to contribute. A shared commitment to learning by doing."}</p><Link href={`/tracks#${active.slug}`}>Explore this track <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
      </div>
      </div>
      {tracks.length ? (
        <nav
          ref={catalog}
          className={styles.staticTrackCatalog}
          aria-label="Browse all published tracks"
        >
          {tracks.map((track, trackIndex) => (
            <Link
              key={track.id}
              href={`/tracks#${track.slug}`}
              style={{ "--catalog-accent": track.color, "--catalog-ink": track.ink } as CSSProperties}
            >
              <span>{String(trackIndex + 1).padStart(2, "0")}</span>
              <span>{track.title}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      ) : null}
    </>
  );
}

function PeopleCards({ people }: { people: EditorialPerson[] }) {
  const [offset, setOffset] = useState(0);
  const cards = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    if (!cards.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = cards.current.querySelectorAll("[data-person-content]");
    if (!targets.length) return;
    const context = gsap.context(() => gsap.fromTo(targets, { x: 36, opacity: 0 }, { x: 0, opacity: 1, stagger: .06, duration: .65, ease: "power3.out" }), cards);
    return () => context.revert();
  }, [offset]);
  const selected = Array.from({ length: Math.min(2, people.length) }, (_, index) => people[(offset + index) % people.length]);
  const move = (direction: number) => setOffset((value) => (value + direction * 2 + people.length) % people.length);
  return (
    <div className={styles.peopleGrid}>
      <div className={styles.peopleIntro}>
        <div className={styles.peopleSymbol} data-editorial-symbol><Users size={76} strokeWidth={1.1} aria-hidden="true" /></div>
        <div><h2 id="home-community-title">Different people.<br />Shared momentum.</h2>
          <p className={styles.peopleArabic} lang="ar" dir="rtl">الفكرة بتكبر بناسها.</p>
          <div className={styles.peopleControls}>
            <button type="button" className={styles.previous} onClick={() => move(-1)} disabled={people.length < 3} aria-label="Previous community profiles"><ArrowLeft size={18} aria-hidden="true" /></button>
            <button type="button" className={styles.next} onClick={() => move(1)} disabled={people.length < 3} aria-label="Next community profiles"><ArrowRight size={18} aria-hidden="true" /></button>
            <span className={styles.profileCount} aria-live="polite">{people.length ? `${offset + 1}–${((offset + selected.length - 1) % people.length) + 1} / ${people.length}` : "No profiles yet"}</span>
          </div>
        </div>
      </div>
      <div className={styles.peopleCards} ref={cards}>
        {selected.map((person) => <Link key={person.id} href={`/community/${person.slug}`} className={styles.personCard} data-editorial-reveal aria-label={`Meet ${person.name}`}>
          <div className={styles.personTop} data-person-content><span><Users size={16} strokeWidth={1.4} aria-hidden="true" />{person.committee || "Community"}</span><span className={styles.personSymbol}><Lightbulb size={29} strokeWidth={1.1} aria-hidden="true" /></span></div>
          <div className={styles.personScope} data-person-content><span className={styles.scopeIcon}><ArrowUpRight size={26} strokeWidth={1.6} aria-hidden="true" /></span><small>Published team scope</small><p>{person.scope}</p></div>
          <div className={styles.personBottom} data-person-content><h3>{person.name}</h3><p>{person.role}</p><span>View profile <ArrowUpRight size={12} aria-hidden="true" /></span></div>
        </Link>)}
        {!selected.length ? <div className={styles.empty}><h3>The people make the difference.</h3><p>The published directory is being prepared.</p><PillLink href="/community">Explore the community</PillLink></div> : null}
      </div>
    </div>
  );
}

export function EditorialHome({ tracks, people, events, eventMode, partners, notice }: HomeProps) {
  return (
    <>
      {notice ? <aside className={styles.notice} aria-label="Current club notice"><span>Club notice</span><p><strong>{notice.title}</strong>{notice.summary ? ` — ${notice.summary}` : ""}</p>{notice.href ? <a href={notice.href}>Read more <ArrowUpRight size={15} aria-hidden="true" /></a> : null}</aside> : null}
      <section className={styles.about} id="about" aria-labelledby="about-title" data-editorial-about>
        <div className={styles.sectionTop}><Chapter number="01">About</Chapter><Link className={styles.quietLink} href="/community">Meet the people <ArrowUpRight size={16} strokeWidth={1.4} aria-hidden="true" /></Link></div>
        <div className={styles.aboutStatement}>
          <div className={styles.aboutTile} data-editorial-symbol aria-hidden="true"><Cpu size={76} strokeWidth={1} /></div>
          <h2 id="about-title" data-editorial-statement>
            <FillWords text="We are a student-led " />
            <span className={styles.inlineIcon} data-editorial-chip aria-hidden="true"><Code2 size={30} strokeWidth={1.5} /></span>{" "}
            <FillWords text="technology community at " />
            <span className={styles.inlinePill} data-editorial-chip>BATU</span>
            <FillWords text=", making room for curious minds and different starting points. From sharing knowledge " />
            <span className={styles.inlineIcon} data-editorial-chip aria-hidden="true"><BookOpen size={29} strokeWidth={1.4} /></span>{" "}
            <FillWords text="to building useful ideas, we create the space to " />
            <FillWords text="learn together, practice with purpose, and move ideas forward." accent />
          </h2>
          <p className={styles.aboutArabic} lang="ar" dir="rtl">نتعلّم معًا، ونبني ما بعد الفكرة.</p>
        </div>
        <div className={styles.aboutSeal} aria-hidden="true"><span /><div data-editorial-symbol><Cpu size={28} strokeWidth={1.15} /></div><span /></div>
      </section>

      <section className={styles.tracks} id="tracks" aria-labelledby="home-tracks-title" data-editorial-tracks>
        <div className={styles.splitTop}><Chapter number="02">Our tracks</Chapter><h2 id="home-tracks-title" data-editorial-reveal>Different ways to learn.<br />One place to belong.</h2></div>
        <TrackCarousel tracks={tracks} />
      </section>

      <section className={styles.events} aria-labelledby="home-events-title" data-editorial-events>
        <Chapter number="03">Events</Chapter>
        <div className={styles.eventsGrid}>
          <div className={styles.eventsIntro} data-editorial-reveal>
            <h2 id="home-events-title"><span>Ideas, in action.</span><br />{eventMode === "upcoming" ? "What’s coming up." : eventMode === "archive" ? "From the club archive." : "Around the club."}</h2>
            <p>{eventMode === "upcoming" ? "Published dates and details, so you know where to find us next." : eventMode === "archive" ? "A look at our published past events. New dates appear here when they are announced." : "Published events and sessions from the community. Dates appear when confirmed."}</p>
            <div className={styles.eventLandscape} aria-hidden="true" data-editorial-symbol><CalendarDays size={110} strokeWidth={.85} /><span>LEARN / CONNECT / MAKE</span></div>
          </div>
          <div className={styles.eventList}>
            {events.map((event, index) => <article key={event.id} className={`${styles.eventRow} ${index === 0 ? styles.eventExpanded : ""}`} data-editorial-reveal>
              <span className={styles.eventNumber}>{String(index + 1).padStart(2, "0")}.</span>
              <div><h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>{index === 0 ? <><p className={styles.eventDate}>{event.date}</p>{event.summary ? <p className={styles.eventSummary}>{event.summary}</p> : null}<Link href={`/events/${event.slug}`} className={styles.detailLink}>View details <ArrowUpRight size={13} aria-hidden="true" /></Link></> : null}</div>
              <Link href={`/events/${event.slug}`} className={index === 0 ? styles.eventThumbnail : styles.eventArrow} aria-label={`View ${event.title}`}><CalendarDays size={index === 0 ? 52 : 16} strokeWidth={1.1} aria-hidden="true" />{index !== 0 ? <ArrowUpRight size={17} aria-hidden="true" /> : null}</Link>
            </article>)}
            {!events.length ? <div className={styles.eventEmpty}><CalendarDays size={39} strokeWidth={1.2} aria-hidden="true" /><h3>Something worth showing up for.</h3><p>No event listing has been published yet. Follow the events page for confirmed updates.</p></div> : null}
            <div className={styles.eventCta}><PillLink href="/events">All events</PillLink></div>
          </div>
        </div>
      </section>

      <section className={styles.community} aria-labelledby="home-community-title" data-editorial-community>
        <Chapter number="04">Community</Chapter>
        <PeopleCards people={people} />
        <div className={styles.partners}>
          {partners.length ? <><span>In good company</span>{partners.slice(0, 4).map((partner) => <a key={partner.id} href={partner.href || "/sponsors"}><Handshake size={16} strokeWidth={1.2} aria-hidden="true" />{partner.name}</a>)}</> : <span>Good ideas grow with good company.</span>}
          <Link href="/sponsors">Our partners <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={styles.joinScene} aria-labelledby="home-join-title" data-editorial-join>
        <div className={styles.joinChapter}><Chapter number="05">Find your place</Chapter></div>
        <div className={styles.joinBackdrop} aria-hidden="true" data-editorial-join-art><Cpu size={640} strokeWidth={.55} /><span><Code2 size={320} strokeWidth={.7} /></span></div>
        <div className={styles.joinPanel} data-editorial-join-panel>
          <h2 id="home-join-title">Find your people and<br />give your <span className={styles.inlineIcon}><Lightbulb size={29} strokeWidth={1.3} aria-hidden="true" /></span> curiosity<br />somewhere to go.</h2>
          <div className={styles.joinCopy}><Link href="/tracks">Explore our tracks <ArrowUpRight size={14} aria-hidden="true" /></Link><p>Discover the teams, meet the people, and see where your next idea could begin.</p><span lang="ar" dir="rtl">فكرتك الجاية مش لازم تبدأ لوحدك.</span></div>
          <Link href="/community" className={styles.joinTile} aria-label="Meet the IT Club community" data-editorial-symbol><Users size={65} strokeWidth={1.05} aria-hidden="true" /><ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </>
  );
}
