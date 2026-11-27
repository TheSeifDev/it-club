"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Minus,
  Pause,
  Plus,
  Play,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { buildStoreOrderMailto, quoteStoreSelection } from "@/lib/store/catalog";
import { gsap } from "@/src/components/site/motion/gsap";
import StoreBadge from "./StoreBadge";

const vestPhoto = "/manus-storage/vest-front-back_6c4ced93.webp";
const fieldPhotos = [
  "/manus-storage/club-in-action-01_cfc54ef8.webp",
  "/manus-storage/club-in-action-02_18620573.webp",
] as const;

function QuantityControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] p-1.5">
      <button
        aria-label={`Remove one ${label}`}
        className="grid size-9 place-items-center rounded-full text-[var(--site-copy)] transition hover:bg-white/10 hover:text-[var(--site-ink)] focus-visible:outline-2 focus-visible:outline-[var(--site-sky-ink)]"
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        type="button"
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <output aria-label={`${label} quantity`} className="w-7 text-center text-sm tabular-nums text-[var(--site-ink)]">
        {value}
      </output>
      <button
        aria-label={`Add one ${label}`}
        className="grid size-9 place-items-center rounded-full bg-[var(--site-sky)] text-[var(--site-night)] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:transition-none"
        disabled={value >= 20}
        onClick={() => onChange(Math.min(20, value + 1))}
        type="button"
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function StoreCinema() {
  return (
    <section
      aria-label="The vest in the community"
      className="relative isolate overflow-clip bg-[var(--site-night-2)] px-[var(--site-gutter)] py-[clamp(60px,8vw,110px)]"
      data-store-cinema
    >
      <div
        className="mx-auto grid min-h-[min(82svh,900px)] max-w-none grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] items-center gap-[clamp(35px,7vw,110px)] max-[850px]:min-h-0 max-[850px]:grid-cols-1 max-[850px]:gap-8"
        data-store-pin
      >
        <div className="relative z-10 max-w-[570px]" data-store-cinema-copy>
          <p className="mb-6 text-[.7rem] tracking-[.1em] text-[var(--site-sky-ink)]">
            WORN WHERE THE WORK HAPPENS / 02
          </p>
          <h2 className="m-0 text-[clamp(3rem,7.5vw,8rem)] font-normal leading-[.91] tracking-[-.075em] text-[var(--site-ink)]">
            A team, <em className="text-[var(--site-sky-ink)] not-italic">in motion.</em>
          </h2>
          <div className="mt-7 min-h-[94px] max-w-[440px]">
            <p className="m-0 text-[.95rem] leading-[1.8] text-[var(--site-copy)]" data-store-caption="0">
              The club vest is built for the moments members share, create, and represent the team together.
            </p>
            <p className="m-0 text-[.95rem] leading-[1.8] text-[var(--site-copy)]" data-store-caption="1">
              Seen in the room, on the move, and at the center of the next idea.
            </p>
          </div>
          <a
            className="mt-7 inline-flex min-h-12 items-center gap-4 rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass)] px-5 text-[.76rem] text-[var(--site-ink)] transition hover:border-[var(--site-sky-ink)] motion-reduce:transition-none"
            href="#shop-kit"
          >
            Build your kit <ArrowDownRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className="relative min-w-0" data-store-cinema-frames>
          {fieldPhotos.map((src, index) => (
            <figure
              className={`relative m-0 aspect-video overflow-hidden rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-night)] shadow-[0_32px_90px_rgb(0_0_0_/_35%)] ${index ? "mt-3" : ""}`}
              data-store-frame={index}
              key={src}
            >
              <Image
                alt={index === 0 ? "IT Club members wearing their work vests at a university event" : "An IT Club member representing the team during a presentation"}
                className="object-cover"
                fill
                unoptimized
                sizes="(max-width: 850px) 92vw, 58vw"
                src={src}
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-[#05070a]/90 via-[#05070a]/30 to-transparent px-5 pt-20 pb-5 text-[.66rem] tracking-[.08em] text-white/90 max-[520px]:px-3 max-[520px]:pb-3">
                <span>IT CLUB / OUT IN THE WORLD</span>
                <span>{String(index + 1).padStart(2, "0")} — 02</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Storefront() {
  const rootRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<gsap.core.Tween | null>(null);
  const motionPausedRef = useRef(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [bundleQuantity, setBundleQuantity] = useState(0);
  const [badgeOnlyQuantity, setBadgeOnlyQuantity] = useState(0);
  const [eligibility, setEligibility] = useState<"already-paid" | "main-board" | null>(null);
  const [sizePreference, setSizePreference] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const quote = quoteStoreSelection({ bundleQuantity, badgeOnlyQuantity });
  const orderHref = buildStoreOrderMailto({
    bundleQuantity,
    badgeOnlyQuantity,
    eligibility,
    sizePreference,
    requesterName,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const motionAllowed = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const finePointer = window.matchMedia("(min-width: 851px) and (hover: hover) and (pointer: fine)");
    let idleFloat: gsap.core.Tween | null = null;
    let context: gsap.Context | undefined;
    let stopTilt: (() => void) | undefined;

    const clearMotion = () => {
      stopTilt?.();
      stopTilt = undefined;
      const layer = root.querySelector<HTMLElement>("[data-store-tilt]");
      if (layer) gsap.killTweensOf(layer, "rotationX,rotationY");
      floatRef.current = null;
      idleFloat?.kill();
      idleFloat = null;
      context?.revert();
      context = undefined;
    };

    const setupMotion = () => {
      if (!motionAllowed.matches) return;
      context = gsap.context(() => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .fromTo("[data-store-kicker]", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
          .fromTo("[data-store-title]", { yPercent: 82, rotateX: -9, opacity: 0 }, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.05 }, "-=0.35")
          .fromTo("[data-store-lede]", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, "-=0.48")
          .fromTo("[data-store-hero-art]", { y: 72, rotateX: 8, rotateY: -7, scale: 0.96, opacity: 0 }, { y: 0, rotateX: 0, rotateY: 0, scale: 1, opacity: 1, duration: 1.2, ease: "power3.out" }, "-=0.56");
        idleFloat = gsap.to("[data-store-float]", {
          y: -9,
          rotationZ: 0.6,
          duration: 3.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        idleFloat.paused(motionPausedRef.current);
        floatRef.current = idleFloat;

        const revealItems = gsap.utils.toArray<HTMLElement>("[data-store-reveal]", root);
        revealItems.forEach((element) => {
          gsap.fromTo(element, { y: 42, opacity: 0 }, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          });
        });

        const frames = gsap.utils.toArray<HTMLElement>("[data-store-frame]", root);
        const captions = gsap.utils.toArray<HTMLElement>("[data-store-caption]", root);
        if (frames.length === 2 && captions.length === 2 && finePointer.matches) {
          gsap.set(frames[1], {
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            marginTop: 0,
            opacity: 0,
            scale: 1.07,
            yPercent: 3,
          });
          gsap.set(captions[1], { opacity: 0, y: 14 });
          const cinema = root.querySelector<HTMLElement>("[data-store-cinema]");
          const pin = root.querySelector<HTMLElement>("[data-store-pin]");
          if (cinema && pin) {
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: cinema,
                start: "top top+=82",
                end: "+=90%",
                pin,
                pinSpacing: true,
                scrub: 0.9,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });
            timeline
              .to(frames[0], { scale: 1.09, yPercent: -2, duration: 1 }, 0)
              .to(captions[0], { opacity: 0, y: -16, duration: 0.45 }, 0.55)
              .to(frames[1], { opacity: 1, scale: 1, yPercent: 0, duration: 1 }, 0.72)
              .to(captions[1], { opacity: 1, y: 0, duration: 0.6 }, 1.02);
          }
        }
      }, root);

      const hero = root.querySelector<HTMLElement>("[data-store-hero-art]");
      const layer = root.querySelector<HTMLElement>("[data-store-tilt]");
      if (hero && layer && finePointer.matches) {
        const tiltX = gsap.quickTo(layer, "rotationX", { duration: 0.65, ease: "power3.out" });
        const tiltY = gsap.quickTo(layer, "rotationY", { duration: 0.65, ease: "power3.out" });
        const move = (event: PointerEvent) => {
          const rect = hero.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          tiltX(-y * 5);
          tiltY(x * 7);
        };
        const leave = () => { tiltX(0); tiltY(0); };
        hero.addEventListener("pointermove", move, { passive: true });
        hero.addEventListener("pointerleave", leave, { passive: true });
        stopTilt = () => {
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
        };
      }
    };
    const syncMotionPreferences = () => {
      clearMotion();
      setupMotion();
    };

    setupMotion();
    motionAllowed.addEventListener("change", syncMotionPreferences);
    finePointer.addEventListener("change", syncMotionPreferences);
    return () => {
      motionAllowed.removeEventListener("change", syncMotionPreferences);
      finePointer.removeEventListener("change", syncMotionPreferences);
      clearMotion();
    };
  }, []);

  useEffect(() => {
    motionPausedRef.current = motionPaused;
    floatRef.current?.paused(motionPaused);
  }, [motionPaused]);

  return (
    <div className="min-w-0 overflow-clip bg-transparent text-[var(--site-ink)]" ref={rootRef}>
      <section className="relative isolate grid min-h-[min(930px,100svh)] grid-cols-[minmax(0,.86fr)_minmax(0,1.14fr)] items-center gap-[clamp(22px,4vw,72px)] px-[var(--site-gutter)] pt-[132px] pb-[clamp(58px,7vw,100px)] max-[850px]:min-h-0 max-[850px]:grid-cols-1 max-[850px]:gap-4 max-[850px]:pt-[122px] max-[520px]:pt-[110px]" data-store-hero>
        <div className="relative z-10 max-w-[750px]">
          <p className="mb-6 inline-flex items-center gap-3 text-[.66rem] tracking-[.1em] text-[var(--site-sky-ink)]" data-store-kicker>
            <span className="size-[6px] rounded-full bg-[var(--site-sky)] shadow-[0_0_18px_var(--site-sky)]" />
            IT CLUB / FIELD KIT — DROP 01
          </p>
          <h1 className="m-0 max-w-[10ch] [perspective:900px] text-[clamp(3.5rem,8.6vw,9.2rem)] font-normal leading-[.87] tracking-[-.08em] text-[var(--site-ink)] max-[850px]:max-w-[9ch] max-[560px]:text-[clamp(3.2rem,14vw,5.4rem)]" data-store-title>
            Wear the <em className="text-[var(--site-sky-ink)] not-italic">work.</em>
          </h1>
          <p className="mt-[clamp(25px,3vw,42px)] mb-0 max-w-[420px] text-[.93rem] leading-[1.85] text-[var(--site-copy)]" data-store-lede>
            One field-ready vest. One club identity. Made for the people who show up, build together, and carry the work into every room.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4" data-store-hero-cta>
            <a className="inline-flex min-h-[50px] items-center gap-5 rounded-full bg-[var(--site-sky)] py-1 pr-1 pl-5 text-[.78rem] font-semibold text-[var(--site-night)] transition hover:-translate-y-0.5 hover:bg-[var(--site-sky-ink)] motion-reduce:transition-none" href="#shop-kit">
              <span>Build your kit · EGP 250</span>
              <span className="grid size-[42px] place-items-center rounded-full bg-[var(--site-night)] text-[var(--site-sky-ink)]"><ArrowDown size={17} aria-hidden="true" /></span>
            </a>
            <a className="inline-flex min-h-[47px] items-center gap-2 text-[.72rem] text-[var(--site-copy)] transition hover:text-[var(--site-ink)]" href="#id-card">
              See the ID concept <ArrowDownRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="mt-[clamp(36px,6vw,74px)] flex flex-wrap gap-x-8 gap-y-3 text-[.62rem] tracking-[.07em] text-[var(--site-mist)] max-[850px]:mt-8">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[var(--site-sky-ink)]" aria-hidden="true" /> CLUB KIT / 01</span>
            <span>VEST + ID + LANYARD</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[850px] [perspective:1400px]" data-store-hero-art>
          <div className="pointer-events-none absolute inset-[12%] rounded-full bg-[radial-gradient(ellipse_at_center,rgb(40_205_183_/_18%),transparent_67%)] blur-2xl" />
          <div className="relative z-[1] overflow-hidden rounded-[18px] border border-[var(--site-glass-border)] bg-white shadow-[0_42px_120px_rgb(0_0_0_/_35%),inset_0_1px_0_rgb(255_255_255_/_45%)] [transform-style:preserve-3d]" data-store-tilt>
            <div className="relative aspect-[1.5/1] w-full" data-store-float>
              <Image alt="Front and back views of the IT Club navy vest with reflective trim, pockets, and club logo" className="object-contain" fill priority unoptimized sizes="(max-width: 850px) 96vw, 56vw" src={vestPhoto} />
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-black/10 bg-white/85 px-3 py-2 text-[.57rem] font-semibold tracking-[.08em] text-[#101820] shadow-sm backdrop-blur-sm max-[520px]:top-2 max-[520px]:left-2 max-[520px]:px-2 max-[520px]:py-1.5">
              <span className="size-1.5 rounded-full bg-[#28cdb7]" /> FRONT / BACK
            </div>
          <div className="absolute right-4 bottom-4 rounded-full bg-[#091019]/90 px-3.5 py-2 text-[.58rem] tracking-[.07em] text-white max-[520px]:right-2 max-[520px]:bottom-2">
              CLUB ISSUE / 001
            </div>
          </div>
          <button
            aria-label={motionPaused ? "Resume hero float" : "Pause hero float"}
            aria-pressed={motionPaused}
            className="absolute bottom-4 left-4 z-[2] inline-flex min-h-9 items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 text-[.57rem] font-medium text-[#101820] shadow-sm transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:hidden motion-reduce:transition-none max-[520px]:bottom-2 max-[520px]:left-2"
            onClick={() => setMotionPaused((paused) => !paused)}
            type="button"
          >
            {motionPaused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}
            {motionPaused ? "RESUME FLOAT" : "PAUSE FLOAT"}
          </button>
          <div className="absolute right-[4%] bottom-[-24px] z-[2] hidden items-center gap-3 rounded-full border border-[var(--site-glass-border)] bg-[var(--site-night-2)]/90 px-4 py-3 shadow-[0_15px_40px_rgb(0_0_0_/_25%)] backdrop-blur-md min-[851px]:flex" data-store-float>
            <span className="grid size-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--site-sky)_18%,transparent)] text-[var(--site-sky-ink)]"><ShoppingBag size={16} aria-hidden="true" /></span>
            <span className="text-[.61rem] leading-[1.5] text-[var(--site-copy)]">THE FIELD KIT <b className="block text-[.75rem] font-medium text-[var(--site-ink)]">EGP 250</b></span>
          </div>
        </div>
        <a aria-label="Scroll to the vest story" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[.58rem] tracking-[.08em] text-[var(--site-mist)] min-[851px]:inline-flex" href="#store-story">
          KEEP EXPLORING <ArrowDown size={14} aria-hidden="true" />
        </a>
      </section>

      <div id="store-story"><StoreCinema /></div>

      <section className="px-[var(--site-gutter)] py-[clamp(72px,10vw,140px)]" data-store-reveal>
        <div className="mb-[clamp(28px,4vw,50px)] flex items-end justify-between gap-8 max-[620px]:flex-col max-[620px]:items-start max-[620px]:gap-4">
          <div>
            <p className="mb-4 text-[.67rem] tracking-[.1em] text-[var(--site-sky-ink)]">01 / THE CLUB UNIFORM</p>
            <h2 className="m-0 max-w-[13ch] text-[clamp(2.8rem,6vw,6.5rem)] font-normal leading-[.95] tracking-[-.075em]">Built to <em className="text-[var(--site-sky-ink)] not-italic">show up.</em></h2>
          </div>
          <p className="mb-1 max-w-[390px] text-[.87rem] leading-[1.8] text-[var(--site-copy)]">The product photograph shows the front and back of the supplied vest. Pick the complete kit below; sizes are recorded as a preference and confirmed by the team.</p>
        </div>
        <div className="grid grid-cols-[minmax(0,1.06fr)_minmax(290px,.94fr)] gap-[clamp(28px,7vw,108px)] border-y border-[var(--site-glass-border)] py-7 max-[820px]:grid-cols-1 max-[820px]:gap-6">
          <div className="grid grid-cols-2 gap-2 text-[.62rem] text-[var(--site-mist)] max-[480px]:grid-cols-1">
            <span className="inline-flex items-center gap-2 py-1"><Check className="text-[var(--site-sky-ink)]" size={15} aria-hidden="true" /> Supplied front + back product photo</span>
            <span className="inline-flex items-center gap-2 py-1"><Check className="text-[var(--site-sky-ink)]" size={15} aria-hidden="true" /> ID + lanyard included in kit</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[.63rem] tracking-[.07em] text-[var(--site-copy)]">THE COMPLETE SET</span>
            <span className="text-[clamp(1.45rem,3vw,2rem)] tracking-[-.06em] text-[var(--site-ink)]">EGP 250</span>
          </div>
        </div>
      </section>

      <section className="relative grid min-h-[min(810px,92svh)] grid-cols-[minmax(0,1fr)_minmax(280px,.82fr)] items-center gap-[clamp(28px,8vw,124px)] overflow-clip bg-[var(--site-paper)] px-[var(--site-gutter)] py-[clamp(54px,8vw,104px)] text-[var(--site-ink)] max-[850px]:min-h-0 max-[850px]:grid-cols-1 max-[850px]:gap-9" id="id-card">
        <div className="relative z-[1] max-w-[530px]" data-store-reveal>
          <p className="mb-5 text-[.66rem] tracking-[.12em] text-[var(--site-sky-ink)]">02 / THE IDENTITY PIECE</p>
          <h2 className="m-0 text-[clamp(3rem,6.6vw,7.2rem)] font-normal leading-[.91] tracking-[-.08em]">The next thing you wear. <em className="text-[var(--site-sky-ink)] not-italic">Your place.</em></h2>
          <p className="mt-6 mb-0 max-w-[420px] text-[.89rem] leading-[1.8] text-[var(--site-copy)]">An IT Club ID card on a matching lanyard. This is a concept preview using the current club logo; the approved card artwork will replace it when received.</p>
          <div className="mt-7 flex flex-wrap gap-3 text-[.58rem] tracking-[.08em] text-[var(--site-mist)]">
            <span className="rounded-full border border-black/15 px-3 py-2">CARD ART / PENDING</span>
            <span className="rounded-full border border-black/15 px-3 py-2">LOGO / CURRENT OFFICIAL ASSET</span>
          </div>
        </div>
        <StoreBadge className="relative z-[1] mx-auto w-full max-w-[520px]" />
        <span className="pointer-events-none absolute top-10 right-[5%] text-[clamp(3rem,12vw,11rem)] font-normal tracking-[-.1em] text-black/[.035]" aria-hidden="true">ID / 02</span>
      </section>

      <section className="px-[var(--site-gutter)] py-[clamp(75px,10vw,140px)]" data-store-reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-4 text-[.67rem] tracking-[.1em] text-[var(--site-sky-ink)]">03 / PICK YOUR EDITION</p>
            <h2 className="m-0 text-[clamp(2.9rem,6vw,6rem)] font-normal leading-[.96] tracking-[-.075em]">Choose your <em className="text-[var(--site-sky-ink)] not-italic">kit.</em></h2>
          </div>
          <p className="mb-1 max-w-[380px] text-[.82rem] leading-[1.75] text-[var(--site-copy)]">Select a complete kit, or request the ID-only version if you already paid or you’re Main Board.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1" id="shop-kit">
          <article className="relative overflow-hidden rounded-[17px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-6 shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[520px]:p-5" data-store-spotlight>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-[color-mix(in_srgb,var(--site-sky)_17%,transparent)] text-[var(--site-sky-ink)]"><ShoppingBag size={18} aria-hidden="true" /></span>
              <span className="rounded-full border border-[var(--site-sky)]/30 bg-[var(--site-sky)]/10 px-3 py-1.5 text-[.57rem] tracking-[.08em] text-[var(--site-sky-ink)]">FULL FIELD KIT</span>
            </div>
            <h3 className="mt-7 mb-1 text-[1.55rem] font-normal tracking-[-.055em]">Vest + ID + lanyard</h3>
            <p className="m-0 max-w-[45ch] text-[.77rem] leading-[1.75] text-[var(--site-copy)]">One complete IT Club set. The supplied vest photo shows the front and back.</p>
            <div className="mt-7 flex items-end justify-between gap-4 border-t border-[var(--site-glass-border)] pt-5">
              <div><span className="block text-[.56rem] tracking-[.08em] text-[var(--site-mist)]">BUNDLE PRICE</span><strong className="mt-1 block text-[1.5rem] font-normal tracking-[-.055em]">EGP 250</strong></div>
              <QuantityControl label="complete kit" value={bundleQuantity} onChange={setBundleQuantity} />
            </div>
            <p className="mt-4 mb-0 text-[.65rem] leading-[1.65] text-[var(--site-mist)]">Enter your preferred vest size in the order summary. Size availability is confirmed before purchase.</p>
          </article>

          <article className="relative overflow-hidden rounded-[17px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-6 shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[520px]:p-5" data-store-spotlight>
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-full border border-[var(--site-glass-border)] bg-white/[.04] text-[var(--site-sky-ink)]"><ShieldCheck size={18} aria-hidden="true" /></span>
              <span className="rounded-full border border-[var(--site-glass-border)] px-3 py-1.5 text-[.57rem] tracking-[.08em] text-[var(--site-copy)]">ELIGIBLE MEMBERS</span>
            </div>
            <h3 className="mt-7 mb-1 text-[1.55rem] font-normal tracking-[-.055em]">ID card + lanyard</h3>
            <p className="m-0 max-w-[45ch] text-[.77rem] leading-[1.75] text-[var(--site-copy)]">For members who already paid, or Main Board members ordering the ID by itself.</p>
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Choose ID-only eligibility">
              {(["already-paid", "main-board"] as const).map((item) => (
                <button
                  aria-pressed={eligibility === item}
                  className={`min-h-10 rounded-full border px-3.5 text-[.62rem] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] ${eligibility === item ? "border-[var(--site-sky-ink)] bg-[color-mix(in_srgb,var(--site-sky)_17%,transparent)] text-[var(--site-sky-ink)]" : "border-[var(--site-glass-border)] text-[var(--site-copy)]"}`}
                  key={item}
                  onClick={() => setEligibility(item)}
                  type="button"
                >
                  {item === "already-paid" ? "Already paid" : "Main Board"}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--site-glass-border)] pt-5">
              <div><span className="block text-[.56rem] tracking-[.08em] text-[var(--site-mist)]">PRICE</span><strong className="mt-1 block text-[1rem] font-normal">Confirm with the team</strong></div>
              <QuantityControl label="ID and lanyard only" value={badgeOnlyQuantity} onChange={setBadgeOnlyQuantity} />
            </div>
            <p className="mt-4 mb-0 text-[.65rem] leading-[1.65] text-[var(--site-mist)]">ID-only price and availability are confirmed before you commit.</p>
          </article>
        </div>

        <section aria-labelledby="store-order-title" className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(280px,.75fr)] gap-8 rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-night-2)] p-[clamp(20px,4vw,38px)] max-[760px]:grid-cols-1 max-[760px]:gap-6" id="store-order">
          <div>
            <p className="mb-3 text-[.61rem] tracking-[.1em] text-[var(--site-sky-ink)]">ORDER BUILDER / NOT A CHECKOUT</p>
            <h3 className="m-0 text-[clamp(1.8rem,3vw,3.4rem)] font-normal leading-[1] tracking-[-.065em]" id="store-order-title">Make it yours.</h3>
            <p className="mt-4 mb-0 max-w-[48ch] text-[.78rem] leading-[1.75] text-[var(--site-copy)]">We’ll use your email app to prepare an order request to IT Club. Nothing is sent or paid until you review and send the email; the team confirms sizes, ID-only price, and pickup/payment details.</p>
            <p className="mt-3 mb-0 text-right text-[.72rem] leading-[1.8] text-[var(--site-mist)]" lang="ar" dir="rtl">الطلب استفسار فقط، والفريق هيأكد التفاصيل قبل الدفع.</p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
              <label className="grid gap-2 text-[.64rem] text-[var(--site-copy)]"><span>Your name (optional)</span><input autoComplete="name" className="min-h-11 rounded-[10px] border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] px-3 text-[.8rem] text-[var(--site-ink)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--site-sky-ink)]" maxLength={120} onChange={(event) => setRequesterName(event.target.value)} placeholder="Name for the request" value={requesterName} /></label>
              <label className="grid gap-2 text-[.64rem] text-[var(--site-copy)]"><span>Vest size preference (optional)</span><input autoComplete="off" className="min-h-11 rounded-[10px] border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] px-3 text-[.8rem] text-[var(--site-ink)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--site-sky-ink)]" maxLength={80} onChange={(event) => setSizePreference(event.target.value)} placeholder="Type your preferred size" value={sizePreference} /></label>
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-between rounded-[14px] border border-[var(--site-glass-border)] bg-white/[.025] p-5">
            <div>
              <p className="mb-4 text-[.61rem] tracking-[.1em] text-[var(--site-mist)]">YOUR REQUEST</p>
              {quote.bundleQuantity === 0 && quote.badgeOnlyQuantity === 0 ? (
                <p className="m-0 py-3 text-[.8rem] text-[var(--site-copy)]">Your kit is empty. Choose a set above.</p>
              ) : (
                <ul className="m-0 grid list-none gap-3 p-0 text-[.77rem] text-[var(--site-ink)]">
                  {quote.bundleQuantity > 0 ? <li className="flex justify-between gap-3"><span>Vest + ID + lanyard × {quote.bundleQuantity}</span><span className="shrink-0">EGP {quote.confirmedSubtotalEgp.toLocaleString("en-EG")}</span></li> : null}
                  {quote.badgeOnlyQuantity > 0 ? <li className="flex justify-between gap-3"><span>ID + lanyard × {quote.badgeOnlyQuantity}</span><span className="shrink-0 text-[var(--site-sky-ink)]">Price to confirm</span></li> : null}
                </ul>
              )}
              <div className="mt-5 flex justify-between gap-3 border-t border-[var(--site-glass-border)] pt-4 text-[.72rem]">
                <span className="text-[var(--site-copy)]">Confirmed items subtotal</span>
                <strong className="font-medium text-[var(--site-ink)]">EGP {quote.confirmedSubtotalEgp.toLocaleString("en-EG")}</strong>
              </div>
              <p className="mt-3 mb-0 text-[.62rem] leading-[1.65] text-[var(--site-mist)]">{quote.hasUnpricedItems ? "ID-only price is not included in this subtotal." : "The team confirms stock, size, and collection before finalizing."}</p>
              {quote.badgeOnlyQuantity > 0 && !eligibility ? <p className="mt-2 mb-0 text-[.63rem] text-[var(--site-sky-ink)]" role="status">Choose “Already paid” or “Main Board” before requesting ID-only.</p> : null}
            </div>
            <a aria-disabled={!orderHref} className={`mt-6 inline-flex min-h-[49px] items-center justify-between gap-4 rounded-full px-5 text-[.72rem] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:transition-none ${orderHref ? "bg-[var(--site-sky)] text-[var(--site-night)] hover:-translate-y-0.5 hover:bg-[var(--site-sky-ink)]" : "pointer-events-none bg-white/[.07] text-[var(--site-mist)]"}`} href={orderHref ?? undefined}>
              <span>{orderHref ? "Prepare order request" : quote.badgeOnlyQuantity > 0 && !eligibility ? "Choose eligibility first" : "Choose an item first"}</span><ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </section>
        <p className="mt-5 mb-0 flex items-start gap-2 text-[.63rem] leading-[1.7] text-[var(--site-mist)]"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[var(--site-sky-ink)]" aria-hidden="true" /> No card details are collected on this page. This is an order inquiry; there is no online payment or confirmed stock.</p>
      </section>

      <section className="flex flex-wrap items-end justify-between gap-6 bg-[var(--site-paper)] px-[var(--site-gutter)] py-[clamp(42px,6vw,80px)] text-[var(--site-ink)]" data-store-reveal>
        <div><p className="mb-3 text-[.62rem] tracking-[.1em] text-[var(--site-sky-ink)]">THE CLUB / OUT THERE</p><h2 className="m-0 max-w-[15ch] text-[clamp(2rem,4.7vw,5rem)] font-normal leading-[.98] tracking-[-.07em]">Bring the work <em className="text-[var(--site-sky-ink)] not-italic">with you.</em></h2></div>
        <Link className="inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--site-glass-border)] px-5 text-[.72rem] text-[var(--site-ink)] transition hover:-translate-y-0.5 hover:border-[var(--site-sky-ink)] motion-reduce:transition-none" href="/community">Meet the people behind it <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
