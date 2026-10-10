import {
  teamMembers,
  getTeamMemberById,
  type TeamMember,
} from "./committee-data";

export { teamMembers, getTeamMemberById, type TeamMember };

export type HeroSpeaker = {
  id: string;
  name: string;
  role: string;
  committee: string;
  roleLabel: string;
  company: string; // Kept for backwards compatibility
  image?: string;
};

export type Speaker = HeroSpeaker;

export type Track = {
  label: string;
  color: string;
};

export type Stat = {
  value: string;
  label: string;
};

export const TARGET_DATE = new Date(
  "2026-10-10T00:00:00",
).getTime();

export const tracks: Track[] = [
  {
    label: "Human Resources",
    color: "bg-emerald-400",
  },
  {
    label: "Public Relations",
    color: "bg-pink-500",
  },
  {
    label: "Social Media",
    color: "bg-lime-400",
  },
  {
    label: "Organizing Committee",
    color: "bg-orange-400",
  },
  {
    label: "Information Technology",
    color: "bg-cyan-400",
  },
  {
    label: "Research & Development",
    color: "bg-violet-400",
  },
];

export const stats: Stat[] = [
  { value: "500+", label: "MEMBERS" },
  { value: "40+", label: "HEADS" },
  { value: "6", label: "TRACKS" },
  { value: "ALL", label: "DAYS" },
  { value: "BATU", label: "UNIVERSITY" },
];

/**
 * Configurable list of member IDs selected for display in the Hero animated columns.
 * Order here determines layout placement in the Hero independently of the master registry.
 */
export const HERO_MEMBER_IDS: string[] = [
  "seif-ayman",
  "mahmoud-sameh",
  "marwan-awad",
  "shahd-ahssen",
  "mohamed-al-amir",
  "abdulrahman-ashraf",
  "farida-mohamed",
  "omar-mehawed",
  "mohamed-sherif",
  "youssef-soliman",
  "mohamed-nagi",
  "adham-ahmed",
  "ahmed-mohsen",
  "ahmed-samir",
  "habiba-ahmed",
  "saif-kambo",
  "marwan",
  "Sherif-alt",
];

const formatRoleLabel = (member: TeamMember): string => {
  if (member.committee && member.committee !== "PENDING_VERIFICATION") {
    return `${member.role} • ${member.committee}`;
  }
  return member.role || "TEAM MEMBER";
};

/**
 * Hero speaker items derived from centralized team data registry.
 */
export const speakers: Speaker[] = HERO_MEMBER_IDS.map((id) => {
  const member = getTeamMemberById(id);
  if (!member) {
    return {
      id,
      name: "IT CLUB MEMBER",
      role: "MEMBER",
      committee: "",
      roleLabel: "IT CLUB",
      company: "IT CLUB",
    };
  }
  const roleLabel = formatRoleLabel(member);
  return {
    id: member.id,
    name: member.name.toUpperCase(),
    role: member.role,
    committee: member.committee,
    roleLabel,
    company: roleLabel,
    image: member.image || undefined,
  };
});

/**
 * 4 columns of speakers for the infinite-scroll columns.
 */
export const columns: Speaker[][] = [0, 1, 2, 3].map((colIndex) =>
  [0, 1, 2, 3].map((rowIndex) => {
    return speakers[(colIndex * 4 + rowIndex) % speakers.length];
  }),
);

export const columnMotion = [
  {
    reverse: false,
    duration: 60,
    delay: -8,
  },
  {
    reverse: true,
    duration: 75,
    delay: -20,
  },
  {
    reverse: false,
    duration: 68,
    delay: -30,
  },
  {
    reverse: true,
    duration: 80,
    delay: -12,
  },
];