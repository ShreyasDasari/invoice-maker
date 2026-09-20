import { describe, expect, it } from 'vitest';
import zlib from 'node:zlib';
import { LOGO_MAX_HEIGHT, LOGO_MAX_WIDTH, logoBox, pngSize } from './logo';

/** Build a real PNG of a given size and colour type. */
function png(width: number, height: number, rgba = false): string {
  const table: number[] = [];
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    let crc = 0xffffffff;
    for (const b of body) crc = table[(crc ^ b) & 0xff]! ^ (crc >>> 8);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([len, body, crcBuf]);
  };
  const channels = rgba ? 4 : 3;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = rgba ? 6 : 2;
  const raw = Buffer.concat(
    Array.from({ length: height }, () =>
      Buffer.concat([Buffer.from([0]), Buffer.alloc(width * channels, 80)]),
    ),
  );
  const data = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${data.toString('base64')}`;
}

describe('pngSize', () => {
  it('reads dimensions from the header', () => {
    expect(pngSize(png(600, 200))).toEqual({ width: 600, height: 200 });
    expect(pngSize(png(64, 512))).toEqual({ width: 64, height: 512 });
  });

  it('reads RGBA images too, which is what a real logo is', () => {
    expect(pngSize(png(600, 200, true))).toEqual({ width: 600, height: 200 });
  });

  it('returns null rather than guessing on anything unreadable', () => {
    expect(pngSize('')).toBeNull();
    expect(pngSize('not-a-data-url')).toBeNull();
    expect(pngSize('data:image/png;base64,AAAA')).toBeNull();
    expect(pngSize('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD')).toBeNull();
  });
});

describe('logoBox', () => {
  it('fits a wide logo to the width', () => {
    // 600x200 at 180 wide would be 60 tall, past the 54 ceiling, so height wins.
    const box = logoBox(png(600, 200));
    expect(box!.height).toBeCloseTo(LOGO_MAX_HEIGHT, 2);
    expect(box!.width).toBeCloseTo(162, 2);
  });

  it('fits a very wide logo to the width ceiling', () => {
    const box = logoBox(png(1200, 200));
    expect(box!.width).toBeCloseTo(LOGO_MAX_WIDTH, 2);
    expect(box!.height).toBeCloseTo(30, 2);
  });

  it('fits a tall logo to the height', () => {
    const box = logoBox(png(200, 600));
    expect(box!.height).toBeCloseTo(LOGO_MAX_HEIGHT, 2);
    expect(box!.width).toBeCloseTo(18, 2);
  });

  it('never enlarges a small logo past its own pixels', () => {
    const box = logoBox(png(40, 20));
    expect(box!.width).toBeLessThanOrEqual(40);
    expect(box!.height).toBeLessThanOrEqual(20);
  });

  it('keeps the aspect ratio', () => {
    const box = logoBox(png(333, 111));
    expect(box!.width / box!.height).toBeCloseTo(3, 3);
  });

  it('returns null with no logo, so callers can fall back', () => {
    expect(logoBox(null)).toBeNull();
    expect(logoBox('nonsense')).toBeNull();
  });
});
