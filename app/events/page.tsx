import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ContentEntry } from "@/lib/site-content/types";
import { MEMORIES } from "@/lib/ui/memories";
import { formatEventDate, publicEventTimeline, publicMetadata, readPublicSiteContent } from "@/src/components/site/content-utils";
import { ChapterRow, Chars, kit, KLine, KTile, Marquee, MaskLines, Meta, Pill, ScrollCue } from "@/src/components/site/editorial/kit";
import { MemoriesTable } from "@/src/components/site/editorial/Prints";
import { SiteFrame } from "@/src/components/site/SiteUI";

export const metadata: Metadata = publicMetadata(
  "Events & Memories",
  "Upcoming IT Club events with confirmed dates and venues, plus printed memories from the sessions we have shared.",
  "/events",
);

function dateParts(value?: string) {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", weekday: "short", timeZone: dateOnly ? "UTC" : "Africa/Cairo" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return { day: part("day"), month: part("month"), year: part("year"), weekday: part("weekday") };
}

/** One poster-like row: outlined day, title, meta; fills teal from below on hover. */
function EventRow({ event, past = false }: { event: ContentEntry; past?: boolean }) {
  const parts = dateParts(event.data.date);
  return (
    <li data-rise className="border-t border-[rgb(255_255_255_/_.09)] last:border-b">
      <Link
        href={`/events/${event.slug}`}
        data-cursor="Details"
        className="group/row relative isolate grid min-h-[clamp(130px,13vw,210px)] grid-cols-[clamp(120px,15vw,250px)_minmax(0,1fr)_auto] items-center gap-x-[clamp(16px,3vw,48px)] overflow-hidden px-[var(--site-gutter)] py-6 text-[var(--site-ink)]! before:absolute before:inset-0 before:-z-[1] before:origin-bottom before:scale-y-0 before:bg-[var(--site-sky)] before:transition-transform before:duration-[650ms] before:ease-[cubic-bezier(.7,0,.2,1)] hover:text-[var(--site-night)]! hover:before:scale-y-100 focus-visible:outline-none focus-visible:before:scale-y-100 motion-reduce:before:transition-none max-[700px]:grid-cols-[minmax(0,1fr)_auto] max-[700px]:gap-y-3"
      >
        <span className="flex items-end gap-3 max-[700px]:col-span-full" aria-hidden="true">
          <span className={`text-[clamp(4.2rem,8.4vw,8.6rem)] leading-[.8] tracking-[-.08em] ${past ? "text-transparent [-webkit-text-stroke:1px_currentColor]" : ""}`}>{parts?.day ?? "—"}</span>
          <span className="pb-[.4em] text-[.66rem] uppercase leading-[1.5] tracking-[.14em] opacity-75">{parts ? <>{parts.weekday}<br />{parts.month} {parts.year}</> : "Date TBA"}</span>
        </span>
        <span className="min-w-0">
          <span className="block text-[.64rem] uppercase tracking-[.14em] opacity-70">{event.data.category || "IT Club event"}{event.data.time ? ` · ${event.data.time}` : ""}</span>
          <span className="mt-2 block text-[clamp(1.7rem,3.6vw,3.8rem)] leading-[1] tracking-[-.065em] transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/row:translate-x-[clamp(6px,1vw,16px)]">{event.data.title}</span>
          {event.data.location ? <span className="mt-2 block text-[.76rem] opacity-70">{event.data.location}</span> : null}
          <span className="sr-only">{event.data.date ? formatEventDate(event.data.date) : "Date not listed"}</span>
        </span>
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-[rgb(255_255_255_/_.08)] text-[1.05rem] transition-transform duration-500 group-hover/row:rotate-45 group-hover/row:bg-[rgb(0_0_0_/_.12)]">↗</span>
      </Link>
    </li>
  );
}

