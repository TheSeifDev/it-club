export interface ProcessStage {
  id: string;
  stepNumber: string;
  title: string;
  arabicTitle: string;
  tag: string;
  color: string;
  shortDesc: string;
  arabicShortDesc: string;
  whatToExpect: string[];
  whatToPrepare: string[];
  whatHappensNext: string;
  durationEstimate: string;
}

export interface EvaluationPillar {
  number: string;
  title: string;
  arabicTitle: string;
  tag: string;
  color: string;
  description: string;
  arabicDescription: string;
  indicators: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  arabicQuestion: string;
  answer: string;
  arabicAnswer: string;
  category: "applications" | "interviews" | "tracks" | "commitment";
}

export const RECRUITMENT_STAGES: ProcessStage[] = [
  {
    id: "application",
    stepNumber: "01",
    title: "Application Submission",
    arabicTitle: "التقديم الإلكتروني",
    tag: "ONLINE REGISTRATION",
    color: "#35d98a",
    shortDesc:
      "Submit your official application form, pick your preferred track, and tell us about your goals and curiosity.",
    arabicShortDesc:
      "املأ استمارة التقديم الرسمية، واختر المسار الأنسب لشغفك واهتماماتك وأخبرنا بما تسعى لبنائه.",
    whatToExpect: [
      "A clean, straightforward online application form taking ~10-15 minutes.",
      "Clear selection of your primary committee/track preference from our six tracks.",
      "Thoughtful short-answer questions focused on mindset, motivation, and learning interest.",
      "Optional fields for personal links (GitHub, Behance, LinkedIn, portfolios, or writing samples).",
    ],
    whatToPrepare: [
      "Your student email and active WhatsApp contact number for prompt notifications.",
      "A genuine reflection on why you want to join IT Club and what you hope to build.",
      "Any links or projects you are proud of (not mandatory for beginner applicants).",
    ],
    whatHappensNext:
      "Every submission is reviewed individually by the respective committee heads within 3 to 5 days of submission.",
    durationEstimate: "10–15 Minutes",
  },
  {
    id: "screening",
    stepNumber: "02",
    title: "Application & Mindset Review",
    arabicTitle: "مراجعة الطلبات والاهتمامات",
    tag: "PORTFOLIO & PROFILE SCREENING",
    color: "#18c8ed",
    shortDesc:
      "Committee leadership reviews all candidate applications to understand your passion, background, and learning drive.",
    arabicShortDesc:
      "تقوم قيادات اللجان بمراجعة طلبات المتقدمين للتعرف على اهتماماتهم وخلفياتهم ورغبتهم في التطور.",
    whatToExpect: [
      "Holistic evaluation focused on curiosity, readiness to collaborate, and growth mindset.",
      "No artificial disqualification based purely on academic major or prior university year.",
      "Reviewers looking for authenticity, self-motivation, and alignment with club culture.",
    ],
    whatToPrepare: [
      "Check your inbox and messaging apps regularly for updates.",
      "Review the description and focus areas of your selected track on our Tracks page.",
      "Keep an open mind about potential cross-committee learning opportunities.",
    ],
    whatHappensNext:
      "Candidates progressing to the conversation stage receive personalized interview scheduling invites.",
    durationEstimate: "3–5 Days",
  },
  {
    id: "task",
    stepNumber: "03",
    title: "Exploratory Challenge",
    arabicTitle: "المهمة الاستكشافية التجريبية",
    tag: "PRACTICAL MINI-CHALLENGE",
    color: "#eaff00",
    shortDesc:
      "A lightweight, practical exercise for technical or creative tracks to observe your problem-solving and research approach.",
    arabicShortDesc:
      "تحدٍ مصغر وعملي للمسارات التقنية والإبداعية يهدف للتعرف على طريقة بحثك وتفكيرك في حل المشكلات.",
    whatToExpect: [
      "A beginner-friendly mini-brief tailored to your chosen discipline (code, content, design, or planning).",
      "Emphasis on thought process and methodology rather than flawless production perfection.",
      "Clear instructions, helpful resources, and realistic completion windows.",
    ],
    whatToPrepare: [
      "Document your assumptions and the decisions you made along the way.",
      "Feel free to leverage documentation, search engines, and self-learning tools.",
      "Be prepared to share what you learned and what challenged you during the task.",
    ],
    whatHappensNext:
      "Your challenge serves as a productive talking point and discussion foundation in the interview.",
    durationEstimate: "48–72 Hours",
  },
  {
    id: "interview",
    stepNumber: "04",
    title: "The Interview Dialogue",
    arabicTitle: "جلسة المقابلة الشخصية والتقنية",
    tag: "CONVERSATIONAL EVALUATION",
    color: "#ff3ca7",
    shortDesc:
      "A constructive conversation with track leaders to explore your aspirations, discuss your interests, and get to know you as a person.",
    arabicShortDesc:
      "حوار تفاعلي وبناء مع قادة المسار للتعرف على شخصيتك وطموحاتك وأهدافك والإجابة عن كل استفساراتك.",
    whatToExpect: [
      "A friendly, welcoming atmosphere designed to let you speak comfortably and authentically.",
      "Questions about your past experiences, group dynamics, how you handle challenges, and time commitment.",
      "An open floor to ask questions directly to heads about track roadmaps, mentors, and club life.",
    ],
    whatToPrepare: [
      "Come prepared to discuss what excites you in technology and teamwork.",
      "Reflect on how you organize your academic schedule alongside extracurricular activities.",
      "Bring genuine questions you have about the team and what we will build together.",
    ],
    whatHappensNext:
      "The interviewing team consolidates feedback to finalize cohort selections within 48 to 72 hours.",
    durationEstimate: "20–30 Minutes",
  },
  {
    id: "selection",
    stepNumber: "05",
    title: "Final Selection & Welcome",
    arabicTitle: "القبول والترحيب بالأعضاء",
    tag: "OFFICIAL DECISION NOTICE",
    color: "#ffab18",
    shortDesc:
      "Official selection notifications are issued, and accepted applicants receive their official track confirmation.",
    arabicShortDesc:
      "إرسال إشعارات القبول الرسمية وتأكيد انضمام الأعضاء الجدد للجان والمسارات المختارة.",
    whatToExpect: [
      "Formal email confirmation detailing your track placement and initial cohort communications.",
      "Next-steps guide outlining member onboarding dates and community group invites.",
      "Constructive feedback shared whenever possible for applicants not selected in this intake.",
    ],
    whatToPrepare: [
      "Confirm your acceptance promptly to secure your spot in the incoming cohort.",
      "Join the official IT Club Discord/WhatsApp channels using the invite links in your email.",
      "Block out calendar time for the general onboarding orientation session.",
    ],
    whatHappensNext:
      "Immediate transition into member orientation and cross-track alignment activities.",
    durationEstimate: "2–3 Days",
  },
  {
    id: "onboarding",
    stepNumber: "06",
    title: "Onboarding & Cohort Kickoff",
    arabicTitle: "الانضمام وبدء ورش العمل والمشاريع",
    tag: "ACTIVE MEMBERSHIP LAUNCH",
    color: "#9b7cff",
    shortDesc:
      "Full cohort orientation, mentor pairings, internal tooling setup, and the start of hands-on workshops and real club projects.",
    arabicShortDesc:
      "اللقاء الترحيبي العام، والتعرف على المرشدين، وبدء أولى ورش العمل والمشاريع الحقيقية في النادي.",
    whatToExpect: [
      "General community assembly connecting you with members across all six IT Club committees.",
      "Introduction to track curricula, internal development workflows, and season project roadmap.",
      "Assignment of first hands-on sprint, collaborative workshop, or campus event project.",
    ],
    whatToPrepare: [
      "Set up necessary software tooling (Git, Discord, collaborative Figma/Notion workspaces).",
      "Bring your curiosity, readiness to collaborate, and enthusiasm to build.",
      "Be prepared to learn rapidly from experienced mentors and build lifelong friendships.",
    ],
    whatHappensNext:
      "You are an active IT Club builder, contributing to real production code, major events, or digital media throughout the academic year.",
    durationEstimate: "Full Season",
  },
];

