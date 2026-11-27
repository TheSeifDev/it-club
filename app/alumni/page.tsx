import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { initials } from "@/lib/ui/initials";
import {
  publicAlumni,
  publicMetadata,
  readPublicSiteContent,
  safeHref,
} from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

const styles = {
  page: "min-w-0 bg-transparent font-[family-name:var(--font-montserrat),_var(--font-alexandria),_sans-serif] text-[var(--site-ink)] px-0 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-[var(--site-sky-ink)] [&_a:focus-visible]:outline-offset-4",
  intro: "px-[clamp(20px,3.5vw,64px)] bg-transparent pt-[clamp(46px,7vw,94px)] pb-[clamp(68px,9vw,132px)] max-[560px]:pt-[clamp(88px,22vw,104px)]",
  sectionLabel: "inline-flex min-h-[38px] items-center gap-[10px] rounded-full bg-[var(--site-glass-soft)] py-1 pl-[5px] pr-[15px] text-[0.63rem] font-[550] uppercase leading-[1.35] tracking-[0.065em] text-[var(--site-copy)]",
  sectionNumber: "inline-grid h-7 w-7 flex-none place-items-center rounded-full bg-[var(--site-paper-dim)] text-[0.6rem] font-semibold tabular-nums text-white",
  introBody: "mt-[clamp(42px,6vw,84px)] grid grid-cols-[minmax(0,1.25fr)_minmax(250px,0.55fr)] items-end gap-[clamp(36px,8vw,120px)] max-[700px]:grid-cols-1 max-[700px]:gap-[22px]",
  title: "mb-0 max-w-[12ch] text-[clamp(3.15rem,8.6vw,8.3rem)] font-[450] leading-[1.04] tracking-[-0.055em] [overflow-wrap:anywhere] max-[560px]:text-[clamp(3rem,13vw,4.6rem)]",
  arabic: "mt-6 mb-0 font-[var(--font-alexandria),sans-serif] text-[clamp(0.87rem,1.15vw,1rem)] leading-[1.9] tracking-normal text-[var(--site-sky-ink)]",
  introCopy: "mb-[6px] mt-0 max-w-[440px] text-[clamp(0.92rem,1.25vw,1.02rem)] leading-[1.85] text-[var(--site-copy)] max-[700px]:max-w-[560px]",
  directory: "bg-transparent px-[clamp(20px,3.5vw,64px)] pt-[clamp(64px,8vw,112px)] pb-[clamp(84px,11vw,158px)]",
  directoryHeading: "mt-[clamp(38px,5vw,68px)] grid grid-cols-[minmax(0,1fr)_minmax(240px,0.45fr)] items-end gap-[clamp(28px,6vw,90px)] max-[700px]:grid-cols-1 max-[700px]:gap-[22px]",
  heading: "mb-0 max-w-[13ch] text-[clamp(2.7rem,6vw,5.8rem)] font-[450] leading-[1.06] tracking-[-0.055em]",
  headingNote: "mb-1 mt-0 max-w-[390px] text-[0.9rem] leading-[1.8] text-[var(--site-copy)]",
  grid: "mt-[clamp(34px,4.5vw,60px)] grid grid-cols-3 items-stretch gap-[clamp(14px,2.1vw,28px)] max-[980px]:grid-cols-2 max-[700px]:gap-[15px] max-[560px]:grid-cols-1",
  card: "flex min-w-0 flex-col rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-3 shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-transform duration-[220ms] hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[700px]:p-[9px]",
  iconTile: "relative grid min-w-0 aspect-[1.48/1] place-items-center overflow-hidden rounded-[11px] bg-transparent text-[var(--site-mist)] max-[560px]:aspect-[1.65/1]",
  tileIndex: "absolute left-[17px] top-4 text-[0.57rem] font-semibold uppercase leading-[1.4] tracking-[0.09em] text-[var(--site-mist)] tabular-nums",
  tileCaption: "absolute right-4 bottom-[14px] max-w-[65%] overflow-hidden text-ellipsis whitespace-nowrap text-right text-[0.57rem] font-semibold uppercase leading-[1.4] tracking-[0.09em] text-[var(--site-mist)]",
  tileIcon: "text-[clamp(3.4rem,6.5vw,5.6rem)] leading-none font-medium tracking-[-0.08em] text-[var(--site-ink)]",
  cardBody: "flex flex-1 flex-col items-start px-[clamp(7px,0.7vw,11px)] pt-[clamp(18px,2vw,26px)] pb-3 max-[700px]:px-[6px] max-[700px]:pt-4 max-[700px]:pb-[9px]",
  eyebrow: "mb-[10px] mt-0 text-[0.62rem] font-semibold uppercase leading-[1.5] tracking-[0.09em] text-[var(--site-sky-ink)]",
  name: "mb-2 mt-0 [overflow-wrap:anywhere] text-[clamp(1.45rem,2.3vw,2.15rem)] font-medium leading-[1.12] tracking-[-0.055em] max-[560px]:text-[clamp(1.55rem,7.5vw,2rem)]",
  nameLink: "group inline text-[var(--site-ink)]",
  nameArrow: "ml-[7px] inline-block text-[0.6em] align-[0.1em] text-[var(--site-sky-ink)] transition-transform duration-[180ms] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transition-none",
  role: "m-0 text-[0.78rem] font-[550] leading-[1.6] text-[var(--site-copy)]",
  contribution: "mt-[14px] mb-0 max-w-[52ch] text-[0.8rem] leading-[1.75] text-[var(--site-copy)]",
  cardLinks: "mt-auto flex flex-wrap items-center gap-x-[18px] gap-y-[10px] pt-[22px] [&_svg]:flex-none [&_svg]:transition-transform [&_svg]:duration-[180ms] [&_a:hover_svg]:translate-x-0.5 [&_a:hover_svg]:-translate-y-0.5 motion-reduce:[&_svg]:transition-none",
  profileLink: "inline-flex min-h-8 items-center gap-[6px] text-[0.68rem] font-semibold leading-[1.4] text-[var(--site-sky-ink)]",
  externalLink: "inline-flex min-h-8 items-center gap-[6px] text-[0.68rem] font-semibold leading-[1.4] text-[var(--site-sky-ink)]",
  emptyState: "mt-[clamp(32px,4vw,52px)] grid grid-cols-[46px_minmax(0,1fr)] gap-[18px] rounded-2xl border border-[var(--site-glass-border)] bg-[var(--site-glass)] p-[clamp(24px,4vw,46px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] max-[560px]:grid-cols-1 max-[560px]:gap-[14px] [&_h3]:mb-[9px] [&_h3]:mt-0 [&_h3]:text-[clamp(1.35rem,2.4vw,1.9rem)] [&_h3]:font-medium [&_h3]:leading-[1.2] [&_h3]:tracking-[-0.045em] [&_div>p:last-child]:m-0 [&_div>p:last-child]:max-w-[690px] [&_div>p:last-child]:text-[0.84rem] [&_div>p:last-child]:leading-[1.8] [&_div>p:last-child]:text-[var(--site-copy)]",
  emptyMark: "grid h-[38px] w-[38px] place-items-center rounded-full bg-[var(--site-paper-dim)] text-[1.1rem] text-white",
  cta: "bg-transparent px-[clamp(20px,3.5vw,64px)] pt-[clamp(50px,7vw,92px)] pb-[clamp(66px,9vw,120px)]",
  ctaLabel: "inline-flex min-h-[38px] items-center gap-[10px] rounded-full bg-[var(--site-glass-soft)] py-1 pl-[5px] pr-[15px] text-[0.63rem] font-[550] uppercase leading-[1.35] tracking-[0.065em] text-[var(--site-copy)]",
  messagePanel: "relative mx-auto mt-[clamp(25px,4vw,48px)] w-[min(100%,980px)] rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] px-[clamp(22px,7vw,92px)] pt-[clamp(38px,7vw,82px)] pb-[clamp(38px,7vw,82px)] text-center shadow-[inset_0_1px_0_var(--site-glass-highlight)] lg:backdrop-blur-md max-[560px]:pb-[74px]",
  messageKicker: "m-0 inline-flex min-h-8 items-center gap-[9px] rounded-full bg-[var(--site-glass-soft)] px-[13px] py-[5px] text-[0.66rem] font-semibold tracking-[0.025em] text-[var(--site-sky-ink)]",
  ctaTitle: "mx-auto mt-6 mb-0 max-w-[14ch] text-[clamp(2.45rem,6.1vw,5.2rem)] font-[450] leading-[1.06] tracking-[-0.055em]",
  ctaCopy: "mt-4 mb-0 text-[0.89rem] leading-[1.7] text-[var(--site-copy)]",
  ctaLink: "mt-[27px] inline-flex min-h-[52px] items-center gap-[17px] rounded-full bg-[var(--site-paper-dim)] py-[5px] pl-[21px] pr-[6px] text-[0.77rem] font-[550] text-white transition-[transform,background-color] duration-[180ms] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  ctaArrow: "grid h-[39px] w-[39px] place-items-center rounded-full bg-[var(--site-glass-soft)] text-[var(--site-sky-ink)]",
  ctaIconTile: "absolute right-[clamp(18px,3vw,34px)] bottom-[-27px] grid h-[76px] w-[76px] place-items-center rounded-xl bg-[var(--site-glass)] text-[var(--site-mist)] [&_img]:h-[46%] [&_img]:w-auto max-[560px]:right-[18px] max-[560px]:bottom-[-25px] max-[560px]:h-[62px] max-[560px]:w-[62px]",
};

