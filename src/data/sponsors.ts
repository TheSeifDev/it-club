export interface SponsorCategory {
  id: string;
  name: string;
  arabicName: string;
  description?: string;
  badgeColor?: string;
  order: number;
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  logoDark?: string;
  category: string;
  website?: string;
  description: string;
  order: number;
  theme?: "dark" | "light" | "any";
  featured?: boolean;
  tierLabel?: string;
}

export interface PartnershipOpportunity {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  arabicTitle: string;
  description: string;
  bgImage: string;
  accentColor: string;
  contributions: string[];
  clubOffers: string[];
  ctaLabel: string;
}

export interface PartnershipBenefit {
  title: string;
  description: string;
  iconName: "users" | "code" | "graduation" | "sparkles" | "network";
  accentColor: string;
}

/**
 * Confirmed partnership categories.
 */
export const SPONSOR_CATEGORIES: SponsorCategory[] = [
  {
    id: "strategic",
    name: "Strategic & Ecosystem Partners",
    arabicName: "شركاء المجتمع والاستراتيجية",
    description: "Anchor organizations accelerating tech talent and university community initiatives.",
    badgeColor: "#35d98a",
    order: 1,
  },
  {
    id: "venue",
    name: "Venue & Workspace Partners",
    arabicName: "شركاء المساحات والتنظيم",
    description: "Creative spaces and innovation hubs hosting our hackathons, meetups, and workshops.",
    badgeColor: "#18c8ed",
    order: 2,
  },
];

/**
 * Master Registry of Real, Verified Partner Records.
 * Only verified partners with real assets are included.
 */
export const sponsors: Sponsor[] = [
  {
    id: "icealex",
    name: "icealex",
    logo: "/sponsors/icealex.svg",
    category: "strategic",
    website: "https://icealex.com",
    description: "Technology Innovation Hub & Ecosystem Catalyst",
    order: 1,
    theme: "dark",
    featured: true,
    tierLabel: "COMMUNITY HUB PARTNER",
  },
  {
    id: "wrkr",
    name: "WRK+R",
    logo: "/sponsors/wrkr.svg",
    category: "venue",
    website: "https://wrkr.space",
    description: "Creative Innovation Workspace & Venue Partner",
    order: 2,
    theme: "dark",
    featured: true,
    tierLabel: "VENUE & COLLABORATION PARTNER",
  },
];

/**
 * Real Partnership Opportunities (replacing artificial spotlight packages).
 */