export const EVALUATION_PILLARS: EvaluationPillar[] = [
  {
    number: "01",
    title: "Curiosity & Growth Mindset",
    arabicTitle: "الشغف والفضول للتعلم",
    tag: "INTRINSIC DRIVE",
    color: "#35d98a",
    description:
      "Skills and frameworks can be taught; intrinsic curiosity is irreplaceable. We prioritize people who ask deep questions, seek to understand the 'why', and actively experiment with unfamiliar technologies.",
    arabicDescription:
      "المهارات التقنية يمكن تعلمها، لكن الشغف والفضول الداخلي لا يعوضان. نمنح الأولوية لمن يسألون ويبحثون ويجربون دون تردد.",
    indicators: [
      "Self-directed learning initiatives and experiments outside the classroom",
      "Comfort with asking clarifying questions when facing unknowns",
      "Excitement about discovering modern tools and solving real-world friction",
    ],
  },
  {
    number: "02",
    title: "Commitment & Consistency",
    arabicTitle: "الالتزام والاستمرارية",
    tag: "RELIABILITY & OWNERSHIP",
    color: "#18c8ed",
    description:
      "Consistent presence and steady accountability outweigh sporadic bursts of intensity. Reliable teammates who communicate early, meet project commitments, and support deadlines are the bedrock of our club.",
    arabicDescription:
      "الحضور الدائم والالتزام بالمسؤوليات يفوق الحماس المؤقت. الأعضاء الموثوقون الذين يتواصلون بشفافية هم عماد نجاح النادي.",
    indicators: [
      "Realistic estimation and transparent communication of your weekly bandwidth",
      "Following through on agreed deliverables and meeting attendance",
      "Proactive notification whenever academic pressures or exams arise",
    ],
  },
  {
    number: "03",
    title: "Collaboration & Empathy",
    arabicTitle: "روح الفريق والتواصل الإنساني",
    tag: "TEAM DYNAMICS",
    color: "#ff3ca7",
    description:
      "None of our software platforms, hackathons, or media productions are built in isolation. We value teammates who listen attentively, give and receive constructive feedback, and celebrate collective wins.",
    arabicDescription:
      "لا شيء في نادينا يبنى بمعزل عن الفريق. نقدر من يستمعون باهتمام، ويتبادلون الملاحظات البناءة، ويدعمون زملاءهم بكل إخلاص.",
    indicators: [
      "Constructive, ego-free communication during brainstorming and reviews",
      "Willingness to share knowledge and unblock team members",
      "Respect for diverse academic disciplines and individual learning curves",
    ],
  },
  {
    number: "04",
    title: "Practical Action & Execution",
    arabicTitle: "المبادرة وتحويل الأفكار لواقع",
    tag: "BIAS TOWARD ACTION",
    color: "#eaff00",
    description:
      "IT Club is a community of builders, not passive spectators. We champion applicants who take initiative, propose tangible solutions, create prototypes, and embrace the messy process of building things from scratch.",
    arabicDescription:
      "نادي تكنولوجيا المعلومات هو مجتمع من الصنّاع والمنفذين. نحتفي بالمبادرين الذين يحولون الأفكار إلى واقع ومشاريع ملموسة.",
    indicators: [
      "A proactive drive to propose solutions rather than merely highlighting problems",
      "Resilience when code breaks, timelines shift, or plans require adaptation",
      "Pride in shipping tangible, production-quality work for real student users",
    ],
  },
];

