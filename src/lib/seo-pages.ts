/**
 * Landing pages for high-intent searches.
 *
 * Each entry is a page that answers a real question and then hands the visitor
 * the tool. They are data, not templates, so future country-, currency- or
 * industry-specific pages are additions here rather than new plumbing — but
 * only where there is genuinely something to say. A page with nothing to add
 * does not belong in this list.
 */

export interface SeoSection {
  heading: string;
  body: string;
  /** Optional list rendered under the prose. */
  points?: readonly string[];
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoPage {
  slug: string;
  /** Browser/SERP title. */
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: readonly SeoSection[];
  faqs: readonly SeoFaq[];
  /** Sitemap weighting, 0-1. */
  priority: number;
}

const FREE_ANSWER =
  'Yes. Creating an invoice and downloading the PDF are free, with no account, no trial and no watermark on the file.';

const PRIVACY_ANSWER =
  'Your invoice is built in your browser. It is not uploaded, and nothing is stored on a server. Details you choose to keep are saved on your own device.';

export const SEO_PAGES: readonly SeoPage[] = [
  {
    slug: 'invoice-maker',
    title: 'Invoice Maker — Make an Invoice Online Free',
    description:
      'Make an invoice online in under two minutes. Fill in your details, watch the preview update, download the PDF. Free, no signup, no watermark.',
    h1: 'Invoice maker',
    intro:
      'Fill in your details on the left, watch the invoice build on the right, download the PDF. No account, no watermark, nothing to install.',
    sections: [
      {
        heading: 'How to make an invoice',
        body: 'The editor opens with everything already filled in with sensible defaults, so the only work left is your own details.',
        points: [
          'Enter your business name and the customer you are billing.',
          'Add a line per item, with quantity and rate. The amount calculates itself.',
          'Set tax or a discount if they apply — as a percentage or a flat amount.',
          'Download the PDF, or print it straight from your browser.',
        ],
      },
      {
        heading: 'What belongs on an invoice',
        body: 'Most disputes come from a missing field rather than a wrong total. An invoice a customer can pay without emailing you first usually carries all of the following.',
        points: [
          'A unique invoice number, so it can be referenced in a payment.',
          'The issue date and the date payment is due.',
          'Who is billing and who is being billed, with addresses.',
          'A clear description of each item, with quantity and rate.',
          'Tax shown separately from the subtotal, with your registration number where required.',
          'The total due, in a single named currency.',
        ],
      },
      {
        heading: 'Getting paid faster',
        body: 'Payment terms set the expectation and give you something to point at when following up. "Net 7" means seven days from the issue date; the due date here fills in to match, and you can change either.',
      },
    ],
    faqs: [
      { question: 'Is this invoice maker really free?', answer: FREE_ANSWER },
      {
        question: 'Do I need to create an account?',
        answer:
          'No. The editor opens straight away. If you let it, it remembers your business details on this device so the next invoice takes seconds.',
      },
      { question: 'Where do my invoices go?', answer: PRIVACY_ANSWER },
      {
        question: 'Can I use it on my phone?',
        answer:
          'Yes. The mobile layout is built for a phone rather than shrunk from the desktop, and the PDF is identical either way.',
      },
    ],
    priority: 0.9,
  },
  {
    slug: 'free-invoice-maker',
    title: 'Free Invoice Maker — No Signup, No Watermark',
    description:
      'A genuinely free invoice maker: no account, no trial, no watermark and no limit on how many invoices you create. Download a professional PDF instantly.',
    h1: 'Free invoice maker',
    intro:
      'Free means free here: no account, no trial that expires, no watermark on the PDF and no cap on how many invoices you make.',
    sections: [
      {
        heading: 'What "free" usually hides',
        body: 'Invoice tools tend to be free until the moment you want the file. It is worth knowing what to check before you have typed in an hour of work.',
        points: [
          'A watermark or a logo added to the PDF you send a client.',
          'A cap of three or five invoices before a paywall.',
          'An email address demanded before the download button works.',
          'A "free trial" that needs a card up front.',
        ],
      },
      {
        heading: 'How this stays free',
        body: 'The invoice is assembled in your browser. There is no per-invoice server cost to recover, no database of customer records to hold, and so no reason to put the download behind a payment.',
      },
      {
        heading: 'Good enough to send to a large client',
        body: 'Free should not mean it looks free. The three templates are plain, well-aligned documents that print cleanly in black and white and read correctly in any accounting system — the same document you would expect from an established supplier.',
      },
    ],
    faqs: [
      { question: 'Is there a watermark on the PDF?', answer: 'No. The PDF contains your invoice and nothing else.' },
      {
        question: 'How many invoices can I create?',
        answer: 'As many as you like. There is no counter and no limit.',
      },
      { question: 'Will you ask for a card?', answer: 'No. There is nothing to buy.' },
      { question: 'Is my customer data safe?', answer: PRIVACY_ANSWER },
    ],
    priority: 0.8,
  },
  {
    slug: 'invoice-generator',
    title: 'Invoice Generator — Instant PDF Invoices',
    description:
      'An invoice generator that calculates totals, tax and discounts exactly and hands you a print-ready PDF. Multi-currency, three templates, free.',
    h1: 'Invoice generator',
    intro:
      'Type the numbers once. Subtotals, tax, discounts and the amount due are calculated as you go, and the PDF matches what you see.',
    sections: [
      {
        heading: 'Totals you can trust',
        body: 'Money here is handled as exact decimals, not as floating-point numbers, which is where invoice tools quietly go wrong by a cent. An invoice-level discount is spread across lines so the parts still add up to the whole, and each currency rounds to its own precision — two places for dollars, none for yen, three for dinar.',
      },
      {
        heading: 'Tax the way you actually charge it',
        body: 'Tax can be a percentage or a flat amount, applied once across the invoice or per line when your items are taxed differently. Rates that match are grouped into a single labelled row, so VAT and GST appear as a customer expects to see them.',
      },
      {
        heading: 'Multi-currency',
        body: 'Pick from the currencies businesses actually invoice in. The symbol, grouping and decimal precision follow the currency, so an invoice in rupees or yen reads correctly to the person receiving it.',
      },
    ],
    faqs: [
      {
        question: 'Can I add tax per line item?',
        answer:
          'Yes. There is one shared rate by default; turn on per-item tax and each line gets its own, which is grouped by rate in the totals.',
      },
      {
        question: 'Does it handle discounts?',
        answer:
          'Both kinds: a discount on a single line, and one on the whole invoice. Either can be a percentage or a fixed amount.',
      },
      {
        question: 'Is the PDF text selectable?',
        answer:
          'Yes. The PDF is real text, not a screenshot, so it can be searched, copied and read by accounting software.',
      },
      { question: 'Is it free?', answer: FREE_ANSWER },
    ],
    priority: 0.8,
  },
  {
    slug: 'invoice-template',
    title: 'Invoice Template — Free, Fill In and Download',
    description:
      'Three professional invoice templates you fill in online and download as a PDF. Nothing to download first, no spreadsheet formulas to fix.',
    h1: 'Invoice template',
    intro:
      'A template you fill in here, rather than a file you download and fight with. Pick a layout, type your details, take the PDF.',
    sections: [
      {
        heading: 'Three templates, chosen on purpose',
        body: 'Fifty mediocre templates help nobody. These three cover what invoices actually need to look like, and all of them print correctly in black and white.',
        points: [
          'Classic — a ruled table with clear labels, the layout accounting departments expect.',
          'Modern — an accent band across the header and a boxed total, for client-facing work.',
          'Minimal — hairline rules and plenty of whitespace, when the work should speak first.',
        ],
      },
      {
        heading: 'Better than a spreadsheet template',
        body: 'A downloaded spreadsheet means broken formulas, a font you do not have, and an export step that moves everything a few millimetres. Here the totals are computed for you and the PDF is the document itself.',
      },
      {
        heading: 'Your own logo and colour',
        body: 'Add a logo, pick one accent colour and choose a typeface. That is the whole of the customisation on purpose: enough to look like your business, not so much that you end up designing instead of invoicing.',
      },
    ],
    faqs: [
      { question: 'Which template should I use?', answer: 'Classic if the invoice goes to a finance team, Modern for direct clients, Minimal when you want it quiet. All three carry the same information.' },
      { question: 'Can I add my logo?', answer: 'Yes. A PNG, JPG or WebP is resized in your browser and embedded in the PDF.' },
      { question: 'Can I print it?', answer: 'Yes. Printing gives you the invoice alone on A4 or Letter, with no page furniture around it.' },
      { question: 'Do I pay for the templates?', answer: FREE_ANSWER },
    ],
    priority: 0.7,
  },
];

export function getSeoPage(slug: string): SeoPage | undefined {
  return SEO_PAGES.find((page) => page.slug === slug);
}

export const SEO_SLUGS: readonly string[] = SEO_PAGES.map((page) => page.slug);
