/**
 * Printed "Memories" shown on /events. Add real photos here (public/ paths or
 * Manus storage paths). Each entry renders as a printed photo on the table;
 * empty slots render as prints still developing, never as fake photos.
 */
export type Memory = {
  src: string;
  alt: string;
  caption: string;
  /** Free text like "Nov 2026" — leave empty when unknown. */
  when?: string;
  width: number;
  height: number;
};

export const MEMORIES: Memory[] = [
  {
    src: "/manus-storage/club-in-action-01_cfc54ef8.webp",
    alt: "An IT Club member in the club vest watching a talk in a university hall",
    caption: "Front row, club vest on",
    width: 1280,
    height: 720,
  },
  {
    src: "/manus-storage/club-in-action-02_18620573.webp",
    alt: "IT Club members in club vests standing in front of a presentation screen",
    caption: "Showing up, together",
    width: 1280,
    height: 720,
  },
];
