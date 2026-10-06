import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Track } from "./track-data";

const tracks: Track[] = [
  {
    id: "hr",
    number: "01",
    title: "Human Resources",
    arabicTitle: "الموارد البشرية",
    description:
      "Building the people, culture, and internal systems that make the club stronger. HR connects members, supports teams, and creates an environment where everyone can grow.",
    arabicDescription:
      "بناء الأفراد والثقافة والأنظمة الداخلية التي تجعل النادي أقوى. يهتم فريق الموارد البشرية بالأعضاء ويدعم الفرق ويخلق بيئة تساعد الجميع على التطور.",
    color: "#35d98a",
    background: "#061b16",
  },
  {
    id: "sr",
    number: "02",
    title: "Student Relations",
    arabicTitle: "علاقات الطلاب",
    description:
      "Connecting the club with students and creating a strong community around technology, learning, events, and opportunities.",
    arabicDescription:
      "ربط النادي بالطلاب وبناء مجتمع قوي حول التكنولوجيا والتعلم والفعاليات والفرص المختلفة.",
    color: "#ff3ca7",
    background: "#1c0a18",
  },
  {
    id: "sm",
    number: "03",
    title: "Social Media",
    arabicTitle: "التواصل الاجتماعي",
    description:
      "Turning ideas, activities, and achievements into content that represents the club and reaches the right audience across digital platforms.",
    arabicDescription:
      "تحويل أفكار وأنشطة وإنجازات النادي إلى محتوى يعبر عنه ويصل إلى الجمهور المناسب عبر المنصات الرقمية.",
    color: "#eaff00",
    background: "#171a05",
  },
  {
    id: "oc",
    number: "04",
    title: "Organizing Committee",
    arabicTitle: "اللجنة التنظيمية",
    description:
      "Planning and executing events, managing logistics, and making sure every experience runs smoothly from the first idea to the final moment.",
    arabicDescription:
      "تخطيط وتنفيذ الفعاليات وإدارة التفاصيل التنظيمية والتأكد من خروج كل تجربة بالشكل المطلوب من أول فكرة وحتى النهاية.",
    color: "#ffab18",
    background: "#19120a",
  },
  {
    id: "it",
    number: "05",
    title: "Information Technology",
    arabicTitle: "تكنولوجيا المعلومات",
    description:
      "Building the technical foundation of the club through software, systems, infrastructure, and real-world technology projects.",
    arabicDescription:
      "بناء الأساس التقني للنادي من خلال البرمجيات والأنظمة والبنية التحتية والمشاريع التقنية الحقيقية.",
    color: "#18c8ed",
    background: "#061a20",
  },
  {
    id: "rnd",
    number: "06",
    title: "Research Development",
    arabicTitle: "البحث والتطوير",
    description:
      "Exploring emerging technologies, experimenting with new ideas, and transforming research into practical projects and innovative solutions.",
    arabicDescription:
      "استكشاف التقنيات الحديثة وتجربة الأفكار الجديدة وتحويل البحث والمعرفة إلى مشاريع وحلول مبتكرة.",
    color: "#9b7cff",
    background: "#100b1d",
  },
];

const formatTitle = (title: string) => {
  return title.split(" ");
};

export default function TrackSection() {
  return (
    <section id="tracks" className="w-full bg-[#050708] text-white">
      <div className="w-full">
        {tracks.map((track) => (
          <Link
            key={track.id}
            href={`/tracks#${track.id}`}
            className="group block cursor-pointer"
          >
            <article
              className="relative min-h-71.25 overflow-hidden border-t border-white/10 transition-all duration-500 hover:brightness-110"
              style={{
                backgroundColor: track.background,
                borderLeft: `3px solid ${track.color}`,
              }}
            >
              {/* Hover glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 75% 50%, ${track.color}18 0%, transparent 55%)`,
                }}
              />

              <div className="relative mx-auto flex min-h-71.25 max-w-342.5 items-center px-6 py-14 md:px-10 lg:px-0">
                <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-24">
                  {/* English */}
                  <div>
                    <h3
                      className="max-w-175 text-[48px] font-bold leading-[0.92] tracking-[-0.045em] transition-all duration-500 group-hover:drop-shadow-[0_0_24px_var(--track-glow)] md:text-[60px] lg:text-[72px]"
                      style={{
                        color: track.color,
                        ["--track-glow" as string]: `${track.color}55`,
                      }}
                    >
                      {formatTitle(track.title).map((word, index) => (
                        <span
                          key={`${track.id}-${word}-${index}`}
                          className="block"
                        >
                          {word}
                        </span>
                      ))}
                    </h3>

                    <p className="mt-7 max-w-155 text-[16px] leading-[1.55] text-[#aeb4bb] transition-colors duration-500 group-hover:text-[#d1d5d9] md:text-[17px]">
                      {track.description}
                    </p>
                  </div>

                  {/* Arabic */}
                  <div className="flex flex-col items-start lg:items-end">
                    <h4
                      className="arabic text-right text-[40px] font-bold leading-[1.15] transition-all duration-500 group-hover:brightness-125 md:text-[48px] lg:text-[54px]"
                      style={{
                        color: `${track.color}99`,
                      }}
                    >
                      {track.arabicTitle}
                    </h4>

                    <p className="arabic mt-5 max-w-140 text-right text-[15px] leading-[1.8] text-white/35 lg:hidden">
                      {track.arabicDescription}
                    </p>

                    <div
                      className="mt-8 flex items-center gap-2 text-xs font-bold tracking-[0.16em] transition-all duration-300 group-hover:gap-3"
                      style={{ color: track.color }}
                    >
                      SEE THE TRACK

                      <ArrowUpRight
                        size={17}
                        strokeWidth={2}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}