/**
 * Thin, safe wrapper around the Telegram WebApp SDK.
 * The SDK script is loaded synchronously in index.html before this module.
 */

export function getTelegramWebApp() {
  return typeof window !== 'undefined' ? window.Telegram?.WebApp ?? null : null;
}

export function isTelegramEnvironment() {
  const wa = getTelegramWebApp();
  return Boolean(wa && typeof wa.initData === 'string' && wa.initData.length > 0);
}

/**
 * Prepares the Mini App chrome. Safe to call in a normal browser (no-op).
 */
export function initTelegramWebApp() {
  const wa = getTelegramWebApp();
  if (!wa) return null;

  try {
    wa.ready();
    wa.expand();
    if (typeof wa.setHeaderColor === 'function') wa.setHeaderColor('#090B10');
    if (typeof wa.setBackgroundColor === 'function') wa.setBackgroundColor('#090B10');
    if (typeof wa.disableVerticalSwipes === 'function') wa.disableVerticalSwipes();
  } catch (error) {
    console.warn('[telegram] WebApp initialization warning:', error);
  }

  return wa;
}

/**
 * Returns the raw, signed initData query string.
 * NEVER use `initDataUnsafe` for authentication.
 */
export function getRawInitData() {
  const wa = getTelegramWebApp();
  return typeof wa?.initData === 'string' ? wa.initData : '';
}

/**
 * Optional: display name for UI only. Not used for authorization.
 */
export function getDisplayName() {
  const user = getTelegramWebApp()?.initDataUnsafe?.user;
  if (!user) return '';
  return [user.first_name, user.last_name].filter(Boolean).join(' ');
}