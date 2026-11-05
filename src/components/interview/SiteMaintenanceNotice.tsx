import Link from "next/link";
import { Wrench } from "lucide-react";

export default function SiteMaintenanceNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050708] px-4 text-white">
      <section
        dir="rtl"
        aria-labelledby="maintenance-notice-title"
        className="w-full max-w-md border border-white/15 bg-[#080a0c] p-8 text-center shadow-2xl sm:p-10"
      >
        <div className="mx-auto mb-5 flex size-14 items-center justify-center border border-[#00e599]/30 bg-[#00e599]/10 text-[#00e599]">
          <Wrench size={24} aria-hidden="true" />
        </div>

        <h1
          id="maintenance-notice-title"
          className="arabic text-2xl font-bold text-white sm:text-3xl"
        >
          الموقع تحت التعديل
        </h1>
        <p className="arabic mt-3 text-sm leading-7 text-neutral-300">
          هذه الصفحة غير متاحة حاليًا. يمكنك العودة إلى الصفحة الرئيسية لمتابعة
          تصفح الأقسام المتاحة.
        </p>

        <Link
          href="/"
          className="arabic mt-7 inline-flex min-h-11 items-center justify-center bg-emerald-400 px-6 py-3 text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          العودة إلى الرئيسية
        </Link>
      </section>
    </main>
  );
}
