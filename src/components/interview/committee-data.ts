/**
 * Centralized Team & Committee Data Registry for IT Club.
 *
 * Seed verified leadership records are configured according to official club assignments.
 * All image paths reference static WebP assets under `/public/COMMITTEES/`.
 * Configurable country metadata supports national representation (e.g. 🇪🇬 EGYPT).
 */

export type LeadershipRole =
  | "Head"
  | "Vice Head"
  | "Leader"
  | "HEAD"
  | "VICE HEAD"
  | "LEADER"
  | string;

export const COMMITTEES = [
  "IT Club",
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
  /** Committee / Track name */
  committee: CommitteeName;
  /** Static path under /COMMITTEES/ */
  image: string;
  /** Explicit display order */
  order: number;
  /** Display country name (e.g. "EGYPT") */
  countryName?: string;
  /** Country flag symbol or emoji (e.g. "🇪🇬") */
  countryFlag?: string;
  /** Two-letter ISO country code (e.g. "EG") */
  countryCode?: string;
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
  // Initial Verified Leadership Records
  // ==========================================
  {
    id: "ahmed-samir",
    name: "Ahmed Samir",
    role: "Head",
    committee: "IT Club",
    image: "/COMMITTEES/Ahmed Samir.webp",
    order: 1,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "ahmed-mohsen",
    name: "Ahmed Mohsen",
    role: "Vice Head",
    committee: "IT Club",
    image: "/COMMITTEES/Ahmed Mohsen.webp",
    order: 2,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mohamed-ibrahim",
    name: "Mohamed Ibrahim",
    role: "Head",
    committee: "Information Technology",
    image: "/COMMITTEES/mohamed ibrahim.webp",
    order: 3,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "seif-ayman",
    name: "Seif Ayman",
    role: "Vice Head",
    committee: "Information Technology",
    image: "/COMMITTEES/Seif Ayman.webp",
    order: 4,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "farida-mohamed",
    name: "Farida Mohamed",
    role: "Head",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Farida Mohamed.webp",
    order: 5,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },

  // ==========================================
  // Verified Committee Leaders & Vice Heads
  // ==========================================
  {
    id: "mahmoud-sameh",
    name: "Mahmoud Sameh",
    role: "Leader",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Mahmoud Sameh.webp",
    order: 6,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "marwan-awad",
    name: "Marwan Awad",
    role: "Leader",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Marwan Awad.webp",
    order: 7,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "shahd-ahssen",
    name: "Shahd Ahssen",
    role: "Vice Head",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Shahd Ahssen.webp",
    order: 8,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mohamed-al-amir",
    name: "Mohamed Al-Amir",
    role: "Vice Head",
    committee: "Social Media",
    image: "/COMMITTEES/Mohamed Al-Amir.webp",
    order: 9,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },

  // ==========================================
  // Available Team Members from Image Inventory
  // (Portraits confirmed; Track/Role details pending official review)
  // ==========================================
  {
    id: "abdulrahman-ashraf",
    name: "Abdulrahman Ashraf",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Abdulrahman Ashraf.webp",
    order: 10,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "adham-ahmed",
    name: "Adham Ahmed",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Adham Ahmed.webp",
    order: 11,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "habiba-ahmed",
    name: "Habiba Ahmed",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Habiba Ahmed.webp",
    order: 12,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "mohamed-nagi",
    name: "Mohamed Nagi",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Mohamed Nagi.webp",
    order: 13,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "mohamed-sherif",
    name: "Mohamed Sherif",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Mohamed Sherif.webp",
    order: 14,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "omar-mehawed",
    name: "Omar Mehawed",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Omar Mehawed.webp",
    order: 15,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "saif-kambo",
    name: "Saif Kambo",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Saif Kambo.webp",
    order: 16,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "youssef-soliman",
    name: "Youssef Soliman",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Youssef soliman.webp",
    order: 17,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "ziad-ayman",
    name: "Ziad Ayman",
    role: "Leader",
    committee: "IT Club",
    image: "/COMMITTEES/Ziad Ayman.webp",
    order: 18,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "marwan-alt",
    name: "Marwan Awad (Alt)",
    role: "Leader",
    committee: "Organizing Committee",
    image: "/COMMITTEES/marwan.webp",
    order: 19,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
    reviewNotes: "Alternate portrait for Marwan Awad.",
    isAlternate: true,
  },
];

/**
 * Unconfirmed leadership positions tracked for completion
 */
export const unverifiedLeadershipPositions = [
  {
    role: "Head",
    committee: "Public Relations",
    status: "UNRESOLVED",
    notes: "Head of Public Relations identity and photo not yet confirmed in project assets.",
  },
  {
    role: "Head",
    committee: "Human Resources",
    status: "UNRESOLVED",
    notes: "Head of Human Resources identity and photo not yet confirmed in project assets.",
  },
  {
    role: "Head",
    committee: "Research & Development",
    status: "UNRESOLVED",
    notes: "Head of Research & Development identity and photo not yet confirmed in project assets.",
  },
  {
    role: "Head",
    committee: "Social Media",
    status: "UNRESOLVED",
    notes: "Head of Social Media identity and photo not yet confirmed in project assets.",
  },
] as const;

/**
 * Utility helpers
 */
export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return teamMembers.find(
    (m) =>
      m.id === id ||
      (id === "farida" && m.id === "farida-mohamed") ||
      (id === "farida-mohamed" && m.id === "farida"),
  );
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
 * excluding alternate photos to avoid duplicate cards.
 * Sorted by explicit display order.
 */
export const getGalleryMembers = (): TeamMember[] => {
  return teamMembers
    .filter((m) => !m.isAlternate)
    .sort((a, b) => a.order - b.order);
};