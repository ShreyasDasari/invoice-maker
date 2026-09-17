import { describe, expect, it } from 'vitest';
import { pdfFilename } from './useInvoiceActions';
import { createInvoice } from '@/lib/invoice';

function withNames(invoiceNumber: string, customerName: string) {
  const base = createInvoice({ today: '2026-01-01' });
  return { ...base, invoiceNumber, customer: { ...base.customer, customerName, name: customerName } };
}

describe('pdfFilename', () => {
  it('combines the number and customer', () => {
    expect(pdfFilename(withNames('INV-0001', 'Acme Inc'))).toBe('INV-0001-Acme-Inc.pdf');
  });

  it('strips characters that are illegal in filenames', () => {
    expect(pdfFilename(withNames('INV/0001', 'A:B*C?"<>|'))).toBe('INV0001-ABC.pdf');
  });

  it('falls back when everything is stripped', () => {
    expect(pdfFilename(withNames('', ''))).toBe('invoice.pdf');
    expect(pdfFilename(withNames('///', '***'))).toBe('invoice.pdf');
  });

  it('caps the length', () => {
    const name = pdfFilename(withNames('INV-0001', 'x'.repeat(200)));
    expect(name.length).toBeLessThanOrEqual(84);
  });

  it('collapses whitespace runs into single hyphens', () => {
    expect(pdfFilename(withNames('INV 0001', 'Big    Client'))).toBe('INV-0001-Big-Client.pdf');
  });
});
