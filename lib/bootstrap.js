import $ from 'jquery';
import * as bootstrap from 'bootstrap';
import { events } from './utils.js';

let _toastQueue = [];
let componentSequence = 0;

// Default cozy options
let cozyDefaults = {
  blurBackdrop: true,
  modalFade: true,
  toastFade: true,
  offcanvasFade: true,
  alertFade: true,
  smoothError: true,
};

export function setCozyOptions(opts) {
  cozyDefaults = { ...cozyDefaults, ...opts };
}

function makeId(prefix) {
  componentSequence += 1;
  return `${prefix}-${Date.now()}-${componentSequence}`;
}

function appendContent(target, value, allowHtml = false) {
  if (value instanceof Node) {
    target.appendChild(value);
  } else if (allowHtml) {
    target.innerHTML = String(value ?? '');
  } else {
    target.textContent = String(value ?? '');
  }
}

function addClasses(element, value = '') {
  for (const className of String(value).split(/\s+/).filter(Boolean)) {
    if (/^[A-Za-z_][A-Za-z\d_-]*$/.test(className)) element.classList.add(className);
  }
}

function createButton(text, className, dismiss) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  addClasses(button, className || 'btn-secondary');
  button.textContent = String(text ?? '');
  if (dismiss) button.setAttribute('data-bs-dismiss', 'modal');
  return button;
}

// ---------- Tooltips & Popovers ----------
export function initTooltipsAndPopovers(scope = 'body') {
  $(scope).find('[data-bs-toggle="tooltip"]').each(function () {
    new bootstrap.Tooltip(this);
  });
  $(scope).find('[data-bs-toggle="popover"]').each(function () {
    new bootstrap.Popover(this);
  });
}

// ---------- Modal ----------
export function modal({
  title = '',
  body = '',
  buttons = [],
  html = false,
  static: staticBackdrop = true,
  fade = cozyDefaults.modalFade,
  blurBackdrop = cozyDefaults.blurBackdrop,
  customClass = '',
} = {}) {
  const modalId = makeId('webux-modal');
  const root = document.createElement('div');
  root.className = `modal${fade ? ' fade' : ''}`;
  addClasses(root, customClass);
  root.id = modalId;
  root.tabIndex = -1;
  root.setAttribute('aria-labelledby', `${modalId}-title`);
  root.setAttribute('aria-hidden', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'modal-dialog';
  const content = document.createElement('div');
  content.className = 'modal-content';
  const header = document.createElement('div');
  header.className = 'modal-header';
  const heading = document.createElement('h5');
  heading.className = 'modal-title';
  heading.id = `${modalId}-title`;
  appendContent(heading, title);
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'modal');
  closeButton.setAttribute('aria-label', 'Close');
  header.append(heading, closeButton);

  const bodyElement = document.createElement('div');
  bodyElement.className = 'modal-body';
  appendContent(bodyElement, body, html);
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  const buttonElements = buttons.map(buttonConfig => {
    const button = createButton(buttonConfig.text, buttonConfig.class, buttonConfig.dismiss);
    footer.appendChild(button);
    return { button, buttonConfig };
  });

  content.append(header, bodyElement, footer);
  dialog.appendChild(content);
  root.appendChild(dialog);
  document.body.appendChild(root);

  const $el = $(root);
  const instance = new bootstrap.Modal(root, {
    backdrop: staticBackdrop ? 'static' : true,
    keyboard: !staticBackdrop,
  });

  $el.on('shown.bs.modal', () => {
    const focusable = $el.find('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable.first().focus();
  });

  // Blur backdrop effect
  if (blurBackdrop) {
    $el.on('show.bs.modal', () => $('.modal-backdrop').addClass('cozy-blur'));
    $el.on('hide.bs.modal', () => $('.modal-backdrop').removeClass('cozy-blur'));
  }

  // Button handlers
  buttonElements.forEach(({ button, buttonConfig }) => {
    if (typeof buttonConfig.handler === 'function') {
      button.addEventListener('click', event => buttonConfig.handler(event, instance));
    }
  });

  $el.on('hidden.bs.modal', () => $el.remove());
  instance.show();
  return instance;
}

// ---------- Offcanvas ----------
export function offcanvas({ title, body, html = false, placement = 'start', fade = cozyDefaults.offcanvasFade } = {}) {
  if (!['start', 'end', 'top', 'bottom'].includes(placement)) {
    throw new TypeError('Offcanvas placement must be start, end, top, or bottom.');
  }
  const id = makeId('webux-offcanvas');
  const root = document.createElement('div');
  root.className = `offcanvas offcanvas-${placement}${fade ? ' cozy-offcanvas' : ''}`;
  root.tabIndex = -1;
  root.id = id;
  root.setAttribute('aria-labelledby', `${id}-label`);
  const header = document.createElement('div');
  header.className = 'offcanvas-header';
  const heading = document.createElement('h5');
  heading.className = 'offcanvas-title';
  heading.id = `${id}-label`;
  appendContent(heading, title);
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'offcanvas');
  closeButton.setAttribute('aria-label', 'Close');
  header.append(heading, closeButton);
  const bodyElement = document.createElement('div');
  bodyElement.className = 'offcanvas-body';
  appendContent(bodyElement, body, html);
  root.append(header, bodyElement);
  document.body.appendChild(root);
  const instance = new bootstrap.Offcanvas(root);
  instance.show();
  return instance;
}

