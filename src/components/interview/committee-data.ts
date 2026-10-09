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

export const COMMITTEE_ABBREVIATIONS: Record<string, string> = {
  "Information Technology": "IT",
  "Social Media": "SM",
  "Public Relations": "PR",
  "Human Resources": "HR",
  "Organizing Committee": "OC",
  "Research & Development": "R&D",
  "IT Club": "CLUB",
};

export const COMMITTEE_FULL_NAMES: Record<string, string> = {
  "IT": "INFORMATION TECHNOLOGY",
  "SM": "SOCIAL MEDIA",
  "PR": "PUBLIC RELATIONS",
  "HR": "HUMAN RESOURCES",
  "OC": "ORGANIZING COMMITTEE",
  "R&D": "RESEARCH & DEVELOPMENT",
  "CLUB": "IT CLUB",
  "IT CLUB": "IT CLUB",
  "Information Technology": "INFORMATION TECHNOLOGY",
  "Social Media": "SOCIAL MEDIA",
  "Public Relations": "PUBLIC RELATIONS",
  "Human Resources": "HUMAN RESOURCES",
  "Organizing Committee": "ORGANIZING COMMITTEE",
  "Research & Development": "RESEARCH & DEVELOPMENT",
  "IT Club": "IT CLUB",
};

export function formatRoleMetadata(
  role?: string,
  committee?: string,
  needsReview?: boolean
): string {
  if (needsReview || !role) {
    return "MAIN";
  }

  const r = role.trim();
  const upperRole = r.toUpperCase();

  if (
    upperRole === "LEADER" ||
    upperRole === "MEMBER" ||
    upperRole === "MAIN" ||
    upperRole.startsWith("LEADER OF")
  ) {
    return "MAIN";
  }

  const c = (committee || "").trim();
  const abbrev =
    COMMITTEE_ABBREVIATIONS[c] ||
    COMMITTEE_ABBREVIATIONS[
      Object.keys(COMMITTEE_ABBREVIATIONS).find(
        (key) => key.toLowerCase() === c.toLowerCase()
      ) || ""
    ] ||
    (c && c !== "PENDING_VERIFICATION" ? c.toUpperCase() : "");

  if (upperRole.includes(" OF ")) {
    if (upperRole.startsWith("LEADER OF")) {
      return "MAIN";
    }
    return upperRole;
  }

  const isHead = upperRole === "HEAD";
  const isViceHead = upperRole === "VICE HEAD";

  if (!isHead && !isViceHead) {
    return "MAIN";
  }

  if (abbrev === "CLUB" || c.toLowerCase() === "it club") {
    return isHead ? "HEAD OF CLUB" : "VICE HEAD OF CLUB";
  }

  if (abbrev) {
    return isHead ? `HEAD OF ${abbrev}` : `VICE HEAD OF ${abbrev}`;
  }

  return "MAIN";
}

export function formatCommitteeMetadata(committee?: string): string | undefined {
  if (!committee) return undefined;
  const c = committee.trim();
  if (
    !c ||
    c.toUpperCase() === "PENDING_VERIFICATION" ||
    c.toUpperCase() === "UNKNOWN" ||
    c.toUpperCase() === "NONE"
  ) {
    return undefined;
  }

  if (COMMITTEE_FULL_NAMES[c]) {
    return COMMITTEE_FULL_NAMES[c];
  }

  const matched = Object.keys(COMMITTEE_FULL_NAMES).find(
    (key) => key.toLowerCase() === c.toLowerCase()
  );
  if (matched) {
    return COMMITTEE_FULL_NAMES[matched];
  }

  return c.toUpperCase();
}

export interface MemberAboutDetails {
  aboutEn?: string;
  aboutAr?: string;
  responsibilities?: string[];
  note?: string;
}

