import type { Metadata } from "next";
import CommunityHero from "@/src/components/site/CommunityHero";
import { CommunityBoards, LeadershipLineup, type BoardCard } from "@/src/components/site/CommunityBoards";
import CommunityDirectory from "@/src/components/site/CommunityDirectory";
import CommunityPersonCard, { type CommunityPerson } from "@/src/components/site/CommunityPersonCard";
import { communityBoards, communityMembers } from "@/src/components/site/community-content";
import { HoverIndex } from "@/src/components/site/editorial/HoverIndex";
import { ChapterRow, kit, Marquee, MaskLines, Pill, TextLink } from "@/src/components/site/editorial/kit";
import { boardPhoto } from "@/lib/ui/board-photos";
import { boardRoster } from "@/lib/ui/board-roster";
import { getTrackTheme } from "@/lib/ui/track-theme";
import { displayResponsibilities, publicMetadata, readPublicSiteContent } from "@/src/components/site/content-utils";
import { SiteFrame } from "@/src/components/site/SiteUI";

export const metadata: Metadata = publicMetadata(
  "Community & Boards",
  "Meet the boards behind IT Club at BATU — what each one does, who is on it, and how they work together.",
  "/community",
);

function personFromEntry(entry: Parameters<typeof displayResponsibilities>[0]): CommunityPerson {
  return {
    slug: entry.slug,
    name: entry.data.title,
    role: entry.data.role ?? "",
    committee: entry.data.committee ?? "",
    summary: displayResponsibilities(entry).join(" "),
  };
}

function splitPoint(value: string) {
  const at = value.indexOf(":");
  if (at < 1) return { title: value.trim() };
  return { title: value.slice(0, at).trim(), desc: value.slice(at + 1).trim() };
}

