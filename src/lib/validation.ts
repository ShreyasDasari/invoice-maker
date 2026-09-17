/**
 * Validation.
 *
 * Nothing here blocks the user: an invoice with gaps is still a valid draft and
 * still downloads. These are advisory checks, surfaced after a field is left
 * (on blur) rather than while typing, plus hard limits on uploads.
 */

import { isValidDate, isBefore } from './format';
import type { Invoice } from './invoice';

export type IssueLevel = 'error' | 'warning';

export interface Issue {
  /** Dotted path, used to focus the offending field. */
  field: string;
  level: IssueLevel;
  message: string;
}

/** Deliberately permissive: enough to catch a typo, not to police addresses. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmailLike(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length === 0 || EMAIL.test(trimmed);
}

export function validateInvoice(invoice: Invoice): Issue[] {
  const issues: Issue[] = [];

  if (!invoice.invoiceNumber.trim()) {
    issues.push({
      field: 'invoiceNumber',
      level: 'error',
      message: 'Add an invoice number so this invoice can be referenced.',
    });
  }

  if (!isValidDate(invoice.issueDate)) {
    issues.push({ field: 'issueDate', level: 'error', message: 'Enter a valid issue date.' });
  }
  if (!isValidDate(invoice.dueDate)) {
    issues.push({ field: 'dueDate', level: 'error', message: 'Enter a valid due date.' });
  }
  if (
    isValidDate(invoice.issueDate) &&
    isValidDate(invoice.dueDate) &&
    isBefore(invoice.dueDate, invoice.issueDate)
  ) {
    issues.push({
      field: 'dueDate',
      level: 'warning',
      message: 'The due date is before the issue date.',
    });
  }

  if (!isEmailLike(invoice.business.email)) {
    issues.push({
      field: 'business.email',
      level: 'error',
      message: 'Check this email address — it looks incomplete.',
    });
  }
  if (!isEmailLike(invoice.customer.email)) {
    issues.push({
      field: 'customer.email',
      level: 'error',
      message: 'Check this email address — it looks incomplete.',
    });
  }

  if (!invoice.business.name.trim()) {
    issues.push({
      field: 'business.name',
      level: 'warning',
      message: 'Add your business name so the customer knows who to pay.',
    });
  }
  if (!invoice.customer.name.trim()) {
    issues.push({
      field: 'customer.name',
      level: 'warning',
      message: 'Add who this invoice is for.',
    });
  }

  const hasPricedItem = invoice.items.some(
    (item) => item.description.trim() || item.unitPrice.trim(),
  );
  if (!hasPricedItem) {
    issues.push({
      field: 'items',
      level: 'warning',
      message: 'Add at least one item.',
    });
  }

  return issues;
}

export function issueFor(issues: readonly Issue[], field: string): Issue | undefined {
  return issues.find((issue) => issue.field === field);
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.level === 'error');
}

// --- Logo uploads ----------------------------------------------------------

/** Only raster formats a PDF can embed, and only as an image. */
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_LOGO_BYTES = 4 * 1024 * 1024;
/** Uploads are downscaled to this width, which is ample at print resolution. */
export const LOGO_MAX_DIMENSION = 600;

export function validateLogoFile(file: File): string | null {
  if (!(ALLOWED_LOGO_TYPES as readonly string[]).includes(file.type)) {
    return 'Use a PNG, JPG or WebP image.';
  }
  if (file.size > MAX_LOGO_BYTES) {
    return 'That image is over 4 MB. Try a smaller one.';
  }
  return null;
}

/**
 * Decode, downscale and re-encode an upload as a PNG data URL.
 *
 * Re-encoding through a canvas is the security win here: the output is pixels
 * this browser drew, so any metadata or malformed payload in the original file
 * is discarded rather than embedded in the PDF.
 */
export async function normaliseLogo(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That file is not a readable image.'));
    img.src = dataUrl;
  });

  const scale = Math.min(1, LOGO_MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process that image.');
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/png');
}
