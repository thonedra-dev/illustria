/*
  MERGE THIS INTO YOUR EXISTING app/layout.tsx — do not overwrite the whole file.
  Add these imports + font instances, then spread the class names onto <body>.

  Fonts chosen per genre:
  - Sci-Fi:    Orbitron      (geometric, technical, futuristic)
  - Horror:    Creepster     (dripping/distressed display face)
  - Romance:   Playfair Display (elegant serif, classic romance-novel feel)
  - Action:    Bangers       (bold comic/impact lettering — also a good default)
*/

import { Orbitron, Creepster, Playfair_Display, Bangers } from "next/font/google";

const narrationSciFi = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-narration-scifi",
});

const narrationHorror = Creepster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-narration-horror",
});

const narrationRomance = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-narration-romance",
});

const narrationAction = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-narration-action",
});

// In your RootLayout's <body>, add all four variable classes, e.g.:
//
// <body
//   className={`${narrationSciFi.variable} ${narrationHorror.variable} ${narrationRomance.variable} ${narrationAction.variable} antialiased`}
// >
//   {children}
// </body>
