import { describe, expect, it } from 'vitest';
import * as ReactPdf from '@react-pdf/renderer';
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { existsSync } from 'node:fs';
import { FONT_CHOICES, getFont, resolveWeight } from './fonts';
import { registerPdfFonts } from './pdf-fonts';

/**
 * The font registry has to agree with reality in two ways, and both are easy to
 * break without noticing:
 *
 *  - every file it names must actually ship, or the PDF silently falls back to
 *    a default face;
 *  - each `leading` value must match the line height the renderer really gives
 *    that face, because the preview uses the same number as its CSS
 *    line-height. If they drift, a one-page preview arrives as a two-page PDF.
 */

registerPdfFonts(ReactPdf);

async function measureLeading(family: string, fontSize: number): Promise<number> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const buffer = await renderToBuffer(
    <Document>
      <Page size="A4" style={{ padding: 42, fontFamily: family, fontSize }}>
        <View>
          <Text>Line one</Text>
          <Text>Line two</Text>
          <Text>Line three</Text>
        </View>
      </Page>
    </Document>,
  );
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const content = await (await doc.getPage(1)).getTextContent();
  const ys = [
    ...new Set(
      content.items
        .filter((item) => ('str' in item ? item.str.trim() : false))
        .map((item) => ('transform' in item ? Math.round(item.transform[5]! * 100) / 100 : 0)),
    ),
  ];
  return (ys[0]! - ys[1]!) / fontSize;
}

describe('font registry', () => {
  it('ships every file it declares', () => {
    for (const font of FONT_CHOICES) {
      for (const file of font.files) {
        expect(existsSync(`public/fonts/${file.file}`), `${file.file} must exist`).toBe(true);
      }
    }
  });

  it('points each CSS stack at the same face the PDF embeds', () => {
    for (const font of FONT_CHOICES) {
      if (font.family === 'Inter') {
        // Resolved through next/font's generated family, which is the same
        // typeface rather than a second copy of it.
        expect(font.css, 'sans stack').toContain('--font-inter');
      } else {
        // Declared as @font-face in globals.css, loaded only when chosen.
        expect(font.css, `${font.id} stack`).toContain(font.family);
      }
    }
  });

  it('declares a leading that matches what the renderer produces', async () => {
    for (const font of FONT_CHOICES) {
      const measured = await measureLeading(font.family, 9.5);
      expect(
        Math.abs(measured - font.leading),
        `${font.family}: declared ${font.leading}, renderer gives ${measured.toFixed(3)}`,
      ).toBeLessThan(0.01);
    }
  });

  it('is proportional, so one ratio is valid at every size', async () => {
    const font = getFont('sans');
    const small = await measureLeading(font.family, 8);
    const large = await measureLeading(font.family, 24);
    expect(Math.abs(small - large)).toBeLessThan(0.01);
  });

  it('falls back to a weight that actually ships', () => {
    expect(resolveWeight(getFont('sans'), 600)).toBe(600);
    // Serif and mono ship 400 and 700 only.
    expect(resolveWeight(getFont('serif'), 600)).toBe(700);
    expect(resolveWeight(getFont('mono'), 600)).toBe(700);
    expect(resolveWeight(getFont('mono'), 400)).toBe(400);
  });
});
