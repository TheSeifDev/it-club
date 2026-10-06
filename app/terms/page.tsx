import Footer from "@/src/components/interview/Home/Footer";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";

export const metadata = {
  title: "Terms of Use | IT Club",
  description:
    "Terms and conditions for using the IT Club website and interview platform.",
};

const terms = [
  {
    number: "01",
    title: "Using the Website",
    text: "You may use the IT Club website to learn about the club, explore available tracks, understand the interview process, review opportunities, and access information made available to applicants and members.",
  },
  {
    number: "02",
    title: "Applying to IT Club",
    text: "Submitting an application means that you are interested in joining IT Club. An application does not guarantee an interview, acceptance, a specific track, or a specific position within the club.",
  },
  {
    number: "03",
    title: "Interview Process",
    text: "Interview activities may include questions, discussions, technical or non-technical evaluation, and conversations about your interests and experience. The format and evaluation criteria may vary depending on the track and recruitment cycle.",
  },
  {
    number: "04",
    title: "Accurate Information",
    text: "Applicants are expected to provide information that is accurate and represents their own experience. Submitting misleading information, impersonating another person, or intentionally misrepresenting your skills may affect your application.",
  },
  {
    number: "05",
    title: "Respectful Participation",
    text: "IT Club is a student community. Applicants and participants are expected to communicate respectfully with other students, interviewers, organizers, and club members throughout the application and interview process.",
  },
  {
    number: "06",
    title: "Submitted Content",
    text: "You are responsible for content you submit through the platform, including descriptions, portfolio links, project information, and other materials. Do not submit content that violates applicable laws or the rights of another person.",
  },
  {
    number: "07",
    title: "Intellectual Property",
    text: "The IT Club name, visual identity, website design, original graphics, written content, and other original materials belong to their respective owners. They should not be copied, redistributed, or presented as your own without permission.",
  },
  {
    number: "08",
    title: "Platform Availability",
    text: "We may update, modify, temporarily suspend, or remove parts of the website or interview platform when necessary. We do not guarantee that every feature will always be available.",
  },
  {
    number: "09",
    title: "Changes to These Terms",
    text: "These Terms may be updated as the IT Club website, recruitment process, or services evolve. The latest version will always be published on this page with its corresponding update date.",
  },
];

