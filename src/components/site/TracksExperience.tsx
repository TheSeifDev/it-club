import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Code2,
  FlaskConical,
  Megaphone,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { EmptyState } from "@/src/components/site/SiteUI";
import TracksExperienceMotion from "@/src/components/site/TracksExperienceMotion";
import styles from "./TracksExperience.module.css";

export type ExhibitionMember = {
  slug: string;
  name: string;
  role?: string;
};

export type ExhibitionBoard = {
  title: string;
  href: string;
};

export type ExhibitionTrack = {
  id: string;
  slug: string;
  number: string;
  title: string;
  arabicTitle: string;
  tag: string;
  summary: string;
  body?: string;
  color: string;
  rgb: string;
  ink: string;
  image?: string;
  terrain: Array<{ title: string; desc?: string }>;
  board?: ExhibitionBoard;
  members: ExhibitionMember[];
  iconName: "users" | "megaphone" | "share2" | "calendar" | "code2" | "flask";
};

type TrackIcon = LucideIcon;

const ICONS: Record<ExhibitionTrack["iconName"], TrackIcon> = {
  users: Users,
  megaphone: Megaphone,
  share2: Share2,
  calendar: CalendarDays,
  code2: Code2,
  flask: FlaskConical,
};

const VISUAL_LABELS: Record<string, { kicker: string; phrase: string }> = {
  hr: { kicker: "people / culture", phrase: "listen · align · grow" },
  pr: { kicker: "relations / outreach", phrase: "connect · represent · open" },
  sm: { kicker: "media / storytelling", phrase: "frame · shape · share" },
  oc: { kicker: "operations / stage", phrase: "plan · move · deliver" },
  it: { kicker: "engineering / code", phrase: "build · test · maintain" },
  rnd: { kicker: "research / discovery", phrase: "question · test · learn" },
};

const VISUAL_CLASSES: Record<string, string> = {
  hr: styles.visualHr,
  pr: styles.visualPr,
  sm: styles.visualSm,
  oc: styles.visualOc,
  it: styles.visualIt,
  rnd: styles.visualRnd,
};

function TrackVisual({
  track,
  index,
}: {
  track: ExhibitionTrack;
  index: number;
}) {
  const Icon = ICONS[track.iconName] ?? Code2;
  const label = VISUAL_LABELS[track.slug] ?? {
    kicker: "published track",
    phrase: "learn · contribute · connect",
  };
  const visualClass = VISUAL_CLASSES[track.slug] ?? styles.visualGeneric;

  return (
    <div
      className={`${styles.visual} ${visualClass}`}
      aria-label={`${track.title} abstract capability visual`}
    >
      <div className={styles.visualTop}>
        <span>{track.number} / field note</span>
        <span>{label.kicker}</span>
      </div>
      <div className={styles.visualStage}>
        <div className={styles.visualGlyph} aria-hidden="true">
          <span className={styles.glyphHalo} />
          <Icon size={54} strokeWidth={1.25} />
        </div>
        <p className={styles.visualPhrase}>{label.phrase}</p>
        <span className={styles.visualWord}>
          {track.slug === "rnd" ? "R&D" : track.slug.toUpperCase()}
        </span>
      </div>
      <div className={styles.visualBottom}>
        <span>Track {String(index + 1).padStart(2, "0")}</span>
        <span>{track.title}</span>
      </div>
      <span className={styles.visualAccent} aria-hidden="true" />
    </div>
  );
}

function TrackMedia({
  track,
  index,
}: {
  track: ExhibitionTrack;
  index: number;
}) {
  if (track.image) {
    return (
      <Image
        src={track.image}
        alt={`${track.title} track visual`}
        width={1400}
        height={920}
        unoptimized
        priority={index === 0}
        loading={index === 0 ? undefined : "lazy"}
        sizes="(min-width: 1050px) 50vw, 100vw"
        className={styles.mediaImage}
      />
    );
  }

  return <TrackVisual track={track} index={index} />;
}

