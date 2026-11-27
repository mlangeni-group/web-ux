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

function interpolate(value, params) {
  return value.replace(/\{\{(\w+)\}\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) && params[name] != null
      ? String(params[name])
      : name
  ));
}

function resolveLocaleValue(key) {
  return getValue(catalogs.get(currentLocale), key)
    ?? getValue(catalogs.get(DEFAULT_LOCALE), key);
}

function validateLocale(locale) {
  if (typeof locale !== 'string' || !locale.trim()) {
    throw new TypeError('Locale must be a non-empty BCP 47 language tag.');
  }
  const [normalized] = Intl.getCanonicalLocales(locale.trim());
  if (!normalized) throw new TypeError('Locale must be a valid BCP 47 language tag.');
  return normalized;
}

export function load(newTranslations, locale = currentLocale) {
  if (!isRecord(newTranslations)) {
    throw new TypeError('Translations must be provided as an object.');
  }
  const normalizedLocale = validateLocale(locale);
  catalogs.set(
    normalizedLocale,
    mergeCatalog(catalogs.get(normalizedLocale) || {}, newTranslations)
  );
}

export function t(key, params = {}) {
  if (typeof key !== 'string') throw new TypeError('Translation key must be a string.');
  if (!isRecord(params)) throw new TypeError('Translation parameters must be provided as an object.');
  const value = resolveLocaleValue(key);
  if (typeof value !== 'string') {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }
  return interpolate(value, params);
}

export function tp(key, count, params = {}) {
  if (typeof key !== 'string') throw new TypeError('Translation key must be a string.');
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    throw new TypeError('Plural count must be a finite number.');
  }
  if (!isRecord(params)) throw new TypeError('Translation parameters must be provided as an object.');

  const value = resolveLocaleValue(key);
  if (typeof value === 'string') return interpolate(value, { ...params, count });
  if (!isRecord(value)) {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }

  const category = new Intl.PluralRules(currentLocale).select(count);
  const message = value[category] ?? value.other;
  if (typeof message !== 'string') {
    console.warn(`Missing plural translation category "${category}" for key: ${key}`);
    return key;
  }
  return interpolate(message, { ...params, count });
}

export function formatNumber(value, options = {}, locale = currentLocale) {
  return new Intl.NumberFormat(validateLocale(locale), options).format(value);
}

export function formatCurrency(value, currency, options = {}, locale = currentLocale) {
  if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
    throw new TypeError('Currency must be a valid three-letter ISO 4217 code.');
  }
  return new Intl.NumberFormat(validateLocale(locale), {
    ...options,
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(value, options = {}, locale = currentLocale) {
  return new Intl.DateTimeFormat(validateLocale(locale), options).format(value);
}

export function formatRelativeTime(value, unit, options = {}, locale = currentLocale) {
  if (!['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second'].includes(unit)) {
    throw new TypeError('Unsupported relative-time unit.');
  }
  return new Intl.RelativeTimeFormat(validateLocale(locale), options).format(value, unit);
}

export function setLocale(locale) {
  currentLocale = validateLocale(locale);
}

export function getLocale() {
  return currentLocale;
}
