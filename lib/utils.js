import $ from 'jquery';

function assertFunction(fn, name = 'Function') {
  if (typeof fn !== 'function') throw new TypeError(`${name} must be a function.`);
}

function assertDelay(delay, name = 'Delay') {
  if (!Number.isFinite(delay) || delay < 0) {
    throw new TypeError(`${name} must be a non-negative finite number.`);
  }
}

export function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  assertFunction(fn, 'Callback');
  assertDelay(delay);
  if (!leading && !trailing) throw new TypeError('Debounce must enable leading or trailing execution.');

  let timer;
  let pendingArgs;
  let pendingThis;
  let result;
  const debounced = function (...args) {
    const shouldRunLeading = leading && timer === undefined;
    if (timer !== undefined) clearTimeout(timer);

    if (shouldRunLeading) {
      result = fn.apply(this, args);
    } else if (trailing) {
      pendingArgs = args;
      pendingThis = this;
    }

    timer = setTimeout(() => {
      timer = undefined;
      if (pendingArgs) {
        const callArgs = pendingArgs;
        const callThis = pendingThis;
        pendingArgs = pendingThis = undefined;
        result = fn.apply(callThis, callArgs);
      }
    }, delay);
    return result;
  };

  debounced.cancel = () => {
    clearTimeout(timer);
    timer = pendingArgs = pendingThis = undefined;
  };
  debounced.flush = () => {
    if (timer === undefined) return result;
    clearTimeout(timer);
    timer = undefined;
    if (pendingArgs) {
      const callArgs = pendingArgs;
      const callThis = pendingThis;
      pendingArgs = pendingThis = undefined;
      result = fn.apply(callThis, callArgs);
    }
    return result;
  };
  return debounced;
}

export function throttle(fn, limit, { leading = true, trailing = false } = {}) {
  assertFunction(fn, 'Callback');
  assertDelay(limit, 'Limit');
  if (!leading && !trailing) throw new TypeError('Throttle must enable leading or trailing execution.');

  let timer;
  let lastRun = 0;
  let pendingArgs;
  let pendingThis;
  let result;
  const throttled = function (...args) {
    const now = Date.now();
    if (!lastRun && !leading) lastRun = now;
    const remaining = limit - (now - lastRun);

    if (remaining <= 0 || remaining > limit) {
      clearTimeout(timer);
      timer = undefined;
      pendingArgs = pendingThis = undefined;
      lastRun = now;
      result = fn.apply(this, args);
    } else if (trailing) {
      pendingArgs = args;
      pendingThis = this;
      if (timer === undefined) {
        timer = setTimeout(() => {
          timer = undefined;
          lastRun = leading ? Date.now() : 0;
          const callArgs = pendingArgs;
          const callThis = pendingThis;
          pendingArgs = pendingThis = undefined;
          result = fn.apply(callThis, callArgs);
        }, remaining);
      }
    }
    return result;
  };

  throttled.cancel = () => {
    clearTimeout(timer);
    timer = pendingArgs = pendingThis = undefined;
    lastRun = 0;
  };
  throttled.flush = () => {
    if (timer === undefined) return result;
    clearTimeout(timer);
    timer = undefined;
    lastRun = Date.now();
    const callArgs = pendingArgs;
    const callThis = pendingThis;
    pendingArgs = pendingThis = undefined;
    result = fn.apply(callThis, callArgs);
    return result;
  };
  return throttled;
}

export function once(fn) {
  assertFunction(fn, 'Callback');
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

export function sleep(delay, { signal } = {}) {
  assertDelay(delay);
  if (signal?.aborted) return Promise.reject(signal.reason || new DOMException('The operation was aborted.', 'AbortError'));

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, delay);
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
    };
    signal?.addEventListener('abort', abort, { once: true });
  });
}

export function clamp(value, min, max) {
  if (![value, min, max].every(Number.isFinite) || min > max) {
    throw new TypeError('Clamp requires finite numbers and a minimum no greater than the maximum.');
  }
  return Math.min(Math.max(value, min), max);
}

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function deepClone(value) {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value);
  return cloneFallback(value, new WeakMap());
}

function cloneFallback(value, seen) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    for (const [key, item] of value) copy.set(cloneFallback(key, seen), cloneFallback(item, seen));
    return copy;
  }
  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    for (const item of value) copy.add(cloneFallback(item, seen));
    return copy;
  }
  if (value instanceof DataView) {
    const buffer = cloneFallback(value.buffer, seen);
    const copy = new DataView(buffer, value.byteOffset, value.byteLength);
    seen.set(value, copy);
    return copy;
  }
  if (ArrayBuffer.isView(value)) return new value.constructor(value);
  if (value instanceof ArrayBuffer) return value.slice(0);
  if (!Array.isArray(value) && !isPlainObject(value)) {
    throw new TypeError('Cannot clone this value in an environment without structuredClone.');
  }

  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if ('value' in descriptor) descriptor.value = cloneFallback(descriptor.value, seen);
    Object.defineProperty(copy, key, descriptor);
  }
  return copy;
}

