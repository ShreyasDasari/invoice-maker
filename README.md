# Invoice Maker

A free invoice maker. Open the site, type, download a PDF. No account, no
watermark, no paywall.

The home page shows the finished invoice before asking for anything, because
that is the question a first-time visitor actually has: *what will I end up
with*. The editor is one click away at `/create` and still needs no account.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Landing page — the tagline and a real, fully filled-in invoice you can switch templates on |
| `/create` | The editor |
| `/templates` | Template gallery — the same invoice, live, with accent and typeface controls |
| `/recent` | Invoices made on this device |
| `/invoice-maker`, `/free-invoice-maker`, `/invoice-generator`, `/invoice-template` | Landing pages for high-intent searches |
| `/privacy` | What is stored, and where |

Every invoice shown on the marketing pages is rendered by the same component
the editor previews and the PDF mirrors, fed from
[src/lib/example-invoice.ts](src/lib/example-invoice.ts). They are real
invoices, not screenshots, so they cannot drift from the product — and the
example's totals are asserted in a test.

## What it does

- Fill in an invoice with sensible defaults already in place (INV-0001, today,
  due in 7 days, USD) and watch a live preview build beside it
- Exact money arithmetic — tax, discounts, shipping, part payment, multi-currency
- Three professional templates, plus a logo, one accent colour and a typeface
- **Fit to one page** — scales type, margins and row spacing together until the
  invoice lands on a single sheet, and says so plainly when it cannot
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
npm run verify       # types, lint, 117 unit tests, production build

# End-to-end, against a real browser (one-time: npx playwright install chromium)
npm run build && npm start -- -p 3210
npm run e2e          # 165 checks: flows, PDF page counts, fit-to-page, print
                     # output, touch targets, WCAG contrast on every route,
                     # button/alignment audit, dark mode
```

`npm test` includes PDF assertions that render the document in Node and read the
bytes back with pdf.js, so page counts, repeated table headers, the embedded
font and text selectability are checked against the delivered file rather than
the components. The browser suite goes further and counts the pages of PDFs it
actually downloads.

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
| PDF | [src/components/pdf/](src/components/pdf/) | Built in the browser, embedding the same font files the preview paints with. |
| Fonts | [src/lib/fonts.ts](src/lib/fonts.ts) | One registry for both renderers, including each face's measured line height. |
| Printing | [src/components/preview/PrintSheet.tsx](src/components/preview/PrintSheet.tsx) | A portalled copy of the sheet, so no collapsed panel or scroll container can clip it. |
| Marketing | [src/components/marketing/](src/components/marketing/) | Landing hero and template gallery, both rendering the real example invoice. |
| Storage | [src/lib/storage.ts](src/lib/storage.ts) | `localStorage` only, defensive against private mode and quota. |
| Sharing | [src/lib/share.ts](src/lib/share.ts) | Deflated payload in the URL fragment, which browsers never send to a server. |
| Landing pages | [src/lib/seo-pages.ts](src/lib/seo-pages.ts) | A registry, so new pages are data — added only where there is something to say. |

### Two decisions worth knowing

**Nothing is uploaded.** The editor, the totals and the PDF all run client-side.
There is no server that receives an invoice, which is why there is no privacy
banner to dismiss and no per-invoice cost to recover with a paywall.

**The preview is HTML, the download is a PDF.** Two renderers would normally
drift apart, so both read their geometry and type scale from one template spec
and their typeface from one font registry. Three constraints are encoded there,
each found by generating a PDF and reading the bytes back, and each now covered
by a test:

- **Never set `lineHeight` on a react-pdf `View` or `Text`.** It is treated as
  an absolute measure — the same value yields identical spacing at 7pt and at
  26pt — and roughly doubles the intended leading. Setting it on the `Page`
  spaces correctly but stops absolutely-positioned `fixed` nodes, such as the
  page number, from drawing at all. The fix is to set it nowhere and let each
  face's intrinsic leading apply, which is proportional and correct; the
  preview mirrors that value as its CSS `line-height`, which is what keeps a
  one-page preview a one-page PDF.
- **Express letter spacing as a fraction of font size.** Past roughly `0.09em`
  a PDF reader emits one glyph at a time, so copying `DESCRIPTION` out of the
  file yields `D E S C R I P T I O N` and accounting software parses it the
  same way. A fixed point value crosses that threshold the moment "Fit to one
  page" shrinks the type.
- **Fonts must be registered before the first render**, and the source differs
  by environment: a URL in the browser, a filesystem path in the tests.

**Printing renders its own copy.** It used to print the on-screen preview,
which failed twice over: on a phone that preview is `display:none` whenever the
Edit tab is showing, so Print produced a blank page, and on a desktop it sits
in a scrolling container, so anything below the fold — often the totals — was
cut off. Neither is fixable from inside that subtree, because a child cannot
undo `display:none` or a clip on an ancestor. The printable invoice is
therefore portalled to `<body>`, and the print stylesheet hides every other
top-level element.

### Adding accounts later

Nothing in the UI assumes local storage. `src/lib/storage.ts` is the only module
that knows where data lives, and `src/state/invoice-store.tsx` is the only
consumer of it, so a synced backend is a second implementation behind the same
functions rather than a rewrite.

## Design system

Generated and stored under [design-system/](design-system/): an 8px rhythm,
one accent colour, and a navy-and-slate palette with a single green reserved
for "paid" — the colours of a document a business sends.

The interface is glass: frosted panels over a soft tinted field. The fill sits
at ~0.72 opacity rather than the 0.15 of a decorative glassmorphic mock,
because text has to stay legible against whatever passes beneath it. The
browser suite composites every translucent layer down to an opaque colour and
checks the result against WCAG AA on every route in both themes, so the
styling cannot quietly cost contrast. The invoice sheet itself stays flat white
in every theme — it is a document about to be printed, not interface.

Typography is Inter for the interface, and Inter, Source Serif 4 or JetBrains
Mono for the invoice itself. Those files live in [public/fonts/](public/fonts/)
and are shared by the preview and the PDF; only the face actually chosen is
ever downloaded, and Sans reuses the interface font rather than a second copy.

`design-system/invoice-maker/MASTER.md` is the source of truth.

## Licence

MIT. See [LICENSE](LICENSE).
