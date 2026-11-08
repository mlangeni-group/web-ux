```markdown
# machinjiri-web

A cozy, production‑ready frontend utility library built on **jQuery** and **Bootstrap 5**.  
Delight your users with smooth transitions, beautiful loaders, intelligent forms, and a powerful HTTP client—all with a simple, consistent API.

---

## What’s New (Cozy Upgrades)

- **Smooth Everywhere** – Fade‑in/out modals, toasts, offcanvas, alerts, spinners, and progress bars.
- **Cozy Theme** – One‑call injection of soft background, rounded corners, subtle shadows, and hover lift.
- **Notification Center** – Queue toasts and keep a log of user notifications.
- **Skeleton Screens** – Placeholder‑glow screens while content loads.
- **Form Superpowers** – Auto‑save, file preview, character counter, confirm‑before‑reset.
- **Advanced AJAX** – Request/response interceptors, retry with backoff, caching, upload/download progress, SSE with reconnection.
- **Global Event Bus** – Decouple UI components with a tiny pub/sub system.
- **Dark Mode Ready** – Automatic system preference detection or manual toggle.
- **Lazy Images** – Intersection Observer‑based lazy loading.
- **Performance Marks** – Measure function timings easily.
- **Logging** – Level‑based debugging (debug/info/warn/error).

All existing APIs remain **100% backward‑compatible**. No breaking changes.

---

## Installation

### npm
```bash
npm install machinjiri-web
```

Manual download

Copy the lib/ folder into your project and import from index.js.

Dependencies: The library expects jquery and bootstrap to be globally available (or bundled with your build system).
CSS: Include Bootstrap 5 CSS (and optionally your own for further theming).

---

Quick Start

```javascript
import { utils, bootstrap, loader, form, ajax, perf, log } from 'machinjiri-web';

// 1. Apply the cozy theme
utils.cozyTheme();

// 2. Show a toast
bootstrap.toastSuccess('Welcome back!', 'Hello');

// 3. Fire a smooth AJAX request (with spinner)
ajax.get('/api/users')
  .then(users => console.log(users));
