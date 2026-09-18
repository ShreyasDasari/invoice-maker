/**
 * The downloadable PDF.
 *
 * Built with @react-pdf/renderer, entirely in the browser — the invoice is
 * never uploaded to produce it. Text is drawn as text, so the file is
 * selectable, searchable and readable by accounting software rather than being
 * a picture of an invoice.
 *
 * Typography uses the three fonts built into the PDF format itself
 * (Helvetica, Times, Courier), so there are no font files to download, no
 * network dependency at export time, and no missing-glyph surprises.
 *
 * Geometry is read from the same template spec as the HTML preview, which is
 * what keeps the download matching what the user was looking at.
 *
 * One constraint worth knowing before changing the styles below: letter
 * spacing past roughly 0.09em makes a PDF reader emit each glyph separately, so
 * copying "DESCRIPTION" out of the file yields "D E S C R I P T I O N" and
 * accounting software parses it the same way. All tracking is therefore
 * expressed as a fraction of font size via `track()` — a fixed point value
 * would cross that threshold as soon as "Fit to one page" shrank the type. The
 * preview's CSS uses the same ratios in `em`.
 */

import * as ReactPdf from '@react-pdf/renderer';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { InvoiceTotals } from '@/lib/calc';
import type { Invoice } from '@/lib/invoice';
import { PLACEHOLDERS } from '@/lib/invoice';
import {
  formatAmount,
  formatDate,
  formatMoney,
  formatQuantity,
  type DateFormatId,
} from '@/lib/format';
import { getCurrency } from '@/lib/currency';
import { ZERO, parseDec } from '@/lib/money';
import { getPaper, getTemplate, onAccent, safeHex, scaleTemplate, tint } from '@/lib/templates';
import { getFont, resolveWeight } from '@/lib/fonts';
import { registerPdfFonts } from '@/lib/pdf-fonts';

const INK = '#0A0A0A';
const MUTED = '#525252';
const HAIRLINE = '#D9D9D9';

export interface InvoiceDocumentProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  dateStyle: DateFormatId;
  /**
   * Proportional shrink factor from "Fit to one page". Measured by the preview
   * and passed in, so both renderers scale by exactly the same amount.
   */
  fitScale?: number;
}

