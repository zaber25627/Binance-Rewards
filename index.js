import en from './en.json';
import bn from './bn.json';
import { branding } from '../config/branding.js';

const DICTIONARIES = Object.freeze({ en, bn });
const STORAGE_KEY = 'brb.language';

let currentLanguage = readStoredLanguage();
const listeners = new Set();

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DICTIONARIES[stored]) return stored;
  } catch {
    // localStorage may be unavailable in some webviews
  }
  return branding.defaultLanguage;
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (!DICTIONARIES[lang]) return;
  currentLanguage = lang;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignore persistence failures
  }

  document.documentElement.lang = lang;
  listeners.forEach((listener) => {
    try { listener(lang); } catch (e) { console.warn(e); }
  });
}

export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Dot-notation translation lookup with English fallback.
 * Returns the key itself if missing, which makes missing strings obvious in UI.
 */
export function t(key, fallback = '') {
  const dictionary = DICTIONARIES[currentLanguage] || DICTIONARIES.en;
  const value = key.split('.').reduce(
    (acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined),
    dictionary
  );
  if (value != null) return value;

  const english = DICTIONARIES.en;
  const englishValue = key.split('.').reduce(
    (acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined),
    english
  );
  return englishValue ?? fallback ?? key;
}

export function getDictionary(lang = currentLanguage) {
  return DICTIONARIES[lang] || DICTIONARIES.en;
}

export function availableLanguages() {
  return Object.keys(DICTIONARIES);
}