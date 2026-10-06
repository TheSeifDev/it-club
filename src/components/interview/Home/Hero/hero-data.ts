export type Speaker = {
  name: string;
  company: string;
  image?: string;
};

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

export const speakers: Speaker[] = [
  { name: "LOREM IPSUM", company: "DOLOR SIT" },
  { name: "AMET CONSECTETUR", company: "ADIPISCING" },
  { name: "SED EIUSMOD", company: "TEMPOR INC" },
  { name: "DR. LABORE DOLORE", company: "MAGNAALIQUA" },
  { name: "UT ENIM", company: "MINIM VENIAM" },
  { name: "QUIS NOSTRUD", company: "EXERCITATION" },
  { name: "ULLAMCO LABORIS", company: "NISI.AI" },
  { name: "ALIQUIP COMMODO", company: "CONSEQUAT" },
];

export const tracks: Track[] = [
  {
    label: "Lorem ipsum dolor sit",
    color: "bg-cyan-400",
  },
  {
    label: "Consectetur adipiscing",
    color: "bg-emerald-400",
  },
  {
    label: "Sed do eiusmod tempor",
    color: "bg-pink-500",
  },
  {
    label: "Incididunt ut labore",
    color: "bg-yellow-400",
  },
  {
    label: "Dolore magna aliqua",
    color: "bg-orange-400",
  },
];

export const stats: Stat[] = [
  { value: "500+", label: "MEMBERS" },
  { value: "40+", label: "HEADS" },
  { value: "6", label: "TRACKS" },
  { value: "ALL", label: "DAYS" },
  { value: "BATU", label: "UNIVERSITY" },
];

export const columns: Speaker[][] = [0, 1, 2, 3].map((c) =>
  [0, 1, 2, 3].map(
    (i) => speakers[(c * 2 + i) % speakers.length],
  ),
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