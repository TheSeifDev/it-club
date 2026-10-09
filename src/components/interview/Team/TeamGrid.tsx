"use client";

import { useState, useRef, useCallback } from "react";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const lastTriggeredCardId = useRef<string | null>(null);

  const activeMembers = members ?? getGalleryMembers();

  const handleSelectMember = useCallback((member: TeamMember) => {
    lastTriggeredCardId.current = `team-card-${member.id}`;
    setSelectedMember(member);
    setIsModalOpen(true);
  }, []);

  const handleClosing = useCallback(() => {
    // Gallery cards start returning immediately during reverse animation
    setIsModalOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedMember(null);
    setIsModalOpen(false);

    // Return focus to the triggering card element after modal closure
    if (lastTriggeredCardId.current) {
      const element = document.getElementById(lastTriggeredCardId.current);
      element?.focus();
    }
  }, []);

  return (
    <>
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-4.5 ${className}`}
      >
        {activeMembers.map((member, index) => {
          // Phase B outward displacement vector from grid center:
          // 5-column grid: center col is 2, center row is 1.5
          const col = index % 5;
          const row = Math.floor(index / 5);
          const offsetX = (col - 2) * 3; // -6px, -3px, 0px, 3px, 6px
          const offsetY = (row - 1.5) * 3; // -4.5px, -1.5px, 1.5px, 4.5px

          return (
            <div
              key={member.id}
              style={{
                transform: isModalOpen
                  ? `translate(${offsetX}px, ${offsetY}px) scale(0.985)`
                  : "translate(0px, 0px) scale(1)",
                transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="w-full motion-reduce:transform-none motion-reduce:transition-none"
            >
              <TeamMemberCard
                id={`team-card-${member.id}`}
                member={member}
                priority={index < 5}
                onSelect={handleSelectMember}
              />
            </div>
          );
        })}
      </div>

      {/* Full Editorial Profile Dialog Overlay */}
      <MemberDetailDialog
        member={selectedMember}
        onClosing={handleClosing}
        onClose={handleClose}
      />
    </>
  );
};
