/**
 * Invoice numbering.
 *
 * Supports the two shapes people actually use — a fixed prefix with a padded
 * counter (INV-0001) and a year-scoped counter (2026-001) — by parsing whatever
 * the user typed rather than making them configure a scheme.
 */

export interface NumberParts {
  prefix: string;
  /** The numeric tail, as typed, so "0001" keeps its padding width. */
  digits: string;
  suffix: string;
}

/** Split a number into its trailing counter and everything around it. */
export function parseInvoiceNumber(value: string): NumberParts | null {
  const match = /^(.*?)(\d+)(\D*)$/.exec(value);
  if (!match) return null;
  return { prefix: match[1] ?? '', digits: match[2] ?? '', suffix: match[3] ?? '' };
}

/**
 * The next number after `value`, preserving padding width.
 * "INV-0001" -> "INV-0002", "2026-009" -> "2026-010", "INV-9999" -> "INV-10000".
 */
export function nextInvoiceNumber(value: string): string {
  const parts = parseInvoiceNumber(value.trim());
  if (!parts) {
    const base = value.trim();
    return base ? `${base}-2` : 'INV-0001';
  }
  const next = (BigInt(parts.digits) + 1n).toString();
  const padded = next.padStart(parts.digits.length, '0');
  return `${parts.prefix}${padded}${parts.suffix}`;
}

/** The highest number among those used, so a new invoice never collides. */
export function nextFromHistory(used: readonly string[], fallback = 'INV-0001'): string {
  if (used.length === 0) return fallback;

  let best: { value: string; counter: bigint } | null = null;
  for (const candidate of used) {
    const parts = parseInvoiceNumber(candidate.trim());
    if (!parts) continue;
    const counter = BigInt(parts.digits);
    if (!best || counter > best.counter) best = { value: candidate.trim(), counter };
  }
  return best ? nextInvoiceNumber(best.value) : fallback;
}

/** A year-scoped starting number, e.g. yearNumber(2026) -> "2026-001". */
export function yearNumber(year: number, counter = 1, width = 3): string {
  return `${year}-${`${counter}`.padStart(width, '0')}`;
}
