/**
 * The invoice domain model.
 *
 * Amounts are stored as the raw strings the user typed, not numbers. This keeps
 * the model lossless while editing ("12." stays "12."), keeps it trivially
 * JSON-serialisable for localStorage and share links, and leaves all monetary
 * maths to `calc.ts`, which parses into exact decimals. The `version` field
 * lets stored invoices migrate as the shape evolves.
 */

import { DEFAULT_CURRENCY } from './currency';

export const INVOICE_SCHEMA_VERSION = 1;

export type AdjustmentMode = 'percent' | 'fixed';

/** A tax or discount: either a percentage or a flat amount. */
export interface Adjustment {
  mode: AdjustmentMode;
  /** Raw user input. Empty string means "not set". */
  value: string;
  /** Optional display label, e.g. "VAT", "GST". */
  label?: string;
}

export interface BusinessParty {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  /** Tax / VAT / GST registration number. */
  taxId: string;
  /** What to call that number on the invoice, e.g. "VAT No." */
  taxIdLabel: string;
  /** Data URL of an uploaded logo, normalised to PNG. */
  logo: string | null;
}

export interface CustomerParty {
  name: string;
  address: string;
  shippingAddress: string;
  email: string;
  phone: string;
  taxId: string;
  taxIdLabel: string;
}

export interface LineItem {
  id: string;
  description: string;
  /** Raw input; may be fractional, e.g. "1.5" hours. */
  quantity: string;
  unitPrice: string;
  tax: Adjustment;
  discount: Adjustment;
}

export type TemplateId = 'classic' | 'modern' | 'minimal';
export type FontStyleId = 'sans' | 'serif' | 'mono';
export type PaperSize = 'a4' | 'letter';

export interface Branding {
  /** Single accent colour as a hex string. */
  accentColor: string;
  fontStyle: FontStyleId;
}

export interface Invoice {
  id: string;
  version: number;

  invoiceNumber: string;
  poNumber: string;
  /** ISO calendar date, YYYY-MM-DD. */
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;

  business: BusinessParty;
  customer: CustomerParty;
  items: LineItem[];

  /** Invoice-level discount, allocated across items before tax. */
  discount: Adjustment;
  shipping: string;
  fees: string;
  feesLabel: string;
  amountPaid: string;

  notes: string;
  terms: string;

  template: TemplateId;
  paperSize: PaperSize;
  branding: Branding;

  /** UI affordances that also affect what the finished invoice shows. */
  options: {
    /** Show a tax control on every line instead of one shared rate. */
    perItemTax: boolean;
    /** Show a discount control on every line. */
    perItemDiscount: boolean;
    showShipping: boolean;
    showFees: boolean;
    showPaid: boolean;
  };

  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_ACCENT = '#2563EB';

export const TEMPLATE_IDS: readonly TemplateId[] = ['classic', 'modern', 'minimal'];

/** Random id that works in every browser and on the server. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Today in the user's own timezone, as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add whole days to a YYYY-MM-DD date, staying in calendar space (DST-safe). */
export function addDaysISO(iso: string, days: number): string {
  const parts = iso.split('-').map((p) => Number.parseInt(p, 10));
  const [y, m, d] = [parts[0] ?? 1970, parts[1] ?? 1, parts[2] ?? 1];
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const yy = base.getUTCFullYear();
  const mm = `${base.getUTCMonth() + 1}`.padStart(2, '0');
  const dd = `${base.getUTCDate()}`.padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function emptyAdjustment(mode: AdjustmentMode = 'percent'): Adjustment {
  return { mode, value: '' };
}

export function createLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: createId(),
    description: '',
    quantity: '1',
    unitPrice: '',
    tax: emptyAdjustment('percent'),
    discount: emptyAdjustment('percent'),
    ...overrides,
  };
}

export function emptyBusiness(): BusinessParty {
  return {
    name: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    taxIdLabel: 'Tax ID',
    logo: null,
  };
}

export function emptyCustomer(): CustomerParty {
  return {
    name: '',
    address: '',
    shippingAddress: '',
    email: '',
    phone: '',
    taxId: '',
    taxIdLabel: 'Tax ID',
  };
}

/**
 * A fresh invoice with the defaults a first-time user should see:
 * today's issue date, due in 7 days, one empty line, INV-0001.
 */
export function createInvoice(options: {
  invoiceNumber?: string;
  currency?: string;
  today?: string;
  dueInDays?: number;
} = {}): Invoice {
  const today = options.today ?? todayISO();
  const now = new Date().toISOString();
  return {
    id: createId(),
    version: INVOICE_SCHEMA_VERSION,
    invoiceNumber: options.invoiceNumber ?? 'INV-0001',
    poNumber: '',
    issueDate: today,
    dueDate: addDaysISO(today, options.dueInDays ?? 7),
    currency: options.currency ?? DEFAULT_CURRENCY,
    paymentTerms: 'Net 7',
    business: emptyBusiness(),
    customer: emptyCustomer(),
    items: [createLineItem()],
    discount: emptyAdjustment('percent'),
    shipping: '',
    fees: '',
    feesLabel: 'Fees',
    amountPaid: '',
    notes: '',
    terms: '',
    template: 'classic',
    paperSize: 'a4',
    branding: { accentColor: DEFAULT_ACCENT, fontStyle: 'sans' },
    options: {
      perItemTax: false,
      perItemDiscount: false,
      showShipping: false,
      showFees: false,
      showPaid: false,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Placeholder text shown in empty fields so the preview reads as a real invoice. */
export const PLACEHOLDERS = {
  businessName: 'Your Business',
  businessAddress: '123 Street\nCity, State 00000',
  customerName: 'Customer Name',
  customerAddress: 'Client address',
  itemDescription: 'Service or product',
} as const;

/** True when the user has entered nothing meaningful yet. */
export function isInvoiceEmpty(invoice: Invoice): boolean {
  const hasParty = Boolean(invoice.business.name.trim() || invoice.customer.name.trim());
  const hasItem = invoice.items.some(
    (item) => item.description.trim() || item.unitPrice.trim(),
  );
  return !hasParty && !hasItem;
}

/** A short human label for lists: "INV-0001 · Acme Inc". */
export function invoiceLabel(invoice: Invoice): string {
  const who = invoice.customer.name.trim();
  return who ? `${invoice.invoiceNumber} · ${who}` : invoice.invoiceNumber;
}
