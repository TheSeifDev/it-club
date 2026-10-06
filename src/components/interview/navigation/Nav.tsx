import Link from "next/link";
import { NAV_LINKS, isActiveLink } from "./NavLinks";

interface NavProps {
  pathname: string;
  className?: string;
}

export default function Nav({ pathname, className }: NavProps) {
  return (
    <nav aria-label="Primary" className={className}>
      <ul className="flex items-center gap-8">
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = isActiveLink(pathname, href);

          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-400 ${
                  isActive
                    ? "text-emerald-400"
                    : "text-zinc-400 hover:text-white"
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