"use client";

import { useEffect, useId, useState } from "react";
import {
  committeeLabel,
  reservationAttachments,
  STORE_BUNDLE_PRICE_EGP,
  STORE_COMMITTEES,
  STORE_POSITIONS,
  STORE_VEST_SIZES,
  validateReservation,
  type ReservationField,
  type StoreCommittee,
  type StoreEdition,
  type StoreEligibility,
  type StorePosition,
  type StoreVestSize,
} from "@/lib/store/catalog";

type Errors = Partial<Record<ReservationField, string>>;
type Done = { code: string; stored: boolean; whatsappUrl: string | null };

const label = "m-0 text-[.6rem] font-medium uppercase tracking-[.16em] text-[var(--site-mist)]";
const input =
  "mt-2.5 block min-h-[54px] w-full rounded-[14px] bg-[var(--site-glass-soft)] px-4 text-[.92rem] text-[var(--site-ink)] shadow-[inset_0_0_0_1px_var(--site-glass-border)] outline-none transition placeholder:text-[var(--site-mist)] focus:shadow-[inset_0_0_0_1px_var(--site-sky-ink)] aria-[invalid=true]:shadow-[inset_0_0_0_1px_rgb(255_120_120_/_.6)]";
const chip = (on: boolean) =>
  `min-h-11 rounded-full px-4 text-[.72rem] transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--site-sky-ink)] motion-reduce:transition-none ${
    on ? "bg-[var(--site-ink)] text-[var(--site-night)]" : "bg-white/[.05] text-[var(--site-copy)] hover:bg-white/10 hover:text-[var(--site-ink)]"
  }`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 mb-0 text-[.66rem] text-[rgb(255_150_150)]" role="alert">
      {message}
    </p>
  );
}

function Choice<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  legend: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={error ? `${id}-e` : undefined}>
      <legend className={label}>{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((option) => (
          <button
            aria-checked={value === option.value}
            className={chip(value === option.value)}
            key={option.value}
            name={name}
            onClick={() => onChange(option.value)}
            role="radio"
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <FieldError id={`${id}-e`} message={error} />
    </fieldset>
  );
}

function Step({ number, title, arabic, children }: { number: string; title: string; arabic: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] bg-[var(--site-glass)] p-[clamp(22px,2.6vw,38px)] shadow-[inset_0_1px_0_var(--site-glass-highlight)]">
      <div className="flex items-baseline justify-between gap-4">
        <p className="m-0 flex items-baseline gap-4">
          <span className="text-[.7rem] tabular-nums text-[var(--site-sky-ink)]">{number}</span>
          <span className="text-[clamp(1.4rem,2.2vw,2rem)] leading-none tracking-[-.06em] text-[var(--site-ink)]">{title}</span>
        </p>
        <span className="font-[family-name:var(--font-alexandria)] text-[.78rem] text-[var(--site-sky-ink)]" dir="rtl" lang="ar">
          {arabic}
        </span>
      </div>
      <div className="mt-[clamp(20px,2.4vw,32px)]">{children}</div>
    </section>
  );
}

function KitCard({
  selected,
  onSelect,
  letter,
  kicker,
  title,
  body,
  price,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  letter: string;
  kicker: string;
  title: string;
  body: string;
  price: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`group/kit relative isolate flex min-h-[300px] flex-col max-[680px]:min-h-[210px] overflow-hidden rounded-[18px] p-[clamp(20px,2.2vw,30px)] transition-[background-color,box-shadow] duration-500 motion-reduce:transition-none ${
        selected
          ? "bg-[rgb(40_205_183_/_.1)] shadow-[inset_0_0_0_1px_rgb(82_232_209_/_.55)]"
          : "bg-white/[.025] shadow-[inset_0_0_0_1px_var(--site-glass-border)] hover:bg-white/[.045]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -right-[.05em] -bottom-[.22em] -z-[1] text-[clamp(8rem,13vw,13rem)] leading-none tracking-[-.09em] text-transparent transition-[-webkit-text-stroke-color] duration-500 [-webkit-text-stroke:1px_rgb(255_255_255_/_.12)] ${
          selected ? "[-webkit-text-stroke-color:rgb(82_232_209_/_.5)]" : ""
        }`}
      >
        {letter}
      </span>
      <button
        aria-checked={selected}
        className="absolute inset-0 z-0 rounded-[18px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--site-sky-ink)]"
        onClick={onSelect}
        role="radio"
        type="button"
      >
        <span className="sr-only">{title}</span>
      </button>
      <div className="pointer-events-none relative flex items-start justify-between gap-3">
        <p className="m-0 text-[.6rem] uppercase tracking-[.16em] text-[var(--site-sky-ink)]">{kicker}</p>
        <span
          className={`rounded-full px-3 py-1.5 text-[.58rem] uppercase tracking-[.14em] transition duration-500 ${
            selected ? "bg-[var(--site-sky)] text-[var(--site-night)]" : "bg-white/[.06] text-[var(--site-mist)]"
          }`}
        >
          {selected ? "Reserving" : "Select"}
        </span>
      </div>
      <h3 className="pointer-events-none relative mt-5 mb-0 text-[clamp(1.6rem,2.4vw,2.4rem)] font-normal leading-[1] tracking-[-.065em]">{title}</h3>
      <p className="pointer-events-none relative mt-3 mb-0 max-w-[36ch] text-[.78rem] leading-[1.75] text-[var(--site-copy)]">{body}</p>
      {children ? <div className="relative z-[1] mt-5">{children}</div> : null}
      <div className="pointer-events-none relative mt-auto pt-7">{price}</div>
    </div>
  );
}

