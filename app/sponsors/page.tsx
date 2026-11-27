import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Handshake } from "lucide-react";
import {
  publicMetadata,
  publicSponsors,
  readPublicSiteContent,
  safeHref,
} from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

const styles = {
  page: "w-full bg-transparent font-[family-name:var(--font-montserrat),_var(--font-alexandria),_sans-serif] text-[var(--site-ink)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-[var(--site-sky-ink)] [&_a:focus-visible]:outline-offset-4",
  gutter: "w-full px-[clamp(20px,3.5vw,64px)]",
  intro: "bg-transparent pt-[clamp(56px,8.3vw,116px)] pb-[clamp(70px,10vw,138px)] max-[560px]:pt-[clamp(88px,22vw,104px)]",
  sectionLabel: "flex w-fit items-center gap-[10px]",
  sectionNumber: "grid h-[29px] w-[29px] flex-[0_0_29px] place-items-center rounded-full bg-[var(--site-paper-dim)] text-[0.62rem] font-semibold tabular-nums text-white",
  sectionText: "inline-flex min-h-[29px] items-center rounded-full bg-[var(--site-glass-soft)] px-[13px] text-[0.59rem] font-semibold uppercase leading-[1.2] tracking-[0.08em] text-[var(--site-copy)]",
  introGrid: "mt-[clamp(48px,8vw,116px)] grid grid-cols-[minmax(0,1.2fr)_minmax(240px,0.6fr)] items-end gap-[clamp(36px,8vw,128px)] max-[800px]:mt-[52px] max-[800px]:grid-cols-1 max-[800px]:gap-7",
  overline: "m-0 text-[0.62rem] font-semibold uppercase leading-[1.5] tracking-[0.12em] text-[var(--site-sky-ink)]",
  title: "mt-[15px] mb-0 max-w-[10.5ch] [overflow-wrap:anywhere] text-[clamp(3.7rem,8.8vw,9.2rem)] font-[450] leading-[1.03] tracking-[-0.055em] max-[800px]:max-w-[12ch] max-[800px]:text-[clamp(3.4rem,11vw,6.3rem)] max-[560px]:max-w-[10ch] max-[560px]:text-[clamp(3.2rem,15.5vw,5rem)]",
  arabic: "mt-[22px] mb-0 max-w-[40rem] font-[var(--font-alexandria),sans-serif] text-[0.94rem] leading-[1.9] text-[var(--site-mist)]",
  introCopy: "mb-[7px] mt-0 max-w-[460px] text-[clamp(0.92rem,1.18vw,1.05rem)] leading-[1.85] text-[var(--site-copy)] max-[800px]:max-w-[560px]",
  partners: "bg-transparent pt-[clamp(38px,5.5vw,78px)] pb-[clamp(80px,11vw,154px)]",
  partnersHead: "flex items-center justify-between gap-[25px] max-[560px]:items-start max-[560px]:flex-col max-[560px]:gap-[15px]",
  partnersNote: "m-0 max-w-[420px] text-[0.76rem] leading-[1.75] text-[var(--site-mist)]",
  partnerGrid: "mt-[clamp(28px,4vw,54px)] grid grid-cols-2 gap-[clamp(14px,2.2vw,28px)] max-[800px]:grid-cols-1",
  partnerCard: "min-w-0 rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[13px] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[800px]:grid max-[800px]:grid-cols-[minmax(200px,0.72fr)_minmax(0,1fr)] max-[800px]:gap-[10px] max-[560px]:block",
  partnerMedia: "relative grid min-h-[clamp(210px,22vw,330px)] place-items-center overflow-hidden rounded-[11px] bg-[var(--site-glass-soft)] text-[var(--site-mist)] before:absolute before:aspect-square before:w-[44%] before:scale-[1.35] before:rounded-full before:border before:border-[var(--site-glass-border)] before:content-[''] after:absolute after:aspect-square after:w-[44%] after:scale-[1.8] after:rounded-full after:border after:border-[var(--site-glass-border)] after:content-[''] max-[800px]:min-h-[250px] max-[560px]:min-h-[218px]",
  mediaIndex: "absolute left-[17px] top-4 z-[1] text-[0.52rem] font-semibold uppercase leading-[1.4] tracking-[0.13em] text-[var(--site-mist)]",
  mediaCaption: "absolute right-[17px] bottom-[15px] z-[1] text-[0.52rem] font-semibold uppercase leading-[1.4] tracking-[0.13em] text-[var(--site-mist)]",
  partnerIcon: "relative z-[1] h-auto w-[clamp(60px,7vw,94px)] text-[var(--site-mist)]",
  partnerCopy: "px-[clamp(7px,1.3vw,17px)] pt-[clamp(20px,2.5vw,34px)] pb-[13px] max-[800px]:self-center max-[800px]:p-5 max-[560px]:px-2 max-[560px]:pt-[22px] max-[560px]:pb-[10px] [&_h2]:mt-[9px] [&_h2]:mb-0 [&_h2]:[overflow-wrap:anywhere] [&_h2]:text-[clamp(1.6rem,2.5vw,2.6rem)] [&_h2]:font-medium [&_h2]:leading-[1.1] [&_h2]:tracking-[-0.045em]",
  category: "m-0 text-[0.62rem] font-semibold uppercase leading-[1.5] tracking-[0.12em] text-[var(--site-sky-ink)]",
  summary: "mt-3 mb-0 max-w-[60ch] text-[0.83rem] leading-[1.8] text-[var(--site-copy)]",
  partnerLink: "mt-5 inline-flex min-h-[42px] items-center gap-3 text-[0.7rem] font-semibold text-[var(--site-sky-ink)] transition-[gap,color] duration-[180ms] hover:gap-[17px] hover:text-[var(--site-ink)] motion-reduce:transition-none [&_span]:text-base",
  emptyState: "mt-[clamp(30px,4vw,54px)] grid grid-cols-[minmax(160px,0.42fr)_minmax(0,1fr)] items-center gap-[clamp(24px,5vw,70px)] rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[clamp(16px,2vw,24px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[560px]:grid-cols-1 max-[560px]:gap-5 [&_h2]:mt-[9px] [&_h2]:mb-0 [&_h2]:[overflow-wrap:anywhere] [&_h2]:text-[clamp(1.6rem,2.5vw,2.6rem)] [&_h2]:font-medium [&_h2]:leading-[1.1] [&_h2]:tracking-[-0.045em]",
  emptyIcon: "grid min-h-[205px] place-items-center rounded-[11px] bg-[var(--site-glass-soft)] text-[var(--site-mist)] [&_svg]:h-auto [&_svg]:w-[68px] max-[560px]:min-h-[150px]",
  cta: "bg-transparent py-[clamp(58px,8.5vw,116px)]",
  ctaPanel: "relative mt-[clamp(30px,4vw,52px)] grid grid-cols-[minmax(0,1.05fr)_minmax(240px,0.65fr)_auto] items-end gap-[clamp(24px,5vw,80px)] rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] p-[clamp(30px,5vw,70px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] lg:backdrop-blur-md max-[800px]:grid-cols-[minmax(0,1fr)_auto] max-[800px]:items-start max-[800px]:[&_h2]:col-span-full max-[560px]:grid-cols-[1fr_auto] max-[560px]:gap-x-[15px] max-[560px]:gap-y-[26px] max-[560px]:p-[25px] max-[560px]:[&_h2]:col-span-full max-[560px]:[&_h2]:text-[clamp(2.8rem,12vw,4.3rem)] max-[560px]:[&_div:first-of-type]:col-span-full max-[560px]:[&_div:last-child]:col-start-2 max-[560px]:[&_div:last-child]:row-start-3",
  ctaTitle: "m-0 text-[clamp(2.8rem,6.1vw,6.6rem)] font-[450] leading-[1.03] tracking-[-0.055em] [&_span]:text-[var(--site-sky-ink)]",
  ctaCopy: "[&_p]:mb-[23px] [&_p]:mt-0 [&_p]:max-w-[39ch] [&_p]:text-[0.85rem] [&_p]:leading-[1.8] [&_p]:text-[var(--site-copy)]",
  ctaLink: "inline-flex min-h-12 items-center gap-[14px] rounded-full bg-[var(--site-paper-dim)] py-[5px] pl-[19px] pr-[6px] text-[0.69rem] font-semibold text-white transition-[background-color,transform,color] duration-[180ms] hover:-translate-y-0.5 hover:bg-[var(--site-sky-ink)] hover:text-[var(--site-paper-dim)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  ctaArrow: "grid h-9 w-9 place-items-center rounded-full bg-[var(--site-glass-soft)] text-base text-[var(--site-sky-ink)]",
  ctaIcon: "grid w-[clamp(72px,8vw,112px)] aspect-square place-items-center rounded-[13px] bg-[var(--site-glass-soft)] text-[var(--site-mist)] [&_svg]:h-auto [&_svg]:w-[52%] max-[560px]:col-start-2 max-[560px]:row-start-3 max-[560px]:w-[60px]",
};

