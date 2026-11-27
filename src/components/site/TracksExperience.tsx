import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Code2,
  FlaskConical,
  Layers,
  Megaphone,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";
import { EmptyState } from "@/src/components/site/SiteUI";
import TracksExperienceMotion from "@/src/components/site/TracksExperienceMotion";
import styles from "./TracksExperienceClasses";

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

function TrackVisual({ track }: { track: ExhibitionTrack }) {
  const Icon = ICONS[track.iconName] ?? Code2;

  return (
    <div className={styles.visual} data-track-visual>
      <span className={styles.visualLabel}>{track.number} / track</span>
      <div className={styles.visualGlyph} data-visual-glyph aria-hidden="true">
        <Icon className={styles.visualGlyphSvg} size={112} strokeWidth={1.15} />
      </div>
      <span className={styles.visualTitle}>{track.title}</span>
    </div>
  );
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
      data-stack-panel
      data-tracks-exhibition-scene
      style={
        {
          "--track-color": track.color,
          "--track-rgb": track.rgb,
          "--track-ink": track.ink,
        } as CSSProperties
      }
      aria-labelledby={`track-title-${track.slug}`}
    >
      <div
        className={`${styles.sceneMedia}${index % 2 ? ` ${styles.sceneMediaReverse}` : ""}`}
        data-tracks-exhibition-visual
      >
        <TrackVisual track={track} />
      </div>
      <div
        className={`${styles.sceneCopy}${index % 2 ? ` ${styles.sceneCopyReverse}` : ""}`}
        data-stack-scroll
        role="region"
        aria-label={`${track.title} track details`}
      >
        <div className={styles.sceneMeta} data-tracks-exhibition-meta>
          <span className={styles.sceneNumber}>{track.number}</span>
          <span className={styles.sceneTag} data-track-scene-tag>
            {track.tag}
          </span>
          <span className={styles.sceneAccent} aria-hidden="true" />
        </div>
        <div className={styles.sceneHeading} data-tracks-exhibition-title>
          {track.arabicTitle ? (
            <p className={styles.arabicTitle} lang="ar" dir="rtl">
              {track.arabicTitle}
            </p>
          ) : null}
          <h2 className={styles.sceneTitle} id={`track-title-${track.slug}`}>
            {track.title}
          </h2>
        </div>
        <p className={styles.sceneSummary} data-tracks-exhibition-copy>
          {track.summary}
        </p>
        {detail ? <p className={styles.sceneDetail}>{detail}</p> : null}
        <div className={styles.terrainBlock} data-track-terrain>
          <p className={styles.terrainLabel}>What this team works on</p>
          <ul className={styles.terrainList}>
            {terrain.map((item) => (
              <li key={item.title}>
                <span
                  className={styles.terrainMarker}
                  data-terrain-marker
                  aria-hidden="true"
                />
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
  const FeaturedIcon = tracks[0] ? ICONS[tracks[0].iconName] : Layers;

  return (
    <TracksExperienceMotion>
      <div className={styles.exhibition} data-tracks-exhibition-root>
        <header className={styles.hero} data-tracks-exhibition-hero>
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.heroKicker}>
                <span className={styles.labelNumber}>03</span>
                <span className={styles.labelText}>Tracks / where ideas get a team</span>
              </p>
              <h1 className={styles.heroTitle} data-tracks-exhibition-title>
                <span className={styles.heroTitleLine}>Different ways</span>
                <span
                  className={`${styles.heroTitleLine} ${styles.heroTitleAccent}`}
                >
                  to build.
                </span>
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
                  {tracks.length ? "Explore the tracks" : "View the track index"}
                </span>
                <span className={styles.promptArrow} aria-hidden="true">
                  <ArrowDown size={15} />
                </span>
              </a>
            </div>
            <div className={styles.heroAside} data-tracks-exhibition-visual>
              <span className={styles.heroAsideLabel}>IT Club / shared practice</span>
              <div className={styles.heroIcon} aria-hidden="true">
                <FeaturedIcon
                  className={styles.heroIconGlyph}
                  size={108}
                  strokeWidth={1.1}
                />
              </div>
              <span className={styles.heroAsideNumber}>
                {String(trackCount).padStart(2, "0")}
              </span>
              <div className={styles.heroTrackList} aria-label="Published tracks">
                {tracks.map((track) => (
                  <a
                    href={`#${track.slug}`}
                    key={track.id}
                    style={{ "--orbit-color": track.color } as CSSProperties}
                  >
                    <b>{track.number}</b> {track.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.heroFoot}>
            <span>Tracks / BATU</span>
            <span>Scroll to explore <b aria-hidden="true">↓</b></span>
          </div>
        </header>

        <section
          className={styles.index}
          id="tracks-index"
          aria-labelledby="tracks-index-title"
        >
          <div className={styles.indexIntro}>
            <p className={styles.sectionLabel} data-track-section-label>
              <span className={styles.labelNumber}>04</span>
              <span className={styles.labelText}>The track index</span>
            </p>
            <h2 className={styles.indexHeading} id="tracks-index-title">
              Choose a starting point.
            </h2>
            <p className={styles.indexDescription}>
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
              <ol className={styles.indexItems}>
                {tracks.map((track) => (
                  <li className={styles.indexItem} key={track.id}>
                    <a className={styles.indexLink} href={`#${track.slug}`}>
                      <span className={styles.jumpNumber}>{track.number}</span>
                      <span
                        className={styles.jumpSwatch}
                        style={{ background: track.color }}
                        aria-hidden="true"
                      />
                      <span className={styles.indexItemTitle}>{track.title}</span>
                      <ArrowUpRight
                        className={styles.indexIcon}
                        size={16}
                        aria-hidden="true"
                      />
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
            data-exhibition-stack
            aria-label="Published track scenes"
          >
            <div className={styles.stackPin} data-stack-pin>
              <div className={styles.stackViewport} data-stack-viewport>
                {tracks.map((track, index) => (
                  <TrackScene track={track} index={index} key={track.id} />
                ))}
              </div>
              <div className={styles.stackProgress} data-stack-progress-ui>
                <div className={styles.stackCount} data-stack-count-ui>
                  <span data-stack-counter aria-live="polite" aria-atomic="true">
                    01
                  </span>
                  <span aria-hidden="true">/</span>
                  <span>{String(trackCount).padStart(2, "0")}</span>
                </div>
                <div
                  className={styles.stackProgressMeter}
                  data-stack-meter
                  role="progressbar"
                  aria-label="Track exhibition progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                >
                  <span data-stack-progress />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section
          className={styles.closing}
          data-tracks-exhibition-closing
          aria-labelledby="tracks-closing-title"
        >
          <div className={styles.closingMark} aria-hidden="true">
            <Users size={64} strokeWidth={1.1} />
          </div>
          <div className={styles.closingContent} data-tracks-exhibition-closing-copy>
            <p
              className={styles.sectionLabel}
              data-tracks-exhibition-closing-label
            >
              <span className={styles.labelNumber}>05</span>
              <span className={styles.labelText}>Where contributions meet</span>
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
