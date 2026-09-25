import { NarrationColor } from "./narrationStyles";

// ---------------------------------------------------------------------------
// Theme-aware narration treatments.
//
// The 6 base narration colors (parchment, dusty-pink, sage-green,
// electric-blue, sky-blue, warm-grey) stay fixed as the *identity* of each
// color choice. What changes per comic theme is how that color is
// rendered: gradient contrast, border weight, shadow, and an optional
// CSS-only overlay texture (no image assets, no new dependencies).
//
// This is deliberately a small set of THEME TRANSFORMS applied uniformly
// to any base color, rather than 6 themes x 6 colors of hand-authored
// values. Adding a 7th theme = one new transform. Adding a 7th color =
// it works correctly across all themes for free.
// ---------------------------------------------------------------------------

export type OverlayKind = "none" | "halftone" | "screentone" | "grain" | "scanline" | "vignette";

export type NarrationTreatment = {
  background: string;
  textColor: string;
  borderColor: string;
  borderWidth: string;
  boxShadow: string;
  overlay: OverlayKind;
  overlayOpacity: number;
  // letter-spacing / weight nudge so the same font reads correctly against
  // a busier or quieter surface
  extraTextShadow?: string;
};

type ThemeId =
  | "photo-realistic"
  | "western-comic"
  | "manga"
  | "noir"
  | "painterly"
  | "cyberpunk";

// Small color-math helpers (no dependency needed for this scale of work).
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

function mix(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexA.startsWith("#") ? hexB : hexB);
  const [r3, g3, b3] = hexToRgb(hexB);
  void r2; void g2; void b2;
  return rgbToHex(r1 + (r3 - r1) * t, g1 + (g3 - g1) * t, b1 + (b3 - b1) * t);
}

function darken(hex: string, amount: number): string {
  return mix(hex, "#000000", amount);
}

function lighten(hex: string, amount: number): string {
  return mix(hex, "#ffffff", amount);
}

