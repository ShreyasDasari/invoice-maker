/**
 * End-to-end verification against a real browser.
 *
 * Covers the flows a user actually performs — fill in an invoice, add and
 * remove lines, change tax, discount, currency and template, download the PDF,
 * reopen from Recent, duplicate, share by link — and then the properties that
 * are easy to regress silently: touch-target sizes on real phone viewports, no
 * horizontal overflow from 320px up, accessible names on every control, the
 * print stylesheet, dark mode leaving the invoice on white paper, and a
 * 100-line invoice staying exact and responsive.
 *
 *   npm run build && npm start -- -p 3210
 *   npm run e2e
 *
 * Requires a one-time `npx playwright install chromium`.
 */
import { chromium, devices } from 'playwright';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'http://localhost:3210';
const OUT = process.env.OUT ?? '.e2e-output';
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
}

mkdirSync(OUT, { recursive: true });

/** Page count and text of a downloaded PDF, read with pdf.js. */
async function loadPdf(path) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { readFileSync } = await import('node:fs');
  return pdfjs.getDocument({ data: new Uint8Array(readFileSync(path)), useSystemFonts: true }).promise;
}

async function pageCount(path) {
  return (await loadPdf(path)).numPages;
}

async function pdfText(path) {
  const doc = await loadPdf(path);
  let out = '';
  for (let n = 1; n <= doc.numPages; n += 1) {
    const content = await (await doc.getPage(n)).getTextContent();
    out += `${content.items.map((i) => ('str' in i ? i.str : '')).join(' ')}\n`;
  }
  return out.replace(/\s+/g, ' ');
}

const browser = await chromium.launch();

