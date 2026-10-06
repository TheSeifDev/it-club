import { ArrowUpRight } from "lucide-react";

const interviewSteps = [
  {
    number: "01",
    title: "Apply",
    arabicTitle: "التقديم",
    description:
      "Choose the track that fits you best and submit your application to become part of IT Club.",
    color: "#35d98a",
  },
  {
    number: "02",
    title: "Interview",
    arabicTitle: "المقابلة",
    description:
      "A conversation to understand your interests, mindset, experience, and how you can contribute.",
    color: "#ff3ca7",
  },
  {
    number: "03",
    title: "Join",
    arabicTitle: "الانضمام",
    description:
      "Selected applicants become part of the team and start building, learning, and contributing together.",
    color: "#9b7cff",
  },
];

export default function InterviewSection() {
  return (
    <section
      id="interview"
      className="w-full border-t border-white/10 bg-[#050708] text-white"
    >
      <div className="mx-auto w-full max-w-342.5 px-6 py-28 md:px-10 lg:px-0 lg:py-36">
        {/* Section Header */}
        <div className="flex items-center gap-5">
          <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
            04
          </span>

          <span className="text-sm font-bold tracking-[0.14em] text-white">
            THE INTERVIEW
          </span>

          <span className="arabic text-lg text-neutral-300">
            المقابلة
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Intro */}
        <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="max-w-175 text-[48px] font-bold leading-[0.92] tracking-[-0.045em] md:text-[60px] lg:text-[72px]">
              More than
              <br />
              an interview.
              <br />
              <span className="text-[#42e895]">A starting point.</span>
            </h2>
          </div>

          <div className="max-w-160">
            <p className="text-[18px] leading-[1.55] text-[#aeb4bb] md:text-[19px]">
              The interview is not just about what you already know. It is
              about your curiosity, mindset, potential, and the way you think.
              Come as you are and show us what you want to build.
            </p>

            <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
              المقابلة مش مجرد اختبار للي أنت عارفه. هي فرصة نعرف طريقة
              تفكيرك واهتماماتك وشغفك وإمكانياتك. تعال زي ما أنت وورّينا
              إيه اللي نفسك تبنيه.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-24 grid grid-cols-1 gap-px bg-white/10 md:grid-cols-3">
          {interviewSteps.map((step) => (
            <article
              key={step.number}
              className="group relative min-h-80 overflow-hidden bg-[#080a0c] p-8 transition-all duration-500 hover:brightness-110 md:p-10"
            >
              {/* Glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${step.color}18 0%, transparent 55%)`,
                }}
              />

              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs tracking-[0.18em]"
                    style={{ color: step.color }}
                  >
                    {step.number}
                  </span>

                  <ArrowUpRight
                    size={18}
                    strokeWidth={1.8}
                    className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    style={{ color: step.color }}
                  />
                </div>

                <div className="mt-auto">
                  <h3
                    className="text-[42px] font-bold leading-none tracking-[-0.04em] transition-all duration-500 md:text-[48px]"
                    style={{ color: step.color }}
                  >
                    {step.title}
                  </h3>

                  <h4
                    className="arabic mt-3 text-right text-[25px] font-bold"
                    style={{ color: `${step.color}99` }}
                  >
                    {step.arabicTitle}
                  </h4>

                  <p className="mt-6 text-[15px] leading-[1.65] text-[#8f969d]">
                    {step.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom line */}
        <div className="mt-8 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/30">
            IT CLUB — INTERVIEW PROCESS
          </span>

          <span className="font-mono text-[10px] tracking-[0.18em] text-white/30">
            APPLY · INTERVIEW · JOIN
          </span>
        </div>
      </div>
    </section>
  );
}