const STORAGE_PREFIX = 'webux:storage:';
const STORAGE_VERSION = 1;
function storageKey(key) {
  if (typeof key !== 'string' || !key) throw new TypeError('Storage key must be a non-empty string.');
  return `${STORAGE_PREFIX}${key}`;
}

export const storage = {
  set(key, value, ttlSeconds = null) {
    if (ttlSeconds !== null && (!Number.isFinite(ttlSeconds) || ttlSeconds < 0)) {
      throw new TypeError('Storage TTL must be null or a non-negative finite number.');
    }
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      throw new TypeError('Storage value must be JSON serializable.');
    }
    const expires = ttlSeconds === null ? null : Date.now() + ttlSeconds * 1000;
    if (expires !== null && !Number.isFinite(expires)) {
      throw new TypeError('Storage TTL is too large.');
    }
    const item = JSON.stringify({
      version: STORAGE_VERSION,
      value,
      expires,
    });
    if (item === undefined) throw new TypeError('Storage value must be JSON serializable.');
    localStorage.setItem(storageKey(key), item);
  },
  get(key) {
    const prefixedKey = storageKey(key);
    const raw = localStorage.getItem(prefixedKey) ?? localStorage.getItem(key);
    if (raw === null) return null;

    let item;
    try {
      item = JSON.parse(raw);
    } catch {
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(key);
      return null;
    }
    if (!item || typeof item !== 'object'
      || (item.version !== undefined && item.version !== STORAGE_VERSION)
      || !Object.prototype.hasOwnProperty.call(item, 'value')) {
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(key);
      return null;
    }
    if (item.expires !== null && (!Number.isFinite(item.expires) || Date.now() >= item.expires)) {
      localStorage.removeItem(prefixedKey);
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  },
  remove(key) {
    localStorage.removeItem(storageKey(key));
    localStorage.removeItem(key);
  },
  clear() {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
    }
  },
};

export async function copyToClipboard(text) {
  if (typeof text !== 'string') throw new TypeError('Clipboard content must be a string.');
  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(text);
    return;
  }

  if (!globalThis.document?.body || typeof document.execCommand !== 'function') {
    throw new Error('Clipboard access is unavailable in this environment.');
  }
  const textarea = document.createElement('textarea');
  const activeElement = document.activeElement;
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    if (!document.execCommand('copy')) throw new Error('The browser denied clipboard access.');
  } finally {
    textarea.remove();
    activeElement?.focus?.();
  }
}

