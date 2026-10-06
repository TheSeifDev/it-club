"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import MobileNav, { MobileNavToggle } from "./MobileNav";
import Nav from "./Nav";
import { BRAND, NAV_CTA } from "./NavLinks";

const DESKTOP_QUERY = "(min-width: 768px)"; // Tailwind `md`

function useMobileMenu(pathname: string) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  // Close when the route changes (e.g. browser back/forward).
  // Adjusting state during render avoids an extra render pass from an effect.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  // While open: Escape closes, growing to desktop closes, page scroll is locked.
  useEffect(() => {
    if (!isOpen) return;

    const media = window.matchMedia(DESKTOP_QUERY);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onBreakpointChange);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onBreakpointChange);
    };
  }, [isOpen, close]);

  return { isOpen, close, toggle };
}

export default function ResponsiveNav() {
  const pathname = usePathname();
  const menuId = useId();
  const { isOpen, close, toggle } = useMobileMenu(pathname);

  return (
    <header className="sticky top-0 z-50 border-white/10 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-11/12 items-center justify-between px-3 md:px-4">
        {/* Logo — left */}
        <Link
          href={BRAND.href}
          onClick={close}
          className="text-lg font-bold tracking-tight text-white"
        >
          {BRAND.label}
        </Link>

        {/* Links + button — right */}
        <div className="flex items-center gap-4 md:gap-6">
          <Nav pathname={pathname} className="hidden md:block" />

          <Link
            href={NAV_CTA.href}
            onClick={close}
            className="inline-flex h-10 items-center bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            {NAV_CTA.label}
          </Link>

          <MobileNavToggle
            isOpen={isOpen}
            controlsId={menuId}
            onToggle={toggle}
          />
        </div>
      </div>

      <MobileNav
        id={menuId}
        isOpen={isOpen}
        pathname={pathname}
        onNavigate={close}
      />
    </header>
  );
}