export const metadata: Metadata = publicMetadata(
  "Partners & Sponsors",
  "Meet the organizations currently published as IT Club partners, and get in touch about a future collaboration.",
  "/sponsors",
);

export default async function SponsorsPage() {
  const content = await readPublicSiteContent();
  const sponsors = publicSponsors(content.sponsors);

  return (
    <SiteFrame>
      <div className={styles.page}>
        <header className={styles.intro}>
          <div className={styles.gutter}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionNumber}>05</span>
              <span className={styles.sectionText}>
                Partners / shared purpose
              </span>
            </div>
            <div className={styles.introGrid}>
              <div>
                <p className={styles.overline}>A wider circle of possibility</p>
                <h1 className={styles.title}>Good work travels further.</h1>
                <p className={styles.arabic} lang="ar" dir="rtl">
                  التعاون الجيد يفتح أبوابًا جديدة للتعلّم والعمل.
                </p>
              </div>
              <p className={styles.introCopy}>
                Partnerships help ideas move between students and the wider
                technology community. Here are the organizations currently
                approved as IT Club partners.
              </p>
            </div>
          </div>
        </header>

        <section
          className={styles.partners}
          aria-labelledby="partners-heading"
        >
          <div className={styles.gutter}>
            <div className={styles.partnersHead}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionNumber}>01</span>
                <span
                  className={styles.sectionText}
                  id="partners-heading"
                >
                  Our partners
                </span>
              </div>
              <p className={styles.partnersNote}>
                Only currently published partner records are shown. Their names
                and approved summaries stay at the center of the story.
              </p>
            </div>

            {sponsors.length ? (
              <div className={styles.partnerGrid}>
                {sponsors.map((sponsor, index) => {
                  const href = safeHref(sponsor.data.href);
                  const isExternal = Boolean(href?.startsWith("https:"));
                  const category = sponsor.data.category || "IT CLUB PARTNER";
                  const isInstitution =
                    /university|institution|venue|location|community|space/i.test(
                      category,
                    );
                  const PartnerIcon = isInstitution ? Building2 : Handshake;

                  return (
                    <article className={styles.partnerCard} key={sponsor.id}>
                      <div className={styles.partnerMedia} aria-hidden="true">
                        <span className={styles.mediaIndex}>
                          PARTNER / {String(index + 1).padStart(2, "0")}
                        </span>
                        <PartnerIcon
                          className={styles.partnerIcon}
                          strokeWidth={1.15}
                        />
                        <span className={styles.mediaCaption}>
                          Shared purpose
                        </span>
                      </div>
                      <div className={styles.partnerCopy}>
                        <p className={styles.category}>{category}</p>
                        <h2>{sponsor.data.title}</h2>
                        {sponsor.data.summary ? (
                          <p className={styles.summary}>
                            {sponsor.data.summary}
                          </p>
                        ) : null}
                        {href ? (
                          <a
                            className={styles.partnerLink}
                            href={href}
                            target={isExternal ? "_blank" : undefined}
                            rel={isExternal ? "noreferrer" : undefined}
                            aria-label={`Visit ${sponsor.data.title}${isExternal ? " (opens in a new tab)" : ""}`}
                          >
                            Visit partner <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon} aria-hidden="true">
                  <Handshake strokeWidth={1.2} />
                </div>
                <div>
                  <p className={styles.category}>NO PUBLISHED PARTNERS</p>
                  <h2>No partner listings are published yet.</h2>
                  <p className={styles.summary}>
                    We do not display unverified or archived logos as current
                    partners. This page will change when a new partner is
                    confirmed for public view.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          className={styles.cta}
          aria-labelledby="partnership-cta-heading"
        >
          <div className={styles.gutter}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionNumber}>02</span>
              <span className={styles.sectionText}>Work with IT Club</span>
            </div>
            <div className={styles.ctaPanel}>
              <h2 className={styles.ctaTitle} id="partnership-cta-heading">
                Let’s make
                <br />
                <span>something useful.</span>
              </h2>
              <div className={styles.ctaCopy}>
                <p>
                  Have a collaboration, sponsorship, or community idea in mind?
                  Tell us what you would like to explore and we’ll take it from
                  there.
                </p>
                <Link className={styles.ctaLink} href="/contact">
                  <span>Talk partnerships</span>
                  <span className={styles.ctaArrow} aria-hidden="true">
                    ↗
                  </span>
                </Link>
              </div>
              <div className={styles.ctaIcon} aria-hidden="true">
                <Handshake strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
