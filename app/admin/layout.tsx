import React from "react";
import type { Metadata } from "next";
import { requireStaffRole } from "../../lib/auth/page-guard";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = {
  title: "Admin Portal — IT Club Recruitment",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = await requireStaffRole(["owner", "admin", "interviewer"]);

  return (
    <div className="admin-shell min-h-screen bg-[#050708] text-white selection:bg-[#00e599] selection:text-[#050708]">
      <AdminSidebar userRole={role} userEmail={user.email || "staff@itclub.org"} />
      <main className="min-h-screen w-full min-w-0 px-4 pb-10 pt-20 sm:px-6 lg:pl-[19rem] lg:pr-8 lg:pt-8 xl:pr-10 data-[compact=true]:lg:pl-[6.5rem]">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
