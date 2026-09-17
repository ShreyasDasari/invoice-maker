/**
 * Invoice totals engine.
 *
 * Every figure here is derived, never stored. The rules, in order:
 *
 *  1. Line gross      = quantity x unit price
 *  2. Line discount   = item-level percentage or flat amount (never below zero net)
 *  3. Line net        = gross - discount, rounded to the currency's precision
 *  4. Subtotal        = sum of rounded line nets (so the column adds up by hand)
 *  5. Invoice discount is applied to the subtotal, then allocated back across
 *     lines by the largest-remainder method so no minor unit is lost
 *  6. Tax             = each rate group's taxable amounts are summed, then the
 *                       rate is applied once and allocated back over its lines
 *                       (rounding per line and summing would drift)
 *  7. Total           = taxable base + tax + shipping + fees
 *  8. Amount due      = total - amount paid
 *
 * Rounding happens at each presented figure, half away from zero, at the
 * currency's own precision — 2 digits for USD, 0 for JPY, 3 for KWD.
 */

import {
  type Dec,
  ZERO,
  add,
  allocate,
  fromInt,
  max,
  min,
  mul,
  parseDec,
  pct,
  roundTo,
  sub,
  sum,
} from './money';
import { currencyDecimals } from './currency';
import type { Adjustment, Invoice, LineItem } from './invoice';

export interface ItemTotals {
  id: string;
  quantity: Dec;
  unitPrice: Dec;
  gross: Dec;
  /** Item-level discount amount (positive). */
  discount: Dec;
  /** gross - discount. This is the amount shown in the line's Amount column. */
  net: Dec;
  /** Share of the invoice-level discount attributed to this line. */
  allocatedDiscount: Dec;
  /** net - allocatedDiscount: what tax is charged on. */
  taxable: Dec;
  tax: Dec;
}

export interface TaxGroup {
  key: string;
  label: string;
  /** Percentage rate, or null for flat-amount taxes. */
  rate: Dec | null;
  amount: Dec;
}

export interface InvoiceTotals {
  currency: string;
  decimals: number;
  items: ItemTotals[];
  /** Sum of line grosses before any discount. */
  gross: Dec;
  /** Total of item-level discounts. */
  itemDiscountTotal: Dec;
  /** Sum of line nets (after item discounts). */
  subtotal: Dec;
  /** Invoice-level discount amount (positive). */
  invoiceDiscount: Dec;
  /** subtotal - invoiceDiscount. */
  taxableBase: Dec;
  taxGroups: TaxGroup[];
  taxTotal: Dec;
  shipping: Dec;
  fees: Dec;
  total: Dec;
  amountPaid: Dec;
  amountDue: Dec;
}

/** Resolve an adjustment against a base amount, rounded to currency precision. */
function adjustmentAmount(adjustment: Adjustment, base: Dec, decimals: number): Dec {
  const value = parseDec(adjustment.value);
  if (value === ZERO) return ZERO;
  const raw = adjustment.mode === 'percent' ? pct(base, value) : value;
  return roundTo(raw, decimals);
}

function hasAdjustment(adjustment: Adjustment): boolean {
  return parseDec(adjustment.value) !== ZERO;
}

/**
 * The tax rate in force for a line: its own when per-item tax is on, otherwise
 * the shared rate, which lives on the first item and is mirrored to the rest.
 */
function effectiveTax(invoice: Invoice, item: LineItem): Adjustment {
  if (invoice.options.perItemTax) return item.tax;
  return invoice.items[0]?.tax ?? item.tax;
}

function effectiveDiscount(invoice: Invoice, item: LineItem): Adjustment | null {
  return invoice.options.perItemDiscount ? item.discount : null;
}

