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
    fadeInDelay = 300,
    variant = 'primary',
    loadingClassName = ''
  } = options;

  let content = html || getPresetLoader(type, { variant: variant, className: loadingClassName });
  const $overlay = $(`<div id="page-loader" class="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center ${className}" style="background:rgba(255,255,255,0.8); z-index:1055;"></div>`);
  if (Object.keys(style).length) $overlay.css(style);
  $overlay.append(content);
  $(container).append($overlay);
  if (showImmediately) $overlay.hide().stop(true, true).fadeIn(fadeInDelay);
}

export function hidePageLoader(options = {}) {
  const { fadeOutDelay = 300 } = options;
  $('#page-loader').stop(true, true).fadeOut(fadeOutDelay, () => $(this).remove());
}

// ---------- Button Loading ----------
export function loadingButton(selector, options = {}) {
  const { loading = true, text = 'Loading...' } = options;
  const $btn = $(selector);
  if (loading) {
    $btn.data('original-text', $btn.html());
    const loadingHtml = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ' + ($btn.data('loading-text') || text);
    $btn.html(loadingHtml).prop('disabled', true);
  } else {
    const originalText = $btn.data('original-text');
    if (originalText) $btn.html(originalText);
    $btn.prop('disabled', false);
  }
}

// ---------- Skeleton Screens ----------
export function showSkeleton(container, { rows = 3, animation = 'glow' } = {}) {
  const requestedRows = Number(rows);
  const rowCount = Number.isFinite(requestedRows)
    ? Math.max(1, Math.floor(requestedRows))
    : 3;
  const animationClass = /^[a-zA-Z0-9_-]+$/.test(animation) ? `placeholder-${animation}` : '';
  const widths = [100, 84, 66, 92, 76, 58];
  const $targets = $(container);

  if (!$targets.length) return;

  if (!document.getElementById('webux-skeleton-styles')) {
    const styles = document.createElement('style');
    styles.id = 'webux-skeleton-styles';
    styles.textContent = `
      .webux-skeleton {
        box-sizing: border-box;
        display: grid;
        grid-template-rows: repeat(var(--webux-skeleton-rows), minmax(0, 1fr));
        align-content: stretch;
        gap: clamp(.5rem, 1.5vw, .75rem);
        overflow: hidden;
      }
      .webux-skeleton .webux-skeleton__line {
        display: block;
        align-self: center;
        height: clamp(.65rem, 1.1em, 1.1rem);
        max-width: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #edf0f4 20%, #dfe4eb 45%, #edf0f4 70%);
        background-size: 200% 100%;
        animation: webux-skeleton-shimmer 1.45s ease-in-out infinite;
      }
      @keyframes webux-skeleton-shimmer {
        0% { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }
      @media (prefers-reduced-motion: reduce) {
        .webux-skeleton__line { animation: none; }
      }
    `;
    document.head.appendChild(styles);
  }

  $targets.each(function () {
    const $target = $(this);
    const width = $target.width();
    const height = $target.height();
    const $skeleton = $('<div>', { class: 'webux-skeleton', 'aria-hidden': 'true' })
      .css('--webux-skeleton-rows', rowCount);

    if (animationClass) $skeleton.addClass(animationClass);
    if (width > 0) $skeleton.css({ width: `${width}px`, maxWidth: '100%' });
    if (height > 0) $skeleton.css('minHeight', `${height}px`);
    else $skeleton.css('minHeight', `${rowCount * 24}px`);

    for (let i = 0; i < rowCount; i++) {
      const $line = $('<span>', { class: 'webux-skeleton__line placeholder' })
        .css('width', `${widths[i % widths.length]}%`);
      $skeleton.append($line);
    }

    $target.attr('aria-busy', 'true').empty().append($skeleton);
  });
}
export function hideSkeleton(container) {
  $(container).attr('aria-busy', 'false').empty();
}

