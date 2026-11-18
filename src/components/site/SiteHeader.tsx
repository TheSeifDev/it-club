"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/about", label: "About" },
  { href: "/community", label: "Teams" },
  { href: "/events", label: "Events" },
  { href: "/sponsors", label: "Partners" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const open = openForPath === pathname;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const close = () => setOpenForPath(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 800px)").matches) close();
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    firstLinkRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  function toggleMenu() {
    setOpenForPath(open ? null : pathname);
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-brand" href="/" aria-label="IT Club BATU — home" onClick={close}>
          <Image src="/logo.webp" alt="" width={42} height={42} priority />
          <span className="site-brand__wordmark"><span>IT</span><b>CLUB</b><i>BATU</i></span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="site-header__contact" href="/contact">Let&apos;s talk <span aria-hidden="true">↗</span></Link>
        <button
          ref={toggleRef}
          type="button"
          className="site-menu-toggle"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="site-mobile-navigation"
          onClick={toggleMenu}
        >
          {open ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </div>
      <nav id="site-mobile-navigation" className="site-mobile-nav" aria-label="Mobile navigation" hidden={!open}>
        {links.map((link, index) => (
          <Link
            key={link.href}
            ref={index === 0 ? firstLinkRef : undefined}
            href={link.href}
            aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
            onClick={close}
          >
            <span>{link.label}</span><span aria-hidden="true">↗</span>
          </Link>
        ))}
        <Link href="/contact" onClick={close}><span>Contact</span><span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
