"use client";

import { useState } from "react";
import {
  getGalleryMembers,
  type TeamMember,
} from "@/src/components/interview/committee-data";
import { TeamMemberCard } from "./TeamMemberCard";
import { MemberDetailDialog } from "./MemberDetailDialog";

export interface TeamGridProps {
  members?: TeamMember[];
  className?: string;
}

export const TeamGrid = ({
  members,
  className = "",
}: TeamGridProps) => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const activeMembers = members ?? getGalleryMembers();

  return (
    <>
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-4.5 ${className}`}
      >
        {activeMembers.map((member, index) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            priority={index < 4}
            onSelect={(m) => setSelectedMember(m)}
          />
        ))}
      </div>

      {/* Member Details Dialog for Clicks & Touch Interaction */}
      <MemberDetailDialog
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
};
