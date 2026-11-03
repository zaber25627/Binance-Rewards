/**
 * Lightweight client-side validation helpers.
 * These improve UX but are NOT security controls. The server re-validates
 * everything before touching Firestore.
 */

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

export function isValidTelegramId(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Validates a Firestore document ID shape for client-side navigation.
 * Server-side rules remain authoritative.
 */
export function isSafeDocumentId(value) {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 128
    && !value.includes('/');
}

export function truncate(value, maxLength = 80) {
  if (typeof value !== 'string') return '';
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;
}