import type { Metadata } from "next";
import { IT_CLUB_TRACKS } from "@/src/components/interview/Tracks/tracks-data";
import { getTrackTheme } from "@/lib/ui/track-theme";
import TracksExperience, {
  type ExhibitionBoard,
  type ExhibitionMember,
  type ExhibitionTrack,
} from "@/src/components/site/TracksExperience";
import {
  publicBoards,
  publicMembers,
  publicTracks,
  publicMetadata,
  readPublicSiteContent,
  safeHref,
  safeImage,
} from "@/src/components/site/content-utils";
import { SiteFrame, SiteUnavailable } from "@/src/components/site/SiteUI";

export const metadata: Metadata = publicMetadata(
  "Tracks & Teams",
  "Explore the approved tracks and committees that make up IT Club at Borg Al Arab Technological University.",
  "/tracks",
);

function canonicalFor(slug: string, title: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedTitle = title.trim().toLowerCase();
  return IT_CLUB_TRACKS.find(
    (track) =>
      track.id === normalizedSlug ||
      track.anchorIds.includes(normalizedSlug) ||
      track.title.toLowerCase() === normalizedTitle,
  );
}

function publishedBoardFor(
  boards: ReturnType<typeof publicBoards>,
  slug: string,
  title: string,
) {
  const canonical = canonicalFor(slug, title);
  return boards.find((board) => {
    const boardTitle = board.data.title.trim().toLowerCase();
    return (
      board.slug === slug ||
      boardTitle === title.trim().toLowerCase() ||
      board.slug === canonical?.id
    );
  });
}

export default async function TracksPage() {
  let content;
  try {
    content = await readPublicSiteContent();
  } catch {
    return (
      <SiteFrame>
        <SiteUnavailable />
      </SiteFrame>
    );
  }

  const published = publicTracks(content.tracks);
  const boards = publicBoards(content.boards);
  const members = publicMembers(content.members);

  const tracks: ExhibitionTrack[] = published.map((entry) => {
    const canonical = canonicalFor(entry.slug, entry.data.title);
    const board = publishedBoardFor(boards, entry.slug, entry.data.title);
    const theme = getTrackTheme(canonical?.id ?? entry.slug);
    const responsibilities = entry.data.responsibilities
      ?.map((item) => item.trim())
      .filter(Boolean);
    const boardResponsibilities = board?.data.responsibilities
      ?.map((item) => item.trim())
      .filter(Boolean);
    const terrain = responsibilities?.length
      ? responsibilities.map((title) => ({ title }))
      : boardResponsibilities?.length
        ? boardResponsibilities.map((title) => ({ title }))
        : (canonical?.terrain ?? []).map(({ title, desc }) => ({ title, desc }));
    const canonicalMembers = new Set(canonical?.memberIds ?? []);
    const linkedMembers: ExhibitionMember[] = members
      .filter((member) => canonicalMembers.has(member.slug))
      .map((member) => ({
        slug: member.slug,
        name: member.data.title,
        role: member.data.role,
      }));
    const anchor = canonical?.id ?? entry.slug;

    return {
      id: entry.id,
      slug: anchor,
      title: entry.data.title || canonical?.title || "Published track",
      arabicTitle:
        entry.data.arabicTitle?.trim() || canonical?.arabicTitle || "",
      tag: entry.data.category?.trim() || canonical?.tag || "IT CLUB TRACK",
      summary:
        entry.data.summary?.trim() ||
        entry.data.body?.trim() ||
        canonical?.description ||
        "Published track information from IT Club.",
      body: entry.data.body?.trim(),
      color: theme.color,
      rgb: theme.rgb,
      ink: theme.ink,
      image: safeImage(entry.data.image),
      terrain,
      board: board
        ? ({
            title: board.data.title,
            href: safeHref(board.data.href) ?? "/community",
          } satisfies ExhibitionBoard)
        : undefined,
      members: linkedMembers,
      iconName: canonical?.iconName ?? "code2",
      number: canonical?.number ?? String(published.indexOf(entry) + 1).padStart(2, "0"),
    };
  });

  return (
    <SiteFrame>
      <TracksExperience tracks={tracks} />
    </SiteFrame>
  );
}
