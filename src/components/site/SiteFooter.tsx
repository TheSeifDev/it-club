import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import { ABOUT_HREF } from "@/lib/ui/site-navigation";

const siteLinks = [
  { href: ABOUT_HREF, label: "About" },
  { href: "/community", label: "Community" },
  { href: "/tracks", label: "Tracks" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Partners" },
  { href: "/alumni", label: "Alumni" },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__top site-container">
        <div className="site-footer__identity">
          <Link
            className="site-footer__brand"
            href="/"
            aria-label="IT Club home"
          >
            <Image src="/logo.webp" alt="" width={42} height={42} />
            <span>
              <b>IT CLUB</b>
              <small>BORG AL ARAB TECHNOLOGICAL UNIVERSITY</small>
            </span>
          </Link>
          <p className="site-footer__statement">
            Good work is never built alone.
            <br />
            <span lang="ar" dir="rtl">
              كل فكرة قوية تبدأ بفريق.
            </span>
          </p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer navigation">
          <p className="site-eyebrow">Explore / استكشف</p>
          <ul>
            {siteLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  {link.label}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-footer__contact">
          <p className="site-eyebrow">Start a conversation</p>
          <Link className="site-footer__email" href="mailto:contact@itclub.one">
            contact@itclub.one <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <p className="site-footer__meta">
            Student-led technology community
            <br />
            BATU · Alexandria, Egypt
          </p>
        </div>
      </div>
      <div className="site-footer__wordmark" aria-hidden="true">
        IT CLUB
      </div>
      <div className="site-footer__bottom site-container">
        <span>© {year} IT Club · BATU</span>
        <span>Learn · Make · Move ideas forward</span>
        <Link className="site-backtop" href="#top">
          Back to top{" "}
          <span aria-hidden="true">
            <ArrowUp size={14} />
          </span>
        </Link>
      </div>
    </footer>
  );
}
