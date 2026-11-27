import type { Metadata } from "next";
import { HomeHero } from "@/src/components/site/HomeHero";
import { HomeScrollRail } from "@/src/components/site/HomeScrollRail";
import { EditorialHome } from "@/src/components/site/EditorialHome";
import { editorialEvents } from "@/src/components/site/editorial-events";
import { SiteFrame, SiteUnavailable } from "@/src/components/site/SiteUI";
import { getTrackTheme } from "@/lib/ui/track-theme";
import {
  activeAnnouncements,
  displayResponsibilities,
  publicMembers,
  publicMetadata,
  publicSponsors,
  publicTracks,
  readPublicSiteContent,
  safeHref,
} from "@/src/components/site/content-utils";

export const metadata: Metadata = publicMetadata(
  "IT Club — BATU",
  "Curiosity deserves a community. Meet the people, teams and shared practice of IT Club at Borg Al Arab Technological University.",
  "/",
);

export default async function HomePage() {
  let content;
  try {
    content = await readPublicSiteContent();
  } catch {
    return <SiteFrame><SiteUnavailable /></SiteFrame>;
  }
  const publishedPeople = publicMembers(content.members);
  const people = [...publishedPeople.filter((member) => member.featured), ...publishedPeople.filter((member) => !member.featured)].map((member) => ({
    id: member.id,
    slug: member.slug,
    name: member.data.title,
    role: member.data.role,
    committee: member.data.committee,
    scope: displayResponsibilities(member)[0] || "",
  }));
  const tracks = publicTracks(content.tracks).map((track) => {
    const theme = getTrackTheme(track.slug || track.data.title);
    return {
      id: track.id,
      slug: track.slug,
      title: track.data.title,
      arabicTitle: track.data.arabicTitle || theme.arabic,
      category: track.data.category,
      summary: track.data.summary || track.data.body,
      capabilities: track.data.responsibilities?.slice(0, 3) || [],
      color: theme.color,
      ink: theme.ink,
    };
  });
  const { events, eventMode } = editorialEvents(content.events);
  const partners = publicSponsors(content.sponsors).map((partner) => ({
    id: partner.id,
    name: partner.data.title,
    href: safeHref(partner.data.href),
  }));
  const notice = activeAnnouncements(content.announcements)[0];

  return (
    <SiteFrame>
      <div data-editorial-home>
        <HomeScrollRail />
        <HomeHero people={people.slice(0, 3)} />
        <EditorialHome
          tracks={tracks}
          people={people}
          events={events}
          eventMode={eventMode}
          partners={partners}
          notice={notice ? { title: notice.data.title, summary: notice.data.summary, href: safeHref(notice.data.href) } : undefined}
        />
      </div>
    </SiteFrame>
  );
}
