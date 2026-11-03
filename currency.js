import { CURRENCIES, DEFAULT_CURRENCY } from '../config/currencies.js';

export function getCurrencyConfig(code) {
  return CURRENCIES[code] ?? null;
}

export function isValidCurrency(code) {
  return Object.prototype.hasOwnProperty.call(CURRENCIES, code);
}

export function assertCurrency(code) {
  if (!isValidCurrency(code)) {
    throw new Error(`Unsupported currency: ${code}`);
  }
  return CURRENCIES[code];
}

/**
 * Converts a major-unit display value to integer minor units.
 * Uses Math.round on a scaled number; the result is always an integer.
 */
export function toMinorUnits(amount, currencyCode) {
  const config = assertCurrency(currencyCode);
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('Amount must be a finite number');
  }
  const factor = 10 ** config.decimals;
  return Math.round(amount * factor);
}

export function fromMinorUnits(minor, currencyCode) {
  const config = assertCurrency(currencyCode);
  if (!Number.isInteger(minor)) {
    throw new Error('Minor units must be an integer');
  }
  return minor / 10 ** config.decimals;
}

export function formatCurrency(minor, currencyCode, locale = 'en') {
  const config = assertCurrency(currencyCode);
  const value = fromMinorUnits(minor, currencyCode);
  const formatter = new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  return `${formatter.format(value)} ${config.code}`;
}

/**
 * Safe addition — both operands and result are integer minor units of the
 * same currency. Never use this across different currency codes.
 */
export function addMinorUnits(a, b, currencyCode) {
  assertCurrency(currencyCode);
  assertInteger(a, 'operand a');
  assertInteger(b, 'operand b');
  return a + b;
}

export function subtractMinorUnits(a, b, currencyCode) {
  assertCurrency(currencyCode);
  assertInteger(a, 'operand a');
  assertInteger(b, 'operand b');
  return a - b;
}

/**
 * Explicit currency conversion with a persisted rate snapshot.
 * The server must validate and store the same snapshot on the transaction.
 *
 * `rateSnapshot.rate` = units of `toCurrency` per 1 unit of `fromCurrency`.
 */
export function convertWithSnapshot(amountMinor, fromCurrency, toCurrency, rateSnapshot) {
  if (fromCurrency === toCurrency) return amountMinor;

  const from = assertCurrency(fromCurrency);
  const to = assertCurrency(toCurrency);

  if (!rateSnapshot || typeof rateSnapshot.rate !== 'number' || rateSnapshot.rate <= 0) {
    throw new Error('A valid rate snapshot is required for conversion');
  }

  const fromMajor = amountMinor / 10 ** from.decimals;
  const toMajor = fromMajor * rateSnapshot.rate;
  return Math.round(toMajor * 10 ** to.decimals);
}

function assertInteger(value, label) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer (minor units)`);
  }
}

export { DEFAULT_CURRENCY };