/** Roman chapter marker — text only, no badges or icons. */
export function Chapter({ number, children }: { number: string; children: string }) {
  return (
    <p className="m-0 inline-flex items-baseline gap-3 text-[.72rem] uppercase leading-none tracking-[.16em] text-[var(--site-copy)] [&>span:first-child]:font-medium [&>span:first-child]:tracking-[.04em] [&>span:first-child]:text-[var(--site-sky-ink)] [&>i]:block [&>i]:h-px [&>i]:w-8 [&>i]:translate-y-[-.25em] [&>i]:bg-[rgb(255_255_255_/_.25)]">
      <span>{number}</span><i aria-hidden="true" /><span>{children}</span>
    </p>
  );
}
