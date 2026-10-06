export default function AboutClub() {
  return (
    <section className="bg-[#050708] text-white">
      <div className="mx-auto w-full max-w-342.5 px-6 py-28 md:px-10 lg:px-0 lg:py-36">

        {/* ========================================================= */}
        {/* 01 — ABOUT THE CLUB                                      */}
        {/* ========================================================= */}

        <div>
          <div className="flex items-center gap-5">
            <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
              01
            </span>

            <span className="text-sm font-bold tracking-[0.14em] text-white">
              WHAT IS IT CLUB?
            </span>

            <span className="arabic text-lg text-neutral-300">
              ما هو نادي تكنولوجيا المعلومات؟
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-24">
            {/* Left */}
            <div>
              <h2 className="max-w-155 text-[44px] font-bold leading-[0.98] tracking-[-0.045em] md:text-[52px] lg:text-[58px]">
                A place for
                <br />
                people who
                <br />
                <span className="text-[#42e895]">
                  build things.
                </span>
              </h2>
            </div>

            {/* Right */}
            <div className="max-w-160">
              <p className="text-[18px] font-normal leading-[1.55] text-[#aeb4bb] md:text-[19px]">
                IT Club is a student-driven technology
                community built for people who want to
                learn, build, experiment, and grow together.
                A space where ideas become projects,
                curiosity becomes experience, and students
                become real builders.
              </p>

              <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
                نادي تكنولوجيا المعلومات هو مجتمع تقني
                طلابي يهدف إلى جمع الأشخاص الذين يريدون
                التعلّم والبناء والتجربة والتطور معًا.
                مساحة تتحول فيها الأفكار إلى مشاريع
                والخبرة إلى مهارات حقيقية.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 02 — WHAT WE DO                                          */}
        {/* ========================================================= */}

        <div className="mt-36">
          <div className="flex items-center gap-5">
            <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
              02
            </span>

            <span className="text-sm font-bold tracking-[0.14em] text-white">
              WHAT WE DO
            </span>

            <span className="arabic text-lg text-neutral-300">
              ماذا نفعل؟
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-14 max-w-180">
            <p className="text-[18px] leading-[1.55] text-[#aeb4bb] md:text-[19px]">
              We learn together, build real projects,
              explore new technologies, and create
              opportunities for students to turn their
              technical interests into practical experience.
            </p>

            <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
              نتعلم معًا ونبني مشاريع حقيقية ونستكشف
              التقنيات الحديثة ونخلق فرصًا تساعد الطلاب
              على تحويل شغفهم بالتكنولوجيا إلى خبرة عملية.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 03 — OUR TRACKS                                           */}
        {/* ========================================================= */}

        <div className="mt-36">
          <div className="flex items-center gap-5">
            <span className="font-mono text-sm font-medium tracking-[0.12em] text-[#8d8cff]">
              03
            </span>

            <span className="text-sm font-bold tracking-[0.14em] text-white">
              OUR TRACKS
            </span>

            <span className="arabic text-lg text-neutral-300">
              المسارات
            </span>

            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-14 max-w-180">
            <p className="text-[18px] leading-[1.55] text-[#aeb4bb] md:text-[19px]">
              Six tracks, one community. Each track
              represents a different way to contribute,
              create, and grow inside IT Club — from
              technology and research to people,
              communication, and operations.
            </p>

            <p className="arabic mt-7 text-[17px] leading-[1.8] text-[#8f969d]">
              ستة مسارات ومجتمع واحد. كل مسار يمثل
              طريقة مختلفة للمساهمة والإبداع والتطور
              داخل نادي تكنولوجيا المعلومات، بدايةً
              من التكنولوجيا والبحث وصولًا إلى الأفراد
              والتواصل والتنظيم.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}