// ---------- Toast ----------
export function toast({
  title = '',
  message,
  variant = 'info',
  delay = 5000,
  container = '#toast-container',
  fade = cozyDefaults.toastFade,
  assertive = variant === 'danger',
  onHidden,
} = {}) {
  if (!Number.isFinite(delay) || delay < 0) throw new TypeError('Toast delay must be a non-negative finite number.');
  let containerElement = document.querySelector(container);
  if (!containerElement) {
    const idSelector = /^#([\w-]+)$/.exec(container);
    const classSelector = /^\.([\w-]+)$/.exec(container);
    if (container !== '#toast-container' && !idSelector && !classSelector) {
      throw new Error(`Toast container not found: ${container}`);
    }
    containerElement = document.createElement('div');
    containerElement.id = idSelector?.[1] || makeId('webux-toast-container');
    containerElement.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    if (classSelector) containerElement.classList.add(classSelector[1]);
    document.body.appendChild(containerElement);
  }

  const toastId = makeId('webux-toast');
  const bgClass = { success: 'bg-success text-white', danger: 'bg-danger text-white', warning: 'bg-warning', info: 'bg-info' }[variant] || 'bg-info';
  const toastElement = document.createElement('div');
  toastElement.id = toastId;
  toastElement.className = 'toast';
  toastElement.setAttribute('role', assertive ? 'alert' : 'status');
  toastElement.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  toastElement.setAttribute('aria-atomic', 'true');
  toastElement.dataset.bsDelay = String(delay);
  const header = document.createElement('div');
  header.className = `toast-header ${bgClass}`;
  const heading = document.createElement('strong');
  heading.className = 'me-auto';
  heading.textContent = String(title || variant.toUpperCase());
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'btn-close';
  closeButton.setAttribute('data-bs-dismiss', 'toast');
  closeButton.setAttribute('aria-label', 'Close');
  header.append(heading, closeButton);
  const bodyElement = document.createElement('div');
  bodyElement.className = 'toast-body';
  bodyElement.textContent = String(message ?? '');
  toastElement.append(header, bodyElement);
  containerElement.appendChild(toastElement);
  const $toast = $(toastElement);

  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (fade && !reducedMotion) {
    $toast.css({ opacity: 0, transform: 'translateY(20px)' });
    $toast.animate({ opacity: 1, transform: 'translateY(0)' }, 300);
  }

  const bsToast = new bootstrap.Toast($toast[0]);
  bsToast.show();

  $toast.on('hidden.bs.toast', () => {
    if (typeof onHidden === 'function') onHidden();
    if (fade && !reducedMotion) {
      $toast.animate({ opacity: 0, marginBottom: '-2rem', padding: 0 }, 200, () => $toast.remove());
    } else {
      $toast.remove();
    }
  });

  return bsToast;
}

export function toastQueue(options) {
  _toastQueue.push(options);
  if (_toastQueue.length === 1) showNextToast();
}

function showNextToast() {
  if (_toastQueue.length === 0) return;
  const opts = _toastQueue.shift();
  toast({ ...opts, onHidden: showNextToast });
}

export const toastSuccess = (message, title = 'Success') => toast({ title, message, variant: 'success' });
export const toastError = (message, title = 'Error') => toast({ title, message, variant: 'danger' });
export const toastWarning = (message, title = 'Warning') => toast({ title, message, variant: 'warning' });

// ---------- Alert ----------
export function alert(message, variant = 'info', target = 'body', dismissible = true, fade = cozyDefaults.alertFade) {
  const alertId = makeId('webux-alert');
  const alertElement = document.createElement('div');
  alertElement.id = alertId;
  alertElement.className = `alert alert-${/^[\w-]+$/.test(variant) ? variant : 'info'}${dismissible ? ' alert-dismissible' : ''}${fade ? ' fade show' : ''}`;
  alertElement.setAttribute('role', 'alert');
  const content = document.createElement('span');
  content.textContent = String(message ?? '');
  alertElement.appendChild(content);
  if (dismissible) {
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.setAttribute('aria-label', 'Close');
    alertElement.appendChild(closeButton);
  }
  const targetElement = document.querySelector(target);
  if (!targetElement) throw new Error(`Alert target not found: ${target}`);
  targetElement.prepend(alertElement);
  const $alert = $(alertElement);
  if (fade) {
    $alert.hide().slideDown(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 300);
  }
  return $alert;
}

// ---------- Carousel, Collapse, Tabs, etc. ----------
export function carousel(selector, options = {}) {
  const el = $(selector)[0];
  return el ? new bootstrap.Carousel(el, options) : null;
}
export function collapse(selector, options = {}) {
  const el = $(selector)[0];
  return el ? new bootstrap.Collapse(el, options) : null;
}
export function tab(selector) {
  const triggerEl = document.querySelector(`[data-bs-target="${selector}"]`);
  if (triggerEl) new bootstrap.Tab(triggerEl).show();
}
export function popover(element, options = {}) {
  return new bootstrap.Popover($(element)[0], options);
}
export function tooltip(element, options = {}) {
  return new bootstrap.Tooltip($(element)[0], options);
}
export function dropdown(element) {
  return new bootstrap.Dropdown($(element)[0]);
}

// ---------- Notification Center ----------
let _notifications = [];
export function notify({ title, message, variant = 'info' }) {
  const id = Date.now();
  _notifications.push({ id, title, message, variant, read: false, timestamp: new Date() });
  toast({ title, message, variant });
  events && events.emit('notification:new', _notifications); // if events imported
  return id;
}
export function getNotifications() { return _notifications; }
export function markNotificationRead(id) {
  const n = _notifications.find(n => n.id === id);
  if (n) n.read = true;
}
export function clearNotifications() { _notifications = []; }