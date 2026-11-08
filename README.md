web-ux v1.0.0

A complete frontend productivity suite built on jQuery, Bootstrap 5, and JWT.
Provides ready‑to‑use helpers for AJAX, Bootstrap widgets, AES‑256‑GCM encryption (fully compatible with the PHP Bangwe class), form validation, i18n, reactive state, performance logging, and everyday frontend tasks.

https://img.shields.io/npm/v/web-ux
https://img.shields.io/npm/l/web-ux

---

Table of Contents

· Features
· Installation
· Quick Start
· API Reference
  · AJAX Module
  · Bootstrap Module
  · Encryption Module
  · Utilities Module
  · Environment Module
  · Loader Module
  · DOM Module
  · Cookie Module
  · Form Module
  · i18n Module
  · Store Module
  · Log Module
  · Perf Module
· Usage without npm (UMD Bundle)
· TypeScript Support
· License

---

Features

· AJAX Utilities – jQuery‑based requests with cancellation, in‑memory caching, exponential backoff, file download with progress, and SSE/EventSource helper.
· Bootstrap Components – Programmatic creation of Modals, Offcanvas, Toasts (with queue and shorthand), Alerts, Carousel, Collapse, Tabs, Popover, and Tooltip.
· Encryption – AES‑256‑GCM via Web Crypto API. Password‑based and raw‑key encryption fully compatible with the PHP Bangwe class.
· Form Validation – Declarative rules (required, email, minlength, etc.), live validation, error/valid classes, and input masks.
· Internationalisation – Simple t() function with placeholder interpolation.
· Reactive Store – Minimal publish/subscribe state management.
· Utilities – Debounce, throttle, deep clone/merge, UUID, date formatting, relative time, number/currency formatting, validators, storage with expiry, clipboard, and more.
· Environment Variables – Client‑side env helper (for public configuration).
· Loader Helpers – Spinner, progress bar, page‑level overlay, and loading button state.
· DOM Helpers – Smooth scroll, form serialisation, viewport detection, infinite scroll, and lazy loading (IntersectionObserver).
· Cookie Helpers – Simple set/get/delete.
· Logging & Performance – Silent‑in‑production logging and high‑resolution performance marks.

---

Installation

```bash
npm install web-ux
```

Peer Dependencies

```bash
npm install jquery bootstrap jsonwebtoken
```

· jsonwebtoken is optional if you don’t use JWT features.

---

Quick Start

```javascript
import webux from 'web-ux';
// or import individual modules
import { ajax, bootstrap, form, i18n, store } from 'web-ux';

// Configure AJAX globally
ajax.configure({
  tokenGetter: () => localStorage.getItem('token'),
  showLoader: true,
});

// GET request with caching
ajax.get('/api/users', null, { cache: true });

// Bootstrap toast (queued)
bootstrap.toastQueue({ message: 'Welcome!', variant: 'success' });

// Form validation
form.validate('#loginForm', {
  email: { required: true, email: true },
  password: { required: true, minlength: 6 }
}, {
  onSubmit: (data) => console.log(data)
});

// i18n
i18n.load({ hello: 'Hello {{name}}!' });
i18n.t('hello', { name: 'World' }); // "Hello World!"

// Reactive store
const userStore = store.create({ user: null });
userStore.subscribe('user', (newUser) => console.log('User updated', newUser));
userStore.set('user', { id: 1, name: 'Alice' });
```

---

API Reference

AJAX Module

All methods return a Promise that resolves with the parsed response data (or the raw jqXHR if raw: true). Errors reject with an enhanced Error object containing status, response, and jqXHR properties.

ajax.configure(options)

