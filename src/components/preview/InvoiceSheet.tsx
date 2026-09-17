'use client';

/**
 * The invoice document, as HTML.
 *
 * One component renders all three templates: what differs between them lives in
 * the template spec, not in three near-identical files. Geometry comes from that
 * spec in points and is converted once here, so the preview is a true scale
 * model of the PDF rather than a lookalike.
 *
 * This is a document, not UI: it stays on white paper in dark mode, and it is
 * the only thing that survives the print stylesheet.
 */

import type { CSSProperties } from 'react';
import type { InvoiceTotals } from '@/lib/calc';
import type { Invoice } from '@/lib/invoice';
import { PLACEHOLDERS } from '@/lib/invoice';
import { formatAmount, formatDate, formatMoney, formatQuantity, formatRate, type DateFormatId } from '@/lib/format';
import { getCurrency } from '@/lib/currency';
import { ZERO, parseDec } from '@/lib/money';
import { getPaper, getTemplate, onAccent, safeHex, scaleTemplate, tint } from '@/lib/templates';
import { getFont } from '@/lib/fonts';

/** PDF points to CSS pixels at 96dpi. */
const PT = 96 / 72;

export interface InvoiceSheetProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  dateStyle: DateFormatId;
  /** Renders placeholder text for empty fields, so the preview reads as a document. */
  showPlaceholders?: boolean;
  /** Proportional shrink from "Fit to one page". */
  fitScale?: number;
  /** Ignores the fit scale — used by the hidden sheet that measures it. */
  measuring?: boolean;
}

