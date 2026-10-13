import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowUpRight, Inbox } from "lucide-react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#00e599]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function AdminSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-white/45">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "#00e599",
  href,
  detail,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: string;
  href?: string;
  detail?: string;
}) {
  const content = (
    <div className={`group relative min-h-[120px] overflow-hidden border border-white/10 bg-[#080a0c] p-4 transition-all duration-200 ${
      href ? "cursor-pointer hover:border-white/25 hover:bg-[#0c0f13] hover:shadow-lg" : ""
    }`}>
      <div
        className="absolute inset-x-0 top-0 h-0.5 transition-all duration-200 group-hover:h-1"
        style={{ backgroundColor: tone }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50 transition-colors group-hover:text-white/80">
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {Icon ? <Icon size={16} style={{ color: tone }} aria-hidden="true" /> : null}
          {href ? (
            <ArrowUpRight
              size={13}
              className="text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#00e599]"
              aria-hidden="true"
            />
          ) : null}
        </div>
      </div>
      <div className="mt-3.5 text-3xl font-black tabular-nums text-white transition-colors group-hover:text-white">
        {value}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] leading-4 text-white/40">
        <span className="truncate">{detail || "Click to inspect records"}</span>
        {href ? (
          <span className="shrink-0 font-bold uppercase tracking-wider text-[#00e599] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            View →
          </span>
        ) : null}
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00e599] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080a0b]"
      aria-label={`View ${label} (${value}) in Applications management`}
    >
      {content}
    </Link>
  ) : (
    content
  );
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-white/10 bg-[#080a0c] ${className}`}>
      {(title || description) && (
        <div className="border-b border-white/10 p-4 sm:p-5">
          {title ? <h2 className="text-sm font-bold text-white">{title}</h2> : null}
          {description ? <p className="mt-1 text-xs leading-5 text-white/45">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center border border-white/10 bg-white/[0.03] text-white/30">
        <Inbox size={19} />
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 border border-rose-500/35 bg-rose-500/10 p-4 text-sm text-rose-200">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-300" />
      <div>
        <p className="font-bold">Unable to load this dashboard data.</p>
        <p className="mt-1 text-xs leading-5 text-rose-200/80">{message}</p>
      </div>
    </div>
  );
}
