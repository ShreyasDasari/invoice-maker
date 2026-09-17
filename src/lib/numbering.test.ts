import { describe, expect, it } from 'vitest';
import { nextFromHistory, nextInvoiceNumber, parseInvoiceNumber, yearNumber } from './numbering';

describe('nextInvoiceNumber', () => {
  it('increments while preserving padding', () => {
    expect(nextInvoiceNumber('INV-0001')).toBe('INV-0002');
    expect(nextInvoiceNumber('INV-0009')).toBe('INV-0010');
    expect(nextInvoiceNumber('2026-001')).toBe('2026-002');
  });

  it('grows past the padding width rather than wrapping', () => {
    expect(nextInvoiceNumber('INV-9999')).toBe('INV-10000');
  });

  it('keeps a trailing suffix in place', () => {
    expect(nextInvoiceNumber('INV-0007-A')).toBe('INV-0008-A');
  });

  it('handles numbers with no prefix', () => {
    expect(nextInvoiceNumber('42')).toBe('43');
  });

  it('falls back sensibly when there is no counter', () => {
    expect(nextInvoiceNumber('INVOICE')).toBe('INVOICE-2');
    expect(nextInvoiceNumber('')).toBe('INV-0001');
  });

  it('handles counters beyond Number.MAX_SAFE_INTEGER', () => {
    expect(nextInvoiceNumber('INV-9007199254740993')).toBe('INV-9007199254740994');
  });
});

describe('parseInvoiceNumber', () => {
  it('splits prefix, digits and suffix', () => {
    expect(parseInvoiceNumber('INV-0042')).toEqual({ prefix: 'INV-', digits: '0042', suffix: '' });
  });

  it('returns null without a counter', () => {
    expect(parseInvoiceNumber('DRAFT')).toBeNull();
  });
});

describe('nextFromHistory', () => {
  it('continues from the highest number used', () => {
    expect(nextFromHistory(['INV-0001', 'INV-0007', 'INV-0003'])).toBe('INV-0008');
  });

  it('uses the fallback when there is no history', () => {
    expect(nextFromHistory([])).toBe('INV-0001');
  });

  it('skips entries with no counter', () => {
    expect(nextFromHistory(['DRAFT', 'INV-0004'])).toBe('INV-0005');
  });
});

describe('yearNumber', () => {
  it('builds a year-scoped number', () => {
    expect(yearNumber(2026)).toBe('2026-001');
    expect(yearNumber(2026, 12)).toBe('2026-012');
  });
});
