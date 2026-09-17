/**
 * Fonts.
 *
 * Real font files, shipped with the app and used by BOTH renderers, so the
 * downloaded PDF is set in the same typeface as the preview rather than a
 * lookalike. Earlier this used the three fonts built into the PDF format
 * (Helvetica, Times, Courier); they cost nothing to ship but they are not the
 * fonts the preview shows, and the difference was visible in the download.
 *
 * `leading` is the intrinsic line height react-pdf gives each face, measured
 * from generated PDFs. The preview uses the same number as its CSS
 * `line-height`, which is what keeps a block of text the same height in both —
 * and therefore keeps a one-page preview a one-page PDF.
 *
 * Do NOT set `lineHeight` on a react-pdf View or Text to change this. It is
 * treated as an absolute measure there (the same value yields the same spacing
 * at 7pt as at 26pt) and setting it on the Page stops absolutely-positioned
 * fixed nodes, such as the page number, from drawing at all.
 */

import type { FontStyleId } from './invoice';

export interface FontWeightFile {
  weight: 400 | 600 | 700;
  file: string;
}

export interface FontChoice {
  id: FontStyleId;
  name: string;
  /** One-line description shown next to the name in the picker. */
  description: string;
  /** Family name registered with react-pdf and declared via @font-face. */
  family: string;
  /**
   * CSS stack for the preview. Must resolve to the same typeface `family`
   * names, or the preview and the download will disagree on text height.
   */
  css: string;
  files: FontWeightFile[];
  /** Intrinsic line height as a multiple of font size, measured from output. */
  leading: number;
}

export const FONT_CHOICES: readonly FontChoice[] = [
  {
    id: 'sans',
    name: 'Sans',
    description: 'Inter — neutral and modern',
    family: 'Inter',
    /*
     * References the interface font loaded by next/font rather than fetching a
     * second copy: it is the same typeface the PDF embeds, so the two agree
     * without another megabyte on the critical path. Serif and mono are
     * declared as @font-face and fetched only if chosen.
     */
    css: "var(--font-inter), 'Helvetica Neue', Helvetica, Arial, sans-serif",
    files: [
      { weight: 400, file: 'inter-400.ttf' },
      { weight: 600, file: 'inter-600.ttf' },
      { weight: 700, file: 'inter-700.ttf' },
    ],
    leading: 1.21,
  },
  {
    id: 'serif',
    name: 'Serif',
    description: 'Source Serif — traditional and formal',
    family: 'Source Serif 4',
    css: "'Source Serif 4', 'Source Serif Pro', Georgia, 'Times New Roman', serif",
    files: [
      { weight: 400, file: 'source-serif-400.ttf' },
      { weight: 700, file: 'source-serif-700.ttf' },
    ],
    leading: 1.371,
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'JetBrains Mono — fixed width, technical',
    family: 'JetBrains Mono',
    css: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
    files: [
      { weight: 400, file: 'jetbrains-mono-400.ttf' },
      { weight: 700, file: 'jetbrains-mono-700.ttf' },
    ],
    leading: 1.32,
  },
];

export function getFont(id: FontStyleId): FontChoice {
  return FONT_CHOICES.find((font) => font.id === id) ?? FONT_CHOICES[0]!;
}

/** Public path a font file is served from. */
export function fontUrl(file: string): string {
  return `/fonts/${file}`;
}

/**
 * The weight actually available for a requested one.
 *
 * The serif and mono families ship 400 and 700 only, so a 600 label falls back
 * to 700 rather than letting the renderer synthesise a weight that would not
 * match the preview.
 */
export function resolveWeight(font: FontChoice, weight: 400 | 600 | 700): 400 | 600 | 700 {
  if (font.files.some((f) => f.weight === weight)) return weight;
  return weight === 600 ? 700 : 400;
}
