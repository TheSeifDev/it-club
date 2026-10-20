export interface TrackTerrainItem {
  title: string;
  desc: string;
}

export interface TrackStats {
  sessions: string;
  speakers: string;
  days: string;
  time: string;
}

export interface TrackPartner {
  name: string;
  logo: string;
  description: string;
  website: string;
}

export interface TrackDefinition {
  id: string;
  anchorIds: string[];
  number: string;
  tag: string;
  title: string;
  arabicTitle: string;
  description: string;
  arabicDescription: string;
  color: string;
  glowColor: string;
  background: string;
  iconName: "users" | "megaphone" | "share2" | "calendar" | "code2" | "flask";
  stats: TrackStats;
  terrain: TrackTerrainItem[];
  whoItsFor: string[];
  memberIds: string[];
  partner?: TrackPartner;
}

export const IT_CLUB_TRACKS: TrackDefinition[] = [
  {
    id: "hr",
    anchorIds: ["hr"],
    number: "01",
    tag: "THE PEOPLE & CULTURE",
    title: "Human Resources",
    arabicTitle: "الموارد البشرية",
    description:
      "Building the people, culture, and internal systems that make the club stronger. HR connects members, supports teams, and creates an environment where everyone can grow.",
    arabicDescription:
      "بناء الأفراد والثقافة والأنظمة الداخلية التي تجعل النادي أقوى. يهتم فريق الموارد البشرية بالأعضاء ويدعم الفرق ويخلق بيئة تساعد الجميع على التطور.",
    color: "#35d98a",
    glowColor: "rgba(53, 217, 138, 0.4)",
    background: "#061b16",
    iconName: "users",
    stats: {
      sessions: "10+",
      speakers: "8+",
      days: "FULL SEASON",
      time: "ACTIVE",
    },
    terrain: [
      {
        title: "Talent Recruitment",
        desc: "Structured member onboarding, candidate evaluations, and recruitment operations.",
      },
      {
        title: "Team Culture",
        desc: "Fostering psychological safety, motivation, shared values, and community identity.",
      },
      {
        title: "Member Integration",
        desc: "Smooth onboarding pathways, buddy programs, and engagement check-ins.",
      },
      {
        title: "Performance & Feedback",
        desc: "Objective tracking, constructive growth reviews, and developmental roadmaps.",
      },
      {
        title: "Conflict Resolution",
        desc: "Empathetic communication, interpersonal mediation, and team harmonization.",
      },
      {
        title: "Leadership Mentorship",
        desc: "Preparing prospective heads, vice heads, and coordinators for leadership roles.",
      },
    ],
    whoItsFor: [
      "People managers and empathetic communicators",
      "Community builders and talent evaluators",
      "Students interested in organizational psychology and HR",
      "Problem solvers focused on team dynamics and motivation",
    ],
    memberIds: ["marwan-awad", "islam-el-sayed"],
  },
  {
    id: "pr",
    anchorIds: ["pr", "sr"],
    number: "02",
    tag: "THE RELATIONS & OUTREACH",
    title: "Public Relations",
    arabicTitle: "العلاقات العامة",
    description:
      "Building strong relationships between the club, students, university, and external partners. PR manages communication, partnerships, outreach, and the club's public image.",
    arabicDescription:
      "بناء علاقات قوية بين النادي والطلاب والجامعة والشركاء الخارجيين. يهتم فريق العلاقات العامة بالتواصل والشراكات والتعاون وإبراز صورة النادي.",
    color: "#ff3ca7",
    glowColor: "rgba(255, 60, 167, 0.4)",
    background: "#1c0a18",
    iconName: "megaphone",
    stats: {
      sessions: "12+",
      speakers: "15+",
      days: "FULL SEASON",
      time: "ACTIVE",
    },
    terrain: [
      {
        title: "Strategic Partnerships",
        desc: "Forging official alliances with technology sponsors, software houses, and industry startups.",
      },
      {
        title: "Campus Relations",
        desc: "Liaising with university leadership, faculties, and official university departments.",
      },
      {
        title: "External Delegations",
        desc: "Representing IT Club at tech summits, university leagues, and national hackathons.",
      },
      {
        title: "Keynote Speaker Curation",
        desc: "Securing leading engineers, tech executives, and workshop instructors.",
      },
      {
        title: "Brand Outreach",
        desc: "Crafting press materials, formal communications, and public relationship campaigns.",
      },
      {
        title: "Sponsor Deliverables",
        desc: "Managing sponsor stage time, booth activations, and mutual collaboration roadmaps.",
      },
    ],
    whoItsFor: [
      "Diplomatic communicators, negotiators, and networkers",
      "Public speakers and institutional relationship builders",
      "Students exploring corporate relations, PR, and business development",
      "Ambassadors passionate about external representation and community reach",
    ],
    memberIds: ["omar-mehawed"],
  },
  {
    id: "sm",
    anchorIds: ["sm"],
    number: "03",
    tag: "THE MEDIA & STORYTELLING",
    title: "Social Media",
    arabicTitle: "التواصل الاجتماعي",
    description:
      "Turning ideas, activities, and achievements into content that represents the club and reaches the right audience across digital platforms.",
    arabicDescription:
      "تحويل أفكار وأنشطة وإنجازات النادي إلى محتوى يعبر عنه ويصل إلى الجمهور المناسب عبر المنصات الرقمية.",
    color: "#eaff00",
    glowColor: "rgba(234, 255, 0, 0.35)",
    background: "#171a05",
    iconName: "share2",
    stats: {
      sessions: "15+",
      speakers: "10+",
      days: "FULL SEASON",
      time: "ACTIVE",
    },
    terrain: [
      {
        title: "Content Strategy",
        desc: "Architecting multi-platform campaigns across LinkedIn, Instagram, TikTok, and YouTube.",
      },
      {
        title: "Visual Storytelling",
        desc: "Transforming technical workshops and hackathon moments into compelling visual narratives.",
      },
      {
        title: "Motion & Graphic Design",
        desc: "Creating editorial typography, event posters, reels, and high-impact identity assets.",
      },
      {
        title: "Bilingual Copywriting",
        desc: "Writing sharp, witty, and engaging tech copy in fluent Arabic and English.",
      },
      {
        title: "Audience Analytics",
        desc: "Tracking reach, CTR, impressions, and engagement algorithms to optimize growth.",
      },
      {
        title: "Live Event Coverage",
        desc: "On-the-ground stories, real-time broadcasts, and live recaps during major summits.",
      },
    ],
    whoItsFor: [
      "Visual designers, motion artists, and creative video editors",
      "Content creators, copywriters, and digital storytellers",
      "Growth marketers curious about viral distribution and tech media",
      "Creative minds who want their work seen by thousands of tech students",
    ],
    memberIds: [
      "nour",
      "abdulrahman-ashraf",
      "mohamed-al-amir",
      "menna",
      "merna",
      "youssef-soliman",
    ],
  },
  {
    id: "oc",
    anchorIds: ["oc"],
    number: "04",
    tag: "THE OPERATIONS & STAGE",
    title: "Organizing Committee",
    arabicTitle: "اللجنة التنظيمية",
    description:
      "Planning and executing events, managing logistics, and making sure every experience runs smoothly from the first idea to the final moment.",
    arabicDescription:
      "تخطيط وتنفيذ الفعاليات وإدارة التفاصيل التنظيمية والتأكد من خروج كل تجربة بالشكل المطلوب من أول فكرة وحتى النهاية.",
    color: "#ffab18",
    glowColor: "rgba(255, 171, 24, 0.4)",
    background: "#19120a",
    iconName: "calendar",
    stats: {
      sessions: "14+",
      speakers: "12+",
      days: "FULL SEASON",
      time: "ACTIVE",
    },
    terrain: [
      {
        title: "Event Operations",
        desc: "Full-scale logistics management for recruitment days, workshops, and grand hackathons.",
      },
      {
        title: "Venue & Stage Logistics",
        desc: "Directing auditorium setups, audiovisual equipment, and stage flow protocols.",
      },
      {
        title: "Attendee Journey",
        desc: "Seamless registration checkpoints, crowd movement, and participant hospitality.",
      },
      {
        title: "Timeline Orchestration",
        desc: "Synchronizing multi-track schedules, master of ceremonies, and speaker handoffs.",
      },
      {
        title: "Crisis Resolution",
        desc: "Rapid on-ground troubleshooting and immediate contingency execution.",
      },
      {
        title: "VIP Hospitality",
        desc: "Welcoming keynote speakers, mentors, and corporate guests with professional care.",
      },
    ],
    whoItsFor: [
      "Detail-oriented operational planners and organizers",
      "Execution-driven leaders who thrive in high-energy event environments",
      "Calm problem solvers who handle real-time logistical challenges with composure",
      "Students eager to master large-scale event management and operations",
    ],
    memberIds: [
      "habiba-mounir",
      "mahmoud-sameh",
      "farida-mohamed",
      "shahd-ahssen",
      "habiba-ahmed",
      "mohamed-nagi",
      "saber",
      "saif-kambo",
      "benjamin",
    ],
  },
  {
    id: "it",
    anchorIds: ["it"],
    number: "05",
    tag: "THE ENGINEERING & CODE",
    title: "Information Technology",
    arabicTitle: "تكنولوجيا المعلومات",
    description:
      "Building the technical foundation of the club through software, systems, infrastructure, and real-world technology projects.",
    arabicDescription:
      "بناء الأساس التقني للنادي من خلال البرمجيات والأنظمة والبنية التحتية والمشاريع التقنية الحقيقية.",
    color: "#18c8ed",
    glowColor: "rgba(24, 200, 237, 0.4)",
    background: "#061a20",
    iconName: "code2",
    stats: {
      sessions: "20+",
      speakers: "18+",
      days: "FULL SEASON",
      time: "ACTIVE",
    },
    terrain: [
      {
        title: "Web Engineering",
        desc: "Building high-performance modern web apps with Next.js, React 19, TypeScript, and Tailwind.",
      },
      {
        title: "Backend & Systems",
        desc: "Developing secure REST & GraphQL APIs, microservices, and database architectures.",
      },
      {
        title: "DevOps & Cloud",
        desc: "Configuring containerized pipelines, Vercel/AWS hosting, and automated CI/CD checks.",
      },
      {
        title: "UI/UX Engineering",
        desc: "Crafting fluid responsive layouts, micro-animations, and accessible user experiences.",
      },
      {
        title: "Code Standards",
        desc: "Rigorous pull request reviews, clean architecture principles, and codebase documentation.",
      },
      {
        title: "Technical Bootcamps",
        desc: "Teaching hands-on workshops in modern web stacks, git workflows, and software tooling.",
      },
    ],
    whoItsFor: [
      "Software developers, frontend engineers, and backend system architects",
      "DevOps practitioners, cloud enthusiasts, and open-source contributors",
      "Students committed to shipping production software for real users",
      "Builders looking to level up code quality, TypeScript rigor, and web standards",
    ],
    memberIds: ["mohamed-ibrahim", "seif-ayman", "ziad-ayman"],
  },
  {
    id: "rnd",
    anchorIds: ["rnd", "rd"],
    number: "06",
    tag: "THE RESEARCH & DISCOVERY",
    title: "Research & Development",
    arabicTitle: "البحث والتطوير",
    description:
      "Exploring emerging technologies, experimenting with new ideas, and transforming research into practical projects and innovative solutions.",
    arabicDescription:
      "استكشاف التقنيات الحديثة وتجربة الأفكار الجديدة وتحويل البحث والمعرفة إلى مشاريع وحلول مبتكرة.",
    color: "#9b7cff",
    glowColor: "rgba(155, 124, 255, 0.4)",
    background: "#100b1d",
    iconName: "flask",
    stats: {
      sessions: "16+",
      speakers: "14+",
      days: "FULL SEASON",
      time: "ACTIVE",
    },
    terrain: [
      {
        title: "Emerging Tech Research",
        desc: "Investigating breakthroughs in Large Language Models, Generative AI, and computer vision.",
      },
      {
        title: "Rapid Prototyping",
        desc: "Accelerating experimental proof-of-concept projects from hypothesis to working demo.",
      },
      {
        title: "Algorithmic Solutions",
        desc: "Translating academic papers and cutting-edge research into functional software modules.",
      },
      {
        title: "Project Incubation",
        desc: "Guiding member-led startup prototypes, hackathon ideas, and innovative student experiments.",
      },
      {
        title: "Technical Papers",
        desc: "Publishing tech briefs, algorithmic breakdown articles, and research documentation.",
      },
      {
        title: "Advanced Hackathon Mentorship",
        desc: "Guiding teams on novel architectures, experimental APIs, and breakthrough implementations.",
      },
    ],
    whoItsFor: [
      "AI & Machine Learning enthusiasts, data scientists, and algorithm designers",
      "Curious minds who love reading technical papers and breaking new ground",
      "Hackers who experiment with prototype technologies before they become mainstream",
      "Students driven by exploration, deep technical curiosity, and novel solutions",
    ],
    memberIds: [],
  },
];
