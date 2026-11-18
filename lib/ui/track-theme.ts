import { IT_CLUB_TRACKS } from "../../src/components/interview/Tracks/tracks-data.ts";

export interface TrackTheme {
  color: string;
  ink: string;
  rgb: string;
  arabic: string;
  short: string;
}

const normalize = (value: string) =>
  value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const channels = (color: string) =>
  [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16));
const luminance = (rgb: number[]) =>
  rgb
    .map((value) => {
      const channel = value / 255;
      return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    })
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );

/** Keep the canonical bright hue, but derive a readable text shade for Paper. */
function paperInk(color: string): string {
  const original = channels(color);
  const paper = luminance(channels("#f3f4f6"));
  let rgb = original;
  let factor = 1;
  while ((paper + 0.05) / (luminance(rgb) + 0.05) < 4.5 && factor > 0.1) {
    factor -= 0.05;
    rgb = original.map((value) => Math.round(value * factor));
  }
  return `#${rgb.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

const fallback: TrackTheme = {
  color: "#4db6ff",
  ink: "#0a6cc0",
  rgb: "77, 182, 255",
  arabic: "",
  short: "CLUB",
};

const themes = new Map<string, TrackTheme>();
for (const track of IT_CLUB_TRACKS) {
  const theme: TrackTheme = {
    color: track.color,
    ink: paperInk(track.color),
    rgb: channels(track.color).join(", "),
    arabic: track.arabicTitle,
    short: track.id === "rnd" ? "R&D" : track.id.toUpperCase(),
  };
  for (const alias of [
    track.id,
    track.title,
    track.arabicTitle,
    ...track.anchorIds,
  ]) {
    const key = normalize(alias);
    if (key) themes.set(key, theme);
  }
  if (track.id === "rnd") {
    themes.set("researchdevelopment", theme);
    themes.set("researchanddevelopment", theme);
  }
  if (track.id === "sm") themes.set("socialmedia", theme);
}

export function getTrackTheme(slugOrName?: string | null): TrackTheme {
  return themes.get(normalize(slugOrName ?? "")) ?? fallback;
}
