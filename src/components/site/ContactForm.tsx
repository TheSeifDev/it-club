"use client";

import { useState, type FormEvent } from "react";

type FormState = "idle" | "sending" | "sent" | "error";

const formClass = "grid gap-5 text-[var(--site-ink)]";
const formGridClass =
  "grid grid-cols-2 gap-4 max-[520px]:grid-cols-1 max-[520px]:gap-5";
const fieldClass =
  "grid min-w-0 gap-[9px] text-[.8rem] leading-[1.4] font-semibold text-[var(--site-ink)]";
const controlClass =
  "w-full min-w-0 rounded-xl border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] px-4 py-[14px] text-[.98rem] leading-[1.5] font-normal text-[var(--site-ink)] [color-scheme:dark] transition-[border-color,background-color] duration-[150ms] placeholder:text-[var(--site-mist)] focus-visible:border-[var(--site-sky-ink)] focus-visible:bg-[var(--site-glass)] focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-[var(--site-sky-ink)] motion-reduce:transition-none";
const actionsClass =
  "mt-[2px] flex items-end justify-between gap-6 max-[520px]:items-stretch max-[520px]:flex-col max-[520px]:gap-5";
const privacyClass =
  "m-0 max-w-[42ch] text-[.83rem] leading-[1.65] text-[var(--site-copy)]";
const submitClass =
  "inline-flex min-h-[54px] shrink-0 items-center justify-center gap-[15px] rounded-full border-0 bg-[var(--site-sky)] py-[6px] pr-[7px] pl-[22px] text-[.88rem] font-[650] text-[var(--site-paper-dim)] transition-[background-color,transform] duration-[160ms] hover:bg-[var(--site-sky)] hover:-translate-y-0.5 focus-visible:!outline-2 focus-visible:!outline-offset-4 focus-visible:!outline-[var(--site-sky-ink)] disabled:cursor-wait disabled:opacity-[.72] max-[520px]:self-start motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const submitArrowClass =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--site-paper-dim)] text-white";
const feedbackClass =
  "m-0 rounded-xl px-4 py-[14px] text-[.9rem] leading-[1.6]";

export default function ContactForm() {
  const [status, setStatus] = useState<FormState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const subject = String(values.get("subject") ?? "general");
    const kind = subject === "partnership" || subject === "sponsorship" ? "partnership" : "contact";
    const body = {
      kind,
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      subject,
      message: String(values.get("message") ?? "").trim(),
      website: String(values.get("website") ?? "").trim(),
    };
    setStatus("sending");
    try {
      const response = await fetch("/api/site-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) throw new Error("The message endpoint did not confirm delivery.");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className={formClass} onSubmit={handleSubmit}>
      <div className={formGridClass}>
        <label className={fieldClass}>
          <span>Your name</span>
          <input className={`${controlClass} min-h-[51px]`} name="name" type="text" autoComplete="name" required maxLength={120} />
        </label>
        <label className={fieldClass}>
          <span>Email address</span>
          <input className={`${controlClass} min-h-[51px]`} name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
      </div>
      <label className={fieldClass}>
        <span>What is this about?</span>
        <select className={`${controlClass} min-h-[51px] cursor-pointer`} name="subject" defaultValue="general" required>
          <option value="general">A general question</option>
          <option value="partnership">A partnership</option>
          <option value="sponsorship">Sponsorship</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className={fieldClass}>
        <span>Your message</span>
        <textarea className={`${controlClass} min-h-[150px] resize-y`} name="message" rows={5} required maxLength={5000} />
      </label>
      <label className="sr-only" aria-hidden="true">
        Leave this field empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className={actionsClass}>
        <p className={privacyClass}>
          We&apos;ll use your details only to respond to this message. For
          anything urgent, email{" "}
          <a className="font-semibold !text-[var(--site-sky-ink)] underline decoration-[length:1px] underline-offset-[3px] focus-visible:rounded-[3px] focus-visible:!outline-2 focus-visible:!outline-offset-4 focus-visible:!outline-[var(--site-sky-ink)]" href="mailto:contact@itclub.one">contact@itclub.one</a>.
        </p>
        <button
          type="submit"
          className={submitClass}
          disabled={status === "sending"}
        >
          <span>{status === "sending" ? "Sending…" : "Send message"}</span>
          <span className={submitArrowClass} aria-hidden="true">
            ↗
          </span>
        </button>
      </div>
      {status === "sent" ? (
        <p className={`${feedbackClass} border border-[var(--site-glass-border)] bg-[rgb(40_205_183_/_10%)] text-[var(--site-sky-ink)]`} role="status">
          Your message was accepted. Thank you for reaching out.
        </p>
      ) : null}
      {status === "error" ? (
        <p className={`${feedbackClass} border border-[rgb(255_170_162_/_22%)] bg-[rgb(255_115_100_/_10%)] text-[#ffaaa2]`} role="alert">
          We couldn&apos;t confirm that your message was delivered. Please email
          contact@itclub.one directly; your message has not been marked as sent.
        </p>
      ) : null}
    </form>
  );
}