Option Type Default Description
tokenGetter Function null Function returning a JWT token to send as Authorization: Bearer ….
showLoader boolean true Automatically show/hide a global loader element (#global-loader).
showToasts boolean true Show Bootstrap error toasts when a request fails.
retries number 0 Number of retry attempts on server errors (status ≥ 500).
retryDelay number 1000 Delay in ms between retries.
useExponentialBackoff boolean false Use exponential backoff for retry delays.
cache boolean false Enable in‑memory caching for GET requests.
cacheTTL number 60 Cache time‑to‑live in seconds.

ajax.request(options)

Generic request wrapper. Accepts all jQuery $.ajax settings plus extras:

Option Type Description
requestId string Unique identifier to enable cancellation via ajax.abort().
cache boolean Per‑request cache override.
cacheTTL number Per‑request cache TTL.
raw boolean If true, resolve with the raw jqXHR object.
retries number Per‑request retry count.
useExponentialBackoff boolean Per‑request backoff setting.

Convenience Methods

· ajax.get(url, data?, options?)
· ajax.post(url, data?, options?)
· ajax.put(url, data?, options?)
· ajax.patch(url, data?, options?)
· ajax.del(url, options?)

ajax.upload(url, files, extraData?, options?)

Upload files via FormData. files can be a File, FileList, or object with field names.

```javascript
ajax.upload('/api/upload', fileInput.files[0], { userId: 123 })
   .then(res => console.log('Uploaded', res));
```

ajax.download(url, filename?, options?)

Fetch a file and trigger download, with progress reporting.

```javascript
ajax.download('/report.pdf', 'report.pdf', {
  onProgress: percent => console.log(`${percent}%`)
});
```

ajax.abort(requestId)

Cancel a pending request identified by requestId.

```javascript
ajax.get('/search', { q: 'term' }, { requestId: 'search' });
ajax.abort('search');
```

ajax.sse(url, options?)

Create an EventSource with optional onOpen, onMessage, onError callbacks. Returns { close, source }.

```javascript
const stream = ajax.sse('/events', {
  onMessage: e => console.log(e.data)
});
// stream.close();
```

---

Bootstrap Module

All methods work on top of Bootstrap 5’s JavaScript API.

bootstrap.modal(options)

Create and show a dynamic modal.

Option Type Description
title string Title (HTML).
body string Body HTML.
buttons Array Button objects: { text, class, dismiss, handler }.
static boolean Static backdrop (default: true).

Returns the bootstrap.Modal instance.

bootstrap.offcanvas(options)

Create and show an offcanvas panel. Options: title, body, placement (start, end, top, bottom).

```javascript
bootstrap.offcanvas({ title: 'Menu', body: '<ul>...</ul>', placement: 'end' });
```

bootstrap.toast(options)

Show a Bootstrap toast.

Option Type Default Description
title string '' Header title.
message string required Body text.
variant string 'info' success, danger, warning, info.
delay number 5000 Auto‑hide ms.
container string '#toast-container' Target container.

Toast Helpers

· bootstrap.toastSuccess(message, title?) – green toast.
· bootstrap.toastError(message, title?) – red toast.
· bootstrap.toastWarning(message, title?) – yellow toast.
· bootstrap.toastQueue(options) – enqueue toasts to show one after another.

bootstrap.alert(message, variant?, target?, dismissible?)

Create a dismissible Bootstrap alert.

Component Wrappers

· bootstrap.carousel(selector, options?) – returns Carousel instance.
· bootstrap.collapse(selector, options?) – returns Collapse instance.
· bootstrap.tab(selector) – activates a Bootstrap tab.
· bootstrap.popover(element, options?) – returns Popover instance.
· bootstrap.tooltip(element, options?) – returns Tooltip instance.
· bootstrap.initTooltipsAndPopovers(scope?) – initialise all [data-bs-toggle] elements inside scope.

---

Encryption Module

Two styles of encryption:

1. Password‑based – PBKDF2 key derivation.
2. Raw‑key – Fully compatible with the PHP Bangwe class.

Password‑based

· encryptAES(plaintext, password): Promise<string>
· decryptAES(ciphertextBase64, password): Promise<string>

Raw‑key (Bangwe Compatible)

· importRawKey(base64Key): Promise<CryptoKey>
· encryptWithKey(plaintext, key): Promise<{data, iv, tag, cipher}>
· decryptWithKey(dataBase64, ivBase64, tagBase64, key): Promise<string>
· encryptToJson(plaintext, key): Promise<string> – returns JSON like {"data":"...","iv":"...","tag":"...","cipher":"aes-256-gcm"}.
· decryptFromJson(jsonString, key): Promise<string> – decrypts the JSON format.

The key argument can be a Base64‑encoded string (32 bytes) or a CryptoKey from importRawKey.

Other helpers

· sha256(message): Promise<string> – hex digest.
· base64.encode(str) / base64.decode(b64) – UTF‑8 safe.
· jwt.decode(token) / jwt.verify(token, secret, options) – requires jsonwebtoken.

---

Utilities Module

Category Function Description
Timing debounce(fn, delay) Debounce – postpones execution.
 debounceLeading(fn, delay) Fires immediately, then ignores calls within delay.
 throttle(fn, limit) At most once per limit.
Objects deepClone(obj) Deep copy via structuredClone or JSON.
 deepMerge(target, source) Recursive merge.
ID uuid() Generate UUID v4.
 randomId(length?) Random alphanumeric ID.
Query Strings queryString.stringify(obj) Build query string.
 queryString.parse(str) Parse query string into an object.
Date date.format(date, format?) Format date (e.g., YYYY-MM-DD HH:mm).
 date.relativeTime(date) “3 minutes ago” style.
Number number.format(num, locales?) Locale‑aware formatting.
 number.currency(num, currency?, locales?) Currency formatting.
Validators isEmail(str): boolean Email check.
 isUrl(str): boolean URL check.
 isNumeric(str): boolean Numeric string check.
Storage storage.set(key, value, ttlSeconds?) localStorage with expiry.
 storage.get(key) Retrieve value (null if expired).
 storage.remove(key) / storage.clear() Remove or clear.
Clipboard copyToClipboard(text) Copy to clipboard.
Bytes formatBytes(bytes, decimals?) e.g., "1.5 MB".

---

Environment Module

· env.setEnv(obj) – Set environment variables object.
· env.get(key, defaultValue?) – Retrieve an environment variable.

```javascript
env.setEnv({ API_URL: 'https://api.example.com' });
env.get('API_URL'); // 'https://api.example.com'
```

Security: Never expose private keys/secrets; use only for public configuration.

---

Loader Module

· showSpinner(target?) – Show spinner inside target (default #global-loader).
· hideSpinner(target?) – Hide spinner.
· showProgress(percent?, options?) – Show progress bar; 0 = indeterminate.
· hideProgress(target?) – Hide progress bar.
· showPageLoader() – Full‑page overlay with spinner.
· hidePageLoader() – Remove the overlay.
· loadingButton(selector, loading) – Toggle spinner inside a button and disable it.

---

DOM Module

· scrollTo(target, options?) – Smooth scroll to selector, element, or Y coordinate.
· scrollToTop() – Smooth scroll to top.
· isInViewport(el) – Check if element is visible.
· serializeForm(form, asJson?) – Serialise form to object or JSON.
· getFormData(form) – Alias for serializeForm without JSON.
· infiniteScroll(containerSelector, callback, threshold?) – Trigger callback when nearing the bottom. Returns { off }.
· lazyLoad(selector?) – Load [data-src] images/iframes as they enter the viewport using IntersectionObserver.

---

Cookie Module

· setCookie(name, value, days?, path?, domain?, secure?)
· getCookie(name)
· deleteCookie(name, path?, domain?)

---

Form Module

· form.validate(formSelector, rules, options?) – Validates fields and shows Bootstrap feedback.
    Rules: required, minlength, maxlength, email, url, pattern, match.
    Options: errorClass (default is-invalid), validClass (is-valid), onSubmit(data), liveValidate.
    Returns true if valid, false otherwise.
· form.setValues(formSelector, data) – Fill form fields from an object.
· form.clear(formSelector) – Reset form and remove validation classes.
· form.mask(selector, pattern) – Apply a simple numeric mask (e.g., "(000) 000-0000").
· form.serializeForm(form, asJson?) – Same as DOM module.

Example:

```javascript
form.validate('#signupForm', {
  name: { required: true, minlength: 2 },
  email: { required: true, email: true },
  password: { required: true, minlength: 8 },
  confirm: { required: true, match: 'password' }
}, {
  onSubmit: data => ajax.post('/api/register', data)
});
```

---

i18n Module

· i18n.load(translations) – Add key‑value pairs.
· i18n.t(key, params?) – Translate with {{placeholder}} interpolation.
· i18n.setLocale(locale) – Set current locale (for future dynamic loading).
· i18n.getLocale() – Get current locale.

---

Store Module (Reactive State)

```javascript
const store = store.create(initialState);

store.set('key', value);
store.get('key');          // or store.get() for full state
store.subscribe('key', (newValue, oldValue) => { … });
```

Subscriptions return an unsubscribe function.

---

Log Module

log.setLevel('debug' | 'info' | 'warn' | 'error' | 'none') – control output.
Default is "debug". In production, set to "warn" or "error".

```javascript
log.debug('...');
log.info('...');
log.warn('...');
log.error('...');
```

---

Perf Module

· perf.start(label) – Record start time.
· perf.end(label) – Return elapsed milliseconds since start.

---

Usage without npm (UMD Bundle)

1. Import the web-ux.umd.js:
   ```javascript
   <script src="path/to/web-ux.umd.js"></script>
   ```

---

TypeScript Support

Full type definitions are included (types.d.ts). Import types as needed:

```typescript
import { ajax, bootstrap, form } from 'web-ux';
import type { ModalOptions, ToastOptions } from 'web-ux/bootstrap';
```