"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SITE_NAV_LINKS, isSitePageActive } from "@/lib/ui/site-navigation";

const headerClass =
  "group fixed inset-x-0 top-[26px] z-[80] bg-transparent max-[520px]:top-5";
const innerClass =
  "mx-auto flex h-[49px] w-[calc(100%_-_2_*_var(--site-gutter))] items-center justify-between gap-[22px] max-[1130px]:gap-[14px] max-[520px]:h-[47px]";
const brandClass =
  "inline-flex h-[49px] shrink-0 items-center gap-[7px] rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] py-[5px] pr-4 pl-[6px] !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_12px_38px_rgb(0_0_0_/_24%)] min-[1040px]:backdrop-blur-[6px] min-[1040px]:backdrop-saturate-[145%] max-[520px]:h-[47px]";
const wordmarkClass =
  "inline-flex items-baseline gap-[3px] text-[.9rem] leading-none font-medium tracking-[-.055em]";
const navClass =
  "flex items-center gap-[7px] bg-transparent p-0 max-[1039px]:hidden";
const navLinkClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass)] px-[15px] text-[.69rem] font-normal !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight)] transition-[color,background-color,border-color] duration-200 min-[1040px]:backdrop-blur-[6px] min-[1040px]:backdrop-saturate-[140%] hover:border-[var(--site-glass-highlight)] hover:bg-[color-mix(in_srgb,var(--site-sky)_14%,var(--site-glass-strong))] aria-[current=page]:border-[var(--site-glass-highlight)] aria-[current=page]:bg-[color-mix(in_srgb,var(--site-sky)_14%,var(--site-glass-strong))] group-data-[tone=film]:bg-[var(--site-glass-strong)] group-data-[tone=film]:hover:bg-[color-mix(in_srgb,var(--site-sky)_16%,var(--site-glass-strong))] group-data-[tone=film]:aria-[current=page]:bg-[color-mix(in_srgb,var(--site-sky)_16%,var(--site-glass-strong))] motion-reduce:transition-none";
const contactClass =
  "inline-flex h-[49px] shrink-0 items-center gap-[10px] rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] py-[5px] pr-[5px] pl-[17px] text-[.75rem] font-normal tracking-[-.045em] !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_12px_38px_rgb(0_0_0_/_24%)] transition-[background-color,border-color] duration-200 min-[1040px]:backdrop-blur-[6px] min-[1040px]:backdrop-saturate-[145%] hover:border-[var(--site-sky-ink)] hover:bg-[var(--site-sky)] hover:!text-[var(--site-paper)] max-[1130px]:text-[.7rem] max-[1039px]:hidden motion-reduce:transition-none";
const contactArrowClass =
  "grid h-[38px] w-[38px] place-items-center rounded-full bg-[color-mix(in_srgb,var(--site-sky)_18%,var(--site-glass-strong))] text-[var(--site-sky-ink)]";
const toggleClass =
  "hidden h-[49px] w-[49px] cursor-pointer place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_12px_38px_rgb(0_0_0_/_24%)] max-[1039px]:grid max-[520px]:h-[47px] max-[520px]:w-[47px]";
const mobileClass =
  "absolute top-[66px] right-[var(--site-gutter)] left-[var(--site-gutter)] max-h-[calc(100svh_-_122px)] overflow-y-auto rounded-[18px] border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] p-[15px] text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_20px_70px_rgb(0_0_0_/_38%)] max-[520px]:top-[63px] max-[520px]:p-[10px]";
const mobileLinkClass =
  "flex items-center justify-between gap-5 rounded-[13px] px-4 py-[13px] hover:bg-[color-mix(in_srgb,var(--site-sky)_14%,var(--site-glass))] aria-[current=page]:bg-[color-mix(in_srgb,var(--site-sky)_14%,var(--site-glass))]";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    const hero = document.querySelector("[data-editorial-hero]");
    if (!header) return;
    if (!hero) { header.dataset.tone = "paper"; return; }
    const observer = new IntersectionObserver(([entry]) => {
      header.dataset.tone = entry.isIntersecting ? "film" : "paper";
    }, { rootMargin: "-75px 0px 0px 0px", threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (event.key === "Tab") {
        const nodes = [
          toggleRef.current,
          ...Array.from(
            panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ??
              [],
          ),
        ].filter((node): node is HTMLButtonElement | HTMLAnchorElement =>
          Boolean(node),
        );
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 1040px)").matches) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header ref={headerRef} className={headerClass} data-tone={pathname === "/" ? "film" : "paper"}>
      <div className={innerClass}>
        <Link
          className={brandClass}
          href="/"
          aria-label="IT Club BATU — home"
        >
          <Image className="block h-[37px] w-[37px] object-contain" src="/logo.webp" alt="" width={36} height={36} priority />
          <span className={wordmarkClass}>
            <span>IT</span>
            <b className="font-medium">CLUB</b>
            <i className="ml-[5px] text-[.43rem] font-normal not-italic tracking-[.06em] text-[var(--site-mist)]">BATU</i>
          </span>
        </Link>
        <nav className={navClass} aria-label="Main navigation">
          {SITE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              className={navLinkClass}
              href={link.href}
              aria-current={
                isSitePageActive(pathname, link.href) ? "page" : undefined
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className={contactClass} href="/contact">
          <span>Let’s connect</span>
          <span className={contactArrowClass} aria-hidden="true">
            <ArrowUpRight size={16} />
          </span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className={toggleClass}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="site-mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X size={21} aria-hidden="true" />
          ) : (
            <Menu size={21} aria-hidden="true" />
          )}
        </button>
      </div>
      <div
        ref={panelRef}
        id="site-mobile-navigation"
        className={mobileClass}
        hidden={!open}
      >
        <nav className="grid gap-1" aria-label="Mobile navigation">
          {SITE_NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              ref={index === 0 ? firstLinkRef : undefined}
              className={mobileLinkClass}
              href={link.href}
              aria-current={
                isSitePageActive(pathname, link.href) ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              <span>
                <strong className="block text-[1.15rem] font-medium tracking-[-.05em]">{link.label}</strong>
                <small className="mt-[5px] block w-fit text-[.7rem] text-[var(--site-mist)]" lang="ar" dir="rtl">
                  {link.arabic}
                </small>
              </span>
              <ArrowUpRight className="text-[var(--site-sky-ink)]" size={18} aria-hidden="true" />
            </Link>
          ))}
          <Link className={mobileLinkClass} href="/contact" onClick={() => setOpen(false)}>
            <span>
              <strong className="block text-[1.15rem] font-medium tracking-[-.05em]">Contact</strong>
              <small className="mt-[5px] block w-fit text-[.7rem] text-[var(--site-mist)]" lang="ar" dir="rtl">
                تواصل معنا
              </small>
            </span>
            <ArrowUpRight className="text-[var(--site-sky-ink)]" size={18} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
