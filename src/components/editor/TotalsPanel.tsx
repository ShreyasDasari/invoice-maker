'use client';

/**
 * Totals.
 *
 * Read-only figures on the right, the controls that change them on the left.
 * Shipping, fees and part-payment are folded away until switched on: most
 * invoices have none of them, and an empty field is still something to read
 * past.
 */

import { TextField, Toggle } from '@/components/ui/Field';
import type { Adjustment, Invoice } from '@/lib/invoice';
import type { InvoiceTotals } from '@/lib/calc';
import { formatMoney } from '@/lib/format';
import { ZERO } from '@/lib/money';
import { formatQuantity } from '@/lib/format';
import { parseDec } from '@/lib/money';
import { t } from '@/lib/i18n';
import { Panel } from './Panel';

interface TotalsPanelProps {
  invoice: Invoice;
  totals: InvoiceTotals;
  locale: string;
  onPatch: (patch: Partial<Invoice>) => void;
  onToggleOption: (patch: Partial<Invoice['options']>) => void;
  onSharedTaxChange: (tax: Adjustment) => void;
}

/** A label/amount pair in the summary column. */
function SummaryRow({
  term,
  amount,
  strong = false,
  dim = false,
}: {
  term: string;
  amount: string;
  strong?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 ${
        strong ? 'border-t border-line-strong pt-2 mt-1' : ''
      }`}
    >
      <span
        className={
          strong
            ? 'text-[13px] font-semibold uppercase tracking-[0.06em] text-ink'
            : `text-[13px] ${dim ? 'text-ink-subtle' : 'text-ink-muted'}`
        }
      >
        {term}
      </span>
      <span
        className={`tabular ${
          strong ? 'text-lg font-bold text-ink' : `text-[13px] font-medium ${dim ? 'text-ink-subtle' : 'text-ink'}`
        }`}
      >
        {amount}
      </span>
    </div>
  );
}

export function TotalsPanel({
  invoice,
  totals,
  locale,
  onPatch,
  onToggleOption,
  onSharedTaxChange,
}: TotalsPanelProps) {
  const money = (value: bigint) => formatMoney(value, invoice.currency, locale);
  const sharedTax = invoice.items[0]?.tax ?? { mode: 'percent' as const, value: '' };

  return (
    <Panel title={t.sections.totals}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {/* Controls */}
        <div className="flex flex-col gap-3">
          {!invoice.options.perItemTax ? (
            <div className="flex items-end gap-1">
              <TextField
                label={`${t.fields.tax} rate`}
                numeric
                inputMode="decimal"
                value={sharedTax.value}
                placeholder="0"
                maxLength={12}
                className="min-w-0 flex-1"
                hint="Applies to every line"
                onChange={(event) =>
                  onSharedTaxChange({ ...sharedTax, value: event.target.value })
                }
              />
              <button
                type="button"
                onClick={() =>
                  onSharedTaxChange({
                    ...sharedTax,
                    mode: sharedTax.mode === 'percent' ? 'fixed' : 'percent',
                  })
                }
                aria-label={`Tax is ${
                  sharedTax.mode === 'percent' ? 'a percentage' : 'a fixed amount'
                }. Switch to ${sharedTax.mode === 'percent' ? 'a fixed amount' : 'a percentage'}.`}
                title={
                  sharedTax.mode === 'percent'
                    ? 'Switch to a fixed amount'
                    : 'Switch to a percentage'
                }
                className="mb-6 h-11 w-9 shrink-0 cursor-pointer rounded-md border border-line bg-surface text-[13px] font-semibold text-ink-muted transition-colors duration-150 hover:border-line-strong hover:text-ink sm:h-9"
              >
                {sharedTax.mode === 'percent' ? '%' : invoice.currency.slice(0, 3)}
              </button>
            </div>
          ) : null}

          {!invoice.options.perItemTax ? (
            <TextField
              label="Tax label"
              value={sharedTax.label ?? ''}
              placeholder="Tax"
              maxLength={24}
              hint="VAT, GST, Sales tax…"
              onChange={(event) => onSharedTaxChange({ ...sharedTax, label: event.target.value })}
            />
          ) : null}

          <div className="flex items-end gap-1">
            <TextField
              label={`Invoice ${t.fields.discount.toLowerCase()}`}
              numeric
              inputMode="decimal"
              value={invoice.discount.value}
              placeholder="0"
              maxLength={12}
              className="min-w-0 flex-1"
              onChange={(event) =>
                onPatch({ discount: { ...invoice.discount, value: event.target.value } })
              }
            />
            <button
              type="button"
              onClick={() =>
                onPatch({
                  discount: {
                    ...invoice.discount,
                    mode: invoice.discount.mode === 'percent' ? 'fixed' : 'percent',
                  },
                })
              }
              aria-label={`Discount is ${
                invoice.discount.mode === 'percent' ? 'a percentage' : 'a fixed amount'
              }. Switch to ${invoice.discount.mode === 'percent' ? 'a fixed amount' : 'a percentage'}.`}
              title={
                invoice.discount.mode === 'percent'
                  ? 'Switch to a fixed amount'
                  : 'Switch to a percentage'
              }
              className="mb-px h-11 w-9 shrink-0 cursor-pointer rounded-md border border-line bg-surface text-[13px] font-semibold text-ink-muted transition-colors duration-150 hover:border-line-strong hover:text-ink sm:h-9"
            >
              {invoice.discount.mode === 'percent' ? '%' : invoice.currency.slice(0, 3)}
            </button>
          </div>

          {invoice.options.showShipping ? (
            <TextField
              label={t.fields.shipping}
              numeric
              inputMode="decimal"
              value={invoice.shipping}
              placeholder="0.00"
              maxLength={16}
              onChange={(event) => onPatch({ shipping: event.target.value })}
            />
          ) : null}

          {invoice.options.showFees ? (
            <div className="grid grid-cols-[minmax(0,6.5rem)_1fr] gap-2">
              <TextField
                label="Label"
                value={invoice.feesLabel}
                placeholder="Fees"
                maxLength={24}
                onChange={(event) => onPatch({ feesLabel: event.target.value })}
              />
              <TextField
                label={t.fields.fees}
                numeric
                inputMode="decimal"
                value={invoice.fees}
                placeholder="0.00"
                maxLength={16}
                onChange={(event) => onPatch({ fees: event.target.value })}
              />
            </div>
          ) : null}

          {invoice.options.showPaid ? (
            <TextField
              label={t.fields.amountPaid}
              numeric
              inputMode="decimal"
              value={invoice.amountPaid}
              placeholder="0.00"
              maxLength={16}
              onChange={(event) => onPatch({ amountPaid: event.target.value })}
            />
          ) : null}

          <div className="flex flex-col gap-2 pt-1">
            <Toggle
              label={t.fields.shipping}
              checked={invoice.options.showShipping}
              onChange={(next) => onToggleOption({ showShipping: next })}
            />
            <Toggle
              label="Other fees"
              checked={invoice.options.showFees}
              onChange={(next) => onToggleOption({ showFees: next })}
            />
            <Toggle
              label="Part payment received"
              checked={invoice.options.showPaid}
              onChange={(next) => onToggleOption({ showPaid: next })}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3.5">
          <SummaryRow term={t.fields.subtotal} amount={money(totals.subtotal)} />

          {totals.itemDiscountTotal !== ZERO ? (
            <SummaryRow
              term="Item discounts"
              amount={`-${money(totals.itemDiscountTotal)}`}
              dim
            />
          ) : null}

          {totals.invoiceDiscount !== ZERO ? (
            <SummaryRow
              term={
                invoice.discount.mode === 'percent'
                  ? `Discount (${formatQuantity(parseDec(invoice.discount.value))}%)`
                  : 'Discount'
              }
              amount={`-${money(totals.invoiceDiscount)}`}
              dim
            />
          ) : null}

          {totals.taxGroups.map((group) => (
            <SummaryRow
              key={group.key}
              term={
                group.rate === null
                  ? group.label
                  : `${group.label} (${formatQuantity(group.rate)}%)`
              }
              amount={money(group.amount)}
            />
          ))}

          {totals.shipping !== ZERO ? (
            <SummaryRow term={t.fields.shipping} amount={money(totals.shipping)} />
          ) : null}

          {totals.fees !== ZERO ? (
            <SummaryRow term={invoice.feesLabel || t.fields.fees} amount={money(totals.fees)} />
          ) : null}

          {invoice.options.showPaid ? (
            <>
              <SummaryRow term={t.fields.total} amount={money(totals.total)} />
              <SummaryRow term={t.fields.amountPaid} amount={`-${money(totals.amountPaid)}`} dim />
              <SummaryRow term={t.fields.amountDue} amount={money(totals.amountDue)} strong />
            </>
          ) : (
            <SummaryRow term={t.fields.total} amount={money(totals.total)} strong />
          )}
        </div>
      </div>
    </Panel>
  );
}
