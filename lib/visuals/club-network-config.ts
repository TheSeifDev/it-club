/**
 * Contract shared by the Identity GSAP timeline and ClubNetwork.
 * The visual listens on window so it remains decoupled from the page layout.
 */
export const CLUB_NETWORK_EVENT = "club:network";

export type ClubNetworkState = {
  /** Identity timeline progress, clamped by the scene to 0…1. */
  progress: number;
};

/** Original committee/track accent colors, kept vivid against the blue core. */
export const CLUB_NETWORK_COLORS = [
  0x35d98a,
  0xff3ca7,
  0xeaff00,
  0xffab18,
  0x18c8ed,
  0x9b7cff,
] as const;
