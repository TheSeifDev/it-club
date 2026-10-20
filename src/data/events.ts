export type EventCategory =
  | "organized"
  | "attended"
  | "workshops"
  | "upcoming";

export interface EventCategoryConfig {
  id: EventCategory | "all";
  label: string;
  arabicLabel: string;
  description: string;
  accentColor: string;
}

export interface EventItem {
  id: string;
  title: string;
  arabicTitle: string;
  category: EventCategory;
  categoryLabel: string;
  role: string;
  date: string;
  location: string;
  shortDescription: string;
  fullDescription: string;
  featured?: boolean;
  coverImage?: string;
  trackAffiliation: string;
  accentColor: string;
  highlights?: string[];
  tags: string[];
  externalLink?: string;
}

export const EVENT_CATEGORIES: EventCategoryConfig[] = [
  {
    id: "all",
    label: "All Events",
    arabicLabel: "كل الفعاليات",
    description: "Chronological archive of all activities, hackathons, and gatherings.",
    accentColor: "#35d98a",
  },
  {
    id: "organized",
    label: "Organized by IT Club",
    arabicLabel: "من تنظيم النادي",
    description: "Flagship events, conferences, and intakes hosted and directed by IT Club.",
    accentColor: "#35d98a",
  },
  {
    id: "attended",
    label: "Attended by IT Club",
    arabicLabel: "حضور ومشاركات",
    description: "External summits, tech gatherings, and forums attended by club delegations.",
    accentColor: "#18c8ed",
  },
  {
    id: "workshops",
    label: "Workshops & Sessions",
    arabicLabel: "ورش العمل والجلسات",
    description: "Hands-on technical bootcamps, masterclasses, and skill accelerators.",
    accentColor: "#9b7cff",
  },
  {
    id: "upcoming",
    label: "Upcoming Events",
    arabicLabel: "الفعاليات القادمة",
    description: "Confirmed future competitions, hackathons, and cohort experiences.",
    accentColor: "#eaff00",
  },
];

