import { describe, expect, it } from 'vitest';
import { hasErrors, isEmailLike, issueFor, validateInvoice, validateLogoFile } from './validation';
import { createInvoice, createLineItem } from './invoice';

describe('isEmailLike', () => {
  it('accepts plausible addresses and empty input', () => {
    expect(isEmailLike('a@b.co')).toBe(true);
    expect(isEmailLike('')).toBe(true);
    expect(isEmailLike('   ')).toBe(true);
  });

  it('rejects obvious typos', () => {
    expect(isEmailLike('a@b')).toBe(false);
    expect(isEmailLike('nope')).toBe(false);
    expect(isEmailLike('a b@c.com')).toBe(false);
  });
});

describe('validateInvoice', () => {
  it('warns about a blank draft without erroring', () => {
    const issues = validateInvoice(createInvoice({ today: '2026-01-01' }));
    expect(hasErrors(issues)).toBe(false);
    expect(issueFor(issues, 'business.name')?.level).toBe('warning');
    expect(issueFor(issues, 'items')?.level).toBe('warning');
  });

  it('errors on a missing invoice number', () => {
    const invoice = { ...createInvoice({ today: '2026-01-01' }), invoiceNumber: '  ' };
    expect(issueFor(validateInvoice(invoice), 'invoiceNumber')?.level).toBe('error');
  });

  it('errors on an impossible date', () => {
    const invoice = { ...createInvoice({ today: '2026-01-01' }), dueDate: '2026-02-31' };
    expect(issueFor(validateInvoice(invoice), 'dueDate')?.level).toBe('error');
  });

  it('warns when the due date precedes the issue date', () => {
    const invoice = {
      ...createInvoice({ today: '2026-06-01' }),
      issueDate: '2026-06-01',
      dueDate: '2026-05-01',
    };
    expect(issueFor(validateInvoice(invoice), 'dueDate')?.level).toBe('warning');
  });

  it('clears the item warning once a line has content', () => {
    const invoice = {
      ...createInvoice({ today: '2026-01-01' }),
      items: [createLineItem({ description: 'Design work', unitPrice: '1200' })],
    };
    expect(issueFor(validateInvoice(invoice), 'items')).toBeUndefined();
  });
});

describe('validateLogoFile', () => {
  const file = (type: string, size: number): File =>
    ({ type, size, name: 'logo' }) as unknown as File;

  it('accepts supported image types', () => {
    expect(validateLogoFile(file('image/png', 1000))).toBeNull();
    expect(validateLogoFile(file('image/jpeg', 1000))).toBeNull();
  });

  it('rejects other types, including SVG and PDF', () => {
    expect(validateLogoFile(file('image/svg+xml', 100))).toMatch(/PNG/);
    expect(validateLogoFile(file('application/pdf', 100))).toMatch(/PNG/);
  });

  it('rejects oversized files', () => {
    expect(validateLogoFile(file('image/png', 9 * 1024 * 1024))).toMatch(/4 MB/);
  });
});
