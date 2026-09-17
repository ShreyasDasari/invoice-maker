import { beforeAll, describe, expect, it } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument } from './InvoiceDocument';
import { computeTotals } from '@/lib/calc';
import {
  createInvoice,
  createLineItem,
  type Invoice,
  type LineItem,
  type TemplateId,
} from '@/lib/invoice';
import { MIN_FIT_SCALE } from '@/lib/templates';

/**
 * PDF verification.
 *
 * The renderer is exercised in Node exactly as the browser runs it, and the
 * resulting bytes are read back with pdf.js. That makes these real assertions
 * about the delivered file — its page count, and that its text is text rather
 * than a picture of text — instead of assertions about our own components.
 */

// pdf.js ships as an ES module with a worker; in Node the worker is disabled.
type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let pdfjs: PdfJs;

beforeAll(async () => {
  pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
});

interface Extracted {
  pageCount: number;
  /** All text on the page, in reading order, space-joined. */
  pages: string[];
  text: string;
  bytes: number;
  /** PostScript names of the faces actually embedded in the file. */
  fontNames: string;
}

async function renderAndRead(invoice: Invoice, fitScale = 1): Promise<Extracted> {
  const totals = computeTotals(invoice);
  const buffer = await renderToBuffer(
    <InvoiceDocument
      invoice={invoice}
      totals={totals}
      locale="en-US"
      dateStyle="iso"
      fitScale={fitScale}
    />,
  );

  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    );
  }

  // Font names live in the FontDescriptor, which is plain text in the file.
  const fontNames = buffer.toString('latin1').match(/\/BaseFont\s*\/[A-Za-z0-9+\-_,]+/g)?.join(' ') ?? '';

  return {
    pageCount: doc.numPages,
    pages,
    text: pages.join('\n'),
    bytes: buffer.length,
    fontNames,
  };
}

function build(items: Partial<LineItem>[], overrides: Partial<Invoice> = {}): Invoice {
  const base = createInvoice({ today: '2026-03-09' });
  return {
    ...base,
    ...overrides,
    business: { ...base.business, name: 'Northwind Studio', ...(overrides.business ?? {}) },
    customer: { ...base.customer, name: 'Acme Corporation', ...(overrides.customer ?? {}) },
    items: items.map((item) => createLineItem(item)),
    options: { ...base.options, ...(overrides.options ?? {}) },
  };
}

const ONE_ITEM: Partial<LineItem>[] = [
  { description: 'Brand identity design', quantity: '1', unitPrice: '4800' },
];

