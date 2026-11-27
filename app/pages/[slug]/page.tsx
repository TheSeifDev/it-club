import { siteUi } from "@/src/components/site/public-ui";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { publicMetadata, publicPages, readPublicSiteContent, validSlug } from "@/src/components/site/content-utils";
import { PageIntro, SectionLabel, SiteFrame } from "@/src/components/site/SiteUI";

type PageParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  if (!validSlug(slug)) return { title: "Page not found", robots: { index: false, follow: false } };
  const content = await readPublicSiteContent();
  const page = publicPages(content.pages).find((entry) => entry.slug === slug);
  if (!page) return { title: "Page not found", robots: { index: false, follow: false } };
  return publicMetadata(page.data.title, page.data.summary || `Published information from IT Club at BATU: ${page.data.title}.`, `/pages/${page.slug}`);
}

export default async function CmsPage({ params }: PageParams) {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const page = publicPages(content.pages).find((entry) => entry.slug === slug);
  if (!page) notFound();
  const paragraphs = page.data.body?.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean) ?? [];
  return (
    <SiteFrame>
      <article className={siteUi("site-cms-page")}>
        <PageIntro number="07" eyebrow={page.data.category || "IT Club / Published page"} title={page.data.title} description={page.data.summary || page.data.subtitle || "Published information from the IT Club community."} arabic={page.data.arabicTitle} />
        <div className={siteUi("site-container site-event-detail__body")}>
          <div className={siteUi("site-event-detail__copy")}>
            {page.data.image ? <div className={siteUi("site-content-icon")} aria-hidden="true"><FileText /></div> : null}
            <SectionLabel number="01">Published information</SectionLabel>
            {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </div>
      </article>
    </SiteFrame>
  );
}
