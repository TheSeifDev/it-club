import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publicAlumni, publicMembers, readPublicSiteContent, validSlug } from "@/src/components/site/content-utils";
import { ProfileDetail, SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!validSlug(slug)) return { title: "Profile not found", robots: { index: false, follow: false } };
  const content = await readPublicSiteContent();
  const entry = [...publicMembers(content.members), ...publicAlumni(content.members)].find((item) => item.slug === slug);
  if (!entry) return { title: "Profile not found", robots: { index: false, follow: false } };
  return publicMetadata(`${entry.data.title} — Community`, entry.data.summary || `${entry.data.role} at IT Club, ${entry.data.committee ?? "BATU"}.`, `/community/${entry.slug}`);
}

export default async function MemberDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await readPublicSiteContent();
  const entry = [...publicMembers(content.members), ...publicAlumni(content.members)].find((item) => item.slug === slug);
  if (!entry) notFound();
  return (
    <SiteFrame>
      <section className="site-profile-page"><div className="site-container"><ProfileDetail entry={entry} /><div className="site-detail-back"><Link className="site-text-link" href={entry.data.alumni ? "/alumni" : "/community"}>← {entry.data.alumni ? "All alumni" : "All teams"}</Link></div></div></section>
    </SiteFrame>
  );
}
