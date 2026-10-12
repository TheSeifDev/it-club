import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, LogOut, ExternalLink } from "lucide-react";
import { requireStaffRole } from "../../lib/auth/page-guard";

export const metadata: Metadata = {
  title: "Admin Portal — IT Club Recruitment",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireStaffRole(["owner", "admin"]);

  return (
    <div className="min-h-screen bg-[#050708] text-white flex flex-col selection:bg-[#00e599] selection:text-[#050708]">
      {/* Top Administrative Header */}
      <header className="border-b border-white/10 bg-[#080a0c]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="tracks-content-container h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 font-bold tracking-tight text-white hover:text-[#00e599] transition-colors"
            >
              <div className="w-8 h-8 flex items-center justify-center border border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]">
                <ShieldCheck size={18} />
              </div>
              <span className="font-mono text-sm tracking-wider uppercase">IT CLUB</span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-xs text-white/60 uppercase">STAFF PORTAL</span>
            </Link>

            <span
              className={`font-mono text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 border ${
                role === "owner"
                  ? "border-[#9b7cff]/40 bg-[#9b7cff]/10 text-[#9b7cff]"
                  : "border-[#00e599]/40 bg-[#00e599]/10 text-[#00e599]"
              }`}
            >
              {role.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-mono text-xs text-white/50 truncate max-w-xs">
              {user.email}
            </span>

            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 font-mono text-xs text-white/40 hover:text-white transition-colors"
            >
              <span>Site</span>
              <ExternalLink size={12} />
            </Link>

            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20 px-3 py-1.5 font-mono text-xs text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <LogOut size={13} />
                <span>SIGN OUT</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 tracks-content-container py-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
