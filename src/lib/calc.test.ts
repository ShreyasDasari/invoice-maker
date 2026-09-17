import { describe, expect, it } from 'vitest';
import { computeTotals } from './calc';
import { toFixed } from './money';
import { createInvoice, createLineItem, type Invoice, type LineItem } from './invoice';

/** Build an invoice with the given lines and overrides. */
function build(items: Partial<LineItem>[], overrides: Partial<Invoice> = {}): Invoice {
  const base = createInvoice({ today: '2026-01-01' });
  return {
    ...base,
    ...overrides,
    items: items.map((item) => createLineItem(item)),
    options: { ...base.options, ...(overrides.options ?? {}) },
  };
}

function money(invoice: Invoice) {
  const totals = computeTotals(invoice);
  const d = totals.decimals;
  return {
    totals,
    subtotal: toFixed(totals.subtotal, d),
    itemDiscount: toFixed(totals.itemDiscountTotal, d),
    invoiceDiscount: toFixed(totals.invoiceDiscount, d),
    taxableBase: toFixed(totals.taxableBase, d),
    tax: toFixed(totals.taxTotal, d),
    shipping: toFixed(totals.shipping, d),
    fees: toFixed(totals.fees, d),
    total: toFixed(totals.total, d),
    due: toFixed(totals.amountDue, d),
    lines: totals.items.map((i) => toFixed(i.net, d)),
  };
}

describe('empty and minimal invoices', () => {
  it('totals an untouched invoice to zero', () => {
    const result = money(createInvoice({ today: '2026-01-01' }));
    expect(result.subtotal).toBe('0.00');
    expect(result.total).toBe('0.00');
    expect(result.due).toBe('0.00');
  });

  it('totals a single line', () => {
    const result = money(build([{ quantity: '1', unitPrice: '1500' }]));
    expect(result.subtotal).toBe('1500.00');
    expect(result.total).toBe('1500.00');
  });

  it('handles fractional quantities', () => {
    const result = money(build([{ quantity: '7.5', unitPrice: '85' }]));
    expect(result.subtotal).toBe('637.50');
  });
});