export function formatBytes(bytes, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes < 0) throw new TypeError('Bytes must be a non-negative finite number.');
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 20) {
    throw new TypeError('Decimals must be an integer between 0 and 20.');
  }
  if (bytes === 0) return '0 Bytes';
  if (bytes < 1024) return `${Number(bytes.toFixed(decimals))} Bytes`;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${Number((bytes / (1024 ** unit)).toFixed(decimals))} ${sizes[unit]}`;
}

function getCrypto() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('A cryptographically secure random number generator is required.');
  return globalThis.crypto;
}

export function randomId(length = 8) {
  if (!Number.isInteger(length) || length < 0 || length > 1024) {
    throw new TypeError('ID length must be an integer between 0 and 1024.');
  }
  if (length === 0) return '';
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
  const limit = 256 - (256 % alphabet.length);
  let result = '';
  const bytes = new Uint8Array(Math.max(16, Math.ceil(length * 1.5)));
  const crypto = getCrypto();
  while (result.length < length) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < limit) result += alphabet[byte % alphabet.length];
      if (result.length === length) break;
    }
  }
  return result;
}

export function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    throw new TypeError('Deep merge requires plain objects.');
  }
  const output = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    output[key] = isPlainObject(value) && isPlainObject(target[key])
      ? deepMerge(target[key], value)
      : value;
  }
  return output;
}

export function uuid() {
  const crypto = getCrypto();
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const queryString = {
  stringify(object) {
    if (object === null || typeof object !== 'object' || Array.isArray(object)) {
      throw new TypeError('Query parameters must be an object.');
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(object)) {
      if (value === null || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item !== null && item !== undefined) params.append(key, String(item));
      }
    }
    return params.toString();
  },
  parse(query) {
    if (typeof query !== 'string') throw new TypeError('Query string must be a string.');
    const params = new URLSearchParams(query.replace(/^[?#]/, '').split('#', 1)[0]);
    const result = {};
    for (const [key, value] of params) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        result[key] = Array.isArray(result[key]) ? [...result[key], value] : [result[key], value];
      } else {
        Object.defineProperty(result, key, { value, writable: true, enumerable: true, configurable: true });
      }
    }
    return result;
  },
};

export const date = {
  format(value, format = 'YYYY-MM-DD') {
    const dateValue = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateValue.getTime())) throw new TypeError('Date must be valid.');
    if (typeof format !== 'string') throw new TypeError('Date format must be a string.');
    const parts = {
      YYYY: String(dateValue.getFullYear()),
      MM: String(dateValue.getMonth() + 1).padStart(2, '0'),
      DD: String(dateValue.getDate()).padStart(2, '0'),
      HH: String(dateValue.getHours()).padStart(2, '0'),
      mm: String(dateValue.getMinutes()).padStart(2, '0'),
      ss: String(dateValue.getSeconds()).padStart(2, '0'),
    };
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, token => parts[token]);
  },
  relativeTime(value) {
    const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
    if (!Number.isFinite(timestamp)) throw new TypeError('Date must be valid.');
    const seconds = Math.round((timestamp - Date.now()) / 1000);
    const units = [
      ['year', 31536000],
      ['month', 2592000],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1],
    ];
    const [unit, size] = units.find(([, unitSize]) => Math.abs(seconds) >= unitSize) || ['second', 1];
    const count = Math.round(seconds / size);
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(count, unit);
  },
};

export const number = {
  format(num, locales = 'en-US', options = {}) {
    if (typeof num !== 'number' || !Number.isFinite(num)) throw new TypeError('Number must be finite.');
    return new Intl.NumberFormat(locales, options).format(num);
  },
  currency(num, currency = 'USD', locales = 'en-US', options = {}) {
    if (typeof num !== 'number' || !Number.isFinite(num)) throw new TypeError('Number must be finite.');
    return new Intl.NumberFormat(locales, { ...options, style: 'currency', currency }).format(num);
  },
};

export const isEmail = str => typeof str === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
export function isUrl(value, protocols = ['http:', 'https:']) {
  if (typeof value !== 'string' || !Array.isArray(protocols)) return false;
  try {
    const url = new URL(value);
    return protocols.includes(url.protocol);
  } catch {
    return false;
  }
}
export const isNumeric = value => (
  (typeof value === 'number' || typeof value === 'string')
  && String(value).trim() !== ''
  && Number.isFinite(Number(value))
);

export function debounceLeading(fn, delay) {
  return debounce(fn, delay, { leading: true, trailing: false });
}

/**
 * Simple Pub/Sub event bus.
 */
const listeners = new Map();
function eventListeners(event, create = false) {
  if ((typeof event !== 'string' && typeof event !== 'symbol') || event === '') {
    throw new TypeError('Event name must be a non-empty string or symbol.');
  }
  let subscribers = listeners.get(event);
  if (!subscribers && create) {
    subscribers = new Set();
    listeners.set(event, subscribers);
  }
  return subscribers;
}

export const events = {
  on(event, fn) {
    assertFunction(fn, 'Event listener');
    eventListeners(event, true).add(fn);
    return () => events.off(event, fn);
  },
  once(event, fn) {
    assertFunction(fn, 'Event listener');
    const wrapped = (...args) => {
      events.off(event, wrapped);
      fn(...args);
    };
    return events.on(event, wrapped);
  },
  off(event, fn) {
    const subscribers = eventListeners(event);
    if (!subscribers) return;
    if (fn === undefined) {
      listeners.delete(event);
      return;
    }
    subscribers.delete(fn);
    if (subscribers.size === 0) listeners.delete(event);
  },
  emit(event, ...args) {
    for (const fn of [...(eventListeners(event) || [])]) fn(...args);
  },
  clear(event) {
    if (event === undefined) listeners.clear();
    else listeners.delete(event);
  },
  listenerCount(event) {
    return eventListeners(event)?.size || 0;
  },
};

/**
 * Cozy theme injection – adds soft styles globally.
 */
export function cozyTheme(options = {}) {
  const {
    primaryColor = '#6c757d',
    backgroundColor = '#f8f9fa',
    borderRadius = '0.5rem',
    boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.05)',
  } = options;

  const cssSupports = globalThis.CSS?.supports?.bind(globalThis.CSS);
  for (const [property, value] of [
    ['color', primaryColor],
    ['background-color', backgroundColor],
    ['border-radius', borderRadius],
    ['box-shadow', boxShadow],
  ]) {
    if (typeof value !== 'string' || !value.trim() || (cssSupports && !cssSupports(property, value))) {
      throw new TypeError(`Invalid cozy theme value for ${property}.`);
    }
  }

  if (document.getElementById('cozy-theme-style')) return;

  const style = document.createElement('style');
  style.id = 'cozy-theme-style';
  style.textContent = `
    :root {
      --webux-cozy-primary: initial;
      --webux-cozy-background: initial;
      --webux-cozy-radius: initial;
      --webux-cozy-shadow: initial;
    }
    body { background-color: var(--webux-cozy-background); }
    .card, .modal-content, .offcanvas, .toast, .alert, .list-group-item {
      border-radius: var(--webux-cozy-radius) !important;
      box-shadow: var(--webux-cozy-shadow) !important;
    }
    .btn { border-radius: var(--webux-cozy-radius); }
    .btn-primary {
      background-color: var(--webux-cozy-primary);
      border-color: var(--webux-cozy-primary);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1);
    }
    .btn:active {
      transform: translateY(0);
    }
    @media (prefers-reduced-motion: no-preference) {
      body, .btn, .alert, .progress-bar, .invalid-feedback,
      .cozy-toast-fade, .offcanvas.cozy-offcanvas.show {
        transition: background-color 0.3s ease, opacity 0.3s ease,
          transform 0.3s ease, width 0.6s ease;
      }
    }
    .modal-backdrop.cozy-blur {
      backdrop-filter: blur(5px);
      background-color: rgba(0,0,0,0.4);
    }
    .cozy-toast-fade {
      transition: opacity 0.3s, transform 0.3s;
    }
    .offcanvas.cozy-offcanvas.show {
      transition: transform 0.3s ease;
    }
  `;
  document.head.appendChild(style);
  const variables = style.sheet?.cssRules[0]?.style;
  if (!variables) {
    style.remove();
    throw new Error('Unable to install the cozy theme stylesheet.');
  }
  variables.setProperty('--webux-cozy-primary', primaryColor);
  variables.setProperty('--webux-cozy-background', backgroundColor);
  variables.setProperty('--webux-cozy-radius', borderRadius);
  variables.setProperty('--webux-cozy-shadow', boxShadow);
}

/**
 * Lazy load images with Intersection Observer.
 */
export function lazyLoadImages(selector = 'img[data-src]', rootMargin = '200px') {
  const images = document.querySelectorAll(selector);
  if (typeof IntersectionObserver !== 'function') {
    images.forEach(img => {
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      if (img.dataset.src) img.src = img.dataset.src;
    });
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        if (img.dataset.src) img.src = img.dataset.src;
        observer.unobserve(img);
      }
    });
  }, { rootMargin });
  images.forEach(img => observer.observe(img));
  return () => observer.disconnect();
}

/**
 * Load a script dynamically.
 */
export function loadScript(url, attrs = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    return Promise.reject(new TypeError('Script URL must be a non-empty string.'));
  }
  if (!attrs || typeof attrs !== 'object' || Array.isArray(attrs)) {
    return Promise.reject(new TypeError('Script attributes must be an object.'));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const scriptUrl = new URL(url, document.baseURI);
    if (!['http:', 'https:', 'blob:'].includes(scriptUrl.protocol)
      || scriptUrl.username || scriptUrl.password) {
      reject(new TypeError('Script URL must use HTTP, HTTPS, or blob, without embedded credentials.'));
      return;
    }

    script.async = attrs.async === undefined ? true : Boolean(attrs.async);
    for (const [key, value] of Object.entries(attrs)) {
      if (/^on/i.test(key) || key === 'src' || key === 'async' || value === null || value === undefined || value === false) {
        continue;
      }
      script.setAttribute(key, value === true ? '' : String(value));
    }
    script.onload = () => resolve(script);
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load script: ${scriptUrl.href}`));
    };
    script.src = scriptUrl.href;
    document.head.appendChild(script);
  });
}

