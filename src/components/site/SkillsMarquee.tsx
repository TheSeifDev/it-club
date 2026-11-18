"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { IT_CLUB_TRACKS } from "@/src/components/interview/Tracks/tracks-data";

export default function SkillsMarquee() {
  const capabilities = useMemo(
    () =>
      IT_CLUB_TRACKS.flatMap((track) =>
        track.terrain
          .slice(0, 3)
          .map((item) => ({ ...item, track: track.title, color: track.color })),
      ),
    [],
  );
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(media.matches);
      if (media.matches) setPlaying(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const toggle = () => setPlaying((value) => !value);

  return (
    <section className="site-skills" aria-labelledby="skills-title" data-reveal>
      <div className="site-container">
        <div className="site-skills__head">
          <div>
            <p className="site-eyebrow">CAPABILITIES / قدرات عملية</p>
            <h2 id="skills-title" className="site-display" data-line-heading>
              What the teams
              <br />
              <span>make possible.</span>
            </h2>
          </div>
          <div className="site-skills__controls">
            <p>Documented committee work, not personal claims.</p>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={playing && !reduced}
              disabled={reduced}
              aria-label={
                reduced
                  ? "Animation disabled because reduced motion is enabled"
                  : playing
                    ? "Pause capabilities marquee"
                    : "Play capabilities marquee"
              }
            >
              {playing && !reduced ? (
                <Pause size={15} aria-hidden="true" />
              ) : (
                <Play size={15} aria-hidden="true" />
              )}
              <span>
                {reduced ? "Reduced motion" : playing ? "Pause" : "Play"}
              </span>
            </button>
          </div>
        </div>
        <div
          className={`site-skills__viewport ${playing && !reduced ? "is-playing" : "is-paused"}`}
          data-skills-marquee
          onMouseEnter={() => setPlaying(false)}
          onMouseLeave={() => !reduced && setPlaying(true)}
          onFocusCapture={() => setPlaying(false)}
          onBlurCapture={(event) => {
            if (
              !event.currentTarget.contains(
                event.relatedTarget as Node | null,
              ) &&
              !reduced
            )
              setPlaying(true);
          }}
        >
          <ul className="site-skills__track">
            {[...capabilities, ...capabilities].map((item, index) => (
              <li
                className="site-skill-chip"
                key={`${item.track}-${item.title}-${index}`}
                style={{ "--skill-color": item.color } as React.CSSProperties}
                aria-hidden={index >= capabilities.length}
              >
                <span className="site-skill-chip__dot" aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.track}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
