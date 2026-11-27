import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Cpu, Users } from "lucide-react";
import { ABOUT_HREF } from "@/lib/ui/site-navigation";
import styles from "./SiteFooter.module.css";

const siteLinks = [
  { href: "/", label: "Home" },
  { href: ABOUT_HREF, label: "About" },
  { href: "/tracks", label: "Tracks" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Partners" },
  { href: "/alumni", label: "Alumni" },
];

export default function SiteFooter() {
  return (
    <footer className={styles.root}>
      <div className={styles.top}>
        <Link className={styles.brand} href="/" aria-label="IT Club BATU — home"><Image src="/logo.webp" alt="" width={45} height={45} /><span>IT Club.</span></Link>
        <div className={styles.message}>
          <h2>We’re here to make room<br />for curious minds<br />and ideas that matter.</h2>
          <p lang="ar" dir="rtl">كل فكرة قوية تبدأ بفريق.</p>
        </div>
        <div className={styles.art} aria-hidden="true"><Cpu className={styles.watermark} size={295} strokeWidth={.65} /><div className={styles.tile}><Users size={84} strokeWidth={1} /></div></div>
      </div>
      <div className={styles.contacts}>
        <span>Borg Al Arab Technological University</span>
        <span>Alexandria, Egypt</span>
        <a href="mailto:contact@itclub.one">contact@itclub.one <ArrowUpRight size={14} aria-hidden="true" /></a>
      </div>
      <div className={styles.bottom}>
        <div className={styles.copyright}><span>© {new Date().getFullYear()} IT Club · BATU</span><nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div>
        <nav className={styles.nav} aria-label="Footer navigation">{siteLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}<a href="#top" className={styles.backtop} aria-label="Back to top"><ArrowUp size={19} strokeWidth={1.5} aria-hidden="true" /></a></nav>
      </div>
    </footer>
  );
}
