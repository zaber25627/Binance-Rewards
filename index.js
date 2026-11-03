import en from './en.json';
import bn from './bn.json';
import { branding } from '../config/branding.js';

// Deep-clone so runtime dictionary extensions (e.g. admin namespace)
// never mutate the imported JSON modules.
const DICTIONARIES = {
  en: JSON.parse(JSON.stringify(en)),
  bn: JSON.parse(JSON.stringify(bn)),
};

const STORAGE_KEY = 'brb.language';

let currentLanguage = readStoredLanguage();
const listeners = new Set();

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && DICTIONARIES[stored]) return stored;
  } catch {
    /* ignore */
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
    /* ignore */
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
 * Registers a new top-level namespace in a dictionary.
 * Used by the admin panel to add `admin.*` keys without touching en.json / bn.json.
 * Safe to call multiple times — existing namespaces are overwritten idempotently.
 */
export function registerDictionary(lang, namespace, dictionary) {
  if (!DICTIONARIES[lang] || typeof namespace !== 'string' || !dictionary) return;
  DICTIONARIES[lang][namespace] = dictionary;
}

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