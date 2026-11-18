"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SITE_NAV_LINKS, isSitePageActive } from "@/lib/ui/site-navigation";
import styles from "./SiteHeader.module.css";

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
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          className={styles.brand}
          href="/"
          aria-label="IT Club BATU — home"
        >
          <Image src="/logo.webp" alt="" width={36} height={36} priority />
          <span className={styles.wordmark}>
            <span>IT</span>
            <b>CLUB</b>
            <i>BATU</i>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          {SITE_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                isSitePageActive(pathname, link.href) ? "page" : undefined
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className={styles.contact} href="/contact">
          <span>Join the conversation</span>
          <span className={styles.contactArrow} aria-hidden="true">
            <ArrowUpRight size={16} />
          </span>
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
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
        className={styles.mobile}
        hidden={!open}
      >
        <nav aria-label="Mobile navigation">
          {SITE_NAV_LINKS.map((link, index) => (
            <Link
              key={link.href}
              ref={index === 0 ? firstLinkRef : undefined}
              href={link.href}
              aria-current={
                isSitePageActive(pathname, link.href) ? "page" : undefined
              }
              onClick={() => setOpen(false)}
            >
              <span>
                <strong>{link.label}</strong>
                <small lang="ar" dir="rtl">
                  {link.arabic}
                </small>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)}>
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
