/**
 * Blog posts.
 *
 * Long-form answers to the questions people search before they make an
 * invoice. Like the landing pages, they are data rather than templates: a new
 * post is a new entry here, and the route, sitemap and footer pick it up.
 *
 * Tax and legal statements are kept to rules that are stable and well
 * documented, and each country section points readers at the official source.
 * When a rule changes (a threshold, a rate), update the post and its
 * `updatedAt` together.
 */

export interface BlogSection {
  heading: string;
  paragraphs: readonly string[];
  /** Optional list rendered under the prose. */
  points?: readonly string[];
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  /** Browser/SERP title. The site name is appended by the root layout. */
  title: string;
  /** Meta description, kept under 160 characters. */
  description: string;
  h1: string;
  /** Shown on the blog index and under the heading. */
  excerpt: string;
  /** ISO calendar dates, YYYY-MM-DD. */
  publishedAt: string;
  updatedAt: string;
  sections: readonly BlogSection[];
  faqs: readonly BlogFaq[];
  /** Slugs of other posts to suggest at the end. */
  related: readonly string[];
}

const DISCLAIMER =
  'This guide is general information, not legal or tax advice. Rules change, so check the official guidance for your country or ask an accountant before you rely on it.';

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: 'how-to-make-an-invoice',
    title: 'How to Make an Invoice: Step-by-Step Guide',
    description:
      'How to make an invoice in seven steps, with what to add for US sales tax, UK VAT and Indian GST. Free invoice maker, no signup.',
    h1: 'How to make an invoice: a step-by-step guide',
    excerpt:
      'Seven steps from a blank page to an invoice your customer can pay, plus what changes if you bill in the US, the UK or India.',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    sections: [
      {
        heading: 'What an invoice is',
        paragraphs: [
          'An invoice is a request for payment. It tells your customer what they bought, how much they owe, and when and how to pay. It is also a record: you need it for your accounts, and your customer needs it for theirs.',
          'A good invoice is one your customer can pay without writing back to ask a question. Every step below is there to remove one of those questions.',
        ],
      },
      {
        heading: 'Step 1: Add your business details',
        paragraphs: [
          'Start with who is billing. Put your business name, address, email and phone number at the top. If you trade under your own name, use your full name. If you run a limited company, use the full registered company name.',
          'If you are registered for a sales tax, add your registration number here: your VAT number in the UK, or your GSTIN in India.',
        ],
      },
      {
        heading: "Step 2: Add your customer's details",
        paragraphs: [
          "Next, who is paying. Add your customer's name or business name and their billing address. Add a contact email so the invoice reaches the person who approves payments, not only the person you worked with.",
          'If your customer is GST registered in India, include their GSTIN. If they gave you a purchase order (PO) number, add that too, because many finance teams cannot pay an invoice without one.',
        ],
      },
      {
        heading: 'Step 3: Give it a unique invoice number',
        paragraphs: [
          'Every invoice needs a number that you never reuse. It is how you and your customer refer to the invoice when a payment arrives. Most people use a simple sequence such as INV-0001, INV-0002, and so on.',
          'In India, GST invoice numbers must be consecutive, no longer than 16 characters, and unique for the financial year. The UK expects a unique sequential number on VAT invoices too.',
        ],
      },
      {
        heading: 'Step 4: Set the dates and payment terms',
        paragraphs: [
          'Add the date you issue the invoice and the date payment is due. Payment terms explain the gap between the two. "Net 30" means payment is due 30 days after the invoice date.',
          'Writing the actual due date, not only the term, avoids confusion. If you agreed terms in a contract, match them exactly.',
        ],
      },
      {
        heading: 'Step 5: List the work, line by line',
        paragraphs: [
          'Add one line for each product or service. Each line needs a clear description, a quantity and a rate. The amount for the line is the quantity multiplied by the rate.',
          'Be specific. "Website design, homepage and 3 inner pages" is easier to approve than "Design work". If you bill by the hour, put the hours in the quantity.',
        ],
      },
      {
        heading: 'Step 6: Add tax and discounts',
        paragraphs: [
          'Show any tax separately from the subtotal, with the rate and the amount. Do the same for discounts. Your customer should be able to check the total with a calculator.',
          'Only charge a tax you are registered to collect. If you are not registered, do not add a tax line.',
        ],
      },
      {
        heading: 'Step 7: Add payment details and send it',
        paragraphs: [
          'Tell your customer how to pay: bank details, a payment link, or the methods you accept. Add a short thank-you note if you like.',
          'Save the invoice as a PDF so the layout cannot change, then email it. Keep a copy for your records.',
        ],
      },
      {
        heading: 'If you invoice in the United States',
        paragraphs: [
          'There is no single federal format for a US invoice. Sales tax is set by each state, and many states do not tax most services, so check the rules for the state where the sale takes place.',
          'If you are a freelancer, a US business client will usually ask you for Form W-9. For payments made from 2026, they report what they paid you on Form 1099-NEC once the total for the year reaches $2,000 (it was $600 before). You still owe tax on income below that amount.',
        ],
      },
      {
        heading: 'If you invoice in the United Kingdom',
        paragraphs: [
          'If you are not VAT registered, a simple invoice is fine, but you must not charge VAT. Registration becomes compulsory once your taxable turnover passes £90,000 in a rolling 12-month period.',
          'If you are VAT registered, your invoice must be a VAT invoice. That means extra fields such as your VAT number, the tax point, and the VAT rate and amount. Our guide to what to include on an invoice lists them all.',
        ],
      },
      {
        heading: 'If you invoice in India',
        paragraphs: [
          'If you are GST registered, you issue a tax invoice with your GSTIN, an HSN code for goods or an SAC code for services, the place of supply, and the tax split correctly. Within a state, that means CGST and SGST. Between states, it means IGST.',
          'For services, a GST invoice should be issued within 30 days of the supply. If you are under the composition scheme, or your supply is exempt, you issue a bill of supply instead of a tax invoice.',
        ],
      },
      {
        heading: 'Common mistakes to avoid',
        paragraphs: ['Most late payments start with an invoice that is missing something. Check for these before you send.'],
        points: [
          'Reusing or skipping invoice numbers.',
          'No due date, or a due date that does not match the agreed terms.',
          'Vague descriptions the customer cannot match to the work.',
          'Charging tax you are not registered to collect.',
          'Missing payment details, so the customer has to ask how to pay.',
          'Sending an editable document instead of a PDF.',
        ],
      },
      {
        heading: 'A note on the rules',
        paragraphs: [DISCLAIMER],
      },
    ],
    faqs: [
      {
        question: 'How do I make an invoice for free?',
        answer:
          'Open the free invoice maker, fill in your details, your customer and your line items, then download the PDF. There is no account, no trial and no watermark.',
      },
      {
        question: 'Can I make an invoice without a registered business?',
        answer:
          'Yes. Freelancers and sole traders can invoice under their own name. You only need a tax registration number on the invoice if you are registered for a tax such as VAT or GST.',
      },
      {
        question: 'What format should I send an invoice in?',
        answer:
          'A PDF is the safest choice. It looks the same on every device, it cannot be changed by accident, and it prints cleanly.',
      },
      {
        question: 'How should I number my invoices?',
        answer:
          'Use one sequence that only goes up, such as INV-0001, INV-0002. Never reuse a number. In India, keep it to 16 characters or fewer and unique for the financial year.',
      },
    ],
    related: ['what-to-include-on-an-invoice', 'invoice-payment-terms'],
  },
  {
    slug: 'what-to-include-on-an-invoice',
    title: 'What to Include on an Invoice: US, UK and India',
    description:
      'A checklist of what an invoice must include, with the extra fields for a UK VAT invoice and an Indian GST tax invoice.',
    h1: 'What to include on an invoice: a checklist for the US, UK and India',
    excerpt:
      'The fields every invoice needs, and the extra ones a UK VAT invoice or an Indian GST tax invoice must carry.',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    sections: [
      {
        heading: 'The fields every invoice needs',
        paragraphs: [
          'Whatever country you are in, an invoice your customer can pay without questions usually has all of the following.',
        ],
        points: [
          'The word "Invoice" and a unique invoice number.',
          'The date of issue and the payment due date.',
          'Your business name, address and contact details.',
          "Your customer's name and billing address.",
          'A description of each product or service, with quantity, rate and amount.',
          'The subtotal, any tax and discount shown separately, and the total due.',
          'The currency, if there is any chance of doubt.',
          'Payment terms and how to pay.',
        ],
      },
      {
        heading: 'United States',
        paragraphs: [
          'US federal law does not set a required invoice format, so the checklist above covers most freelancers and small businesses. If you collect sales tax, show it as a separate line with the rate, and follow the rules of the state where the sale happens.',
          'A PO number, if your customer gave you one, often decides whether an invoice gets paid on time. Larger companies may also ask for your W-9 before they pay.',
        ],
      },
      {
        heading: 'United Kingdom: if you are not VAT registered',
        paragraphs: [
          'Use the checklist above. If you are a sole trader trading under a business name, include your own name as well. If you are a limited company, show the full registered company name.',
          'Do not show VAT or a VAT number. You cannot charge VAT unless you are registered.',
        ],
      },
      {
        heading: 'United Kingdom: a full VAT invoice',
        paragraphs: ['If you are VAT registered and sell to another VAT-registered business, HMRC expects a full VAT invoice. It must show:'],
        points: [
          'A unique, sequential invoice number.',
          'The time of supply (tax point) and the date of issue, if different.',
          'Your name, address and VAT registration number.',
          "Your customer's name and address.",
          'A description of the goods or services.',
          'For each item: the quantity, the unit price excluding VAT, the VAT rate and any discount.',
          'The total amount excluding VAT.',
          'The total amount of VAT.',
        ],
      },
      {
        heading: 'United Kingdom: a simplified VAT invoice',
        paragraphs: [
          'For sales of £250 or less including VAT, you can issue a simplified VAT invoice. It needs your name, address and VAT number, the tax point, a description of what you sold, and for each VAT rate, the total including VAT and the rate charged.',
        ],
      },
      {
        heading: 'India: a GST tax invoice',
        paragraphs: [
          'Rule 46 of the CGST Rules sets out what a GST tax invoice must contain. In summary:',
        ],
        points: [
          'Your name, address and GSTIN.',
          'A consecutive serial number of up to 16 characters, unique for the financial year. Letters, numbers, hyphens and slashes are allowed.',
          'The date of issue.',
          "Your customer's name, address and GSTIN if they are registered.",
          'The HSN code for goods or the SAC code for services. The number of digits depends on your turnover.',
          'A description, quantity and unit of the goods or services.',
          'The total value, and the taxable value after any discount.',
          'The tax rate and amount: CGST and SGST (or UTGST) for supplies within a state, IGST for supplies between states.',
          'The place of supply, with the state name, for supplies between states.',
          'Whether tax is payable on reverse charge.',
          'Your signature or digital signature, or that of an authorised representative.',
        ],
      },
      {
        heading: 'India: when to issue a bill of supply instead',
        paragraphs: [
          'If you are registered under the composition scheme, or what you are selling is exempt from GST, you cannot issue a tax invoice. You issue a bill of supply, which does not charge GST.',
        ],
      },
      {
        heading: 'Fitting these fields into the invoice maker',
        paragraphs: [
          'The invoice maker has a tax ID field for you and your customer, and you can rename its label to "VAT No." or "GSTIN". Tax can be one rate for the whole invoice or a rate per line, and you can name it "VAT", "GST" or "IGST".',
          'There is no separate HSN or SAC column. Add the code to the line description, for example "Web design, SAC" followed by your code. Check that the code is right for your service before you rely on it.',
        ],
      },
      {
        heading: 'A note on the rules',
        paragraphs: [DISCLAIMER],
      },
    ],
    faqs: [
      {
        question: 'Does an invoice need to be signed?',
        answer:
          'In the US and the UK, a signature is not normally required. In India, a GST tax invoice must carry a signature or digital signature of the supplier or an authorised representative.',
      },
      {
        question: 'Do I need a tax number on my invoice?',
        answer:
          'Only if you are registered for a tax. A VAT-registered UK business must show its VAT number, and a GST-registered Indian business must show its GSTIN. If you are not registered, leave it off.',
      },
      {
        question: 'What is the difference between a tax invoice and a bill of supply?',
        answer:
          'In India, a tax invoice charges GST and lets a registered customer claim input tax credit. A bill of supply is used for exempt supplies or by composition scheme businesses, and charges no GST.',
      },
      {
        question: 'Can I issue a simplified VAT invoice in the UK?',
        answer:
          'Yes, if the sale is £250 or less including VAT. Above that, you need a full VAT invoice when your customer is VAT registered.',
      },
    ],
    related: ['how-to-make-an-invoice', 'invoice-payment-terms'],
  },
  {
    slug: 'invoice-payment-terms',
    title: 'Invoice Payment Terms Explained: Net 30 and Late Fees',
    description:
      'What Net 30, due on receipt and other invoice payment terms mean, how to choose them, and late payment rules in the US, UK and India.',
    h1: 'Invoice payment terms explained: Net 30, due on receipt and late fees',
    excerpt:
      'What the common payment terms mean, how to pick one, and what the law says about late payment in the US, the UK and India.',
    publishedAt: '2026-10-06',
    updatedAt: '2026-10-06',
    sections: [
      {
        heading: 'What payment terms are',
        paragraphs: [
          'Payment terms tell your customer when you expect to be paid. They turn "please pay soon" into a date, which gives you something clear to point to when you follow up.',
          'Agree terms before you start the work, write them on every invoice, and include the actual due date as well as the term.',
        ],
      },
      {
        heading: 'Common payment terms',
        paragraphs: ['These are the terms you will see most often.'],
        points: [
          'Due on receipt: payment is expected as soon as the invoice arrives.',
          'Net 7, Net 14, Net 30, Net 60: payment is due 7, 14, 30 or 60 days after the invoice date.',
          'End of month (EOM): payment is due at the end of the month the invoice is dated in. "Net 30 EOM" means 30 days after the end of that month.',
          '2/10 Net 30: the customer can take 2% off if they pay within 10 days; otherwise the full amount is due in 30 days.',
          'Upfront or deposit: part or all of the amount is paid before the work starts.',
        ],
      },
      {
        heading: 'How to choose your terms',
        paragraphs: [
          'Shorter terms get you paid sooner, but large companies often have fixed payment cycles and may only pay on Net 30 or longer. Ask your customer what their finance team uses before you agree.',
          'For new customers or large projects, a deposit lowers your risk. For repeat customers who pay reliably, a longer term can be a fair trade for steady work.',
        ],
      },
      {
        heading: 'Late payment in the United States',
        paragraphs: [
          'There is no single federal rule on late fees between businesses. What you can charge depends on your contract and on state law, and some states cap interest rates. The safest approach is to agree any late fee in writing before the work starts and repeat it on the invoice.',
        ],
      },
      {
        heading: 'Late payment in the United Kingdom',
        paragraphs: [
          'Between businesses, the Late Payment of Commercial Debts (Interest) Act 1998 lets you claim statutory interest on a late invoice at 8% above the Bank of England base rate, even if your contract does not mention it.',
          'You can also claim a fixed sum for the cost of recovering the debt: £40 for debts under £1,000, £70 for debts from £1,000 to £9,999.99, and £100 for debts of £10,000 or more. These rules apply to business customers, not to consumers.',
        ],
      },
      {
        heading: 'Late payment in India',
        paragraphs: [
          'If you are a micro or small enterprise registered under the MSMED Act (through Udyam registration), the buyer must pay within the agreed period, and in any case within 45 days of accepting the goods or services.',
          'If they pay late, the Act entitles you to compound interest with monthly rests at three times the bank rate notified by the Reserve Bank of India. You can also take a delayed payment to the MSME Samadhaan portal.',
        ],
      },
      {
        heading: 'Following up on a late invoice',
        paragraphs: ['A polite, steady process gets most invoices paid without a dispute.'],
        points: [
          'Send a friendly reminder a few days before the due date.',
          'On the due date, resend the invoice and confirm the amount and how to pay.',
          'A week after, ask directly when payment will be made.',
          'After that, mention the late payment terms or statutory interest you are entitled to.',
          'Keep every message in writing, in case you need it later.',
        ],
      },
      {
        heading: 'A note on the rules',
        paragraphs: [DISCLAIMER],
      },
    ],
    faqs: [
      {
        question: 'What does Net 30 mean on an invoice?',
        answer:
          'It means payment is due 30 days after the invoice date. An invoice dated 1 March on Net 30 terms is due on 31 March.',
      },
      {
        question: 'What does due on receipt mean?',
        answer:
          'It means the customer should pay as soon as they receive the invoice. In practice, many customers treat it as within a few days.',
      },
      {
        question: 'Can I charge a late fee on an invoice?',
        answer:
          'In the UK, you can claim statutory interest and a fixed recovery sum from business customers. In India, registered micro and small enterprises are entitled to interest under the MSMED Act. In the US, it depends on your contract and state law, so agree it in writing first.',
      },
      {
        question: 'How do I set payment terms in the invoice maker?',
        answer:
          'Pick Net 7, Net 14, Net 30 or Net 60 and the due date fills in from the issue date. You can also type your own terms and set the due date yourself.',
      },
    ],
    related: ['how-to-make-an-invoice', 'what-to-include-on-an-invoice'],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * "2026-10-06" → "6 October 2026", built from the string so the date never
 * shifts with the server's timezone.
 */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((part) => Number.parseInt(part, 10));
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}
