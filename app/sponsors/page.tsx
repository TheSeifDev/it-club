import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { publicSponsors, readPublicSiteContent, safeHref, safeImage } from "@/src/components/site/content-utils";
import { EmptyState, PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

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
      <PageIntro number="05" eyebrow="PARTNERS / SHARED PURPOSE" title="Good work travels further." description="Partnerships help ideas move between students and the wider technology community. Here are the organizations currently approved as IT Club partners." arabic="التعاون الجيد يفتح أبوابًا جديدة للتعلّم والعمل." />
      <section className="site-sponsors-section site-container">
        <div className="site-sponsors-section__head"><SectionLabel number="01">OUR PARTNERS</SectionLabel><p>Only currently published partner records are shown. Logos and links are used as provided by the approved content record.</p></div>
        {sponsors.length ? (
          <div className="site-sponsor-list">
            {sponsors.map((sponsor, index) => {
              const image = safeImage(sponsor.data.image);
              const href = safeHref(sponsor.data.href);
              const isExternal = Boolean(href?.startsWith("https:"));
              const contents = <>{image ? <Image src={image} alt={`${sponsor.data.title} logo`} width={300} height={140} unoptimized /> : <span className="site-sponsor-wordmark">{sponsor.data.title}</span>}<span className="site-sponsor-list__index">{String(index + 1).padStart(2, "0")}</span><span className="site-sponsor-list__arrow" aria-hidden="true">↗</span></>;
              return (
                <article className="site-sponsor-row" key={sponsor.id} data-reveal>
                  {href ? <a className="site-sponsor-row__link" href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} aria-label={`${sponsor.data.title}${isExternal ? " (opens in a new tab)" : ""}`}>{contents}</a> : <div className="site-sponsor-row__link">{contents}</div>}
                  <div className="site-sponsor-row__copy"><p className="site-eyebrow">{sponsor.data.category || "IT CLUB PARTNER"}</p><h2>{sponsor.data.title}</h2>{sponsor.data.summary ? <p>{sponsor.data.summary}</p> : null}</div>
                </article>
              );
            })}
          </div>
        ) : <EmptyState title="No partner listings are published yet." text="We do not display unverified or archived logos as current partners. This page will change when a new partner is confirmed for public view." />}
      </section>
      <section className="site-partnership-cta"><div className="site-container"><SectionLabel number="02">WORK WITH IT CLUB</SectionLabel><div className="site-partnership-cta__body"><h2 className="site-display">Let’s make<br /><span>something useful.</span></h2><div><p>Have a collaboration, sponsorship, or community idea in mind? Tell us what you would like to explore and we’ll take it from there.</p><Link href="/contact" className="site-button site-button--emerald">TALK PARTNERSHIPS <span aria-hidden="true">↗</span></Link><a className="site-partnership-cta__email" href="mailto:contact@itclub.one">Or email contact@itclub.one</a></div></div></div></section>
    </SiteFrame>
  );
}
