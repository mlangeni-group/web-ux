let translations = {};
let currentLocale = 'en';

export function load(newTranslations) {
  translations = { ...translations, ...newTranslations };
}

export function t(key, params = {}) {
  let template = translations[key];
  if (!template) {
    console.warn(`Missing translation key: ${key}`);
    return key;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, word) => params[word] || word);
}

export function setLocale(locale) {
  currentLocale = locale;
  // If you have multi‑locale data, you could load dynamically here
}

export function getLocale() {
  return currentLocale;
}