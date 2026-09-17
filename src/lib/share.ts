/**
 * Share links.
 *
 * The whole invoice is encoded into the URL's hash fragment. A fragment is
 * never transmitted to a server — not in the request line, not in logs, not in
 * a Referer header — so a shared invoice stays between the people holding the
 * link. No database, no invoice ids to guess, nothing to leak.
 *
 * The trade-off is link length, so the payload is deflated before encoding and
 * the logo is left out.
 */

import { type Invoice } from './invoice';
import { migrateInvoice } from './storage';

/** Hash parameter carrying the payload: `#i=...`. */
export const SHARE_PARAM = 'i';

/** Browsers refuse very long URLs; past this we tell the user to send the PDF. */
export const MAX_TOKEN_LENGTH = 16000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): Uint8Array {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
      new CompressionStream('deflate-raw'),
    );
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
      new DecompressionStream('deflate-raw'),
    );
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Strip what must not travel in a link: the logo (far too large) and the
 * local record id, so an opened copy is a new invoice rather than one that
 * silently overwrites the recipient's own.
 */
function shareable(invoice: Invoice): Omit<Invoice, 'id'> & { id: string } {
  return {
    ...invoice,
    business: { ...invoice.business, logo: null },
  };
}

export interface EncodeResult {
  token: string;
  /** True when the logo was dropped, so the UI can say so. */
  logoOmitted: boolean;
  tooLarge: boolean;
}

export async function encodeInvoice(invoice: Invoice): Promise<EncodeResult> {
  const json = JSON.stringify(shareable(invoice));
  const raw = new TextEncoder().encode(json);
  const compressed = await deflate(raw);

  // 'z' marks a deflated payload, 'j' a plain one, so decoding needs no guessing.
  const token = compressed
    ? `z${toBase64Url(compressed)}`
    : `j${toBase64Url(raw)}`;

  return {
    token,
    logoOmitted: Boolean(invoice.business.logo),
    tooLarge: token.length > MAX_TOKEN_LENGTH,
  };
}

export async function decodeInvoice(token: string): Promise<Invoice | null> {
  if (!token || token.length < 2) return null;
  const marker = token[0];
  const body = token.slice(1);

  try {
    const bytes = fromBase64Url(body);
    const json =
      marker === 'z'
        ? await inflate(bytes).then((out) => (out ? new TextDecoder().decode(out) : null))
        : new TextDecoder().decode(bytes);
    if (!json) return null;

    const parsed = JSON.parse(json) as Invoice;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) return null;
    return migrateInvoice(parsed);
  } catch {
    return null;
  }
}

/** Build the full shareable URL for an invoice. */
export async function buildShareUrl(
  invoice: Invoice,
  origin: string,
): Promise<{ url: string; logoOmitted: boolean; tooLarge: boolean }> {
  const { token, logoOmitted, tooLarge } = await encodeInvoice(invoice);
  return {
    url: `${origin.replace(/\/$/, '')}/#${SHARE_PARAM}=${token}`,
    logoOmitted,
    tooLarge,
  };
}

/** Pull the payload out of a `#i=...` fragment. */
export function tokenFromHash(hash: string): string | null {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!clean) return null;
  const params = new URLSearchParams(clean);
  return params.get(SHARE_PARAM);
}
