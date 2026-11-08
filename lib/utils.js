import $ from 'jquery';

export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function deepClone(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export const storage = {
  set(key, value, ttlSeconds = null) {
    const item = { value, expires: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null };
    localStorage.setItem(key, JSON.stringify(item));
  },
  get(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const item = JSON.parse(raw);
      if (item.expires && Date.now() > item.expires) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch { return null; }
  },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

export function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

export function randomId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

export function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export const queryString = {
  stringify: obj => Object.entries(obj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'),
  parse: str => str.replace(/^\?/, '').split('&').reduce((acc, pair) => {
    const [k, v] = pair.split('=');
    acc[decodeURIComponent(k)] = v ? decodeURIComponent(v) : '';
    return acc;
  }, {}),
};

export const date = {
  format: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    return format
      .replace('YYYY', d.getFullYear())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'))
      .replace('HH', String(d.getHours()).padStart(2, '0'))
      .replace('mm', String(d.getMinutes()).padStart(2, '0'))
      .replace('ss', String(d.getSeconds()).padStart(2, '0'));
  },
  relativeTime: date => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} mon ago`;
    const years = Math.floor(days / 365);
    return `${years} yr ago`;
  }
};

export const number = {
  format: (num, locales = 'en-US') => new Intl.NumberFormat(locales).format(num),
  currency: (num, currency = 'USD', locales = 'en-US') => new Intl.NumberFormat(locales, { style: 'currency', currency }).format(num),
};

export const isEmail = str => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
export const isUrl = str => { try { new URL(str); return true; } catch { return false; } };
export const isNumeric = str => !isNaN(str) && !isNaN(parseFloat(str));

export function debounceLeading(fn, delay) {
  let timer, canRun = true;
  return function (...args) {
    if (canRun) { fn.apply(this, args); canRun = false; }
    clearTimeout(timer);
    timer = setTimeout(() => canRun = true, delay);
  };
}
/**
 * Simple Pub/Sub event bus.
 */
const listeners = {};
export const events = {
  on(event, fn) {
    (listeners[event] = listeners[event] || []).push(fn);
    return () => events.off(event, fn); // return unsubscribe function
  },
  off(event, fn) {
    const fns = listeners[event];
    if (!fns) return;
    listeners[event] = fns.filter(f => f !== fn);
  },
  emit(event, ...args) {
    (listeners[event] || []).forEach(fn => fn(...args));
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

  if (document.getElementById('cozy-theme-style')) return;

  const style = document.createElement('style');
  style.id = 'cozy-theme-style';
  style.textContent = `
    body {
      background-color: ${backgroundColor};
      transition: background-color 0.3s ease;
    }
    *, *::before, *::after {
      transition: all 0.2s ease-in-out;
    }
    .card, .modal-content, .offcanvas, .toast, .alert, .list-group-item {
      border-radius: ${borderRadius} !important;
      box-shadow: ${boxShadow} !important;
    }
    .btn {
      border-radius: ${borderRadius};
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.1);
    }
    .btn:active {
      transform: translateY(0);
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
    .alert {
      transition: all 0.3s ease;
    }
    .progress-bar {
      transition: width 0.6s ease;
    }
    .invalid-feedback {
      transition: all 0.2s ease;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Lazy load images with Intersection Observer.
 */
export function lazyLoadImages(selector = 'img[data-src]', rootMargin = '200px') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        if (img.dataset.srcset) img.srcset = img.dataset.srcset;
        observer.unobserve(img);
      }
    });
  }, { rootMargin });
  document.querySelectorAll(selector).forEach(img => observer.observe(img));
}

/**
 * Load a script dynamically.
 */
export function loadScript(url, attrs = {}) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Responsive breakpoint listener (Bootstrap 5 breakpoints used).
 */
export function onBreakpoint(callback) {
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
  const handler = () => {
    const bp = getCurrent();
    if (bp !== current) {
      current = bp;
      callback(bp);
    }
  };
  window.addEventListener('resize', handler);
  callback(current);
  return () => window.removeEventListener('resize', handler); // cleanup function
}

/**
 * Color scheme (dark/light) init + toggle.
 */
export function initColorScheme({
  storageKey = 'color-scheme',
  attribute = 'data-bs-theme',  // Bootstrap 5.3+
  target = document.documentElement,
} = {}) {
  const stored = localStorage.getItem(storageKey);
  const apply = (scheme) => target.setAttribute(attribute, scheme);

  if (stored) {
    apply(stored);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(prefersDark ? 'dark' : 'light');
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(storageKey)) return; // manual override takes precedence
    apply(e.matches ? 'dark' : 'light');
  });

  return {
    toggle: () => {
      const current = target.getAttribute(attribute) === 'dark' ? 'light' : 'dark';
      apply(current);
      localStorage.setItem(storageKey, current);
    },
    set: (scheme) => {
      apply(scheme);
      localStorage.setItem(storageKey, scheme);
    },
  };
}

/**
 * Smooth scroll to element.
 */
export function scrollTo(target, offset = 0) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
}

/**
 * Trigger a temporary CSS transition class.
 */
export function triggerTransition(el, className, duration = 300) {
  const $el = $(el);
  $el.addClass(className);
  setTimeout(() => $el.removeClass(className), duration);
}