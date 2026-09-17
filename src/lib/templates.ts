/**
 * Template specifications.
 *
 * The preview is HTML (instant, printable, accessible) and the download is a
 * real PDF built by @react-pdf/renderer. Two renderers would normally drift
 * apart, so both read their geometry, type scale and accent rules from the
 * single spec below. Changing a template means changing one object here.
 *
 * Sizes are in points, the PDF's own unit. The HTML preview scales points to
 * pixels by a single factor, so the preview is a true scale model of the page.
 */

import type { PaperSize, TemplateId } from './invoice';

export interface TemplateSpec {
  id: TemplateId;
  name: string;
  /** One line, shown under the template's name in the picker. */
  description: string;

  /** How the masthead is arranged. */
  header: 'split' | 'band' | 'stack';
  /** Where the single accent colour is allowed to appear. */
  accent: 'rule' | 'band' | 'text';
  /** Fill behind the line-items header row. */
  tableHeaderFill: 'accent' | 'tint' | 'none';
  /** Horizontal rules between line items. */
  rowDividers: boolean;
  /** Small-caps treatment for field labels. */
  uppercaseLabels: boolean;
  /** How the grand total is set apart. */
  totals: 'box' | 'rule' | 'plain';

  fontSize: {
    docTitle: number;
    sectionLabel: number;
    body: number;
    small: number;
    total: number;
  };
  /** Page margin and the gap between major blocks, in points. */
  space: { page: number; section: number; cell: number };
  radius: number;
}

export const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Ruled table, clear labels. Reads like an accounting document.',
    header: 'split',
    accent: 'rule',
    tableHeaderFill: 'tint',
    rowDividers: true,
    uppercaseLabels: true,
    totals: 'rule',
    fontSize: { docTitle: 26, sectionLabel: 7.5, body: 9.5, small: 8, total: 13 },
    space: { page: 42, section: 22, cell: 7 },
    radius: 0,
  },
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Accent header band, generous spacing, boxed total.',
    header: 'band',
    accent: 'band',
    tableHeaderFill: 'accent',
    rowDividers: true,
    uppercaseLabels: true,
    totals: 'box',
    fontSize: { docTitle: 24, sectionLabel: 7.5, body: 9.5, small: 8, total: 14 },
    space: { page: 40, section: 24, cell: 8 },
    radius: 3,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'No fills, hairline rules, maximum whitespace.',
    header: 'stack',
    accent: 'text',
    tableHeaderFill: 'none',
    rowDividers: false,
    uppercaseLabels: false,
    totals: 'plain',
    fontSize: { docTitle: 20, sectionLabel: 8, body: 9.5, small: 8, total: 12 },
    space: { page: 48, section: 26, cell: 8 },
    radius: 0,
  },
};

export function getTemplate(id: TemplateId): TemplateSpec {
  return TEMPLATES[id] ?? TEMPLATES.classic;
}

/** Below this the document stops being comfortably readable in print. */
export const MIN_FIT_SCALE = 0.55;

/**
 * Shrink a template proportionally.
 *
 * Type sizes, page margins and cell padding all scale together, so a scaled
 * invoice keeps its proportions instead of turning into small text in a
 * large frame. Used by "Fit to one page", and applied identically by the
 * preview and the PDF so the two still agree.
 */
export function scaleTemplate(spec: TemplateSpec, scale: number): TemplateSpec {
  if (scale >= 0.999) return spec;
  const s = Math.max(MIN_FIT_SCALE, Math.min(1, scale));
  return {
    ...spec,
    fontSize: {
      docTitle: spec.fontSize.docTitle * s,
      sectionLabel: spec.fontSize.sectionLabel * s,
      body: spec.fontSize.body * s,
      small: spec.fontSize.small * s,
      total: spec.fontSize.total * s,
    },
    space: {
      // Margins shrink more gently than type: a page with no margin reads as
      // broken even when the text still fits.
      page: spec.space.page * (0.55 + 0.45 * s),
      section: spec.space.section * s,
      cell: spec.space.cell * s,
    },
  };
}

export const TEMPLATE_LIST: readonly TemplateSpec[] = [
  TEMPLATES.classic,
  TEMPLATES.modern,
  TEMPLATES.minimal,
];

// --- Paper -----------------------------------------------------------------

export interface PaperSpec {
  id: PaperSize;
  name: string;
  /** Points, at 72 per inch. */
  width: number;
  height: number;
  /** CSS @page size keyword. */
  css: string;
}

export const PAPER: Record<PaperSize, PaperSpec> = {
  a4: { id: 'a4', name: 'A4', width: 595.28, height: 841.89, css: 'A4' },
  letter: { id: 'letter', name: 'Letter', width: 612, height: 792, css: 'letter' },
};

export function getPaper(id: PaperSize): PaperSpec {
  return PAPER[id] ?? PAPER.a4;
}

export const PAPER_LIST: readonly PaperSpec[] = [PAPER.a4, PAPER.letter];

// --- Accent colours --------------------------------------------------------

/**
 * A restrained set; one accent per invoice, all legible when printed in black
 * and white. Navy leads because it is the one that reads as "established
 * business" rather than as a colour choice.
 */
export const ACCENT_PRESETS: readonly { value: string; name: string }[] = [
  { value: '#1E3A5F', name: 'Navy' },
  { value: '#2563EB', name: 'Blue' },
  { value: '#0F766E', name: 'Teal' },
  { value: '#047857', name: 'Green' },
  { value: '#B45309', name: 'Amber' },
  { value: '#9F1239', name: 'Burgundy' },
  { value: '#5B21B6', name: 'Violet' },
  { value: '#334155', name: 'Slate' },
];

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidHex(value: string): boolean {
  return HEX.test(value.trim());
}

/** Normalise to a 6-digit hex, falling back when the input is not a colour. */
export function safeHex(value: string, fallback = '#1E3A5F'): string {
  const trimmed = value.trim();
  if (!HEX.test(trimmed)) return fallback;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

/** Relative luminance, per WCAG, for picking legible text over the accent. */
export function luminance(hex: string): number {
  const normalised = safeHex(hex).slice(1);
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(normalised.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

/** Black or white, whichever is readable on the given accent. */
export function onAccent(hex: string): string {
  return luminance(hex) > 0.45 ? '#0A0A0A' : '#FFFFFF';
}

/** Blend the accent toward white, for tinted table headers. */
export function tint(hex: string, amount = 0.92): string {
  const normalised = safeHex(hex).slice(1);
  const mixed = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(normalised.slice(offset, offset + 2), 16);
    return Math.round(channel + (255 - channel) * amount);
  });
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}
