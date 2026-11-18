"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/about", label: "About", arabic: "عن النادي" },
  { href: "/community", label: "Community", arabic: "المجتمع" },
  { href: "/tracks", label: "Tracks", arabic: "المسارات" },
  { href: "/events", label: "Events", arabic: "الفعاليات" },
  { href: "/sponsors", label: "Partners", arabic: "الشركاء" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 900px)").matches) setOpen(false);
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
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="IT Club BATU — home">
          <Image src="/logo.webp" alt="" width={42} height={42} priority />
          <span className="site-brand__wordmark">
            <span>IT</span>
            <b>CLUB</b>
            <i>BATU</i>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link className="site-header__contact" href="/contact">
          <span>Join the conversation</span>
          <span className="site-header__contact-arrow" aria-hidden="true">
            <ArrowUpRight size={16} />
          </span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="site-menu-toggle"
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
        id="site-mobile-navigation"
        className="site-mobile-nav"
        hidden={!open}
      >
        <nav aria-label="Mobile navigation">
          {links.map((link, index) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                ref={index === 0 ? firstLinkRef : undefined}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="site-mobile-nav__index">0{index + 1}</span>
                <span>
                  <strong>{link.label}</strong>
                  <small lang="ar" dir="rtl">
                    {link.arabic}
                  </small>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            );
          })}
          <Link href="/contact" onClick={() => setOpen(false)}>
            <span className="site-mobile-nav__index">06</span>
            <span>
              <strong>Contact</strong>
              <small lang="ar" dir="rtl">
                تواصل معنا
              </small>
            </span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
