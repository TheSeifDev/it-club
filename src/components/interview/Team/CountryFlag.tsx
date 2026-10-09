"use client";

import * as React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { hasFlag } from "country-flag-icons";
import { cn } from "@/lib/utils";

// Mapping of common 3-letter ISO alpha-3 codes to 2-letter ISO alpha-2 codes
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  EGY: "EG",
  USA: "US",
  GBR: "GB",
  DEU: "DE",
  FRA: "FR",
  CAN: "CA",
  AUS: "AU",
  SAU: "SA",
  ARE: "AE",
  KWT: "KW",
  QAT: "QA",
  JOR: "JO",
  LBN: "LB",
  MAR: "MA",
  TUN: "TN",
  DZA: "DZ",
  SDN: "SD",
  OMN: "OM",
  BHR: "BH",
  IRQ: "IQ",
  SYR: "SY",
  YEM: "YE",
  LBY: "LY",
  PSE: "PS",
};

// Known common country name mappings
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  EGYPT: "EG",
  "SAUDI ARABIA": "SA",
  "UNITED ARAB EMIRATES": "AE",
  "UNITED STATES": "US",
  "UNITED KINGDOM": "GB",
  GERMANY: "DE",
  FRANCE: "FR",
  CANADA: "CA",
};

export interface CountryFlagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** ISO 3166-1 alpha-2 or alpha-3 country code (e.g. "EG" or "EGY") */
  countryCode?: string;
  /** Full country name (e.g. "EGYPT") for title, accessibility, and fallback code resolution */
  countryName?: string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Resolves a normalized 2-letter ISO country code from explicit country code or country name.
 * Nationality is NEVER inferred from a person's name or photo.
 */
export function resolveCountryCode(
  code?: string,
  name?: string
): string | undefined {
  if (code) {
    const clean = code.trim().toUpperCase();
    if (clean.length === 2 && hasFlag(clean)) {
      return clean;
    }
    if (clean.length === 3 && ALPHA3_TO_ALPHA2[clean]) {
      const mapped = ALPHA3_TO_ALPHA2[clean];
      if (hasFlag(mapped)) return mapped;
    }
  }

  if (name) {
    const cleanName = name.trim().toUpperCase();
    if (COUNTRY_NAME_TO_CODE[cleanName]) {
      const mapped = COUNTRY_NAME_TO_CODE[cleanName];
      if (hasFlag(mapped)) return mapped;
    }
  }

  return undefined;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryCode,
  countryName,
  className,
  title,
  ...props
}) => {
  const resolvedCode = resolveCountryCode(countryCode, countryName);
  const accessibleLabel =
    title ||
    (countryName
      ? `${countryName} Flag`
      : resolvedCode
      ? `${resolvedCode} Flag`
      : "Country Flag");

  if (!resolvedCode) {
    // Fallback icon if country code is missing or unsupported
    return (
      <span
        role="img"
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={cn(
          "inline-flex items-center justify-center shrink-0 w-[18px] h-[12px] aspect-3/2 rounded-[1px] bg-white/10 border border-white/15 text-neutral-400 select-none",
          className
        )}
        {...props}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-2.5 h-2.5 opacity-60"
          aria-hidden="true"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </span>
    );
  }

  const FlagComponent = (
    Flags as unknown as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>
  )[resolvedCode];

  if (!FlagComponent) {
    return (
      <span
        role="img"
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={cn(
          "inline-flex items-center justify-center shrink-0 w-[18px] h-[12px] aspect-3/2 rounded-[1px] bg-white/10 border border-white/15 text-neutral-400 select-none",
          className
        )}
        {...props}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-2.5 h-2.5 opacity-60"
          aria-hidden="true"
        >
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      title={accessibleLabel}
      className={cn(
        "inline-flex items-center justify-center shrink-0 w-[18px] h-[12px] aspect-3/2 overflow-hidden rounded-[1px] border border-white/20 shadow-xs select-none",
        className
      )}
      {...props}
    >
      <FlagComponent
        className="w-full h-full object-cover block"
        aria-hidden="true"
      />
    </span>
  );
};
