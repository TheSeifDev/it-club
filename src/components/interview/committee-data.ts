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
    upperRole === "MEMBER" ||
    upperRole === "MAIN"
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
      return abbrev ? `LEADER OF ${abbrev}` : "LEADER";
    }
    return upperRole;
  }

  const isHead = upperRole === "HEAD";
  const isViceHead = upperRole === "VICE HEAD";
  const isLeader = upperRole === "LEADER";

  if (isHead) {
    if (abbrev === "CLUB" || c.toLowerCase() === "it club") {
      return "HEAD OF CLUB";
    }
    return abbrev ? `HEAD OF ${abbrev}` : "HEAD";
  }

  if (isViceHead) {
    if (abbrev === "CLUB" || c.toLowerCase() === "it club") {
      return "VICE HEAD OF CLUB";
    }
    return abbrev ? `VICE HEAD OF ${abbrev}` : "VICE HEAD";
  }

  if (isLeader) {
    if (abbrev === "CLUB" || c.toLowerCase() === "it club") {
      return "LEADER";
    }
    return abbrev ? `LEADER OF ${abbrev}` : "LEADER";
  }

  return upperRole;
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
  cutoutImage?: string;
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

export const MEMBER_CUTOUT_MAP: Record<string, string> = {
  "ahmed-samir": "/COMMITTEES/cutouts/ahmed-samir.png",
  "ahmed-mohsen": "/COMMITTEES/cutouts/ahmed-mohsen.png",
  "mohamed-ibrahim": "/COMMITTEES/cutouts/mohamed-ibrahim.png",
  "seif-ayman": "/COMMITTEES/cutouts/seif-ayman.png",
  "farida-mohamed": "/COMMITTEES/cutouts/farida-mohamed.png",
  "mahmoud-sameh": "/COMMITTEES/cutouts/mahmoud-sameh.png",
  "marwan-awad": "/COMMITTEES/cutouts/marwan-awad.png",
  "shahd-ahssen": "/COMMITTEES/cutouts/shahd-ahssen.png",
  "mohamed-al-amir": "/COMMITTEES/cutouts/mohamed-al-amir.png",
  "abdulrahman-ashraf": "/COMMITTEES/cutouts/abdulrahman-ashraf.png",
  "adham-ahmed": "/COMMITTEES/cutouts/adham-ahmed.png",
  "habiba-ahmed": "/COMMITTEES/cutouts/habiba-ahmed.png",
  "mohamed-nagi": "/COMMITTEES/cutouts/mohamed-nagi.png",
  "mohamed-sherif": "/COMMITTEES/cutouts/mohamed-sherif.png",
  "omar-mehawed": "/COMMITTEES/cutouts/omar-mehawed.png",
  "saif-kambo": "/COMMITTEES/cutouts/saif-kambo.png",
  "youssef-soliman": "/COMMITTEES/cutouts/youssef-soliman.png",
  "ziad-ayman": "/COMMITTEES/cutouts/ziad-ayman.png",
  "merna": "/COMMITTEES/cutouts/merna.png",
  "sherif-hamdy": "/COMMITTEES/cutouts/sherif-hamdy.png",
};

