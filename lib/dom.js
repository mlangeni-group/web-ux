import $ from 'jquery';

/**
 * Smooth scroll to a selector or number.
 * @param {string|number|HTMLElement} target - CSS selector, y coordinate, or element.
 * @param {Object} options - { behavior: 'smooth', block: 'start' } (native scrollIntoView options)
 */
export function scrollTo(target, options = {}) {
  let el;
  if (typeof target === 'string') {
    el = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    el = target;
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target, left: 0, behavior: options.behavior || 'smooth' });
    return;
  }
  if (el) {
    el.scrollIntoView({ behavior: options.behavior || 'smooth', ...options });
  }
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Check if an element is in the viewport.
 * @param {HTMLElement|string} el - Element or selector.
 * @returns {boolean}
 */
export function isInViewport(el) {
  if (typeof el === 'string') el = document.querySelector(el);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Serialise a form into a plain object (or JSON string).
 * @param {HTMLFormElement|string} form - Form element or selector.
 * @param {boolean} asJson - If true, returns a JSON string.
 * @returns {Object|string}
 */
export function serializeForm(form, asJson = false) {
  const $form = $(form);
  const arr = $form.serializeArray();
  const obj = {};
  arr.forEach(({ name, value }) => {
    // Handle multiple values (e.g., checkboxes)
    if (obj[name] !== undefined) {
      if (!Array.isArray(obj[name])) {
        obj[name] = [obj[name]];
      }
      obj[name].push(value);
    } else {
      obj[name] = value;
    }
  });
  return asJson ? JSON.stringify(obj) : obj;
}

/**
 * Get form data as an object (alias for serializeForm without JSON).
 */
export function getFormData(form) {
  return serializeForm(form, false);
}

export function infiniteScroll(containerSelector, callback, threshold = 100) {
  const $container = $(containerSelector);
  const scrollable = $container[0] === window ? window : $container[0];
  let loading = false;
  const handler = () => {
    if (loading) return;
    const el = $container[0] === window ? document.documentElement : $container[0];
    const scrollTop = $container[0] === window ? $(window).scrollTop() : el.scrollTop;
    const scrollHeight = $container[0] === window ? document.body.scrollHeight : el.scrollHeight;
    const clientHeight = $container[0] === window ? window.innerHeight : el.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loading = true;
      callback().then(() => loading = false).catch(() => loading = false);
    }
  };
  $(scrollable).on('scroll', handler);
  return { off: () => $(scrollable).off('scroll', handler) };
}

export function lazyLoad(selector = '[data-src]') {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const src = el.getAttribute('data-src');
        if (src) {
          el.setAttribute('src', src);
          el.removeAttribute('data-src');
          observer.unobserve(el);
        }
      }
    });
  }, { rootMargin: '0px 0px 200px 0px' });
  document.querySelectorAll(selector).forEach(el => observer.observe(el));
}