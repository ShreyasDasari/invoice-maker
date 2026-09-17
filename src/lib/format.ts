/** Presentation helpers: money, dates and numbers. Display only — never maths. */

import { type Dec, abs as absDec, toFixed } from './money';
import { getCurrency } from './currency';

export type DateFormatId = 'iso' | 'us' | 'eu' | 'long';

/** Values this large exceed Number's exact integer range, so format by hand. */
const HUGE = 1e15;

const formatterCache = new Map<string, Intl.NumberFormat>();

function numberFormatter(locale: string, currency: string, decimals: number): Intl.NumberFormat {
  const key = `${locale}|${currency}|${decimals}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  formatterCache.set(key, formatter);
  return formatter;
}

/** Group an exact decimal string with thousands separators, keeping every digit. */
function groupExact(value: Dec, decimals: number): string {
  const fixed = toFixed(value, decimals);
  const negative = fixed.startsWith('-');
  const body = negative ? fixed.slice(1) : fixed;
  const [whole = '0', frac] = body.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const out = frac ? `${grouped}.${frac}` : grouped;
  return negative ? `-${out}` : out;
}

/**
 * Format an exact decimal as currency.
 *
 * `locale` only affects grouping and symbol placement; the number of decimals
 * always comes from the currency itself.
 */
export function formatMoney(value: Dec, currencyCode: string, locale?: string): string {
  const currency = getCurrency(currencyCode);
  const decimals = currency.decimals;
  const resolvedLocale = locale || currency.locale;

  // Past Number's exact range, fall back to manual grouping so no digit is lost.
  if (absDec(value) >= BigInt(Math.round(HUGE)) * 1000000n) {
    const sign = value < 0n ? '-' : '';
    return `${sign}${currency.symbol}${groupExact(absDec(value), decimals)}`;
  }

  const asNumber = Number(toFixed(value, decimals));
  return numberFormatter(resolvedLocale, currency.code, decimals).format(asNumber);
}

/** The currency amount without any symbol, for table columns that show it once. */
export function formatAmount(value: Dec, currencyCode: string, locale?: string): string {
  const currency = getCurrency(currencyCode);
  const decimals = currency.decimals;
  const asNumber = Number(toFixed(value, decimals));
  if (!Number.isFinite(asNumber) || Math.abs(asNumber) >= HUGE) {
    return groupExact(value, decimals);
  }
  try {
    return new Intl.NumberFormat(locale || currency.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(asNumber);
  } catch {
    return groupExact(value, decimals);
  }
}

/** Trim a quantity for display: "2" not "2.000000", "1.5" not "1.500000". */
export function formatQuantity(value: Dec): string {
  const fixed = toFixed(value, 6);
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/\.?0+$/, '');
}

/** Format a percentage rate: "8.5%", "20%". */
export function formatRate(value: Dec): string {
  return `${formatQuantity(value)}%`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Format a YYYY-MM-DD date without constructing a local Date, which would
 * risk a timezone shifting the day.
 */
export function formatDate(iso: string, style: DateFormatId = 'iso'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return iso;
  const [, y = '', m = '', d = ''] = match;
  const monthIndex = Number.parseInt(m, 10) - 1;
  switch (style) {
    case 'us':
      return `${m}/${d}/${y}`;
    case 'eu':
      return `${d}/${m}/${y}`;
    case 'long':
      return `${MONTHS[monthIndex] ?? m} ${Number.parseInt(d, 10)}, ${y}`;
    case 'iso':
    default:
      return `${y}-${m}-${d}`;
  }
}

/** True when `iso` is a real calendar date. */
export function isValidDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return false;
  const y = Number.parseInt(match[1] ?? '', 10);
  const m = Number.parseInt(match[2] ?? '', 10);
  const d = Number.parseInt(match[3] ?? '', 10);
  if (m < 1 || m > 12 || d < 1) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= daysInMonth;
}

/** Is `a` strictly before `b`? Both YYYY-MM-DD, so string order works. */
export function isBefore(a: string, b: string): boolean {
  return a < b;
}

/** Guess a date style from a locale, defaulting to ISO for clarity. */
export function dateStyleForLocale(locale: string): DateFormatId {
  const lower = locale.toLowerCase();
  if (lower.startsWith('en-us')) return 'us';
  if (/^(en-gb|fr|es|it|pt|de|nl|pl|ru|tr|hi|id|vi|th)/.test(lower)) return 'eu';
  return 'iso';
}

/** "2 days ago", "just now" — for the recent-invoices list. */
export function relativeTime(isoTimestamp: string, now: Date = new Date()): string {
  const then = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = now.getTime() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  const years = Math.round(months / 12);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}
