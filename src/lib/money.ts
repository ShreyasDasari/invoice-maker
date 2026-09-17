/**
 * Exact decimal arithmetic for monetary values.
 *
 * Money is never represented as a JS `number`. Every value is a `Dec`: a
 * `bigint` of units scaled by 10^SCALE. All arithmetic is integer arithmetic,
 * so totals are deterministic and free of binary floating-point drift
 * (the classic `0.1 + 0.2 !== 0.3` class of bug).
 *
 * SCALE is 6, which comfortably holds percentage maths (e.g. 8.375% tax on a
 * fractional quantity) before the single rounding step at display time.
 */

export const SCALE = 6;
const SCALE_FACTOR = 10n ** BigInt(SCALE);

/** A fixed-point decimal with `SCALE` fractional digits. */
export type Dec = bigint;

export const ZERO: Dec = 0n;

/** Build a Dec from a whole number of units. */
export function fromInt(n: number): Dec {
  if (!Number.isFinite(n)) return ZERO;
  return BigInt(Math.trunc(n)) * SCALE_FACTOR;
}

/**
 * Parse arbitrary user input into a Dec.
 *
 * Tolerates currency symbols, thousands separators, comma decimal marks and
 * partial input ("12.", "-", ""). Anything unparseable becomes zero rather
 * than NaN, so a half-typed field can never poison a total.
 */
export function parseDec(input: string | number | null | undefined): Dec {
  if (input === null || input === undefined) return ZERO;
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return ZERO;
    return parseDec(input.toFixed(SCALE));
  }

  let s = input.trim();
  if (!s) return ZERO;

  const negative = /^[-(]/.test(s) || s.endsWith(')');
  // Keep digits and separators only.
  s = s.replace(/[^0-9.,]/g, '');
  if (!s) return ZERO;

  // Work out which separator, if any, is the decimal mark:
  //  - both present  -> the rightmost one is the decimal mark  (1.234,56)
  //  - repeated      -> that separator is grouping              (1.234.567)
  //  - a single dot  -> decimal mark                            (1.005, 0.001)
  //  - a single comma-> grouping only in the classic 1,234 shape, else decimal
  const commaCount = (s.match(/,/g) ?? []).length;
  const dotCount = (s.match(/\./g) ?? []).length;
  let decimalSep = '';
  if (commaCount > 0 && dotCount > 0) {
    decimalSep = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
  } else if (commaCount === 1) {
    decimalSep = /^\d{1,3},\d{3}$/.test(s) ? '' : ',';
  } else if (dotCount === 1) {
    decimalSep = '.';
  }
  // More than one of a single separator is always grouping, so decimalSep
  // stays empty and every separator is stripped below.

  let intPart: string;
  let fracPart: string;
  if (decimalSep) {
    const idx = s.lastIndexOf(decimalSep);
    intPart = s.slice(0, idx).replace(/[.,]/g, '');
    fracPart = s.slice(idx + 1).replace(/[.,]/g, '');
  } else {
    intPart = s.replace(/[.,]/g, '');
    fracPart = '';
  }

  intPart = intPart || '0';
  // Truncate beyond our working precision; extra digits cannot survive rounding.
  fracPart = fracPart.slice(0, SCALE).padEnd(SCALE, '0');

  let value: Dec;
  try {
    value = BigInt(intPart) * SCALE_FACTOR + BigInt(fracPart);
  } catch {
    return ZERO;
  }
  return negative ? -value : value;
}

export function add(a: Dec, b: Dec): Dec {
  return a + b;
}

export function sub(a: Dec, b: Dec): Dec {
  return a - b;
}

export function sum(values: readonly Dec[]): Dec {
  let total = ZERO;
  for (const v of values) total += v;
  return total;
}

/** Multiply two Decs, rounding the product back to SCALE (half away from zero). */
export function mul(a: Dec, b: Dec): Dec {
  return divRound(a * b, SCALE_FACTOR);
}

/** Divide two Decs, rounding to SCALE (half away from zero). */
export function div(a: Dec, b: Dec): Dec {
  if (b === 0n) return ZERO;
  return divRound(a * SCALE_FACTOR, b);
}