export const PROCESS_FAQS: FAQItem[] = [
  {
    id: "prior-experience",
    question: "Do I need prior coding or design experience to apply?",
    arabicQuestion: "هل يشترط وجود خبرة سابقة في البرمجة أو التصميم للتقديم؟",
    answer:
      "No! Prior experience is not mandatory for all tracks. While some advanced roles in IT or R&D benefit from foundational familiarity, our core mission is talent acceleration. We actively look for genuine passion, learning curiosity, and dedication. Our curriculum is structured to help you grow from the ground up through guided mentorship and workshops.",
    arabicAnswer:
      "لا، الخبرة المسبقة ليست شرطاً إلزامياً لجميع المسارات. رسالتنا الأساسية هي بناء وتمكين المواهب من الصفر. نبحث عن الشغف الحقيقي، والرغبة الصادقة في التعلم والالتزام.",
    category: "applications",
  },
  {
    id: "multiple-tracks",
    question: "Can I apply to more than one track simultaneously?",
    arabicQuestion: "هل يمكنني التقديم في أكثر من مسار في نفس الوقت؟",
    answer:
      "You will select one primary track on the registration form to ensure focused evaluation and dedicated mentorship. However, IT Club actively fosters cross-committee collaboration: as an active member, you will have regular opportunities to collaborate with developers, designers, organizers, and PR specialists on unified projects.",
    arabicAnswer:
      "تقوم باختيار مسار أساسي واحد في استمارة التقديم لضمان تقييم دقيق ومركز. ومع ذلك، يشجع النادي التعاون بين مختلف اللجان في المشاريع الموحدة.",
    category: "tracks",
  },
  {
    id: "interview-format",
    question: "What is the interview like, and how should I prepare?",
    arabicQuestion: "كيف يبدو شكل المقابلة وكيف أستعد لها؟",
    answer:
      "Our interview is a constructive, friendly conversation—never an aggressive exam or stressful interrogation. We want to understand what inspires you, learn about projects or hobbies you enjoy, and evaluate how you communicate and collaborate in a team. The best preparation is to be yourself, be honest about your current skill level, and know why you want to join IT Club.",
    arabicAnswer:
      "المقابلة عبارة عن حوار ودي وبناء، وليست اختباراً معقداً. هدفنا معرفة طريقة تفكيرك، وشغفك، وكيفية تنظيم وقتك. أفضل استعداد هو أن تكون على طبيعتك وبمنتهى الصدق.",
    category: "interviews",
  },
  {
    id: "time-commitment",
    question: "What is the expected weekly time commitment for members?",
    arabicQuestion: "ما هو الوقت المتوقع تخصيصه أسبوعياً لأنشطة النادي؟",
    answer:
      "Active members typically commit around 3 to 5 hours per week. This covers weekly committee syncs, hands-on workshops, and collaborative project sprint tasks. During major summit weeks or recruitment hackathons, commitments may increase temporarily, but academic exams and midterms always take absolute priority.",
    arabicAnswer:
      "يخصص العضو الفعال عادة من 3 إلى 5 ساعات أسبوعياً للاجتماعات، وورش العمل، وتنفيذ مهام المشاريع. فترات الامتحانات الأكاديمية لها الأولوية القصوى دائماً.",
    category: "commitment",
  },
  {
    id: "eligibility",
    question: "Is membership open to all university faculties and academic years?",
    arabicQuestion: "هل الانضمام متاح لجميع كليات وسنوات الجامعة المختلفة؟",
    answer:
      "Yes! Membership is open to all university students regardless of faculty, department, or academic year (from freshmen to senior year). We believe diverse backgrounds—from computer science and engineering to business, arts, and languages—strengthen our multi-disciplinary projects.",
    arabicAnswer:
      "نعم! التقديم متاح لجميع طلاب الجامعة بمختلف الكليات والسنوات الدراسية (من السنة الأولى وحتى التخرج). تنوع الخلفيات هو سر قوة مشاريعنا وتكاملها.",
    category: "applications",
  },
  {
    id: "timeline-notification",
    question: "How and when will I be notified regarding my application status?",
    arabicQuestion: "متى وكيف سأعرف نتيجة طلبي وموعد الخطوات التالية؟",
    answer:
      "You will receive official updates via email and WhatsApp at each stage of the recruitment process. Initial screening confirmations are sent within 3–5 days after application review, and final cohort results are communicated within 48–72 hours following your interview.",
    arabicAnswer:
      "ستصلك رسائل رسمية عبر البريد الإلكتروني وتطبيق واتساب في كل مرحلة. نتائج الفرز المبدئي تصل خلال 3-5 أيام، وقرارات القبول النهائية خلال 48-72 ساعة من المقابلة.",
    category: "interviews",
  },
];
