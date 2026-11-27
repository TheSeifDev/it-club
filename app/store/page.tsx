import type { Metadata } from "next";
import Image from "next/image";
import { ChapterRow, Chars, kit, KLine, KTile, Marquee, MaskLines, Meta, Pill, ScrollCue } from "@/src/components/site/editorial/kit";
import { SiteFrame } from "@/src/components/site/SiteUI";
import StoreBadge from "@/src/components/store/StoreBadge";
import StoreReservation from "@/src/components/store/StoreReservation";

export const metadata: Metadata = {
  title: "IT Club Store",
  description: "Drop 01 — the IT Club field kit: the club vest, ID card, and lanyard. Request an order from the team.",
};

const VEST_FRONT = { src: "/store/vest-front.webp", width: 356, height: 515 };
const VEST_BACK = { src: "/store/vest-back.webp", width: 357, height: 514 };
const FIELD = [
  { src: "/manus-storage/club-in-action-01_cfc54ef8.webp", alt: "IT Club members wearing their vests together at a university event" },
  { src: "/manus-storage/club-in-action-02_18620573.webp", alt: "An IT Club member in the club vest representing the team during a session" },
] as const;

/** Only details visible in the supplied product photograph. */
const ANATOMY = [
  { n: "01", label: "University mark", note: "Borg El Arab Technological University, on the left chest.", side: "front", x: 28, y: 26 },
  { n: "02", label: "Club crest", note: "The IT Club mark on the right chest.", side: "front", x: 72, y: 27 },
  { n: "03", label: "ID window", note: "A clear pocket where the club ID sits.", side: "front", x: 69, y: 45 },
  { n: "04", label: "Flap pockets", note: "Utility pockets at chest and hip.", side: "front", x: 26, y: 74 },
  { n: "05", label: "Reflective trim", note: "Bands over the shoulders and around the body.", side: "back", x: 15, y: 57 },
  { n: "06", label: "The back", note: "The full IT Club logo across the shoulders.", side: "back", x: 55, y: 30 },
] as const;

function Dot({ n, x, y }: { n: string; x: number; y: number }) {
  return (
    <span aria-hidden="true" className="absolute grid size-[clamp(26px,2.2vw,34px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--site-sky)] text-[.6rem] font-semibold tabular-nums text-[var(--site-night)] shadow-[0_0_0_6px_rgb(40_205_183_/_.18),0_10px_30px_rgb(0_0_0_/_.4)]" style={{ left: `${x}%`, top: `${y}%` }}>
      {n}
    </span>
  );
}

