export type NarrationColorId =
  | "parchment"
  | "dusty-pink"
  | "sage-green"
  | "electric-blue"
  | "sky-blue"
  | "warm-grey";

export type NarrationColor = {
  id: NarrationColorId;
  label: string;
  // Actual background applied to the narration box. Muted/aged tones,
  // not pure/saturated hues — each is a small gradient for a "worn paper /
  // painted board" feel rather than a flat digital fill.
  background: string;
  // Ink color used for the text sitting on top of this background.
  textColor: string;
};

// Hybrid, slightly desaturated tones — aiming for "old comic page" rather
// than flat UI colors. Each uses a subtle two-stop gradient.
export const NARRATION_COLORS: NarrationColor[] = [
  {
    id: "parchment",
    label: "Dirty Yellow",
    background: "linear-gradient(135deg, #ece2c6 0%, #ddcda0 100%)",
    textColor: "#2b2417",
  },
  {
    id: "dusty-pink",
    label: "Dusty Pink",
    background: "linear-gradient(135deg, #e8cfcd 0%, #d3a9a8 100%)",
    textColor: "#3a1f1e",
  },
  {
    id: "sage-green",
    label: "Sage Green",
    background: "linear-gradient(135deg, #cdd6bd 0%, #aab994 100%)",
    textColor: "#232a1a",
  },
  {
    id: "electric-blue",
    label: "Electric Blue",
    background: "linear-gradient(135deg, #3f5f8a 0%, #223855 100%)",
    textColor: "#eaf2ff",
  },
  {
    id: "sky-blue",
    label: "Sky Blue",
    background: "linear-gradient(135deg, #cfe1e8 0%, #a9c4d1 100%)",
    textColor: "#1c2c33",
  },
  {
    id: "warm-grey",
    label: "Warm Grey",
    background: "linear-gradient(135deg, #d8d3cb 0%, #b7b0a3 100%)",
    textColor: "#242220",
  },
];

export const DEFAULT_NARRATION_COLOR_ID: NarrationColorId = "parchment";

export function getNarrationColor(id: NarrationColorId | undefined): NarrationColor {
  return NARRATION_COLORS.find((c) => c.id === id) ?? NARRATION_COLORS[0];
}

export type NarrationFontId = "sci-fi" | "horror" | "romance" | "action";

export type NarrationFont = {
  id: NarrationFontId;
  label: string;
  // CSS variable name populated by next/font in layout.tsx
  cssVar: string;
};

export const NARRATION_FONTS: NarrationFont[] = [
  { id: "sci-fi", label: "Sci-Fi", cssVar: "var(--font-narration-scifi)" },
  { id: "horror", label: "Horror", cssVar: "var(--font-narration-horror)" },
  { id: "romance", label: "Romance", cssVar: "var(--font-narration-romance)" },
  { id: "action", label: "Action", cssVar: "var(--font-narration-action)" },
];

export const DEFAULT_NARRATION_FONT_ID: NarrationFontId = "action";

export function getNarrationFont(id: NarrationFontId | undefined): NarrationFont {
  return NARRATION_FONTS.find((f) => f.id === id) ?? NARRATION_FONTS[0];
}

// Character limits. Single panel = one block of centered text.
// Two-panel strip = up to 3 lines (the box grows a little per line, capped).
export const SINGLE_PANEL_CHAR_LIMIT = 160;
export const STRIP_CHAR_LIMIT_PER_LINE = 70;
export const STRIP_MAX_LINES = 3;
export const STRIP_CHAR_LIMIT = STRIP_CHAR_LIMIT_PER_LINE * STRIP_MAX_LINES;
