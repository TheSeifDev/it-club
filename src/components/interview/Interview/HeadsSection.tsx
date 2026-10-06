import { ArrowUpRight } from "lucide-react";

type Head = {
  name: string;
  role: string;
  arabicRole: string;
  track: string;
  color: string;
};

const heads: Head[] = [
  {
    name: "HEAD NAME",
    role: "Human Resources",
    arabicRole: "الموارد البشرية",
    track: "HR",
    color: "#35d98a",
  },
  {
    name: "HEAD NAME",
    role: "Student Relations",
    arabicRole: "علاقات الطلاب",
    track: "SR",
    color: "#ff3ca7",
  },
  {
    name: "HEAD NAME",
    role: "Social Media",
    arabicRole: "التواصل الاجتماعي",
    track: "SM",
    color: "#eaff00",
  },
  {
    name: "HEAD NAME",
    role: "Organizing Committee",
    arabicRole: "اللجنة التنظيمية",
    track: "OC",
    color: "#ffab18",
  },
  {
    name: "HEAD NAME",
    role: "Information Technology",
    arabicRole: "تكنولوجيا المعلومات",
    track: "IT",
    color: "#18c8ed",
  },
  {
    name: "HEAD NAME",
    role: "Research & Development",
    arabicRole: "البحث والتطوير",
    track: "R&D",
    color: "#9b7cff",
  },
];

export default function HeadsSection() {
  return (
    <section
      id="heads"
      className="w-full border-t border-white/10 bg-[#050708] text-white"
    >
      <div className="mx-auto w-full max-w-342.5 px-6 py-28 md:px-10 lg:px-0 lg:py-36">
        {/* Section Header */}
        <div className="flex items-center gap-5">
          <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
            05
          </span>

          <span className="text-sm font-bold tracking-[0.14em] text-white">
            THE HEADS
          </span>

          <span className="arabic text-lg text-neutral-300">
            رؤساء المسارات
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Intro */}
        <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="max-w-175 text-[48px] font-bold leading-[0.92] tracking-[-0.045em] md:text-[60px] lg:text-[72px]">
              Meet the
              <br />
              people who
              <br />
              <span className="text-[#42e895]">lead the tracks.</span>
            </h2>
          </div>

          <div className="max-w-160">
            <p className="text-[18px] leading-[1.55] text-[#aeb4bb] md:text-[19px]">
              Every track is driven by people who build, organize, support,
              and push the community forward. These are the people you may
              meet, learn from, and work with inside IT Club.
            </p>

            <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
              كل مسار يقوده أشخاص بيبنوا وينظموا ويدعموا المجتمع وبيساعدوا
              النادي يتطور. دول الأشخاص اللي ممكن تقابلهم وتتعلم منهم
              وتشتغل معاهم داخل نادي تكنولوجيا المعلومات.
            </p>
          </div>
        </div>

        {/* Heads Grid */}
        <div className="mt-24 grid grid-cols-1 gap-px bg-white/10 md:grid-cols-2 lg:grid-cols-3">
          {heads.map((head) => (
            <article
              key={head.track}
              className="group relative min-h-100 overflow-hidden bg-[#080a0c] p-8 transition-all duration-500 hover:brightness-110 md:p-10"
            >
              {/* Glow */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(circle at 80% 20%, ${head.color}18 0%, transparent 55%)`,
                }}
              />

              <div className="relative flex h-full flex-col">
                {/* Track */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs font-bold tracking-[0.18em]"
                    style={{ color: head.color }}
                  >
                    {head.track}
                  </span>

                  <ArrowUpRight
                    size={18}
                    strokeWidth={1.8}
                    className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    style={{ color: head.color }}
                  />
                </div>

                {/* Head */}
                <div className="mt-auto">
                  <div
                    className="mb-6 h-px w-12 transition-all duration-500 group-hover:w-20"
                    style={{ backgroundColor: head.color }}
                  />

                  <h3 className="text-[34px] font-bold leading-[0.95] tracking-[-0.04em] md:text-[40px]">
                    {head.name}
                  </h3>

                  <p
                    className="mt-5 text-sm font-semibold tracking-[0.04em]"
                    style={{ color: head.color }}
                  >
                    {head.role}
                  </p>

                  <p
                    className="arabic mt-2 text-right text-[17px]"
                    style={{ color: `${head.color}99` }}
                  >
                    {head.arabicRole}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-8 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/30">
            IT CLUB — THE PEOPLE BEHIND THE TRACKS
          </span>

          <span className="font-mono text-[10px] tracking-[0.18em] text-white/30">
            SIX TRACKS · ONE COMMUNITY
          </span>
        </div>
      </div>
    </section>
  );
}