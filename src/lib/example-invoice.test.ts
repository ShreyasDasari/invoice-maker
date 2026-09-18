import { describe, expect, it } from 'vitest';
import { createExampleInvoice } from './example-invoice';
import { computeTotals } from './calc';
import { toFixed } from './money';
import { TEMPLATE_IDS } from './invoice';

/**
 * The example is what a visitor judges the product by, so it has to be a
 * correct invoice — not merely plausible-looking filler.
 */
describe('example invoice', () => {
  it('totals correctly', () => {
    const totals = computeTotals(createExampleInvoice());
    // 3800 + 1440 + 1300 + 630 = 7170
    expect(toFixed(totals.subtotal, 2)).toBe('7170.00');
    // 5% of 7170
    expect(toFixed(totals.invoiceDiscount, 2)).toBe('358.50');
    expect(toFixed(totals.taxableBase, 2)).toBe('6811.50');
    // 20% VAT on the discounted base
    expect(toFixed(totals.taxTotal, 2)).toBe('1362.30');
    expect(toFixed(totals.total, 2)).toBe('8173.80');
    expect(toFixed(totals.amountDue, 2)).toBe('6673.80');
  });

  it('shows a single grouped VAT row', () => {
    const totals = computeTotals(createExampleInvoice());
    expect(totals.taxGroups).toHaveLength(1);
    expect(totals.taxGroups[0]?.label).toBe('VAT');
  });

  it('is complete enough to show every part of the layout', () => {
    const invoice = createExampleInvoice();
    expect(invoice.business.name).not.toBe('');
    expect(invoice.business.taxId).not.toBe('');
    expect(invoice.customer.address).toContain('\n');
    expect(invoice.items.length).toBeGreaterThanOrEqual(4);
    expect(invoice.notes).not.toBe('');
    expect(invoice.terms).not.toBe('');
    expect(invoice.poNumber).not.toBe('');
  });

  it('is deterministic, so previews never differ between renders or builds', () => {
    const a = createExampleInvoice('modern');
    const b = createExampleInvoice('modern');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('builds for every template', () => {
    for (const template of TEMPLATE_IDS) {
      expect(createExampleInvoice(template).template).toBe(template);
    }
  });

  it('includes a fractional quantity, so the example proves they are supported', () => {
    expect(createExampleInvoice().items.some((item) => item.quantity.includes('.'))).toBe(true);
  });
});
