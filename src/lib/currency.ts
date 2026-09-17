/** Currency metadata: symbol, minor-unit precision and a sensible default locale. */

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  /** Minor-unit digits. JPY is 0, most are 2, a few are 3. */
  decimals: number;
  /** Locale used for grouping/placement when the user has no preference. */
  locale: string;
}

/**
 * The ten required currencies first (they lead the picker), then a broader set
 * so the tool does not feel regionally limited.
 */
export const CURRENCIES: readonly Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, locale: 'en-US' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimals: 2, locale: 'en-CA' },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, locale: 'en-GB' },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, locale: 'de-DE' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2, locale: 'en-AU' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2, locale: 'en-IN' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, locale: 'ja-JP' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2, locale: 'en-SG' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimals: 2, locale: 'en-AE' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2, locale: 'de-CH' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2, locale: 'en-NZ' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2, locale: 'en-HK' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2, locale: 'sv-SE' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2, locale: 'nb-NO' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2, locale: 'da-DK' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2, locale: 'pl-PL' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2, locale: 'cs-CZ' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2, locale: 'en-ZA' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2, locale: 'pt-BR' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', decimals: 2, locale: 'es-MX' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2, locale: 'es-AR' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimals: 0, locale: 'es-CL' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimals: 2, locale: 'es-CO' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2, locale: 'zh-CN' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0, locale: 'ko-KR' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', decimals: 2, locale: 'zh-TW' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2, locale: 'ms-MY' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 2, locale: 'id-ID' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2, locale: 'th-TH' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2, locale: 'en-PH' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0, locale: 'vi-VN' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', decimals: 2, locale: 'en-PK' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimals: 2, locale: 'bn-BD' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimals: 2, locale: 'si-LK' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2, locale: 'en-NG' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, locale: 'en-KE' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', decimals: 2, locale: 'en-EG' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', decimals: 2, locale: 'en-SA' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QAR', decimals: 2, locale: 'en-QA' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimals: 2, locale: 'he-IL' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2, locale: 'tr-TR' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimals: 2, locale: 'ro-RO' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 2, locale: 'hu-HU' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', decimals: 2, locale: 'uk-UA' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', decimals: 3, locale: 'en-KW' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', decimals: 3, locale: 'en-BH' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR', decimals: 3, locale: 'en-OM' },
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export const DEFAULT_CURRENCY = 'USD';

export function getCurrency(code: string): Currency {
  return BY_CODE.get(code.toUpperCase()) ?? BY_CODE.get(DEFAULT_CURRENCY)!;
}

export function currencyDecimals(code: string): number {
  return getCurrency(code).decimals;
}

/** Case-insensitive search over code, name and symbol. */
export function searchCurrencies(query: string): readonly Currency[] {
  const q = query.trim().toLowerCase();
  if (!q) return CURRENCIES;
  return CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q),
  );
}
