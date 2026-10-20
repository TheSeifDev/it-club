export type LeadershipRole =
  | "Head"
  | "Vice Head"
  | "Leader"
  | "Supervisor"
  | "Main"
  | "HEAD"
  | "VICE HEAD"
  | "LEADER"
  | "SUPERVISOR"
  | "MAIN"
  | "CLUB_SUP"
  | "CLUB_HEAD"
  | "CLUB_VICE_HEAD"
  | "VICE_HEAD"
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

  const isSupervisor =
    upperRole === "SUPERVISOR" ||
    upperRole === "SUP" ||
    upperRole === "CLUB_SUP" ||
    upperRole === "CLUB SUP";

  const isHead =
    upperRole === "HEAD" ||
    upperRole === "CLUB_HEAD" ||
    upperRole === "CLUB HEAD";

  const isViceHead =
    upperRole === "VICE HEAD" ||
    upperRole === "VICE_HEAD" ||
    upperRole === "V. HEAD" ||
    upperRole === "V.HEAD" ||
    upperRole === "V_HEAD" ||
    upperRole === "CLUB_VICE_HEAD" ||
    upperRole === "CLUB VICE HEAD";

  const isLeader = upperRole === "LEADER";

  if (isSupervisor) {
    if (abbrev === "CLUB" || c.toLowerCase() === "it club" || upperRole === "CLUB_SUP" || upperRole === "CLUB SUP") {
      return "CLUB SUPERVISOR";
    }
    return abbrev ? `SUPERVISOR OF ${abbrev}` : "SUPERVISOR";
  }

  if (isHead) {
    if (abbrev === "CLUB" || c.toLowerCase() === "it club" || upperRole === "CLUB_HEAD" || upperRole === "CLUB HEAD") {
      return "HEAD OF CLUB";
    }
    return abbrev ? `HEAD OF ${abbrev}` : "HEAD";
  }

  if (isViceHead) {
    if (abbrev === "CLUB" || c.toLowerCase() === "it club" || upperRole === "CLUB_VICE_HEAD" || upperRole === "CLUB VICE HEAD") {
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
  isAlumni?: boolean;
  linkedin?: string;
  github?: string;
  portfolio?: string;
};

export const MEMBER_CUTOUT_MAP: Record<string, string> = {
  "ahmed-samir": "/COMMITTEES/cutouts/ahmed-samir.webp",
  "ahmed-mohsen": "/COMMITTEES/cutouts/ahmed-mohsen.webp",
  "mohamed-ibrahim": "/COMMITTEES/cutouts/mohamed-ibrahim.webp",
  "seif-ayman": "/COMMITTEES/cutouts/seif-ayman.webp",
  "farida-mohamed": "/COMMITTEES/cutouts/farida-mohamed.webp",
  "mahmoud-sameh": "/COMMITTEES/cutouts/mahmoud-sameh.webp",
  "marwan-awad": "/COMMITTEES/cutouts/marwan-awad.webp",
  "marwan": "/COMMITTEES/cutouts/marwan-awad.webp",
  "shahd-ahssen": "/COMMITTEES/cutouts/shahd-ahssen.webp",
  "mohamed-al-amir": "/COMMITTEES/cutouts/mohamed-al-amir.webp",
  "abdulrahman-ashraf": "/COMMITTEES/cutouts/abdulrahman-ashraf.webp",
  "adham-ahmed": "/COMMITTEES/cutouts/adham-ahmed.webp",
  "habiba-ahmed": "/COMMITTEES/cutouts/habiba-ahmed.webp",
  "mohamed-nagi": "/COMMITTEES/cutouts/mohamed-nagi.webp",
  "mohamed-sherif": "/COMMITTEES/cutouts/mohamed-sherif.webp",
  "omar-mehawed": "/COMMITTEES/cutouts/omar-mehawed.webp",
  "saif-kambo": "/COMMITTEES/cutouts/saif-kambo.webp",
  "youssef-soliman": "/COMMITTEES/cutouts/youssef-soliman.webp",
  "ziad-ayman": "/COMMITTEES/cutouts/ziad-ayman.webp",
  "merna": "/COMMITTEES/cutouts/merna.webp",
  "sherif-hamdy": "/COMMITTEES/cutouts/sherif-hamdy.webp",
  "fares": "/COMMITTEES/cutouts/fares.webp",
  "islam-el-sayed": "/COMMITTEES/cutouts/islam-el-sayed.webp",
  "nour": "/COMMITTEES/cutouts/nour.webp",
  "menna": "/COMMITTEES/cutouts/menna.webp",
  "habiba-mounir": "/COMMITTEES/cutouts/habiba-mounir.webp",
  "saber": "/COMMITTEES/cutouts/saber.webp",
  "benjamin": "/COMMITTEES/cutouts/benjamin.webp",
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
    cutoutImage: "/COMMITTEES/cutouts/ahmed-samir.webp",
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
    cutoutImage: "/COMMITTEES/cutouts/ahmed-mohsen.webp",
    order: 2,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "adham-ahmed",
    name: "Adham Ahmed",
    role: "Head",
    committee: "IT Club",
    image: "/COMMITTEES/Adham Ahmed.webp",
    cutoutImage: "/COMMITTEES/cutouts/adham-ahmed.webp",
    order: 3,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "fares",
    name: "Fares",
    role: "Vice Head",
    committee: "IT Club",
    image: "/COMMITTEES/Fares.webp",
    cutoutImage: "/COMMITTEES/cutouts/fares.webp",
    order: 4,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mohamed-ibrahim",
    name: "Mohamed Ibrahim",
    role: "Supervisor ",
    committee: "Information Technology",
    image: "/COMMITTEES/mohamed ibrahim.webp",
    cutoutImage: "/COMMITTEES/cutouts/mohamed-ibrahim.webp",
    order: 5,
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
    cutoutImage: "/COMMITTEES/cutouts/seif-ayman.webp",
    order: 6,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
    linkedin: "https://www.linkedin.com/in/seif-ayman-47257a2a3/",
    github: "https://github.com/TheSeifDev",
    portfolio: "https://seifdev.vercel.app",
  },
  {
    id: "ziad-ayman",
    name: "Ziad Ayman",
    role: "Leader",
    committee: "Information Technology",
    image: "/COMMITTEES/Ziad Ayman.webp",
    cutoutImage: "/COMMITTEES/cutouts/ziad-ayman.webp",
    order: 7,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "omar-mehawed",
    name: "Omar Mehawed",
    role: "Head",
    committee: "Public Relations",
    image: "/COMMITTEES/Omar Mehawed.webp",
    cutoutImage: "/COMMITTEES/cutouts/omar-mehawed.webp",
    order: 8,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "marwan-awad",
    name: "Marwan Awad",
    role: "Head",
    committee: "Human Resources",
    image: "/COMMITTEES/marwan.webp",
    cutoutImage: "/COMMITTEES/cutouts/marwan-awad.webp",
    order: 9,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "islam-el-sayed",
    name: "Islam El-Sayed",
    role: "Vice Head",
    committee: "Human Resources",
    image: "/COMMITTEES/Islam El-Sayed.webp",
    cutoutImage: "/COMMITTEES/cutouts/islam-el-sayed.webp",
    order: 10,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "nour",
    name: "Nour",
    role: "Leader",
    committee: "Social Media",
    image: "/COMMITTEES/Nour.webp",
    cutoutImage: "/COMMITTEES/cutouts/nour.webp",
    order: 11,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "abdulrahman-ashraf",
    name: "Abdulrahman Ashraf",
    role: "Head",
    committee: "Social Media",
    image: "/COMMITTEES/Abdulrahman Ashraf.webp",
    cutoutImage: "/COMMITTEES/cutouts/abdulrahman-ashraf.webp",
    order: 12,
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
    cutoutImage: "/COMMITTEES/cutouts/mohamed-al-amir.webp",
    order: 13,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "menna",
    name: "Menna",
    role: "leader",
    committee: "Social Media",
    image: "/COMMITTEES/menna.webp",
    cutoutImage: "/COMMITTEES/cutouts/menna.webp",
    order: 14,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "merna",
    name: "Merna",
    role: "Vice Head",
    committee: "Social Media",
    image: "/COMMITTEES/Merna.webp",
    cutoutImage: "/COMMITTEES/cutouts/merna.webp",
    order: 15,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "youssef-soliman",
    name: "Youssef Soliman",
    role: "leader",
    committee: "Social Media",
    image: "/COMMITTEES/Youssef soliman.webp",
    cutoutImage: "/COMMITTEES/cutouts/youssef-soliman.webp",
    order: 16,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "habiba-mounir",
    name: "Habiba Mounir",
    role: "Head",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Habiba Mounir.webp",
    cutoutImage: "/COMMITTEES/cutouts/habiba-mounir.webp",
    order: 17,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mahmoud-sameh",
    name: "Mahmoud Sameh",
    role: "Vice Head",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Mahmoud Sameh.webp",
    cutoutImage: "/COMMITTEES/cutouts/mahmoud-sameh.webp",
    order: 18,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "farida-mohamed",
    name: "Farida Mohamed",
    role: "Supervisor",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Farida Mohamed.webp",
    cutoutImage: "/COMMITTEES/cutouts/farida-mohamed.webp",
    order: 19,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "shahd-ahssen",
    name: "Shahd Ahssen",
    role: "Supervisor",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Shahd Ahssen.webp",
    cutoutImage: "/COMMITTEES/cutouts/shahd-ahssen.webp",
    order: 20,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "habiba-ahmed",
    name: "Habiba Ahmed",
    role: "Supervisor",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Habiba Ahmed.webp",
    cutoutImage: "/COMMITTEES/cutouts/habiba-ahmed.webp",
    order: 21,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mohamed-nagi",
    name: "Mohamed Nagi",
    role: "Supervisor",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Mohamed Nagi.webp",
    cutoutImage: "/COMMITTEES/cutouts/mohamed-nagi.webp",
    order: 22,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "saber",
    name: "Saber",
    role: "Supervisor",
    committee: "Organizing Committee",
    image: "/COMMITTEES/saber.webp",
    cutoutImage: "/COMMITTEES/cutouts/saber.webp",
    order: 23,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "saif-kambo",
    name: "Saif Kambo",
    role: "Main",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Saif Kambo.webp",
    cutoutImage: "/COMMITTEES/cutouts/saif-kambo.webp",
    order: 24,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "benjamin",
    name: "Benjamin",
    role: "Supervisor of sm",
    committee: "Organizing Committee",
    image: "/COMMITTEES/benjamin.webp",
    cutoutImage: "/COMMITTEES/cutouts/benjamin.webp",
    order: 25,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    needsReview: false,
  },
  {
    id: "mohamed-sherif",
    name: "Mohamed Sherif",
    role: "Main",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Mohamed Sherif.webp",
    cutoutImage: "/COMMITTEES/cutouts/mohamed-sherif.webp",
    order: 26,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    isAlumni: true,
    needsReview: false,
  },
  {
    id: "sherif-hamdy",
    name: "Sherif Hamdy",
    role: "Main",
    committee: "Organizing Committee",
    image: "/COMMITTEES/Sherif.webp",
    cutoutImage: "/COMMITTEES/cutouts/sherif-hamdy.webp",
    order: 27,
    countryName: "EGYPT",
    countryFlag: "🇪🇬",
    countryCode: "EG",
    isAlumni: true,
    needsReview: false,
  },
];

