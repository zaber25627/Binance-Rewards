/**
 * Admin authorization guard.
 *
 * The ONLY source of truth for admin status is the Firebase Auth custom claim
 * `admin === true`. Custom claims can only be set by trusted server-side code
 * (Firebase Admin SDK — see the Phase 1 Part 2 bootstrap script, which was not
 * delivered and is documented in the Phase 4 requirements below).
 *
 * There is NO fallback that trusts:
 *   - localStorage
 *   - Firestore user document fields
 *   - URL parameters
 *   - environment variables in the browser
 *   - the user's own claims without server verification
 */

import { getFirebaseServices } from '../firebase/client.js';
import { signOut } from 'firebase/auth';

/**
 * @param {import('firebase/auth').User} user
 * @param {object} opts { forceRefresh?: boolean }
 * @returns {Promise<boolean>}
 */
export async function checkAdminClaim(user, opts = {}) {
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult(opts.forceRefresh === true);
    return tokenResult?.claims?.admin === true;
  } catch (error) {
    console.warn('[adminAuth] claim check failed', error?.code ?? error);
    return false;
  }
}

/**
 * @throws Error with code ADMIN_REQUIRED if the claim is not present.
 * @returns {Promise<import('firebase/auth').IdTokenResult>}
 */
export async function assertAdmin(user, opts = {}) {
  if (!user) {
    const err = new Error('ADMIN_REQUIRED');
    err.code = 'ADMIN_REQUIRED';
    throw err;
  }
  const tokenResult = await user.getIdTokenResult(opts.forceRefresh === true);
  if (tokenResult?.claims?.admin !== true) {
    const err = new Error('ADMIN_REQUIRED');
    err.code = 'ADMIN_REQUIRED';
    throw err;
  }
  return tokenResult;
}

export async function adminSignOut() {
  const { auth } = getFirebaseServices();
  await signOut(auth);
}