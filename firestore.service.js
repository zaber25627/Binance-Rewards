/**
 * Thin helpers for Firestore reads and paginated queries.
 *
 * Writes NEVER go through this module. All financial and administrative
 * writes must go through Cloud Functions. Firestore rules already deny
 * client writes on financial collections.
 *
 * Every helper is intentionally narrow: no cross-collection queries,
 * no unbounded fetches, no real-time listeners.
 */

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { getFirebaseServices } from '../firebase/client.js';

export async function readDoc(collectionName, id) {
  const { db } = getFirebaseServices();
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * @param {string} collectionName
 * @param {object} options {
 *   filters: Array<[field, op, value]>,
 *   orderBy: { field: string, direction: 'asc'|'desc' },
 *   pageSize: number,
 *   cursor: any,        // last document snapshot for pagination
 * }
 */
export async function queryCollection(collectionName, options = {}) {
  const { db } = getFirebaseServices();
  const clauses = [];

  const { filters = [], orderBy: order = null, pageSize = 20, cursor = null } = options;

  filters.forEach(([field, op, value]) => {
    clauses.push(where(field, op, value));
  });

  if (order) {
    clauses.push(orderBy(order.field, order.direction ?? 'desc'));
  }

  if (pageSize) {
    clauses.push(limit(pageSize));
  }

  if (cursor) {
    clauses.push(startAfter(cursor));
  }

  const q = query(collection(db, collectionName), ...clauses);
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === pageSize,
  };
}

/**
 * Reads subcollection documents of a user (e.g. notifications, security events).
 * Rules already scope these to the owner or admin.
 */
export async function queryUserSubcollection(uid, subcollection, options = {}) {
  const { db } = getFirebaseServices();
  const clauses = [];

  if (options.orderBy) {
    clauses.push(orderBy(options.orderBy.field, options.orderBy.direction ?? 'desc'));
  }
  clauses.push(limit(options.pageSize ?? 20));
  if (options.cursor) clauses.push(startAfter(options.cursor));

  const q = query(collection(db, 'users', uid, subcollection), ...clauses);
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === (options.pageSize ?? 20),
  };
}