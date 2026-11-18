"use client";

import {
  Activity,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  FilePlus2,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Megaphone,
  MonitorPlay,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createClient } from "../../../utils/supabase/client";
import type {
  ContentData,
  ContentEntry,
  ContentKind,
  ContentStatus,
} from "../../../lib/site-content/types";
import styles from "./admin-content.module.css";

type EntryView = ContentEntry & {
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
};

type FormModel = {
  title: string;
  subtitle: string;
  summary: string;
  body: string;
  arabicTitle: string;
  image: string;
  href: string;
  committee: string;
  role: string;
  date: string;
  time: string;
  location: string;
  email: string;
  category: string;
  responsibilitiesText: string;
  tagsText: string;
  linksText: string;
  alumni: boolean;
};

type EntryMeta = {
  slug: string;
  sortOrder: string;
  featured: boolean;
  publishAt: string;
  unpublishAt: string;
};

type CollectionResult = {
  entries: EntryView[];
  total: number;
  configured: boolean;
};

type ApiErrorShape = { error?: string; message?: string; code?: string };
type ConfirmIntent =
  | { action: "publish"; entry: EntryView; form: FormModel; meta: EntryMeta; changes: string[] }
  | { action: "archive"; entry: EntryView }
  | { action: "unpublish"; entry: EntryView }
  | { action: "restore"; entry: EntryView }
  | { action: "seed" };

type SectionKey = "overview" | "member" | "board" | "track" | "event" | "sponsor" | "announcement" | "page";
type StatusFilter = "all" | ContentStatus;

const PAGE_SIZE = 50;
const CONTENT_KINDS: ContentKind[] = [
  "member",
  "board",
  "track",
  "event",
  "sponsor",
  "announcement",
  "page",
];

const KIND_META: Record<ContentKind, { label: string; plural: string; description: string; number: string }> = {
  member: { label: "Team member", plural: "Team members", description: "People, roles, responsibilities and alumni profiles.", number: "01" },
  board: { label: "Board", plural: "Boards & committees", description: "The teams and working groups that shape the club.", number: "02" },
  track: { label: "Track", plural: "Tracks", description: "Learning paths and areas of practice across the club.", number: "03" },
  event: { label: "Event", plural: "Events", description: "Upcoming and past club events, with dates and practical details.", number: "04" },
  sponsor: { label: "Sponsor", plural: "Sponsors & partners", description: "Approved partner profiles, logos and partnership links.", number: "05" },
  announcement: { label: "Announcement", plural: "Announcements", description: "News and time-bound updates for the public site.", number: "06" },
  page: { label: "Page", plural: "Pages", description: "Selected editorial pages and home-page content blocks.", number: "07" },
};

const NAV: Array<{ key: SectionKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "member", label: "Team & Boards", icon: UsersRound },
  { key: "track", label: "Tracks", icon: Activity },
  { key: "event", label: "Events", icon: Clock3 },
  { key: "sponsor", label: "Sponsors", icon: Tag },
  { key: "announcement", label: "Announcements", icon: Megaphone },
  { key: "page", label: "Pages", icon: Newspaper },
];

const EMPTY_FORM: FormModel = {
  title: "",
  subtitle: "",
  summary: "",
  body: "",
  arabicTitle: "",
  image: "",
  href: "",
  committee: "",
  role: "",
  date: "",
  time: "",
  location: "",
  email: "",
  category: "",
  responsibilitiesText: "",
  tagsText: "",
  linksText: "",
  alumni: false,
};

function formFromEntry(entry: EntryView | null): FormModel {
  if (!entry) return { ...EMPTY_FORM };
  const data = entry.data;
  return {
    title: data.title ?? "",
    subtitle: data.subtitle ?? "",
    summary: data.summary ?? "",
    body: data.body ?? "",
    arabicTitle: data.arabicTitle ?? "",
    image: data.image ?? "",
    href: data.href ?? "",
    committee: data.committee ?? "",
    role: data.role ?? "",
    date: data.date ?? "",
    time: data.time ?? "",
    location: data.location ?? "",
    email: data.email ?? "",
    category: data.category ?? "",
    responsibilitiesText: (data.responsibilities ?? []).join("\n"),
    tagsText: (data.tags ?? []).join(", "),
    linksText: (data.links ?? []).map((link) => `${link.label} | ${link.href}`).join("\n"),
    alumni: Boolean(data.alumni),
  };
}

function parseLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseLinks(value: string): Array<{ label: string; href: string }> {
  return parseLines(value).map((line) => {
    const splitAt = line.indexOf("|");
    if (splitAt < 0) return { label: line.trim(), href: line.trim() };
    return {
      label: line.slice(0, splitAt).trim(),
      href: line.slice(splitAt + 1).trim(),
    };
  }).filter((link) => link.label && link.href);
}

function toContentData(model: FormModel): ContentData {
  const optionalFields = [
    "subtitle",
    "summary",
    "body",
    "arabicTitle",
    "image",
    "href",
    "committee",
    "role",
    "date",
    "time",
    "location",
    "email",
    "category",
  ] as const;
  const data: ContentData = { title: model.title.trim() };
  for (const key of optionalFields) {
    const value = model[key].trim();
    if (value) data[key] = value;
  }
  const responsibilities = parseLines(model.responsibilitiesText);
  const tags = model.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean);
  const links = parseLinks(model.linksText);
  if (responsibilities.length) data.responsibilities = responsibilities;
  if (tags.length) data.tags = tags;
  if (links.length) data.links = links;
  if (model.alumni) data.alumni = true;
  return data;
}