export const unverifiedLeadershipPositions = [
  {
    role: "CLUB_SUP",
    committee: "IT Club",
    name: "Fatma (فاطمه)",
    status: "UNRESOLVED",
    notes: "Club Supervisor (CLUB SUP) shown on organizational chart; no canonical record or portrait asset exists in project assets.",
  },
  {
    role: "SUPERVISOR",
    committee: "Social Media",
    name: "Hosny (حسني)",
    status: "UNRESOLVED",
    notes: "Social Media Supervisor (SUP SM) shown on organizational chart; no canonical record or portrait asset exists in project assets.",
  },
  {
    role: "HEAD",
    committee: "Organizing Committee",
    name: "Mariam (مريم)",
    status: "UNRESOLVED",
    notes: "Organizing Committee Co-Head (HEAD OC) shown on organizational chart alongside Habiba Mounir; no canonical record or portrait asset exists in project assets.",
  },
  {
    role: "VICE_HEAD",
    committee: "Information Technology",
    name: "Adham (أدهم - IT)",
    status: "UNRESOLVED",
    notes: "IT Vice Head (VICE IT) shown on organizational chart with first name Adham; canonical Adham record is assigned to Club Head with existing portrait asset, leaving secondary IT Vice Head unmapped.",
  },
  {
    role: "HEAD",
    committee: "Research & Development",
    name: "Unassigned",
    status: "UNRESOLVED",
    notes: "Head of Research & Development identity and photo not yet confirmed in project assets.",
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
      ((id === "marwan" || id === "marwan-alt") && m.id === "marwan-awad")
  );
};

