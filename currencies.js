/**
 * Currency registry.
 * `decimals` is the number of minor-unit digits.
 * BDT/USD: 2 (paisa/cents). USDT: 6 (micro-USDT).
 *
 * Add new currencies here; server-side validation must mirror this list.
 */

export const CURRENCIES = Object.freeze({
  BDT: Object.freeze({
    code: 'BDT',
    decimals: 2,
    symbol: '৳',
    nameKey: 'currency.BDT',
  }),
  USD: Object.freeze({
    code: 'USD',
    decimals: 2,
    symbol: '$',
    nameKey: 'currency.USD',
  }),
  USDT: Object.freeze({
    code: 'USDT',
    decimals: 6,
    symbol: '₮',
    nameKey: 'currency.USDT',
  }),
});

export const DEFAULT_CURRENCY = 'BDT';

export const SUPPORTED_CURRENCY_CODES = Object.freeze(Object.keys(CURRENCIES));