describe('PDF output', () => {
  it('produces selectable text, not an image of the invoice', async () => {
    const { text, pageCount } = await renderAndRead(build(ONE_ITEM));

    expect(pageCount).toBe(1);
    // Every one of these came back out of the PDF's own text layer.
    expect(text).toContain('Northwind Studio');
    expect(text).toContain('Acme Corporation');
    expect(text).toContain('Brand identity design');
    expect(text).toContain('INV-0001');
    expect(text).toContain('2026-03-09');
    expect(text).toContain('$4,800.00');
  });

  it('stays on one page for a short invoice', async () => {
    const { pageCount } = await renderAndRead(
      build([...ONE_ITEM, { description: 'Print setup', quantity: '2', unitPrice: '150' }]),
    );
    expect(pageCount).toBe(1);
  });

  it('flows onto further pages as lines are added', async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      description: `Consulting session ${i + 1}`,
      quantity: '1',
      unitPrice: '250',
    }));
    const { pageCount, text } = await renderAndRead(build(many));

    expect(pageCount).toBeGreaterThan(1);
    // Totals still arrive, at the end, after all the lines.
    expect(text).toContain('Consulting session 60');
    expect(text).toContain('TOTAL DUE');
  });

  it('repeats the table header on every page', async () => {
    const many = Array.from({ length: 80 }, (_, i) => ({
      description: `Line item ${i + 1}`,
      quantity: '1',
      unitPrice: '99.99',
    }));
    const { pages, pageCount } = await renderAndRead(build(many));

    expect(pageCount).toBeGreaterThan(1);
    for (const [index, page] of pages.entries()) {
      expect(page, `page ${index + 1} should carry the column headers`).toContain('DESCRIPTION');
      expect(page, `page ${index + 1} should carry the amount column`).toContain('AMOUNT');
    }
  });

  it('numbers the pages only when there is more than one', async () => {
    const single = await renderAndRead(build(ONE_ITEM));
    expect(single.text).not.toContain('Page 1 of');

    const many = Array.from({ length: 70 }, (_, i) => ({
      description: `Item ${i + 1}`,
      quantity: '1',
      unitPrice: '10',
    }));
    const multi = await renderAndRead(build(many));
    expect(multi.text).toContain('Page 1 of');
    expect(multi.text).toContain(`Page ${multi.pageCount} of ${multi.pageCount}`);
  });

  it('keeps the totals block together rather than splitting it', async () => {
    // A line count tuned to land the totals near a page boundary.
    const many = Array.from({ length: 34 }, (_, i) => ({
      description: `Service ${i + 1}`,
      quantity: '1',
      unitPrice: '120',
    }));
    const { pages } = await renderAndRead(
      build(many, { options: { showPaid: true } as Invoice['options'], amountPaid: '1000' }),
    );

    // Subtotal, Paid and Amount due must all appear on the same page.
    const pageWithTotals = pages.findIndex((page) => page.includes('Subtotal'));
    expect(pageWithTotals).toBeGreaterThanOrEqual(0);
    expect(pages[pageWithTotals]).toContain('AMOUNT DUE');
    expect(pages[pageWithTotals]).toContain('Paid');
  });

  it('renders all three templates', async () => {
    for (const template of ['classic', 'modern', 'minimal'] as TemplateId[]) {
      const { text, pageCount, bytes } = await renderAndRead(build(ONE_ITEM, { template }));
      expect(pageCount, `${template} page count`).toBe(1);
      expect(text, `${template} business name`).toContain('Northwind Studio');
      expect(text, `${template} total`).toContain('4,800.00');
      // A plausible file size: not an empty document, not a bloated one.
      expect(bytes, `${template} size`).toBeGreaterThan(1000);
      expect(bytes, `${template} size`).toBeLessThan(400_000);
    }
  });

  it('renders both paper sizes', async () => {
    for (const paperSize of ['a4', 'letter'] as const) {
      const { pageCount, text } = await renderAndRead(build(ONE_ITEM, { paperSize }));
      expect(pageCount).toBe(1);
      expect(text).toContain('Northwind Studio');
    }
  });

  it('embeds the font the user chose, rather than a substitute', async () => {
    const expected: Record<string, string> = {
      sans: 'Inter',
      serif: 'SourceSerif',
      mono: 'JetBrainsMono',
    };

    for (const fontStyle of ['sans', 'serif', 'mono'] as const) {
      const base = createInvoice({ today: '2026-03-09' });
      const { text, fontNames } = await renderAndRead(
        build(ONE_ITEM, { branding: { ...base.branding, fontStyle } }),
      );
      expect(text, `${fontStyle} text extraction`).toContain('Brand identity design');
      expect(fontNames, `${fontStyle} should embed ${expected[fontStyle]}`).toContain(
        expected[fontStyle]!,
      );
      // The standard-14 fallbacks must not appear: their presence would mean
      // the chosen face failed to load and the renderer substituted one.
      expect(fontNames, `${fontStyle} must not fall back`).not.toMatch(
        /Helvetica|Times-Roman|Courier(?!New)/,
      );
    }
  });

  it('survives a very long description without losing the amount', async () => {
    const { text } = await renderAndRead(
      build([
        {
          description:
            'Complete brand identity programme including discovery workshops, competitor audit, three rounds of logo exploration, typography selection, colour system, and a written set of usage guidelines delivered as a PDF, plus https://example.com/a/very/long/link/with/no/spaces/at/all/that/must/wrap',
          quantity: '1',
          unitPrice: '12500',
        },
      ]),
    );
    expect(text).toContain('12,500.00');
    expect(text).toContain('Complete brand identity programme');
  });

  it('renders an invoice with no items at all', async () => {
    const { pageCount, text } = await renderAndRead(build([{}]));
    expect(pageCount).toBe(1);
    expect(text).toContain('$0.00');
  });

  it('carries tax, discount, shipping and part payment through to the file', async () => {
    const { text } = await renderAndRead(
      build(
        [
          {
            description: 'Retainer',
            quantity: '2',
            unitPrice: '1000',
            tax: { mode: 'percent', value: '8.5', label: 'VAT' },
            discount: { mode: 'percent', value: '10' },
          },
        ],
        {
          discount: { mode: 'fixed', value: '100' },
          shipping: '45',
          fees: '15',
          feesLabel: 'Processing',
          amountPaid: '500',
          options: {
            perItemTax: true,
            perItemDiscount: true,
            showShipping: true,
            showFees: true,
            showPaid: true,
            fitToPage: false,
          },
        },
      ),
    );

    expect(text).toContain('VAT');
    expect(text).toContain('Shipping');
    expect(text).toContain('Processing');
    expect(text).toContain('Paid');
    expect(text).toContain('AMOUNT DUE');
  });

  it('formats a zero-decimal currency correctly in the file', async () => {
    const { text } = await renderAndRead(
      build([{ description: 'Workshop', quantity: '1', unitPrice: '150000' }], {
        currency: 'JPY',
      }),
    );
    expect(text).toContain('150,000');
    expect(text).not.toContain('150,000.00');
  });

  it('keeps a realistic single-invoice job on one page', async () => {
    // Modelled on a real reported invoice: full addresses on both sides, tax
    // IDs, three line items, every total row, notes and terms. This spilled
    // onto a second page when the renderer was given an inflated line height.
    const base = createInvoice({ today: '2026-09-17' });
    const invoice: Invoice = {
      ...base,
      invoiceNumber: 'INV-1989898',
      poNumber: 'PO-988988',
      business: {
        ...base.business,
        name: 'PTC Inc.',
        address: '2103 Seaport Ave,\nBoston, MA\n02119',
        email: 'sdasari@ptc.com',
        phone: '+17980989800',
        website: 'ptc.com',
        taxId: '68799889',
      },
      customer: {
        ...base.customer,
        name: 'Abhishek Lonkar',
        address: 'Kumbh puja, Gangapur road,\nNashik-83898, India',
        email: 'abhishek0099@gmail.com',
        phone: '+91 9879898989',
        taxId: '768998909',
      },
      items: [
        createLineItem({ description: 'Tshirt jujutsu kaisen', quantity: '1', unitPrice: '10', tax: { mode: 'percent', value: '18' } }),
        createLineItem({ description: 'Tshirt Naruto', quantity: '2', unitPrice: '25', tax: { mode: 'percent', value: '18' }, discount: { mode: 'percent', value: '50' } }),
        createLineItem({ description: 'Tshirt Dragon Ball Z', quantity: '4', unitPrice: '20', tax: { mode: 'percent', value: '18' } }),
      ],
      discount: { mode: 'percent', value: '10' },
      shipping: '15',
      fees: '10',
      feesLabel: 'Handling Fees',
      amountPaid: '50',
      notes: 'Thank you!',
      terms: 'Late payments are subject to 2% extra charge.',
      options: {
        perItemTax: true,
        perItemDiscount: true,
        showShipping: true,
        showFees: true,
        showPaid: true,
        fitToPage: false,
      },
    };

    const { pageCount, text } = await renderAndRead(invoice);
    expect(pageCount, 'a three-item invoice must not need two pages').toBe(1);
    expect(text).toContain('AMOUNT DUE');
    expect(text).toContain('Late payments are subject to 2% extra charge.');
  });

  it('fits a long invoice onto one page when asked', async () => {
    const many = Array.from({ length: 34 }, (_, i) =>
      createLineItem({ description: `Consulting session ${i + 1}`, quantity: '1', unitPrice: '250' }),
    );
    const base = createInvoice({ today: '2026-03-09' });
    const spilling: Invoice = {
      ...base,
      business: { ...base.business, name: 'Northwind Studio' },
      customer: { ...base.customer, name: 'Acme Corporation' },
      items: many,
    };

    const before = await renderAndRead(spilling);
    expect(before.pageCount, 'this invoice should need more than one page').toBeGreaterThan(1);

    // The scale the preview measures for this content.
    const after = await renderAndRead(
      { ...spilling, options: { ...spilling.options, fitToPage: true } },
      0.62,
    );
    expect(after.pageCount, 'fit to one page must produce exactly one page').toBe(1);
    // Nothing is dropped to make it fit.
    expect(after.text).toContain('Consulting session 34');
    expect(after.text).toContain('TOTAL DUE');
  });

  it('keeps text extractable even at the smallest fit scale', async () => {
    // Tracking is proportional to font size precisely so that shrinking the
    // document cannot push it past the threshold where a PDF reader emits one
    // glyph at a time. This is that guarantee, at the smallest scale allowed.
    const { text } = await renderAndRead(
      build(ONE_ITEM, { options: { fitToPage: true } as Invoice['options'] }),
      MIN_FIT_SCALE,
    );
    expect(text).toContain('DESCRIPTION');
    expect(text).toContain('AMOUNT');
    expect(text).toContain('TOTAL DUE');
    expect(text).not.toContain('D E S C R I P T I O N');
  });

  it('leaves an invoice alone when it already fits', async () => {
    const { pageCount } = await renderAndRead(
      build(ONE_ITEM, { options: { fitToPage: true } as Invoice['options'] }),
      1,
    );
    expect(pageCount).toBe(1);
  });

  it('embeds an uploaded logo', async () => {
    // A real 16x16 PNG, so this exercises the actual image-embedding path.
    const png = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR42mNQTX5NEmIY1TCqYfhqAAB2SXMQ7LkbdQAAAABJRU5ErkJggg==`;
    const base = createInvoice({ today: '2026-03-09' });
    const invoice = build(ONE_ITEM, { business: { ...base.business, name: 'Logo Co', logo: png } });
    const { pageCount, text } = await renderAndRead(invoice);
    expect(pageCount).toBe(1);
    expect(text).toContain('Logo Co');
  });
});