export const PARTNERSHIP_OPPORTUNITIES: PartnershipOpportunity[] = [
  {
    id: "technology",
    category: "TECHNOLOGY",
    categoryLabel: "Technology Partners",
    title: "Software, Cloud & Infrastructure",
    arabicTitle: "شركاء التكنولوجيا والبنية السحابية",
    description:
      "For organizations providing technical tools, software licenses, cloud credits, APIs, development platforms, hosting, or computing infrastructure.",
    bgImage: "/images/partnerships/technology_partners.webp",
    accentColor: "#18c8ed",
    contributions: [
      "Cloud credits, hosting infrastructure, or compute quotas",
      "Developer tool licenses, IDE subscriptions, or API access",
      "Enterprise software sandboxes for student testing",
      "Technical documentation and architecture guidelines",
    ],
    clubOffers: [
      "Rapid tool adoption by 500+ active student engineers",
      "Dedicated developer workshops and live tool demos",
      "Formal acknowledgment on IT Club website & repos",
      "Valuable product feedback from emerging builders",
    ],
    ctaLabel: "Discuss Technology Partnership",
  },
  {
    id: "technical_support",
    category: "HARDWARE & ENGINEERING",
    categoryLabel: "Technical Support Partners",
    title: "Hardware, Equipment & Lab Resources",
    arabicTitle: "شركاء الدعم الفني والمعدات",
    description:
      "For engineering companies, labs, and hardware providers supplying physical components, testing equipment, and technical expertise.",
    bgImage: "/images/partnerships/technical_support.webp",
    accentColor: "#ffab18",
    contributions: [
      "Microcontroller kits, sensors, IoT modules, and robotics hardware",
      "Laboratory testing equipment, oscilloscopes, and tools",
      "Engineering consultation and technical review assistance",
      "Hardware prototyping components for student hackathons",
    ],
    clubOffers: [
      "Direct showcase of hardware in student capstone projects",
      "Featured recognition in technical challenge briefs",
      "Visibility across university engineering exhibitions",
      "Acknowledgment in associated club project media",
    ],
    ctaLabel: "Discuss Technical Support",
  },
  {
    id: "education",
    category: "EDUCATION & ACADEMIA",
    categoryLabel: "Education & Learning Partners",
    title: "Curriculum, Certifications & Training",
    arabicTitle: "شركاء التعليم والتطوير المهني",
    description:
      "For technical academies, certification bodies, and online learning platforms investing in future software engineers and tech leaders.",
    bgImage: "/images/partnerships/education_learning.webp",
    accentColor: "#9b7cff",
    contributions: [
      "Access to professional learning platforms and course libraries",
      "Certification exam vouchers for top-performing members",
      "Guest instructors for specialized deep-dive masterclasses",
      "Curriculum alignment guidance for technical bootcamps",
    ],
    clubOffers: [
      "Co-branded learning tracks and student study cohorts",
      "High-engagement attendance in specialized workshops",
      "Official recognition as an Education Partner across channels",
      "Opportunity to mentor high-potential student talent",
    ],
    ctaLabel: "Discuss Educational Collaboration",
  },
  {
    id: "community",
    category: "COMMUNITY & HUBS",
    categoryLabel: "Community & Event Partners",
    title: "Hackathons, Meetups & Ecosystem",
    arabicTitle: "شركاء الفعاليات والمجتمع التقني",
    description:
      "For technology meetups, developer communities, conferences, venue providers, and student organizations seeking meaningful cross-collaboration.",
    bgImage: "/images/partnerships/community_events.webp",
    accentColor: "#35d98a",
    contributions: [
      "Collaborative hackathon challenges and problem statements",
      "Venue access for workshops, code sprints, and conferences",
      "Speaker exchanges and panelist participation",
      "Joint promotional outreach across developer networks",
    ],
    clubOffers: [
      "Co-branded presence at BATU university tech summits",
      "Active participant delegations to partner conferences",
      "Cross-community engagement and collaborative hack nights",
      "Event-specific acknowledgment on all event materials",
    ],
    ctaLabel: "Discuss Community Alliance",
  },
  {
    id: "media",
    category: "MEDIA & BROADCAST",
    categoryLabel: "Media & Visibility Partners",
    title: "Storytelling, Press & Coverage",
    arabicTitle: "شركاء الإعلام والتغطية الرقمية",
    description:
      "For technology publications, podcast creators, media outlets, and digital platforms amplifying the impact of young Egyptian innovators.",
    bgImage: "/images/partnerships/media_visibility.webp",
    accentColor: "#ff3ca7",
    contributions: [
      "Featured press coverage of major club hackathons and demos",
      "Professional photo and video coverage during flagship events",
      "Podcast or video interviews highlighting student projects",
      "Digital media amplification across tech industry networks",
    ],
    clubOffers: [
      "Prominent media partner branding on livestreams and stages",
      "Official press access to keynotes, projects, and interviews",
      "Collaborative digital storytelling content",
      "Recognition on official event press releases and backdrops",
    ],
    ctaLabel: "Discuss Media Partnership",
  },
  {
    id: "supporter",
    category: "INDIVIDUAL & IMPACT",
    categoryLabel: "Featured Supporters",
    title: "Resource Grants & Project Incubation",
    arabicTitle: "الداعمون والمساهمون في الابتكار",
    description:
      "For organizations or individuals wishing to contribute resources, challenge prizes, or project grants without complex corporate agreements.",
    bgImage: "/images/partnerships/featured_supporter.webp",
    accentColor: "#eaff00",
    contributions: [
      "Project incubation grants for novel student prototypes",
      "Prize sponsorship for university hackathon tracks",
      "Direct technical advisory and mentor office hours",
      "Donations of books, licenses, or development hardware",
    ],
    clubOffers: [
      "Official Supporter recognition on the website",
      "Supporter badge and project attribution on supported work",
      "Direct updates on project milestones and student growth",
      "Invitation to demo days and annual community exhibitions",
    ],
    ctaLabel: "Become a Supporter",
  },
];

/**
 * Why Partner with IT Club Benefits.
 */
export const PARTNERSHIP_BENEFITS: PartnershipBenefit[] = [
  {
    title: "Engage Driven Technical Talent",
    description:
      "Connect directly with 500+ ambitious computer science and engineering students across six specialized committees at BATU.",
    iconName: "users",
    accentColor: "#35d98a",
  },
  {
    title: "Drive Developer Tool Adoption",
    description:
      "Introduce your APIs, cloud platforms, and developer tooling into real student projects, workshops, and hackathons.",
    iconName: "code",
    accentColor: "#18c8ed",
  },
  {
    title: "Support Applied Technical Education",
    description:
      "Bridge the gap between academic theory and production software through hands-on bootcamps, code reviews, and mentorship.",
    iconName: "graduation",
    accentColor: "#9b7cff",
  },
  {
    title: "Build Genuine Community Goodwill",
    description:
      "Establish a respected, enduring brand presence as an organization that actively invests in the next generation of builders.",
    iconName: "sparkles",
    accentColor: "#ffab18",
  },
  {
    title: "Foster Cross-Ecosystem Collaborations",
    description:
      "Collaborate with a vibrant network of university leaders, tech accelerators, venue spaces, and student communities.",
    iconName: "network",
    accentColor: "#ff3ca7",
  },
];

/**
 * Verified statistics from official IT Club records.
 */
export const verifiedSponsorStats = [
  { value: "500+", label: "ACTIVE MEMBERS" },
  { value: "6", label: "TECHNICAL TRACKS" },
  { value: "40+", label: "STUDENT LEADERS" },
  { value: "BATU", label: "HOST UNIVERSITY" },
];

/**
 * Active verified partners list.
 */
export const verifiedPartners: Sponsor[] = sponsors;

export interface CommunityPartner {
  id: string;
  name: string;
  arabicName?: string;
}

/**
 * Approved partner list for the Community section.
 * Exactly two organizations: Creativa and VentureX.
 */
export const approvedCommunityPartners: CommunityPartner[] = [
  {
    id: "creativa",
    name: "Creativa",
    arabicName: "كرياتيفا",
  },
  {
    id: "venturex",
    name: "VentureX",
    arabicName: "فينتشر إكس",
  },
];