export function InvoiceDocument({
  invoice,
  totals,
  locale,
  dateStyle,
  fitScale = 1,
}: InvoiceDocumentProps) {
  // Idempotent: the first document to render installs the font files.
  registerPdfFonts(ReactPdf);

  const spec = scaleTemplate(
    getTemplate(invoice.template),
    invoice.options.fitToPage ? fitScale : 1,
  );
  const paper = getPaper(invoice.paperSize);
  const font = getFont(invoice.branding.fontStyle);
  const accent = safeHex(invoice.branding.accentColor);
  const currency = getCurrency(invoice.currency);

  // One family, differentiated by weight, matching the preview's @font-face.
  /**
   * Tracking as a fraction of font size, kept well under the ~0.09em at which
   * a PDF reader starts emitting one glyph at a time.
   */
  const track = (size: number, ratio = 0.055) => size * ratio;

  const regular = { fontFamily: font.family, fontWeight: 400 as const };
  const semibold = { fontFamily: font.family, fontWeight: resolveWeight(font, 600) };
  const bold = { fontFamily: font.family, fontWeight: resolveWeight(font, 700) };

  const showTaxColumn = invoice.options.perItemTax;
  const showDiscountColumn =
    invoice.options.perItemDiscount &&
    invoice.items.some((item) => parseDec(item.discount.value) !== ZERO);

  const headerFill =
    spec.tableHeaderFill === 'accent'
      ? accent
      : spec.tableHeaderFill === 'tint'
        ? tint(accent, 0.93)
        : 'transparent';
  const headerInk = spec.tableHeaderFill === 'accent' ? onAccent(accent) : INK;
  const bandInk = onAccent(accent);

  const s = StyleSheet.create({
    page: {
      ...regular,
      fontSize: spec.fontSize.body,
      color: INK,
      paddingTop: spec.header === 'band' ? 0 : spec.space.page,
      paddingBottom: spec.space.page,
      paddingHorizontal: spec.header === 'band' ? 0 : spec.space.page,
    },
    body: {
      paddingHorizontal: spec.header === 'band' ? spec.space.page : 0,
    },
    band: {
      backgroundColor: accent,
      paddingHorizontal: spec.space.page,
      paddingTop: spec.space.page - 8,
      paddingBottom: spec.space.page - 14,
      marginBottom: spec.space.section,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    title: {
      ...bold,
      fontSize: spec.fontSize.docTitle,
      // Tracking on right-aligned text is applied after the final glyph too,
      // so a negative value pushed the title past the right margin. The
      // display sizes here read fine untracked.
      letterSpacing: spec.id === 'minimal' ? track(spec.fontSize.docTitle, 0.075) : 0,
    },
    label: {
      ...semibold,
      fontSize: spec.fontSize.sectionLabel,
      letterSpacing: spec.uppercaseLabels ? track(spec.fontSize.sectionLabel) : 0,
      color: MUTED,
      marginBottom: 3,
    },
    partyName: { ...bold, color: INK },
    muted: { color: MUTED },
    small: { fontSize: spec.fontSize.small },
    row: { flexDirection: 'row' },
    section: { marginBottom: spec.space.section },
    metaTerm: {
      color: MUTED,
      fontSize: spec.fontSize.small,
      marginRight: 10,
      textAlign: 'right',
    },
    metaValue: {
      ...semibold,
      fontSize: spec.fontSize.small,
      textAlign: 'right',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: headerFill,
      borderBottomWidth: spec.tableHeaderFill === 'none' ? 1 : 0,
      borderBottomColor: INK,
      borderBottomStyle: 'solid',
    },
    th: {
      ...semibold,
      fontSize: spec.fontSize.sectionLabel,
      letterSpacing: spec.uppercaseLabels ? track(spec.fontSize.sectionLabel) : 0,
      color: headerInk,
      paddingVertical: spec.space.cell,
      paddingHorizontal: 5,
    },
    tr: {
      flexDirection: 'row',
      borderBottomWidth: spec.rowDividers ? 1 : 0,
      borderBottomColor: HAIRLINE,
      borderBottomStyle: 'solid',
    },
    td: { paddingVertical: spec.space.cell, paddingHorizontal: 5 },
    totalsWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spec.space.section },
    totalsInner: { width: '58%' },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 },
    footerNote: { fontSize: spec.fontSize.small * 0.92, color: MUTED, textAlign: 'right', marginTop: 5 },
    pageNumber: {
      position: 'absolute',
      bottom: spec.space.page * 0.45,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: spec.fontSize.small * 0.9,
      color: MUTED,
    },
  });

  const text = (raw: string, placeholder = '') => {
    const trimmed = raw.trim();
    return trimmed || placeholder;
  };

  const money = (amount: bigint) => formatMoney(amount, invoice.currency, locale);
  const amountOnly = (amount: bigint) => formatAmount(amount, invoice.currency, locale);

  /** Column widths, recomputed as optional columns appear. */
  const columns = (() => {
    const qty = 9;
    const rate = 15;
    const amount = 17;
    const disc = showDiscountColumn ? 12 : 0;
    const tax = showTaxColumn ? 10 : 0;
    return {
      description: `${100 - qty - rate - amount - disc - tax}%`,
      qty: `${qty}%`,
      rate: `${rate}%`,
      disc: `${disc}%`,
      tax: `${tax}%`,
      amount: `${amount}%`,
    };
  })();

  const metaRows: { term: string; value: string }[] = [
    { term: 'Invoice no.', value: invoice.invoiceNumber || '—' },
    { term: 'Issue date', value: formatDate(invoice.issueDate, dateStyle) },
    { term: 'Due date', value: formatDate(invoice.dueDate, dateStyle) },
  ];
  if (invoice.paymentTerms.trim()) metaRows.push({ term: 'Terms', value: invoice.paymentTerms });
  if (invoice.poNumber.trim()) metaRows.push({ term: 'PO number', value: invoice.poNumber });

  const MetaBlock = ({ inverted = false }: { inverted?: boolean }) => (
    <View>
      {metaRows.map((row) => (
        <View key={row.term} style={[s.row, { justifyContent: 'flex-end' }]}>
          <Text style={[s.metaTerm, inverted ? { color: 'rgba(255,255,255,0.78)' } : {}]}>
            {row.term}
          </Text>
          <Text style={[s.metaValue, inverted ? { color: '#FFFFFF' } : {}, { minWidth: 72 }]}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );

  const BusinessBlock = () => (
    <View style={{ flexShrink: 1 }}>
      {invoice.business.logo ? (
        <Image
          src={invoice.business.logo}
          style={{
            maxHeight: 54,
            maxWidth: 180,
            marginBottom: 8,
            objectFit: 'contain',
            // Without this the image box stretches to the full column width
            // (alignItems defaults to stretch) and objectFit centres the
            // picture inside it, pushing a tall or square logo up to 40pt to
            // the right of the business name. The preview does not do that, so
            // the download stopped matching it.
            alignSelf: 'flex-start',
          }}
        />
      ) : null}
      <Text style={[s.partyName, { fontSize: spec.fontSize.body + 2.5 }]}>
        {text(invoice.business.name, PLACEHOLDERS.businessName)}
      </Text>
      <View style={{ marginTop: 3 }}>
        {text(invoice.business.address)
          .split('\n')
          .filter(Boolean)
          .map((line, index) => (
            <Text key={index} style={s.muted}>
              {line}
            </Text>
          ))}
        {invoice.business.email ? <Text style={s.muted}>{invoice.business.email}</Text> : null}
        {invoice.business.phone ? <Text style={s.muted}>{invoice.business.phone}</Text> : null}
        {invoice.business.website ? <Text style={s.muted}>{invoice.business.website}</Text> : null}
        {invoice.business.taxId ? (
          <Text style={s.muted}>
            {`${invoice.business.taxIdLabel || 'Tax ID'}: ${invoice.business.taxId}`}
          </Text>
        ) : null}
      </View>
    </View>
  );

  const titleColor =
    spec.accent === 'text' ? accent : spec.header === 'band' ? bandInk : INK;

  const TotalLine = ({
    term,
    value,
    strong = false,
    dim = false,
  }: {
    term: string;
    value: string;
    strong?: boolean;
    dim?: boolean;
  }) => (
    <View style={s.totalLine}>
      <Text
        style={{
          color: strong ? INK : MUTED,
          ...(strong ? bold : regular),
          fontSize: strong ? spec.fontSize.body : spec.fontSize.small,
        }}
      >
        {term}
      </Text>
      <Text
        style={{
          color: dim ? MUTED : INK,
          ...(strong ? bold : regular),
          fontSize: strong ? spec.fontSize.body : spec.fontSize.small,
        }}
      >
        {value}
      </Text>
    </View>
  );

  const grandTotalStyle =
    spec.totals === 'box'
      ? {
          backgroundColor: tint(accent, 0.9),
          borderWidth: 1,
          borderColor: tint(accent, 0.7),
          borderStyle: 'solid' as const,
          borderRadius: spec.radius,
          paddingVertical: 9,
          paddingHorizontal: 12,
          marginTop: 8,
        }
      : spec.totals === 'rule'
        ? { borderTopWidth: 2, borderTopColor: INK, borderTopStyle: 'solid' as const, marginTop: 7, paddingTop: 7 }
        : { borderTopWidth: 1, borderTopColor: HAIRLINE, borderTopStyle: 'solid' as const, marginTop: 7, paddingTop: 7 };

  const documentTitle = `Invoice ${invoice.invoiceNumber}`;

  return (
    <Document
      title={documentTitle}
      author={text(invoice.business.name, 'Invoice Maker')}
      subject={documentTitle}
      creator="Invoice Maker"
      producer="Invoice Maker"
      language="en"
    >
      <Page size={paper.id === 'a4' ? 'A4' : 'LETTER'} style={s.page} wrap>
        {/* Masthead */}
        {spec.header === 'band' ? (
          <View style={s.band} fixed={false}>
            <Text style={[s.title, { color: bandInk }]}>Invoice</Text>
            <MetaBlock inverted />
          </View>
        ) : null}

        <View style={s.body}>
          {spec.header === 'split' ? (
            <View style={s.section}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                <View style={{ width: '58%' }}>
                  <BusinessBlock />
                </View>
                <View style={{ width: '40%', alignItems: 'flex-end' }}>
                  <Text style={[s.title, { color: titleColor }]}>Invoice</Text>
                  <View style={{ marginTop: 10 }}>
                    <MetaBlock />
                  </View>
                </View>
              </View>
              <View
                style={{ height: 2, backgroundColor: accent, marginTop: spec.space.section * 0.6 }}
              />
            </View>
          ) : null}

          {spec.header === 'stack' ? (
            <View style={s.section}>
              <Text style={[s.title, { color: titleColor }]}>Invoice</Text>
              <View
                style={[
                  s.row,
                  { marginTop: 14, justifyContent: 'space-between', alignItems: 'flex-start' },
                ]}
              >
                <View style={{ width: '58%' }}>
                  <BusinessBlock />
                </View>
                <View style={{ width: '40%' }}>
                  <MetaBlock />
                </View>
              </View>
            </View>
          ) : null}

          {/* Parties */}
          <View style={[s.row, s.section]}>
            {spec.header === 'band' ? (
              <View style={{ width: '33%', paddingRight: 14 }}>
                <Text style={s.label}>FROM</Text>
                <BusinessBlock />
              </View>
            ) : null}

            <View style={{ width: spec.header === 'band' ? '33%' : '50%', paddingRight: 14 }}>
              <Text style={s.label}>{spec.uppercaseLabels ? 'BILL TO' : 'Bill to'}</Text>
              <Text style={s.partyName}>{text(invoice.customer.name, PLACEHOLDERS.customerName)}</Text>
              <View style={{ marginTop: 2 }}>
                {text(invoice.customer.address)
                  .split('\n')
                  .filter(Boolean)
                  .map((line, index) => (
                    <Text key={index} style={s.muted}>
                      {line}
                    </Text>
                  ))}
                {invoice.customer.email ? <Text style={s.muted}>{invoice.customer.email}</Text> : null}
                {invoice.customer.phone ? <Text style={s.muted}>{invoice.customer.phone}</Text> : null}
                {invoice.customer.taxId ? (
                  <Text style={s.muted}>
                    {`${invoice.customer.taxIdLabel || 'Tax ID'}: ${invoice.customer.taxId}`}
                  </Text>
                ) : null}
              </View>
            </View>

            {invoice.customer.shippingAddress.trim() ? (
              <View style={{ width: spec.header === 'band' ? '33%' : '50%' }}>
                <Text style={s.label}>{spec.uppercaseLabels ? 'SHIP TO' : 'Ship to'}</Text>
                {invoice.customer.shippingAddress
                  .split('\n')
                  .filter(Boolean)
                  .map((line, index) => (
                    <Text key={index} style={s.muted}>
                      {line}
                    </Text>
                  ))}
              </View>
            ) : null}
          </View>

          {/* Line items. The header row is `fixed`, so it repeats on every page. */}
          <View style={{ marginBottom: spec.space.section * 0.7 }}>
            <View style={s.tableHeader} fixed>
              <Text style={[s.th, { width: columns.description }]}>
                {spec.uppercaseLabels ? 'DESCRIPTION' : 'Description'}
              </Text>
              <Text style={[s.th, { width: columns.qty, textAlign: 'right' }]}>
                {spec.uppercaseLabels ? 'QTY' : 'Qty'}
              </Text>
              <Text style={[s.th, { width: columns.rate, textAlign: 'right' }]}>
                {spec.uppercaseLabels ? 'RATE' : 'Rate'}
              </Text>
              {showDiscountColumn ? (
                <Text style={[s.th, { width: columns.disc, textAlign: 'right' }]}>
                  {spec.uppercaseLabels ? 'DISC.' : 'Disc.'}
                </Text>
              ) : null}
              {showTaxColumn ? (
                <Text style={[s.th, { width: columns.tax, textAlign: 'right' }]}>
                  {spec.uppercaseLabels ? 'TAX' : 'Tax'}
                </Text>
              ) : null}
              <Text style={[s.th, { width: columns.amount, textAlign: 'right' }]}>
                {spec.uppercaseLabels ? 'AMOUNT' : 'Amount'}
              </Text>
            </View>

            {invoice.items.map((item, index) => {
              const line = totals.items[index];
              if (!line) return null;
              return (
                // wrap={false} keeps a row whole; minPresenceAhead stops a row
                // being stranded alone at the foot of a page.
                <View key={item.id} style={s.tr} wrap={false} minPresenceAhead={28}>
                  <Text style={[s.td, { width: columns.description }]}>
                    {text(item.description, PLACEHOLDERS.itemDescription)}
                  </Text>
                  <Text style={[s.td, { width: columns.qty, textAlign: 'right' }]}>
                    {formatQuantity(line.quantity)}
                  </Text>
                  <Text style={[s.td, { width: columns.rate, textAlign: 'right' }]}>
                    {amountOnly(line.unitPrice)}
                  </Text>
                  {showDiscountColumn ? (
                    <Text style={[s.td, { width: columns.disc, textAlign: 'right', color: MUTED }]}>
                      {line.discount === ZERO
                        ? '—'
                        : item.discount.mode === 'percent'
                          ? `${formatQuantity(parseDec(item.discount.value))}%`
                          : `-${amountOnly(line.discount)}`}
                    </Text>
                  ) : null}
                  {showTaxColumn ? (
                    <Text style={[s.td, { width: columns.tax, textAlign: 'right', color: MUTED }]}>
                      {parseDec(item.tax.value) === ZERO
                        ? '—'
                        : item.tax.mode === 'percent'
                          ? `${formatQuantity(parseDec(item.tax.value))}%`
                          : amountOnly(line.tax)}
                    </Text>
                  ) : null}
                  <Text style={[s.td, { width: columns.amount, textAlign: 'right' }]}>
                    {amountOnly(line.net)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Totals: held together on one page. */}
          <View style={s.totalsWrap} wrap={false}>
            <View style={s.totalsInner}>
              <TotalLine term="Subtotal" value={amountOnly(totals.subtotal)} />
              {totals.itemDiscountTotal !== ZERO ? (
                <TotalLine term="Item discounts" value={`-${amountOnly(totals.itemDiscountTotal)}`} dim />
              ) : null}
              {totals.invoiceDiscount !== ZERO ? (
                <TotalLine
                  term={
                    invoice.discount.mode === 'percent'
                      ? `Discount (${formatQuantity(parseDec(invoice.discount.value))}%)`
                      : 'Discount'
                  }
                  value={`-${amountOnly(totals.invoiceDiscount)}`}
                  dim
                />
              ) : null}
              {totals.taxGroups.map((group) => (
                <TotalLine
                  key={group.key}
                  term={
                    group.rate === null
                      ? group.label
                      : `${group.label} (${formatQuantity(group.rate)}%)`
                  }
                  value={amountOnly(group.amount)}
                />
              ))}
              {totals.shipping !== ZERO ? (
                <TotalLine term="Shipping" value={amountOnly(totals.shipping)} />
              ) : null}
              {totals.fees !== ZERO ? (
                <TotalLine term={invoice.feesLabel || 'Fees'} value={amountOnly(totals.fees)} />
              ) : null}
              {invoice.options.showPaid ? (
                <>
                  <TotalLine term="Total" value={money(totals.total)} strong />
                  <TotalLine term="Paid" value={`-${amountOnly(totals.amountPaid)}`} dim />
                </>
              ) : null}

              <View
                style={[
                  grandTotalStyle,
                  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
                ]}
              >
                <Text
                  style={{
                    ...semibold,
                    fontSize: spec.fontSize.sectionLabel,
                    letterSpacing: track(spec.fontSize.sectionLabel),
                    color: spec.accent === 'text' ? accent : INK,
                  }}
                >
                  {invoice.options.showPaid ? 'AMOUNT DUE' : 'TOTAL DUE'}
                </Text>
                <Text style={{ ...bold, fontSize: spec.fontSize.total }}>
                  {money(invoice.options.showPaid ? totals.amountDue : totals.total)}
                </Text>
              </View>

              <Text style={s.footerNote}>{`All amounts in ${currency.code}`}</Text>
            </View>
          </View>

          {/* Notes */}
          {invoice.notes.trim() || invoice.terms.trim() ? (
            <View
              style={[
                s.row,
                {
                  borderTopWidth: 1,
                  borderTopColor: HAIRLINE,
                  borderTopStyle: 'solid',
                  paddingTop: spec.space.section * 0.6,
                },
              ]}
              wrap={false}
            >
              {invoice.notes.trim() ? (
                <View style={{ width: '50%', paddingRight: 14 }}>
                  <Text style={s.label}>{spec.uppercaseLabels ? 'NOTES' : 'Notes'}</Text>
                  <Text style={s.muted}>{invoice.notes.trim()}</Text>
                </View>
              ) : null}
              {invoice.terms.trim() ? (
                <View style={{ width: '50%' }}>
                  <Text style={s.label}>{spec.uppercaseLabels ? 'TERMS' : 'Terms'}</Text>
                  <Text style={s.muted}>{invoice.terms.trim()}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Page numbers appear only once the invoice runs past one page. */}
        <Text
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : ''
          }
          fixed
        />
      </Page>
    </Document>
  );
}
