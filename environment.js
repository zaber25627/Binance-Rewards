/**
 * Central environment configuration.
 * Only VITE_* variables are exposed to the browser.
 * Never put server secrets (bot token, service account keys) here.
 */

const raw = import.meta.env;

export const env = Object.freeze({
  firebase: Object.freeze({
    apiKey: raw.VITE_FIREBASE_API_KEY ?? '',
    authDomain: raw.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: raw.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: raw.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: raw.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: raw.VITE_FIREBASE_APP_ID ?? '',
  }),
  functionsRegion: raw.VITE_FUNCTIONS_REGION || 'us-central1',
  devMode: raw.VITE_ENABLE_DEV_MODE === 'true',
  basePath: import.meta.env.BASE_URL || '/',
  isProduction: raw.PROD === true,
});

export function assertFirebaseConfig() {
  const missing = Object.entries(env.firebase)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase configuration: ${missing.join(', ')}. ` +
      'Copy .env.example to .env.local and fill in your project values.'
    );
  }
}