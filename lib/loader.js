import $ from 'jquery';

const DEFAULTS = {
  spinner: '<div class="spinner-border fs-2 text-dark mb-3" role="status"><span class="visually-hidden">Loading...</span></div>',
  progress: '<div class="progress"><div class="progress-bar" style="width:0%"></div></div>',
};

let transitionSpeed = 300;
export function setLoaderTransitionSpeed(ms) { transitionSpeed = ms; }

// ---------- Spinner ----------
export function showSpinner(target = '#global-loader') {
  const $el = $(target);
  if ($el.length) $el.html(DEFAULTS.spinner).stop(true, true).fadeIn(transitionSpeed);
}
export function hideSpinner(target = '#global-loader') {
  const $el = $(target);
  if ($el.length) $el.stop(true, true).fadeOut(transitionSpeed, () => $el.empty());
}

// ---------- Progress ----------
export function showProgress(percent = 0, options = {}) {
  const { target = '#global-progress', height = '4px' } = options;
  let $bar = $(target).find('.progress-bar');
  if (!$bar.length) {
    $(target).html(DEFAULTS.progress).hide();
    $bar = $(target).find('.progress-bar');
    $(target).find('.progress').css('height', height);
    $(target).fadeIn(transitionSpeed);
  }
  if (percent > 0) {
    $bar.css('width', percent + '%').attr('aria-valuenow', percent).removeClass('progress-bar-animated');
  } else {
    $bar.css('width', '100%').addClass('progress-bar-animated');
  }
}
export function hideProgress(target = '#global-progress') {
  $(target).fadeOut(transitionSpeed);
}

// ---------- Page Overlay ----------
export function showPageLoader(options = {}) {
  if ($('#page-loader').length) return;
  const {
    html,
    type = 'spinner',
    style = {},
    className = '',
    container = 'body',
    showImmediately = true,
  } = options;

  let content = html || getPresetLoader(type);
  const $overlay = $(`<div id="page-loader" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center ${className}" style="background:rgba(255,255,255,0.8); z-index:1055;"></div>`);
  if (Object.keys(style).length) $overlay.css(style);
  $overlay.append(content);
  $(container).append($overlay);
  if (showImmediately) $overlay.hide().stop(true, true).fadeIn(300);
}
export function hidePageLoader() {
  $('#page-loader').stop(true, true).fadeOut(300, () => $(this).remove());
}

// ---------- Button Loading ----------
export function loadingButton(selector, loading = true) {
  const $btn = $(selector);
  if (loading) {
    $btn.data('original-text', $btn.html());
    const loadingHtml = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' + ($btn.data('loading-text') || 'Loading...');
    $btn.html(loadingHtml).prop('disabled', true);
  } else {
    const originalText = $btn.data('original-text');
    if (originalText) $btn.html(originalText);
    $btn.prop('disabled', false);
  }
}

// ---------- Skeleton Screens ----------
export function showSkeleton(container, { rows = 3, animation = 'glow' } = {}) {
  let html = '';
  for (let i = 0; i < rows; i++) {
    const width = `${Math.floor(Math.random() * 20 + 80)}%`; // 80-100%
    html += `<div class="placeholder-${animation} mb-2"><span class="placeholder col-12 bg-secondary" style="width:${width}; height:1.2rem;"></span></div>`;
  }
  $(container).html(html);
}
export function hideSkeleton(container) {
  $(container).empty();
}

// ---------- Preset Loaders ----------
function getPresetLoader(type) {
  const presets = {
    spinner: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
    dots: `
      <div class="d-flex gap-2">
        <div class="spinner-grow spinner-grow-sm" role="status"></div>
        <div class="spinner-grow spinner-grow-sm" role="status"></div>
        <div class="spinner-grow spinner-grow-sm" role="status"></div>
      </div>`,
    pulse: `
      <div class="d-flex gap-1">
        <div class="rounded-circle bg-primary" style="width:12px;height:12px;animation:pulse 1s infinite"></div>
        <div class="rounded-circle bg-primary" style="width:12px;height:12px;animation:pulse 1s infinite 0.2s"></div>
        <div class="rounded-circle bg-primary" style="width:12px;height:12px;animation:pulse 1s infinite 0.4s"></div>
      </div>
      <style>@keyframes pulse{0%,100%{opacity:0.2}50%{opacity:1}}</style>`,
    text: '<div class="fs-4 fw-light text-dark">Loading…</div>',
  };
  return presets[type] || presets.spinner;
}