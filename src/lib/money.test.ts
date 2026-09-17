import { describe, expect, it } from 'vitest';
import {
  add,
  allocate,
  div,
  fromInt,
  mul,
  parseDec,
  pct,
  roundTo,
  sub,
  sum,
  toFixed,
} from './money';

describe('parseDec', () => {
  it('parses plain decimals exactly', () => {
    expect(toFixed(parseDec('12.34'), 2)).toBe('12.34');
    expect(toFixed(parseDec('0.01'), 2)).toBe('0.01');
    expect(toFixed(parseDec('1000'), 2)).toBe('1000.00');
  });

  it('tolerates partial and messy input instead of producing NaN', () => {
    expect(toFixed(parseDec(''), 2)).toBe('0.00');
    expect(toFixed(parseDec('12.'), 2)).toBe('12.00');
    expect(toFixed(parseDec('.5'), 2)).toBe('0.50');
    expect(toFixed(parseDec('-'), 2)).toBe('0.00');
    expect(toFixed(parseDec('abc'), 2)).toBe('0.00');
    expect(toFixed(parseDec(null), 2)).toBe('0.00');
    expect(toFixed(parseDec(Number.NaN), 2)).toBe('0.00');
  });

  it('strips currency symbols and thousands separators', () => {
    expect(toFixed(parseDec('$1,234.56'), 2)).toBe('1234.56');
    expect(toFixed(parseDec('₹ 1,00,000'), 2)).toBe('100000.00');
  });

  it('reads a comma as a decimal mark when it is not grouping', () => {
    expect(toFixed(parseDec('12,5'), 2)).toBe('12.50');
    expect(toFixed(parseDec('1.234,56'), 2)).toBe('1234.56');
    expect(toFixed(parseDec('1,234'), 2)).toBe('1234.00');
  });

  it('handles negatives in both notations', () => {
    expect(toFixed(parseDec('-42.50'), 2)).toBe('-42.50');
    expect(toFixed(parseDec('(42.50)'), 2)).toBe('-42.50');
  });

  it('keeps precision on very large amounts', () => {
    expect(toFixed(parseDec('987654321987654.21'), 2)).toBe('987654321987654.21');
  });
});

describe('arithmetic', () => {
  it('avoids binary floating point drift', () => {
    // 0.1 + 0.2 === 0.30000000000000004 as a JS number.
    expect(toFixed(add(parseDec('0.1'), parseDec('0.2')), 2)).toBe('0.30');
    // 1.005 rounds down as a float; commercial rounding must round up.
    expect(toFixed(parseDec('1.005'), 2)).toBe('1.01');
    // 0.07 * 3 is 0.21000000000000002 as a float.
    expect(toFixed(mul(parseDec('0.07'), fromInt(3)), 2)).toBe('0.21');
  });

  it('adds, subtracts and sums', () => {
    expect(toFixed(sub(parseDec('10'), parseDec('3.33')), 2)).toBe('6.67');
    expect(toFixed(sum([parseDec('1.11'), parseDec('2.22'), parseDec('3.33')]), 2)).toBe('6.66');
    expect(toFixed(sum([]), 2)).toBe('0.00');
  });

  it('multiplies fractional quantities by rates', () => {
    expect(toFixed(mul(parseDec('1.5'), parseDec('120')), 2)).toBe('180.00');
    expect(toFixed(mul(parseDec('2.25'), parseDec('33.33')), 2)).toBe('74.99');
  });

  it('divides, and treats division by zero as zero rather than Infinity', () => {
    expect(toFixed(div(parseDec('10'), parseDec('4')), 2)).toBe('2.50');
    expect(toFixed(div(parseDec('10'), parseDec('0')), 2)).toBe('0.00');
  });

  it('computes percentages', () => {
    expect(toFixed(pct(parseDec('200'), parseDec('8.5')), 2)).toBe('17.00');
    expect(toFixed(pct(parseDec('99.99'), parseDec('20')), 2)).toBe('20.00');
    expect(toFixed(pct(parseDec('1234.56'), parseDec('8.375')), 2)).toBe('103.39');
  });
});

describe('rounding', () => {
  it('rounds half away from zero', () => {
    expect(toFixed(roundTo(parseDec('2.345'), 2), 2)).toBe('2.35');
    expect(toFixed(roundTo(parseDec('2.344'), 2), 2)).toBe('2.34');
    expect(toFixed(roundTo(parseDec('-2.345'), 2), 2)).toBe('-2.35');
  });

  it('respects zero-decimal currencies', () => {
    expect(toFixed(roundTo(parseDec('1250.5'), 0), 0)).toBe('1251');
    expect(toFixed(parseDec('1250.4'), 0)).toBe('1250');
  });

  it('respects three-decimal currencies', () => {
    expect(toFixed(parseDec('10.1235'), 3)).toBe('10.124');
  });

  it('never renders negative zero', () => {
    expect(toFixed(parseDec('-0.001'), 2)).toBe('0.00');
  });
});

describe('allocate', () => {
  it('splits a total so the parts sum back exactly', () => {
    const parts = allocate(parseDec('10'), [parseDec('1'), parseDec('1'), parseDec('1')], 2);
    expect(parts.map((p) => toFixed(p, 2))).toEqual(['3.34', '3.33', '3.33']);
    expect(toFixed(sum(parts), 2)).toBe('10.00');
  });

  it('weights the split by line size', () => {
    const parts = allocate(parseDec('100'), [parseDec('300'), parseDec('100')], 2);
    expect(parts.map((p) => toFixed(p, 2))).toEqual(['75.00', '25.00']);
  });

  it('puts everything on the first line when there is no basis', () => {
    const parts = allocate(parseDec('25'), [parseDec('0'), parseDec('0')], 2);
    expect(parts.map((p) => toFixed(p, 2))).toEqual(['25.00', '0.00']);
  });

  it('loses nothing across many lines', () => {
    const weights = Array.from({ length: 7 }, () => parseDec('1'));
    const parts = allocate(parseDec('1'), weights, 2);
    expect(toFixed(sum(parts), 2)).toBe('1.00');
  });

  it('handles an empty set', () => {
    expect(allocate(parseDec('10'), [], 2)).toEqual([]);
  });
});
