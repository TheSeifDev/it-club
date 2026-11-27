import type { Metadata } from "next";
import { SiteFrame } from "@/src/components/site/SiteUI";
import RegisterFlow from "./RegisterFlow";

const pageDescription =
  "Tell us about yourself, your interests, and the IT Club track you would like to explore at Borg Al Arab Technological University.";

const introClass =
  "bg-transparent pt-[calc(var(--site-header-clearance,112px)_+_clamp(32px,5vw,70px))] px-[clamp(20px,3.5vw,64px)] pb-[clamp(54px,8vw,112px)] max-[760px]:pt-[calc(var(--site-header-clearance,112px)_+_36px)] max-[760px]:pb-[52px]";
const sectionLabelClass =
  "flex flex-wrap items-center gap-[9px] text-[var(--site-ink)]";
const sectionNumberClass =
  "grid h-[29px] w-[29px] place-items-center rounded-full bg-[var(--site-sky)] text-[.68rem] leading-none font-semibold text-[var(--site-paper)]";
const sectionNameClass =
  "inline-flex min-h-[29px] items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass-soft)] px-[13px] text-[.68rem] font-semibold tracking-[.045em] text-[var(--site-ink)] uppercase shadow-[inset_0_1px_0_var(--site-glass-highlight)] min-[1040px]:backdrop-blur-[6px]";
const arabicClass =
  "text-[.9rem] leading-[1.9] text-[var(--site-copy)] [font-family:inherit]";
const introGridClass =
  "mt-[clamp(48px,7vw,100px)] grid grid-cols-[minmax(0,1.2fr)_minmax(270px,.6fr)] items-end gap-[clamp(36px,8vw,130px)] max-[760px]:mt-[45px] max-[760px]:grid-cols-[minmax(0,1fr)] max-[760px]:gap-6";
const titleClass =
  "m-0 max-w-[10ch] text-[clamp(3.5rem,10vw,9rem)] font-[450] leading-[.99] tracking-[-.06em] text-[var(--site-ink)] [overflow-wrap:anywhere] max-[760px]:max-w-[9ch] max-[760px]:text-[clamp(3.4rem,15vw,6.2rem)]";
const introCopyClass =
  "max-w-[440px] pb-[.4rem] text-[clamp(1rem,1.4vw,1.15rem)] leading-[1.75] text-[var(--site-copy)] max-[760px]:max-w-[55ch] [&_p]:m-0 [&_.arabic]:mt-[17px] [&_.arabic]:text-[.94rem] [&_.arabic]:text-[var(--site-ink)]";
const badgesClass =
  "mt-[clamp(28px,4vw,46px)] flex flex-wrap gap-[10px]";
const badgeClass =
  "inline-flex min-h-[34px] items-center rounded-full border border-[var(--site-glass-border)] bg-[var(--site-glass)] px-[14px] py-[7px] text-[.68rem] font-semibold tracking-[.035em] text-[var(--site-ink)] uppercase shadow-[inset_0_1px_0_var(--site-glass-highlight)] min-[1040px]:backdrop-blur-[6px]";
const badgeAccentClass =
  "border-[color-mix(in_srgb,var(--site-sky)_36%,var(--site-glass-border))] bg-[color-mix(in_srgb,var(--site-sky)_13%,var(--site-glass))] text-[var(--site-sky-ink)]";
const formSectionClass =
  "bg-transparent pt-[clamp(48px,7vw,92px)] px-[clamp(20px,3.5vw,64px)] pb-[clamp(76px,10vw,140px)] max-[760px]:pt-[46px]";
const formLeadClass =
  "mb-[clamp(25px,4vw,44px)] [&_h2]:m-0 [&_h2]:text-[clamp(1.8rem,3vw,2.7rem)] [&_h2]:font-medium [&_h2]:leading-[1.1] [&_h2]:tracking-[-.045em] [&_h2]:text-[var(--site-ink)] [&_p:last-child]:mt-3 [&_p:last-child]:mb-0 [&_p:last-child]:max-w-[58ch] [&_p:last-child]:leading-[1.7] [&_p:last-child]:text-[var(--site-copy)]";
const formEyebrowClass =
  "mt-0 mb-2 text-[.7rem] font-[650] tracking-[.12em] text-[var(--site-sky-ink)] uppercase";
const privacyNoteClass =
  "mt-[clamp(36px,5vw,64px)] flex items-start gap-3 pt-[22px] text-[var(--site-copy)] [&_p]:m-0 [&_p]:max-w-[80ch] [&_p]:text-[.78rem] [&_p]:leading-[1.7]";

export const metadata: Metadata = {
  title: "Apply to IT Club",
  description: pageDescription,
  openGraph: {
    title: "Apply to IT Club",
    description: pageDescription,
    url: "/register",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apply to IT Club",
    description: pageDescription,
  },
};

export default function RegisterPage() {
  return (
    <SiteFrame>
      <div className="bg-transparent text-[var(--site-ink)]">
        <section className={introClass} aria-labelledby="register-title">
          <div className={sectionLabelClass}>
            <span className={sectionNumberClass}>05</span>
            <span className={sectionNameClass}>Application</span>
            <span className={arabicClass} lang="ar" dir="rtl">
              استمارة التقديم
            </span>
          </div>

          <div className={introGridClass}>
            <h1 className={titleClass} id="register-title">
              There’s room for you to <em className="text-[var(--site-sky-ink)] not-italic">grow.</em>
            </h1>
            <div className={introCopyClass}>
              <p>
                Tell us what you are curious about and what you hope to learn.
                You do not need to be an expert to apply—bring your interest and
                your willingness to grow with the IT Club community.
              </p>
              <p className="arabic" lang="ar" dir="rtl">
                مش لازم تكون خبير عشان تقدم. عرّفنا بنفسك وبالمجال اللي حابب
                تتعلمه وتساهم فيه مع نادي تكنولوجيا المعلومات.
              </p>
            </div>
          </div>

          <div className={badgesClass} aria-label="Application information">
            <span className={badgeClass}>Borg Al Arab Technological University</span>
            <span className={`${badgeClass} ${badgeAccentClass}`}>
              Six specialized tracks
            </span>
          </div>
        </section>

        <section className={formSectionClass} aria-labelledby="application-heading">
          <div className={formLeadClass}>
            <p className={formEyebrowClass}>A few thoughtful steps</p>
            <h2 id="application-heading">Your application</h2>
            <p>
              Share the details that help us understand you. Review your answers
              before submitting.
            </p>
          </div>
          <RegisterFlow />

          <div className={privacyNoteClass}>
            <span className="mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full bg-[var(--site-sky-ink)]" aria-hidden="true" />
            <p>
              Application information is used for recruitment review and
              coordination by authorized IT Club management at Borg Al Arab
              Technological University.
            </p>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
