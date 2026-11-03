/**
 * Cloud Functions callable wrapper.
 *
 * Responsibilities:
 *  - Uniform error mapping (Firebase callable codes -> localized keys).
 *  - Duplicate-submission prevention via a short-lived in-flight set keyed
 *    by a stable caller-supplied token.
 *  - Central place to register new callables as Phase 4 lands them.
 *
 * Nothing here trusts the client. The server remains authoritative.
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseServices } from '../firebase/client.js';
import { env } from '../config/environment.js';

/**
 * Known callables. Anything not listed here can still be invoked via
 * `call(name, payload)` — the list exists so we can mark *pending* ones
 * clearly in the UI.
 */
export const CALLABLES = Object.freeze({
  // Phase 1 — delivered in prerequisite batch
  AUTHENTICATE_TELEGRAM: 'authenticateWithTelegram',
  BOOTSTRAP_DEV_USER: 'bootstrapDevUser',

  // Phase 4 — not yet implemented
  UPDATE_PREFERENCES: 'updatePreferences',
  SET_WITHDRAWAL_PIN: 'setWithdrawalPin',
  VERIFY_WITHDRAWAL_PIN: 'verifyWithdrawalPin',
  CLAIM_DAILY_BONUS: 'claimDailyBonus',
  SPIN_WHEEL: 'spinWheel',
  START_TASK: 'startTask',
  SUBMIT_TASK: 'submitTask',
  REQUEST_WITHDRAWAL: 'requestWithdrawal',
  REDEEM_PROMO: 'redeemPromo',
  ENTER_GIVEAWAY: 'enterGiveaway',
  CLAIM_REFERRAL_REWARD: 'claimReferralReward',
  CREATE_SUPPORT_TICKET: 'createSupportTicket',
  REPLY_SUPPORT_TICKET: 'replySupportTicket',
  CLOSE_SUPPORT_TICKET: 'closeSupportTicket',
  MARK_NOTIFICATION_READ: 'markNotificationRead',
});

/** Callables that exist on the server as of Phase 2 delivery. */
export const AVAILABLE_CALLABLES = Object.freeze([
  CALLABLES.AUTHENTICATE_TELEGRAM,
  CALLABLES.BOOTSTRAP_DEV_USER,
]);

export function isCallableAvailable(name) {
  if (env.devMode && name === CALLABLES.BOOTSTRAP_DEV_USER) return true;
  return AVAILABLE_CALLABLES.includes(name);
}

/** In-flight deduplication set (per tab). */
const inFlight = new Set();

/**
 * @param {string} name  callable name
 * @param {object} payload  request body
 * @param {object} options  { dedupeKey?: string, timeoutMs?: number }
 */
export async function call(name, payload = {}, options = {}) {
  const dedupeKey = options.dedupeKey ?? name;
  if (inFlight.has(dedupeKey)) {
    const err = new Error('DUPLICATE_REQUEST');
    err.code = 'duplicate-request';
    throw err;
  }
  inFlight.add(dedupeKey);

  try {
    const { functions } = getFirebaseServices();
    const fn = httpsCallable(functions, name);
    const result = await fn(payload);
    return result.data;
  } catch (error) {
    throw normalizeCallableError(error);
  } finally {
    inFlight.delete(dedupeKey);
  }
}

function normalizeCallableError(error) {
  const code = error?.code ?? 'unknown';
  const message = error?.message ?? '';

  // Map Firebase callable error codes to stable app codes.
  const map = {
    'functions/unauthenticated': 'UNAUTHENTICATED',
    'functions/permission-denied': 'PERMISSION_DENIED',
    'functions/invalid-argument': 'INVALID_ARGUMENT',
    'functions/failed-precondition': 'FAILED_PRECONDITION',
    'functions/not-found': 'NOT_FOUND',
    'functions/already-exists': 'ALREADY_EXISTS',
    'functions/resource-exhausted': 'RATE_LIMITED',
    'functions/unavailable': 'UNAVAILABLE',
    'functions/deadline-exceeded': 'TIMEOUT',
    'functions/internal': 'INTERNAL',
    'functions/not-found-function': 'FUNCTION_MISSING',
  };

  const normalized = new Error(message || code);
  normalized.code = map[code] ?? 'UNKNOWN';
  normalized.originalCode = code;
  return normalized;
}

/**
 * Returns a localized message key for a callable error.
 * The actual translation happens in the UI layer.
 */
export function errorMessageKey(error) {
  const code = error?.code ?? 'UNKNOWN';
  const keys = {
    UNAUTHENTICATED: 'errors.sessionExpired',
    PERMISSION_DENIED: 'errors.unauthorized',
    INVALID_ARGUMENT: 'errors.invalidInput',
    FAILED_PRECONDITION: 'errors.preconditionFailed',
    NOT_FOUND: 'errors.notFound',
    ALREADY_EXISTS: 'errors.alreadyExists',
    RATE_LIMITED: 'errors.rateLimited',
    UNAVAILABLE: 'errors.network',
    TIMEOUT: 'errors.timeout',
    INTERNAL: 'errors.generic',
    FUNCTION_MISSING: 'errors.backendUnavailable',
    'duplicate-request': 'errors.duplicateRequest',
    UNKNOWN: 'errors.generic',
  };
  return keys[code] ?? 'errors.generic';
}