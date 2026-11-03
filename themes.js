/**
 * Theme registry. Each theme is a named palette of CSS custom properties.
 * The active theme is applied via `document.documentElement.dataset.theme = id`
 * and consumed in `src/styles/themes.css`.
 */

export const THEMES = Object.freeze({
  'black-gold': Object.freeze({
    id: 'black-gold',
    labelKey: 'theme.blackGold',
    palette: Object.freeze({
      '--brb-bg': '#090b10',
      '--brb-bg-elevated': '#0f1218',
      '--brb-surface': '#12151c',
      '--brb-surface-raised': '#1a1e27',
      '--brb-surface-glass': 'rgba(26, 30, 39, 0.62)',
      '--brb-text': '#f5f5f5',
      '--brb-text-muted': '#a0a4ad',
      '--brb-border': 'rgba(217, 173, 69, 0.18)',
      '--brb-accent': '#f0b90b',
      '--brb-accent-metallic': '#d9ad45',
      '--brb-accent-contrast': '#090b10',
      '--brb-success': '#0ecb81',
      '--brb-warning': '#f0b90b',
      '--brb-danger': '#f6465d',
    }),
  }),

  'black-emerald': Object.freeze({
    id: 'black-emerald',
    labelKey: 'theme.blackEmerald',
    palette: Object.freeze({
      '--brb-bg': '#050b09',
      '--brb-bg-elevated': '#081410',
      '--brb-surface': '#0d1a15',
      '--brb-surface-raised': '#122019',
      '--brb-surface-glass': 'rgba(18, 32, 25, 0.62)',
      '--brb-text': '#eef6f1',
      '--brb-text-muted': '#8fa89a',
      '--brb-border': 'rgba(16, 185, 129, 0.2)',
      '--brb-accent': '#10b981',
      '--brb-accent-metallic': '#34d399',
      '--brb-accent-contrast': '#04120c',
      '--brb-success': '#10b981',
      '--brb-warning': '#f0b90b',
      '--brb-danger': '#f6465d',
    }),
  }),

  'midnight-silver': Object.freeze({
    id: 'midnight-silver',
    labelKey: 'theme.midnightSilver',
    palette: Object.freeze({
      '--brb-bg': '#070b14',
      '--brb-bg-elevated': '#0c111f',
      '--brb-surface': '#0f1524',
      '--brb-surface-raised': '#151d30',
      '--brb-surface-glass': 'rgba(21, 29, 48, 0.62)',
      '--brb-text': '#eef2f9',
      '--brb-text-muted': '#98a2b8',
      '--brb-border': 'rgba(160, 178, 210, 0.22)',
      '--brb-accent': '#c0c9d9',
      '--brb-accent-metallic': '#e2e8f2',
      '--brb-accent-contrast': '#070b14',
      '--brb-success': '#22c55e',
      '--brb-warning': '#eab308',
      '--brb-danger': '#ef4444',
    }),
  }),
});

export const DEFAULT_THEME = 'black-gold';
export const THEME_IDS = Object.freeze(Object.keys(THEMES));

const STORAGE_KEY = 'brb.theme';

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES[stored]) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function applyTheme(themeId) {
  const theme = THEMES[themeId] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  Object.entries(theme.palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {
    /* ignore */
  }
  return theme.id;
}