/** Empty state as a ticket: honest "to be announced", still a designed object. */
function Ticket({ year }: { year: string }) {
  const notch = "absolute size-9 rounded-full bg-[var(--site-night)]";
  return (
    <div data-rise className="relative mx-[var(--site-gutter)] grid grid-cols-[minmax(0,1fr)_clamp(150px,20vw,290px)] overflow-hidden rounded-[22px] text-[var(--site-night)] max-[700px]:grid-cols-1">
      <div className="relative bg-[var(--site-sky)] p-[clamp(22px,3vw,48px)]">
        <div className="flex items-start justify-between gap-6 text-[.66rem] font-medium uppercase tracking-[.16em]">
          <span>IT Club · BATU</span><span>Admit everyone</span>
        </div>
        <p className="mt-[clamp(30px,5vw,80px)] mb-0 text-[clamp(3.2rem,9vw,10rem)] leading-[.84] tracking-[-.085em]">To be<br />announced.</p>
        <p className="mt-6 mb-0 max-w-[46ch] text-[.84rem] leading-[1.7] text-[rgb(5_8_11_/_.72)]">No upcoming event is published yet. When the next date is confirmed, it lands here first — with venue, time and details.</p>
      </div>
      <div className="relative flex flex-col justify-between gap-8 bg-[#e9f7f4] p-[clamp(22px,3vw,40px)] [background-image:radial-gradient(circle,rgb(5_8_11_/_.18)_1.2px,transparent_1.6px)] [background-size:14px_14px] [background-position:-7px_0] [background-repeat:repeat-y] max-[700px]:[background-image:none]">
        <span aria-hidden="true" className={`${notch} -top-[18px] -left-[18px] max-[700px]:hidden`} />
        <span aria-hidden="true" className={`${notch} -bottom-[18px] -left-[18px] max-[700px]:hidden`} />
        <span className="text-[.66rem] font-medium uppercase tracking-[.16em]">Season</span>
        <span className="text-[clamp(3rem,6vw,6.4rem)] leading-[.8] tracking-[-.08em] [writing-mode:vertical-rl] rotate-180 self-start max-[700px]:[writing-mode:horizontal-tb] max-[700px]:rotate-0">{year}</span>
        <span className="text-[.66rem] font-medium uppercase tracking-[.16em]">No. 00 — next</span>
      </div>
    </div>
  );
}

