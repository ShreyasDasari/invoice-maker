/**
 * Local persistence. Everything stays in this browser — nothing about an
 * invoice is ever sent to a server by this module.
 *
 * Reads and writes are defensive: private browsing, disabled storage and
 * corrupted values must degrade to "no saved data", never to a crash.
 */

import { type Invoice, INVOICE_SCHEMA_VERSION, createInvoice } from './invoice';
import type { BusinessParty, PaperSize, TemplateId, FontStyleId } from './invoice';
import type { DateFormatId } from './format';

const KEY = {
  draft: 'im.draft.v1',
  profile: 'im.profile.v1',
  prefs: 'im.prefs.v1',
  recent: 'im.recent.v1',
} as const;

/** How many finished invoices to keep. Bounded so storage never fills up. */
export const RECENT_LIMIT = 25;

export interface Preferences {
  currency: string;
  locale: string;
  dateStyle: DateFormatId;
  template: TemplateId;
  paperSize: PaperSize;
  accentColor: string;
  fontStyle: FontStyleId;
  /** Prefix + width remembered from the last invoice number used. */
  lastInvoiceNumber: string;
  dueInDays: number;
}

export interface RecentInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  currency: string;
  /** Exact decimal string of the total, so the list needs no recomputation. */
  total: string;
  issueDate: string;
  updatedAt: string;
  invoice: Invoice;
}

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function read<T>(key: string): T | null {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to do */
  }
}

/** True when this browser will actually retain anything. */
export function storageAvailable(): boolean {
  if (!hasStorage()) return false;
  try {
    const probe = '__im_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// --- Draft (the invoice currently being edited) ----------------------------

export function loadDraft(): Invoice | null {
  const draft = read<Invoice>(KEY.draft);
  if (!draft || typeof draft !== 'object') return null;
  return migrateInvoice(draft);
}

export function saveDraft(invoice: Invoice): void {
  write(KEY.draft, invoice);
}

export function clearDraft(): void {
  remove(KEY.draft);
}

// --- Business profile ------------------------------------------------------

export function loadProfile(): BusinessParty | null {
  const profile = read<BusinessParty>(KEY.profile);
  if (!profile || typeof profile !== 'object' || typeof profile.name !== 'string') return null;
  return profile;
}

export function saveProfile(business: BusinessParty): void {
  write(KEY.profile, business);
}

export function clearProfile(): void {
  remove(KEY.profile);
}

// --- Preferences -----------------------------------------------------------

export function loadPreferences(): Partial<Preferences> | null {
  return read<Partial<Preferences>>(KEY.prefs);
}

export function savePreferences(prefs: Partial<Preferences>): void {
  const existing = loadPreferences() ?? {};
  write(KEY.prefs, { ...existing, ...prefs });
}

// --- Recent invoices -------------------------------------------------------

export function loadRecent(): RecentInvoice[] {
  const list = read<RecentInvoice[]>(KEY.recent);
  if (!Array.isArray(list)) return [];
  return list
    .filter((entry): entry is RecentInvoice => Boolean(entry?.invoice?.id))
    .map((entry) => ({ ...entry, invoice: migrateInvoice(entry.invoice) }));
}

/**
 * Save (or replace) a recent invoice.
 *
 * Logos are stripped from the stored copy: they can be hundreds of kilobytes
 * and the same logo already lives once in the business profile, from which it
 * is restored on open. On a quota error the oldest entries are dropped and the
 * write is retried.
 */
export function saveRecent(invoice: Invoice, total: string): RecentInvoice[] {
  const entry: RecentInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customer.name,
    currency: invoice.currency,
    total,
    issueDate: invoice.issueDate,
    updatedAt: new Date().toISOString(),
    invoice: { ...invoice, business: { ...invoice.business, logo: null } },
  };

  const existing = loadRecent().filter((item) => item.id !== invoice.id);
  let next = [entry, ...existing].slice(0, RECENT_LIMIT);

  while (next.length > 0 && !write(KEY.recent, next)) {
    next = next.slice(0, Math.max(1, next.length - 5));
    if (next.length === 1) {
      // Even a single entry will not fit; give up rather than loop forever.
      write(KEY.recent, []);
      return [];
    }
  }
  return next;
}

export function deleteRecent(id: string): RecentInvoice[] {
  const next = loadRecent().filter((item) => item.id !== id);
  write(KEY.recent, next);
  return next;
}

export function clearRecent(): void {
  remove(KEY.recent);
}

/** Remove every trace of the user from this device. */
export function clearAll(): void {
  clearDraft();
  clearProfile();
  clearRecent();
  remove(KEY.prefs);
}

/**
 * Bring a stored invoice up to the current shape.
 *
 * Old records are merged over a fresh default, so a field added later is
 * present rather than undefined, and the editor never reads a missing key.
 */
export function migrateInvoice(stored: Invoice): Invoice {
  const fresh = createInvoice();
  const merged: Invoice = {
    ...fresh,
    ...stored,
    version: INVOICE_SCHEMA_VERSION,
    business: { ...fresh.business, ...(stored.business ?? {}) },
    customer: { ...fresh.customer, ...(stored.customer ?? {}) },
    branding: { ...fresh.branding, ...(stored.branding ?? {}) },
    options: { ...fresh.options, ...(stored.options ?? {}) },
    items: Array.isArray(stored.items) && stored.items.length > 0
      ? stored.items.map((item) => ({
          ...fresh.items[0]!,
          ...item,
          tax: { ...fresh.items[0]!.tax, ...(item?.tax ?? {}) },
          discount: { ...fresh.items[0]!.discount, ...(item?.discount ?? {}) },
        }))
      : fresh.items,
  };
  return merged;
}

/** Put the profile logo back on an invoice that was stored without one. */
export function restoreLogo(invoice: Invoice, profile: BusinessParty | null): Invoice {
  if (invoice.business.logo || !profile?.logo) return invoice;
  const sameBusiness =
    invoice.business.name.trim().toLowerCase() === profile.name.trim().toLowerCase();
  if (!sameBusiness) return invoice;
  return { ...invoice, business: { ...invoice.business, logo: profile.logo } };
}