export function getMemberAboutInfo(member: TeamMember): MemberAboutDetails {
  if (member.needsReview) {
    return {
      note:
        member.reviewNotes ||
        "Role and committee assignment are pending official confirmation. Verified profile data will be displayed once finalized.",
    };
  }

  const committee = (member.committee || "").trim().toLowerCase();

  if (committee === "it club" || committee === "club") {
    return {
      aboutEn:
        "Directs high-level strategy, empowers student tech leaders, and guides IT Club's cross-committee initiatives to foster a community of real builders.",
      aboutAr:
        "قيادة الرؤية الاستراتيجية وتمكين قادة التكنولوجيا من الطلاب وتوجيه مبادرات لجان النادي لبناء مجتمع حقيقي من المبتكرين.",
      responsibilities: [
        "Executive leadership and organizational strategy",
        "Cross-committee alignment, mentorship, and support",
        "Community empowerment and student growth initiatives",
      ],
    };
  }

  if (committee === "information technology" || committee === "it") {
    return {
      aboutEn:
        "Building the technical foundation of the club through software systems, web platforms, infrastructure, and real-world technology projects.",
      aboutAr:
        "بناء الأساس التقني للنادي من خلال البرمجيات والأنظمة والبنية التحتية والمشاريع التقنية الحقيقية.",
      responsibilities: [
        "Digital platform architecture and web engineering",
        "Technical systems maintenance and code quality standards",
        "Engineering workshops and technical mentorship",
      ],
    };
  }

  if (committee === "human resources" || committee === "hr") {
    return {
      aboutEn:
        "Building the people, culture, and internal systems that make the club stronger. HR connects members, supports teams, and creates an environment where everyone can grow.",
      aboutAr:
        "بناء الأفراد والثقافة والأنظمة الداخلية التي تجعل النادي أقوى. يهتم فريق الموارد البشرية بالأعضاء ويدعم الفرق ويخلق بيئة تساعد الجميع على التطور.",
      responsibilities: [
        "Talent recruitment and member onboarding workflows",
        "Team culture, motivation, and performance tracking",
        "Internal team dynamics and organizational development",
      ],
    };
  }

  if (committee === "public relations" || committee === "pr") {
    return {
      aboutEn:
        "Building strong relationships between the club, students, university, and external partners. PR manages communication, partnerships, outreach, and the club's public image.",
      aboutAr:
        "بناء علاقات قوية بين النادي والطلاب والجامعة والشركاء الخارجيين. يهتم فريق العلاقات العامة بالتواصل والشراكات والتعاون وإبراز صورة النادي.",
      responsibilities: [
        "External relations and university campus outreach",
        "Strategic sponsorships and institutional partnerships",
        "Official club representation and communications",
      ],
    };
  }

  if (committee === "social media" || committee === "sm") {
    return {
      aboutEn:
        "Turning ideas, activities, and achievements into content that represents the club and reaches the right audience across digital platforms.",
      aboutAr:
        "تحويل أفكار وأنشطة وإنجازات النادي إلى محتوى يعبر عنه ويصل إلى الجمهور المناسب عبر المنصات الرقمية.",
      responsibilities: [
        "Digital content strategy and multi-channel publishing",
        "Visual storytelling and community engagement",
        "Brand voice management and audience analytics",
      ],
    };
  }

  if (committee === "organizing committee" || committee === "oc") {
    return {
      aboutEn:
        "Planning and executing events, managing logistics, and making sure every experience runs smoothly from the first idea to the final moment.",
      aboutAr:
        "تخطيط وتنفيذ الفعاليات وإدارة التفاصيل التنظيمية والتأكد من خروج كل تجربة بالشكل المطلوب من أول فكرة وحتى النهاية.",
      responsibilities: [
        "Event operations, scheduling, and venue coordination",
        "Speaker hospitality and attendee journey management",
        "On-ground logistics and crisis management",
      ],
    };
  }

  if (
    committee === "research & development" ||
    committee === "research development" ||
    committee === "r&d" ||
    committee === "rnd"
  ) {
    return {
      aboutEn:
        "Exploring emerging technologies, experimenting with new ideas, and transforming research into practical projects and innovative solutions.",
      aboutAr:
        "استكشاف التقنيات الحديثة وتجربة الأفكار الجديدة وتحويل البحث والمعرفة إلى مشاريع وحلول مبتكرة.",
      responsibilities: [
        "Emerging technology research and rapid prototyping",
        "Technical innovation workshops and knowledge sharing",
        "Applied problem-solving and project incubation",
      ],
    };
  }

  return {
    aboutEn: `Contributing to ${member.committee} initiatives and advancing IT Club's mission.`,
    responsibilities: [
      "Committee initiatives execution",
      "Collaborative project contributions",
    ],
  };
}

export type TeamMember = {
  id: string;
  name: string;
  role: LeadershipRole;
  committee: CommitteeName;
  image: string;
  order: number;
  countryName?: string;
  countryFlag?: string;
  countryCode?: string;

  needsReview?: boolean;
  reviewNotes?: string;
  isAlternate?: boolean;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

export function isValidHttpsUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}
export const teamMembers: TeamMember[] = [
  {
    id: "ahmed-samir",
    name: "Ahmed Samir",
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/ken.webp",
    order: 4,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
    linkedin: "https://www.linkedin.com/in/seif-ayman-47257a2a3/",
    github: "https://github.com/TheSeifDev",
    portfolio: "https://seifdev.vercel.app",
  },
  {
    id: "farida-mohamed",
    name: "Farida Mohamed",
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/Farida Mohamed.webp",
    order: 5,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mahmoud-sameh",
    name: "Mahmoud Sameh",
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/Mohamed Al-Amir.webp",
    order: 9,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "abdulrahman-ashraf",
    name: "Abdulrahman Ashraf",
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
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
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/Ziad Ayman.webp",
    order: 18,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
  },
  {
    id: "merna",
    name: "Merna",
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/Merna.webp",
    order: 19,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role, committee assignment, and nationality pending official confirmation.",
  },
  {
    id: "marwan",
    name: "Marwan Awad ",
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/marwan.webp",
    order: 20,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
    reviewNotes: "Alternate portrait for Marwan Awad.",
    isAlternate: true,
  },
  {
    id: "Sherif-alt",
    name: "Sherif Hamdy",
    role: "Main",
    committee: "IT CLUB",
    image: "/COMMITTEES/Sherif.webp",
    order: 21,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
    reviewNotes: "Alternate portrait for Marwan Awad.",
    isAlternate: true,
  },
];
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

export const getGalleryMembers = (): TeamMember[] => {
  return teamMembers
    .filter((m) => !m.isAlternate)
    .sort((a, b) => a.order - b.order);
};