describe('tax', () => {
  it('applies one shared rate to every line', () => {
    const result = money(
      build(
        [
          { quantity: '2', unitPrice: '100', tax: { mode: 'percent', value: '10' } },
          { quantity: '1', unitPrice: '50', tax: { mode: 'percent', value: '10' } },
        ],
        { options: { perItemTax: false } as Invoice['options'] },
      ),
    );
    expect(result.subtotal).toBe('250.00');
    expect(result.tax).toBe('25.00');
    expect(result.total).toBe('275.00');
  });

  it('ignores per-line rates unless per-item tax is on', () => {
    const items = [
      { quantity: '1', unitPrice: '100', tax: { mode: 'percent' as const, value: '10' } },
      { quantity: '1', unitPrice: '100', tax: { mode: 'percent' as const, value: '20' } },
    ];
    const shared = money(build(items, { options: { perItemTax: false } as Invoice['options'] }));
    // The first line's rate governs the whole invoice.
    expect(shared.tax).toBe('20.00');

    const perItem = money(build(items, { options: { perItemTax: true } as Invoice['options'] }));
    expect(perItem.tax).toBe('30.00');
  });

  it('groups equal rates and separates different ones', () => {
    const { totals } = money(
      build(
        [
          { quantity: '1', unitPrice: '100', tax: { mode: 'percent', value: '20', label: 'VAT' } },
          { quantity: '1', unitPrice: '100', tax: { mode: 'percent', value: '20', label: 'VAT' } },
          { quantity: '1', unitPrice: '100', tax: { mode: 'percent', value: '5', label: 'GST' } },
        ],
        { options: { perItemTax: true } as Invoice['options'] },
      ),
    );
    expect(totals.taxGroups).toHaveLength(2);
    expect(totals.taxGroups.map((g) => g.label)).toEqual(['VAT', 'GST']);
    expect(toFixed(totals.taxGroups[0]!.amount, 2)).toBe('40.00');
    expect(toFixed(totals.taxGroups[1]!.amount, 2)).toBe('5.00');
  });

  it('supports a flat tax amount', () => {
    const result = money(
      build([{ quantity: '1', unitPrice: '200', tax: { mode: 'fixed', value: '15' } }]),
    );
    expect(result.tax).toBe('15.00');
    expect(result.total).toBe('215.00');
  });

  it('treats a zero or blank rate as no tax', () => {
    const result = money(build([{ quantity: '1', unitPrice: '100', tax: { mode: 'percent', value: '' } }]));
    expect(result.tax).toBe('0.00');
    expect(result.total).toBe('100.00');
  });

  it('computes tax on the group total, not line by line', () => {
    // Each line's tax is 19.94475. Rounding per line to 19.94 and summing 100
    // of them gives 1,994.00 — 48 cents under the correct figure, which is the
    // rate applied once to the 27,510.00 taxable total.
    const items = Array.from({ length: 100 }, () => ({
      quantity: '2',
      unitPrice: '137.55',
      tax: { mode: 'percent' as const, value: '7.25' },
    }));
    const result = money(build(items));

    expect(result.subtotal).toBe('27510.00');
    expect(result.tax).toBe('1994.48');
    expect(result.total).toBe('29504.48');
  });

  it('keeps the per-line tax column adding up to the group total', () => {
    const items = Array.from({ length: 7 }, () => ({
      quantity: '1',
      unitPrice: '10',
      tax: { mode: 'percent' as const, value: '9' },
    }));
    const { totals } = money(build(items, { options: { perItemTax: true } as Invoice['options'] }));

    const lineSum = totals.items.reduce((acc, item) => acc + item.tax, 0n);
    expect(toFixed(lineSum, 2)).toBe(toFixed(totals.taxTotal, 2));
    expect(toFixed(totals.taxTotal, 2)).toBe('6.30');
  });

  it('charges a flat tax once per line', () => {
    const items = Array.from({ length: 3 }, () => ({
      quantity: '1',
      unitPrice: '100',
      tax: { mode: 'fixed' as const, value: '5' },
    }));
    const result = money(build(items, { options: { perItemTax: true } as Invoice['options'] }));
    expect(result.tax).toBe('15.00');
  });

  it('computes an awkward rate correctly', () => {
    const result = money(
      build([{ quantity: '3', unitPrice: '411.52', tax: { mode: 'percent', value: '8.375' } }]),
    );
    expect(result.subtotal).toBe('1234.56');
    expect(result.tax).toBe('103.39');
    expect(result.total).toBe('1337.95');
  });
});

describe('discounts', () => {
  it('applies a percentage discount per line', () => {
    const result = money(
      build(
        [{ quantity: '1', unitPrice: '200', discount: { mode: 'percent', value: '10' } }],
        { options: { perItemDiscount: true } as Invoice['options'] },
      ),
    );
    expect(result.itemDiscount).toBe('20.00');
    expect(result.subtotal).toBe('180.00');
  });

  it('never lets a flat line discount exceed the line', () => {
    const result = money(
      build(
        [{ quantity: '1', unitPrice: '50', discount: { mode: 'fixed', value: '500' } }],
        { options: { perItemDiscount: true } as Invoice['options'] },
      ),
    );
    expect(result.itemDiscount).toBe('50.00');
    expect(result.subtotal).toBe('0.00');
  });

  it('applies an invoice discount before tax', () => {
    const result = money(
      build([{ quantity: '1', unitPrice: '1000', tax: { mode: 'percent', value: '10' } }], {
        discount: { mode: 'percent', value: '10' },
      }),
    );
    expect(result.invoiceDiscount).toBe('100.00');
    expect(result.taxableBase).toBe('900.00');
    expect(result.tax).toBe('90.00');
    expect(result.total).toBe('990.00');
  });

  it('spreads an invoice discount across lines without losing a cent', () => {
    const { totals } = money(
      build(
        [
          { quantity: '1', unitPrice: '10' },
          { quantity: '1', unitPrice: '10' },
          { quantity: '1', unitPrice: '10' },
        ],
        { discount: { mode: 'fixed', value: '10' } },
      ),
    );
    const allocated = totals.items.map((i) => toFixed(i.allocatedDiscount, 2));
    expect(allocated).toEqual(['3.34', '3.33', '3.33']);
    expect(toFixed(totals.taxableBase, 2)).toBe('20.00');
  });

  it('caps an invoice discount at the subtotal', () => {
    const result = money(
      build([{ quantity: '1', unitPrice: '100' }], { discount: { mode: 'fixed', value: '250' } }),
    );
    expect(result.invoiceDiscount).toBe('100.00');
    expect(result.total).toBe('0.00');
  });
});

