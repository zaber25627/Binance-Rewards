/**
 * Admin mutating operations.
 *
 * In Phase 3 (this batch), ALL of these throw PENDING_PHASE_4 because the
 * Cloud Functions do not exist yet (Phase 1 Part 2 was not delivered).
 *
 * In Phase 4, the corresponding callable will be registered in api.js
 * CALLABLES + AVAILABLE_CALLABLES, and this file will route to it.
 *
 * DO NOT add Firestore-direct writes here. Every admin write MUST go
 * through a Cloud Function so that:
 *   - Server-side authorization is enforced (custom claim + rate limiting)
 *   - The atomic ledger update + admin_logs write happen together
 *   - Duplicate submissions are rejected by an idempotency key
 */

import { CALLABLES, isCallableAvailable, call } from '../../services/api.js';

class PendingPhase4Error extends Error {
  constructor(operation) {
    super(`Operation not available: ${operation}`);
    this.code = 'PENDING_PHASE_4';
    this.operation = operation;
  }
}

function requireAvailable(operation) {
  if (!isCallableAvailable(operation)) {
    throw new PendingPhase4Error(operation);
  }
}

/* ============================================================
   User management
   ============================================================ */

export async function suspendUser({ uid, reason, dedupeKey }) {
  requireAvailable('suspendUser');
  return call('suspendUser', { uid, reason }, { dedupeKey });
}

export async function reactivateUser({ uid, reason, dedupeKey }) {
  requireAvailable('reactivateUser');
  return call('reactivateUser', { uid, reason }, { dedupeKey });
}

export async function addAdminNote({ uid, note, dedupeKey }) {
  requireAvailable('addAdminNote');
  return call('addAdminNote', { uid, note }, { dedupeKey });
}

/* ============================================================
   Withdrawal management
   ============================================================ */

export async function approveWithdrawal({ withdrawalId, note, dedupeKey }) {
  requireAvailable('approveWithdrawal');
  return call('approveWithdrawal', { withdrawalId, note }, { dedupeKey });
}

export async function rejectWithdrawal({ withdrawalId, reason, dedupeKey }) {
  requireAvailable('rejectWithdrawal');
  return call('rejectWithdrawal', { withdrawalId, reason }, { dedupeKey });
}

export async function markWithdrawalProcessing({ withdrawalId, dedupeKey }) {
  requireAvailable('markWithdrawalProcessing');
  return call('markWithdrawalProcessing', { withdrawalId }, { dedupeKey });
}

export async function markWithdrawalPaid({
  withdrawalId,
  paymentReference,
  dedupeKey,
}) {
  requireAvailable('markWithdrawalPaid');
  return call(
    'markWithdrawalPaid',
    { withdrawalId, paymentReference },
    { dedupeKey }
  );
}

/* ============================================================
   Financial adjustments
   ============================================================ */

export async function applyAdjustment({
  uid,
  currency,
  amountMinor,
  direction, // 'credit' | 'debit'
  reason,
  dedupeKey,
}) {
  requireAvailable('applyAdjustment');
  return call(
    'applyAdjustment',
    { uid, currency, amountMinor, direction, reason },
    { dedupeKey }
  );
}

/* ============================================================
   Task management
   ============================================================ */

export async function createTask({ task, dedupeKey }) {
  requireAvailable('createTask');
  return call('createTask', { task }, { dedupeKey });
}

export async function updateTask({ taskId, patch, dedupeKey }) {
  requireAvailable('updateTask');
  return call('updateTask', { taskId, patch }, { dedupeKey });
}

export async function archiveTask({ taskId, reason, dedupeKey }) {
  requireAvailable('archiveTask');
  return call('archiveTask', { taskId, reason }, { dedupeKey });
}

export async function reviewSubmission({
  submissionId,
  decision, // 'approve' | 'reject'
  reason,
  dedupeKey,
}) {
  requireAvailable('reviewSubmission');
  return call(
    'reviewSubmission',
    { submissionId, decision, reason },
    { dedupeKey }
  );
}

