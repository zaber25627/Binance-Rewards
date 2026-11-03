/**
 * Minimal observable store. Single-process, in-memory only.
 * Non-sensitive state only. Never persist PINs, tokens, or secrets here.
 */

function createStore(initialState) {
  let state = Object.freeze({ ...initialState });
  const subscribers = new Set();

  return Object.freeze({
    getState: () => state,

    setState(patch) {
      if (!patch || typeof patch !== 'object') return state;
      state = Object.freeze({ ...state, ...patch });
      subscribers.forEach((fn) => {
        try {
          fn(state);
        } catch (error) {
          console.warn('[store] subscriber error', error);
        }
      });
      return state;
    },

    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  });
}

/**
 * Global app state. Kept intentionally minimal — long-lived data
 * belongs in Firestore, not here.
 */
export const appStore = createStore({
  user: null,                  // Firebase User object
  profile: null,               // users/{uid} document data
  wallet: null,                // wallets/{uid} document data
  language: 'en',
  theme: 'black-gold',
  networkOnline: true,
  route: { path: '/', params: {} },
});

/**
 * Convenience selectors. Kept pure so they can be unit-tested later.
 */
export function selectIsAdmin(state) {
  return state?.profile?.isAdmin === true;
}

export function selectDisplayName(state) {
  const p = state?.profile;
  if (!p) return '';
  if (p.displayName) return p.displayName;
  if (p.telegram?.firstName) {
    return [p.telegram.firstName, p.telegram.lastName].filter(Boolean).join(' ');
  }
  return 'User';
}