export default function StorePage() {
  return (
    <SiteFrame>
      <div className={kit.page} data-editorial-page>
        {/* Hero — Drop 01 */}
        <section data-k-spread aria-labelledby="store-title" className="relative isolate flex min-h-[max(720px,100svh)] flex-col justify-between overflow-hidden px-[var(--site-gutter)] pt-[calc(var(--site-header-clearance,112px)+18px)] pb-[clamp(22px,3vw,40px)]">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[22%] -z-[1] opacity-90" data-k-fade>
            <Marquee className={`text-[clamp(6rem,19vw,22rem)] leading-[.82] tracking-[-.08em] ${kit.outline} [--stroke:rgb(82_232_209_/_.22)]`} speed={.55}>
              <span className="pr-[.3em]">Field kit</span><span className="pr-[.3em]">Drop 01</span><span className="pr-[.3em]">Field kit</span><span className="pr-[.3em]">Drop 01</span>
            </Marquee>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute top-[42%] left-1/2 -z-[1] h-[48vw] max-h-[720px] w-[60vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(40_205_183_/_.2),transparent)] blur-2xl" />

          <div className="grid grid-cols-3 items-start gap-4 max-[700px]:grid-cols-2" data-k-fade>
            <Meta>IT Club Store</Meta>
            <Meta className="justify-self-center max-[700px]:hidden">Drop 01 · Vest + ID + lanyard</Meta>
            <p className="m-0 justify-self-end font-[family-name:var(--font-alexandria)] text-[.8rem] text-[var(--site-sky-ink)]" lang="ar" dir="rtl">البس الشغل</p>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-[50%] flex -translate-y-1/2 items-center justify-center gap-[clamp(8px,2vw,40px)] px-[var(--site-gutter)] max-[700px]:top-[44%]" aria-hidden="true">
            <span data-k-side="l" className="block w-[clamp(150px,20vw,320px)]">
              <span data-parallax="-0.08" className="block"><Image src={VEST_FRONT.src} alt="" width={VEST_FRONT.width} height={VEST_FRONT.height} priority className="h-auto w-full -rotate-[5deg] drop-shadow-[0_40px_60px_rgb(0_0_0_/_.55)]" sizes="(max-width: 700px) 40vw, 20vw" /></span>
            </span>
            <span data-k-side="r" className="block w-[clamp(160px,21.6vw,345px)]">
              <span data-parallax="0.1" className="block"><Image src={VEST_BACK.src} alt="" width={VEST_BACK.width} height={VEST_BACK.height} priority className="h-auto w-full rotate-[4deg] drop-shadow-[0_40px_60px_rgb(0_0_0_/_.55)]" sizes="(max-width: 700px) 42vw, 22vw" /></span>
            </span>
          </div>

          <div className="relative">
            <h1 id="store-title" aria-label="Wear the work." data-k-title className="m-0 text-[clamp(4rem,14vw,16.5rem)] font-normal leading-[.84] tracking-[-.085em]">
              <KLine side="l"><Chars text="Wear" /><KTile className="w-[.74em] bg-[var(--site-sky)]"><span className="absolute inset-0 grid place-items-center text-[.24em] font-semibold tracking-[-.02em] text-[var(--site-night)]">01</span></KTile><Chars text="the" /></KLine>
              <KLine side="r" className="text-right"><span className="text-[var(--site-sky-ink)]"><Chars text="work." /></span></KLine>
            </h1>
            <div className="mt-[clamp(18px,2.4vw,36px)] flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-5">
              <p data-k-fade className={kit.lead}>One field-ready vest. One club identity. Made for the people who show up, build together, and carry the work into every room.</p>
              <div data-k-fade className="flex items-center gap-6">
                <span className="text-right text-[.62rem] uppercase leading-[1.6] tracking-[.16em] text-[var(--site-copy)]">The complete set<b className="block text-[1.6rem] font-normal normal-case tracking-[-.06em] text-[var(--site-ink)]">EGP 250</b></span>
                <a href="#shop-kit" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)]"><ScrollCue label="Reserve your kit" /></a>
              </div>
            </div>
          </div>
        </section>

        {/* I — Lookbook */}
        <section aria-labelledby="store-look-title" className="pt-[clamp(90px,11vw,170px)]">
          <div className={kit.gutter}>
            <ChapterRow number="I" label="Lookbook" aside={<span className={`${kit.meta} max-[700px]:hidden`}>Worn where the work happens</span>} />
            <MaskLines id="store-look-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["A team,", <em key="b">in motion.</em>]} />
          </div>
          <figure data-clip className="relative m-0 mt-[clamp(40px,5vw,80px)] aspect-[16/8] w-full overflow-hidden max-[700px]:aspect-[4/3]">
            <span data-clip-inner className="absolute inset-0 block"><Image src={FIELD[0].src} alt={FIELD[0].alt} fill unoptimized sizes="100vw" className="object-cover" /></span>
            <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-[linear-gradient(to_top,rgb(5_7_10_/_.85),transparent)] px-[var(--site-gutter)] pt-24 pb-[clamp(16px,2vw,28px)]">
              <Meta className="text-white/85">Look 01 · Together</Meta>
              <span className="text-[.66rem] tabular-nums text-white/70">01 — 02</span>
            </figcaption>
          </figure>
          <div className={`${kit.gutter} grid grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] items-end gap-[clamp(24px,5vw,90px)] py-[clamp(40px,6vw,100px)] max-[820px]:grid-cols-1`}>
            <div data-rise className="pb-4">
              <p className={kit.lead}>The vest is built for the moments members share, create, and represent the team together — seen in the room, on the move, and at the center of the next idea.</p>
              <p className={`${kit.arabic} mt-4`} lang="ar" dir="rtl">في القاعة، وفي الطريق، وفي قلب الفكرة الجاية.</p>
            </div>
            <figure data-clip="side" className="relative m-0 aspect-[16/10] overflow-hidden rounded-[18px]">
              <span data-clip-inner className="absolute inset-0 block"><Image src={FIELD[1].src} alt={FIELD[1].alt} fill unoptimized sizes="(max-width: 820px) 92vw, 58vw" className="object-cover" /></span>
              <figcaption className="absolute bottom-4 left-4"><Meta className="text-white/85">Look 02 · On stage</Meta></figcaption>
            </figure>
          </div>
        </section>

        {/* II — Anatomy */}
        <section aria-labelledby="store-anatomy-title" className={`${kit.gutter} py-[clamp(70px,8vw,130px)]`}>
          <ChapterRow number="II" label="Front / back" aside={<span className={`${kit.meta} max-[700px]:hidden`}>From the product photo</span>} />
          <MaskLines id="store-anatomy-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Built to", <em key="b">show up.</em>]} />
          <div className="mt-[clamp(40px,5vw,80px)] grid grid-cols-[minmax(0,1.25fr)_minmax(280px,.75fr)] items-center gap-[clamp(28px,5vw,90px)] max-[900px]:grid-cols-1">
            <div className="relative grid grid-cols-2 items-end gap-[clamp(10px,2vw,36px)] rounded-[24px] bg-[radial-gradient(ellipse_at_50%_60%,rgb(40_205_183_/_.12),transparent_65%)] p-[clamp(14px,3vw,48px)]">
              {([["front", VEST_FRONT], ["back", VEST_BACK]] as const).map(([side, image]) => (
                <figure key={side} className="relative m-0" data-rise>
                  <span className="relative block">
                    <Image src={image.src} alt={side === "front" ? "Front of the IT Club navy vest" : "Back of the IT Club navy vest with the club logo"} width={image.width} height={image.height} className="h-auto w-full drop-shadow-[0_30px_50px_rgb(0_0_0_/_.5)]" sizes="(max-width: 900px) 45vw, 30vw" />
                    {ANATOMY.filter((item) => item.side === side).map((item) => <Dot key={item.n} n={item.n} x={item.x} y={item.y} />)}
                  </span>
                  <figcaption className="mt-4 text-center"><Meta className="inline-flex">{side}</Meta></figcaption>
                </figure>
              ))}
            </div>
            <ol className="m-0 list-none p-0" data-rise-group>
              {ANATOMY.map((item) => (
                <li key={item.n} data-rise className="group/spec grid grid-cols-[40px_minmax(0,1fr)] gap-3 py-[clamp(12px,1.3vw,18px)] shadow-[inset_0_-1px_0_rgb(255_255_255_/_.07)]">
                  <span className="pt-1 text-[.64rem] tabular-nums text-[var(--site-sky-ink)]">{item.n}</span>
                  <span>
                    <span className="block text-[clamp(1.2rem,1.7vw,1.7rem)] leading-[1.1] tracking-[-.05em] transition-transform duration-500 group-hover/spec:translate-x-2">{item.label}</span>
                    <span className="mt-1 block text-[.76rem] leading-[1.6] text-[var(--site-copy)]">{item.note}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* III — The ID */}
        <section id="id-card" aria-labelledby="store-id-title" className="relative isolate overflow-hidden py-[clamp(70px,8vw,130px)]">
          <span aria-hidden="true" data-fill className={`pointer-events-none absolute top-1/2 left-1/2 -z-[1] -translate-x-1/2 -translate-y-1/2 text-[clamp(16rem,44vw,48rem)] leading-[.8] tracking-[-.1em] ${kit.fill} [--fill-ink:rgb(40_205_183_/_.1)] [--stroke:rgb(82_232_209_/_.2)]`}>ID</span>
          <div className={`${kit.gutter} grid grid-cols-[minmax(0,1fr)_minmax(300px,.9fr)] items-center gap-[clamp(28px,6vw,110px)] max-[900px]:grid-cols-1`}>
            <div>
              <ChapterRow number="III" label="The identity piece" />
              <MaskLines id="store-id-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Your place,", <em key="b">on a lanyard.</em>]} />
              <p data-rise className={`${kit.lead} mt-7`}>An IT Club ID card on a matching lanyard — made to sit in the vest’s ID window. This preview uses the current club logo; the approved card artwork replaces it when it arrives.</p>
              <p data-rise className="mt-6 mb-0 text-[.66rem] uppercase tracking-[.16em] text-[var(--site-mist)]">Card art · pending <span className="px-2 text-[var(--site-sky-ink)]">/</span> Drag to turn it</p>
            </div>
            <div data-rise><StoreBadge className="max-w-[520px]" /></div>
          </div>
        </section>

        {/* IV — Build */}
        <section aria-labelledby="store-build-title" className={`${kit.gutter} py-[clamp(70px,8vw,130px)]`}>
          <ChapterRow number="IV" label="Reserve your kit" aside={<span className={kit.arabic} dir="rtl" lang="ar">احجز الكيت بتاعك</span>} />
          <div className="mt-[clamp(28px,3.4vw,52px)] flex items-end justify-between gap-8 max-[820px]:flex-col max-[820px]:items-start">
            <MaskLines id="store-build-title" className={kit.h2} lines={["Reserve", <em key="b">yours.</em>]} />
            <p data-rise className="m-0 flex items-start gap-3 text-[clamp(5rem,13vw,14rem)] leading-[.8] tracking-[-.09em]" aria-label="EGP 250 for the complete set">
              <span className="pt-[.2em] text-[.14em] tracking-[.02em] text-[var(--site-copy)]">EGP</span>
              <span data-count="250" data-count-pad="3" aria-hidden="true">250</span>
            </p>
          </div>
          <p data-rise className={`${kit.lead} mt-6 mb-[clamp(30px,4vw,60px)]`}>One kit per person. Reserve it here, then send your photo and payment screenshot on WhatsApp with your code — that locks it in.</p>
          <StoreReservation />
        </section>

        <div className="py-[clamp(30px,4vw,60px)]">
          <Marquee className="text-[clamp(3.6rem,9vw,10rem)] leading-[1] tracking-[-.08em]" speed={.8} dir="r">
            {Array.from({ length: 4 }, (_, index) => <span key={index} className="pr-[.4em]">Wear the work<span className="pl-[.4em] text-[var(--site-sky-ink)]">×</span></span>)}
          </Marquee>
        </div>
        <section className={`${kit.gutter} flex flex-wrap items-center justify-between gap-6 pt-[clamp(30px,4vw,60px)] pb-[clamp(80px,9vw,150px)]`} aria-label="Meet the club">
          <p className={kit.lead}>The kit is only half of it. Meet the boards and people who wear it.</p>
          <Pill href="/community">Meet the people</Pill>
        </section>
      </div>
    </SiteFrame>
  );
}