function TrackScene({
  track,
  index,
}: {
  track: ExhibitionTrack;
  index: number;
}) {
  const terrain = track.terrain.length
    ? track.terrain
    : [{ title: "Published scope is being prepared." }];
  const detail =
    track.body && track.body !== track.summary ? track.body : undefined;

  return (
    <article
      id={track.slug}
      className={`${styles.scene} ${index % 2 ? styles.sceneReverse : ""}`}
      data-tracks-exhibition-scene
      data-is-hovering="false"
      style={
        {
          "--track-color": track.color,
          "--track-rgb": track.rgb,
          "--track-ink": track.ink,
        } as CSSProperties
      }
      aria-labelledby={`track-title-${track.slug}`}
    >
      <div className={styles.sceneMedia} data-tracks-exhibition-visual>
        <TrackMedia track={track} index={index} />
      </div>
      <div className={styles.sceneCopy}>
        <div className={styles.sceneMeta}>
          <span className={styles.sceneNumber}>{track.number}</span>
          <span>{track.tag}</span>
          <span className={styles.sceneAccent} aria-hidden="true" />
        </div>
        <div className={styles.sceneHeading} data-tracks-exhibition-title>
          {track.arabicTitle ? (
            <p className={styles.arabicTitle} lang="ar" dir="rtl">
              {track.arabicTitle}
            </p>
          ) : null}
          <h2 id={`track-title-${track.slug}`}>{track.title}</h2>
        </div>
        <p className={styles.sceneSummary} data-tracks-exhibition-copy>
          {track.summary}
        </p>
        {detail ? <p className={styles.sceneDetail}>{detail}</p> : null}
        <div className={styles.terrainBlock}>
          <p className={styles.terrainLabel}>What this team works on</p>
          <ul>
            {terrain.map((item) => (
              <li key={item.title}>
                <span className={styles.terrainMarker} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  {item.desc ? <small>{item.desc}</small> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.sceneLinks} data-tracks-exhibition-links>
          {track.board ? (
            <Link href={track.board.href} className={styles.sceneLink}>
              <span>The board · {track.board.title}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
          {track.members.length ? (
            <div className={styles.memberLinks}>
              <span className={styles.memberLabel}>Meet the team</span>
              <div>
                {track.members.map((member) => (
                  <Link href={`/community/${member.slug}`} key={member.slug}>
                    {member.name}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {!track.board && !track.members.length ? (
            <Link href="/community" className={styles.sceneLink}>
              <span>Meet the community</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function TracksExperience({
  tracks,
}: {
  tracks: ExhibitionTrack[];
}) {
  const trackCount = tracks.length;
  const trackCountLabel = `${trackCount} ${trackCount === 1 ? "track" : "tracks"}`;

  return (
    <TracksExperienceMotion>
      <div className={styles.exhibition} data-tracks-exhibition-root>
        <header className={styles.hero} data-tracks-exhibition-hero>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.heroKicker}>
                <span>03</span>
                <i aria-hidden="true" />
                Tracks / where ideas get a team
              </p>
              <h1 className={styles.heroTitle} data-tracks-exhibition-title>
                <span>Different</span>
                <span>ways to</span>
                <em>build.</em>
              </h1>
              <p className={styles.heroLead} data-tracks-exhibition-copy>
                {trackCountLabel}. One shared practice. Find the kind of
                contribution that makes you curious, then meet the people and
                boards carrying it forward.
              </p>
              <p className={styles.heroArabic} lang="ar" dir="rtl">
                لكل مسار طريقته، لكننا نتحرك كفريق واحد.
              </p>
              <a
                className={styles.heroPrompt}
                href={tracks.length ? `#${tracks[0].slug}` : "#tracks-index"}
              >
                <span>
                  {tracks.length ? "Enter the tracks" : "View the track index"}
                </span>
                <ArrowDown size={15} aria-hidden="true" />
              </a>
            </div>
            <div className={styles.heroAside} data-tracks-exhibition-visual>
              <span className={styles.heroAsideLabel}>
                IT Club / shared practice
              </span>
              <div className={styles.heroLogo}>
                <Image src="/logo.webp" alt="" fill priority sizes="420px" />
              </div>
              <span className={styles.heroAsideNumber}>
                {String(trackCount).padStart(2, "0")}
              </span>
              <div className={styles.heroTrackList} aria-hidden="true">
                {tracks.map((track) => (
                  <span
                    key={track.id}
                    style={{ "--orbit-color": track.color } as CSSProperties}
                  >
                    <b>{track.number}</b> {track.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.heroFoot}>
            <span>Tracks / BATU</span>
            <span>
              Scroll to explore <b>↓</b>
            </span>
          </div>
        </header>

        <section
          className={styles.index}
          id="tracks-index"
          aria-labelledby="tracks-index-title"
        >
          <div className={styles.indexIntro}>
            <p className={styles.sectionLabel}>The direct index</p>
            <h2 id="tracks-index-title">Choose a starting point.</h2>
            <p>
              Jump directly into a track. Every scene keeps its published remit,
              terrain, and available community links in view.
            </p>
          </div>
          {tracks.length ? (
            <nav
              aria-label="Jump to a published track"
              className={styles.indexList}
              data-tracks-exhibition-index
            >
              <ol>
                {tracks.map((track) => (
                  <li key={track.id}>
                    <a href={`#${track.slug}`}>
                      <span className={styles.jumpNumber}>{track.number}</span>
                      <span
                        className={styles.jumpSwatch}
                        style={{ background: track.color }}
                        aria-hidden="true"
                      />
                      <span>{track.title}</span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : (
            <EmptyState
              title="The track index is in progress."
              text="No track descriptions have been published yet. We will add details here when the current structure is ready to share."
              href="/community"
              linkLabel="See published community profiles"
            />
          )}
        </section>

        {tracks.length ? (
          <section
            className={styles.scenes}
            aria-label="Published track scenes"
          >
            {tracks.map((track, index) => (
              <TrackScene track={track} index={index} key={track.id} />
            ))}
          </section>
        ) : null}

        <section
          className={styles.closing}
          data-tracks-exhibition-closing
          aria-labelledby="tracks-closing-title"
        >
          <div className={styles.closingMark} aria-hidden="true">
            +
          </div>
          <div data-tracks-exhibition-closing-copy>
            <p
              className={styles.sectionLabel}
              data-tracks-exhibition-closing-label
            >
              Where contributions meet
            </p>
            <h2 id="tracks-closing-title">
              The work gets stronger <em>in contact.</em>
            </h2>
            <p>
              Tracks are ways into the club, not walls around it. Explore the
              published community directory to see the people and boards behind
              the shared practice.
            </p>
            <Link
              href="/community"
              className={styles.closingCta}
              data-tracks-exhibition-closing-cta
            >
              Meet the community <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <span
            className={styles.closingArabic}
            data-tracks-exhibition-closing-arabic
            lang="ar"
            dir="rtl"
          >
            تلتقي المساهمات المختلفة لتصنع مجتمعًا واحدًا.
          </span>
        </section>
      </div>
    </TracksExperienceMotion>
  );
}