const TermsPage = () => {
  return (
    <>
      <ResponsiveNav />

      <main className="min-h-screen overflow-hidden bg-[#050708] text-white">
        {/* HERO */}
        <section className="relative border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 top-0 h-160 w-160 rounded-full bg-[#42e895]/4 blur-3xl" />
            <div className="absolute left-[35%] top-40 h-80 w-80 rounded-full bg-[#8d8cff]/3 blur-3xl" />
          </div>

          <div className="relative mx-auto w-full max-w-342.5 px-6 pb-24 pt-32 md:px-10 md:pb-32 lg:px-0 lg:pt-40">
            <div className="flex items-center gap-4 md:gap-5">
              <span className="font-mono text-xs font-medium tracking-[0.18em] text-[#8d8cff]">
                02
              </span>

              <span className="text-[11px] font-bold tracking-[0.18em] text-white/80">
                TERMS OF USE
              </span>

              <span className="arabic text-base text-white/40 md:text-lg">
                شروط الاستخدام
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mt-20 grid grid-cols-1 gap-14 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:gap-24">
              <div>
                <p className="mb-7 font-mono text-[10px] tracking-[0.2em] text-[#42e895]">
                  IT CLUB / INTERVIEW PLATFORM
                </p>

                <h1 className="max-w-190 text-[58px] font-bold leading-[0.86] tracking-[-0.055em] md:text-[82px] lg:text-[112px]">
                  Show up.
                  <br />
                  <span className="text-[#42e895]">Build together.</span>
                </h1>

                <p className="mt-10 max-w-155 text-[17px] leading-[1.7] text-[#aeb4bb] md:text-[19px]">
                  These terms define the basic expectations for using the IT
                  Club website, applying to the club, and participating in the
                  interview process.
                </p>

                <p className="arabic mt-6 max-w-155 text-[16px] leading-[1.95] text-[#737a82]">
                  توضح شروط الاستخدام هذه القواعد الأساسية لاستخدام موقع نادي
                  تكنولوجيا المعلومات والتقديم للنادي والمشاركة في عملية
                  المقابلات.
                </p>
              </div>

              <div className="lg:pb-2">
                <div className="border-l border-[#42e895]/30 pl-5 md:pl-6">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-white/30">
                    LAST UPDATED
                  </p>

                  <p className="mt-3 text-sm font-medium tracking-wide text-white/75">
                    OCTOBER 2026
                  </p>

                  <div className="mt-7 h-px w-12 bg-[#42e895]" />

                  <p className="mt-6 max-w-55 text-xs leading-[1.7] text-white/30">
                    Please review these terms before submitting an application
                    or participating in the interview process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="relative">
          <div className="mx-auto w-full max-w-342.5 px-6 py-24 md:px-10 md:py-32 lg:px-0 lg:py-40">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[220px_minmax(0,760px)] lg:gap-24">
              {/* SIDEBAR */}
              <aside className="hidden lg:block">
                <div className="sticky top-28">
                  <p className="font-mono text-[9px] font-medium tracking-[0.2em] text-white/30">
                    ON THIS PAGE
                  </p>

                  <nav className="mt-7 flex flex-col gap-4">
                    {terms.map((term) => (
                      <a
                        key={term.number}
                        href={`#terms-${term.number}`}
                        className="group flex items-center gap-3 text-[11px] text-white/30 transition-colors hover:text-white"
                      >
                        <span className="font-mono text-[#8d8cff]/50 transition-colors group-hover:text-[#8d8cff]">
                          {term.number}
                        </span>

                        <span>{term.title}</span>
                      </a>
                    ))}
                  </nav>

                  <div className="mt-12 h-px w-8 bg-[#42e895]" />
                </div>
              </aside>

              {/* ARTICLES */}
              <div>
                <div className="mb-16 flex items-end justify-between border-b border-white/10 pb-6">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] text-[#8d8cff]">
                      TERMS
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                      Your participation
                    </h2>
                  </div>

                  <span className="font-mono text-[10px] tracking-[0.16em] text-white/25">
                    09 SECTIONS
                  </span>
                </div>

                <div>
                  {terms.map((term) => (
                    <section
                      key={term.number}
                      id={`terms-${term.number}`}
                      className="scroll-mt-28 border-b border-white/10 py-12 first:pt-0 md:py-16"
                    >
                      <div className="grid grid-cols-[42px_1fr] gap-5 md:grid-cols-[64px_1fr] md:gap-8">
                        <span className="font-mono text-[11px] tracking-[0.14em] text-[#8d8cff]">
                          {term.number}
                        </span>

                        <div>
                          <h3 className="text-[25px] font-bold tracking-tight md:text-[32px]">
                            {term.title}
                          </h3>

                          <p className="mt-6 max-w-165 text-[16px] leading-[1.9] text-[#8f969d] md:text-[17px]">
                            {term.text}
                          </p>
                        </div>
                      </div>
                    </section>
                  ))}
                </div>

                {/* CONTACT */}
                <section className="mt-16 border border-white/10 bg-white/1.5 p-7 md:p-10">
                  <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-[#42e895]">
                        10 / CONTACT
                      </p>

                      <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                        Have a question?
                      </h3>

                      <p className="mt-4 max-w-125 text-[15px] leading-[1.8] text-[#777f87]">
                        If you have questions about these Terms of Use, contact
                        the IT Club team.
                      </p>
                    </div>

                    <a
                      href="mailto:contact@itclub.one"
                      className="group flex items-center gap-3 text-sm font-medium text-[#42e895] transition-colors hover:text-white"
                    >
                      contact@itclub.one
                      <span className="text-white/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                        ↗
                      </span>
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default TermsPage;