export function getMemberCutoutImage(memberOrId?: TeamMember | string): string | undefined {
  if (!memberOrId) return undefined;
  const id = typeof memberOrId === "string" ? memberOrId : memberOrId.id;
  return MEMBER_CUTOUT_MAP[id] || (typeof memberOrId === "object" ? memberOrId.cutoutImage : undefined);
}

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
    role: "Head",
    committee: "IT Club",
    image: "/COMMITTEES/Ahmed Samir.webp",
    cutoutImage: "/COMMITTEES/cutouts/ahmed-samir.png",
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
    cutoutImage: "/COMMITTEES/cutouts/ahmed-mohsen.png",
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
    cutoutImage: "/COMMITTEES/cutouts/mohamed-ibrahim.png",
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
    image: "/COMMITTEES/ken.webp",
    cutoutImage: "/COMMITTEES/cutouts/seif-ayman.png",
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
    role: "Head",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Farida Mohamed.webp",
    cutoutImage: "/COMMITTEES/cutouts/farida-mohamed.png",
    order: 5,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mahmoud-sameh",
    name: "Mahmoud Sameh",
    role: "Leader",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Mahmoud Sameh.webp",
    cutoutImage: "/COMMITTEES/cutouts/mahmoud-sameh.png",
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
    cutoutImage: "/COMMITTEES/cutouts/marwan-awad.png",
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
    cutoutImage: "/COMMITTEES/cutouts/shahd-ahssen.png",
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
    cutoutImage: "/COMMITTEES/cutouts/mohamed-al-amir.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Abdulrahman Ashraf.webp",
    cutoutImage: "/COMMITTEES/cutouts/abdulrahman-ashraf.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Adham Ahmed.webp",
    cutoutImage: "/COMMITTEES/cutouts/adham-ahmed.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Habiba Ahmed.webp",
    cutoutImage: "/COMMITTEES/cutouts/habiba-ahmed.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Mohamed Nagi.webp",
    cutoutImage: "/COMMITTEES/cutouts/mohamed-nagi.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Mohamed Sherif.webp",
    cutoutImage: "/COMMITTEES/cutouts/mohamed-sherif.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Omar Mehawed.webp",
    cutoutImage: "/COMMITTEES/cutouts/omar-mehawed.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Saif Kambo.webp",
    cutoutImage: "/COMMITTEES/cutouts/saif-kambo.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Youssef soliman.webp",
    cutoutImage: "/COMMITTEES/cutouts/youssef-soliman.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Ziad Ayman.webp",
    cutoutImage: "/COMMITTEES/cutouts/ziad-ayman.png",
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
    committee: "IT Club",
    image: "/COMMITTEES/Merna.webp",
    cutoutImage: "/COMMITTEES/cutouts/merna.png",
    order: 19,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role, committee assignment, and nationality pending official confirmation.",
  },
  {
    id: "marwan",
    name: "Marwan Awad",
    role: "Leader",
    committee: "Organizing Committee",
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
    id: "sherif-hamdy",
    name: "Sherif Hamdy",
    role: "Main",
    committee: "IT Club",
    image: "/COMMITTEES/Sherif.webp",
    cutoutImage: "/COMMITTEES/cutouts/sherif-hamdy.png",
    order: 21,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: true,
    reviewNotes: "Role and committee assignment pending official confirmation.",
    isAlternate: false,
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
      (id === "Sherif-alt" && (m.id === "sherif-hamdy" || m.id === "Sherif-alt")) ||
      (id === "sherif-hamdy" && (m.id === "Sherif-alt" || m.id === "sherif-hamdy")) ||
      (id === "farida" && m.id === "farida-mohamed") ||
      (id === "farida-mohamed" && m.id === "farida") ||
      (id === "marwan-alt" && m.id === "marwan")
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

export const getLegitimateMembers = (): TeamMember[] => {
  return teamMembers
    .filter((m) => !m.isAlternate)
    .sort((a, b) => a.order - b.order);
};

export const getGalleryMembers = (): TeamMember[] => {
  return getLegitimateMembers();
};

export const getFeaturedHeroMembers = (): TeamMember[] => {
  return getLegitimateMembers().slice(0, 10);
};

export interface TeamDataDiagnosticResult {
  totalRecords: number;
  legitimateMembersCount: number;
  alternatePortraitsCount: number;
  needsReviewCount: number;
  duplicateIds: string[];
  duplicateNames: string[];
  missingNames: string[];
  missingImages: string[];
  invalidUrls: { id: string; field: string; url: string }[];
}

export function validateTeamData(): TeamDataDiagnosticResult {
  const ids = new Set<string>();
  const duplicateIds: string[] = [];
  const nameMap = new Map<string, string[]>();
  const missingNames: string[] = [];
  const missingImages: string[] = [];
  const invalidUrls: { id: string; field: string; url: string }[] = [];

  for (const m of teamMembers) {
    if (ids.has(m.id)) {
      duplicateIds.push(m.id);
    } else {
      ids.add(m.id);
    }

    if (!m.name || !m.name.trim()) {
      missingNames.push(m.id);
    } else {
      const normalized = m.name.trim().toLowerCase();
      const existing = nameMap.get(normalized) || [];
      existing.push(m.id);
      nameMap.set(normalized, existing);
    }

    if (!m.image || !m.image.trim()) {
      missingImages.push(m.id);
    }

    if (m.linkedin && !isValidHttpsUrl(m.linkedin)) {
      invalidUrls.push({ id: m.id, field: "linkedin", url: m.linkedin });
    }
    if (m.github && !isValidHttpsUrl(m.github)) {
      invalidUrls.push({ id: m.id, field: "github", url: m.github });
    }
    if (m.portfolio && !isValidHttpsUrl(m.portfolio)) {
      invalidUrls.push({ id: m.id, field: "portfolio", url: m.portfolio });
    }
  }

  const duplicateNames: string[] = [];
  nameMap.forEach((memberIds, name) => {
    const nonAlt = memberIds.filter((id) => {
      const member = teamMembers.find((m) => m.id === id);
      return !member?.isAlternate;
    });
    if (nonAlt.length > 1) {
      duplicateNames.push(name);
    }
  });

  const legitimate = teamMembers.filter((m) => !m.isAlternate);
  const alternates = teamMembers.filter((m) => m.isAlternate);
  const needsReview = teamMembers.filter((m) => m.needsReview && !m.isAlternate);

  const result: TeamDataDiagnosticResult = {
    totalRecords: teamMembers.length,
    legitimateMembersCount: legitimate.length,
    alternatePortraitsCount: alternates.length,
    needsReviewCount: needsReview.length,
    duplicateIds,
    duplicateNames,
    missingNames,
    missingImages,
    invalidUrls,
  };

  if (process.env.NODE_ENV === "development") {
    if (duplicateIds.length > 0) {
      console.warn("[TeamData Diagnostic] Duplicate IDs found:", duplicateIds);
    }
    if (duplicateNames.length > 0) {
      console.warn("[TeamData Diagnostic] Duplicate member names found:", duplicateNames);
    }
    if (missingImages.length > 0) {
      console.warn("[TeamData Diagnostic] Members with missing images:", missingImages);
    }
  }

  return result;
}
