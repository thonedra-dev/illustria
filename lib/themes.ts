import { Theme } from "@/types/comic";

export const THEMES: Theme[] = [
  {
    id: "photo-realistic",
    label: "Photo-Realistic",
    description: "Natural lighting, lifelike detail, minimal stylization",
    styleString:
      "photorealistic rendering, natural skin texture, lifelike detail, realistic lighting, minimal stylization",
  },
  {
    id: "western-comic",
    label: "Western Comic",
    description: "Bold ink outlines, flat cel-shaded colors",
    styleString:
      "comic book illustration style, bold black ink outlines, flat cel-shaded coloring, halftone dot shading, dynamic comic panel composition",
  },
  {
    id: "manga",
    label: "Manga / Anime",
    description: "Screentone shading, expressive linework",
    styleString:
      "manga illustration style, clean expressive linework, screentone shading, anime-inspired character rendering, black and white with selective tone",
  },
  {
    id: "noir",
    label: "Noir / Graphic Novel",
    description: "High-contrast black & white, dramatic shadows",
    styleString:
      "noir graphic novel style, high-contrast black and white, dramatic hard shadows, heavy ink linework, moody cinematic lighting",
  },
  {
    id: "painterly",
    label: "Painterly / Semi-Realistic",
    description: "Digital painting, soft cinematic rendering",
    styleString:
      "semi-realistic digital painting style, soft painterly brushwork, cinematic rendering, rich color grading, illustrative detail",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk / Sci-Fi",
    description: "Neon palettes, futuristic environments",
    styleString:
      "cyberpunk sci-fi illustration style, neon color palette, futuristic environment details, glowing highlights, high-tech atmosphere",
  },
];
