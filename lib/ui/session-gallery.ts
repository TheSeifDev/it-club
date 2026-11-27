/**
 * Committee session photographs for the Home "Sessions" chapter.
 *
 * Add real photos here once they are supplied (compressed WebP under
 * `public/sessions/<committee>/`). The chapter renders only when at least one
 * photo exists, so the public site never shows placeholder frames.
 */
export type SessionPhoto = {
  src: string;
  /** Committee or track label, e.g. "HR", "IT", "PR". */
  committee: string;
  /** Short caption describing the real session shown. */
  caption: string;
  width: number;
  height: number;
};

export const SESSION_PHOTOS: readonly SessionPhoto[] = [];

export function sessionPhotos(): SessionPhoto[] {
  return SESSION_PHOTOS.filter((photo) => photo.src.startsWith("/") && photo.width > 0 && photo.height > 0);
}