function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function makeSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function dateLabel(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

function niceStatus(status: ContentStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function compactError(status: number, body?: ApiErrorShape, purpose?: "read" | "save" | "upload"): string {
  if (status === 401) return "Your owner session has expired. Sign in again to continue.";
  if (status === 403) return "This account does not have owner access to the site content workspace.";
  if (status === 404) return "This content item is no longer available. Reload the list to continue.";
  if (status === 409) return "This item changed elsewhere while you were editing. Reload the latest revision before saving again.";
  if (status === 413) return "That image is larger than the 5 MiB upload limit.";
  if (status === 415) return "Choose a PNG, JPEG or WebP image.";
  if (status === 503 && purpose === "upload") return "Image storage is not configured yet. No file was uploaded.";
  if (status === 503) return "The content database is not configured yet. The workspace is read-only until setup is complete.";
  if (status === 400 && (body?.error || body?.message)) {
    const message = (body.error || body.message || "").trim();
    if (message.length > 0 && message.length < 240) return message;
  }
  if (purpose === "read") return "The content list could not be loaded. Please try again.";
  if (purpose === "upload") return "The image could not be uploaded. Please check the file and try again.";
  return "That change could not be saved. Please try again.";
}

function statusClass(status: ContentStatus): string {
  if (status === "published") return styles.statusPublished;
  if (status === "archived") return styles.statusArchived;
  return styles.statusDraft;
}

async function readError(response: Response, purpose?: "read" | "save" | "upload"): Promise<string> {
  let body: ApiErrorShape | undefined;
  try {
    body = await response.json() as ApiErrorShape;
  } catch {
    body = undefined;
  }
  return compactError(response.status, body, purpose);
}

async function fetchCollection(kind: ContentKind, offset: number): Promise<CollectionResult> {
  const response = await fetch(
    `/api/site-admin/content?kind=${encodeURIComponent(kind)}&limit=${PAGE_SIZE}&offset=${offset}`,
    { method: "GET", cache: "no-store", headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(await readError(response, "read"));
  const payload = await response.json() as {
    ok?: boolean;
    entries?: EntryView[];
    total?: number;
    configured?: boolean;
  };
  if (!payload.ok || !Array.isArray(payload.entries)) {
    throw new Error("The content service returned an unexpected response. Please retry.");
  }
  return {
    entries: payload.entries,
    total: Number.isFinite(payload.total) ? Number(payload.total) : payload.entries.length,
    configured: payload.configured === true,
  };
}

function ContentMark() {
  return (
    <div className={styles.brandMark} aria-hidden="true">
      <span>IT</span><i>·</i>
    </div>
  );
}

function Overview({
  onOpen,
  onSeed,
  configured,
  summary,
  loading,
  onRefresh,
}: {
  onOpen: (kind: ContentKind) => void;
  onSeed: () => void;
  configured: boolean | null;
  summary: Partial<Record<ContentKind, number>>;
  loading: boolean;
  onRefresh: () => void;
}) {
  const total = CONTENT_KINDS.reduce((sum, kind) => sum + (summary[kind] ?? 0), 0);
  return (
    <div className={styles.overview}>
      <section className={styles.welcomePanel} aria-labelledby="overview-heading">
        <div className={styles.welcomeCopy}>
          <span className={styles.eyebrow}><span className={styles.eyebrowDot} /> IT CLUB / CONTENT STUDIO</span>
          <h2 id="overview-heading">Make the public site <em>feel alive.</em></h2>
          <p>Keep the people, work and moments behind IT Club clear, current and ready to publish.</p>
          <div className={styles.welcomeActions}>
            <button className={styles.buttonPrimary} onClick={() => onOpen("member")} type="button">
              <UsersRound size={16} /> Manage the team <ArrowRight size={15} />
            </button>
            <button className={styles.buttonQuiet} onClick={() => onOpen("event")} type="button">
              Open events <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <div className={styles.welcomeMotif} aria-hidden="true">
          <div className={styles.motifOrbit}><span /><span /><span /></div>
          <div className={styles.motifWord}>BUILD<br />TOGETHER</div>
          <span className={styles.motifIndex}>BATU · IT CLUB</span>
        </div>
      </section>

      <section className={styles.setupStrip} aria-live="polite">
        <div className={`${styles.setupIndicator} ${configured === false ? styles.setupMuted : ""}`}>
          {configured === true ? <CheckCircle2 size={17} /> : configured === false ? <CircleHelp size={17} /> : <LoaderCircle size={17} className={styles.spin} />}
        </div>
        <div className={styles.setupText}>
          <strong>{configured === true ? "Content storage connected" : configured === false ? "Read-only setup mode" : "Checking content setup"}</strong>
          <span>{configured === true ? "Changes go through the owner-verified CMS service." : configured === false ? "The API is returning committed reference content. Nothing can be saved until the CMS database is configured." : "Checking the private content API; no content is written automatically."}</span>
        </div>
        <div className={styles.setupActions}>
          {configured === true ? (
            <button type="button" className={styles.buttonSubtle} onClick={onSeed}><Sparkles size={15} /> Import vetted seed</button>
          ) : configured === false ? (
            <button type="button" className={styles.buttonSubtleDisabled} disabled title="Database setup is required before importing seed records."><Sparkles size={15} /> Seed unavailable</button>
          ) : null}
          <button type="button" className={styles.iconButton} onClick={onRefresh} aria-label="Refresh content setup" title="Refresh"><RefreshCw size={15} /></button>
        </div>
      </section>

      <section className={styles.sectionBlock} aria-labelledby="content-overview-heading">
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionKicker}>YOUR CONTENT LIBRARY</span>
            <h3 id="content-overview-heading">A clear view of the club</h3>
          </div>
          <div className={styles.libraryCount}>
            <span>{loading ? "…" : total}</span>
            <small>records in service</small>
          </div>
        </div>
        <div className={styles.kindGrid}>
          {CONTENT_KINDS.map((kind) => (
            <button type="button" className={styles.kindTile} key={kind} onClick={() => onOpen(kind)}>
              <span className={styles.kindIndex}>{KIND_META[kind].number}</span>
              <span className={styles.kindTileText}><strong>{KIND_META[kind].plural}</strong><small>{KIND_META[kind].description}</small></span>
              <span className={styles.kindTotal}>{loading ? "—" : summary[kind] ?? "—"}</span>
              <ArrowUpRight className={styles.kindArrow} size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
        <p className={styles.countNote}><CircleHelp size={13} /> Totals come from the content service; setup mode may show only vetted reference records.</p>
      </section>

      <section className={styles.principleBar} aria-label="Publishing guidance">
        <span className={styles.principleIcon}><ShieldCheck size={17} /></span>
        <p><strong>Draft with care. Publish with intent.</strong> A saved edit to a published item stays private until you explicitly publish it.</p>
        <span className={styles.arabicAccent} lang="ar" dir="rtl">من الفكرة إلى الأثر</span>
      </section>
    </div>
  );
}

function ContentPreview({ entry, model, kind }: { entry: EntryView | null; model: FormModel; kind: ContentKind }) {
  const title = model.title || "Untitled draft";
  const image = model.image.trim();
  const subtitle = model.subtitle.trim();
  const summary = model.summary.trim();
  const body = model.body.trim();
  const isPerson = kind === "member";
  const isEvent = kind === "event";
  const isSponsor = kind === "sponsor";
  const isEditorial = kind === "page" || kind === "announcement" || kind === "track" || kind === "board";
  return (
    <div className={styles.previewContent}>
      <div className={styles.previewTopline}><span className={styles.previewBadge}><Eye size={12} /> Preview draft</span><span className={styles.previewStatus}>Not published</span></div>
      <article className={`${styles.publicPreview} ${isPerson ? styles.personPreview : ""}`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- CMS image URLs are owner-managed and cannot be statically allow-listed.
          <img src={image} alt="" className={styles.previewImage} />
        ) : <div className={`${styles.previewPlaceholder} ${isPerson ? styles.personPlaceholder : ""}`} aria-hidden="true"><span>{isPerson ? "IC" : isEvent ? "FIELD NOTES" : isSponsor ? "PARTNER" : KIND_META[kind].label.toUpperCase()}</span><i>IT CLUB</i></div>}
        <div className={styles.previewArticleBody}>
          {isEvent && <span className={styles.previewCategory}>{model.category || "EVENT"}</span>}
          {isPerson && <span className={styles.previewCategory}>{model.committee || "TEAM"}</span>}
          {isSponsor && <span className={styles.previewCategory}>{model.category || "PARTNER"}</span>}
          {model.arabicTitle && <p className={styles.previewArabic} lang="ar" dir="rtl">{model.arabicTitle}</p>}
          <h3>{title}</h3>
          {subtitle && <p className={styles.previewSubtitle}>{subtitle}</p>}
          {isPerson && (model.role || model.committee) && <div className={styles.previewMeta}>{[model.role, model.committee].filter(Boolean).join(" · ")}</div>}
          {isEvent && <div className={styles.previewMeta}>{[model.date, model.time, model.location].filter(Boolean).join(" · ") || "Date and location will appear here"}</div>}
          {summary && <p className={styles.previewSummary}>{summary}</p>}
          {isPerson && model.responsibilitiesText.trim() && <p className={styles.previewSummary}>{parseLines(model.responsibilitiesText)[0]}</p>}
          {isEditorial && body && <p className={styles.previewBody}>{body}</p>}
          {isSponsor && model.href && <span className={styles.previewLink}>Visit partner <ArrowUpRight size={12} /></span>}
          {entry && <small className={styles.previewRevision}>Owner preview · revision {entry.revision}</small>}
        </div>
      </article>
      <p className={styles.previewFootnote}>This private preview reflects unsaved form values. It does not query or alter public pages.</p>
    </div>
  );
}

function ConfirmDialog({
  intent,
  pending,
  onCancel,
  onConfirm,
  changes,
  error,
  conflict,
  onReloadConflict,
}: {
  intent: ConfirmIntent;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  changes: string[];
  error: string;
  conflict: boolean;
  onReloadConflict: () => void;
}) {
  const title = intent.action === "publish" ? "Publish this content?" : intent.action === "archive" ? "Archive this item?" : intent.action === "restore" ? "Restore this item as a draft?" : intent.action === "unpublish" ? "Unpublish this item?" : "Import vetted starter content?";
  let description = "";
  if (intent.action === "publish") description = "The current editor version will replace the public snapshot after the server confirms it is publish-ready.";
  if (intent.action === "archive") description = "This item will be archived and removed from public visibility. You can still review its record in the archive.";
  if (intent.action === "unpublish") description = "This item will be removed from the public site and returned to draft status.";
  if (intent.action === "restore") description = "This item will return to the draft workspace only. It will not appear publicly until it passes review and you publish it.";
  if (intent.action === "seed") description = "The server will import approved starter records idempotently. Existing editor changes will not be overwritten.";
  const entry = intent.action === "seed" ? null : intent.entry;
  const finalTitle = intent.action === "seed" ? "Approved content only" : intent.action === "publish" ? intent.form.title || "Untitled draft" : entry?.data.title || "Untitled item";
  return (
    <div className={styles.modalScrim} onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onCancel(); }}>
      <section className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className={styles.dialogIcon}>{intent.action === "archive" ? <Archive size={19} /> : intent.action === "unpublish" ? <EyeOff size={19} /> : intent.action === "seed" ? <Sparkles size={19} /> : <CheckCircle2 size={19} />}</div>
        <button type="button" className={styles.dialogClose} onClick={onCancel} aria-label="Close confirmation" disabled={pending}><X size={17} /></button>
        <span className={styles.dialogKicker}>OWNER ACTION / CONFIRM</span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <div className={styles.confirmSummary}>
          <small>{intent.action === "seed" ? "IMPORT SCOPE" : intent.action === "publish" ? "CONTENT TO PUBLISH" : "SELECTED CONTENT"}</small>
          <strong>{finalTitle}</strong>
          {intent.action === "publish" && changes.length > 0 && <ul>{changes.slice(0, 5).map((change) => <li key={change}>{change}</li>)}</ul>}
          {intent.action === "publish" && changes.length > 5 && <small>Plus {changes.length - 5} more changed fields</small>}
          {entry && <span>{KIND_META[entry.kind].label} · /{intent.action === "publish" ? intent.meta.slug : entry.slug} · {niceStatus(entry.status)}</span>}
          {intent.action === "seed" && <span>Safe, repeatable import · no silent overwrite</span>}
        </div>
        {error && <div className={styles.dialogError} role="alert" aria-live="assertive"><AlertCircle size={14} /><span>{error}</span></div>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.buttonSecondary} onClick={onCancel} disabled={pending}>Cancel</button>
          {conflict && <button type="button" className={styles.buttonSecondary} onClick={onReloadConflict} disabled={pending}><RefreshCw size={14} /> Reload latest</button>}
          <button type="button" className={`${styles.buttonPrimary} ${intent.action === "archive" ? styles.dangerButton : ""}`} onClick={onConfirm} disabled={pending || conflict}>
            {pending ? <LoaderCircle size={15} className={styles.spin} /> : intent.action === "archive" ? <Archive size={15} /> : intent.action === "unpublish" ? <EyeOff size={15} /> : intent.action === "seed" ? <Sparkles size={15} /> : <Check size={15} />}
            {pending ? "Working…" : intent.action === "publish" ? "Publish now" : intent.action === "archive" ? "Archive item" : intent.action === "restore" ? "Restore as draft" : intent.action === "unpublish" ? "Unpublish now" : "Import verified seed"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={htmlFor}>{label}{required && <span aria-hidden="true" className={styles.requiredMark}>*</span>}</label>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
      {error && <span className={styles.fieldError} id={`${htmlFor}-error`}>{error}</span>}
    </div>
  );
}

function ContentEditor({
  kind,
  entry,
  readOnly,
  uploading,
  onUpload,
  onClose,
  onSave,
  onPublish,
  onArchive,
  onUnpublish,
  onRestore,
  onPreview,
  onConflictReload,
}: {
  kind: ContentKind;
  entry: EntryView | null;
  readOnly: boolean;
  uploading: boolean;
  onUpload: (file: File) => Promise<string>;
  onClose: () => void;
  onSave: (payload: { form: FormModel; meta: EntryMeta }) => Promise<void>;
  onPublish: (form: FormModel, meta: EntryMeta) => void;
  onArchive: () => void;
  onUnpublish: () => void;
  onRestore: () => void;
  onPreview: (form: FormModel) => void;
  onConflictReload: () => void;
}) {
  const [form, setForm] = useState(() => formFromEntry(entry));
  const [meta, setMeta] = useState<EntryMeta>(() => ({
    slug: entry?.slug ?? "",
    sortOrder: String(entry?.sort_order ?? 0),
    featured: entry?.featured ?? false,
    publishAt: toLocalInput(entry?.publish_at),
    unpublishAt: toLocalInput(entry?.unpublish_at),
  }));
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, startSaving] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(entry));
  const imageInput = useRef<HTMLInputElement>(null);
  const titleId = "cms-content-title";
  const canWrite = !readOnly && !saving;
  const titleBefore = entry?.data.title ?? "";

  const setField = <K extends keyof FormModel>(key: K, value: FormModel[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFieldErrors((previous) => ({ ...previous, [key]: "" }));
  };
  const setMetaField = <K extends keyof EntryMeta>(key: K, value: EntryMeta[K]) => {
    setMeta((previous) => ({ ...previous, [key]: value }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = "Add a clear English title before saving.";
    if (!meta.slug.trim()) errors.slug = "A URL-safe slug is required.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug.trim())) errors.slug = "Use lowercase letters, numbers and hyphens only.";
    if (!Number.isFinite(Number(meta.sortOrder))) errors.sortOrder = "Enter a valid order number.";
    for (const [key, value, label] of [["href", form.href, "Link"], ["image", form.image, "Image URL"]] as const) {
      if (value.trim()) {
        try {
          const parsed = new URL(value.trim(), window.location.origin);
          if (!(["https:", "http:"].includes(parsed.protocol))) errors[key] = `${label} must use http or https.`;
        } catch {
          errors[key] = `${label} must be a valid URL.`;
        }
      }
    }
    for (const link of parseLinks(form.linksText)) {
      try {
        const parsed = new URL(link.href, window.location.origin);
        if (!(["https:", "http:"].includes(parsed.protocol))) errors.linksText = "Profile links must use http or https.";
      } catch {
        errors.linksText = "Each profile link needs a valid http or https URL.";
      }
    }
    if (meta.publishAt && !fromLocalInput(meta.publishAt)) errors.publishAt = "Enter a valid publish time.";
    if (meta.unpublishAt && !fromLocalInput(meta.unpublishAt)) errors.unpublishAt = "Enter a valid end time.";
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError("Review the highlighted fields before saving.");
      return false;
    }
    return true;
  };

  const submitSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;
    startSaving(async () => {
      try {
        await onSave({ form, meta });
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "The change could not be saved. Please retry.");
      }
    });
  };

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Choose an image no larger than 5 MiB.");
      return;
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setFormError("Choose a PNG, JPEG or WebP image.");
      return;
    }
    setFormError("");
    try {
      const imageUrl = await onUpload(file);
      setField("image", imageUrl);
      setFieldErrors((previous) => ({ ...previous, image: "" }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "The image could not be uploaded.");
    }
  };

  const requestPublish = () => {
    if (!validate()) return;
    onPublish(form, meta);
  };

  const publishEnabled = !readOnly && Boolean(entry) && entry?.status !== "archived" && !saving;
  const changed = entry ? JSON.stringify(form) !== JSON.stringify(formFromEntry(entry)) || meta.slug !== entry.slug || Number(meta.sortOrder) !== entry.sort_order || meta.featured !== entry.featured : false;
  return (
    <div className={styles.editorLayer} role="dialog" aria-modal="true" aria-labelledby="editor-heading">
      <div className={styles.editorScrim} onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }} />
      <section className={styles.editorPanel}>
        <header className={styles.editorHeader}>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close editor" disabled={saving}><ArrowLeft size={17} /></button>
          <div className={styles.editorHeaderTitle}>
            <span className={styles.editorKicker}>{entry ? `EDIT / ${KIND_META[kind].label.toUpperCase()}` : `NEW / ${KIND_META[kind].label.toUpperCase()}`}</span>
            <h2 id="editor-heading">{entry ? entry.data.title : `New ${KIND_META[kind].label.toLowerCase()}`}</h2>
          </div>
          {entry && <span className={`${styles.statusPill} ${statusClass(entry.status)}`}>{niceStatus(entry.status)}</span>}
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close editor" disabled={saving}><X size={17} /></button>
        </header>
        {entry?.status === "published" && <div className={styles.privateDraftNote}><ShieldCheck size={16} /><span><strong>Live content stays unchanged.</strong> Saving here updates the private editor copy; publish explicitly when it is ready.</span></div>}
        {readOnly && <div className={styles.readOnlyNote}><CircleHelp size={16} /><span>Read-only setup mode. You can review this record, but the CMS API is not configured for edits.</span></div>}
        {formError && <div className={styles.formAlert} role="alert" aria-live="assertive"><AlertCircle size={16} /><span>{formError}</span>{formError.startsWith("Conflict:") && <button type="button" className={styles.buttonSecondary} onClick={onConflictReload}><RefreshCw size={13} /> Reload latest</button>}</div>}
        <form className={styles.editorForm} onSubmit={submitSave} noValidate>
          <div className={styles.formLayout}>
            <div className={styles.formMain}>
              <section className={styles.formSection} aria-labelledby="details-section-heading">
                <div className={styles.formSectionHeading}><span>01</span><div><h3 id="details-section-heading">The story</h3><p>Write for the public site. English is the primary language.</p></div></div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fullField}>
                    <Field label="Title" htmlFor={titleId} required error={fieldErrors.title}>
                      <input id={titleId} className={styles.input} value={form.title} onChange={(event) => {
                        const nextTitle = event.target.value;
                        setForm((previous) => ({ ...previous, title: nextTitle }));
                        if (!slugTouched && !entry) setMeta((previous) => ({ ...previous, slug: makeSlug(nextTitle) }));
                        setFieldErrors((previous) => ({ ...previous, title: "" }));
                      }} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? `${titleId}-error` : undefined} disabled={!canWrite} />
                    </Field>
                  </div>
                  <div className={styles.fullField}>
                    <Field label="Short line" htmlFor="cms-subtitle" hint="Optional. A concise secondary line.">
                      <input id="cms-subtitle" className={styles.input} value={form.subtitle} onChange={(event) => setField("subtitle", event.target.value)} disabled={!canWrite} />
                    </Field>
                  </div>
                  <div className={styles.fullField}>
                    <Field label="Summary" htmlFor="cms-summary" hint="A short introduction used in cards and page previews.">
                      <textarea id="cms-summary" className={`${styles.input} ${styles.textareaCompact}`} value={form.summary} onChange={(event) => setField("summary", event.target.value)} rows={3} disabled={!canWrite} />
                    </Field>
                  </div>
                  {(kind === "page" || kind === "announcement" || kind === "track" || kind === "board") && <div className={styles.fullField}>
                    <Field label={kind === "page" ? "Page content" : "About this item"} htmlFor="cms-body" hint="Plain text; line breaks are preserved in the preview.">
                      <textarea id="cms-body" className={`${styles.input} ${styles.textareaBody}`} value={form.body} onChange={(event) => setField("body", event.target.value)} rows={8} disabled={!canWrite} />
                    </Field>
                  </div>}
                  <div className={styles.fullField}>
                    <Field label="Arabic title" htmlFor="cms-arabic-title" hint="Optional; rendered right-to-left when present.">
                      <input id="cms-arabic-title" className={`${styles.input} ${styles.arabicInput}`} value={form.arabicTitle} onChange={(event) => setField("arabicTitle", event.target.value)} dir="rtl" lang="ar" disabled={!canWrite} />
                    </Field>
                  </div>
                </div>
              </section>

              {kind === "member" && <section className={styles.formSection} aria-labelledby="member-section-heading">
                <div className={styles.formSectionHeading}><span>02</span><div><h3 id="member-section-heading">The person</h3><p>Make their role and contribution understandable.</p></div></div>
                <div className={styles.fieldGrid}>
                  <Field label="Role" htmlFor="cms-role"><input id="cms-role" className={styles.input} value={form.role} onChange={(event) => setField("role", event.target.value)} disabled={!canWrite} /></Field>
                  <Field label="Board / committee" htmlFor="cms-committee"><input id="cms-committee" className={styles.input} value={form.committee} onChange={(event) => setField("committee", event.target.value)} disabled={!canWrite} /></Field>
                  <div className={styles.fullField}><Field label="Responsibilities" htmlFor="cms-responsibilities" hint="One responsibility per line. Leave blank if it has not been approved yet."><textarea id="cms-responsibilities" className={`${styles.input} ${styles.textareaCompact}`} value={form.responsibilitiesText} onChange={(event) => setField("responsibilitiesText", event.target.value)} rows={4} disabled={!canWrite} /></Field></div>
                  <Field label="Email" htmlFor="cms-email"><input id="cms-email" type="email" className={styles.input} value={form.email} onChange={(event) => setField("email", event.target.value)} disabled={!canWrite} /></Field>
                  <Field label="Profile links" htmlFor="cms-links" hint="One per line: label | https://…" error={fieldErrors.linksText}><textarea id="cms-links" className={`${styles.input} ${styles.textareaCompact}`} value={form.linksText} onChange={(event) => setField("linksText", event.target.value)} rows={3} disabled={!canWrite} aria-invalid={Boolean(fieldErrors.linksText)} aria-describedby={fieldErrors.linksText ? "cms-links-error" : undefined} /></Field>
                  <div className={styles.fullField}><label className={styles.checkLabel}><input type="checkbox" checked={form.alumni} onChange={(event) => setField("alumni", event.target.checked)} disabled={!canWrite} /><span className={styles.checkBox}><Check size={12} /></span><span><strong>Alumni profile</strong><small>Include this person in alumni content when published.</small></span></label></div>
                </div>
              </section>}

              {kind === "board" && <section className={styles.formSection} aria-labelledby="board-section-heading">
                <div className={styles.formSectionHeading}><span>02</span><div><h3 id="board-section-heading">Team structure</h3><p>Describe the unit without inventing unverified responsibilities.</p></div></div>
                <div className={styles.fieldGrid}>
                  <Field label="Board / committee name" htmlFor="cms-committee"><input id="cms-committee" className={styles.input} value={form.committee} onChange={(event) => setField("committee", event.target.value)} disabled={!canWrite} /></Field>
                  <Field label="Lead role or focus" htmlFor="cms-role"><input id="cms-role" className={styles.input} value={form.role} onChange={(event) => setField("role", event.target.value)} disabled={!canWrite} /></Field>
                  <div className={styles.fullField}><Field label="Responsibilities" htmlFor="cms-responsibilities" hint="One responsibility per line."><textarea id="cms-responsibilities" className={`${styles.input} ${styles.textareaCompact}`} value={form.responsibilitiesText} onChange={(event) => setField("responsibilitiesText", event.target.value)} rows={4} disabled={!canWrite} /></Field></div>
                </div>
              </section>}

              {(kind === "event" || kind === "sponsor") && <section className={styles.formSection} aria-labelledby="specific-section-heading">
                <div className={styles.formSectionHeading}><span>02</span><div><h3 id="specific-section-heading">{kind === "event" ? "Event details" : "Partner details"}</h3><p>{kind === "event" ? "Keep date, location and destination information accurate." : "Only use approved partner names and links."}</p></div></div>
                <div className={styles.fieldGrid}>
                  {kind === "event" ? <>
                    <Field label="Date" htmlFor="cms-date"><input id="cms-date" type="date" className={styles.input} value={form.date} onChange={(event) => setField("date", event.target.value)} disabled={!canWrite} /></Field>
                    <Field label="Time" htmlFor="cms-time"><input id="cms-time" type="time" className={styles.input} value={form.time} onChange={(event) => setField("time", event.target.value)} disabled={!canWrite} /></Field>
                    <Field label="Location" htmlFor="cms-location"><input id="cms-location" className={styles.input} value={form.location} onChange={(event) => setField("location", event.target.value)} disabled={!canWrite} /></Field>
                    <Field label="Category" htmlFor="cms-category"><input id="cms-category" className={styles.input} value={form.category} onChange={(event) => setField("category", event.target.value)} disabled={!canWrite} placeholder="Workshop, talk…" /></Field>
                  </> : <>
                    <Field label="Partnership category" htmlFor="cms-category"><input id="cms-category" className={styles.input} value={form.category} onChange={(event) => setField("category", event.target.value)} disabled={!canWrite} placeholder="Community partner…" /></Field>
                    <Field label="Contact email" htmlFor="cms-email"><input id="cms-email" type="email" className={styles.input} value={form.email} onChange={(event) => setField("email", event.target.value)} disabled={!canWrite} /></Field>
                  </>}
                  <div className={styles.fullField}><Field label={kind === "event" ? "Registration / details URL" : "Partner website"} htmlFor="cms-href" error={fieldErrors.href}>
                    <input id="cms-href" type="text" inputMode="url" className={styles.input} value={form.href} onChange={(event) => setField("href", event.target.value)} disabled={!canWrite} placeholder="https:// or /same-site-path" aria-invalid={Boolean(fieldErrors.href)} aria-describedby={fieldErrors.href ? "cms-href-error" : undefined} />
                  </Field></div>
                </div>
              </section>}

              {(kind === "track" || kind === "announcement" || kind === "page") && <section className={styles.formSection} aria-labelledby="classification-section-heading">
                <div className={styles.formSectionHeading}><span>02</span><div><h3 id="classification-section-heading">Classification</h3><p>Help editors and visitors understand where this belongs.</p></div></div>
                <div className={styles.fieldGrid}>
                  {(kind === "track" || kind === "announcement") && <Field label={kind === "track" ? "Board / committee" : "Category"} htmlFor={kind === "track" ? "cms-committee" : "cms-category"}>
                    <input id={kind === "track" ? "cms-committee" : "cms-category"} className={styles.input} value={kind === "track" ? form.committee : form.category} onChange={(event) => setField(kind === "track" ? "committee" : "category", event.target.value)} disabled={!canWrite} />
                  </Field>}
                  {kind === "track" && <Field label="Tags" htmlFor="cms-tags" hint="Separate tags with commas."><input id="cms-tags" className={styles.input} value={form.tagsText} onChange={(event) => setField("tagsText", event.target.value)} disabled={!canWrite} /></Field>}
                  {kind === "page" && <Field label="Page category" htmlFor="cms-category"><input id="cms-category" className={styles.input} value={form.category} onChange={(event) => setField("category", event.target.value)} disabled={!canWrite} /></Field>}
                  <div className={styles.fullField}><Field label="Destination URL" htmlFor="cms-href" error={fieldErrors.href}>
                    <input id="cms-href" type="text" inputMode="url" className={styles.input} value={form.href} onChange={(event) => setField("href", event.target.value)} disabled={!canWrite} placeholder="https:// or /same-site-path" aria-invalid={Boolean(fieldErrors.href)} aria-describedby={fieldErrors.href ? "cms-href-error" : undefined} />
                  </Field></div>
                </div>
              </section>}

              <section className={styles.formSection} aria-labelledby="media-section-heading">
                <div className={styles.formSectionHeading}><span>{kind === "member" || kind === "board" || kind === "event" || kind === "sponsor" ? "03" : "03"}</span><div><h3 id="media-section-heading">Visual & metadata</h3><p>Use approved artwork; uploads are limited to 5 MiB PNG, JPEG or WebP.</p></div></div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fullField}><Field label="Image URL" htmlFor="cms-image" error={fieldErrors.image}>
                    <div className={styles.imageInputRow}>
                      <input id="cms-image" type="text" inputMode="url" className={styles.input} value={form.image} onChange={(event) => setField("image", event.target.value)} disabled={!canWrite} placeholder="https:// or existing public asset path" aria-invalid={Boolean(fieldErrors.image)} aria-describedby={fieldErrors.image ? "cms-image-error" : undefined} />
                      <button type="button" className={styles.buttonSecondary} onClick={() => imageInput.current?.click()} disabled={!canWrite || uploading}><Upload size={14} />{uploading ? "Uploading" : "Upload"}</button>
                      <input ref={imageInput} className={styles.visuallyHidden} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} disabled={!canWrite || uploading} aria-label="Upload PNG, JPEG or WebP image up to 5 MiB" />
                    </div>
                  </Field></div>
                </div>
              </section>

              <section className={styles.formSection} aria-labelledby="publishing-section-heading">
                <div className={styles.formSectionHeading}><span>04</span><div><h3 id="publishing-section-heading">Publishing</h3><p>New content starts as a draft. Publishing is always a separate action.</p></div></div>
                <div className={styles.fieldGrid}>
                  <div className={styles.fullField}><Field label="Slug" htmlFor="cms-slug" required error={fieldErrors.slug} hint="URL-safe identifier; changing a live slug can affect its public address.">
                    <input id="cms-slug" className={styles.input} value={meta.slug} onChange={(event) => { setSlugTouched(true); setMetaField("slug", event.target.value.toLowerCase()); }} disabled={!canWrite} aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={fieldErrors.slug ? "cms-slug-error" : undefined} />
                  </Field></div>
                  {kind === "page" && <div className={styles.fullField}><p className={styles.fieldHint}>Published public route: <strong>/pages/{meta.slug || "your-slug"}</strong></p></div>}
                  <Field label="Sort order" htmlFor="cms-sort" error={fieldErrors.sortOrder}><input id="cms-sort" type="number" step="1" className={styles.input} value={meta.sortOrder} onChange={(event) => setMetaField("sortOrder", event.target.value)} disabled={!canWrite} aria-invalid={Boolean(fieldErrors.sortOrder)} aria-describedby={fieldErrors.sortOrder ? "cms-sort-error" : undefined} /></Field>
                  <div className={styles.fullField}><label className={styles.checkLabel}><input type="checkbox" checked={meta.featured} onChange={(event) => setMetaField("featured", event.target.checked)} disabled={!canWrite} /><span className={styles.checkBox}><Check size={12} /></span><span><strong>Feature this item</strong><small>Use only when it deserves a prominent placement.</small></span></label></div>
                  <Field label="Publish from" htmlFor="cms-publish-at" hint="Optional scheduled visibility time." error={fieldErrors.publishAt}><input id="cms-publish-at" type="datetime-local" className={styles.input} value={meta.publishAt} onChange={(event) => setMetaField("publishAt", event.target.value)} disabled={!canWrite} /></Field>
                  <Field label="Unpublish after" htmlFor="cms-unpublish-at" hint="Optional end of visibility window." error={fieldErrors.unpublishAt}><input id="cms-unpublish-at" type="datetime-local" className={styles.input} value={meta.unpublishAt} onChange={(event) => setMetaField("unpublishAt", event.target.value)} disabled={!canWrite} /></Field>
                </div>
                <div className={styles.scheduleNotice}><Clock3 size={15} /><span>Dates are passed to the CMS API in ISO format. Confirm the local time zone before scheduling a public update.</span></div>
              </section>
            </div>

            <aside className={styles.editorAside}>
              <div className={styles.asideCard}>
                <span className={styles.asideLabel}>CONTENT CHECK</span>
                <div className={styles.asideItem}><span className={form.title.trim() ? styles.checkComplete : styles.checkPending}>{form.title.trim() ? <Check size={12} /> : "01"}</span><span><strong>Clear title</strong><small>{form.title.trim() ? "Ready" : "Required to save"}</small></span></div>
                <div className={styles.asideItem}><span className={meta.slug.trim() ? styles.checkComplete : styles.checkPending}>{meta.slug.trim() ? <Check size={12} /> : "02"}</span><span><strong>Unique URL slug</strong><small>{meta.slug ? `/${meta.slug}` : "Required to save"}</small></span></div>
                <div className={styles.asideItem}><span className={form.summary.trim() ? styles.checkComplete : styles.checkPending}>{form.summary.trim() ? <Check size={12} /> : "03"}</span><span><strong>Public summary</strong><small>{form.summary.trim() ? "Added" : "Optional but useful"}</small></span></div>
                <button type="button" className={styles.previewButton} onClick={() => onPreview(form)}><MonitorPlay size={15} /> Preview draft <ArrowUpRight size={14} /></button>
              </div>
              {entry && <div className={styles.asideCard}>
                <span className={styles.asideLabel}>RECORD STATUS</span>
                <div className={styles.statusAside}><span className={`${styles.statusPill} ${statusClass(entry.status)}`}>{niceStatus(entry.status)}</span><small>Revision {entry.revision}</small></div>
                <div className={styles.dateAside}><span>Published</span><strong>{entry.published_at ? dateLabel(entry.published_at) : entry.status === "published" ? "Date not recorded" : "Not published"}</strong></div>
                <div className={styles.dateAside}><span>Last edited</span><strong>{entry.updated_at ? dateLabel(entry.updated_at) : "Date not recorded"}</strong></div>
                {changed && <p className={styles.unsavedHint}><span /> Unsaved edits</p>}
              </div>}
              {entry?.status === "archived" && <div className={styles.archivedAside}><Archive size={17} /><strong>Archived item</strong><span>Restore it to the private draft workspace before editing or publishing again.</span></div>}
              {titleBefore && titleBefore !== form.title && <div className={styles.changeHint}><ArrowRight size={14} /><span>Title update<br /><strong>{titleBefore}</strong> → <strong>{form.title || "(empty)"}</strong></span></div>}
            </aside>
          </div>

          <footer className={styles.editorFooter}>
            <div className={styles.footerMeta}>{entry ? <><span className={`${styles.statusDot} ${statusClass(entry.status)}`} /> {niceStatus(entry.status)} · revision {entry.revision}</> : <><FilePlus2 size={14} /> New records are saved as drafts.</>}</div>
            <div className={styles.footerActions}>
              {entry?.status === "published" && <button type="button" className={styles.buttonDangerQuiet} onClick={onUnpublish} disabled={!canWrite}><EyeOff size={14} /> Unpublish</button>}
              {entry?.status === "archived" && <button type="button" className={styles.buttonSecondary} onClick={onRestore} disabled={!canWrite}><RefreshCw size={14} /> Restore as draft</button>}
              {entry && entry.status !== "archived" && <button type="button" className={styles.buttonDangerQuiet} onClick={onArchive} disabled={!canWrite}><Archive size={14} /> Archive</button>}
              {publishEnabled && <button type="button" className={styles.buttonPrimary} onClick={requestPublish} disabled={!canWrite}><CheckCircle2 size={15} /> Publish</button>}
              <button type="submit" className={styles.buttonSave} disabled={!canWrite}>{saving ? <LoaderCircle size={15} className={styles.spin} /> : <Check size={15} />}{saving ? "Saving…" : entry ? "Save changes" : "Save draft"}</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function AdminContentConsole() {
  const [section, setSection] = useState<SectionKey>("overview");
  const [teamKind, setTeamKind] = useState<"member" | "board">("member");
  const [entries, setEntries] = useState<EntryView[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [summary, setSummary] = useState<Partial<Record<ContentKind, number>>>({});
  const [loading, startLoading] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<EntryView | null | undefined>(undefined);
  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ kind: ContentKind; entry: EntryView | null; form: FormModel } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorReloadToken, setEditorReloadToken] = useState(0);
  const [conflict, setConflict] = useState(false);
  const activeKind: ContentKind = section === "member" ? teamKind : section === "overview" ? "member" : section;
  const currentCollection = section !== "overview";

  const loadKind = useCallback(async (kind: ContentKind, nextPage = 0, quiet = false) => {
    if (!quiet) setError("");
    try {
      const result = await fetchCollection(kind, nextPage * PAGE_SIZE);
      setEntries(result.entries);
      setTotal(result.total);
      setConfigured(result.configured);
      setPage(nextPage);
      setConflict(false);
      return result;
    } catch (caught) {
      if (!quiet) setError(caught instanceof Error ? caught.message : "The content list could not be loaded.");
      throw caught;
    }
  }, []);

  const refreshKind = useCallback((kind = activeKind, nextPage = page) => {
    startLoading(async () => {
      try { await loadKind(kind, nextPage); } catch { /* The visible error is set by loadKind. */ }
    });
  }, [activeKind, page, loadKind]);

  useEffect(() => {
    if (!currentCollection) return;
    startLoading(async () => {
      try { await loadKind(activeKind, 0); } catch { /* The visible error is set by loadKind. */ }
    });
  }, [activeKind, currentCollection, loadKind]);

  const loadSummary = useCallback(async () => {
    const values: Partial<Record<ContentKind, number>> = {};
    try {
      const results = await Promise.all(CONTENT_KINDS.map(async (kind) => {
        const collection = await fetchCollection(kind, 0);
        return [kind, collection.total, collection.configured] as const;
      }));
      for (const [kind, count] of results) values[kind] = count;
      setSummary(values);
      setConfigured(results.every((result) => result[2]));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Content setup could not be checked.");
    }
  }, []);

  const summaryLoading = Object.keys(summary).length === 0 && !error;

  // This is an intentional async read; loadSummary updates UI only after its API promises settle.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (section === "overview") void loadSummary();
  }, [section, loadSummary]);

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    const query = search.trim().toLocaleLowerCase();
    const matchesQuery = !query || [entry.data.title, entry.slug, entry.data.summary, entry.data.committee, entry.data.category]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(query));
    return matchesStatus && matchesQuery;
  }), [entries, search, statusFilter]);

  const selectSection = (next: SectionKey) => {
    setSection(next);
    setSearch("");
    setStatusFilter("all");
    setPage(0);
    setNotice("");
    setError("");
    if (next === "member") setTeamKind("member");
  };

  const openKind = (kind: ContentKind) => {
    if (kind === "member" || kind === "board") {
      setTeamKind(kind);
      setSection("member");
    } else {
      setSection(kind);
    }
    setSearch("");
    setStatusFilter("all");
    setPage(0);
    setSelectedEntry(undefined);
    setError("");
  };

  const closeEditor = () => setSelectedEntry(undefined);

  const compareChanges = (entry: EntryView | null, form: FormModel): string[] => {
    if (!entry) return ["New draft content will be made public after publication."];
    const current = formFromEntry(entry);
    const labels: Array<[keyof FormModel, string]> = [
      ["title", "Title"], ["subtitle", "Short line"], ["summary", "Summary"], ["body", "Body"],
      ["arabicTitle", "Arabic title"], ["image", "Image"], ["href", "Destination URL"],
      ["committee", "Board / committee"], ["role", "Role"], ["date", "Event date"],
      ["time", "Event time"], ["location", "Location"], ["email", "Email"],
      ["category", "Category"], ["responsibilitiesText", "Responsibilities"],
      ["tagsText", "Tags"], ["linksText", "Profile links"], ["alumni", "Alumni designation"],
    ];
    return labels.filter(([key]) => current[key] !== form[key]).map(([, label]) => label);
  };

  const performSave = async ({ form, meta }: { form: FormModel; meta: EntryMeta }) => {
    if (configured === false) throw new Error("The content database is not configured. This workspace is read-only; no save was attempted.");
    const bodyData = {
      slug: meta.slug.trim(),
      sort_order: Number(meta.sortOrder),
      featured: meta.featured,
      publish_at: fromLocalInput(meta.publishAt),
      unpublish_at: fromLocalInput(meta.unpublishAt),
      data: toContentData(form),
    };
    const response = selectedEntry
      ? await fetch(`/api/site-admin/content/${encodeURIComponent(selectedEntry.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ revision: selectedEntry.revision, ...bodyData, action: "save" }),
        })
      : await fetch("/api/site-admin/content", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ kind: activeKind, ...bodyData }),
        });
    if (response.status === 409) {
      setConflict(true);
      throw new Error("Conflict: this item changed since it was loaded. Reload the latest revision before saving again; your form values have been kept.");
    }
    if (!response.ok) throw new Error(await readError(response, "save"));
    const payload = await response.json() as { ok?: boolean; entry?: EntryView };
    if (!payload.ok || !payload.entry) throw new Error("The save response was incomplete. Refresh the list before making another change.");
    const saved = payload.entry;
    setSelectedEntry(saved);
    setEntries((previous) => {
      const existing = previous.some((item) => item.id === saved.id);
      return existing ? previous.map((item) => item.id === saved.id ? saved : item) : [saved, ...previous];
    });
    if (!selectedEntry) setTotal((previous) => previous + 1);
    setNotice(saved.status === "published" ? "Private editor version saved. The public snapshot is unchanged until you publish." : "Draft saved. It is still private and has not been published.");
  };

  const performIntent = async () => {
    if (!confirmIntent) return;
    setActionPending(true);
    setError("");
    try {
      if (confirmIntent.action === "seed") {
        const response = await fetch("/api/site-admin/seed", { method: "POST", headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(await readError(response, "save"));
        setNotice("Vetted seed import completed. Existing editor-managed records were left unchanged.");
        await loadSummary();
        if (currentCollection) await loadKind(activeKind, 0, true);
      } else {
        const action = confirmIntent.action;
        const entry = confirmIntent.entry;
        const mutation = confirmIntent.action === "publish"
          ? {
              revision: entry.revision,
              slug: confirmIntent.meta.slug.trim(),
              sort_order: Number(confirmIntent.meta.sortOrder),
              featured: confirmIntent.meta.featured,
              publish_at: fromLocalInput(confirmIntent.meta.publishAt),
              unpublish_at: fromLocalInput(confirmIntent.meta.unpublishAt),
              data: toContentData(confirmIntent.form),
              action,
            }
          : { revision: entry.revision, action };
        const response = await fetch(`/api/site-admin/content/${encodeURIComponent(entry.id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(mutation),
        });
        if (response.status === 409) {
          setConflict(true);
          throw new Error("Conflict: the item has a newer revision. Reload it before retrying this action.");
        }
        if (!response.ok) throw new Error(await readError(response, "save"));
        const payload = await response.json() as { ok?: boolean; entry?: EntryView };
        setNotice(action === "publish" ? "Published. The public content snapshot is now updated." : action === "archive" ? "Archived and removed from the public site." : action === "restore" ? "Restored to private draft status. Nothing was published." : "Unpublished and removed from the public site.");
        setSelectedEntry(payload.entry ?? undefined);
        if (payload.entry) setEntries((previous) => previous.map((item) => item.id === payload.entry?.id ? payload.entry! : item));
        else await loadKind(activeKind, page, true);
      }
      setConfirmIntent(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The action could not be completed.");
    } finally {
      setActionPending(false);
    }
  };

  const uploadImage = async (file: File) => {
    if (configured === false) throw new Error("Image storage is not configured. No file was uploaded.");
    const body = new FormData();
    body.append("file", file);
    setUploading(true);
    try {
      const response = await fetch("/api/site-admin/upload", { method: "POST", body, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(await readError(response, "upload"));
      const payload = await response.json() as { ok?: boolean; url?: string };
      if (!payload.ok || !payload.url) throw new Error("The upload service did not return an image URL. No image was added.");
      setNotice("Image uploaded. Save the content record to keep the new image URL.");
      return payload.url;
    } finally {
      setUploading(false);
    }
  };

  const reloadConflict = async () => {
    if (!selectedEntry) {
      await loadKind(activeKind, page);
      setSelectedEntry(undefined);
      return;
    }
    try {
      const collection = await fetchCollection(activeKind, page * PAGE_SIZE);
      setEntries(collection.entries);
      setTotal(collection.total);
      setConfigured(collection.configured);
      const latest = collection.entries.find((candidate) => candidate.id === selectedEntry.id);
      if (latest) setSelectedEntry(latest);
      else setSelectedEntry(undefined);
      setEditorReloadToken((token) => token + 1);
      setConflict(false);
      setError("");
      setNotice(latest ? "Latest revision loaded. Unsaved form edits were discarded." : "This item is no longer on the current page.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The latest revision could not be loaded.");
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      if (preview) setPreview(null);
      else if (confirmIntent && !actionPending) setConfirmIntent(null);
      else if (selectedEntry !== undefined) closeEditor();
    }
  };

  const title = section === "overview" ? "Overview" : section === "member" ? "Team & Boards" : NAV.find((item) => item.key === section)?.label ?? "Content";
  const currentEntriesLabel = section === "member" ? KIND_META[teamKind].plural : KIND_META[activeKind].plural;

  return (
    <div className={`${styles.adminShell} ${sidebarCollapsed ? styles.isCollapsed : ""}`} onKeyDown={handleKeyDown}>
      <aside className={styles.sidebar} aria-label="CMS navigation">
        <div className={styles.brandBlock}>
          <ContentMark />
          <div className={styles.brandText}><strong>IT CLUB</strong><span>CONTENT STUDIO</span></div>
          <button type="button" className={styles.collapseButton} onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"} title={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"}>{sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button>
        </div>
        <div className={styles.workspaceLabel}><span>WORKSPACE</span><i>OWNER ONLY</i></div>
        <nav className={styles.navList}>
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = key === "member" ? section === "member" : key === section;
            return <button type="button" key={key} onClick={() => selectSection(key)} className={`${styles.navLink} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined} title={sidebarCollapsed ? label : undefined}>
              <Icon size={17} strokeWidth={active ? 2.1 : 1.7} /><span className={styles.navLabel}>{label}</span>{key === "member" && <span className={styles.navCount}>{summary.member ?? "—"}</span>}{active && <span className={styles.navActiveMark} />}
            </button>;
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarRule} />
          <span className={styles.workspaceLabel}>CONTENT ONLY · NO INTERVIEW DATA</span>
          <div className={styles.securityBadge}><span><ShieldCheck size={15} /></span><div><strong>Private by design</strong><small>Verified server access</small></div></div>
          <div className={styles.sidebarArabic} lang="ar" dir="rtl">نصنع مجتمعًا يتعلّم ويعمل معًا</div>
        </div>
      </aside>

      <main className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>IT CLUB</span><ChevronRight size={13} /><span>CONTENT STUDIO</span><ChevronRight size={13} /><strong>{title.toUpperCase()}</strong></div>
          <div className={styles.topbarRight}>
            <span className={styles.secureSession}><span /> OWNER SESSION</span>
            <a href="/auth/signout" className={styles.signOutLink} aria-label="Sign out">Sign out <ArrowUpRight size={13} /></a>
          </div>
        </header>
        <div className={styles.mainScroll}>
          <div className={styles.pageHeading}>
            <div><span className={styles.pageEyebrow}>{section === "overview" ? "A PUBLIC SITE, MADE BY PEOPLE" : `${KIND_META[activeKind].number} / CONTENT MANAGEMENT`}</span><h1>{title}<span>.</span></h1><p>{section === "overview" ? "Manage the stories the world sees — and keep everything else safely in draft." : section === "member" ? "People, teams and the work they do together." : KIND_META[activeKind].description}</p></div>
            {section !== "overview" && <button type="button" className={styles.buttonPrimary} onClick={() => { setSelectedEntry(null); setError(""); setNotice(""); }}><Plus size={16} /> New {KIND_META[activeKind].label.toLowerCase()}</button>}
          </div>
          {notice && <div className={styles.noticeBar} role="status" aria-live="polite"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}><X size={15} /></button></div>}
          {error && <div className={styles.errorBar} role="alert" aria-live="assertive"><AlertCircle size={16} /><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={() => setError("")}><X size={15} /></button></div>}
          {conflict && <div className={styles.conflictBar} role="alert"><div><strong>Newer revision detected.</strong><span>We kept your unsaved values. Reloading replaces them with the latest version.</span></div><button className={styles.buttonSecondary} type="button" onClick={() => void reloadConflict()}><RefreshCw size={14} /> Reload latest</button></div>}

          {section === "overview" ? <Overview onOpen={openKind} onSeed={() => setConfirmIntent({ action: "seed" })} configured={configured} summary={summary} loading={summaryLoading} onRefresh={() => void loadSummary()} /> : <>
            {section === "member" && <div className={styles.teamSwitch} role="tablist" aria-label="Choose team content type">
              <button type="button" role="tab" aria-selected={teamKind === "member"} onClick={() => { setTeamKind("member"); setPage(0); setSearch(""); }}><UsersRound size={14} /> Members</button>
              <button type="button" role="tab" aria-selected={teamKind === "board"} onClick={() => { setTeamKind("board"); setPage(0); setSearch(""); }}><LayoutDashboard size={14} /> Boards & committees</button>
            </div>}
            <section className={styles.collectionPanel} aria-labelledby="collection-title">
              <div className={styles.collectionHead}>
                <div><span className={styles.collectionKicker}>CONTENT REGISTER</span><h2 id="collection-title">{currentEntriesLabel}<small>{total} total</small></h2><p>Filter this 50-item page, open a record, then save privately or publish intentionally.</p></div>
                <button type="button" className={styles.iconButton} onClick={() => refreshKind(activeKind, page)} aria-label="Refresh this list" title="Refresh list"><RefreshCw size={15} className={loading ? styles.spin : ""} /></button>
              </div>
              {configured === false && <div className={styles.readOnlyInline}><CircleHelp size={16} /><span><strong>Setup is not complete.</strong> Reference records can be reviewed, but create, edit, publish and upload actions are disabled.</span></div>}
              <div className={styles.collectionToolbar}>
                <label className={styles.searchBox}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${currentEntriesLabel.toLowerCase()}…`} aria-label={`Search ${currentEntriesLabel.toLowerCase()}`} /><kbd>/</kbd></label>
                <div className={styles.statusFilters} role="group" aria-label="Filter by status">
                  {(["all", "published", "draft", "archived"] as StatusFilter[]).map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={statusFilter === status ? styles.filterActive : ""} aria-pressed={statusFilter === status}>{status === "all" ? "All" : niceStatus(status)}</button>)}
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.contentTable}>
                  <thead><tr><th scope="col">CONTENT</th><th scope="col">STATUS</th><th scope="col">PUBLISHED</th><th scope="col">LAST EDITED</th><th scope="col" className={styles.actionColumn}><span className={styles.visuallyHidden}>Actions</span></th></tr></thead>
                  <tbody>
                    {loading && entries.length === 0 ? <tr><td colSpan={5}><div className={styles.loadingRow}><LoaderCircle size={18} className={styles.spin} /> Loading content…</div></td></tr> : filteredEntries.length === 0 ? <tr><td colSpan={5}><div className={styles.emptyState}><div className={styles.emptyIcon}>{entries.length ? <Search size={19} /> : <FilePlus2 size={19} />}</div><h3>{entries.length ? "No matching items" : `No ${currentEntriesLabel.toLowerCase()} yet`}</h3><p>{entries.length ? "Try a different search term or status filter." : "Start with a draft. The public site remains unchanged until you publish it."}</p>{!entries.length && <button type="button" className={styles.buttonSecondary} onClick={() => setSelectedEntry(null)} disabled={configured === false}><Plus size={14} /> Create first draft</button>}</div></td></tr> : filteredEntries.map((entry, index) => {
                      const pubDate = entry.published_at || (entry.status === "published" ? null : null);
                      const editedDate = entry.updated_at || entry.created_at || null;
                      return <tr key={entry.id} onDoubleClick={() => setSelectedEntry(entry)}>
                        <td><button type="button" className={styles.entryTitleButton} onClick={() => { setSelectedEntry(entry); setError(""); setNotice(""); }}><span className={styles.rowIndex}>{String(page * PAGE_SIZE + index + 1).padStart(2, "0")}</span><span className={styles.entryTitleCell}><strong>{entry.data.title || "Untitled item"}</strong><small>/{entry.slug}{entry.featured ? <i>FEATURED</i> : null}</small></span></button></td>
                        <td><span className={`${styles.statusPill} ${statusClass(entry.status)}`}><span className={styles.statusDot} />{niceStatus(entry.status)}</span></td>
                        <td><span className={styles.tableDate}>{pubDate ? dateLabel(pubDate) : entry.status === "published" ? <span title="The API response does not include a published-at timestamp">Not recorded</span> : "—"}</span></td>
                        <td><span className={styles.tableDate}>{editedDate ? dateLabel(editedDate) : <span title="The API response does not include an edit timestamp">Not recorded</span>}</span></td>
                        <td className={styles.actionColumn}><button type="button" className={styles.rowAction} onClick={() => { setSelectedEntry(entry); setError(""); }} aria-label={`Edit ${entry.data.title}`} title="Edit"><ArrowUpRight size={15} /></button></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <footer className={styles.tableFooter}>
                <span>{filteredEntries.length ? `Showing ${page * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE + entries.length, total)} of ${total}` : `0 matches · ${total} total`}{search || statusFilter !== "all" ? " on this page" : ""}</span>
                <div className={styles.pagination}><button type="button" aria-label="Previous page" disabled={page === 0 || loading} onClick={() => refreshKind(activeKind, page - 1)}><ChevronLeft size={15} /></button><span>Page {page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><button type="button" aria-label="Next page" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => refreshKind(activeKind, page + 1)}><ChevronRight size={15} /></button></div>
              </footer>
            </section>
          </>}
          <footer className={styles.pageFooter}><span>IT CLUB · CONTENT STUDIO</span><span>PUBLIC CONTENT ONLY <i /> OWNER VERIFIED</span></footer>
        </div>
      </main>

      {selectedEntry !== undefined && <ContentEditor
        key={`${selectedEntry?.id ?? `new-${activeKind}`}-${editorReloadToken}`}
        kind={activeKind}
        entry={selectedEntry}
        readOnly={configured === false}
        uploading={uploading}
        onUpload={uploadImage}
        onClose={closeEditor}
        onSave={performSave}
        onPublish={(form, meta) => {
          if (!selectedEntry) return;
          setConfirmIntent({
            action: "publish",
            entry: selectedEntry,
            form,
            meta,
            changes: [
              ...compareChanges(selectedEntry, form),
              ...(meta.slug !== selectedEntry.slug ? ["URL slug"] : []),
              ...(Number(meta.sortOrder) !== selectedEntry.sort_order ? ["Sort order"] : []),
              ...(meta.featured !== selectedEntry.featured ? ["Featured placement"] : []),
              ...(fromLocalInput(meta.publishAt) !== selectedEntry.publish_at ? ["Publish timing"] : []),
              ...(fromLocalInput(meta.unpublishAt) !== selectedEntry.unpublish_at ? ["Unpublish timing"] : []),
            ],
          });
        }}
        onArchive={() => selectedEntry && setConfirmIntent({ action: "archive", entry: selectedEntry })}
        onUnpublish={() => selectedEntry && setConfirmIntent({ action: "unpublish", entry: selectedEntry })}
        onRestore={() => selectedEntry && setConfirmIntent({ action: "restore", entry: selectedEntry })}
        onPreview={(form) => setPreview({ kind: activeKind, entry: selectedEntry ?? null, form })}
        onConflictReload={() => void reloadConflict()}
      />}

      {preview && <div className={styles.previewModalScrim} onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
        <section className={styles.previewDialog} role="dialog" aria-modal="true" aria-labelledby="preview-heading">
          <header className={styles.previewDialogHeader}><div><span className={styles.dialogKicker}>PRIVATE OWNER VIEW</span><h2 id="preview-heading">Site preview</h2></div><button type="button" className={styles.iconButton} onClick={() => setPreview(null)} aria-label="Close preview"><X size={17} /></button></header>
          <div className={styles.previewDevice}><div className={styles.previewBrowser}><span /><span /><span /><small>itclub.one / {preview.entry?.slug || makeSlug(preview.form.title) || "new-content"}</small></div><ContentPreview entry={preview.entry} model={preview.form} kind={preview.kind} /></div>
          <footer className={styles.previewDialogFooter}><p><ShieldCheck size={14} /> Owner-only preview · no public query parameter or preview bypass.</p><button type="button" className={styles.buttonSecondary} onClick={() => setPreview(null)}>Close preview</button></footer>
        </section>
      </div>}

      {confirmIntent && <ConfirmDialog intent={confirmIntent} pending={actionPending} onCancel={() => setConfirmIntent(null)} onConfirm={() => void performIntent()} changes={confirmIntent.action === "publish" ? confirmIntent.changes : []} error={error} conflict={conflict} onReloadConflict={() => { setConfirmIntent(null); void reloadConflict(); }} />}
    </div>
  );
}

function OwnerLoginUnavailable() {
  return <main className={styles.loginPage}>
    <div className={styles.loginGlow} aria-hidden="true" />
    <section className={styles.loginCard}>
      <div className={styles.loginBrand}><ContentMark /><div><strong>IT CLUB</strong><span>CONTENT STUDIO</span></div></div>
      <span className={styles.loginKicker}>PRIVATE OWNER WORKSPACE</span>
      <h1>Sign in to manage<br /><em>what the world sees.</em></h1>
      <div className={styles.loginConfigNotice} role="status"><CircleHelp size={18} /><div><strong>Configuration not ready</strong><p>Owner sign-in is unavailable until the Supabase public URL and publishable key are configured. This private workspace has no demo account or preview access.</p></div></div>
      <a href="/interview/login" className={styles.loginSecondaryLink}>Staff interview portal <ArrowUpRight size={14} /></a>
    </section>
    <div className={styles.loginFooter}><span>OWNER ACCESS ONLY</span><span>IT CLUB · BATU</span></div>
  </main>;
}

export function OwnerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const configReady = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!configReady) return <OwnerLoginUnavailable />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError("Enter a valid owner email address.");
      return;
    }
    if (!password) {
      setFieldError("Enter your password.");
      return;
    }
    setPending(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError("Unable to sign in. Check your credentials and try again.");
        setPending(false);
        return;
      }

      const verification = await fetch("/api/auth/verify-staff", { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
      if (!verification.ok) {
        await supabase.auth.signOut();
        setError(verification.status === 503
          ? "Owner verification is not available because required configuration is missing. No CMS access was granted."
          : "This account is not verified as an IT Club owner. Use the interview portal if you have staff access.");
        setPending(false);
        return;
      }
      const identity = await verification.json() as {
        ok?: boolean;
        role?: string;
        passwordChangeRequired?: boolean;
        isTempPasswordExpired?: boolean;
      };
      if (identity.role !== "owner") {
        await supabase.auth.signOut();
        setError("This account is not an IT Club owner. CMS access is restricted to owner accounts.");
        setPending(false);
        return;
      }

      if (identity.isTempPasswordExpired || identity.passwordChangeRequired) {
        const query = new URLSearchParams({ next: "/admin" });
        if (identity.isTempPasswordExpired) query.set("error", "expired");
        router.replace(`/interview/change-password?${query.toString()}`);
        router.refresh();
        return;
      }

      // This owner-only login always returns to the CMS root; user-supplied next values are ignored.
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Sign-in could not be completed. Please retry when your connection is available.");
      setPending(false);
    }
  };

  return <main className={styles.loginPage}>
    <div className={styles.loginGlow} aria-hidden="true" />
    <div className={styles.loginRail}><span>BATU · A COMMUNITY IN MOTION</span><span>EST. IT CLUB</span></div>
    <section className={styles.loginCard} aria-labelledby="owner-login-heading">
      <div className={styles.loginBrand}><ContentMark /><div><strong>IT CLUB</strong><span>CONTENT STUDIO</span></div><span className={styles.ownerTag}><LockKeyhole size={12} /> OWNER ONLY</span></div>
      <span className={styles.loginKicker}>PUBLIC SITE / MANAGEMENT</span>
      <h1 id="owner-login-heading">Sign in to manage<br /><em>what the world sees.</em></h1>
      <p className={styles.loginIntro}>A private space for the people responsible for the club’s public story.</p>
      {error && <div className={styles.loginError} role="alert" aria-live="assertive"><AlertCircle size={16} /><span>{error}</span></div>}
      <form className={styles.loginForm} onSubmit={(event) => void submit(event)} noValidate>
        <Field label="Owner email" htmlFor="owner-email" error={fieldError && !email ? fieldError : undefined}>
          <input id="owner-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} className={styles.input} value={email} onChange={(event) => { setEmail(event.target.value); setFieldError(""); setError(""); }} disabled={pending} aria-invalid={Boolean(fieldError && !email)} />
        </Field>
        <Field label="Password" htmlFor="owner-password" error={fieldError && email && !password ? fieldError : undefined}>
          <div className={styles.passwordField}><input id="owner-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className={styles.input} value={password} onChange={(event) => { setPassword(event.target.value); setFieldError(""); setError(""); }} disabled={pending} aria-invalid={Boolean(fieldError && email && !password)} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} disabled={pending}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
        </Field>
        {fieldError && email && password && <div className={styles.loginFieldError} role="alert">{fieldError}</div>}
        <button type="submit" className={styles.loginSubmit} disabled={pending}>{pending ? <LoaderCircle size={16} className={styles.spin} /> : <LogIn size={16} />}{pending ? "Verifying owner access…" : "Sign in securely"}<ArrowRight size={15} /></button>
      </form>
      <div className={styles.loginSecurity}><ShieldCheck size={15} /><span>Sign-in is verified against the staff database. Only the <strong>owner</strong> role can continue.</span></div>
      <div className={styles.loginBottom}><a href="/interview/login">Need interview operations? Go to staff sign-in <ArrowUpRight size={13} /></a><span>No demo access · No public preview</span></div>
    </section>
    <div className={styles.loginFooter}><span>EDITORIAL SYSTEM · ENGLISH FIRST</span><span lang="ar" dir="rtl">فريق واحد، أثر أكبر</span><span>IT CLUB · BATU</span></div>
  </main>;
}
