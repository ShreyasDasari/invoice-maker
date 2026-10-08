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
  /** Where the call to action opens. Defaults to the editor with no presets. */
  ctaHref?: string;
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
    slug: 'create-invoice-online',
    title: 'Create an Invoice Online, Free. Make Your Own Invoice',
    description:
      'Create your own invoice online in a few minutes. Type your details, see the invoice build as you go, download the PDF. Free, no signup, no watermark.',
    h1: 'Create an invoice online',
    intro:
      'Make your own invoice without a template to wrestle or software to install. Type your details, watch the invoice take shape beside you, download the PDF.',
    sections: [
      {
        heading: 'Create an invoice in four steps',
        body: 'The editor opens already laid out as a finished invoice, so creating one is a matter of replacing the placeholder details with yours.',
        points: [
          'Add your business name and contact details. They are remembered on this device for next time.',
          'Add the customer: their name, address and the email the invoice should reach.',
          'List the work, one line per item, with a quantity and a rate. Amounts and totals calculate as you type.',
          'Set tax if you charge it, pick a payment term, and download the PDF.',
        ],
      },
      {
        heading: 'Making your own invoice versus a spreadsheet',
        body: 'A spreadsheet works until it does not: totals that stop adding up after a row is deleted, a logo that stretches, a date that turns into a number. Here the layout is fixed, the maths is exact, and the file your customer opens is a PDF that looks the same on every screen.',
      },
      {
        heading: 'Create invoices again without starting over',
        body: 'Most people make more than one invoice. Your business details and logo are kept on your device, the next invoice number follows on from the last, and recent invoices are a tap away, so the second invoice takes a fraction of the time of the first.',
      },
      {
        heading: 'What you can change',
        body: 'Three templates, any accent colour, a serif, sans-serif or monospace typeface, A4 or US Letter, and any of the supported currencies. Tax and discounts can be a single rate or set per line.',
      },
    ],
    faqs: [
      { question: 'Is it free to create an invoice here?', answer: FREE_ANSWER },
      {
        question: 'Do I need to download anything?',
        answer: 'No. It runs in your browser on a phone, tablet or computer, and the only download is the finished PDF.',
      },
      {
        question: 'Can I create an invoice without a business name?',
        answer:
          'Yes. Freelancers and sole traders can invoice under their own name. Only add a tax registration number if you are registered for a tax such as VAT or GST.',
      },
      { question: 'Where is my invoice stored?', answer: PRIVACY_ANSWER },
    ],
    priority: 0.85,
  },
  {
    slug: 'create-invoice-online-free-uk',
    title: 'Create an Invoice Online Free (UK): Pounds, VAT Ready',
    description:
      'Create a UK invoice online for free. Pounds sterling by default, UK date format, a VAT line and VAT number when you need them. No signup, no watermark.',
    h1: 'Create an invoice online free, for the UK',
    intro:
      'Pounds sterling by default, dates the UK way, and a VAT line you can switch on if you are registered. Free, with no account and no watermark.',
    sections: [
      {
        heading: 'Set up for UK invoicing',
        body: 'Start from the button above and the invoice opens in GBP. Dates follow your browser, so a UK visitor sees day, month, year. Everything else is the same quick editor.',
        points: [
          'Currency: £ by default from this page, and switchable if you bill abroad.',
          'Tax: rename the tax line to "VAT" and set 20%, 5% or 0% as needed, or leave it off entirely.',
          'Tax ID: rename the field to "VAT No." so your registration number is labelled correctly.',
          'Paper: A4 is the default size.',
        ],
      },
      {
        heading: 'What a UK invoice needs',
        body: 'For a sole trader or a company that is not VAT registered, an invoice is straightforward. It should carry:',
        points: [
          'A unique invoice number.',
          'Your business name, address and contact details. Sole traders trading under a business name should include their own name too; limited companies should use the full registered name.',
          'The customer’s name and address.',
          'A clear description of what you supplied, with the date of supply.',
          'The amount for each item and the total due, with the due date and how to pay.',
        ],
      },
      {
        heading: 'If you are VAT registered',
        body: 'Only charge VAT if you are registered. Registration is compulsory once taxable turnover passes £90,000 in a rolling 12 months. A VAT invoice also needs your VAT number, the tax point, the VAT rate for each item, the total excluding VAT and the total VAT. For sales of £250 or less including VAT, a simplified VAT invoice is allowed.',
      },
      {
        heading: 'Getting paid on time in the UK',
        body: 'Put a due date on every invoice. Between businesses, the Late Payment of Commercial Debts (Interest) Act lets you claim statutory interest at 8% over the Bank of England base rate on overdue invoices, plus a fixed recovery sum, even if your contract does not mention it. A line in the notes saying so tends to make it unnecessary.',
      },
      {
        heading: 'A note on the rules',
        body: 'This page is general information, not tax or legal advice. HMRC publishes the current invoicing and VAT rules on GOV.UK; check there or with an accountant before relying on any of it.',
      },
    ],
    faqs: [
      { question: 'Is it really free to create an invoice in the UK?', answer: FREE_ANSWER },
      {
        question: 'Does the invoice use pounds?',
        answer:
          'Yes. Opening the editor from this page sets the currency to GBP. You can change it for a customer abroad.',
      },
      {
        question: 'Can I add VAT?',
        answer:
          'Yes. Set the tax rate, rename the line to VAT, and rename the tax ID field to "VAT No." for your registration number. Leave it off if you are not registered.',
      },
      { question: 'Is my data kept in the UK?', answer: PRIVACY_ANSWER },
    ],
    priority: 0.85,
    ctaHref: '/create?currency=GBP',
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
