"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

type MemberItem = {
  slug: string;
  name: string;
  role: string;
  committee: string;
  summary: string;
  image?: string;
};

export default function CommunityDirectory({ members, committees }: { members: MemberItem[]; committees: string[] }) {
  const [query, setQuery] = useState("");
  const [activeCommittee, setActiveCommittee] = useState("All teams");
  const visible = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return members.filter((member) => {
      const committeeMatch = activeCommittee === "All teams" || member.committee === activeCommittee;
      const text = `${member.name} ${member.role} ${member.committee} ${member.summary}`.toLocaleLowerCase();
      return committeeMatch && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [activeCommittee, members, query]);

  return (
    <section className="site-directory site-container" aria-label="Published team members">
      <div className="site-directory__tools">
        <div className="site-directory__filter-list" role="group" aria-label="Filter members by team">
          {["All teams", ...committees].map((committee) => (
            <button
              className={activeCommittee === committee ? "is-active" : ""}
              key={committee}
              type="button"
              aria-pressed={activeCommittee === committee}
              onClick={() => setActiveCommittee(committee)}
            >
              {committee}
            </button>
          ))}
        </div>
        <label className="site-search">
          <span>Search people</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, role or team" />
        </label>
      </div>
      <p className="site-directory__count" aria-live="polite" aria-atomic="true">
        {visible.length} {visible.length === 1 ? "published profile" : "published profiles"}
      </p>
      {visible.length ? (
        <div className="site-directory__list">
          {visible.map((member, index) => (
            <article className="site-member-row" key={member.slug} data-reveal>
              <span className="site-member-row__number">{String(index + 1).padStart(2, "0")}</span>
              {member.image ? <Link className="site-member-row__portrait" href={`/community/${member.slug}`} aria-label={`View ${member.name}'s profile`}><Image src={member.image} alt={member.name} width={62} height={78} unoptimized /></Link> : null}
              <div className="site-member-row__info">
                <p className="site-eyebrow">{member.committee} / TEAM REMIT</p>
                <h2><Link href={`/community/${member.slug}`}>{member.name}<span aria-hidden="true">↗</span></Link></h2>
                <p className="site-member-row__role">{member.role}</p>
                <p className="site-member-row__summary">{member.summary}</p>
              </div>
              <Link className="site-member-row__link" href={`/community/${member.slug}`} aria-label={`View ${member.name}'s profile`}>VIEW PROFILE <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="site-empty-state site-empty-state--compact" role="status">
          <span className="site-empty-state__index" aria-hidden="true">—</span>
          <div><p className="site-eyebrow">NO MATCHES</p><h2>Nothing fits that search.</h2><p>Try a different name or team, or clear the search to see every published profile.</p></div>
        </div>
      )}
    </section>
  );
}
