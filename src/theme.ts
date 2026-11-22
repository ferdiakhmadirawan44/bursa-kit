// ---------------------------------------------------------------------------
// BURSA's brand, written once as a Hyper Elements theme and handed to
// all 16 roots (Email x12, Page x1, Document x1, Canvas x2). One theme,
// one palette — the Dribbble "safe fintech" look, DESIGN ONLY: warm
// near-black, a single vivid orange accent, warm off-white figures.
// The text is our own work; the brand "Cryptpy" and every word on that
// page are NOT used.
//
// Fonts: Space Grotesk for display headlines, Inter for body and
// figures, DejaVu Sans Mono for terminal-style ids. Inter and Space
// Grotesk are static TTF instances (fontTools-instanced from the
// variable fonts — satori's opentype parser crashes on variable fonts,
// so the kit ships static weights only). Email and Page use the same
// stacks with system fallbacks — email clients do not reliably load
// web fonts, so the stack degrades gracefully.
// ---------------------------------------------------------------------------

import { defineTheme } from "@hyper-elements/react";

/** Display stack — Space Grotesk first, Inter as fallback. */
export const DISPLAY_FONT =
  "'Space Grotesk', 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Body stack — Inter first. */
export const BODY_FONT =
  "'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

/** Monospace stack for ids, times and figures. */
export const MONO_FONT = "'DejaVu Sans Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/** Font family for the Document (PDF) and Canvas roots, loaded from
 *  assets/fonts. */
export const PRINT_FONT = "'Inter', sans-serif";
export const PRINT_DISPLAY_FONT = "'Space Grotesk', 'Inter', sans-serif";

/** Semantic colours shared by all 16 outputs. One accent system:
 *  orange only — no green/red semantics (the Dribbble rule: gains are
 *  shown in orange, the same accent as the CTA). */
export const C = {
  bg: "#050201",
  bgDeep: "#030100",
  panel: "#14100B",
  panelLight: "#1D1710",
  card: "#17100A",
  ink: "#FBFAF7",
  inkSoft: "#EDE6DA",
  muted: "#B8AFA2",
  faint: "#8A7F70",
  border: "#2A1D12",
  borderLight: "#3D2C1B",
  zebra: "#100B07",
  white: "#FFFFFF",
  orange: "#F4550D",
  orangeBright: "#FF6A1F",
  orangeDark: "#B8310A",
  orangeTint: "#FDE8DA",
  amber: "#EE8F33",
  amberTint: "#FDF3E3",
  glow: "#B8310A",
  navy: "#050201",
} as const;

export const bursaTheme = defineTheme({
  colors: {
    background: C.bg,
    foreground: C.ink,
    primary: C.orange,
    primaryForeground: "#050201",
    muted: C.muted,
    border: C.border,
  },
  fonts: {
    body: BODY_FONT,
    heading: DISPLAY_FONT,
  },
  fontSizes: { body: 15 },
  lineHeights: { body: 1.6 },
  elements: {
    Heading: {
      by: {
        level: {
          1: { fontSize: 30, lineHeight: 1.15, fontFamily: DISPLAY_FONT, mobile: { fontSize: 25 } },
          2: { fontSize: 20, lineHeight: 1.25, fontFamily: DISPLAY_FONT, mobile: { fontSize: 18 } },
          // Section kickers: small, tracked-out, uppercase, muted.
          3: {
            fontSize: 12,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "{colors.muted}",
            fontFamily: BODY_FONT,
          },
        },
      },
    },
    Button: {
      borderRadius: 999,
      hover: { backgroundColor: "#FF6A1F" },
    },
  },
  styles: {
    // The dark card every content section lives in.
    card: {
      backgroundColor: "#17100A",
      padding: 28,
      gap: 20,
      borderRadius: 16,
      border: "1px solid #2A1D12",
    },
  },
});

/** Font files for the Document (PDF) and Canvas roots. Static TTF
 *  instances only — variable fonts crash satori's opentype parser.
 *  Inter 800 is registered for the 700–900 range the same way LOKER
 *  registered DejaVu Bold, so weight-800 headings draw as ExtraBold
 *  instead of warning about a missing file. */
export const PRINT_FONTS = [
  {
    family: "Inter",
    src: "../assets/fonts/Inter-Regular.ttf",
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    family: "Inter",
    src: "../assets/fonts/Inter-Bold.ttf",
    weight: 700 as const,
    style: "normal" as const,
  },
  {
    family: "Inter",
    src: "../assets/fonts/Inter-ExtraBold.ttf",
    weight: 800 as const,
    style: "normal" as const,
  },
  {
    family: "Space Grotesk",
    src: "../assets/fonts/SpaceGrotesk-Medium.ttf",
    weight: 500 as const,
    style: "normal" as const,
  },
  {
    family: "Space Grotesk",
    src: "../assets/fonts/SpaceGrotesk-Bold.ttf",
    weight: 700 as const,
    style: "normal" as const,
  },
  {
    family: "Space Grotesk",
    src: "../assets/fonts/SpaceGrotesk-ExtraBold.ttf",
    weight: 800 as const,
    style: "normal" as const,
  },
  {
    family: "DejaVu Sans Mono",
    src: "../assets/fonts/DejaVuSansMono.ttf",
    weight: 400 as const,
    style: "normal" as const,
  },
  {
    family: "DejaVu Sans Mono",
    src: "../assets/fonts/DejaVuSansMono-Bold.ttf",
    weight: 700 as const,
    style: "normal" as const,
  },
  {
    family: "DejaVu Sans Mono",
    src: "../assets/fonts/DejaVuSansMono-Bold.ttf",
    weight: 800 as const,
    style: "normal" as const,
  },
];