export function computeTotals(invoice: Invoice): InvoiceTotals {
  const decimals = currencyDecimals(invoice.currency);
  const round = (v: Dec): Dec => roundTo(v, decimals);

  // --- Pass 1: line gross, item discount, line net -------------------------
  const base = invoice.items.map((item) => {
    const quantity = parseDec(item.quantity);
    const unitPrice = parseDec(item.unitPrice);
    const gross = round(mul(quantity, unitPrice));

    const itemDiscountDef = effectiveDiscount(invoice, item);
    let discount = itemDiscountDef ? adjustmentAmount(itemDiscountDef, gross, decimals) : ZERO;
    // A flat discount may not exceed the line, and may not flip its sign.
    if (gross >= ZERO) discount = min(max(discount, ZERO), gross);
    else discount = ZERO;

    const net = sub(gross, discount);
    return { item, quantity, unitPrice, gross, discount, net };
  });

  const gross = sum(base.map((b) => b.gross));
  const itemDiscountTotal = sum(base.map((b) => b.discount));
  const subtotal = sum(base.map((b) => b.net));

  // --- Invoice-level discount, allocated proportionally --------------------
  let invoiceDiscount = hasAdjustment(invoice.discount)
    ? adjustmentAmount(invoice.discount, subtotal, decimals)
    : ZERO;
  if (subtotal >= ZERO) invoiceDiscount = min(max(invoiceDiscount, ZERO), subtotal);
  else invoiceDiscount = ZERO;

  // Weight by line net so bigger lines absorb more of the discount. Negative
  // nets (credits) get no share, which keeps the allocation stable.
  const weights = base.map((b) => max(b.net, ZERO));
  const allocations =
    invoiceDiscount === ZERO
      ? base.map(() => ZERO)
      : allocate(invoiceDiscount, weights, decimals);

  const taxableBase = sub(subtotal, invoiceDiscount);

  // --- Pass 2: tax, computed per rate group on its summed base -------------
  //
  // Tax is deliberately NOT computed line by line and then added up. Rounding
  // each line to the currency's precision first and summing the results
  // accumulates up to half a minor unit of error per line: on a hundred lines
  // that is a visible discrepancy against the figure a tax authority or an
  // accounting system arrives at. Instead each rate group's taxable amounts are
  // summed first and the rate is applied once, then the result is allocated
  // back across the group's lines so the per-line column still adds up to it.
  const taxables: Dec[] = base.map((b, index) => sub(b.net, allocations[index] ?? ZERO));

  interface TaxBucket {
    key: string;
    label: string;
    rate: Dec | null;
    mode: Adjustment['mode'];
    value: Dec;
    baseAmount: Dec;
    indices: number[];
  }

  const buckets = new Map<string, TaxBucket>();
  base.forEach((b, index) => {
    const taxDef = effectiveTax(invoice, b.item);
    const rateValue = parseDec(taxDef.value);
    if (rateValue === ZERO) return;

    const label = (taxDef.label ?? '').trim() || 'Tax';
    const key = `${label}|${taxDef.mode}|${taxDef.value}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.baseAmount = add(existing.baseAmount, taxables[index] ?? ZERO);
      existing.indices.push(index);
    } else {
      buckets.set(key, {
        key,
        label,
        rate: taxDef.mode === 'percent' ? rateValue : null,
        mode: taxDef.mode,
        value: rateValue,
        baseAmount: taxables[index] ?? ZERO,
        indices: [index],
      });
    }
  });

  const lineTax = new Array<Dec>(base.length).fill(ZERO);
  const taxGroups: TaxGroup[] = [];

  for (const bucket of buckets.values()) {
    let amount: Dec;
    if (bucket.mode === 'percent') {
      amount = round(pct(bucket.baseAmount, bucket.value));
      // Spread the group's tax back over its lines so the per-line column and
      // the summary row cannot disagree.
      const weights = bucket.indices.map((i) => max(taxables[i] ?? ZERO, ZERO));
      const shares = allocate(amount, weights, decimals);
      bucket.indices.forEach((i, position) => {
        lineTax[i] = shares[position] ?? ZERO;
      });
    } else {
      // A flat tax is charged once per line, so it is literal, not apportioned.
      const perLine = round(bucket.value);
      bucket.indices.forEach((i) => {
        lineTax[i] = perLine;
      });
      amount = mul(perLine, fromInt(bucket.indices.length));
    }

    taxGroups.push({ key: bucket.key, label: bucket.label, rate: bucket.rate, amount });
  }

  const items: ItemTotals[] = base.map((b, index) => ({
    id: b.item.id,
    quantity: b.quantity,
    unitPrice: b.unitPrice,
    gross: b.gross,
    discount: b.discount,
    net: b.net,
    allocatedDiscount: allocations[index] ?? ZERO,
    taxable: taxables[index] ?? ZERO,
    tax: lineTax[index] ?? ZERO,
  }));

  const taxTotal = sum(taxGroups.map((g) => g.amount));

  const shipping = invoice.options.showShipping ? round(parseDec(invoice.shipping)) : ZERO;
  const fees = invoice.options.showFees ? round(parseDec(invoice.fees)) : ZERO;
  const total = round(add(add(taxableBase, taxTotal), add(shipping, fees)));
  const amountPaid = invoice.options.showPaid ? round(parseDec(invoice.amountPaid)) : ZERO;
  const amountDue = sub(total, amountPaid);

  return {
    currency: invoice.currency,
    decimals,
    items,
    gross,
    itemDiscountTotal,
    subtotal,
    invoiceDiscount,
    taxableBase,
    taxGroups,
    taxTotal,
    shipping,
    fees,
    total,
    amountPaid,
    amountDue,
  };
}

/** Look up one line's computed figures. */
export function itemTotalsById(totals: InvoiceTotals, id: string): ItemTotals | undefined {
  return totals.items.find((i) => i.id === id);
}