export const IT_CLUB_EVENTS: EventItem[] = [
  {
    id: "it-club-hackathon-2026",
    title: "IT Club Annual Hackathon 2026",
    arabicTitle: "هاكاثون نادي تكنولوجيا المعلومات السنوي 2026",
    category: "upcoming",
    categoryLabel: "Upcoming Events",
    role: "Organizer & Host",
    date: "Fall 2026 Season",
    location: "BATU Main Campus & Tech Hub",
    shortDescription:
      "Our flagship university hackathon challenging student teams to architect, build, and pitch real-world software and hardware prototypes.",
    fullDescription:
      "The IT Club Annual Hackathon brings together ambitious university students for intensive collaborative building. Supported by official club sponsors and academic faculty at BATU, participating squads receive direct mentorship from senior engineers, compete in specialized tracks, and present their prototypes before an industry jury.",
    featured: true,
    coverImage: "/spotlight-stage.webp",
    trackAffiliation: "All Tracks (IT, R&D, OC, PR, SM, HR)",
    accentColor: "#eaff00",
    highlights: [
      "48-hour continuous product hacking challenge",
      "One-on-one mentorship from experienced software practitioners",
      "Live stage pitches in the BATU Grand Auditorium",
      "Direct project incubation and sponsor recruitment access",
    ],
    tags: ["Hackathon", "Competitive Hacking", "Prototypes", "Prizes"],
    externalLink: "/register",
  },
  {
    id: "it-club-recruitment-2026",
    title: "IT Club Annual Recruitment & Selection Days",
    arabicTitle: "أيام التقديم والمقابلات السنوية لنادي تكنولوجيا المعلومات",
    category: "organized",
    categoryLabel: "Organized by IT Club",
    role: "Organizer & Host",
    date: "October 17, 2026",
    location: "BATU Campus (Benha University of Applied Technology)",
    shortDescription:
      "The comprehensive annual member intake connecting prospective tech students across all six specialized IT Club tracks.",
    fullDescription:
      "Our annual recruitment cycle welcomes hundreds of ambitious university students to Register, interview, and join the IT Club family. Over the course of the selection period, candidates undergo technical and behavioral interviews held on October 17, 2026 conducted by our committee heads, concluding with an induction day and cross-track team integration.",
    featured: true,
    coverImage: "/spotlight-stage.webp",
    trackAffiliation: "All Tracks",
    accentColor: "#35d98a",
    highlights: [
      "Interviews held on October 17, 2026 by all 6 specialized committee heads",
      "Structured behavioral and technical candidate assessment workflows",
      "Onboarding workshops and cross-track collaboration kickoff",
    ],
    tags: ["Recruitment", "Interviews", "Onboarding", "BATU Campus"],
    externalLink: "/register",
  },
  {
    id: "batu-tech-summit-2026",
    title: "BATU Tech Summit & Student Innovation Forum",
    arabicTitle: "قمة تكنولوجيا المعلومات وملتقى الابتكار الطلابي",
    category: "organized",
    categoryLabel: "Organized by IT Club",
    role: "Host & Operations Organizer",
    date: "2026 Season",
    location: "BATU Main Auditorium",
    shortDescription:
      "University-wide gathering showcasing engineering student projects, technical demos, and keynote talks with industry leaders.",
    fullDescription:
      "Organized by the IT Club Organizing Committee and Public Relations teams in collaboration with campus leadership, this summit unites students, faculty mentors, and external technology partners for an inspiring day of keynotes, tech booths, and project demonstrations.",
    featured: false,
    coverImage: "/spotlight-stage.webp",
    trackAffiliation: "Organizing Committee & Public Relations",
    accentColor: "#ffab18",
    highlights: [
      "Keynote presentations on modern software systems and infrastructure",
      "Interactive student project exhibitions and hardware showcases",
      "Professional networking between university students and tech sponsors",
    ],
    tags: ["Summit", "Keynotes", "Exhibition", "Student Projects"],
  },
  {
    id: "ai-summit-mena",
    title: "AI Summit MENA (Cairo Edition)",
    arabicTitle: "قمة الذكاء الاصطناعي في الشرق الأوسط وشمال أفريقيا",
    category: "attended",
    categoryLabel: "Attended by IT Club",
    role: "Community Delegation & Attendees",
    date: "October 2026",
    location: "Cairo, Egypt",
    shortDescription:
      "Regional artificial intelligence activation week bringing together AI researchers, startup founders, and technical communities across the Arab world.",
    fullDescription:
      "IT Club delegates and track heads attended the premier AI Summit MENA gathering in Cairo. Members participated in deep-dive technical sessions spanning AI in Tech & Infrastructure, LLMs in Production, and Creative Generative AI, returning to club workshops with practical insights and new ecosystem connections.",
    featured: true,
    coverImage: "/spotlight-stage.webp",
    trackAffiliation: "Research & Development / IT",
    accentColor: "#18c8ed",
    highlights: [
      "Student delegation representing BATU across multi-track keynote stages",
      "Technical breakout sessions on generative AI, inference, and cloud deployment",
      "Direct discussions with regional technology executives and startup founders",
    ],
    tags: ["AI", "Machine Learning", "Regional Summit", "Delegation"],
  },
  {
    id: "cairo-startup-tech-meetup",
    title: "Cairo Tech Ecosystem & Startup Gathering",
    arabicTitle: "ملتقى مجتمع الشركات التقنية والشركات الناشئة بالقاهرة",
    category: "attended",
    categoryLabel: "Attended by IT Club",
    role: "Student Delegations & Community Participants",
    date: "2026 Season",
    location: "Cairo, Egypt",
    shortDescription:
      "External tech industry meetup connecting developer communities, startup founders, and talent accelerators across Egypt.",
    fullDescription:
      "Members from IT Club's Public Relations, HR, and Technology committees attended sessions with tech ecosystem partners to discuss student talent pipelines, tech sponsorships, and collaborative workshops with regional accelerators.",
    featured: false,
    trackAffiliation: "Public Relations & HR",
    accentColor: "#ff3ca7",
    highlights: [
      "Partnership dialogues with technology accelerators including IceAlex and sponsors",
      "Actionable insights into tech hiring and software engineering internships",
    ],
    tags: ["Ecosystem", "Partnerships", "Networking", "Startups"],
  },
  {
    id: "nextjs-modern-web-bootcamp",
    title: "Modern Web Engineering with Next.js & React 19",
    arabicTitle: "ورشة عمل هندسة الويب الحديثة باستخدام Next.js و React 19",
    category: "workshops",
    categoryLabel: "Workshops & Sessions",
    role: "Organized by IT Committee",
    date: "Bi-Weekly Session",
    location: "BATU Computer Labs & Virtual Stage",
    shortDescription:
      "Hands-on technical workshop covering server components, modern CSS, TypeScript rigor, and responsive UI architecture.",
    fullDescription:
      "Conducted by the Information Technology track leads to train club members on production software engineering practices, clean code conventions, component encapsulation, and modern full-stack web application development.",
    featured: false,
    coverImage: "/spotlight-stage.webp",
    trackAffiliation: "Information Technology",
    accentColor: "#18c8ed",
    highlights: [
      "Building production-grade web interfaces with Next.js and React 19",
      "State management, component accessibility, and typography architecture",
      "Hands-on coding exercises and live pull request review demonstrations",
    ],
    tags: ["Web Dev", "Next.js", "React", "TypeScript", "Hands-on"],
  },
  {
    id: "git-github-collaboration-workshop",
    title: "Git, GitHub & Production Collaboration Bootcamp",
    arabicTitle: "مخيم عملي لإدارة المشاريع والتعاون التقني عبر Git و GitHub",
    category: "workshops",
    categoryLabel: "Workshops & Sessions",
    role: "Organized by IT & R&D Committees",
    date: "Hands-on Workshop",
    location: "BATU Tech Hub",
    shortDescription:
      "Practical masterclass on branch management, pull requests, git conflicts, and automated CI/CD pipeline workflows.",
    fullDescription:
      "An intensive technical workshop designed to prepare all club members for real-world software workflows, code review etiquette, git rebasing, and open-source collaboration hygiene.",
    featured: false,
    coverImage: "/spotlight-stage.webp",
    trackAffiliation: "Information Technology & R&D",
    accentColor: "#9b7cff",
    highlights: [
      "Mastering interactive rebasing, merge conflict resolution, and branching models",
      "Automating linting and build checks with modern continuous integration",
      "Git commit hygiene and pull request documentation standards",
    ],
    tags: ["Git", "GitHub", "DevOps", "Version Control", "Workflow"],
  },
];