export function waitForElement(selector, { root = document.documentElement, timeout = 5000, signal } = {}) {
  if (typeof selector !== 'string' || !selector.trim()) {
    return Promise.reject(new TypeError('Selector must be a non-empty string.'));
  }
  if (!root || typeof root.querySelector !== 'function') {
    return Promise.reject(new TypeError('Root must support DOM queries.'));
  }
  if (!Number.isFinite(timeout) || timeout < 0) {
    return Promise.reject(new TypeError('Timeout must be a non-negative finite number.'));
  }
  if (signal && (typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) {
    return Promise.reject(new TypeError('Signal must be an AbortSignal.'));
  }

  let existing;
  try {
    existing = root.querySelector(selector);
  } catch (error) {
    return Promise.reject(error);
  }
  if (existing) return Promise.resolve(existing);
  if (signal?.aborted) {
    return Promise.reject(signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
  }
  if (typeof MutationObserver !== 'function') {
    return Promise.reject(new Error('MutationObserver is unavailable in this environment.'));
  }

  return new Promise((resolve, reject) => {
    let timer;
    const observer = new MutationObserver(() => {
      try {
        const element = root.querySelector(selector);
        if (element) finish(resolve, element);
      } catch (error) {
        finish(reject, error);
      }
    });
    const onAbort = () => finish(reject, signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
    const finish = (callback, result) => {
      observer.disconnect();
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      callback(result);
    };

    observer.observe(root, { childList: true, subtree: true });
    signal?.addEventListener('abort', onAbort, { once: true });
    if (timeout > 0) {
      timer = setTimeout(() => finish(reject, new Error(`Timed out waiting for element: ${selector}`)), timeout);
    }
  });
}

/**
 * Responsive breakpoint listener (Bootstrap 5 breakpoints used).
 */
export function onBreakpoint(callback) {
  assertFunction(callback, 'Breakpoint callback');
  const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
  };
  const getCurrent = () => {
    const w = window.innerWidth;
    if (w < breakpoints.sm) return 'xs';
    if (w < breakpoints.md) return 'sm';
    if (w < breakpoints.lg) return 'md';
    if (w < breakpoints.xl) return 'lg';
    if (w < breakpoints.xxl) return 'xl';
    return 'xxl';
  };

  let current = getCurrent();
  callback(current);
  current = getCurrent();
  const handler = () => {
    const bp = getCurrent();
    if (bp !== current) {
      current = bp;
      callback(bp);
    }
  };
  window.addEventListener('resize', handler, { passive: true });
  return () => window.removeEventListener('resize', handler);
}

/**
 * Color scheme (dark/light) init + toggle.
 */
export function initColorScheme({
  storageKey = 'color-scheme',
  attribute = 'data-bs-theme',
  target = document.documentElement,
} = {}) {
  if (!target || typeof target.setAttribute !== 'function') {
    throw new TypeError('Color scheme target must be an element.');
  }
  if (typeof storageKey !== 'string' || !storageKey || typeof attribute !== 'string' || !attribute) {
    throw new TypeError('Storage key and attribute must be non-empty strings.');
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const apply = scheme => target.setAttribute(attribute, scheme);
  const setScheme = scheme => {
    if (!['dark', 'light', 'system'].includes(scheme)) {
      throw new TypeError('Color scheme must be "dark", "light", or "system".');
    }
    if (scheme === 'system') {
      localStorage.removeItem(storageKey);
      apply(mediaQuery.matches ? 'dark' : 'light');
      return;
    }
    apply(scheme);
    localStorage.setItem(storageKey, scheme);
  };
  const isManualOverride = () => ['dark', 'light'].includes(localStorage.getItem(storageKey));
  const stored = localStorage.getItem(storageKey);

  if (stored === 'dark' || stored === 'light') {
    apply(stored);
  } else {
    if (stored !== null) localStorage.removeItem(storageKey);
    apply(mediaQuery.matches ? 'dark' : 'light');
  }

  const onSchemeChange = event => {
    if (isManualOverride()) return;
    apply(event.matches ? 'dark' : 'light');
  };
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onSchemeChange);
  } else {
    mediaQuery.addListener(onSchemeChange);
  }

  return {
    toggle() {
      const current = target.getAttribute(attribute) === 'dark' ? 'light' : 'dark';
      setScheme(current);
    },
    set: setScheme,
    destroy() {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', onSchemeChange);
      } else {
        mediaQuery.removeListener(onSchemeChange);
      }
    },
  };
}

/**
 * Smooth scroll to element.
 */
export function scrollTo(target, offset = 0) {
  if (!Number.isFinite(offset)) throw new TypeError('Scroll offset must be finite.');
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return false;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
  return true;
}

/**
 * Trigger a temporary CSS transition class.
 */
export function triggerTransition(el, className, duration = 300) {
  if (typeof className !== 'string' || !className.trim() || /\s/.test(className)) {
    throw new TypeError('Transition class must be a single non-empty class name.');
  }
  assertDelay(duration, 'Duration');
  const $el = $(el);
  $el.addClass(className);
  setTimeout(() => $el.removeClass(className), duration);
}