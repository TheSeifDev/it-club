/**
 * Centralized Team & Committee Data Registry for IT Club.
 *
 * All image paths reference static WebP assets under `/public/COMMITTEES/`.
 * Any entries whose role or committee could not be definitively verified
 * from official project artifacts are flagged with `needsReview: true`
 * for manual confirmation rather than guessed.
 */

export type LeadershipRole = "HEAD" | "VICE HEAD" | "LEADER";

export const COMMITTEES = [
  "Information Technology",
  "Organizing Committee",
  "Social Media",
  "Human Resources",
  "Public Relations",
  "Research & Development",
] as const;

export type CommitteeName = (typeof COMMITTEES)[number] | string;

export type TeamMember = {
  /** Stable unique identifier (kebab-case) */
  id: string;
  /** Display name */
  name: string;
  /** Member role in leadership / committee */
  role: LeadershipRole;
  /** Committee name */
  committee: CommitteeName;
  /** Static path under /COMMITTEES/ */
  image: string;
  /** Explicit display order */
  order: number;
  /**
   * Set to true if the member's identity, role, or committee assignment
   * cannot be definitively determined from available project artifacts
   * and requires manual confirmation.
   */
  needsReview?: boolean;
  /** Notes regarding manual verification requirement */
  reviewNotes?: string;
  /** Set to true if this record represents an alternate photo for an existing member */
  isAlternate?: boolean;
};

export const teamMembers: TeamMember[] = [
  // ==========================================
  // Verified Leadership & Committee Members
  // ==========================================
  {
    id: "seif-ayman",
    name: "Seif Ayman",
    role: "HEAD",
    committee: "Information Technology",
    image: "/COMMITTEES/Seif Ayman.webp",
    order: 1,
    needsReview: false,
  },
  {
    id: "mahmoud-sameh",
    name: "Mahmoud Sameh",
    role: "LEADER",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Mahmoud Sameh.webp",
    order: 2,
    needsReview: false,
  },
  {
    id: "marwan-awad",
    name: "Marwan Awad",
    role: "LEADER",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Marwan Awad.webp",
    order: 3,
    needsReview: false,
  },
  {
    id: "shahd-ahssen",
    name: "Shahd Ahssen",
    role: "VICE HEAD",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Shahd Ahssen.webp",
    order: 4,
    needsReview: false,
  },
  {
    id: "mohamed-al-amir",
    name: "Mohamed Al-Amir",
    role: "VICE HEAD",
    committee: "Social Media",
    image: "/COMMITTEES/Mohamed Al-Amir.webp",
    order: 5,
    needsReview: false,
  },

  // ==========================================
  // Available Team Members (Flagged for Review)
  // Verified Name & Image Path; Role / Committee Pending Manual Confirmation
  // ==========================================
  {
    id: "abdulrahman-ashraf",
    name: "Abdulrahman Ashraf",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Abdulrahman Ashraf.webp",
    order: 6,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "adham-ahmed",
    name: "Adham Ahmed",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Adham Ahmed.webp",
    order: 7,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "ahmed-mohsen",
    name: "Ahmed Mohsen",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Ahmed Mohsen.webp",
    order: 8,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "ahmed-samir",
    name: "Ahmed Samir",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Ahmed Samir.webp",
    order: 9,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "farida-mohamed",
    name: "Farida Mohamed",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Farida Mohamed.webp",
    order: 10,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "habiba-ahmed",
    name: "Habiba Ahmed",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Habiba Ahmed.webp",
    order: 11,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "mohamed-ibrahim",
    name: "Mohamed Ibrahim",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/mohamed ibrahim.webp",
    order: 12,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "mohamed-nagi",
    name: "Mohamed Nagi",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Mohamed Nagi.webp",
    order: 13,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "mohamed-sherif",
    name: "Mohamed Sherif",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Mohamed Sherif.webp",
    order: 14,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "omar-mehawed",
    name: "Omar Mehawed",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Omar Mehawed.webp",
    order: 15,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "saif-kambo",
    name: "Saif Kambo",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Saif Kambo.webp",
    order: 16,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "youssef-soliman",
    name: "Youssef Soliman",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Youssef soliman.webp",
    order: 17,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "ziad-ayman",
    name: "Ziad Ayman",
    role: "HEAD",
    committee: "PENDING_VERIFICATION",
    image: "/COMMITTEES/Ziad Ayman.webp",
    order: 18,
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "marwan-alt",
    name: "Marwan Awad (Alt)",
    role: "LEADER",
    committee: "Organizing Committee",
    image: "/COMMITTEES/marwan.webp",
    order: 19,
    needsReview: false,
    reviewNotes: "Alternate portrait for Marwan Awad.",
    isAlternate: true,
  },
];

/**
 * Utility helpers
 */
export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return teamMembers.find((m) => m.id === id);
};

export const getMembersByCommittee = (committee: string): TeamMember[] => {
  return teamMembers.filter((m) => m.committee === committee);
};

export const getVerifiedMembers = (): TeamMember[] => {
  return teamMembers.filter((m) => !m.needsReview && !m.isAlternate);
};

export const getPendingReviewMembers = (): TeamMember[] => {
  return teamMembers.filter((m) => m.needsReview && !m.isAlternate);
};

/**
 * Returns distinct active team members for gallery presentation,
 * excluding alternate photos to avoid duplicate entries.
 */
export const getGalleryMembers = (): TeamMember[] => {
  return teamMembers.filter((m) => !m.isAlternate);
};