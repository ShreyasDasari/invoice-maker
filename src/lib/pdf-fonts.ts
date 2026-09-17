/**
 * Registers the shipped font files with react-pdf.
 *
 * Called once before the first render. Font sources resolve differently by
 * environment: in the browser they are served from /fonts, while in Node (the
 * PDF tests) react-pdf reads them straight off disk, so the same registry
 * drives both.
 */

import { FONT_CHOICES, fontUrl } from './fonts';

let registered = false;

type FontModule = {
  Font: {
    register: (options: {
      family: string;
      fonts: { src: string; fontWeight: number }[];
    }) => void;
    registerHyphenationCallback: (callback: (word: string) => string[]) => void;
  };
};

export function registerPdfFonts(pdfModule: FontModule): void {
  if (registered) return;

  const isNode =
    typeof process !== 'undefined' && !!process.versions?.node && typeof window === 'undefined';

  for (const font of FONT_CHOICES) {
    pdfModule.Font.register({
      family: font.family,
      fonts: font.files.map((file) => ({
        src: isNode ? `${process.cwd()}/public/fonts/${file.file}` : fontUrl(file.file),
        fontWeight: file.weight,
      })),
    });
  }

  /**
   * Turn off hyphenation.
   *
   * react-pdf hyphenates by default, which breaks product descriptions across
   * lines with a hyphen that was never in the text. An invoice line should wrap
   * at a space or not at all.
   */
  pdfModule.Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