/** One person, one kit: a reservation, not a cart. Rules live in lib/store/catalog. */
export default function StoreReservation() {
  const [edition, setEdition] = useState<StoreEdition | null>(null);
  const [chosenEligibility, setEligibility] = useState<StoreEligibility | null>(null);
  const [name, setName] = useState("");
  const [academicId, setAcademicId] = useState("");
  const [committee, setCommittee] = useState<StoreCommittee | null>(null);
  const [vestSize, setVestSize] = useState<StoreVestSize | null>(null);
  const [website, setWebsite] = useState("");
  const [serverErrors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const ids = useId();

  const [position, setPosition] = useState<StorePosition | null>(null);
  // Main board members reserving ID-only are eligible by role.
  const eligibility = chosenEligibility ?? (edition === "id" && position === "Main board" ? "main-board" : null);
  const payload = { edition, eligibility, name, academicId, position, committee, vestSize };
  const check = validateReservation(payload);
  // Live once the visitor has tried to submit; server errors only until the next valid state.
  const shown: Errors = !tried ? {} : check.ok ? serverErrors : check.errors;
  const attachments = reservationAttachments({ edition: edition ?? "full", eligibility });

  useEffect(() => {
    if (!done?.whatsappUrl) return;
    const timer = window.setTimeout(() => window.location.assign(done.whatsappUrl!), 2200);
    return () => window.clearTimeout(timer);
  }, [done]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTried(true);
    setErrors({});
    if (!check.ok) {
      const first = document.querySelector<HTMLElement>("[data-reserve-form] [aria-invalid='true'], [data-reserve-form] [role='alert']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/store/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, website }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        reservation?: string;
        stored?: boolean;
        whatsappUrl?: string | null;
        errors?: Errors;
        error?: string;
      };
      if (!response.ok || !data.ok || !data.reservation) {
        if (data.errors) setErrors(data.errors);
        setStatus("error");
        setMessage(data.error ?? "We couldn’t save the reservation. Try again in a moment.");
        return;
      }
      setDone({ code: data.reservation, stored: Boolean(data.stored), whatsappUrl: data.whatsappUrl ?? null });
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Connection lost. Check your internet and try again.");
    }
  }

  const slipRows: Array<[string, string]> = [
    ["Kit", edition === "full" ? "Vest + ID + lanyard" : edition === "id" ? "ID card + lanyard" : "—"],
    ...(edition === "id" ? ([["Eligibility", eligibility === "main-board" ? "Main board" : eligibility === "already-paid" ? "Already paid" : "—"]] as Array<[string, string]>) : []),
    ["Name", name.trim() || "—"],
    ["Academic ID", academicId.trim() || "—"],
    ["Position", position ?? "—"],
    ["Committee", committee ? committeeLabel(committee) : "—"],
    ...(edition === "full" ? ([["Vest size", vestSize ?? "—"]] as Array<[string, string]>) : []),
  ];

  return (
    <form
      id="shop-kit"
      data-reserve-form
      noValidate
      onSubmit={submit}
      className="grid scroll-mt-[var(--site-header-clearance,112px)] grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)] items-start gap-[clamp(14px,1.6vw,24px)] max-[960px]:grid-cols-1"
    >
      <div className="grid gap-[clamp(14px,1.6vw,24px)]">
        <Step number="01" title="Choose your kit" arabic="اختار الكيت">
          <div className="grid grid-cols-2 gap-3 max-[680px]:grid-cols-1" role="radiogroup" aria-label="Kit" aria-describedby={shown.edition ? `${ids}-edition` : undefined}>
            <KitCard
              selected={edition === "full"}
              onSelect={() => setEdition("full")}
              letter="A"
              kicker="Edition A · Full field kit"
              title="Vest + ID + lanyard"
              body="The complete set — the vest, your club ID, and its lanyard."
              price={
                <p className="m-0 flex items-baseline gap-2">
                  <span className="text-[.6rem] uppercase tracking-[.16em] text-[var(--site-mist)]">EGP</span>
                  <strong className="text-[clamp(2rem,3vw,2.8rem)] font-normal leading-none tracking-[-.07em]">{STORE_BUNDLE_PRICE_EGP}</strong>
                </p>
              }
            />
            <KitCard
              selected={edition === "id"}
              onSelect={() => setEdition("id")}
              letter="B"
              kicker="Edition B · Eligible members"
              title="ID card + lanyard"
              body="For members who already paid before, or Main board."
              price={<p className="m-0 text-[.95rem] text-[var(--site-copy)]">Included — no new payment</p>}
            >
              {edition === "id" ? (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ID-only eligibility">
                  {(["already-paid", "main-board"] as const).map((item) => (
                    <button aria-checked={eligibility === item} className={chip(eligibility === item)} key={item} onClick={() => setEligibility(item)} role="radio" type="button">
                      {item === "already-paid" ? "I already paid" : "I’m Main board"}
                    </button>
                  ))}
                </div>
              ) : null}
            </KitCard>
          </div>
          <FieldError id={`${ids}-edition`} message={shown.edition ?? shown.eligibility} />
        </Step>

        <Step number="02" title="Who it’s for" arabic="بياناتك">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 max-[680px]:grid-cols-1">
            <label className="block min-w-0">
              <span className={label}>Full name</span>
              <input
                aria-describedby={shown.name ? `${ids}-name` : undefined}
                aria-invalid={Boolean(shown.name)}
                autoComplete="name"
                className={input}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                placeholder="As it should appear on your ID"
                value={name}
              />
              <FieldError id={`${ids}-name`} message={shown.name} />
            </label>
            <label className="block min-w-0">
              <span className={label}>Academic ID</span>
              <input
                aria-describedby={shown.academicId ? `${ids}-aid` : undefined}
                aria-invalid={Boolean(shown.academicId)}
                autoComplete="off"
                className={`${input} tabular-nums tracking-[.06em]`}
                dir="ltr"
                inputMode="numeric"
                maxLength={20}
                onChange={(event) => setAcademicId(event.target.value)}
                placeholder="الرقم الأكاديمي"
                value={academicId}
              />
              <FieldError id={`${ids}-aid`} message={shown.academicId} />
            </label>
            <div className="col-span-full">
              <Choice name="position" legend="Position" options={STORE_POSITIONS.map((item) => ({ value: item, label: item }))} value={position} onChange={setPosition} error={shown.position} />
            </div>
            <div className="col-span-full">
              <Choice name="committee" legend="Committee" options={STORE_COMMITTEES.map((item) => ({ value: item.value, label: item.label }))} value={committee} onChange={setCommittee} error={shown.committee} />
            </div>
            {edition === "full" ? (
              <div className="col-span-full">
                <Choice name="size" legend="Vest size" options={STORE_VEST_SIZES.map((item) => ({ value: item, label: item }))} value={vestSize} onChange={setVestSize} error={shown.vestSize} />
              </div>
            ) : null}
          </div>
          <label aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            Website
            <input autoComplete="off" onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} value={website} />
          </label>
        </Step>
      </div>

      {/* The slip: fills live, then gets stamped with the reservation code. */}
      <aside aria-live="polite" className="sticky top-[calc(var(--site-header-clearance,112px)+8px)] max-[960px]:static">
        <div className="relative overflow-hidden rounded-[22px] bg-[var(--site-night-2)] shadow-[inset_0_0_0_1px_var(--site-glass-border)]">
          <div className="flex items-center justify-between gap-3 px-[clamp(20px,2.2vw,30px)] pt-[clamp(20px,2.2vw,28px)]">
            <p className={label}>Reservation slip</p>
            <p className="m-0 text-[.66rem] tabular-nums tracking-[.12em] text-[var(--site-sky-ink)]">{done ? done.code : "ITC-·····"}</p>
          </div>
          <dl className="m-0 grid gap-0 px-[clamp(20px,2.2vw,30px)] pt-5">
            {slipRows.map(([key, value]) => (
              <div className="flex items-baseline justify-between gap-4 py-2.5 shadow-[inset_0_-1px_0_rgb(255_255_255_/_.05)]" key={key}>
                <dt className="text-[.64rem] uppercase tracking-[.12em] text-[var(--site-mist)]">{key}</dt>
                <dd className={`m-0 min-w-0 truncate text-right text-[.82rem] ${value === "—" ? "text-[var(--site-mist)]" : "text-[var(--site-ink)]"}`}>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-end justify-between gap-3 px-[clamp(20px,2.2vw,30px)] pt-6">
            <span className="text-[.64rem] uppercase tracking-[.12em] text-[var(--site-mist)]">Total</span>
            <strong className="text-[clamp(2rem,3vw,2.8rem)] font-normal leading-none tracking-[-.07em]">{edition === "id" ? "EGP 0" : `EGP ${STORE_BUNDLE_PRICE_EGP}`}</strong>
          </div>

          {/* Perforation */}
          <div aria-hidden="true" className="relative mt-7 h-px [background:repeating-linear-gradient(90deg,rgb(255_255_255_/_.14)_0_6px,transparent_6px_12px)]">
            <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-[var(--site-night)]" />
            <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-[var(--site-night)]" />
          </div>

          <div className="px-[clamp(20px,2.2vw,30px)] pt-6 pb-[clamp(20px,2.2vw,28px)]">
            {done ? (
              <div>
                <p className="m-0 text-[.6rem] uppercase tracking-[.16em] text-[var(--site-sky-ink)]">{done.stored ? "Reserved · saved to the club sheet" : "Reserved"}</p>
                <p className="mt-3 mb-0 text-[clamp(2.2rem,3.6vw,3.2rem)] leading-none tracking-[-.04em] tabular-nums">{done.code}</p>
                <p className="mt-4 mb-0 text-[.76rem] leading-[1.75] text-[var(--site-copy)]">
                  {done.whatsappUrl ? "Opening WhatsApp — send the message with:" : "Keep this code. The team will reach out to collect:"}
                </p>
                <ol className="mt-3 mb-0 grid list-none gap-2 p-0">
                  {attachments.map((item, index) => (
                    <li className="flex gap-3 text-[.76rem] text-[var(--site-ink)]" key={item.en}>
                      <span className="tabular-nums text-[var(--site-sky-ink)]">0{index + 1}</span>
                      <span>
                        {item.en}
                        <span className="block font-[family-name:var(--font-alexandria)] text-[.7rem] text-[var(--site-mist)]" dir="rtl" lang="ar">
                          {item.ar}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                {done.whatsappUrl ? (
                  <a
                    className="group/wa mt-6 inline-flex min-h-[56px] w-full items-center justify-between gap-4 rounded-full bg-[var(--site-sky)] px-6 text-[.78rem] font-semibold text-[var(--site-night)]! transition hover:bg-[var(--site-sky-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink)]"
                    href={done.whatsappUrl}
                  >
                    <span>Continue on WhatsApp</span>
                    <span aria-hidden="true" className="transition-transform duration-500 group-hover/wa:rotate-45">↗</span>
                  </a>
                ) : null}
              </div>
            ) : (
              <div>
                <p className={label}>Next, on WhatsApp</p>
                <ol className="mt-3 mb-0 grid list-none gap-2 p-0">
                  {attachments.map((item, index) => (
                    <li className="flex gap-3 text-[.74rem] text-[var(--site-copy)]" key={item.en}>
                      <span className="tabular-nums text-[var(--site-sky-ink)]">0{index + 1}</span>
                      <span>{item.en}</span>
                    </li>
                  ))}
                </ol>
                <button
                  className="group/order relative mt-6 inline-flex min-h-[56px] w-full items-center justify-between gap-4 overflow-hidden rounded-full bg-[var(--site-sky)] px-6 text-[.78rem] font-semibold text-[var(--site-night)] transition hover:bg-[var(--site-sky-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--site-sky-ink)] disabled:cursor-wait disabled:opacity-70 motion-reduce:transition-none"
                  disabled={status === "sending"}
                  type="submit"
                >
                  <span>{status === "sending" ? "Reserving…" : "Reserve my kit"}</span>
                  <span aria-hidden="true" className="transition-transform duration-500 group-hover/order:rotate-45">↗</span>
                </button>
                {status === "error" ? (
                  <p className="mt-3 mb-0 text-[.7rem] text-[rgb(255_150_150)]" role="alert">
                    {message}
                  </p>
                ) : null}
                <p className="mt-4 mb-0 font-[family-name:var(--font-alexandria)] text-[.7rem] leading-[1.8] text-[var(--site-mist)]" dir="rtl" lang="ar">
                  الحجز لشخص واحد. بعد الحجز هتتحول على واتساب تبعت صورتك والسكرين بالكود.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}