describe('shipping, fees and payment', () => {
  it('adds shipping and fees only when enabled', () => {
    const items = [{ quantity: '1', unitPrice: '100' }];
    const off = money(build(items, { shipping: '25', fees: '5' }));
    expect(off.total).toBe('100.00');

    const on = money(
      build(items, {
        shipping: '25',
        fees: '5',
        options: { showShipping: true, showFees: true } as Invoice['options'],
      }),
    );
    expect(on.shipping).toBe('25.00');
    expect(on.fees).toBe('5.00');
    expect(on.total).toBe('130.00');
  });

  it('subtracts an amount already paid', () => {
    const result = money(
      build([{ quantity: '1', unitPrice: '500' }], {
        amountPaid: '200',
        options: { showPaid: true } as Invoice['options'],
      }),
    );
    expect(result.total).toBe('500.00');
    expect(result.due).toBe('300.00');
  });

  it('shows a credit when more was paid than billed', () => {
    const result = money(
      build([{ quantity: '1', unitPrice: '100' }], {
        amountPaid: '150',
        options: { showPaid: true } as Invoice['options'],
      }),
    );
    expect(result.due).toBe('-50.00');
  });
});

describe('currency precision', () => {
  it('rounds to whole units for JPY', () => {
    const result = money(
      build([{ quantity: '3', unitPrice: '1250.4', tax: { mode: 'percent', value: '10' } }], {
        currency: 'JPY',
      }),
    );
    expect(result.subtotal).toBe('3751');
    expect(result.tax).toBe('375');
    expect(result.total).toBe('4126');
  });

  it('keeps three decimals for KWD', () => {
    const result = money(build([{ quantity: '2', unitPrice: '10.1235' }], { currency: 'KWD' }));
    expect(result.subtotal).toBe('20.247');
  });
});

describe('edge cases', () => {
  it('accepts negative lines as credits', () => {
    const result = money(
      build([
        { quantity: '1', unitPrice: '100' },
        { quantity: '1', unitPrice: '-30' },
      ]),
    );
    expect(result.lines).toEqual(['100.00', '-30.00']);
    expect(result.subtotal).toBe('70.00');
  });

  it('stays exact across a hundred lines', () => {
    const items = Array.from({ length: 100 }, () => ({ quantity: '3', unitPrice: '19.99' }));
    const result = money(build(items, { discount: { mode: 'percent', value: '7.5' } }));
    expect(result.subtotal).toBe('5997.00');
    expect(result.invoiceDiscount).toBe('449.78');
    expect(result.total).toBe('5547.22');
  });

  it('is unaffected by blank or partial input', () => {
    const result = money(
      build([
        { quantity: '', unitPrice: '' },
        { quantity: '2', unitPrice: '10.' },
        { quantity: '1.', unitPrice: '.5' },
      ]),
    );
    expect(result.subtotal).toBe('20.50');
  });

  it('handles very large amounts without losing precision', () => {
    const result = money(build([{ quantity: '1', unitPrice: '987654321987654.21' }]));
    expect(result.subtotal).toBe('987654321987654.21');
  });

  it('is deterministic: the same invoice always totals the same', () => {
    const invoice = build(
      [
        { quantity: '3', unitPrice: '99.99', tax: { mode: 'percent', value: '8.25' } },
        { quantity: '1.5', unitPrice: '250', tax: { mode: 'percent', value: '8.25' } },
      ],
      { discount: { mode: 'percent', value: '12.5' } },
    );
    const first = money(invoice).total;
    for (let i = 0; i < 20; i += 1) expect(money(invoice).total).toBe(first);
  });
});
