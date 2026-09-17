'use client';

import { CURRENCIES } from '@/lib/currency';
import { SelectField } from '@/components/ui/Field';

/** The ten a small business is most likely to invoice in, kept at the top. */
const COMMON = ['USD', 'CAD', 'GBP', 'EUR', 'AUD', 'INR', 'JPY', 'SGD', 'AED', 'CHF'];

/**
 * Currency picker.
 *
 * A native <select> on purpose: it brings the platform's own wheel on mobile,
 * keyboard type-ahead on desktop (typing "ind" jumps to Indian Rupee) and costs
 * nothing in JavaScript. The common currencies are grouped first so the usual
 * choice is one tap away.
 */
export function CurrencySelect({
  value,
  onChange,
  label = 'Currency',
}: {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}) {
  const common = CURRENCIES.filter((c) => COMMON.includes(c.code));
  const rest = CURRENCIES.filter((c) => !COMMON.includes(c.code));

  return (
    <SelectField label={label} value={value} onChange={(event) => onChange(event.target.value)}>
      <optgroup label="Common">
        {common.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {currency.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="All currencies">
        {rest.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.code} — {currency.name}
          </option>
        ))}
      </optgroup>
    </SelectField>
  );
}
