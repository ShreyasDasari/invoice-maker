/**
 * Logo geometry.
 *
 * Both renderers size the logo from its real pixel dimensions rather than
 * leaving it to intrinsic image layout, because those two engines do not agree.
 * Given only max width and height, react-pdf lays the image box out at the full
 * maximum width and then `objectFit: contain` centres the picture inside it —
 * so a logo narrower than the maximum drifts right of the business name, by
 * half the slack. The browser shrinks the element to the picture instead, and
 * the download stops matching the preview.
 *
 * Computing an explicit width and height removes the ambiguity: there is no
 * spare room in the box, so there is nothing to centre.
 */

/** The printed envelope for a logo, in points. */
export const LOGO_MAX_WIDTH = 180;
export const LOGO_MAX_HEIGHT = 54;

export interface Size {
  width: number;
  height: number;
}

/** Decode just the leading bytes of a base64 payload. */
function decodeHead(base64: string, byteCount: number): Uint8Array | null {
  const chars = Math.ceil(byteCount / 3) * 4;
  const head = base64.slice(0, chars);
  if (head.length < 4) return null;
  try {
    // `atob` exists in browsers and in Node 16+, so one path covers both.
    const binary = atob(head);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/**
 * Read a PNG's pixel dimensions from its header.
 *
 * Uploads are normalised to PNG by the uploader, so this covers every logo the
 * app produces, including ones already saved in a browser.
 */
export function pngSize(dataUrl: string): Size | null {
  const marker = ';base64,';
  const index = dataUrl.indexOf(marker);
  if (index < 0) return null;

  const bytes = decodeHead(dataUrl.slice(index + marker.length), 24);
  if (!bytes || bytes.length < 24) return null;

  // 8-byte signature, then a chunk length, then "IHDR", then width and height.
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < signature.length; i += 1) {
    if (bytes[i] !== signature[i]) return null;
  }
  if (String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!) !== 'IHDR') return null;

  const read = (offset: number) =>
    ((bytes[offset]! << 24) | (bytes[offset + 1]! << 16) | (bytes[offset + 2]! << 8) | bytes[offset + 3]!) >>> 0;

  const width = read(16);
  const height = read(20);
  if (width <= 0 || height <= 0) return null;
  return { width, height };
}

/**
 * The exact box a logo should occupy, in points.
 *
 * Scaled to fit the envelope and never enlarged past its own pixels. Returns
 * null when the dimensions cannot be read, and callers fall back to letting the
 * renderer size it.
 */
export function logoBox(
  dataUrl: string | null,
  maxWidth = LOGO_MAX_WIDTH,
  maxHeight = LOGO_MAX_HEIGHT,
): Size | null {
  if (!dataUrl) return null;
  const natural = pngSize(dataUrl);
  if (!natural) return null;

  // Capped at 1: a small file is placed at its own size rather than enlarged
  // into a blurry one.
  const scale = Math.min(maxWidth / natural.width, maxHeight / natural.height, 1);
  return {
    width: Math.round(natural.width * scale * 100) / 100,
    height: Math.round(natural.height * scale * 100) / 100,
  };
}
