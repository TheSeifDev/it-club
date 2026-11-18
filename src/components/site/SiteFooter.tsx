import Image from "next/image";
import Link from "next/link";

const siteLinks = [
  { href: "/about", label: "About" },
  { href: "/community", label: "Teams" },
  { href: "/tracks", label: "Tracks" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Partners" },
  { href: "/alumni", label: "Alumni" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__top site-container">
        <Link className="site-footer__brand" href="/" aria-label="IT Club home">
          <Image src="/logo.webp" alt="" width={36} height={36} />
          <span><b>IT CLUB</b><small>BORG AL ARAB TECHNOLOGICAL UNIVERSITY</small></span>
        </Link>
        <p>Good work is never built alone.<br /><span lang="ar" dir="rtl">كل فكرة قوية تبدأ بفريق.</span></p>
        <Link className="site-footer__email" href="mailto:contact@itclub.one">contact@itclub.one <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="site-footer__bottom site-container">
        <span className="site-footer__copyright">© IT Club · BATU</span>
        <nav aria-label="Footer navigation">
          {siteLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <a className="site-backtop" href="#top" aria-label="Back to top">Back to top ↑</a>
      </div>
    </footer>
  );
}