export const getMembersByCommittee = (committee: string): TeamMember[] => {
  return teamMembers.filter((m) => m.committee === committee && !m.isAlternate && !m.isAlumni);
};

export const getVerifiedMembers = (): TeamMember[] => {
  return teamMembers.filter((m) => !m.needsReview && !m.isAlternate && !m.isAlumni);
};

export const getPendingReviewMembers = (): TeamMember[] => {
  return teamMembers.filter((m) => m.needsReview && !m.isAlternate && !m.isAlumni);
};

export const getLegitimateMembers = (): TeamMember[] => {
  return teamMembers
    .filter((m) => !m.isAlternate && !m.isAlumni)
    .sort((a, b) => a.order - b.order);
};

export const getGalleryMembers = (): TeamMember[] => {
  return getLegitimateMembers();
};

export const getFeaturedHeroMembers = (): TeamMember[] => {
  return getLegitimateMembers().slice(0, 10);
};

export const getAlumniMembers = (): TeamMember[] => {
  return teamMembers
    .filter((m) => !!m.isAlumni && !m.isAlternate)
    .sort((a, b) => a.order - b.order);
};

export interface TeamDataDiagnosticResult {
  totalRecords: number;
  legitimateMembersCount: number;
  alternatePortraitsCount: number;
  needsReviewCount: number;
  alumniCount: number;
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

  const legitimate = teamMembers.filter((m) => !m.isAlternate && !m.isAlumni);
  const alternates = teamMembers.filter((m) => m.isAlternate);
  const alumni = teamMembers.filter((m) => !!m.isAlumni && !m.isAlternate);
  const needsReview = teamMembers.filter((m) => m.needsReview && !m.isAlternate && !m.isAlumni);

  const result: TeamDataDiagnosticResult = {
    totalRecords: teamMembers.length,
    legitimateMembersCount: legitimate.length,
    alternatePortraitsCount: alternates.length,
    needsReviewCount: needsReview.length,
    alumniCount: alumni.length,
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
