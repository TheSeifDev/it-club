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
import styles from "@/src/components/site/PartnersEditorial.module.css";

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
              <h2 id="partnership-cta-heading">
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