export const metadata: Metadata = publicMetadata(
  "Alumni",
  "Recognizing former IT Club members whose published contributions remain part of the community story.",
  "/alumni",
);

export default async function AlumniPage() {
  const content = await readPublicSiteContent();
  const alumni = publicAlumni(content.members);

  return (
    <SiteFrame>
      <div className={styles.page}>
        <section className={styles.intro} aria-labelledby="alumni-title">
          <div className={styles.sectionLabel}>
            <span className={styles.sectionNumber}>06</span>
            <span>Alumni / Part of the story</span>
          </div>
          <div className={styles.introBody}>
            <div>
              <h1 className={styles.title} id="alumni-title">
                Built by more than one generation.
              </h1>
              <p className={styles.arabic} lang="ar" dir="rtl">
                أثر الأعضاء السابقين يظل حاضرًا في كل ما يبنيه الفريق اليوم.
              </p>
            </div>
            <p className={styles.introCopy}>
              A community lasts because people share what they know, take
              responsibility, and make space for the next person. This page
              recognizes former members whose profiles are approved for public
              view.
            </p>
          </div>
        </section>

        <section
          className={styles.directory}
          aria-labelledby="alumni-directory-title"
        >
          <div className={styles.sectionLabel}>
            <span className={styles.sectionNumber}>01</span>
            <span>Former members</span>
          </div>
          <div className={styles.directoryHeading}>
            <h2 className={styles.heading} id="alumni-directory-title">
              A community that spans generations.
            </h2>
            <p className={styles.headingNote}>
              Published alumni profiles, with their names, roles, and approved
              contributions.
            </p>
          </div>

          {alumni.length ? (
            <div className={styles.grid}>
              {alumni.map((member, index) => {
                const contribution =
                  member.data.summary?.trim() ||
                  member.data.responsibilities
                    ?.map((item) => item.trim())
                    .filter(Boolean)
                    .join(" · ");
                const links = (member.data.links ?? []).flatMap((item) => {
                  const href = safeHref(item.href);
                  return href ? [{ ...item, href }] : [];
                });

                return (
                  <article className={styles.card} key={member.id}>
                    <div className={styles.iconTile} aria-hidden="true">
                      <span className={styles.tileIndex}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={styles.tileIcon}>
                        {initials(member.data.title)}
                      </span>
                      <span className={styles.tileCaption}>
                        {member.data.committee || "Alumni"}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      {member.data.committee ? (
                        <p className={styles.eyebrow}>{member.data.committee}</p>
                      ) : null}
                      <h3 className={styles.name}>
                        <Link
                          className={styles.nameLink}
                          href={`/community/${member.slug}`}
                        >
                          {member.data.title}
                          <span className={styles.nameArrow} aria-hidden="true">
                            ↗
                          </span>
                        </Link>
                      </h3>
                      <p className={styles.role}>{member.data.role}</p>
                      {contribution ? (
                        <p className={styles.contribution}>{contribution}</p>
                      ) : null}
                      <div className={styles.cardLinks}>
                        <Link
                          className={styles.profileLink}
                          href={`/community/${member.slug}`}
                        >
                          View profile
                          <span aria-hidden="true">↗</span>
                        </Link>
                        {links.map((item) => (
                          <a
                            className={styles.externalLink}
                            href={item.href}
                            key={`${item.label}-${item.href}`}
                          >
                            {item.label}
                            <span aria-hidden="true">↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState} role="status">
              <span className={styles.emptyMark} aria-hidden="true">
                —
              </span>
              <div>
                <p className={styles.eyebrow}>Published directory</p>
                <h3>No alumni profiles are published yet.</h3>
                <p>
                  We do not invent a roll of honor. Former members will appear
                  here when their profile and contribution are confirmed for
                  publication.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.cta} aria-labelledby="community-cta-title">
          <div className={styles.ctaLabel}>
            <span className={styles.sectionNumber}>02</span>
            <span>The community continues</span>
          </div>
          <div className={styles.messagePanel}>
            <p className={styles.messageKicker}>
              <span aria-hidden="true">(—)</span>
              <span>Still building, together</span>
            </p>
            <h2 className={styles.ctaTitle} id="community-cta-title">
              Good work leaves a way forward.
            </h2>
            <p className={styles.ctaCopy}>
              Meet the people carrying the club forward today.
            </p>
            <Link className={styles.ctaLink} href="/community">
              Explore the community
              <span className={styles.ctaArrow} aria-hidden="true">
                ↗
              </span>
            </Link>
            <div className={styles.ctaIconTile} aria-hidden="true">
              <Image src="/logo.webp" alt="" width={40} height={40} />
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
