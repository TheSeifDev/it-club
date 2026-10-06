import { ArrowUpRight } from "lucide-react";

const sponsorTypes = [
  {
    title: "Main Partner",
    arabicTitle: "الشريك الرئيسي",
    availability: "ONE ONLY",
    description:
      "The primary partner supporting IT Club and its community. Featured prominently across the interview experience and club activities.",
    color: "#35d98a",
  },
  {
    title: "Track Partner",
    arabicTitle: "شريك المسار",
    availability: "SIX AVAILABLE",
    description:
      "Support one of our six tracks and become part of the journey of the students working, learning, and growing inside it.",
    color: "#18c8ed",
  },
  {
    title: "Community Partner",
    arabicTitle: "شريك المجتمع",
    availability: "OPEN",
    description:
      "Organizations, communities, and initiatives that believe in students, technology, learning, and building the next generation.",
    color: "#9b7cff",
  },
  {
    title: "Media Partner",
    arabicTitle: "الشريك الإعلامي",
    availability: "OPEN",
    description:
      "Media platforms and creators helping us tell the story, share opportunities, and connect IT Club with a wider audience.",
    color: "#ff3ca7",
  },
];

const trackColors = [
  "#35d98a",
  "#ff3ca7",
  "#eaff00",
  "#ffab18",
  "#18c8ed",
  "#9b7cff",
];

export default function SponsorsSection() {
  return (
    <section
      id="sponsors"
      className="w-full border-t border-white/10 bg-[#050708] text-white"
    >
      <div className="mx-auto w-full max-w-342.5 px-6 py-28 md:px-10 lg:px-0 lg:py-36">
        {/* Section Header */}
        <div className="flex items-center gap-5">
          <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
            06
          </span>

          <span className="text-sm font-bold tracking-[0.14em] text-white">
            SPONSORS & PARTNERS
          </span>

          <span className="arabic text-lg text-neutral-300">
            الرعاة والشركاء
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Intro */}
        <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="max-w-175 text-[48px] font-bold leading-[0.92] tracking-[-0.045em] md:text-[60px] lg:text-[72px]">
              Build with
              <br />
              the next
              <br />
              <span className="text-[#42e895]">generation.</span>
            </h2>
          </div>

          <div className="max-w-160">
            <p className="text-[18px] leading-[1.55] text-[#aeb4bb] md:text-[19px]">
              IT Club brings together students who want to learn, build, and
              create real impact. Our partners help us turn that ambition into
              opportunities, experiences, and meaningful connections.
            </p>

            <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
              نادي تكنولوجيا المعلومات بيجمع طلاب عايزين يتعلموا ويبنو
              ويصنعوا تأثير حقيقي. شركاؤنا بيساعدونا نحول الطموح ده إلى فرص
              وتجارب وعلاقات حقيقية.
            </p>
          </div>
        </div>

        {/* Partnership Types */}
        <div className="mt-24 border-t border-white/10">
          {sponsorTypes.map((sponsor) => (
            <article
              key={sponsor.title}
              className="group relative grid grid-cols-1 border-b border-white/10 transition-colors duration-500 hover:bg-white/1.5 md:grid-cols-[minmax(220px,0.9fr)_minmax(170px,0.7fr)_minmax(300px,1.6fr)_48px] md:items-center"
            >
              {/* Left Accent */}
              <div
                className="absolute inset-y-0 left-0 w-0.75 transition-all duration-300 group-hover:w-1"
                style={{
                  backgroundColor: sponsor.color,
                }}
              />

              {/* Title */}
              <div className="py-8 pl-6 pr-6 md:py-9 md:pl-7 md:pr-8">
                <h3 className="text-[26px] font-bold leading-none tracking-[-0.03em] md:text-[30px]">
                  {sponsor.title}
                </h3>

                <p
                  className="arabic mt-3 text-[17px] font-semibold"
                  style={{
                    color: `${sponsor.color}99`,
                  }}
                >
                  {sponsor.arabicTitle}
                </p>
              </div>

              {/* Availability */}
              <div className="px-6 pb-8 md:px-8 md:py-9">
                <div className="flex flex-col items-start">
                  <span
                    className="font-mono text-xs font-bold tracking-[0.18em]"
                    style={{
                      color: sponsor.color,
                    }}
                  >
                    {sponsor.availability}
                  </span>

                  {sponsor.title === "Track Partner" && (
                    <div className="mt-3 flex items-center gap-1.5">
                      {trackColors.map((color) => (
                        <span
                          key={color}
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: color,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="px-6 pb-8 md:px-8 md:py-9">
                <p className="max-w-175 text-[15px] leading-[1.65] text-[#9ca3aa] md:text-[16px]">
                  {sponsor.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden items-center justify-end pr-6 md:flex">
                <ArrowUpRight
                  size={32}
                  strokeWidth={1.6}
                  className="transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:translate-x-1.5"
                  style={{
                    color: sponsor.color,
                  }}
                />
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-160">
            <p className="text-[16px] leading-[1.6] text-[#9ca3aa] md:text-[17px]">
              Interested in supporting IT Club, connecting with our students,
              or building something together? Let&apos;s start a conversation.
            </p>

            <p className="arabic mt-5 text-[16px] leading-[1.8] text-[#737a82]">
              مهتم بدعم النادي أو التواصل مع الطلاب أو بناء شيء مشترك؟
              خلينا نبدأ الحوار.
            </p>
          </div>

          <button
            type="button"
            className="group flex w-fit items-center gap-4 px-7 py-4 text-sm font-bold tracking-[0.04em] transition-all duration-300 hover:brightness-110"
            style={{
              backgroundColor: "#42e895",
              color: "#050708",
            }}
          >
            BECOME A PARTNER

            <ArrowUpRight
              size={17}
              strokeWidth={2}
              className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>
    </section>
  );
}