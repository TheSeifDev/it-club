"use client";

import { ArrowUpRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import styles from "@/src/components/site/ContactEditorial.module.css";

type FormState = "idle" | "sending" | "sent" | "error";

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
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Your name</span>
          <input name="name" type="text" autoComplete="name" required maxLength={120} />
        </label>
        <label className={styles.field}>
          <span>Email address</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
      </div>
      <label className={styles.field}>
        <span>What is this about?</span>
        <select name="subject" defaultValue="general" required>
          <option value="general">A general question</option>
          <option value="partnership">A partnership</option>
          <option value="sponsorship">Sponsorship</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>Your message</span>
        <textarea name="message" rows={5} required maxLength={5000} />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        Leave this field empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className={styles.formActions}>
        <p className={styles.privacyNote}>
          We&apos;ll use your details only to respond to this message. For
          anything urgent, email{" "}
          <a href="mailto:contact@itclub.one">contact@itclub.one</a>.
        </p>
        <button
          type="submit"
          className={styles.submit}
          disabled={status === "sending"}
        >
          <span>{status === "sending" ? "Sending…" : "Send message"}</span>
          <span className={styles.submitArrow} aria-hidden="true">
            <ArrowUpRight size={16} />
          </span>
        </button>
      </div>
      {status === "sent" ? (
        <p className={`${styles.feedback} ${styles.feedbackSuccess}`} role="status">
          Your message was accepted. Thank you for reaching out.
        </p>
      ) : null}
      {status === "error" ? (
        <p className={`${styles.feedback} ${styles.feedbackError}`} role="alert">
          We couldn&apos;t confirm that your message was delivered. Please email
          contact@itclub.one directly; your message has not been marked as sent.
        </p>
      ) : null}
    </form>
  );
}