/** `value` * `percent`%, e.g. pct(fromInt(200), parseDec('8.5')) -> 17. */
export function pct(value: Dec, percent: Dec): Dec {
  return div(mul(value, percent), fromInt(100));
}

/** Integer division with half-away-from-zero rounding. */
function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) return 0n;
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = n / d;
  const r = n % d;
  const rounded = r * 2n >= d ? q + 1n : q;
  return negative ? -rounded : rounded;
}

export function neg(a: Dec): Dec {
  return -a;
}

export function abs(a: Dec): Dec {
  return a < 0n ? -a : a;
}

export function isZero(a: Dec): boolean {
  return a === 0n;
}

export function isNegative(a: Dec): boolean {
  return a < 0n;
}

export function max(a: Dec, b: Dec): Dec {
  return a > b ? a : b;
}

export function min(a: Dec, b: Dec): Dec {
  return a < b ? a : b;
}

export function compare(a: Dec, b: Dec): number {
  return a === b ? 0 : a > b ? 1 : -1;
}

/**
 * Round a Dec to `decimals` fractional digits, half away from zero
 * (standard commercial rounding), returning a Dec still at full SCALE.
 */
export function roundTo(value: Dec, decimals: number): Dec {
  const drop = SCALE - decimals;
  if (drop <= 0) return value;
  const factor = 10n ** BigInt(drop);
  return divRound(value, factor) * factor;
}

/** Exact decimal string, e.g. toFixed(parseDec('1.005'), 2) -> "1.01". */
export function toFixed(value: Dec, decimals: number): string {
  const rounded = roundTo(value, decimals);
  const negative = rounded < 0n;
  const av = negative ? -rounded : rounded;
  const whole = av / SCALE_FACTOR;
  const frac = (av % SCALE_FACTOR).toString().padStart(SCALE, '0').slice(0, decimals);
  const body = decimals > 0 ? `${whole}.${frac}` : `${whole}`;
  return negative && !isZeroString(body) ? `-${body}` : body;
}

function isZeroString(body: string): boolean {
  return /^0(\.0*)?$/.test(body);
}

/**
 * Convert to a `number` for presentation only (Intl formatting).
 * Never feed the result back into arithmetic.
 */
export function toNumber(value: Dec, decimals = SCALE): number {
  return Number(toFixed(value, decimals));
}

/**
 * Split `total` across `weights` so the parts sum back to `total` exactly.
 *
 * Uses the largest-remainder method: proportional shares are floored, then the
 * leftover minor units go to the largest remainders. This is what keeps an
 * invoice-level discount from losing or inventing a cent when spread over
 * line items.
 */
export function allocate(total: Dec, weights: readonly Dec[], decimals: number): Dec[] {
  const n = weights.length;
  if (n === 0) return [];

  const unit = 10n ** BigInt(SCALE - decimals);
  const totalUnits = roundTo(total, decimals) / unit;
  const weightSum = sum(weights);

  if (weightSum === 0n) {
    // No basis for proportion: put everything on the first line.
    const out = new Array<Dec>(n).fill(ZERO);
    out[0] = totalUnits * unit;
    return out;
  }

  const shares: bigint[] = [];
  const remainders: { index: number; rem: bigint }[] = [];
  let allocated = 0n;

  for (let i = 0; i < n; i += 1) {
    const w = weights[i] ?? ZERO;
    const numerator = totalUnits * w;
    const share = numerator / weightSum;
    const rem = numerator - share * weightSum;
    shares.push(share);
    remainders.push({ index: i, rem: rem < 0n ? -rem : rem });
    allocated += share;
  }

  let leftover = totalUnits - allocated;
  const step = leftover < 0n ? -1n : 1n;
  remainders.sort((a, b) => (a.rem === b.rem ? a.index - b.index : a.rem > b.rem ? -1 : 1));

  let cursor = 0;
  while (leftover !== 0n && remainders.length > 0) {
    const target = remainders[cursor % remainders.length]!;
    shares[target.index] = (shares[target.index] ?? 0n) + step;
    leftover -= step;
    cursor += 1;
  }

  return shares.map((s) => s * unit);
}
