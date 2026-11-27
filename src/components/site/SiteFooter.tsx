import Image from "next/image";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Cpu, Users } from "lucide-react";
import { ABOUT_HREF } from "@/lib/ui/site-navigation";

const siteLinks = [
  { href: "/", label: "Home" },
  { href: ABOUT_HREF, label: "About" },
  { href: "/tracks", label: "Tracks" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/store", label: "Store" },
  { href: "/sponsors", label: "Partners" },
  { href: "/alumni", label: "Alumni" },
];

const rootClass =
  "bg-[var(--site-paper)] px-[var(--site-gutter)] pt-[66px] pb-[34px] text-[var(--site-ink)] max-[750px]:pt-[45px]";
const topClass = "relative min-h-[360px] max-[750px]:min-h-[370px] max-[520px]:min-h-[330px]";
const brandClass =
  "inline-flex h-[59px] items-center gap-[9px] rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] py-[6px] pr-[18px] pl-[7px] text-[1.35rem] font-medium tracking-[-.07em] !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_14px_44px_rgb(0_0_0_/_25%)] min-[1040px]:backdrop-blur-[6px] min-[1040px]:backdrop-saturate-[145%] max-[520px]:h-[52px] max-[520px]:text-[1.2rem]";
const messageClass =
  "relative z-[1] mt-[90px] max-[750px]:mt-[62px] max-[520px]:mt-[56px]";
const titleClass =
  "m-0 max-w-[750px] text-[clamp(2rem,3.6vw,4.7rem)] font-normal leading-[1.09] tracking-[-.06em] max-[1000px]:max-w-[65%] max-[750px]:max-w-[83%] max-[750px]:text-[2.3rem] max-[520px]:max-w-full max-[520px]:text-[2.05rem]";
const artClass =
  "absolute top-16 right-[7%] h-[290px] w-[300px] max-[1000px]:top-[65px] max-[1000px]:right-[4%] max-[1000px]:w-[230px] max-[750px]:top-[42px] max-[750px]:right-[-1%] max-[750px]:h-[280px] max-[750px]:w-[180px] max-[750px]:opacity-60 max-[520px]:right-0 max-[520px]:opacity-[.35]";
const watermarkClass =
  "absolute top-[-18px] right-[-80px] rotate-[22deg] text-[var(--site-glass-highlight)] opacity-[.55] max-[1000px]:w-[240px] max-[750px]:top-10 max-[750px]:right-0 max-[750px]:w-[160px]";
const tileClass =
  "absolute bottom-[-15px] left-[15px] grid h-[176px] w-[176px] rotate-[-4deg] place-items-center rounded-[19px] border border-[var(--site-glass-border)] bg-[var(--site-glass)] text-[var(--site-sky-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_20px_60px_rgb(0_0_0_/_24%)] max-[1000px]:bottom-3 max-[1000px]:h-[140px] max-[1000px]:w-[140px] max-[750px]:bottom-[-32px] max-[750px]:left-[50px] max-[750px]:h-[115px] max-[750px]:w-[115px] max-[520px]:hidden";
const contactsClass =
  "mt-[54px] flex justify-between gap-7 border-t border-[var(--site-glass-border)] pt-[26px] text-[clamp(.75rem,1.45vw,1.3rem)] leading-[1.55] tracking-[-.04em] text-[var(--site-copy)] max-[750px]:mt-7 max-[750px]:flex-col max-[750px]:gap-[10px] max-[750px]:text-[.85rem]";
const bottomClass =
  "mt-[66px] flex items-end justify-between gap-8 max-[1000px]:items-start max-[750px]:mt-10 max-[750px]:flex-col-reverse max-[750px]:gap-[25px]";
const navClass =
  "flex flex-wrap items-center justify-end gap-[6px] max-[1000px]:gap-[6px] max-[750px]:justify-start";
const navLinkClass =
  "relative isolate inline-flex min-h-[33px] items-center justify-center overflow-hidden rounded-full border border-[var(--site-glass-border)] bg-[var(--site-night-2)] px-[10px] text-[.58rem] !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-[color,border-color] duration-300 before:absolute before:inset-0 before:z-0 before:translate-y-full before:rounded-[inherit] before:bg-white before:transition-transform before:duration-300 before:ease-out hover:border-white hover:before:translate-y-0 hover:!text-[var(--site-night)] focus-visible:border-white focus-visible:before:translate-y-0 focus-visible:!text-[var(--site-night)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] max-[520px]:min-h-[32px] max-[520px]:px-[9px] motion-reduce:transition-none motion-reduce:before:transition-none";
const backtopClass =
  "inline-flex h-[33px] w-[33px] min-h-[33px] items-center justify-center rounded-full border border-[var(--site-sky)] bg-[var(--site-sky)] p-0 !text-[var(--site-paper)] hover:border-[var(--site-sky-ink)] hover:bg-[var(--site-sky-ink)]";

export default function SiteFooter() {
  return (
    <footer className={rootClass}>
      <div className={topClass}>
        <Link className={brandClass} href="/" aria-label="IT Club BATU — home"><Image className="h-[45px] w-[45px] object-contain max-[520px]:h-[39px] max-[520px]:w-[39px]" src="/logo.webp" alt="" width={45} height={45} /><span>IT Club.</span></Link>
        <div className={messageClass}>
          <h2 className={titleClass}>We’re here to make room<br />for curious minds<br />and ideas that matter.</h2>
          <p className="mt-[23px] mb-0 w-fit text-[.76rem] text-[var(--site-mist)]" lang="ar" dir="rtl">كل فكرة قوية تبدأ بفريق.</p>
        </div>
        <div className={artClass} aria-hidden="true"><Cpu className={watermarkClass} size={295} strokeWidth={.65} /><div className={tileClass}><Users className="max-[750px]:w-[59px]" size={84} strokeWidth={1} /></div></div>
      </div>
      <div className={contactsClass}>
        <span>Borg Al Arab Technological University</span>
        <span>Alexandria, Egypt</span>
        <a className="inline-flex items-center gap-[9px] hover:text-[var(--site-ink)]" href="mailto:contact@itclub.one">contact@itclub.one <ArrowUpRight size={14} aria-hidden="true" /></a>
      </div>
      <div className={bottomClass}>
        <div className="shrink-0 text-[.6rem] text-[var(--site-mist)]"><span>© {new Date().getFullYear()} IT Club · BATU</span><nav className="mt-2 flex gap-[15px] text-[.54rem]" aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div>
        <nav className={navClass} aria-label="Footer navigation">{siteLinks.map((link) => <Link className={navLinkClass} key={link.href} href={link.href}><span className="relative z-10">{link.label}</span></Link>)}<a href="#top" className={backtopClass} aria-label="Back to top"><ArrowUp size={19} strokeWidth={1.5} aria-hidden="true" /></a></nav>
      </div>
    </footer>
  );
}
