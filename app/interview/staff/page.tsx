import React from "react";
import type { Metadata } from "next";
import { requireOwner } from "../../../lib/auth/page-guard";
import { getServiceRoleClient } from "../../../lib/auth/service-role";
import { isEmailConfigured } from "../../../lib/email/config";
import { AdminPageHeader } from "../dashboard-ui";
import OwnerStaffManagement, { type StaffDirectoryItem } from "./OwnerStaffManagement";

export const metadata: Metadata = {
  title: "Admin Management — IT Club Owner Console",
  description: "Owner-only administrative staff directory, invitations, credential resets, and activity governance.",
  robots: { index: false, follow: false },
};

export default async function AdminStaffPage() {
  // Strictly enforce Owner clearance on the server
  const staff = await requireOwner();

  // Fetch verified staff roster from database
  let staffList: StaffDirectoryItem[] = [];
  try {
    const serviceClient = getServiceRoleClient();
    const { data, error } = await serviceClient
      .from("staff_members")
      .select(
        "user_id, role, committee, email, created_at, password_change_required, temporary_password_issued_at, temporary_password_expires_at, password_changed_at"
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      staffList = data as StaffDirectoryItem[];
    }
  } catch {
    staffList = [];
  }

  const emailConfigured = isEmailConfigured();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Owner clearance required"
        title="Admin Management & Governance Console"
        description="Provision administrative credentials with enforced 24-hour temporary passwords, manage staff roles and account emails, execute credential resets, and audit admin activities."
      />

      <OwnerStaffManagement
        initialStaffList={staffList}
        currentUserId={staff.user.id}
        isEmailConfigured={emailConfigured}
      />
    </div>
  );
}