export function InvoiceSheet({
  invoice,
  totals,
  locale,
  dateStyle,
  showPlaceholders = true,
  fitScale = 1,
  measuring = false,
}: InvoiceSheetProps) {
  const spec = scaleTemplate(
    getTemplate(invoice.template),
    !measuring && invoice.options.fitToPage ? fitScale : 1,
  );
  const paper = getPaper(invoice.paperSize);
  const font = getFont(invoice.branding.fontStyle);
  const accent = safeHex(invoice.branding.accentColor);
  const currency = getCurrency(invoice.currency);

  const ink = '#0A0A0A';
  const muted = '#525252';
  const hairline = '#D9D9D9';

  const sheetVars = {
    '--sheet-width': `${paper.width * PT}px`,
    // While measuring, the sheet must be free to grow past one page so its
    // natural height can be read; otherwise it holds the true page height.
    '--sheet-height': measuring ? '0px' : `${paper.height * PT}px`,
    '--sheet-padding': `${spec.space.page * PT}px`,
    '--sheet-font': font.css,
    '--sheet-body': `${spec.fontSize.body * PT}px`,
    // The PDF renderer's intrinsic leading for this face, so a block of text
    // is the same height here as in the download.
    '--sheet-leading': `${font.leading}`,
  } as CSSProperties;

  const label = (text: string) => (
    <span
      style={{
        fontSize: spec.fontSize.sectionLabel * PT,
        letterSpacing: spec.uppercaseLabels ? '0.055em' : '0',
        textTransform: spec.uppercaseLabels ? 'uppercase' : 'none',
        color: muted,
        fontWeight: 600,
        display: 'block',
        marginBottom: 3 * PT,
      }}
    >
      {text}
    </span>
  );

  const value = (text: string, placeholder?: string) => {
    const trimmed = text.trim();
    if (trimmed) return trimmed;
    return showPlaceholders && placeholder ? placeholder : '';
  };

  /** Address blocks keep the user's own line breaks. */
  const multiline = (text: string, placeholder?: string) => {
    const content = value(text, placeholder);
    if (!content) return null;
    return content.split('\n').map((line, index) => (
      <span key={index} style={{ display: 'block' }}>
        {line || ' '}
      </span>
    ));
  };

  const isPlaceholder = (text: string) => !text.trim();

  const money = (amount: bigint) => formatMoney(amount, invoice.currency, locale);
  const amountOnly = (amount: bigint) => formatAmount(amount, invoice.currency, locale);

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
  const headerInk = spec.tableHeaderFill === 'accent' ? onAccent(accent) : ink;

  // --- Masthead -------------------------------------------------------------

  const logo = invoice.business.logo ? (
    // eslint-disable-next-line @next/next/no-img-element -- a user data URL, not an optimisable asset
    <img
      src={invoice.business.logo}
      alt={`${value(invoice.business.name, PLACEHOLDERS.businessName)} logo`}
      style={{ maxHeight: 54 * PT, maxWidth: 190 * PT, objectFit: 'contain', display: 'block' }}
    />
  ) : null;

  const businessBlock = (
    <div style={{ minWidth: 0 }}>
      {logo ? <div style={{ marginBottom: 8 * PT }}>{logo}</div> : null}
      <div
        style={{
          fontSize: (spec.fontSize.body + 2.5) * PT,
          fontWeight: 700,
          color: ink,
          lineHeight: 1.25,
          opacity: isPlaceholder(invoice.business.name) ? 0.42 : 1,
        }}
      >
        {value(invoice.business.name, PLACEHOLDERS.businessName)}
      </div>
      <div style={{ color: muted, marginTop: 3 * PT, lineHeight: 1.45 }}>
        {multiline(invoice.business.address, showPlaceholders ? PLACEHOLDERS.businessAddress : '')}
        {invoice.business.email ? <span style={{ display: 'block' }}>{invoice.business.email}</span> : null}
        {invoice.business.phone ? <span style={{ display: 'block' }}>{invoice.business.phone}</span> : null}
        {invoice.business.website ? <span style={{ display: 'block' }}>{invoice.business.website}</span> : null}
        {invoice.business.taxId ? (
          <span style={{ display: 'block' }}>
            {invoice.business.taxIdLabel || 'Tax ID'}: {invoice.business.taxId}
          </span>
        ) : null}
      </div>
    </div>
  );

  const title = (
    <div
      style={{
        fontSize: spec.fontSize.docTitle * PT,
        fontWeight: spec.id === 'minimal' ? 500 : 700,
        letterSpacing: spec.id === 'minimal' ? '0.075em' : '-0.02em',
        textTransform: spec.id === 'minimal' ? 'uppercase' : 'none',
        color: spec.accent === 'text' ? accent : spec.header === 'band' ? onAccent(accent) : ink,
        lineHeight: 1,
      }}
    >
      Invoice
    </div>
  );

  /** Invoice number, dates and terms, as a compact definition list. */
  const metaRows: { term: string; value: string }[] = [
    { term: 'Invoice no.', value: invoice.invoiceNumber || '—' },
    { term: 'Issue date', value: formatDate(invoice.issueDate, dateStyle) },
    { term: 'Due date', value: formatDate(invoice.dueDate, dateStyle) },
  ];
  if (invoice.paymentTerms.trim()) metaRows.push({ term: 'Terms', value: invoice.paymentTerms });
  if (invoice.poNumber.trim()) metaRows.push({ term: 'PO number', value: invoice.poNumber });

  const metaBlock = (inverted = false) => (
    <table
      style={{
        borderCollapse: 'collapse',
        fontSize: spec.fontSize.small * PT,
        marginLeft: spec.header === 'stack' ? 0 : 'auto',
      }}
    >
      <tbody>
        {metaRows.map((row) => (
          <tr key={row.term}>
            <td
              style={{
                paddingRight: 10 * PT,
                paddingTop: 1.5 * PT,
                paddingBottom: 1.5 * PT,
                color: inverted ? 'rgba(255,255,255,0.78)' : muted,
                whiteSpace: 'nowrap',
                textAlign: spec.header === 'stack' ? 'left' : 'right',
              }}
            >
              {row.term}
            </td>
            <td
              className="tabular"
              style={{
                paddingTop: 1.5 * PT,
                paddingBottom: 1.5 * PT,
                color: inverted ? '#FFFFFF' : ink,
                fontWeight: 600,
                textAlign: spec.header === 'stack' ? 'left' : 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const header = (() => {
    if (spec.header === 'band') {
      return (
        <div
          style={{
            background: accent,
            margin: `${-spec.space.page * PT}px ${-spec.space.page * PT}px ${spec.space.section * PT}px`,
            padding: `${(spec.space.page - 6) * PT}px ${spec.space.page * PT}px ${(spec.space.page - 10) * PT}px`,
            borderRadius: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 * PT }}>
            {title}
            {metaBlock(true)}
          </div>
        </div>
      );
    }

    if (spec.header === 'stack') {
      return (
        <div style={{ marginBottom: spec.space.section * PT }}>
          {title}
          <div
            style={{
              marginTop: 14 * PT,
              display: 'flex',
              gap: 32 * PT,
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            {businessBlock}
            {metaBlock()}
          </div>
        </div>
      );
    }

    // Split: business on the left, title and meta on the right, under a rule.
    return (
      <div style={{ marginBottom: spec.space.section * PT }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 * PT }}>
          {businessBlock}
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            {title}
            <div style={{ marginTop: 10 * PT }}>{metaBlock()}</div>
          </div>
        </div>
        <div style={{ height: 2, background: accent, marginTop: spec.space.section * 0.6 * PT }} />
      </div>
    );
  })();

  // --- Parties --------------------------------------------------------------

  const parties = (
    <div
      style={{
        display: 'flex',
        gap: 28 * PT,
        marginBottom: spec.space.section * PT,
        alignItems: 'flex-start',
      }}
    >
      {spec.header === 'stack' ? null : spec.header === 'band' ? (
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          {label('From')}
          {businessBlock}
        </div>
      ) : null}

      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        {label('Bill to')}
        <div
          style={{
            fontWeight: 700,
            color: ink,
            opacity: isPlaceholder(invoice.customer.name) ? 0.42 : 1,
          }}
        >
          {value(invoice.customer.name, PLACEHOLDERS.customerName)}
        </div>
        <div style={{ color: muted, marginTop: 2 * PT, lineHeight: 1.45 }}>
          {multiline(invoice.customer.address, showPlaceholders ? PLACEHOLDERS.customerAddress : '')}
          {invoice.customer.email ? <span style={{ display: 'block' }}>{invoice.customer.email}</span> : null}
          {invoice.customer.phone ? <span style={{ display: 'block' }}>{invoice.customer.phone}</span> : null}
          {invoice.customer.taxId ? (
            <span style={{ display: 'block' }}>
              {invoice.customer.taxIdLabel || 'Tax ID'}: {invoice.customer.taxId}
            </span>
          ) : null}
        </div>
      </div>

      {invoice.customer.shippingAddress.trim() ? (
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          {label('Ship to')}
          <div style={{ color: muted, lineHeight: 1.45 }}>
            {multiline(invoice.customer.shippingAddress)}
          </div>
        </div>
      ) : null}
    </div>
  );

  // --- Line items -----------------------------------------------------------

  const cellPad = `${spec.space.cell * PT}px ${6 * PT}px`;
  const headCellStyle: CSSProperties = {
    padding: cellPad,
    fontSize: spec.fontSize.sectionLabel * PT,
    fontWeight: 600,
    letterSpacing: spec.uppercaseLabels ? '0.055em' : '0',
    textTransform: spec.uppercaseLabels ? 'uppercase' : 'none',
    color: headerInk,
    borderBottom: spec.tableHeaderFill === 'none' ? `1px solid ${ink}` : 'none',
    whiteSpace: 'nowrap',
  };

  const items = (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: spec.space.section * 0.7 * PT,
      }}
    >
      <thead style={{ background: headerFill }}>
        <tr>
          <th style={{ ...headCellStyle, textAlign: 'left', paddingLeft: spec.tableHeaderFill === 'none' ? 0 : 6 * PT }}>
            Description
          </th>
          <th style={{ ...headCellStyle, textAlign: 'right', width: '9%' }}>Qty</th>
          <th style={{ ...headCellStyle, textAlign: 'right', width: '15%' }}>Rate</th>
          {showDiscountColumn ? (
            <th style={{ ...headCellStyle, textAlign: 'right', width: '12%' }}>Disc.</th>
          ) : null}
          {showTaxColumn ? (
            <th style={{ ...headCellStyle, textAlign: 'right', width: '10%' }}>Tax</th>
          ) : null}
          <th
            style={{
              ...headCellStyle,
              textAlign: 'right',
              width: '17%',
              paddingRight: spec.tableHeaderFill === 'none' ? 0 : 6 * PT,
            }}
          >
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {invoice.items.map((item, index) => {
          const line = totals.items[index];
          if (!line) return null;
          const blank = !item.description.trim() && !item.unitPrice.trim();
          const cell: CSSProperties = {
            padding: cellPad,
            borderBottom: spec.rowDividers ? `1px solid ${hairline}` : 'none',
            verticalAlign: 'top',
            color: ink,
          };
          return (
            <tr key={item.id}>
              <td style={{ ...cell, paddingLeft: spec.tableHeaderFill === 'none' ? 0 : 6 * PT }}>
                <span
                  style={{
                    // A word with no spaces (a long URL) must wrap, not overflow.
                    overflowWrap: 'anywhere',
                    opacity: blank && showPlaceholders ? 0.42 : 1,
                  }}
                >
                  {value(item.description, showPlaceholders ? PLACEHOLDERS.itemDescription : '')}
                </span>
              </td>
              <td className="tabular" style={{ ...cell, textAlign: 'right' }}>
                {formatQuantity(line.quantity)}
              </td>
              <td className="tabular" style={{ ...cell, textAlign: 'right' }}>
                {amountOnly(line.unitPrice)}
              </td>
              {showDiscountColumn ? (
                <td className="tabular" style={{ ...cell, textAlign: 'right', color: muted }}>
                  {line.discount === ZERO
                    ? '—'
                    : item.discount.mode === 'percent'
                      ? formatRate(parseDec(item.discount.value))
                      : `-${amountOnly(line.discount)}`}
                </td>
              ) : null}
              {showTaxColumn ? (
                <td className="tabular" style={{ ...cell, textAlign: 'right', color: muted }}>
                  {parseDec(item.tax.value) === ZERO
                    ? '—'
                    : item.tax.mode === 'percent'
                      ? formatRate(parseDec(item.tax.value))
                      : amountOnly(line.tax)}
                </td>
              ) : null}
              <td
                className="tabular"
                style={{
                  ...cell,
                  textAlign: 'right',
                  fontWeight: 500,
                  paddingRight: spec.tableHeaderFill === 'none' ? 0 : 6 * PT,
                }}
              >
                {amountOnly(line.net)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // --- Totals ---------------------------------------------------------------

  const totalRow = (
    term: string,
    amount: string,
    options: { strong?: boolean; muted?: boolean } = {},
  ) => (
    <tr key={term}>
      <td
        style={{
          padding: `${3 * PT}px ${12 * PT}px ${3 * PT}px 0`,
          textAlign: 'right',
          color: options.strong ? ink : muted,
          fontWeight: options.strong ? 600 : 400,
          whiteSpace: 'nowrap',
          fontSize: options.strong ? spec.fontSize.body * PT : spec.fontSize.small * PT,
        }}
      >
        {term}
      </td>
      <td
        className="tabular"
        style={{
          padding: `${3 * PT}px 0`,
          textAlign: 'right',
          color: options.muted ? muted : ink,
          fontWeight: options.strong ? 700 : 500,
          whiteSpace: 'nowrap',
          fontSize: options.strong ? spec.fontSize.body * PT : spec.fontSize.small * PT,
          minWidth: 90 * PT,
        }}
      >
        {amount}
      </td>
    </tr>
  );

  const grandTotalBlock = (
    <div
      style={
        spec.totals === 'box'
          ? {
              background: tint(accent, 0.9),
              border: `1px solid ${tint(accent, 0.7)}`,
              borderRadius: spec.radius,
              padding: `${9 * PT}px ${12 * PT}px`,
              marginTop: 8 * PT,
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 16 * PT,
            }
          : spec.totals === 'rule'
            ? {
                borderTop: `2px solid ${ink}`,
                marginTop: 7 * PT,
                paddingTop: 7 * PT,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16 * PT,
              }
            : {
                borderTop: `1px solid ${hairline}`,
                marginTop: 7 * PT,
                paddingTop: 7 * PT,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16 * PT,
              }
      }
    >
      <span
        style={{
          fontSize: spec.fontSize.sectionLabel * PT,
          fontWeight: 600,
          letterSpacing: '0.055em',
          textTransform: 'uppercase',
          color: spec.accent === 'text' ? accent : ink,
        }}
      >
        {invoice.options.showPaid ? 'Amount due' : 'Total due'}
      </span>
      <span
        className="tabular"
        style={{
          fontSize: spec.fontSize.total * PT,
          fontWeight: 700,
          color: ink,
          letterSpacing: '-0.01em',
        }}
      >
        {money(invoice.options.showPaid ? totals.amountDue : totals.total)}
      </span>
    </div>
  );

  const totalsBlock = (
    <div
      className="totals-block"
      style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spec.space.section * PT }}
    >
      <div style={{ minWidth: '54%', maxWidth: '62%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {totalRow('Subtotal', amountOnly(totals.subtotal))}
            {totals.itemDiscountTotal !== ZERO
              ? totalRow('Item discounts', `-${amountOnly(totals.itemDiscountTotal)}`, { muted: true })
              : null}
            {totals.invoiceDiscount !== ZERO
              ? totalRow(
                  invoice.discount.mode === 'percent'
                    ? `Discount (${formatQuantity(parseDec(invoice.discount.value))}%)`
                    : 'Discount',
                  `-${amountOnly(totals.invoiceDiscount)}`,
                  { muted: true },
                )
              : null}
            {totals.taxGroups.map((group) =>
              totalRow(
                group.rate === null ? group.label : `${group.label} (${formatQuantity(group.rate)}%)`,
                amountOnly(group.amount),
              ),
            )}
            {totals.shipping !== ZERO ? totalRow('Shipping', amountOnly(totals.shipping)) : null}
            {totals.fees !== ZERO
              ? totalRow(invoice.feesLabel || 'Fees', amountOnly(totals.fees))
              : null}
            {invoice.options.showPaid ? (
              <>
                {totalRow('Total', money(totals.total), { strong: true })}
                {totalRow('Paid', `-${amountOnly(totals.amountPaid)}`, { muted: true })}
              </>
            ) : null}
          </tbody>
        </table>
        {grandTotalBlock}
        <div
          style={{
            marginTop: 5 * PT,
            textAlign: 'right',
            fontSize: spec.fontSize.small * 0.92 * PT,
            color: muted,
          }}
        >
          All amounts in {currency.code}
        </div>
      </div>
    </div>
  );

  // --- Notes ----------------------------------------------------------------

  const notes =
    invoice.notes.trim() || invoice.terms.trim() ? (
      <div
        className="notes-block"
        style={{
          display: 'flex',
          gap: 28 * PT,
          borderTop: `1px solid ${hairline}`,
          paddingTop: spec.space.section * 0.6 * PT,
        }}
      >
        {invoice.notes.trim() ? (
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {label('Notes')}
            <div style={{ color: muted, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
              {multiline(invoice.notes)}
            </div>
          </div>
        ) : null}
        {invoice.terms.trim() ? (
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            {label('Terms')}
            <div style={{ color: muted, lineHeight: 1.5, overflowWrap: 'anywhere' }}>
              {multiline(invoice.terms)}
            </div>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <article
      className="sheet"
      style={sheetVars}
      aria-label={`Invoice ${invoice.invoiceNumber} preview`}
    >
      {header}
      {parties}
      {items}
      {totalsBlock}
      {notes}
    </article>
  );
}
