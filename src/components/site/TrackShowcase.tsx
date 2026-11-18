import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Code2,
  FlaskConical,
  Megaphone,
  Share2,
  Users,
} from "lucide-react";
import styles from "./TrackShowcase.module.css";

export type ShowcaseTrack = {
  id: string;
  slug: string;
  title: string;
  arabicTitle?: string;
  category?: string;
  summary?: string;
  image?: string;
  capabilities: string[];
  color: string;
  rgb: string;
  ink: string;
};

type IconType = typeof Users;

const TRACK_ICONS: Record<string, IconType> = {
  hr: Users,
  pr: Megaphone,
  sm: Share2,
  oc: CalendarDays,
  it: Code2,
  rnd: FlaskConical,
};

function EditorialTrackVisual({ track }: { track: ShowcaseTrack }) {
  const Icon = TRACK_ICONS[track.slug] ?? TRACK_ICONS[track.id] ?? Code2;
  const visualCapabilities = track.capabilities.slice(0, 3);

  return (
    <div
      className={styles.editorialVisual}
      aria-label={`${track.title} capabilities`}
    >
      <div className={styles.visualGrid} aria-hidden="true" />
      <div className={styles.visualHeader}>
        <span>IT CLUB / {track.slug.toUpperCase()}</span>
        <span>FIELD NOTES</span>
      </div>
      <div className={styles.visualCenter}>
        <span className={styles.iconFrame}>
          <Icon size={42} strokeWidth={1.25} aria-hidden="true" />
        </span>
        <span className={styles.visualTitle}>{track.title}</span>
      </div>
      <div className={styles.visualList}>
        {visualCapabilities.map((capability, index) => (
          <span key={capability}>
            <b>0{index + 1}</b>
            {capability}
          </span>
        ))}
      </div>
      <span className={styles.visualAccent} aria-hidden="true" />
    </div>
  );
}

function TrackMedia({ track }: { track: ShowcaseTrack }) {
  if (track.image) {
    return (
      <Image
        src={track.image}
        alt={`${track.title} track visual`}
        width={1500}
        height={940}
        unoptimized
        loading="lazy"
        className={styles.mediaImage}
        sizes="(min-width: 1100px) 56vw, 100vw"
      />
    );
  }

  return <EditorialTrackVisual track={track} />;
}

function TrackCard({ track, index }: { track: ShowcaseTrack; index: number }) {
  const number = String(index + 1).padStart(2, "0");
  const reverse = index % 2 === 1;
  const summary =
    track.summary ??
    `${track.title} is a place to learn the tools, habits, and ways of working that make good ideas useful.`;

  return (
    <article
      className={`${styles.card} ${reverse ? styles.cardReverse : ""}`}
      data-showcase-card
      data-spotlight
      data-current={index === 0 ? "true" : "false"}
      style={
        {
          "--track-color": track.color,
          "--track-rgb": track.rgb,
          "--track-ink": track.ink,
        } as React.CSSProperties
      }
      aria-labelledby={`showcase-${track.slug}`}
    >
      <span className={styles.spotlightBorder} aria-hidden="true" />
      <div className={styles.cardSurface}>
        <div className={styles.mediaColumn}>
          <Link
            className={styles.mediaLink}
            href={`/tracks#${track.slug}`}
            aria-label={`Explore ${track.title}`}
          >
            <TrackMedia track={track} />
            <span className={styles.mediaShade} aria-hidden="true" />
            <span className={styles.mediaArrow}>
              <ArrowUpRight size={17} strokeWidth={1.8} aria-hidden="true" />
            </span>
          </Link>
        </div>

        <div className={styles.copyColumn}>
          <div className={styles.cardMeta}>
            <p>
              <span className={styles.index}>{number}</span>
              <span className={styles.metaRule} aria-hidden="true" />
              <span>{track.category ?? "Club track"}</span>
            </p>
            {track.arabicTitle ? (
              <span className={styles.arabicTitle} dir="rtl" lang="ar">
                {track.arabicTitle}
              </span>
            ) : null}
          </div>

          <div className={styles.copyMain}>
            <h3 id={`showcase-${track.slug}`}>
              <Link href={`/tracks#${track.slug}`}>{track.title}</Link>
            </h3>
            <p className={styles.summary}>{summary}</p>
          </div>

          <div className={styles.cardFooter}>
            <ul
              className={styles.capabilities}
              aria-label={`${track.title} capabilities`}
            >
              {track.capabilities.map((capability) => (
                <li key={capability}>{capability}</li>
              ))}
            </ul>
            <Link
              className={styles.cardLink}
              href={`/tracks#${track.slug}`}
              aria-label={`Explore ${track.title}`}
            >
              <span>Explore track</span>
              <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/** A parent-animated portfolio sequence for the club's six original tracks. */
export function TrackShowcase({ tracks }: { tracks: ShowcaseTrack[] }) {
  const total = String(tracks.length).padStart(2, "0");

  return (
    <section
      className={styles.showcase}
      data-showcase
      aria-labelledby="tracks-title"
      id="tracks"
    >
      <div className={styles.panel}>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.kicker}>
              <span>03</span>
              <i aria-hidden="true" />
              Our tracks
            </p>
            <h2 id="tracks-title">
              The work has
              <br />
              <em>many shapes.</em>
            </h2>
          </div>
          <p className={styles.headingNote}>
            Different ways to contribute, learn, and make the club more capable.
            Pick a starting point; the practice is shared.
          </p>
        </div>

        {tracks.length ? (
          <>
            <div className={styles.viewport} data-showcase-viewport>
              <ol className={styles.track} data-showcase-track>
                {tracks.map((track, index) => (
                  <li className={styles.cardSlot} key={track.slug}>
                    <TrackCard track={track} index={index} />
                  </li>
                ))}
              </ol>
            </div>

            <div className={styles.progressRow}>
              <p className={styles.counter}>
                <span data-showcase-current>01</span> / {total}
              </p>
              <span
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Track showcase progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={0}
              >
                <span data-showcase-progress className={styles.progressFill} />
              </span>
              <p className={styles.scrollHint}>Scroll to explore</p>
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <h3>The track index is being prepared.</h3>
            <p>
              No tracks are published yet. Meet the community to explore
              approved people and responsibilities.
            </p>
            <Link href="/community">
              Meet the teams <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
