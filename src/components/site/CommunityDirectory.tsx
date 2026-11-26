"use client";

import { useMemo, useRef, useState } from "react";
import { animateFilterLayout } from "@/src/components/site/motion/filter-motion";
import { getTrackTheme } from "@/lib/ui/track-theme";
import CommunityPersonCard, {
  type CommunityPerson,
} from "@/src/components/site/CommunityPersonCard";
import styles from "@/src/components/site/Community.module.css";

type MemberItem = CommunityPerson;

type ThemeVars = React.CSSProperties & {
  "--track-color"?: string;
  "--track-rgb"?: string;
  "--track-ink"?: string;
};

export default function CommunityDirectory({
  members,
  committees,
}: {
  members: MemberItem[];
  committees: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeCommittee, setActiveCommittee] = useState("All teams");
  const listRef = useRef<HTMLDivElement>(null);
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return members.filter((member) => {
      const committeeMatch =
        activeCommittee === "All teams" || member.committee === activeCommittee;
      const text =
        `${member.name} ${member.role} ${member.committee} ${member.summary}`.toLocaleLowerCase();
      return (
        committeeMatch && (!normalizedQuery || text.includes(normalizedQuery))
      );
    });
  }, [activeCommittee, members, query]);

  const updateResults = (update: () => void) => {
    if (listRef.current) {
      animateFilterLayout(listRef.current, update);
    } else {
      update();
    }
  };

  const filterOptions = ["All teams", ...committees];

  return (
    <section
      className={`${styles.directory} ${styles.container}`}
      aria-label="Published team members"
    >
      <div className={styles.directoryTools}>
        <div
          className={styles.filterList}
          role="group"
          aria-label="Filter members by team"
        >
          {filterOptions.map((committee) => {
            const theme = getTrackTheme(committee);
            const style: ThemeVars = {
              "--track-color": theme.color,
              "--track-rgb": theme.rgb,
              "--track-ink": theme.ink,
            };
            const isActive = activeCommittee === committee;
            return (
              <button
                key={committee}
                type="button"
                style={style}
                className={isActive ? styles.activeFilter : undefined}
                aria-pressed={isActive}
                onClick={() =>
                  updateResults(() => setActiveCommittee(committee))
                }
              >
                <span>{committee}</span>
                {theme.arabic ? (
                  <small lang="ar" dir="rtl">
                    {theme.arabic}
                  </small>
                ) : null}
              </button>
            );
          })}
        </div>
        <label className={styles.search}>
          <span>Search people</span>
          <input
            type="search"
            value={query}
            onChange={(event) =>
              updateResults(() => setQuery(event.target.value))
            }
            placeholder="Name, role or team"
          />
        </label>
      </div>
      <p className={styles.count} aria-live="polite" aria-atomic="true">
        {visible.length} {visible.length === 1 ? "person" : "people"}
      </p>
      {visible.length ? (
        <div className={styles.directoryGrid} ref={listRef}>
          {visible.map((member) => (
            <CommunityPersonCard key={member.slug} person={member} />
          ))}
        </div>
      ) : (
        <div className={styles.noMatches} role="status">
          <span aria-hidden="true">—</span>
          <div>
            <p className={styles.eyebrow}>NO MATCHES</p>
            <h2>Nothing fits that search.</h2>
            <p>
              Try a different name or team, or clear the search to see every
              published profile.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
