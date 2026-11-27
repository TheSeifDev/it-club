/**
 * Group photos for each board, keyed by the board's short code in lowercase
 * (hr, pr, sm, oc, it, club). Boards without a photo render a printed
 * placeholder frame with their code — the layout is ready for the real image.
 */
export type BoardPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
};

export const BOARD_PHOTOS: Record<string, BoardPhoto> = {
  // hr: { src: "/media/boards/hr.webp", alt: "The HR board", width: 1600, height: 1067 },
};

export function boardPhoto(code: string): BoardPhoto | undefined {
  return BOARD_PHOTOS[code.trim().toLowerCase()];
}
