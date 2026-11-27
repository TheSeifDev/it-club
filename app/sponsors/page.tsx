import type { Metadata } from "next";
import { publicMetadata, publicSponsors, readPublicSiteContent, safeHref } from "@/src/components/site/content-utils";
import { ChapterRow, Chars, kit, KLine, KTile, Marquee, MaskLines, Meta, Pill, ScrollCue } from "@/src/components/site/editorial/kit";
import { SiteFrame } from "@/src/components/site/SiteUI";

export const metadata: Metadata = publicMetadata(
  "Partners",
  "The organizations currently published as IT Club partners, and how to start a collaboration with the club.",
  "/sponsors",
);

const WAYS = [
  { title: "Sessions & talks", copy: "Bring a practitioner into the room — a workshop, a talk, a hands-on night." },
  { title: "Spaces & venues", copy: "Host the club where the work happens, from a single meetup to a full event." },
  { title: "Challenges & builds", copy: "Set a real problem for students to take on, and see what they make of it." },
];

export default async function SponsorsPage() {
  const content = await readPublicSiteContent();
  const sponsors = publicSponsors(content.sponsors);
  const count = String(sponsors.length).padStart(2, "0");

  return (
    <SiteFrame>
      <div className={kit.page} data-editorial-page>
        <section data-k-spread aria-labelledby="partners-title" className="relative flex min-h-[max(700px,100svh)] flex-col justify-between overflow-hidden px-[var(--site-gutter)] pt-[calc(var(--site-header-clearance,112px)+18px)] pb-[clamp(22px,3vw,40px)]">
          <div className="grid grid-cols-3 items-start gap-4 max-[700px]:grid-cols-2" data-k-fade>
            <Meta>IT Club — Partners</Meta>
            <Meta className="justify-self-center max-[700px]:hidden">{count} partners · open door</Meta>
            <p className="m-0 justify-self-end font-[family-name:var(--font-alexandria)] text-[.8rem] text-[var(--site-sky-ink)]" lang="ar" dir="rtl">التعاون بيفتح أبواب</p>
          </div>
          <div>
            <h1 id="partners-title" aria-label="In good company." data-k-title className="m-0 text-[clamp(4rem,15.6vw,18rem)] font-normal leading-[.84] tracking-[-.085em]">
              <KLine side="l"><Chars text="In good" /><KTile className="w-[1.1em] bg-[var(--site-sky)]"><span data-spin="360" className="absolute inset-0 grid place-items-center text-[.9em] leading-none text-[var(--site-night)]">×</span></KTile></KLine>
              <KLine side="r" className="text-right"><span className="text-[var(--site-sky-ink)]"><Chars text="company" /></span><Chars text="." /></KLine>
            </h1>
            <div className="mt-[clamp(22px,3vw,44px)] flex items-end justify-between gap-8 max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-5">
              <p data-k-fade className={kit.lead}>Partnerships move ideas between students and the wider technology community. These are the organizations currently standing with the club.</p>
              <a data-k-fade href="#partners-list" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--site-sky-ink)]"><ScrollCue label="Meet them" /></a>
            </div>
          </div>
        </section>

        <section id="partners-list" aria-labelledby="partners-list-title" className="scroll-mt-[var(--site-header-clearance,112px)] pt-[clamp(90px,11vw,170px)] pb-[clamp(60px,7vw,110px)]">
          <div className={kit.gutter}>
            <ChapterRow number="I" label="Side by side" aside={<span className={`${kit.meta} max-[700px]:hidden`}>{count} published</span>} />
            <MaskLines id="partners-list-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Good work", <em key="b">travels further.</em>]} />
          </div>
          {sponsors.length ? (
            <ol className="m-0 mt-[clamp(40px,5vw,80px)] list-none p-0" data-rise-group aria-label="IT Club partners">
              {sponsors.map((sponsor, index) => {
                const href = safeHref(sponsor.data.href);
                const external = Boolean(href?.startsWith("http"));
                const Row = href ? "a" : "div";
                return (
                  <li key={sponsor.id} data-rise className="border-t border-[rgb(255_255_255_/_.09)] last:border-b">
                    <Row
                      {...(href ? { href, target: external ? "_blank" : undefined, rel: external ? "noreferrer" : undefined, "data-cursor": "Visit", "aria-label": `${sponsor.data.title}${external ? " (opens in a new tab)" : ""}` } : {})}
                      className="group/row relative isolate grid min-h-[clamp(160px,17vw,280px)] grid-cols-[clamp(44px,6vw,110px)_minmax(0,1fr)_minmax(200px,.34fr)] items-center gap-x-[clamp(14px,2.4vw,40px)] overflow-hidden px-[var(--site-gutter)] py-7 text-[var(--site-ink)]! before:absolute before:inset-0 before:-z-[1] before:origin-bottom before:scale-y-0 before:bg-[var(--site-ink)] before:transition-transform before:duration-[650ms] before:ease-[cubic-bezier(.7,0,.2,1)] hover:text-[var(--site-night)]! hover:before:scale-y-100 focus-visible:outline-none focus-visible:before:scale-y-100 motion-reduce:before:transition-none max-[900px]:grid-cols-[38px_minmax(0,1fr)] max-[900px]:gap-y-4"
                    >
                      <span className="self-start pt-3 text-[.72rem] tabular-nums opacity-70">{String(index + 1).padStart(2, "0")}</span>
                      <span className="flex min-w-0 flex-wrap items-baseline gap-x-[.28em] text-[clamp(2.4rem,7.2vw,8.4rem)] leading-[.95] tracking-[-.08em]">
                        <span className="text-[.42em] tracking-[-.05em] opacity-55 max-[700px]:hidden">IT Club</span>
                        <span aria-hidden="true" className="inline-block text-[.6em] text-[var(--site-sky-ink)] transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)] group-hover/row:rotate-90 group-hover/row:text-[var(--site-night)] max-[700px]:hidden">×</span>
                        <span className="min-w-0 truncate transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/row:translate-x-[clamp(6px,1vw,16px)]">{sponsor.data.title}</span>
                      </span>
                      <span className="grid gap-2 text-[.8rem] leading-[1.6] max-[900px]:col-start-2">
                        <span className="text-[.64rem] uppercase tracking-[.14em] text-[var(--site-sky-ink)] transition-colors group-hover/row:text-[var(--site-night)]">{sponsor.data.category || "Partner"}</span>
                        {sponsor.data.summary ? <span className="opacity-80">{sponsor.data.summary}</span> : null}
                        {href ? <span className="mt-1 inline-flex items-center gap-2 text-[.72rem]">Visit partner <span aria-hidden="true" className="inline-block transition-transform duration-500 group-hover/row:rotate-45">↗</span></span> : null}
                      </span>
                    </Row>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={`${kit.gutter} ${kit.lead} mt-10`} role="status">No partner is published right now. We only list organizations confirmed for public view.</p>
          )}
        </section>

        {sponsors.length ? (
          <div className="py-[clamp(30px,4vw,60px)]">
            <Marquee className="text-[clamp(3.6rem,9vw,10rem)] leading-[1] tracking-[-.08em]" speed={.9}>
              {Array.from({ length: Math.max(2, Math.ceil(6 / sponsors.length)) }, (_, round) => sponsors.map((sponsor) => (
                <span key={`${round}-${sponsor.id}`} className="pr-[.4em]">{sponsor.data.title}<span className="pl-[.4em] text-[var(--site-sky-ink)]">×</span></span>
              )))}
            </Marquee>
          </div>
        ) : null}

        <section aria-labelledby="partners-ways-title" className={`${kit.gutter} py-[clamp(70px,8vw,130px)]`}>
          <ChapterRow number="II" label="Ways to work together" />
          <MaskLines id="partners-ways-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Pick a way", <em key="b">in.</em>]} />
          <ol className="m-0 mt-[clamp(40px,5vw,80px)] grid list-none grid-cols-3 gap-[clamp(14px,1.6vw,24px)] p-0 max-[900px]:grid-cols-1" data-rise-group>
            {WAYS.map((way, index) => (
              <li key={way.title} data-rise className="group/way relative flex min-h-[clamp(240px,24vw,360px)] flex-col justify-between overflow-hidden rounded-[20px] bg-[var(--site-glass)] p-[clamp(22px,2.4vw,36px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)]">
                <span aria-hidden="true" className={`absolute -top-[.12em] -right-[.04em] text-[clamp(7rem,12vw,12rem)] leading-none tracking-[-.08em] ${kit.outline} [--stroke:rgb(82_232_209_/_.35)] transition-colors duration-700 group-hover/way:text-[rgb(82_232_209_/_.16)]`}>{String(index + 1).padStart(2, "0")}</span>
                <span className={kit.meta}>Option {String(index + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-[clamp(1.6rem,2.4vw,2.5rem)] leading-[1.02] tracking-[-.06em]">{way.title}</span>
                  <span className="mt-3 block max-w-[34ch] text-[.82rem] leading-[1.7] text-[var(--site-copy)]">{way.copy}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="partners-cta-title" className={`${kit.gutter} pt-[clamp(40px,5vw,80px)] pb-[clamp(80px,9vw,150px)]`}>
          <ChapterRow number="III" label="Start a conversation" />
          <h2 id="partners-cta-title" className="sr-only">Contact IT Club about partnerships</h2>
          <a href="mailto:contact@itclub.one?subject=Partnership%20with%20IT%20Club" data-rise data-cursor="Write" className="group/mail relative mt-[clamp(30px,4vw,60px)] block overflow-hidden text-[clamp(2.6rem,10.4vw,12.5rem)] leading-[.95] tracking-[-.085em] text-[var(--site-ink)]!">
            <span className="block transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)] group-hover/mail:-translate-y-full motion-reduce:transition-none">contact@itclub.one</span>
            <span aria-hidden="true" className="absolute inset-0 block translate-y-full text-[var(--site-sky-ink)] transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)] group-hover/mail:translate-y-0 motion-reduce:transition-none">contact@itclub.one</span>
          </a>
          <div className="mt-[clamp(26px,3vw,48px)] flex flex-wrap items-center justify-between gap-6" data-rise>
            <p className={kit.lead}>Tell us what you would like to explore — a session, a space, a challenge — and we will take it from there.</p>
            <Pill href="/contact">Talk partnerships</Pill>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
