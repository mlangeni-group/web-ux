const DEFAULT_LOCALE = 'en';
const catalogs = new Map();
let currentLocale = DEFAULT_LOCALE;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getValue(catalog, key) {
  return key.split('.').reduce((value, part) => (
    isRecord(value) && Object.prototype.hasOwnProperty.call(value, part)
      ? value[part]
      : undefined
  ), catalog);
}

function mergeCatalog(existing, updates) {
  const catalog = { ...existing };
  for (const [key, value] of Object.entries(updates)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    catalog[key] = isRecord(value) && isRecord(existing[key])
      ? mergeCatalog(existing[key], value)
      : value;
  }
  return catalog;
}

export function load(newTranslations, locale = currentLocale) {
  if (!isRecord(newTranslations)) {
    throw new TypeError('Translations must be provided as an object.');
  }
  if (typeof locale !== 'string' || !locale.trim()) {
    throw new TypeError('Locale must be a non-empty string.');
  }

  const normalizedLocale = locale.trim();
  catalogs.set(
    normalizedLocale,
    mergeCatalog(catalogs.get(normalizedLocale) || {}, newTranslations)
  );
}

export function t(key, params = {}) {
  if (typeof key !== 'string') {
    throw new TypeError('Translation key must be a string.');
  }
  if (!isRecord(params)) {
    throw new TypeError('Translation parameters must be provided as an object.');
  }

  const value = getValue(catalogs.get(currentLocale), key)
    ?? getValue(catalogs.get(DEFAULT_LOCALE), key);
  if (typeof value !== 'string') {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }

  return value.replace(/\{\{(\w+)\}\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) && params[name] != null
      ? String(params[name])
      : name
  ));
}

export function setLocale(locale) {
  if (typeof locale !== 'string' || !locale.trim()) {
    throw new TypeError('Locale must be a non-empty string.');
  }
  currentLocale = locale.trim();
}

export function getLocale() {
  return currentLocale;
}
