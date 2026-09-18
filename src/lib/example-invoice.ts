/**
 * The example invoice.
 *
 * Every template preview on the marketing pages renders this through the same
 * component the editor uses, so what a visitor sees before they start is
 * literally the document they will get — not a mockup, not a screenshot that
 * drifts the next time the template changes.
 *
 * The data is deliberately ordinary: a small studio billing a company for a
 * few lines of work, with tax, a discount and a part payment, so all the rows
 * a real invoice uses are visible.
 */

import {
  type Invoice,
  type TemplateId,
  createInvoice,
  createLineItem,
} from './invoice';

/** Fixed dates, so the example is identical on every render and every build. */
const ISSUE_DATE = '2026-03-02';
const DUE_DATE = '2026-03-16';

export function createExampleInvoice(template: TemplateId = 'classic'): Invoice {
  const base = createInvoice({ today: ISSUE_DATE });

  return {
    ...base,
    id: `example-${template}`,
    invoiceNumber: 'INV-0042',
    poNumber: 'PO-8814',
    issueDate: ISSUE_DATE,
    dueDate: DUE_DATE,
    paymentTerms: 'Net 14',
    currency: 'USD',
    template,

    business: {
      ...base.business,
      name: 'Rowan & Field Studio',
      address: '18 Wharf Road\nBristol BS1 4RU\nUnited Kingdom',
      email: 'accounts@rowanfield.co',
      phone: '+44 117 496 0182',
      website: 'rowanfield.co',
      taxId: 'GB 412 8876 03',
      taxIdLabel: 'VAT No.',
      logo: null,
    },

    customer: {
      ...base.customer,
      name: 'Halcyon Foods Ltd',
      address: 'Unit 7, Ashton Gate\nBristol BS3 2EJ\nUnited Kingdom',
      email: 'ap@halcyonfoods.com',
      phone: '+44 117 305 7720',
      taxId: 'GB 288 4410 55',
      taxIdLabel: 'VAT No.',
    },

    items: [
      createLineItem({
        id: 'ex-1',
        description: 'Brand identity — logotype, colour and type system',
        quantity: '1',
        unitPrice: '3800',
        tax: { mode: 'percent', value: '20', label: 'VAT' },
      }),
      createLineItem({
        id: 'ex-2',
        description: 'Packaging artwork — six SKUs',
        quantity: '6',
        unitPrice: '240',
        tax: { mode: 'percent', value: '20', label: 'VAT' },
      }),
      createLineItem({
        id: 'ex-3',
        description: 'Photography direction (day rate)',
        quantity: '2',
        unitPrice: '650',
        tax: { mode: 'percent', value: '20', label: 'VAT' },
      }),
      createLineItem({
        id: 'ex-4',
        description: 'Print supervision and press checks',
        quantity: '3.5',
        unitPrice: '180',
        tax: { mode: 'percent', value: '20', label: 'VAT' },
      }),
    ],

    discount: { mode: 'percent', value: '5' },
    shipping: '',
    fees: '',
    amountPaid: '1500',

    notes:
      'Payment by bank transfer.\nRowan & Field Studio · Sort 04-00-75 · Account 8871 2240',
    terms: 'Payment due within 14 days. Late payments accrue 2% per month.',

    options: {
      perItemTax: false,
      perItemDiscount: false,
      showShipping: false,
      showFees: false,
      showPaid: true,
      fitToPage: false,
    },

    createdAt: `${ISSUE_DATE}T09:00:00.000Z`,
    updatedAt: `${ISSUE_DATE}T09:00:00.000Z`,
  };
}

/** Locale and date style the examples render with, so they read consistently. */
export const EXAMPLE_LOCALE = 'en-GB';
export const EXAMPLE_DATE_STYLE = 'eu' as const;