/* ============================================================
   Referral targets
   ============================================================ */

export async function upsertReferralTarget({ target, dedupeKey }) {
  requireAvailable('upsertReferralTarget');
  return call('upsertReferralTarget', { target }, { dedupeKey });
}

export async function disableReferralTarget({ targetId, reason, dedupeKey }) {
  requireAvailable('disableReferralTarget');
  return call('disableReferralTarget', { targetId, reason }, { dedupeKey });
}

/* ============================================================
   Daily bonus / spin / promo / giveaway configuration
   ============================================================ */

export async function updateDailyBonusConfig({ config, dedupeKey }) {
  requireAvailable('updateDailyBonusConfig');
  return call('updateDailyBonusConfig', { config }, { dedupeKey });
}

export async function updateSpinWheelConfig({ config, dedupeKey }) {
  requireAvailable('updateSpinWheelConfig');
  return call('updateSpinWheelConfig', { config }, { dedupeKey });
}

export async function createPromoCode({ promo, dedupeKey }) {
  requireAvailable('createPromoCode');
  return call('createPromoCode', { promo }, { dedupeKey });
}

export async function disablePromoCode({ codeId, reason, dedupeKey }) {
  requireAvailable('disablePromoCode');
  return call('disablePromoCode', { codeId, reason }, { dedupeKey });
}

export async function createGiveaway({ giveaway, dedupeKey }) {
  requireAvailable('createGiveaway');
  return call('createGiveaway', { giveaway }, { dedupeKey });
}

export async function publishGiveawayWinners({ giveawayId, winnerUids, dedupeKey }) {
  requireAvailable('publishGiveawayWinners');
  return call(
    'publishGiveawayWinners',
    { giveawayId, winnerUids },
    { dedupeKey }
  );
}

/* ============================================================
   VIP
   ============================================================ */

export async function grantVipManual({ uid, tier, reason, dedupeKey }) {
  requireAvailable('grantVipManual');
  return call('grantVipManual', { uid, tier, reason }, { dedupeKey });
}

/* ============================================================
   Achievements
   ============================================================ */

export async function upsertAchievement({ achievement, dedupeKey }) {
  requireAvailable('upsertAchievement');
  return call('upsertAchievement', { achievement }, { dedupeKey });
}

/* ============================================================
   Notifications
   ============================================================ */

export async function publishNotification({ notification, dedupeKey }) {
  requireAvailable('publishNotification');
  return call('publishNotification', { notification }, { dedupeKey });
}

/* ============================================================
   Support
   ============================================================ */

export async function replyToTicket({ ticketId, message, dedupeKey }) {
  requireAvailable('replyToTicket');
  return call('replyToTicket', { ticketId, message }, { dedupeKey });
}

export async function updateTicketStatus({ ticketId, status, dedupeKey }) {
  requireAvailable('updateTicketStatus');
  return call('updateTicketStatus', { ticketId, status }, { dedupeKey });
}

/* ============================================================
   System settings
   ============================================================ */

export async function updateSystemSettings({ settings, reason, dedupeKey }) {
  requireAvailable('updateSystemSettings');
  return call('updateSystemSettings', { settings, reason }, { dedupeKey });
}

/* ============================================================
   Security actions
   ============================================================ */

export async function markSecurityEventInvestigated({
  eventId,
  note,
  dedupeKey,
}) {
  requireAvailable('markSecurityEventInvestigated');
  return call(
    'markSecurityEventInvestigated',
    { eventId, note },
    { dedupeKey }
  );
}

/* ============================================================
   Export (Phase 4 — signed URL download)
   ============================================================ */

export async function requestExport({ collectionName, filters, dedupeKey }) {
  requireAvailable('requestExport');
  return call('requestExport', { collectionName, filters }, { dedupeKey });
}

export { PendingPhase4Error };