export default async function EventsPage() {
  const content = await readPublicSiteContent();
  const { upcoming, archive, undated } = publicEventTimeline(content.events);
  const year = String(new Date().getFullYear());
  const heroPhoto = MEMORIES[0];

  return (
    <SiteFrame>
      <div className={kit.page} data-editorial-page>
        <section data-k-spread aria-labelledby="events-title" className="relative flex min-h-[max(700px,100svh)] flex-col justify-between overflow-hidden px-[var(--site-gutter)] pt-[calc(var(--site-header-clearance,112px)+18px)] pb-[clamp(22px,3vw,40px)]">
          <span aria-hidden="true" data-k-sink className={`pointer-events-none absolute inset-x-0 top-[16%] -z-10 text-center text-[clamp(10rem,38vw,44rem)] leading-[.8] tracking-[-.09em] ${kit.outline} [--stroke:rgb(82_232_209_/_.14)]`}>{year}</span>
          <div className="grid grid-cols-3 items-start gap-4 max-[700px]:grid-cols-2" data-k-fade>
            <Meta>IT Club — Events</Meta>
            <Meta className="justify-self-center max-[700px]:hidden">{String(upcoming.length).padStart(2, "0")} upcoming · {String(archive.length).padStart(2, "0")} archived</Meta>
            <p className="m-0 justify-self-end font-[family-name:var(--font-alexandria)] text-[.8rem] text-[var(--site-sky-ink)]" lang="ar" dir="rtl">لما بنتجمع حوالين فكرة</p>
          </div>
          <div>
            <h1 id="events-title" aria-label="Events, together." data-k-title className="m-0 text-[clamp(4rem,15.6vw,18rem)] font-normal leading-[.84] tracking-[-.085em]">
              <KLine side="l"><Chars text="Events" />{heroPhoto ? <KTile className="w-[1.5em] bg-[#101417]"><Image src={heroPhoto.src} alt="" fill sizes="30vw" className="object-cover" unoptimized={heroPhoto.src.startsWith("/manus-storage")} priority /></KTile> : null}</KLine>
              <KLine side="r" className="text-right"><span className="text-[var(--site-sky-ink)]"><Chars text="together" /></span><Chars text="." /></KLine>
            </h1>
            <div className="mt-[clamp(22px,3vw,44px)] flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-5">
              <p data-k-fade className={kit.lead}>Talks, workshops, hackathons and the nights in between. What is next sits at the top — what we already lived is printed below.</p>
              <a data-k-fade href="#events-next" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)]"><ScrollCue label="What’s next" /></a>
            </div>
          </div>
        </section>

        <section id="events-next" aria-labelledby="events-next-title" className="scroll-mt-[var(--site-header-clearance,112px)] pt-[clamp(90px,11vw,170px)] pb-[clamp(60px,7vw,110px)]">
          <div className={kit.gutter}>
            <ChapterRow number="I" label="Up next" aside={<span className={`${kit.meta} max-[700px]:hidden`}>Season {year}</span>} />
            <MaskLines id="events-next-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["On the", <em key="b">calendar.</em>]} />
          </div>
          <div className="mt-[clamp(40px,5vw,80px)]">
            {upcoming.length ? (
              <ol className="m-0 list-none p-0" data-rise-group aria-label="Upcoming events">{upcoming.map((event) => <EventRow key={event.id} event={event} />)}</ol>
            ) : (
              <Ticket year={year} />
            )}
          </div>
        </section>

        <section id="memories" aria-labelledby="memories-title" className="relative scroll-mt-[var(--site-header-clearance,112px)] overflow-hidden py-[clamp(80px,9vw,150px)]">
          <div className={kit.gutter}>
            <ChapterRow number="II" label="Memories" aside={<span className={`${kit.meta} max-[899px]:hidden`}>Drag the prints</span>} />
            <div className="mt-[clamp(28px,3.4vw,52px)] grid grid-cols-[minmax(0,1fr)_minmax(240px,.36fr)] items-end gap-10 max-[900px]:grid-cols-1 max-[900px]:gap-6">
              <MaskLines id="memories-title" className={kit.h2} lines={["Printed, so we", <em key="b">don’t forget.</em>]} />
              <div data-rise>
                <p className={kit.lead}>Moments from sessions and events, printed and left on the table. Some are still developing — the next one might have you in it.</p>
                <p className={`${kit.arabic} mt-3`} lang="ar" dir="rtl">ذكريات بنطبعها عشان متضيعش.</p>
              </div>
            </div>
          </div>
          <div className={`${kit.gutter} mt-[clamp(50px,6vw,100px)]`}>
            <MemoriesTable memories={MEMORIES} />
          </div>
        </section>

        {undated.length ? (
          <section aria-labelledby="events-undated-title" className="pb-[clamp(60px,7vw,110px)]">
            <div className={kit.gutter}>
              <ChapterRow number="III" label="Date not listed" />
              <MaskLines id="events-undated-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Coming,", <em key="b">date to follow.</em>]} />
            </div>
            <ol className="m-0 mt-[clamp(40px,5vw,70px)] list-none p-0" data-rise-group aria-label="Published events without a date">{undated.map((event) => <EventRow key={event.id} event={event} />)}</ol>
          </section>
        ) : null}

        {archive.length ? (
          <section aria-labelledby="events-archive-title" className="pb-[clamp(60px,7vw,110px)]">
            <div className={kit.gutter}>
              <ChapterRow number={undated.length ? "IV" : "III"} label="The archive" />
              <MaskLines id="events-archive-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Already", <em key="b">happened.</em>]} />
            </div>
            <ol className="m-0 mt-[clamp(40px,5vw,70px)] list-none p-0" data-rise-group aria-label="Past events">{archive.map((event) => <EventRow key={event.id} event={event} past />)}</ol>
          </section>
        ) : null}

        <section aria-labelledby="events-cta-title" className="relative overflow-hidden pt-[clamp(60px,7vw,120px)] pb-[clamp(70px,8vw,130px)]">
          <Marquee className="text-[clamp(4.6rem,13vw,14rem)] leading-[.95] tracking-[-.08em]" speed={1}>
            {Array.from({ length: 3 }, (_, index) => <span key={index} className="pr-[.3em]">See you at the next one <span className={kit.outline}>—</span></span>)}
          </Marquee>
          <div className={`${kit.gutter} mt-[clamp(40px,5vw,80px)] flex items-end justify-between gap-8 max-[800px]:flex-col max-[800px]:items-start`} data-rise>
            <h2 id="events-cta-title" className="m-0 max-w-[16ch] text-[clamp(2rem,3.6vw,4.2rem)] font-normal leading-[1.04] tracking-[-.065em]">Have an idea the club should run?</h2>
            <Pill href="/contact">Bring it to us</Pill>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
