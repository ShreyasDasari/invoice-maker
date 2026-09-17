/**
 * User-facing strings, in one place.
 *
 * Centralised so a second language is a new file plus a lookup, not a sweep
 * through every component. Copy is deliberately plain: "Download PDF", not
 * "Generate your professional downloadable invoice document".
 */
export const en = {
  brand: 'Invoice Maker',
  tagline: 'Make an invoice. Free.',
  subtitle: 'Create a professional invoice in seconds. No signup. No watermark.',
  trustLine: 'Free to use. No account required. No watermark.',

  nav: {
    create: 'Create invoice',
    recent: 'Recent',
    templates: 'Templates',
    skipToEditor: 'Skip to invoice editor',
  },

  actions: {
    download: 'Download PDF',
    downloading: 'Preparing your invoice',
    print: 'Print',
    share: 'Share',
    copyLink: 'Copy link',
    linkCopied: 'Link copied',
    addItem: 'Add item',
    removeItem: 'Remove item',
    newInvoice: 'New invoice',
    duplicate: 'Duplicate',
    edit: 'Edit',
    delete: 'Delete',
    undo: 'Undo',
    saveProfile: 'Save for next time',
    savedProfile: 'Saved on this device',
    uploadLogo: 'Add logo',
    removeLogo: 'Remove logo',
    done: 'Done',
    cancel: 'Cancel',
    close: 'Close',
  },

  sections: {
    from: 'From',
    to: 'Bill to',
    shipTo: 'Ship to',
    details: 'Invoice details',
    items: 'Items',
    totals: 'Totals',
    notes: 'Notes',
    design: 'Design',
  },

  fields: {
    businessName: 'Business name',
    customerName: 'Customer name',
    address: 'Address',
    shippingAddress: 'Shipping address',
    email: 'Email',
    phone: 'Phone',
    website: 'Website',
    taxId: 'Tax ID',
    invoiceNumber: 'Invoice number',
    poNumber: 'PO number',
    issueDate: 'Issue date',
    dueDate: 'Due date',
    currency: 'Currency',
    paymentTerms: 'Payment terms',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Rate',
    tax: 'Tax',
    discount: 'Discount',
    amount: 'Amount',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    fees: 'Fees',
    total: 'Total',
    amountPaid: 'Amount paid',
    amountDue: 'Amount due',
    notes: 'Notes',
    terms: 'Terms',
    template: 'Template',
    accent: 'Accent',
    font: 'Font',
    paper: 'Paper',
  },

  toast: {
    downloaded: 'Invoice downloaded',
    printed: 'Sent to print',
    profileSaved: 'Business details saved on this device',
    itemRemoved: 'Item removed',
    invoiceDeleted: 'Invoice deleted',
    savedLocally: 'Saved on this device',
    logoTooBig: 'That image is over 4 MB. Try a smaller one.',
  },

  errors: {
    pdfFailed: 'Something went wrong while creating the PDF. Try again.',
    shareUnavailable: 'Sharing is not available in this browser. Download the PDF instead.',
    linkTooLong: 'This invoice is too detailed to fit in a link. Download the PDF and send that.',
    logoFailed: 'That image could not be used. Try a PNG or JPG.',
    storageFull: 'This browser is out of storage, so recent invoices were not saved.',
    storageUnavailable: 'This browser is not saving data, so nothing will be kept for next time.',
  },

  empty: {
    recentTitle: 'No recent invoices',
    recentBody: 'Your invoices will appear here.',
  },

  privacy: {
    localOnly: 'Everything stays in your browser. Invoices are never uploaded.',
  },
} as const;

export type Strings = typeof en;