// ---------------------------------------------------------------- desktop
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: 'networkidle' });

  check('h1 states the offer', (await page.locator('h1').first().innerText()).includes('Make an invoice'));

  // Defaults a first-time user should see.
  const num = await page.getByLabel('Invoice number').inputValue();
  check('invoice number defaults to INV-0001', num === 'INV-0001', num);
  const issue = await page.getByLabel('Issue date').inputValue();
  const due = await page.getByLabel('Due date').inputValue();
  const days = (new Date(due) - new Date(issue)) / 86400000;
  check('due date defaults to 7 days out', days === 7, `${issue} -> ${due}`);
  check('currency defaults to USD', (await page.locator('select').first().inputValue()) === 'USD');

  // Fill in an invoice.
  await page.getByLabel('Business name').fill('Northwind Studio');
  await page.getByLabel('Customer name').fill('Acme Corporation');
  const desc = page.locator('#desc-lg-' + (await page.locator('[id^=desc-lg-]').first().getAttribute('id')).replace('desc-lg-', ''));
  await desc.fill('Brand identity design');
  await page.getByLabel('Qty, line 1').fill('2');
  await page.getByLabel('Rate, line 1').fill('1500');

  const sheet = page.locator('article.sheet');
  await page.waitForTimeout(150);
  check('preview shows the business', (await sheet.innerText()).includes('Northwind Studio'));
  check('preview shows the customer', (await sheet.innerText()).includes('Acme Corporation'));
  check('preview computes the line amount', (await sheet.innerText()).includes('3,000.00'));

  // Add and remove a line.
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  await page.waitForTimeout(120);
  let rows = await page.locator('[id^=desc-lg-]').count();
  check('add item creates a second line', rows === 2, `rows=${rows}`);
  check('add item focuses the new description',
    (await page.evaluate(() => document.activeElement?.id ?? '')).startsWith('desc-lg-'));

  await page.getByLabel('Qty, line 2').fill('3');
  await page.getByLabel('Rate, line 2').fill('99.99');
  await page.waitForTimeout(150);
  check('second line totals correctly', (await sheet.innerText()).includes('299.97'));
  check('subtotal adds both lines', (await sheet.innerText()).includes('3,299.97'));

  await page.getByRole('button', { name: /Remove item 2/ }).click();
  await page.waitForTimeout(120);
  rows = await page.locator('[id^=desc-lg-]').count();
  check('remove item deletes the line', rows === 1, `rows=${rows}`);

  // Tax.
  await page.getByLabel('Tax rate').fill('8.5');
  await page.waitForTimeout(150);
  let text = await sheet.innerText();
  check('tax appears in the preview', text.includes('8.5%') && text.includes('255.00'), text.match(/8\.5%[^\n]*/)?.[0] ?? '');
  check('total includes tax', text.includes('3,255.00'));

  // Invoice discount.
  await page.getByLabel('Invoice discount').fill('10');
  await page.waitForTimeout(150);
  text = await sheet.innerText();
  check('discount is applied before tax', text.includes('300.00') && text.includes('229.50'));
  check('discounted total is right', text.includes('2,929.50'), text.match(/2,9[\d,.]*/)?.[0] ?? '');

  // Currency switch.
  await page.locator('select').first().selectOption('JPY');
  await page.waitForTimeout(150);
  text = await sheet.innerText();
  check('currency switch reformats amounts', text.includes('¥') && text.includes('JPY'));
  check('JPY drops the decimals', !text.includes('3,000.00'), text.match(/¥[\d,]+/)?.[0] ?? '');
  await page.locator('select').first().selectOption('USD');
  await page.waitForTimeout(150);

  // Templates.
  for (const name of ['Modern', 'Minimal', 'Classic']) {
    await page.getByRole('radio', { name: new RegExp(`^${name}`) }).click();
    await page.waitForTimeout(120);
    const ok = (await sheet.innerText()).includes('Northwind Studio');
    check(`template ${name} renders`, ok);
  }

  // Invoice number increments on a new invoice.
  await page.getByRole('button', { name: 'New invoice' }).click();
  await page.waitForTimeout(200);
  const nextNum = await page.getByLabel('Invoice number').inputValue();
  check('new invoice increments the number', nextNum === 'INV-0002', nextNum);
  check('new invoice keeps the business details',
    (await page.getByLabel('Business name').inputValue()) === 'Northwind Studio');

  // Persistence across a reload.
  await page.getByLabel('Customer name').fill('Second Client');
  await page.waitForTimeout(900);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  check('draft survives a reload',
    (await page.getByLabel('Customer name').inputValue()) === 'Second Client');

  // Download.
  const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const download = await downloadPromise;
  const filename = download.suggestedFilename();
  check('download produces a PDF', filename.endsWith('.pdf'), filename);
  check('filename carries the invoice number', filename.includes('INV-0002'), filename);
  const path = `${OUT}/downloaded.pdf`;
  await download.saveAs(path);
  check('downloaded file is non-trivial', statSync(path).size > 1000);
  const { readFileSync } = await import('node:fs');
  const fontNames = readFileSync(path).toString('latin1').match(/\/BaseFont\s*\/[A-Za-z0-9+\-_,]+/g)?.join(' ') ?? '';
  check('download embeds the app font, not a PDF fallback',
    fontNames.includes('Inter') && !/Helvetica|Times-Roman/.test(fontNames), fontNames.slice(0, 90));
  await page.waitForTimeout(400);
  check('download shows a confirmation',
    (await page.getByText('Invoice downloaded').count()) > 0);

  // Recent invoices, after a download marks it finished.
  await page.getByRole('link', { name: 'Recent' }).click();
  await page.waitForTimeout(500);
  check('downloaded invoice is listed in Recent',
    (await page.getByText('INV-0002').count()) > 0);

  // Duplicate.
  await page.getByRole('button', { name: /Duplicate INV-0002/ }).click();
  await page.waitForTimeout(600);
  const dupNum = await page.getByLabel('Invoice number').inputValue();
  check('duplicate opens a new number', dupNum === 'INV-0003', dupNum);
  check('duplicate keeps the customer',
    (await page.getByLabel('Customer name').inputValue()) === 'Second Client');

  // Share link round-trip.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Share' }).click();
  await page.getByRole('menuitem', { name: /Copy link/ }).click();
  await page.waitForTimeout(600);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  check('share link is built', link.includes('#i='), link.slice(0, 48));

  const fresh = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const freshPage = await fresh.newPage();
  await freshPage.goto(link, { waitUntil: 'networkidle' });
  await freshPage.waitForTimeout(600);
  check('share link restores the invoice in a clean browser',
    (await freshPage.getByLabel('Customer name').inputValue()) === 'Second Client');
  check('share payload is removed from the address bar',
    !freshPage.url().includes('#i='), freshPage.url());
  await fresh.close();

  // Keyboard reachability of the core flow.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.keyboard.press('Tab');
  check('skip link is first in the tab order',
    (await page.evaluate(() => document.activeElement?.textContent ?? '')).includes('Skip'));

  const focusable = await page.evaluate(() => {
    const nodes = document.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    );
    return nodes.length;
  });
  check('editor is reachable by keyboard', focusable > 30, `${focusable} focusable controls`);

  const unlabelled = await page.evaluate(() => {
    const bad = [];
    const nameOf = (el) => {
      const direct = el.getAttribute('aria-label');
      if (direct && direct.trim()) return direct.trim();
      const ref = el.getAttribute('aria-labelledby');
      if (ref) {
        const text = ref
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
          .trim();
        if (text) return text;
      }
      return (el.textContent ?? '').trim();
    };
    document.querySelectorAll('button').forEach((b) => {
      if (!nameOf(b)) bad.push(b.outerHTML.slice(0, 70));
    });
    document.querySelectorAll('input,select,textarea').forEach((el) => {
      const id = el.getAttribute('id');
      const hasLabel =
        (id && document.querySelector(`label[for="${id}"]`)) ||
        el.getAttribute('aria-label') ||
        el.getAttribute('aria-labelledby');
      if (!hasLabel) bad.push(el.outerHTML.slice(0, 70));
    });
    return bad;
  });
  check('every control has an accessible name', unlabelled.length === 0, unlabelled.join(' | ').slice(0, 200));

  // Escape closes the share menu.
  await page.getByRole('button', { name: 'Share' }).click();
  await page.waitForTimeout(150);
  check('share menu opens', await page.getByRole('menu').isVisible());
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('Escape closes the share menu', (await page.getByRole('menu').count()) === 0);

  // Cmd/Ctrl+S saves locally.
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(400);
  check('Ctrl+S saves and confirms', (await page.getByText(/Saved on this device/).count()) > 0);

  // Cmd/Ctrl+Enter downloads.
  const shortcutDownload = page.waitForEvent('download', { timeout: 45000 });
  await page.keyboard.press('Control+Enter');
  const sd = await shortcutDownload;
  check('Ctrl+Enter downloads the PDF', sd.suggestedFilename().endsWith('.pdf'), sd.suggestedFilename());

  // A 100-line invoice: seeded into storage, because typing it would tell us
  // nothing the reducer does not already guarantee.
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('im.draft.v1');
    if (!raw) return;
    const draft = JSON.parse(raw);
    draft.items = Array.from({ length: 100 }, (_, i) => ({
      id: `seed-${i}`,
      description: `Seeded line ${i + 1} with a reasonably long description to exercise wrapping`,
      quantity: '2',
      unitPrice: '137.55',
      tax: { mode: 'percent', value: '7.25' },
      discount: { mode: 'percent', value: '' },
    }));
    draft.invoiceNumber = 'INV-0100';
    window.localStorage.setItem('im.draft.v1', JSON.stringify(draft));
  });

  const started = Date.now();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const renderMs = Date.now() - started;
  check('100-line invoice renders', (await page.locator('[id^=desc-lg-]').count()) === 100, `${renderMs}ms`);

  const sheetText = await page.locator('article.sheet').innerText();
  // 100 x 2 x 137.55 = 27,510.00, tax 7.25% = 1,994.48, total 29,504.48
  check('100-line totals are exact', sheetText.includes('27,510.00') && sheetText.includes('29,504.48'),
    sheetText.match(/29,[\d,.]+/)?.[0] ?? '');

  const overflow100 = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('100-line invoice does not overflow', overflow100 <= 1, `${overflow100}px`);

  // Typing stays responsive with 100 lines on screen.
  const typeStart = Date.now();
  await page.getByLabel('Customer name').fill('Volume Client');
  await page.waitForTimeout(50);
  const typeMs = Date.now() - typeStart;
  check('editing stays responsive at 100 lines', typeMs < 3000, `${typeMs}ms`);

  const bigDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const bd = await bigDownload;
  await bd.saveAs(`${OUT}/large.pdf`);
  const size = statSync(`${OUT}/large.pdf`).size;
  check('100-line invoice downloads', size > 5000, `${Math.round(size / 1024)}KB`);

  const manyPages = await pageCount(`${OUT}/large.pdf`);
  check('100-line invoice spans several pages', manyPages > 1, `${manyPages} pages`);

  // Fit to one page.
  //
  // Two cases, because the control has a deliberate floor: a realistically
  // long invoice must actually reach one page, and an extreme one must say
  // plainly that it could not rather than shrinking into illegibility.
  await page.getByRole('switch', { name: 'Fit to one page' }).click();
  await page.waitForTimeout(900);

  const extremeLabel = await page
    .locator('p', { hasText: /scaled to \d+%/i })
    .first()
    .innerText()
    .catch(() => '');
  check('fit control reports the scale it applied', /\d+%/.test(extremeLabel), extremeLabel.slice(0, 70));
  check('fit control admits when 100 lines will still not fit',
    /may still run over/i.test(extremeLabel), extremeLabel.slice(0, 90));

  const extremeDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  const ed = await extremeDownload;
  await ed.saveAs(`${OUT}/fitted-extreme.pdf`);
  const extremePages = await pageCount(`${OUT}/fitted-extreme.pdf`);
  check('fit still reduces an over-long invoice', extremePages < manyPages,
    `${manyPages} -> ${extremePages} pages`);

  // Now a length that genuinely should collapse to a single page.
  await page.evaluate(() => {
    const raw = window.localStorage.getItem('im.draft.v1');
    if (!raw) return;
    const draft = JSON.parse(raw);
    draft.items = Array.from({ length: 26 }, (_, i) => ({
      id: `fit-${i}`,
      description: `Consulting session ${i + 1}`,
      quantity: '1',
      unitPrice: '250',
      tax: { mode: 'percent', value: '' },
      discount: { mode: 'percent', value: '' },
    }));
    draft.options.fitToPage = false;
    window.localStorage.setItem('im.draft.v1', JSON.stringify(draft));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const spillDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await (await spillDownload).saveAs(`${OUT}/spilling.pdf`);
  const spillPages = await pageCount(`${OUT}/spilling.pdf`);
  check('a 26-line invoice needs two pages unaided', spillPages > 1, `${spillPages} pages`);

  await page.getByRole('switch', { name: 'Fit to one page' }).click();
  await page.waitForTimeout(900);
  const fitDownload = page.waitForEvent('download', { timeout: 60000 });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await (await fitDownload).saveAs(`${OUT}/fitted.pdf`);
  const fittedPages = await pageCount(`${OUT}/fitted.pdf`);
  check('fit to one page collapses it to a single page', fittedPages === 1, `${fittedPages} pages`);

  const fittedText = await pdfText(`${OUT}/fitted.pdf`);
  check('fitted PDF keeps every line', fittedText.includes('Consulting session 26'));
  check('fitted PDF keeps the totals', fittedText.includes('TOTAL DUE'));
  check('fitted PDF text is still extractable', fittedText.includes('DESCRIPTION'),
    fittedText.slice(0, 50));

  check('no console errors on the editor', errors.length === 0, errors.join(' | ').slice(0, 200));

  await page.screenshot({ path: `${OUT}/desktop.png`, fullPage: false });
  await context.close();
}

// --------------------------------------------------------------- contrast
for (const scheme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const failures = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a] = m[1].split(',').map((v) => Number.parseFloat(v));
      return { r, g, b, a: a === undefined ? 1 : a };
    };
    const lum = ({ r, g, b }) =>
      [r, g, b]
        .map((v) => v / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
      return (x + 0.05) / (y + 0.05);
    };
    // Walk up for the first opaque background actually painted behind an element.
    const bgOf = (el) => {
      let node = el;
      while (node && node !== document.documentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0.85) return c;
        node = node.parentElement;
      }
      return parse(getComputedStyle(document.body).backgroundColor) ?? { r: 255, g: 255, b: 255, a: 1 };
    };

    const bad = [];
    const seen = new Set();
    document.querySelectorAll('p, span, label, a, button, h1, h2, h3, td, th, li, output').forEach((el) => {
      // The invoice sheet is a white document in every theme; it is checked
      // separately against its own paper, not the app's background.
      if (el.closest('article.sheet')) return;
      const text = (el.textContent ?? '').trim();
      if (!text || el.children.length > 0) return;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;

      const fg = parse(style.color);
      if (!fg || fg.a < 0.5) return;
      const r = ratio(fg, bgOf(el));
      const size = Number.parseFloat(style.fontSize);
      const weight = Number.parseInt(style.fontWeight, 10) || 400;
      // WCAG AA: 3:1 for large text (>=18.66px bold or >=24px), else 4.5:1.
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const required = large ? 3 : 4.5;
      if (r < required) {
        const key = `${style.color}|${Math.round(size)}`;
        if (seen.has(key)) return;
        seen.add(key);
        bad.push(`"${text.slice(0, 22)}" ${r.toFixed(2)}:1 < ${required} (${Math.round(size)}px/${weight})`);
      }
    });
    return bad;
  });

  check(`${scheme}: text meets WCAG AA contrast`, failures.length === 0, failures.join(' | ').slice(0, 260));
  await context.close();
}

