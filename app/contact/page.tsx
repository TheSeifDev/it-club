import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import ContactForm from "@/src/components/site/ContactForm";
import { SiteFrame } from "@/src/components/site/SiteUI";
import { publicMetadata } from "@/src/components/site/content-utils";

const pageClass = "bg-transparent text-[var(--site-ink)]";
const introClass =
  "bg-transparent pt-[calc(var(--site-header-clearance,112px)_+_clamp(36px,5vw,72px))] px-[clamp(20px,3.5vw,64px)] pb-[clamp(48px,7vw,100px)] max-[760px]:pt-[calc(var(--site-header-clearance,112px)_+_38px)] max-[760px]:pb-12";
const sectionLabelClass = "inline-flex items-center gap-[9px] text-[var(--site-ink)]";
const sectionNumberClass =
  "grid h-[29px] w-[29px] place-items-center rounded-full bg-[var(--site-paper-dim)] text-[.68rem] leading-none font-semibold tracking-[.01em] text-white";
const sectionNameClass =
  "inline-flex min-h-[29px] items-center rounded-full bg-[var(--site-glass-soft)] px-[13px] text-[.68rem] font-semibold tracking-[.045em] text-[var(--site-ink)] uppercase";
const introGridClass =
  "mt-[clamp(44px,6vw,82px)] grid grid-cols-[minmax(0,1.15fr)_minmax(260px,.55fr)] items-end gap-[clamp(36px,7vw,110px)] max-[760px]:mt-[43px] max-[760px]:grid-cols-[minmax(0,1fr)] max-[760px]:gap-[22px]";
const titleClass =
  "m-0 max-w-[11ch] text-[clamp(3.2rem,8.4vw,8.5rem)] font-[450] leading-[1.03] tracking-[-.055em] text-[var(--site-ink)] [overflow-wrap:anywhere] max-[760px]:max-w-[10ch] max-[760px]:text-[clamp(3.25rem,14vw,6rem)]";
const introCopyClass =
  "max-w-[440px] pb-[.45rem] text-[clamp(1rem,1.4vw,1.15rem)] leading-[1.75] text-[var(--site-copy)] max-[760px]:max-w-[54ch] [&_p]:m-0";
const arabicIntroClass =
  "mt-[18px] text-[.94rem] leading-[1.9] text-[var(--site-ink)]";
const contactSectionClass =
  "bg-transparent pt-[clamp(48px,7vw,96px)] px-[clamp(20px,3.5vw,64px)] pb-[clamp(88px,11vw,150px)] text-[var(--site-ink)]";
const contactLayoutClass =
  "grid grid-cols-[minmax(250px,.72fr)_minmax(0,1.28fr)] items-start gap-[clamp(40px,8vw,128px)] max-[760px]:grid-cols-[minmax(0,1fr)] max-[760px]:gap-[60px]";
const detailsTitleClass =
  "mt-[27px] mb-0 text-[clamp(2.3rem,4.5vw,4.5rem)] font-[450] leading-[1.06] tracking-[-.055em] text-[var(--site-ink)] max-[760px]:text-[clamp(2.5rem,10vw,4rem)]";
const detailsCopyClass =
  "mt-[22px] mb-0 max-w-[38ch] text-[.98rem] leading-[1.75] text-[var(--site-copy)]";
const emailClass =
  "mt-[29px] inline-flex max-w-full items-center gap-[10px] text-[clamp(1rem,1.35vw,1.18rem)] font-semibold !text-[var(--site-sky-ink)] [overflow-wrap:anywhere] underline decoration-transparent underline-offset-[5px] transition-[text-decoration-color] duration-[160ms] ease-in hover:decoration-current focus-visible:rounded-[3px] focus-visible:!outline-2 focus-visible:!outline-offset-4 focus-visible:!outline-[var(--site-sky-ink)] motion-reduce:transition-none";

export const metadata: Metadata = publicMetadata(
  "Contact IT Club",
  "Reach the IT Club at Borg Al Arab Technological University with a question, collaboration, or partnership proposal.",
  "/contact",
);

export default function ContactPage() {
  return (
    <SiteFrame>
      <div className={pageClass}>
        <section className={introClass} aria-labelledby="contact-title">
          <div className={sectionLabelClass}>
            <span className={sectionNumberClass}>07</span>
            <span className={sectionNameClass}>Contact</span>
          </div>
          <div className={introGridClass}>
            <h1 className={titleClass} id="contact-title">
              Start a conversation.
            </h1>
            <div className={introCopyClass}>
              <p>
                A question, an idea, a collaboration, or something you want to
                build together—tell us what is on your mind.
              </p>
              <p className={arabicIntroClass} lang="ar" dir="rtl">
                لديك فكرة أو سؤال؟ يسعدنا أن نسمع منك.
              </p>
            </div>
          </div>
        </section>

        <section className={contactSectionClass} aria-label="Get in touch">
          <div className={contactLayoutClass}>
            <aside className="min-w-0" aria-labelledby="details-title">
              <div className={sectionLabelClass}>
                <span className={sectionNumberClass}>01</span>
                <span className={sectionNameClass}>Let’s talk</span>
              </div>
              <div className="mt-[clamp(32px,4vw,52px)] grid h-[76px] w-[76px] place-items-center rounded-2xl bg-[var(--site-glass-soft)] text-[var(--site-sky-ink)] max-[760px]:mt-7 max-[760px]:h-[68px] max-[760px]:w-[68px]" aria-hidden="true">
                <MessageCircle size={34} strokeWidth={1.5} />
              </div>
              <h2 className={detailsTitleClass} id="details-title">
                Good ideas
                <br />
                start <em className="text-[var(--site-sky-ink)] not-italic">somewhere.</em>
              </h2>
              <p className={detailsCopyClass}>
                Send a note to the IT Club team. For a partnership, select that
                option and share the context that would help us understand your
                proposal.
              </p>
              <a className={emailClass} href="mailto:contact@itclub.one">
                <span>contact@itclub.one</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <p className="mt-[22px] mb-0 max-w-[38ch] text-[.87rem] leading-[1.9] text-[var(--site-copy)]" lang="ar" dir="rtl">
                نقرأ رسالتك ونتواصل معك عبر البريد الإلكتروني الذي تتركه لنا.
              </p>
            </aside>

            <div className="min-w-0">
              <div className={sectionLabelClass}>
                <span className={sectionNumberClass}>02</span>
                <span className={sectionNameClass}>Send a message</span>
              </div>
              <p className="mt-[22px] mb-[25px] text-base leading-[1.65] text-[var(--site-copy)] max-[760px]:mt-[18px]">
                Share a little context and we’ll take it from there.
              </p>
              <ContactForm />
            </div>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
