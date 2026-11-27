import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, GraduationCap, UserRound } from "lucide-react";
import {
  publicAlumni,
  publicMetadata,
  readPublicSiteContent,
  safeHref,
} from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";
import styles from "@/src/components/site/AlumniEditorial.module.css";

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
                const MemberIcon = index % 2 === 0 ? GraduationCap : UserRound;
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
                      <MemberIcon
                        className={styles.tileIcon}
                        strokeWidth={1.15}
                      />
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
                          <ArrowUpRight
                            className={styles.nameArrow}
                            aria-hidden="true"
                            strokeWidth={1.8}
                          />
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
                          <ArrowUpRight aria-hidden="true" size={15} />
                        </Link>
                        {links.map((item) => (
                          <a
                            className={styles.externalLink}
                            href={item.href}
                            key={`${item.label}-${item.href}`}
                          >
                            {item.label}
                            <ArrowUpRight aria-hidden="true" size={14} />
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
              <UsersMark />
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
              <span className={styles.ctaArrow}>
                <ArrowUpRight aria-hidden="true" size={18} />
              </span>
            </Link>
            <div className={styles.ctaIconTile} aria-hidden="true">
              <GraduationCap strokeWidth={1.2} />
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}

function UsersMark() {
  return <UserRound aria-hidden="true" size={16} strokeWidth={1.8} />;
}