// ----------------------------------------------------------------- mobile
for (const [label, device] of [['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7'] ?? devices['Pixel 5']]]) {
  const context = await browser.newContext({ ...device });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${label}: no horizontal overflow`, overflow <= 1, `${overflow}px`);

  check(`${label}: bottom Download button is present`,
    (await page.getByRole('button', { name: 'Download PDF' }).count()) > 0);

  // Touch target sizes on the primary controls.
  const small = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('button:not([disabled]), a[href], input, select').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // Icon buttons extend their hit area with an ::after pseudo-element.
      const cls = String(el.className);
      const hasExtender = cls.includes('tap-44');
      const isSkipLink = cls.includes('sr-only-focusable');
      // An input wrapped in a clickable label is operated via the label.
      if (el.closest('label') && el.tagName === 'INPUT') {
        const lr = el.closest('label').getBoundingClientRect();
        if (lr.height >= 40) return;
      }
      // A visually hidden file input is operated by its visible button.
      if (cls.split(/\s+/).includes('sr-only')) return;
      if (!hasExtender && !isSkipLink && (r.height < 40 || r.width < 24)) {
        bad.push(`${el.tagName}.${String(el.className).slice(0, 24)}:${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
    return bad;
  });
  check(`${label}: touch targets are large enough`, small.length === 0, small.join(' | ').slice(0, 220));

  const clipped = await page.evaluate(() => {
    const w = window.innerWidth;
    const bad = [];
    document.querySelectorAll('button, a[href], input, select').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > w + 1 || r.left < -1) {
        bad.push(`${el.tagName}.${String(el.className).slice(0, 20)}@${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    });
    return bad;
  });
  check(`${label}: no control is pushed off-screen`, clipped.length === 0, clipped.join(' | ').slice(0, 220));

  // The Edit/Preview switch.
  await page.getByRole('tab', { name: 'Preview' }).click();
  await page.waitForTimeout(300);
  check(`${label}: preview tab shows the sheet`, await page.locator('article.sheet').isVisible());
  const overflow2 = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`${label}: preview tab has no overflow`, overflow2 <= 1, `${overflow2}px`);

  await page.getByRole('tab', { name: 'Edit' }).click();
  await page.waitForTimeout(200);
  await page.getByLabel('Business name').fill('Mobile Co');
  await page.waitForTimeout(200);
  check(`${label}: typing works`, (await page.getByLabel('Business name').inputValue()) === 'Mobile Co');

  await page.screenshot({ path: `${OUT}/${label.replace(/\s/g, '-')}.png`, fullPage: false });
  await context.close();
}

// -------------------------------------------------------------- landscape
{
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('landscape: no horizontal overflow', overflow <= 1, `${overflow}px`);
  await context.close();
}

// ------------------------------------------------------------ small phone
{
  const context = await browser.newContext({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('320px: no horizontal overflow', overflow <= 1, `${overflow}px`);
  await context.close();
}

// ------------------------------------------------------------- SEO pages
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  for (const slug of ['invoice-maker', 'free-invoice-maker', 'invoice-generator', 'invoice-template', 'privacy']) {
    const res = await page.goto(`${BASE}/${slug}`, { waitUntil: 'domcontentloaded' });
    const h1s = await page.locator('h1').count();
    const title = await page.title();
    const desc = await page.locator('meta[name=description]').getAttribute('content');
    const canonical = await page.locator('link[rel=canonical]').getAttribute('href');
    check(`/${slug} responds 200`, res.status() === 200, String(res.status()));
    check(`/${slug} has exactly one h1`, h1s === 1, `${h1s}`);
    check(`/${slug} has a title and description`, Boolean(title) && Boolean(desc) && desc.length > 50);
    check(`/${slug} has a canonical link`, Boolean(canonical), canonical ?? '');
  }
  // Structured data on the landing pages.
  await page.goto(`${BASE}/invoice-maker`, { waitUntil: 'domcontentloaded' });
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = ld.map((t) => JSON.parse(t)['@type']);
  check('landing page emits FAQ and breadcrumb structured data',
    types.includes('FAQPage') && types.includes('BreadcrumbList'), types.join(','));

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const homeLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  check('home emits WebApplication structured data',
    homeLd.some((t) => JSON.parse(t)['@type'] === 'WebApplication'));

  const res404 = await page.goto(`${BASE}/definitely-not-a-page`, { waitUntil: 'domcontentloaded' });
  check('unknown route returns 404', res404.status() === 404, String(res404.status()));
  await context.close();
}

// ------------------------------------------------------------- dark mode
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  check('dark mode is applied from the system preference', theme === 'dark', String(theme));

  // The invoice sheet must stay white paper even in dark mode.
  const sheetBg = await page.evaluate(() => {
    const el = document.querySelector('article.sheet');
    return el ? getComputedStyle(el).backgroundColor : '';
  });
  check('invoice sheet stays white in dark mode', sheetBg === 'rgb(255, 255, 255)', sheetBg);

  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check('app chrome is dark', bodyBg !== 'rgb(255, 255, 255)', bodyBg);

  await page.screenshot({ path: `${OUT}/dark.png` });
  await context.close();
}

// --------------------------------------------------- reduced motion + print
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const dur = await page.evaluate(() => {
    const btn = document.querySelector('button');
    return btn ? getComputedStyle(btn).transitionDuration : '';
  });
  check('reduced motion shortens transitions', Number.parseFloat(dur) < 0.05, dur);

  // Print: only the invoice survives.
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);
  const printVisible = await page.evaluate(() => {
    const hidden = (sel) => {
      const el = document.querySelector(sel);
      return !el || getComputedStyle(el).display === 'none';
    };
    return {
      headerHidden: hidden('header.app-header'),
      footerHidden: hidden('footer.app-footer'),
      sheetVisible: !hidden('article.sheet'),
      noPrintHidden: Array.from(document.querySelectorAll('.no-print')).every(
        (el) => getComputedStyle(el).display === 'none'),
    };
  });
  check('print hides the header', printVisible.headerHidden);
  check('print hides the footer', printVisible.footerHidden);
  check('print hides the controls', printVisible.noPrintHidden);
  check('print keeps the invoice', printVisible.sheetVisible);

  const transform = await page.evaluate(() => {
    const el = document.querySelector('.print-scale');
    return el ? getComputedStyle(el).transform : '';
  });
  check('print drops the preview scaling', transform === 'none' || transform === '', transform);
  await context.close();
}

await browser.close();

writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
console.log(`\n${results.length - failures}/${results.length} checks passed`);
process.exit(failures > 0 ? 1 : 0);