// ---------- Preset Loaders ----------
function getPresetLoader(type, options = {}) {
  const { variant = 'primary', className = '' } = options;

  const presets = {
    spinner: `<div class="spinner-border text-${variant} ${className}" role="status"><span class="visually-hidden">Loading...</span></div>`,
    dots: `
      <div class="d-flex gap-2">
        <div class="spinner-grow spinner-grow-sm text-${variant} ${className}" role="status"></div>
        <div class="spinner-grow spinner-grow-sm text-${variant} ${className}" role="status"></div>
        <div class="spinner-grow spinner-grow-sm text-${variant} ${className}" role="status"></div>
      </div>`,
    pulse: `
      <div class="d-flex gap-1">
        <div class="rounded-circle bg-${variant} ${className}" style="width:12px;height:12px;animation:pulse 1s infinite"></div>
        <div class="rounded-circle bg-${variant} ${className}" style="width:12px;height:12px;animation:pulse 1s infinite 0.2s"></div>
        <div class="rounded-circle bg-${variant} ${className}" style="width:12px;height:12px;animation:pulse 1s infinite 0.4s"></div>
      </div>
      <style>@keyframes pulse{0%,100%{opacity:0.2}50%{opacity:1}}</style>`,
    bounce: `
      <div class="d-flex align-items-center gap-2" role="status">
        <span class="visually-hidden">Loading...</span>
        <span class="rounded-circle bg-${variant} ${className}" style="width:10px;height:10px;animation:webux-loader-bounce 0.6s infinite alternate"></span>
        <span class="rounded-circle bg-${variant} ${className}" style="width:10px;height:10px;animation:webux-loader-bounce 0.6s 0.2s infinite alternate"></span>
        <span class="rounded-circle bg-${variant} ${className}" style="width:10px;height:10px;animation:webux-loader-bounce 0.6s 0.4s infinite alternate"></span>
      </div>
      <style>@keyframes webux-loader-bounce{to{transform:translateY(-8px);opacity:.5}}</style>`,
    bars: `
      <div class="d-flex align-items-center gap-1" role="status">
        <span class="visually-hidden">Loading...</span>
        <span class="bg-${variant} ${className} rounded-pill" style="width:5px;height:18px;animation:webux-loader-bars 0.8s ease-in-out infinite"></span>
        <span class="bg-${variant} ${className} rounded-pill" style="width:5px;height:28px;animation:webux-loader-bars 0.8s 0.1s ease-in-out infinite"></span>
        <span class="bg-${variant} ${className} rounded-pill" style="width:5px;height:22px;animation:webux-loader-bars 0.8s 0.2s ease-in-out infinite"></span>
        <span class="bg-${variant} ${className} rounded-pill" style="width:5px;height:28px;animation:webux-loader-bars 0.8s 0.3s ease-in-out infinite"></span>
        <span class="bg-${variant} ${className} rounded-pill" style="width:5px;height:18px;animation:webux-loader-bars 0.8s 0.4s ease-in-out infinite"></span>
      </div>
      <style>@keyframes webux-loader-bars{50%{transform:scaleY(.4);opacity:.5}}</style>`,
    ring: `
      <div class="rounded-circle ${className}" role="status" style="width:2.5rem;height:2.5rem;border:4px solid rgba(13,110,253,.2);border-top-color:#0d6efd;animation:webux-loader-spin .8s linear infinite">
        <span class="visually-hidden">Loading...</span>
      </div>
      <style>@keyframes webux-loader-spin{to{transform:rotate(360deg)}}</style>`,
    progress: `
      <div class="progress ${className}" role="status" aria-label="Loading" style="width:12rem;height:6px">
        <div class="progress-bar bg-${variant}" style="width:40%;animation:webux-loader-progress 1.4s ease-in-out infinite"></div>
      </div>
      <style>@keyframes webux-loader-progress{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}</style>`,
    text: '<div class="fs-4 fw-light text-dark">Loading…</div>',
  };
  return presets[type] || presets.spinner;
}