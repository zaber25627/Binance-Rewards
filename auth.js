import {
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseServices } from '../firebase/client.js';
import { getRawInitData, isTelegramEnvironment } from './webapp.js';
import { env } from '../config/environment.js';

const AUTH_FUNCTION = 'authenticateWithTelegram';
const DEV_BOOTSTRAP_FUNCTION = 'bootstrapDevUser';

/**
 * Full authentication entry point.
 *
 * Inside Telegram:
 *   1. Read raw initData.
 *   2. Send it to the callable function.
 *   3. Server validates HMAC + auth_date and returns a Custom Token.
 *   4. Sign in with that token.
 *
 * Outside Telegram:
 *   - If VITE_ENABLE_DEV_MODE=true, sign in anonymously and bootstrap a
 *     development profile/wallet through a server-gated function.
 *   - Otherwise throw TELEGRAM_ENV_UNAVAILABLE.
 */
export async function authenticate() {
  const { auth, functions } = getFirebaseServices();

  if (!isTelegramEnvironment()) {
    if (env.devMode) {
      return signInDevelopment(auth, functions);
    }
    throw new Error('TELEGRAM_ENV_UNAVAILABLE');
  }

  const initData = getRawInitData();
  if (!initData) {
    throw new Error('TELEGRAM_INIT_DATA_MISSING');
  }

  const callable = httpsCallable(functions, AUTH_FUNCTION);
  const { data } = await callable({ initData });

  if (!data?.token || typeof data.token !== 'string') {
    throw new Error('AUTH_TOKEN_MISSING');
  }

  const credential = await signInWithCustomToken(auth, data.token);
  return credential.user;
}

async function signInDevelopment(auth, functions) {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const bootstrap = httpsCallable(functions, DEV_BOOTSTRAP_FUNCTION);
  try {
    await bootstrap();
  } catch (error) {
    // Non-fatal: the user is still authenticated; the profile may already exist.
    console.warn('[auth] Dev bootstrap response:', error?.message ?? error);
  }

  return auth.currentUser;
}

/**
 * Resolves with the current Firebase user, or null.
 */
export function waitForAuthState() {
  const { auth } = getFirebaseServices();
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Forces a token refresh so the latest custom claims (e.g. admin) are available.
 */
export async function refreshClaims() {
  const { auth } = getFirebaseServices();
  if (!auth.currentUser) return null;
  await auth.currentUser.getIdToken(true);
  return auth.currentUser.getIdTokenResult();
}