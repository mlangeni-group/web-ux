import $ from 'jquery';
import * as bootstrap from 'bootstrap';
import { events } from './utils';

let _toastQueue = [];

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
  static: staticBackdrop = true,
  fade = cozyDefaults.modalFade,
  blurBackdrop = cozyDefaults.blurBackdrop,
  customClass = '',
} = {}) {
  const modalId = `modal-${Date.now()}`;
  const btnHtml = buttons.map(btn => {
    const dismissAttr = btn.dismiss ? 'data-bs-dismiss="modal"' : '';
    return `<button type="button" class="btn ${btn.class || 'btn-secondary'}" ${dismissAttr} data-handler="${btn.handler ? 'true' : ''}">${btn.text}</button>`;
  }).join('');

  const fadeClass = fade ? 'fade' : '';
  const html = `<div class="modal ${fadeClass} ${customClass}" id="${modalId}" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">${title}</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">${btnHtml}</div>
    </div></div></div>`;

  $('body').append(html);
  const $el = $(`#${modalId}`);
  const instance = new bootstrap.Modal($el[0], {
    backdrop: staticBackdrop ? 'static' : true,
    keyboard: !staticBackdrop,
  });

  // Handle focus trap (basic)
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
  $el.find('.modal-footer [data-handler="true"]').each((idx, btn) => {
    const config = buttons[idx];
    if (config && typeof config.handler === 'function') {
      $(btn).on('click', (e) => config.handler(e, instance));
    }
  });

  $el.on('hidden.bs.modal', () => $el.remove());
  instance.show();
  return instance;
}

// ---------- Offcanvas ----------
export function offcanvas({ title, body, placement = 'start', fade = cozyDefaults.offcanvasFade } = {}) {
  const id = `offcanvas-${Date.now()}`;
  const fadeClass = fade ? 'cozy-offcanvas' : '';
  const html = `<div class="offcanvas offcanvas-${placement} ${fadeClass}" tabindex="-1" id="${id}" aria-labelledby="${id}-label">
    <div class="offcanvas-header"><h5 class="offcanvas-title" id="${id}-label">${title}</h5><button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button></div>
    <div class="offcanvas-body">${body}</div></div>`;
  $('body').append(html);
  const instance = new bootstrap.Offcanvas(document.getElementById(id));
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
} = {}) {
  const $container = $(container);
  if (!$container.length) {
    $('body').append('<div id="toast-container" class="toast-container position-fixed bottom-0 end-0 p-3" style="transition: all 0.3s ease;"></div>');
  }

  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2)}`;
  const bgClass = { success: 'bg-success text-white', danger: 'bg-danger text-white', warning: 'bg-warning', info: 'bg-info' }[variant] || 'bg-info';
  const fadeClass = fade ? 'cozy-toast-fade' : '';
  const html = `<div id="${toastId}" class="toast ${fadeClass}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${delay}">
    <div class="toast-header ${bgClass}"><strong class="me-auto">${title || variant.toUpperCase()}</strong><button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button></div>
    <div class="toast-body">${message}</div></div>`;

  const $toast = $(html).appendTo('#toast-container');

  if (fade) {
    $toast.css({ opacity: 0, transform: 'translateY(20px)' });
    $toast.animate({ opacity: 1, transform: 'translateY(0)' }, 300);
  }

  const bsToast = new bootstrap.Toast($toast[0]);
  bsToast.show();

  $toast.on('hidden.bs.toast', () => {
    $toast.animate({ opacity: 0, marginBottom: '-2rem', padding: 0 }, 200, () => $toast.remove());
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
  const bs = toast(opts);
  const $el = $(`#${bs._element.id}`);
  $el.on('hidden.bs.toast', showNextToast);
}

export const toastSuccess = (message, title = 'Success') => toast({ title, message, variant: 'success' });
export const toastError = (message, title = 'Error') => toast({ title, message, variant: 'danger' });
export const toastWarning = (message, title = 'Warning') => toast({ title, message, variant: 'warning' });

// ---------- Alert ----------
export function alert(message, variant = 'info', target = 'body', dismissible = true, fade = cozyDefaults.alertFade) {
  const alertId = `alert-${Date.now()}`;
  const closeBtn = dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : '';
  const html = `<div id="${alertId}" class="alert alert-${variant} alert-dismissible fade show" role="alert">${message}${closeBtn}</div>`;
  const $alert = $(html);
  if (fade) $alert.hide().prependTo(target).slideDown(300);
  else $(target).prepend($alert);
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