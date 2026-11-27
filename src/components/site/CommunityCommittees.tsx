import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Code2,
  Megaphone,
  Share2,
  UsersRound,
  Network,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { ContentEntry } from "@/lib/site-content/types";
import { getTrackTheme } from "@/lib/ui/track-theme";

const icons = {
  HR: UsersRound,
  PR: Megaphone,
  SM: Share2,
  OC: CalendarDays,
  IT: Code2,
};

export default function CommunityCommittees({
  boards,
}: {
  boards: ContentEntry[];
}) {
  return (
    <div
      className="mt-[clamp(36px,5vw,72px)] flex flex-col gap-4 sm:gap-5"
      data-community-committees
    >
      {boards.map((board, index) => {
        const theme = getTrackTheme(
          board.slug || board.data.committee || board.data.title,
        );
        const Icon = icons[theme.short as keyof typeof icons] || Network;
        const trackHref =
          theme.short in icons
            ? `/tracks#${theme.short.toLowerCase()}`
            : "/tracks";
        const summary = (board.data.summary || board.data.body || "").replace(
          /^Committee mission:\s*/i,
          "",
        );
        const responsibilities =
          board.data.responsibilities
            ?.filter((item) => item.trim())
            .slice(0, 3) || [];
        return (
          <article
            key={board.id}
            data-community-committee
            data-reveal
            className="group/committee relative min-w-0 overflow-hidden rounded-2xl bg-white/[0.035] p-6 sm:p-8 lg:grid lg:grid-cols-[0.48fr_1.2fr_0.8fr] lg:items-center lg:gap-10 lg:p-11"
            style={
              {
                "--committee-color": theme.color,
                "--committee-rgb": theme.rgb,
              } as CSSProperties
            }
          >
            <div className="flex items-center justify-between gap-6 lg:block">
              <span className="text-[10px] tabular-nums tracking-[0.15em] text-[var(--site-copy)]">
                COMMITTEE / {String(index + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                className="block text-[clamp(2.6rem,5vw,6rem)] leading-none font-medium tracking-[-0.08em] text-[var(--committee-color)] lg:mt-8"
              >
                {theme.short === "CLUB" ? (
                  <Network size={54} strokeWidth={1} />
                ) : (
                  theme.short
                )}
              </span>
            </div>
            <div className="mt-7 min-w-0 lg:mt-0">
              <p className="m-0 flex flex-wrap items-center gap-2 text-xs text-[var(--committee-color)]">
                <span
                  className="size-1.5 rounded-full bg-[var(--committee-color)]"
                  aria-hidden="true"
                />
                {board.data.category || "Committee"}
                {board.data.arabicTitle || theme.arabic ? (
                  <span
                    lang="ar"
                    dir="rtl"
                    className="ml-1 font-[family-name:var(--font-alexandria)]"
                  >
                    {board.data.arabicTitle || theme.arabic}
                  </span>
                ) : null}
              </p>
              <h3 className="mt-4 mb-0 max-w-[20ch] text-[clamp(1.7rem,3.1vw,3.1rem)] leading-[1.08] font-medium tracking-[-0.055em] [overflow-wrap:anywhere]">
                {board.data.title}
              </h3>
              {summary ? (
                <p className="mt-5 mb-0 max-w-[54ch] text-[0.88rem] leading-[1.8] text-[var(--site-copy)]">
                  {summary}
                </p>
              ) : null}
              {responsibilities.length ? (
                <ul className="mt-5 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-[11px] leading-[1.5] text-[var(--site-copy)]">
                  {responsibilities.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="inline-flex items-start gap-2"
                    >
                      <span
                        className="mt-[6px] size-1 shrink-0 rounded-full bg-[var(--committee-color)]"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link
                href={trackHref}
                className="mt-6 inline-flex min-h-11 items-center gap-4 rounded-sm text-xs font-medium text-[var(--site-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--committee-color)]"
              >
                Explore this team
                <ArrowUpRight
                  size={16}
                  className="text-[var(--committee-color)] transition-transform duration-300 group-hover/committee:translate-x-1 group-hover/committee:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </div>
            <div
              aria-hidden="true"
              className="relative mt-7 grid min-h-[200px] place-items-center overflow-hidden rounded-xl bg-[#101519] [perspective:800px] sm:min-h-[250px] lg:mt-0 lg:aspect-square lg:min-h-0"
            >
              <span className="absolute size-[78%] rounded-full bg-[radial-gradient(circle,rgba(var(--committee-rgb),0.13),transparent_67%)]" />
              <span className="absolute size-[58%] rounded-full border border-[rgba(var(--committee-rgb),0.12)] [transform:rotateX(58deg)_rotateZ(-24deg)]" />
              <span className="absolute size-[76%] rounded-full border border-[rgba(var(--committee-rgb),0.08)] [transform:rotateX(58deg)_rotateZ(24deg)]" />
              <Icon
                size={94}
                strokeWidth={0.8}
                className="relative size-[clamp(70px,7vw,108px)] text-[var(--committee-color)] drop-shadow-[0_8px_18px_rgba(var(--committee-rgb),0.18)] transition-transform duration-700 ease-out group-hover/committee:[transform:rotateY(-14deg)_rotateX(8deg)_translateY(-6px)] group-focus-within/committee:[transform:rotateY(-14deg)_rotateX(8deg)_translateY(-6px)] motion-reduce:transform-none motion-reduce:transition-none"
              />
              <span className="absolute bottom-5 left-5 text-[9px] tracking-[0.2em] text-[var(--site-copy)]">
                IT CLUB / {theme.short}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
