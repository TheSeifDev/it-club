import {
  getGalleryMembers,
  type TeamMember,
} from "@/src/components/interview/committee-data";
import { TeamMemberCard } from "./TeamMemberCard";

export interface TeamGridProps {
  members?: TeamMember[];
  className?: string;
}

export const TeamGrid = ({
  members,
  className = "",
}: TeamGridProps) => {
  const activeMembers = members ?? getGalleryMembers();

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/10 border border-white/10 ${className}`}
    >
      {activeMembers.map((member) => (
        <TeamMemberCard key={member.id} member={member} />
      ))}
    </div>
  );
};
