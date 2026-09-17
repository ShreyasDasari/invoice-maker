# Invoice Maker

A free invoice maker. Open the site, type, download a PDF. No account, no
watermark, no paywall.

The home page **is** the editor. There is no marketing page to scroll past and
no "Get started" button in the way: someone arriving from a search for *invoice
maker* is already in the tool.

## What it does

- Fill in an invoice with sensible defaults already in place (INV-0001, today,
  due in 7 days, USD) and watch a live preview build beside it
- Exact money arithmetic — tax, discounts, shipping, part payment, multi-currency
- Three professional templates, plus a logo, one accent colour and a typeface
- Download a real PDF with selectable text, or print the invoice alone
- Remembers your business details and recent invoices, on your device only
- Share by link without an account, or hand off the PDF through the native
  share sheet on a phone

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

## Verifying it

```bash
npm run verify       # types, lint, 102 unit tests, production build

# End-to-end, against a real browser (one-time: npx playwright install chromium)
npm run build && npm start -- -p 3210
npm run e2e          # 95 checks: flows, PDF, touch targets, a11y, print, dark mode
```

`npm test` includes PDF assertions that render the document in Node and read the
bytes back with pdf.js, so page counts, repeated table headers and text
selectability are checked against the delivered file rather than the components.

## Deploying to Vercel

1. Push to GitHub, then import the repository at
   [vercel.com/new](https://vercel.com/new). Framework, build command and output
   are all detected — no configuration needed.
2. Set one environment variable, for Production **and** Preview:

   ```
   NEXT_PUBLIC_SITE_URL = https://your-domain.com
   ```

   This is what canonical URLs, Open Graph tags, `sitemap.xml` and `robots.txt`
   are built from. Without it the app falls back to Vercel's own deployment URL,
   which works but differs between production and preview.
3. Add your domain under **Settings → Domains**, then redeploy so the sitemap
   is regenerated with the final URLs.

### Google Search Console

1. Add the property at
   [search.google.com/search-console](https://search.google.com/search-console),
   verifying by DNS record or by the HTML-tag method. For the HTML tag, add the
   token to `metadata.verification.google` in [src/app/layout.tsx](src/app/layout.tsx).
2. Submit `https://your-domain.com/sitemap.xml` under **Sitemaps**. It is
   generated at build time from [src/app/sitemap.ts](src/app/sitemap.ts) and
   lists the editor, the landing pages and the privacy page.
3. `robots.txt` is generated from [src/app/robots.ts](src/app/robots.ts): every
   page is crawlable, only Next.js internals are excluded.

## How it is put together

| Concern | Where | Note |
| --- | --- | --- |
| Money | [src/lib/money.ts](src/lib/money.ts) | Exact decimals on `bigint`. No floats touch a monetary value. |
| Totals | [src/lib/calc.ts](src/lib/calc.ts) | Every figure derived, never stored. Tax per rate group, discounts allocated by largest remainder. |
| Model | [src/lib/invoice.ts](src/lib/invoice.ts) | Amounts kept as typed strings so editing is lossless; versioned for migration. |
| Templates | [src/lib/templates.ts](src/lib/templates.ts) | One spec, in points, read by both renderers. |
| Preview | [src/components/preview/](src/components/preview/) | HTML at true page size, scaled by transform, so it is a scale model rather than a lookalike. |
| PDF | [src/components/pdf/](src/components/pdf/) | Built in the browser. Uses the PDF's own built-in fonts, so there are no font files to ship. |
| Storage | [src/lib/storage.ts](src/lib/storage.ts) | `localStorage` only, defensive against private mode and quota. |
| Sharing | [src/lib/share.ts](src/lib/share.ts) | Deflated payload in the URL fragment, which browsers never send to a server. |
| Landing pages | [src/lib/seo-pages.ts](src/lib/seo-pages.ts) | A registry, so new pages are data — added only where there is something to say. |

### Two decisions worth knowing

**Nothing is uploaded.** The editor, the totals and the PDF all run client-side.
There is no server that receives an invoice, which is why there is no privacy
banner to dismiss and no per-invoice cost to recover with a paywall.

**The preview is HTML, the download is a PDF.** Two renderers would normally
drift apart, so both read their geometry and type scale from the single template
spec. Two constraints are encoded there and easy to break by accident:

- Letter spacing above ~0.8pt at label sizes makes a PDF reader emit each glyph
  separately, so copying `DESCRIPTION` out of the file yields `D E S C R I P T I O N`.
- `lineHeight` must not sit on the react-pdf `Page`; the absolutely positioned
  page-number node inherits it and stops drawing.

Both are covered by tests in
[src/components/pdf/InvoiceDocument.test.tsx](src/components/pdf/InvoiceDocument.test.tsx).

### Adding accounts later

Nothing in the UI assumes local storage. `src/lib/storage.ts` is the only module
that knows where data lives, and `src/state/invoice-store.tsx` is the only
consumer of it, so a synced backend is a second implementation behind the same
functions rather than a rewrite.

## Design system

Generated and stored under [design-system/](design-system/): Swiss/minimal, Inter,
an 8px rhythm, one accent colour, hairline borders, WCAG AA contrast in both
themes. `design-system/invoice-maker/MASTER.md` is the source of truth.

## Licence

MIT. See [LICENSE](LICENSE).