// Extracts the two gradient stop colors out of the base color's
// `linear-gradient(135deg, A 0%, B 100%)` string.
function extractStops(background: string): [string, string] {
  const matches = background.match(/#([0-9a-fA-F]{3,6})/g) ?? ["#cccccc", "#999999"];
  return [matches[0], matches[1] ?? matches[0]];
}

// ---------------------------------------------------------------------------
// Per-theme transform functions
// ---------------------------------------------------------------------------

const treatments: Record<ThemeId, (color: NarrationColor) => NarrationTreatment> = {
  // Closest to the raw base color: soft, natural, photographic. Gentle
  // vignette instead of a hard graphic border, like a printed photo caption.
  "photo-realistic": (color) => {
    const [a, b] = extractStops(color.background);
    return {
      background: `linear-gradient(160deg, ${lighten(a, 0.06)} 0%, ${darken(b, 0.04)} 100%)`,
      textColor: color.textColor,
      borderColor: darken(b, 0.25),
      borderWidth: "1px",
      boxShadow: `0 6px 18px -6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.15)`,
      overlay: "vignette",
      overlayOpacity: 0.35,
    };
  },

  // Bold flat pop-art color, thick black ink border, hard offset shadow,
  // halftone dots — classic ink-and-paper comic panel caption box.
  "western-comic": (color) => {
    const [a, b] = extractStops(color.background);
    return {
      background: `linear-gradient(135deg, ${lighten(a, 0.1)} 0%, ${b} 100%)`,
      textColor: color.textColor,
      borderColor: "#0a0a0a",
      borderWidth: "3px",
      boxShadow: `6px 6px 0px 0px #0a0a0a`,
      overlay: "halftone",
      overlayOpacity: 0.14,
    };
  },

  // Near-monochrome tint with crisp screentone dots, thin precise border —
  // manga caption boxes read as almost black-and-white with a tint hint.
  manga: (color) => {
    const [, b] = extractStops(color.background);
    const tinted = mix("#f5f3ef", b, 0.22);
    return {
      background: `linear-gradient(180deg, #f8f6f1 0%, ${tinted} 100%)`,
      textColor: "#1a1a1a",
      borderColor: "#111111",
      borderWidth: "2px",
      boxShadow: `3px 3px 0px 0px rgba(17,17,17,0.9)`,
      overlay: "screentone",
      overlayOpacity: 0.22,
    };
  },

  // Heavily desaturated toward black/white, hard directional shadow, no
  // color bleed — the caption box looks lit by a single hard key light.
  noir: (color) => {
    const [a, b] = extractStops(color.background);
    const desaturatedA = mix(a, "#3a3a3a", 0.55);
    const desaturatedB = mix(b, "#0f0f0f", 0.65);
    return {
      background: `linear-gradient(115deg, ${desaturatedA} 0%, ${desaturatedB} 100%)`,
      textColor: "#f2f0ea",
      borderColor: "#000000",
      borderWidth: "2px",
      boxShadow: `10px 0 24px -10px rgba(0,0,0,0.9)`,
      overlay: "vignette",
      overlayOpacity: 0.5,
      extraTextShadow: "0 1px 3px rgba(0,0,0,0.8)",
    };
  },

  // Soft multi-stop blurred gradient, grain overlay, diffused border (no
  // hard edges) — like gouache on textured paper.
  painterly: (color) => {
    const [a, b] = extractStops(color.background);
    return {
      background: `linear-gradient(150deg, ${lighten(a, 0.12)} 0%, ${mix(a, b, 0.5)} 50%, ${darken(b, 0.1)} 100%)`,
      textColor: color.textColor,
      borderColor: mix(b, "#000000", 0.2),
      borderWidth: "1px",
      boxShadow: `0 10px 30px -12px rgba(0,0,0,0.35), inset 0 0 40px rgba(255,255,255,0.08)`,
      overlay: "grain",
      overlayOpacity: 0.18,
    };
  },

  // Darkened base + saturated neon edge glow, scanline overlay, thin sharp
  // border — the same "yellow" now reads as an illuminated HUD panel.
  cyberpunk: (color) => {
    const [a, b] = extractStops(color.background);
    const darkA = darken(a, 0.55);
    const darkB = darken(b, 0.65);
    // Neon accent pulled from the *original* lighter stop, kept saturated.
    const glow = lighten(a, 0.15);
    return {
      background: `linear-gradient(135deg, ${darkA} 0%, ${darkB} 100%)`,
      textColor: lighten(color.textColor, 0.85),
      borderColor: glow,
      borderWidth: "1px",
      boxShadow: `0 0 12px 0 ${glow}66, 0 0 28px 2px ${glow}33, inset 0 0 20px rgba(0,0,0,0.4)`,
      overlay: "scanline",
      overlayOpacity: 0.16,
      extraTextShadow: `0 0 8px ${glow}88`,
    };
  },
};

const DEFAULT_TREATMENT = treatments["photo-realistic"];

export function getNarrationTreatment(
  color: NarrationColor,
  themeId: string | undefined
): NarrationTreatment {
  const fn = (themeId && treatments[themeId as ThemeId]) || DEFAULT_TREATMENT;
  return fn(color);
}

// CSS background-image strings for each overlay kind. Pure CSS, layered on
// top of the treatment's gradient background via a second background-image.
export function getOverlayBackgroundImage(overlay: OverlayKind): string | undefined {
  switch (overlay) {
    case "halftone":
      return "radial-gradient(circle, rgba(0,0,0,0.9) 1px, transparent 1.3px)";
    case "screentone":
      return "radial-gradient(circle, rgba(0,0,0,0.85) 0.7px, transparent 1px)";
    case "grain":
      return "repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.5) 0, rgba(0,0,0,0.12) 1px, transparent 2px)";
    case "scanline":
      return "repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, transparent 1px, transparent 3px)";
    case "vignette":
      return "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.45) 100%)";
    case "none":
    default:
      return undefined;
  }
}

export function getOverlayBackgroundSize(overlay: OverlayKind): string | undefined {
  switch (overlay) {
    case "halftone":
      return "6px 6px";
    case "screentone":
      return "4px 4px";
    case "grain":
      return "5px 5px";
    case "scanline":
      return "100% 3px";
    default:
      return undefined;
  }
}