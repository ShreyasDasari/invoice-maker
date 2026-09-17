import { describe, expect, it } from 'vitest';
import { formatAmount, formatDate, formatMoney, formatQuantity, formatRate, isValidDate, relativeTime } from './format';
import { parseDec } from './money';

describe('formatMoney', () => {
  it('formats with the currency symbol and correct precision', () => {
    expect(formatMoney(parseDec('1234.5'), 'USD', 'en-US')).toBe('$1,234.50');
    expect(formatMoney(parseDec('1234.5'), 'GBP', 'en-GB')).toBe('£1,234.50');
  });

  it('uses zero decimals for JPY', () => {
    expect(formatMoney(parseDec('1250'), 'JPY', 'en-US')).toBe('¥1,250');
  });

  it('uses three decimals for KWD', () => {
    expect(formatMoney(parseDec('20.247'), 'KWD', 'en-US')).toContain('20.247');
  });

  it('formats negatives', () => {
    expect(formatMoney(parseDec('-50'), 'USD', 'en-US')).toBe('-$50.00');
  });

  it('keeps every digit on amounts beyond float precision', () => {
    const huge = formatMoney(parseDec('98765432198765432.21'), 'USD', 'en-US');
    expect(huge).toContain('98,765,432,198,765,432.21');
  });

  it('falls back to a valid format for an unknown currency', () => {
    expect(formatMoney(parseDec('10'), 'ZZZ', 'en-US')).toBe('$10.00');
  });
});

describe('formatAmount', () => {
  it('omits the symbol', () => {
    expect(formatAmount(parseDec('1234.5'), 'USD', 'en-US')).toBe('1,234.50');
  });
});

describe('formatQuantity and formatRate', () => {
  it('trims trailing zeros', () => {
    expect(formatQuantity(parseDec('2'))).toBe('2');
    expect(formatQuantity(parseDec('1.5'))).toBe('1.5');
    expect(formatQuantity(parseDec('0.25'))).toBe('0.25');
  });

  it('formats a rate', () => {
    expect(formatRate(parseDec('8.5'))).toBe('8.5%');
    expect(formatRate(parseDec('20'))).toBe('20%');
  });
});

describe('formatDate', () => {
  it('formats in each style without timezone drift', () => {
    expect(formatDate('2026-03-09', 'iso')).toBe('2026-03-09');
    expect(formatDate('2026-03-09', 'us')).toBe('03/09/2026');
    expect(formatDate('2026-03-09', 'eu')).toBe('09/03/2026');
    expect(formatDate('2026-03-09', 'long')).toBe('March 9, 2026');
  });

  it('returns malformed input unchanged rather than "Invalid Date"', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('isValidDate', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(isValidDate('2026-02-28')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

describe('relativeTime', () => {
  it('describes recent timestamps', () => {
    const now = new Date('2026-01-10T12:00:00Z');
    expect(relativeTime('2026-01-10T11:59:40Z', now)).toBe('just now');
    expect(relativeTime('2026-01-10T11:30:00Z', now)).toBe('30 min ago');
    expect(relativeTime('2026-01-09T12:00:00Z', now)).toBe('1 day ago');
    expect(relativeTime('2025-12-11T12:00:00Z', now)).toBe('1 month ago');
  });

  it('ignores unparseable input', () => {
    expect(relativeTime('nonsense')).toBe('');
  });
});
