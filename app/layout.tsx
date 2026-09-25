import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron, Creepster, Playfair_Display, Bangers } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Narration-box display fonts, one per story genre. These feed the CSS
// variables consumed in lib/narrationStyles.ts (NARRATION_FONTS) and
// applied inline in components/comic/ComicPage.tsx.
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

export const metadata: Metadata = {
  title: "Illustria",
  description: "Turn your story into a comic.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${narrationSciFi.variable} ${narrationHorror.variable} ${narrationRomance.variable} ${narrationAction.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}