import Footer from "@/src/components/interview/Home/Footer";
import ResponsiveNav from "@/src/components/interview/navigation/ResponsiveNav";

export const metadata = {
  title: "Privacy Policy | IT Club",
  description:
    "Learn how IT Club handles information submitted through the interview platform.",
};

const privacySections = [
  {
    number: "01",
    title: "What We Collect",
    text: "Depending on how you interact with IT Club, we may collect information such as your name, email address, phone number, academic information, selected track, technical interests, portfolio links, and information you choose to provide during the application or interview process.",
  },
  {
    number: "02",
    title: "Why We Collect It",
    text: "Your information helps us review applications, understand your interests, prepare for interviews, communicate important updates, organize teams, and determine where your skills and interests may fit within IT Club.",
  },
  {
    number: "03",
    title: "Application Information",
    text: "Information submitted through the interview platform is used for the club's selection and recruitment process. Access to this information should be limited to people responsible for reviewing applications, conducting interviews, or managing the relevant club operations.",
  },
  {
    number: "04",
    title: "Communications",
    text: "If you provide your contact information, IT Club may use it to contact you about your application, interview schedule, selection results, club activities, or other information directly related to your participation.",
  },
  {
    number: "05",
    title: "Data Protection",
    text: "We take reasonable steps to protect information against unauthorized access, alteration, disclosure, or loss. Access should be restricted to information that is necessary for the person's role within the club.",
  },
  {
    number: "06",
    title: "Third-Party Services",
    text: "Parts of the platform may rely on external infrastructure, hosting, analytics, storage, or communication services. Those services may process information according to their own policies and terms.",
  },
  {
    number: "07",
    title: "Your Information",
    text: "If you have questions about information you submitted, believe something is inaccurate, or want to understand how your information is being handled, you can contact the IT Club team.",
  },
];

const PrivacyPage = () => {
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
                01
              </span>

              <span className="text-[11px] font-bold tracking-[0.18em] text-white/80">
                PRIVACY POLICY
              </span>

              <span className="arabic text-base text-white/40 md:text-lg">
                سياسة الخصوصية
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="mt-20 grid grid-cols-1 gap-14 lg:grid-cols-[1.4fr_0.6fr] lg:items-end lg:gap-24">
              <div>
                <p className="mb-7 font-mono text-[10px] tracking-[0.2em] text-[#42e895]">
                  IT CLUB / DATA & PRIVACY
                </p>

                <h1 className="max-w-190 text-[58px] font-bold leading-[0.86] tracking-[-0.055em] md:text-[82px] lg:text-[112px]">
                  We respect
                  <br />
                  your <span className="text-[#42e895]">privacy.</span>
                </h1>

                <p className="mt-10 max-w-155 text-[17px] leading-[1.7] text-[#aeb4bb] md:text-[19px]">
                  IT Club is built around students and their ideas. We only
                  collect information that is relevant to operating the
                  interview process, communicating with applicants, and
                  building a better club experience.
                </p>

                <p className="arabic mt-6 max-w-155 text-[16px] leading-[1.95] text-[#737a82]">
                  نادي تكنولوجيا المعلومات يهتم بخصوصية الطلاب وبياناتهم. نقوم
                  بجمع المعلومات اللازمة فقط لإدارة عملية التقديم والمقابلات
                  والتواصل مع المتقدمين وتحسين تجربة النادي.
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
                    This page explains how information submitted through the
                    interview platform may be handled.
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
                    {privacySections.map((section) => (
                      <a
                        key={section.number}
                        href={`#privacy-${section.number}`}
                        className="group flex items-center gap-3 text-[11px] text-white/30 transition-colors hover:text-white"
                      >
                        <span className="font-mono text-[#8d8cff]/50 transition-colors group-hover:text-[#8d8cff]">
                          {section.number}
                        </span>

                        <span>{section.title}</span>
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
                      PRIVACY
                    </p>

                    <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                      Your data
                    </h2>
                  </div>

                  <span className="font-mono text-[10px] tracking-[0.16em] text-white/25">
                    07 SECTIONS
                  </span>
                </div>

                <div>
                  {privacySections.map((section) => (
                    <section
                      key={section.number}
                      id={`privacy-${section.number}`}
                      className="scroll-mt-28 border-b border-white/10 py-12 first:pt-0 md:py-16"
                    >
                      <div className="grid grid-cols-[42px_1fr] gap-5 md:grid-cols-[64px_1fr] md:gap-8">
                        <span className="font-mono text-[11px] tracking-[0.14em] text-[#8d8cff]">
                          {section.number}
                        </span>

                        <div>
                          <h3 className="text-[25px] font-bold tracking-tightmd:text-[32px]">
                            {section.title}
                          </h3>

                          <p className="mt-6 max-w-165 text-[16px] leading-[1.9] text-[#8f969d] md:text-[17px]">
                            {section.text}
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
                        08 / CONTACT
                      </p>

                      <h3 className="mt-4 text-2xl font-bold tracking-tight md:text-3xl">
                        Questions about your data?
                      </h3>

                      <p className="mt-4 max-w-125 text-[15px] leading-[1.8] text-[#777f87]">
                        Privacy questions or concerns can be sent directly to
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

export default PrivacyPage;