const toWords = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default async function CommunityPage() {
  const content = await readPublicSiteContent();
  // Presentation-only exclusion: stored records and other public routes stay unchanged.
  const members = communityMembers(content.members);
  const boards = communityBoards(content.boards);
  const leadership = members.filter((member) => member.data.committee?.trim().toLowerCase() === "it club").map(personFromEntry);
  const committees = [...new Set(members.map((member) => member.data.committee?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));

  const cards: BoardCard[] = boards.map((board) => {
    const theme = getTrackTheme(board.slug || board.data.committee || board.data.title);
    const code = theme.short === "CLUB" ? "IT" : theme.short;
    return {
      slug: board.slug,
      code,
      title: board.data.title,
      arabic: board.data.arabicTitle || theme.arabic || undefined,
      category: board.data.category,
      summary: board.data.summary,
      color: theme.color,
      responsibilities: (board.data.responsibilities ?? []).filter(Boolean).map(splitPoint),
      photo: boardPhoto(theme.short),
      people: boardRoster(code),
    };
  });
  const teams = cards.map((card) => ({ name: card.title, short: card.code, color: card.color }));
  const directoryMembers = members.map(personFromEntry);
  const countWord = toWords[cards.length] ?? String(cards.length);
  const clubLineup = leadership.length ? [] : boardRoster("club");
  const directoryNumber = leadership.length || clubLineup.length ? "IV" : "III";

  return (
    <SiteFrame>
      <div className={kit.page} data-editorial-page>
        <CommunityHero teams={teams} />

        <section id="community-boards" aria-labelledby="community-index-title" className="scroll-mt-[var(--site-header-clearance,112px)] pt-[clamp(90px,11vw,170px)] pb-[clamp(60px,7vw,110px)]">
          <div className={kit.gutter}>
            <ChapterRow number="I" label="The index" aside={<p className={`${kit.arabic} max-[700px]:hidden`} lang="ar" dir="rtl">اللجان</p>} />
            <div className="mt-[clamp(28px,3.4vw,52px)] grid grid-cols-[minmax(0,1fr)_minmax(240px,.38fr)] items-end gap-10 max-[900px]:grid-cols-1 max-[900px]:gap-6">
              <MaskLines id="community-index-title" className={kit.h2} lines={[`${countWord} boards.`, <em key="b">One club.</em>]} />
              <p className={kit.lead} data-rise>Every board owns a part of how the club runs. Hover a name to see it, open it to meet the work behind it.</p>
            </div>
          </div>
          <div className="mt-[clamp(40px,5vw,80px)]">
            {cards.length ? (
              <HoverIndex
                label="IT Club boards"
                items={cards.map((card, index) => ({
                  key: card.slug,
                  href: `#board-${card.slug}`,
                  number: String(index + 1).padStart(2, "0"),
                  title: card.title,
                  arabic: card.arabic,
                  meta: card.code,
                  code: card.code,
                  color: card.color,
                  image: card.photo ? { src: card.photo.src, alt: card.photo.alt } : card.people?.[0] ? { src: card.people[0].src, alt: card.people[0].name, cutout: true } : undefined,
                }))}
              />
            ) : (
              <p className={`${kit.gutter} ${kit.lead}`} role="status">Board details are being prepared for publication.</p>
            )}
          </div>
        </section>

        {cards.length ? (
          <section aria-labelledby="community-frame-title" className="pb-[clamp(70px,8vw,130px)]">
            <div className={`${kit.gutter} pb-[clamp(36px,4vw,64px)]`}>
              <ChapterRow number="II" label="In the frame" aside={<span className={`${kit.meta} max-[700px]:hidden`}>{String(cards.length).padStart(2, "0")} boards</span>} />
              <MaskLines id="community-frame-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Every board,", <em key="b">in the frame.</em>]} />
            </div>
            <CommunityBoards boards={cards} />
          </section>
        ) : null}

        {leadership.length ? (
          <section aria-labelledby="community-leadership-title" className={`${kit.gutter} py-[clamp(70px,8vw,130px)]`}>
            <ChapterRow number="III" label="Club leadership" />
            <MaskLines id="community-leadership-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["The people", <em key="b">setting the pace.</em>]} />
            <div className="mt-[clamp(34px,4vw,54px)] grid grid-cols-[repeat(auto-fit,minmax(min(100%,250px),1fr))] gap-[clamp(15px,1.8vw,25px)]" data-rise-group>
              {leadership.map((person) => <div key={person.slug} data-rise><CommunityPersonCard person={person} variant="leadership" /></div>)}
            </div>
          </section>
        ) : clubLineup.length ? (
          <section aria-labelledby="community-leadership-title" className={`${kit.gutter} py-[clamp(70px,8vw,130px)]`}>
            <ChapterRow number="III" label="Club leadership" aside={<p className={`${kit.arabic} max-[700px]:hidden`} lang="ar" dir="rtl">قيادة النادي</p>} />
            <MaskLines id="community-leadership-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["The people", <em key="b">setting the pace.</em>]} />
            <div className="mt-[clamp(34px,4vw,60px)]"><LeadershipLineup people={clubLineup} /></div>
          </section>
        ) : null}

        {directoryMembers.length || !clubLineup.length ? (
        <section id="community-directory" aria-labelledby="community-directory-title" className="scroll-mt-[var(--site-header-clearance,112px)] py-[clamp(70px,8vw,130px)]">
          <div className={kit.gutter}>
            <ChapterRow number={directoryNumber} label="Who does what" aside={<p className={`${kit.arabic} max-[700px]:hidden`} lang="ar" dir="rtl">دليل الأعضاء</p>} />
            <MaskLines id="community-directory-title" className={`${kit.h2} mt-[clamp(28px,3.4vw,52px)]`} lines={["Know the people", <em key="b">behind the work.</em>]} />
          </div>
          {directoryMembers.length ? (
            <CommunityDirectory members={directoryMembers} committees={committees} />
          ) : (
            <div className={`${kit.gutter} mt-[clamp(34px,4vw,60px)]`} role="status">
              <div className="relative overflow-hidden rounded-[22px] bg-[var(--site-glass)] p-[clamp(24px,3.4vw,56px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)]" data-rise>
                <span aria-hidden="true" className={`pointer-events-none absolute -right-[.04em] -bottom-[.22em] text-[clamp(7rem,19vw,20rem)] leading-none tracking-[-.09em] ${kit.outline} [--stroke:rgb(82_232_209_/_.28)]`}>Soon.</span>
                <p className={kit.meta}>Member directory</p>
                <h3 className="relative mt-5 mb-0 max-w-[16ch] text-[clamp(1.9rem,3.4vw,3.6rem)] font-normal leading-[1.02] tracking-[-.065em]">Profiles go live once each member approves theirs.</h3>
                <p className={`${kit.lead} relative mt-5`}>Names, roles and responsibilities appear here only after they are cleared for public view.</p>
              </div>
            </div>
          )}
        </section>
        ) : null}

        <section aria-labelledby="community-cta-title" className="relative overflow-hidden pt-[clamp(60px,7vw,120px)] pb-[clamp(70px,8vw,130px)]">
          <Marquee className="text-[clamp(4.6rem,13vw,14rem)] leading-[.95] tracking-[-.08em]" speed={1}>
            {Array.from({ length: 3 }, (_, index) => <span key={index} className="pr-[.3em]">Find your people <span className={kit.outline}>—</span></span>)}
          </Marquee>
          <Marquee dir="r" className="text-[clamp(4.6rem,13vw,14rem)] leading-[.95] tracking-[-.08em]" speed={.8}>
            {Array.from({ length: 3 }, (_, index) => <span key={index} className="pr-[.3em]"><span className={kit.outline}>Build</span> something real ·</span>)}
          </Marquee>
          <div className={`${kit.gutter} mt-[clamp(40px,5vw,80px)] flex items-end justify-between gap-8 max-[800px]:flex-col max-[800px]:items-start`} data-rise>
            <h2 id="community-cta-title" className="m-0 max-w-[16ch] text-[clamp(2rem,3.6vw,4.2rem)] font-normal leading-[1.04] tracking-[-.065em]">There is a board for the way you like to work.</h2>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Pill href="/register">Join the club</Pill>
              <TextLink href="/tracks">Explore the tracks</TextLink>
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
