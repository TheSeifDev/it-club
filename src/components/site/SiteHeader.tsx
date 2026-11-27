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
  "relative z-[20] mx-auto flex h-[49px] w-[calc(100%_-_2_*_var(--site-gutter))] items-center justify-between gap-[22px] max-[1130px]:gap-[14px] max-[520px]:h-[47px]";
const brandClass =
  "inline-flex h-[49px] shrink-0 items-center gap-[7px] rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] py-[5px] pr-4 pl-[6px] !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_12px_38px_rgb(0_0_0_/_24%)] min-[1040px]:backdrop-blur-[6px] min-[1040px]:backdrop-saturate-[145%] max-[520px]:h-[47px]";
const wordmarkClass =
  "inline-flex items-baseline gap-[3px] text-[.9rem] leading-none font-medium tracking-[-.055em]";
const navClass =
  "flex items-center gap-2 bg-transparent p-0 max-[1039px]:hidden";
const navLinkClass =
  "relative isolate inline-flex h-[49px] items-center justify-center overflow-hidden rounded-full border-0 bg-[var(--site-glass)] px-[17px] text-[.69rem] font-normal !text-[var(--site-ink)] transition-[color,border-color] duration-300 before:absolute before:inset-0 before:z-0 before:translate-y-full before:rounded-[inherit] before:bg-white before:transition-transform before:duration-300 before:ease-out hover:before:translate-y-0 hover:!text-[var(--site-night)] focus-visible:before:translate-y-0 focus-visible:!text-[var(--site-night)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] aria-[current=page]:border aria-[current=page]:!border-[var(--site-sky-ink)] aria-[current=page]:bg-[color-mix(in_srgb,var(--site-sky)_24%,var(--site-glass-strong))] motion-reduce:transition-none motion-reduce:before:transition-none";
const contactClass =
  "inline-flex h-[49px] shrink-0 items-center gap-[10px] rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] py-[5px] pr-[5px] pl-[17px] text-[.75rem] font-normal tracking-[-.045em] !text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_12px_38px_rgb(0_0_0_/_24%)] transition-[background-color,border-color] duration-200 min-[1040px]:backdrop-blur-[6px] min-[1040px]:backdrop-saturate-[145%] hover:border-[var(--site-sky-ink)] hover:bg-[var(--site-sky)] hover:!text-[var(--site-paper)] max-[1130px]:text-[.7rem] max-[1039px]:hidden motion-reduce:transition-none";
const contactArrowClass =
  "grid h-[38px] w-[38px] place-items-center rounded-full bg-[color-mix(in_srgb,var(--site-sky)_18%,var(--site-glass-strong))] text-[var(--site-sky-ink)]";
const toggleClass =
  "hidden h-[49px] w-[49px] cursor-pointer place-items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-strong)] text-[var(--site-ink)] shadow-[inset_0_1px_0_var(--site-glass-highlight),0_12px_38px_rgb(0_0_0_/_24%)] max-[1039px]:grid max-[520px]:h-[47px] max-[520px]:w-[47px]";
const mobileClass =
  "fixed inset-0 z-[10] h-[100svh] max-h-[100svh] w-screen overscroll-contain overflow-y-auto border-0 bg-[var(--site-night)] px-[var(--site-gutter)] pt-[112px] text-[var(--site-ink)]";
const mobileLinkClass =
  "group relative isolate flex min-h-[70px] flex-col items-start justify-center gap-[4px] overflow-hidden rounded-[12px] px-3 py-3 text-[var(--site-ink)] before:absolute before:inset-0 before:z-0 before:translate-y-full before:rounded-[inherit] before:bg-white before:transition-transform before:duration-300 before:ease-out hover:before:translate-y-0 hover:!text-[var(--site-night)] focus-visible:before:translate-y-0 focus-visible:!text-[var(--site-night)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:before:transition-none";
const mobileNavigationLinks = [
  ...SITE_NAV_LINKS,
  { href: "/contact", label: "Contact", arabic: "تواصل معنا" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

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
    <header className={headerClass}>
      <div className={innerClass}>
        <Link className={brandClass} href="/" aria-label="IT Club BATU — home">
          <Image
            className="block h-[37px] w-[37px] object-contain"
            src="/logo.webp"
            alt=""
            width={36}
            height={36}
            priority
          />
          <span className={wordmarkClass}>
            <span>IT</span>
            <b className="font-medium">CLUB</b>
            <i className="ml-[5px] text-[.43rem] font-normal not-italic tracking-[.06em] text-[var(--site-mist)]">
              BATU
            </i>
          </span>
        </Link>
        <nav className={navClass} aria-label="Main navigation">
          {SITE_NAV_LINKS.map((link) => {
            const active = isSitePageActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                className={navLinkClass}
                href={link.href}
                aria-current={active ? "page" : undefined}
              >
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
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
        <nav className="flex flex-col" aria-label="Mobile navigation">
          {mobileNavigationLinks.map((link, index) => (
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
              <span className="relative z-10 text-[1.15rem] font-medium leading-[1.25] tracking-[-.05em]">
                {link.label}
              </span>
              <span
                className="relative z-10 text-[.72rem] leading-[1.4] text-[var(--site-mist)] group-hover:text-[var(--site-night)] group-focus-visible:text-[var(--site-night)]"
                lang="ar"
                dir="rtl"
              >
                {link.arabic}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
