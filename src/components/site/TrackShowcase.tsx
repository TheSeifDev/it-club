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
import type { CSSProperties } from "react";
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

const visualVariants = [
  styles.visualSignal,
  styles.visualOrbit,
  styles.visualGrid,
  styles.visualType,
  styles.visualRings,
  styles.visualSplit,
];

function EditorialTrackVisual({
  track,
  index,
}: {
  track: ShowcaseTrack;
  index: number;
}) {
  const Icon = TRACK_ICONS[track.slug] ?? Code2;
  const visualCapabilities = track.capabilities.slice(0, 3);
  const number = String(index + 1).padStart(2, "0");
  const variant = visualVariants[index % visualVariants.length];

  return (
    <div
      className={`${styles.editorialVisual} ${variant}`}
      aria-hidden="true"
      style={
        {
          "--track-color": track.color,
          "--track-rgb": track.rgb,
          "--track-ink": track.ink,
        } as CSSProperties
      }
    >
      <span className={styles.visualIndex}>{number}</span>
      <span className={styles.visualHalo} />
      <span className={styles.visualBeam} />
      <div className={styles.visualTopline}>
        <span>{track.slug.toUpperCase()}</span>
        {track.category ? <span>{track.category}</span> : null}
      </div>
      <div className={styles.visualCore}>
        <span className={styles.iconFrame}>
          <Icon size={42} strokeWidth={1.25} />
        </span>
        <span className={styles.visualTitle}>{track.title}</span>
      </div>
      {visualCapabilities.length ? (
        <ul className={styles.visualList}>
          {visualCapabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TrackMedia({ track, index }: { track: ShowcaseTrack; index: number }) {
  const number = String(index + 1).padStart(2, "0");

  return (
    <Link
      className={styles.mediaLink}
      href={`/tracks#${track.slug}`}
      aria-label={`Explore ${track.title}`}
    >
      {track.image ? (
        <Image
          src={track.image}
          alt={`${track.title} track visual`}
          width={1500}
          height={940}
          unoptimized
          loading="lazy"
          className={styles.mediaImage}
          sizes="(min-width: 1024px) 44vw, 100vw"
        />
      ) : (
        <EditorialTrackVisual track={track} index={index} />
      )}
      <span className={styles.mediaIndex} aria-hidden="true">
        {number}
      </span>
      <span className={styles.mediaArrow} aria-hidden="true">
        <ArrowUpRight size={18} strokeWidth={1.8} />
      </span>
    </Link>
  );
}

function TrackSlab({ track, index }: { track: ShowcaseTrack; index: number }) {
  const number = String(index + 1).padStart(2, "0");
  const reverse = index % 2 === 1;
  const light = index === 1 || index === 4;

  return (
    <li className={styles.slabSlot}>
      <article
        className={`${styles.slab} ${reverse ? styles.slabReverse : ""} ${light ? styles.slabLight : ""}`}
        data-stack-panel
        data-spotlight
        data-stack-current={index === 0 ? "true" : "false"}
        style={
          {
            "--track-color": track.color,
            "--track-rgb": track.rgb,
            "--track-ink": track.ink,
          } as CSSProperties
        }
        aria-labelledby={`showcase-${track.slug}`}
      >
        <div className={styles.slabLayout}>
          <span className={styles.slabNumber} aria-hidden="true">
            {number}
          </span>
          <div className={styles.mediaColumn}>
            <TrackMedia track={track} index={index} />
          </div>
          <div className={styles.copyColumn}>
            <div className={styles.slabMeta}>
              {track.category ? (
                <span>{track.category}</span>
              ) : (
                <span>{track.slug}</span>
              )}
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
              {track.summary ? (
                <p className={styles.summary}>{track.summary}</p>
              ) : null}
            </div>
            <div className={styles.slabFooter}>
              {track.capabilities.length ? (
                <ul
                  className={styles.capabilities}
                  aria-label={`${track.title} capabilities`}
                >
                  {track.capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              ) : null}
              <Link
                className={styles.slabLink}
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
    </li>
  );
}

/** Full-width editorial track slabs with a desktop-only pinned rise sequence. */
export function TrackShowcase({ tracks }: { tracks: ShowcaseTrack[] }) {
  const total = String(tracks.length).padStart(2, "0");

  return (
    <section
      className={styles.showcase}
      data-track-stack
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
          <div className={styles.stackPin} data-stack-pin>
            <div className={styles.stackViewport}>
              <ol className={styles.stackList} aria-label="Published tracks">
                {tracks.map((track, index) => (
                  <TrackSlab track={track} index={index} key={track.slug} />
                ))}
              </ol>
            </div>
            <div className={styles.progressRow}>
              <p className={styles.counter}>
                <span data-stack-counter>01</span> / {total}
              </p>
              <span
                className={styles.progressTrack}
                role="progressbar"
                aria-label="Track showcase progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={0}
              >
                <span data-stack-progress className={styles.progressFill} />
              </span>
              <p className={styles.scrollHint}>Scroll to explore</p>
            </div>
          </div>
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
