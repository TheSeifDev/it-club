/** Typographic date tile used where an event has no image: big outlined day, never an icon. */
function dateParts(value?: string) {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : "Africa/Cairo",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return { day: part("day"), month: part("month"), year: part("year") };
}

export function DateMark({
  date,
  fallback = "Soon.",
  size = "lg",
}: {
  date?: string;
  fallback?: string;
  size?: "lg" | "md";
}) {
  const parts = dateParts(date);
  const big =
    size === "lg"
      ? "text-[clamp(4.6rem,9vw,8.6rem)]"
      : "text-[clamp(3.4rem,6vw,5.4rem)]";
  return (
    <span className="relative flex flex-col items-center gap-2 text-center" aria-hidden="true">
      <span
        className={`${big} leading-[0.85] font-medium tracking-[-0.08em] text-transparent [-webkit-text-stroke:1px_rgb(82_232_209_/_.55)]`}
      >
        {parts ? parts.day : fallback}
      </span>
      {parts ? (
        <span className="text-[0.62rem] font-semibold tracking-[0.16em] text-[var(--site-sky-ink)] uppercase">
          {parts.month} {parts.year}
        </span>
      ) : null}
    </span>
  );
}
