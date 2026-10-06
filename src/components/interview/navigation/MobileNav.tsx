import Link from "next/link";
import { NAV_LINKS, isActiveLink } from "./NavLinks";

interface MobileNavToggleProps {
  isOpen: boolean;
  controlsId: string;
  onToggle: () => void;
}

export function MobileNavToggle({
  isOpen,
  controlsId,
  onToggle,
}: MobileNavToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={controlsId}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="inline-flex h-10 w-10 items-center justify-center text-white focus-visible:outline-2 focus-visible:outline-emerald-400 md:hidden"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={isOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
      </svg>
    </button>
  );
}

interface MobileNavProps {
  id: string;
  isOpen: boolean;
  pathname: string;
  onNavigate: () => void;
}

export default function MobileNav({
  id,
  isOpen,
  pathname,
  onNavigate,
}: MobileNavProps) {
  return (
    <nav
      id={id}
      aria-label="Mobile"
      hidden={!isOpen}
      className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto bg-zinc-950 px-5 md:hidden"
    >
      <ul>
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = isActiveLink(pathname, href);

          return (
            <li key={label} className="border-b border-white/10">
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`block py-4 text-base font-semibold transition-colors ${
                  isActive ? "text-emerald-400" : "text-white"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}