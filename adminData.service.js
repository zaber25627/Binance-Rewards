/**
 * Admin read-only data service.
 *
 * Every function here is a WORKING read against Firestore.
 * Writes are FORBIDDEN by security rules (all writes are server-only).
 *
 * If a collection does not exist yet, Firestore returns zero-counts and
 * empty results — the caller decides how to present that.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseServices } from '../../firebase/client.js';

function db() {
  return getFirebaseServices().db;
}

function startOfTodayUtc() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

async function safeCount(promise) {
  try {
    const snap = await promise;
    return snap.data().count;
  } catch (error) {
    console.warn('[adminData] count failed', error?.code ?? error);
    return null;
  }
}

/* ============================================================
   User statistics
   ============================================================ */

export async function getUserStats() {
  const col = collection(db(), 'users');
  const today = startOfTodayUtc();

  const [total, active, suspended, newToday, verified] = await Promise.all([
    safeCount(getCountFromServer(col)),
    safeCount(getCountFromServer(query(col, where('status', '==', 'active')))),
    safeCount(getCountFromServer(query(col, where('status', '==', 'suspended')))),
    safeCount(getCountFromServer(query(col, where('createdAt', '>=', today)))),
    safeCount(getCountFromServer(query(col, where('telegramVerified', '==', true)))),
  ]);

  return { total, active, suspended, newToday, verified };
}

/* ============================================================
   Wallet liabilities — per currency, from the wallets collection.
   All values are integer minor units.
   ============================================================ */

export async function getWalletLiabilities() {
  try {
    const col = collection(db(), 'wallets');
    const agg = await getAggregateFromServer(col, {
      bdt: sum('balances.BDT'),
      usd: sum('balances.USD'),
      usdt: sum('balances.USDT'),
    });
    const data = agg.data();
    return {
      BDT: data.bdt ?? 0,
      USD: data.usd ?? 0,
      USDT: data.usdt ?? 0,
    };
  } catch (error) {
    console.warn('[adminData] wallet liability aggregation failed', error?.code ?? error);
    return null;
  }
}

/* ============================================================
   Withdrawal statistics — counts by status.
   ============================================================ */

const WITHDRAWAL_STATUSES = [
  'requested',
  'pending_review',
  'under_review',
  'approved',
  'processing_payment',
  'paid',
  'rejected',
  'cancelled',
];

export async function getWithdrawalStats() {
  const col = collection(db(), 'withdrawals');
  const results = await Promise.all(
    WITHDRAWAL_STATUSES.map(async (status) => {
      const count = await safeCount(
        getCountFromServer(query(col, where('status', '==', status)))
      );
      return [status, count];
    })
  );
  return Object.fromEntries(results);
}

/* ============================================================
   Task + submission statistics
   ============================================================ */

export async function getTaskStats() {
  const tasksCol = collection(db(), 'tasks');
  const subCol = collection(db(), 'task_submissions');

  const [totalTasks, activeTasks, pendingSubmissions, approvedSubmissions] =
    await Promise.all([
      safeCount(getCountFromServer(tasksCol)),
      safeCount(getCountFromServer(query(tasksCol, where('active', '==', true)))),
      safeCount(
        getCountFromServer(
          query(subCol, where('status', 'in', ['submitted', 'under_review']))
        )
      ),
      safeCount(
        getCountFromServer(query(subCol, where('status', '==', 'approved')))
      ),
    ]);

  return { totalTasks, activeTasks, pendingSubmissions, approvedSubmissions };
}

/* ============================================================
   Support ticket statistics
   ============================================================ */

export async function getSupportStats() {
  const col = collection(db(), 'support_tickets');
  const [open, inProgress, waitingUser, resolved, closed] = await Promise.all([
    safeCount(getCountFromServer(query(col, where('status', '==', 'open')))),
    safeCount(getCountFromServer(query(col, where('status', '==', 'in_progress')))),
    safeCount(getCountFromServer(query(col, where('status', '==', 'waiting_user')))),
    safeCount(getCountFromServer(query(col, where('status', '==', 'resolved')))),
    safeCount(getCountFromServer(query(col, where('status', '==', 'closed')))),
  ]);
  return { open, inProgress, waitingUser, resolved, closed };
}

/* ============================================================
   Audit / security statistics
   ============================================================ */

export async function getAuditStats() {
  const today = startOfTodayUtc();
  const logsCol = collection(db(), 'admin_logs');
  const secCol = collection(db(), 'security_events');

  const [adminActionsToday, securityEventsToday] = await Promise.all([
    safeCount(getCountFromServer(query(logsCol, where('createdAt', '>=', today)))),
    safeCount(getCountFromServer(query(secCol, where('createdAt', '>=', today)))),
  ]);

  return { adminActionsToday, securityEventsToday };
}

/* ============================================================
   Recent activity (small, bounded lists)
   ============================================================ */

async function recent(collectionName, orderField = 'createdAt', pageSize = 5) {
  try {
    const col = collection(db(), collectionName);
    const snap = await getDocs(
      query(col, orderBy(orderField, 'desc'), limit(pageSize))
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn(`[adminData] recent ${collectionName} failed`, error?.code ?? error);
    return [];
  }
}

export function getRecentUsers(pageSize = 5) {
  return recent('users', 'createdAt', pageSize);
}

export function getRecentWithdrawals(pageSize = 5) {
  return recent('withdrawals', 'createdAt', pageSize);
}

export function getRecentAdminActions(pageSize = 5) {
  return recent('admin_logs', 'createdAt', pageSize);
}

export function getRecentSecurityEvents(pageSize = 5) {
  return recent('security_events', 'createdAt', pageSize);
}

/* ============================================================
   Top-level dashboard snapshot.
   Never throws — returns nulls where a metric could not be read.
   ============================================================ */

export async function getDashboardSnapshot() {
  const [
    userStats,
    walletLiabilities,
    withdrawalStats,
    taskStats,
    supportStats,
    auditStats,
    recentUsers,
    recentWithdrawals,
    recentAdminActions,
    recentSecurityEvents,
  ] = await Promise.all([
    getUserStats(),
    getWalletLiabilities(),
    getWithdrawalStats(),
    getTaskStats(),
    getSupportStats(),
    getAuditStats(),
    getRecentUsers(),
    getRecentWithdrawals(),
    getRecentAdminActions(),
    getRecentSecurityEvents(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    userStats,
    walletLiabilities,
    withdrawalStats,
    taskStats,
    supportStats,
    auditStats,
    recentUsers,
    recentWithdrawals,
    recentAdminActions,
    recentSecurityEvents,
  };
}