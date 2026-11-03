/**
 * Single source of truth for app identity.
 * Change the app name, logo, or theme here — not in multiple files.
 */

export const branding = Object.freeze({
  appName: 'BINANCE REWARD BOT',
  appShortName: 'BRB',
  logoUrl: import.meta.env.VITE_LOGO_URL || './logo.svg',

  theme: Object.freeze({
    primary: '#F0B90B',
    metallicGold: '#D9AD45',
    background: '#090B10',
    surface: '#12151C',
    surfaceRaised: '#1A1E27',
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A4AD',
    border: 'rgba(217, 173, 69, 0.18)',
    danger: '#F6465D',
    success: '#0ECB81',
  }),

  loading: Object.freeze({
    spinnerSize: 36,
    animationDurationMs: 900,
  }),

  languages: Object.freeze(['en', 'bn']),
  defaultLanguage: 'en',
});