```

---

API Reference

utils – Core Utilities & Cozy Helpers

Function / Object Description
debounce(fn, delay) Debounce a function.
throttle(fn, limit) Throttle a function.
deepClone(obj) Deep clone (structuredClone fallback).
storage LocalStorage with optional TTL.
copyToClipboard(text) Async copy helper.
formatBytes(bytes) Human‑readable file size.
uuid() Generate a UUID v4.
queryString.stringify(obj) / parse(str) Query string helpers.
date.format(date, format) Format a date (e.g., 'DD/MM/YYYY').
date.relativeTime(date) “2 min ago” style output.
number.format(num) Format with Intl.NumberFormat.
number.currency(num, currency) Currency formatting.
isEmail(str) / isUrl(str) / isNumeric(str) Validation quickies.
✨ NEW 
cozyTheme(options?) Injects a CSS stylesheet for soft, rounded, shadowed UI.
events Global Pub/Sub: on(event, fn), off(event, fn), emit(event, data).
lazyLoadImages(selector?, rootMargin?) Lazy load <img data-src="..."> with Intersection Observer.
loadScript(url, attrs?) Load a script dynamically (returns a Promise).
onBreakpoint(callback) Calls callback with current Bootstrap breakpoint (xs, sm, ...) on resize.
initColorScheme(options?) Dark/light mode toggle; respects system preference.
scrollTo(target, offset?) Smooth scroll to an element.
triggerTransition(el, className, duration?) Temporarily add a class for CSS transitions.

---

bootstrap – Enhanced Bootstrap Components

All factory functions now accept a fade (or blurBackdrop) option for smooth animations.
Global defaults can be changed with setCozyOptions().

```js
bootstrap.setCozyOptions({ blurBackdrop: false });
```

Function Description
modal({ title, body, buttons, static, fade, blurBackdrop }) Show a modal with optional blur backdrop and focus trapping.
offcanvas({ title, body, placement, fade }) Slide‑in offcanvas panel.
toast({ title, message, variant, delay, fade }) Cozy toast with slide‑in/out.
toastSuccess(msg, title?) Green success toast.
toastError(msg, title?) Red error toast.
toastWarning(msg, title?) Yellow warning toast.
toastQueue(options) Queue toasts to appear one after another.
alert(message, variant, target, dismissible, fade) Insert a Bootstrap alert with optional slide‑down.
carousel(selector, options?) Create a carousel instance.
collapse(selector, options?) Create a collapse instance.
tab(selector) Activate a tab.
popover(element, options?) Create a popover.
tooltip(element, options?) Create a tooltip.
dropdown(element) Create a dropdown.
✨ NEW 
notify({ title, message, variant }) Push a notification (toast) and store it.
getNotifications() Return all stored notifications.
markNotificationRead(id) Mark a notification as read.
clearNotifications() Clear notification history.

---

loader – Loading Indicators (Now with Fades & Presets)

```js
loader.setLoaderTransitionSpeed(500); // ms for fade
```

Function Description
showSpinner(target?) Show a spinner with fade‑in.
hideSpinner(target?) Hide spinner with fade‑out.
showProgress(percent?, options?) Progress bar (0% = indeterminate).
hideProgress(target?) Fade out progress bar.
showPageLoader(options?) Full‑page overlay with custom HTML or preset ('spinner', 'dots', 'pulse', 'text').
hidePageLoader() Fade out page overlay.
loadingButton(selector, loading) Toggle button loading state (spinner + disabled).
✨ NEW 
showSkeleton(container, { rows, animation }) Replace content with placeholder glow / wave.
hideSkeleton(container) Remove skeleton.

---

form – Form Validation & UX

Function Description
addRule(name, fn) Register a custom validation rule.
validateField(form, fieldName, rules, options?) Validate a single field with smooth error/valid classes.
validate(formSelector, rules, options?) Full form validation (submit + live). Options: liveValidate, liveDebounce, smooth.
setValues(formSelector, data) Populate form fields from an object.
clear(formSelector) Reset all fields and validation state.
mask(selector, pattern) Input mask (e.g., "(000) 000-0000").
serializeForm(form, asJson?) Serialize form to object or JSON.
✨ NEW 
autoSave(formSelector, saveFn, interval?) Debounced auto‑save on input change.
filePreview(inputSelector, previewSelector) Show image preview when a file is selected.
charCounter(inputSelector, targetSelector, max) Live character count with validation.
confirmReset(formSelector, message?) Ask confirmation before resetting a form.

---

ajax – HTTP Client with Interceptors & Cozy Loaders

```js
ajax.configure({
  showLoader: true,
  loaderType: 'page-overlay',  // 'spinner' or 'page-overlay'
  retries: 2,
  useExponentialBackoff: true,
  tokenGetter: () => localStorage.getItem('token'),
  interceptors: {
    beforeRequest: [(config) => console.log('Sending request...')],
    afterResponse: [(data) => data],
    onError: [(error) => /* handle global errors */],
  },
});
```

Function Description
request(options) Core request with caching, retries, abort, and loader toggling.
get(url, data?, opts?) GET request.
post(url, data?, opts?) POST request.
put(url, data?, opts?) PUT request.
patch(url, data?, opts?) PATCH request.
del(url, opts?) DELETE request.
upload(url, files, extraData?, opts?) File upload with progress bar support.
download(url, filename?, opts?) File download with progress.
sse(url, { onMessage, onOpen, onError, reconnect, maxReconnect }) Server‑Sent Events with auto‑reconnect.
requestAll(requests, { showLoader }) Batch requests (Promise.all + full‑page loader).
abort(requestId) Abort a single request by ID.
abortAll() Abort all pending requests.
clearCache() Clear the GET request cache.
removeCacheEntry(url, method, data) Remove a specific cache entry.
isPending() Returns true if any AJAX loader is active.

---

perf – Performance Measurements

```js
perf.start('render');
// ... heavy operation
perf.end('render'); // logs: [Perf] render: 23.45 ms
perf.measure('task', () => doSomething());
```

---

log – Level‑Based Logging

```js
log.setLevel('debug'); // show all
log.debug('User clicked', { id: 5 });
log.info('App ready');
log.warn('Deprecated method');
log.error('Something broke');
```

---

Cozy Experience

Enable the cozy aesthetic with a single call:

```js
utils.cozyTheme({
  primaryColor: '#6f42c1',
  backgroundColor: '#f0f0f5',
  borderRadius: '0.75rem',
  boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.08)',
});
```

This will make every card, modal, button, and alert feel soft and inviting.
To further customise component‑specific animations, use:

```js
bootstrap.setCozyOptions({
  blurBackdrop: true,   // backdrop‑filter blur on modals
  modalFade: true,
  toastFade: true,
  offcanvasFade: true,
  alertFade: true,
});
loader.setLoaderTransitionSpeed(400); // ms for loader fades
```

---

Browser Support

All modern browsers (Chrome, Edge, Firefox, Safari).
Requires jQuery ≥3.6 and Bootstrap ≥5.0.

---

License

MIT – do what you love, just leave a star ⭐

---

Contribute

We welcome pull requests and feature ideas. Keep it cozy!

```

This README gives a complete overview of the upgraded library, focusing on the new enhancements while still documenting the original API. Add a "Examples" section if you'd like, but for brevity the quick start and API tables already demonstrate usage.