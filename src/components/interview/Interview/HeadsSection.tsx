import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TeamGrid } from "@/src/components/interview/Team";
import { getGalleryMembers } from "@/src/components/interview/committee-data";

export default function HeadsSection() {
  const members = getGalleryMembers();

  return (
    <section
      id="heads"
      className="w-full border-t border-white/10 bg-[#050708] text-white"
    >
      <div className="mx-auto w-full max-w-[1520px] px-6 py-28 md:px-10 lg:px-12 lg:py-36">
        {/* Section Header Eyebrow */}
        <div className="flex items-center gap-5">
          <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
            05
          </span>

          <span className="text-sm font-bold tracking-[0.14em] text-white">
            THE HEADS
          </span>

          <span className="arabic text-lg text-neutral-300">
            رؤساء المسارات واللجان
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Section Heading & Narrative */}
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
              Every track and committee is driven by dedicated leaders who build,
              organize, support, and push the community forward. These are the people
              you will meet, learn from, and collaborate with inside IT Club.
            </p>

            <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
              كل مسار ولجنة يقودها أشخاص يبنون وينظمون ويدعمون المجتمع ويساعدون
              النادي على التطور. هؤلاء هم القادة الذين ستلتقي بهم وتتعلم منهم
              وتعمل معهم داخل نادي تكنولوجيا المعلومات.
            </p>
          </div>
        </div>

        {/* BrainsMingle-Inspired Leadership Gallery Grid */}
        <div className="mt-20">
          <TeamGrid members={members} />
        </div>

        {/* Primary CTA leading to full Community Directory */}
        <div className="mt-14 flex justify-center">
          <Link
            href="/community"
            className="group inline-flex items-center gap-3 bg-[#42e895] px-8 py-4 text-sm font-bold text-[#050708] transition-all duration-300 hover:bg-[#6af0ad] hover:shadow-[0_0_25px_rgba(66,232,149,0.35)] cursor-pointer"
          >
            <span>Meet the Community</span>
            <ArrowRight
              size={18}
              strokeWidth={2.2}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Bottom Section Metadata */}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-white/30">
          <span className="font-mono text-[10px] tracking-[0.18em]">
            IT CLUB — THE PEOPLE BEHIND THE TRACKS
          </span>

          <span className="font-mono text-[10px] tracking-[0.18em]">
            {members.length} LEADERS · ONE COMMUNITY
          </span>
        </div>
      </div>
    </section>
  );
}