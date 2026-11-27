# @mlangeni-group/web-ux

[![npm version](https://img.shields.io/npm/v/%40mlangeni-group%2Fweb-ux?logo=npm&label=npm)](https://www.npmjs.com/package/@mlangeni-group/web-ux)
[![License](https://img.shields.io/npm/l/%40mlangeni-group%2Fweb-ux?label=license)](https://www.npmjs.com/package/@mlangeni-group/web-ux)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![jQuery](https://img.shields.io/badge/jQuery-3.x-0769AD?logo=jquery&logoColor=white)](https://jquery.com/)

![web-ux frontend toolkit](https://img.shields.io/badge/MLANGENI_GROUP-web--ux-252A34?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

A browser-first frontend utility package for jQuery and Bootstrap 5 projects. It bundles common UI, request, i18n, form, storage, encryption, and environment helpers into one lightweight toolkit so you can build productively without re-implementing the same patterns across projects.

This package is designed for modern web apps that want:

- ergonomic AJAX helpers with caching, retry logic, and upload/download support
- Bootstrap 5 convenience wrappers for modals, toasts, alerts, and notifications
- form validation and masking helpers
- lightweight state management and local storage utilities
- environment loading and translation helpers
- crypto utilities for AES, base64, and safe JWT payload decoding
- page loading indicators, skeletons, and progress utilities
- accessible UI announcements, locale-aware pluralization, and offline stale-cache fallback

## Features

- AJAX client with request configuration, abort support, SSE, upload/download progress, and automatic loaders
- Bootstrap UI helpers: modal, toast, offcanvas, slide-ins, alerts, tooltips, popovers
- Form validation rules, custom rules, auto-save, reset confirmation, and file preview
- Translation support via `i18n.t(...)`
- Local storage wrappers and browser-friendly utility helpers
- Production-hardened environment variable loading via `window.__ENV`, JSON script tags, and secure runtime merging
- Web Crypto-based encryption helpers, including Bangwe-compatible AES-GCM helpers
- Performance timing helpers and simple pub/sub event bus
- Cookie helpers and DOM utilities
- Safe-by-default text rendering in Bootstrap helpers, reduced-motion-aware toast effects, and accessible form errors

## Installation

Install the package and required browser dependencies:

```bash
npm install @mlangeni-group/web-ux jquery bootstrap
```

The package provides ESM and CommonJS builds, plus a standalone browser bundle. For a plain HTML page, use the browser bundle:

```html
<script src="/node_modules/@mlangeni-group/web-ux/dist/web-ux.js"></script>
```

The standalone browser bundle includes jQuery and Bootstrap. For bundlers, use the package normally; `import` selects ESM and `require` selects CommonJS, with jQuery and Bootstrap available as peer dependencies. TypeScript declarations are included.

## Importing

Use named imports for the modules you need:

```js
import {
  ajax,
  bootstrap,
  form,
  utils,
  env,
  i18n,
  encryption,
  loader,
  cookie,
  store,
  perf,
  dom,
} from '@mlangeni-group/web-ux';
```

Or import the whole bundle:

```js
import webUx from '@mlangeni-group/web-ux';

const { ajax, bootstrap, form, utils } = webUx;
```

## Quick start

### 1) Configure the AJAX client

```js
import { ajax } from '@mlangeni-group/web-ux';

ajax.configure({
  baseUrl: '/api',
  timeout: 30000,
  showLoader: true,
  loaderType: 'spinner',
  showToasts: true,
});

ajax.get('/users', { page: 1, limit: 20 })
  .then((users) => console.log(users))
  .catch((error) => console.error(error));
```

Requests use Fetch and accept `AbortSignal`. Retries default to idempotent methods and transient network/HTTP failures only; unsafe methods require `retryUnsafeMethods: true`. `cache` is opt-in, bounded in-memory (100 entries by default), and returns cloned values. Set `staleIfError: true` to return an expired cached GET result when the network is unavailable or the server returns a transient failure. Cache entries vary by authorization header and can be removed with `ajax.removeCacheEntry(...)`.

Failures reject with `ajax.HttpError`, which includes `status`, `response`, and `headers`. Avoid caching private responses unless you understand the sensitivity and lifetime of the data.

### 2) Send a POST request

```js
ajax.post('/auth/login', {
  email: 'user@example.com',
  password: 'secret-password',
})
  .then((response) => {
    console.log('Logged in:', response);
  })
  .catch((error) => {
    console.error('Login failed:', error.message);
  });
```

### 3) Use Bootstrap helpers

```js
import { bootstrap } from '@mlangeni-group/web-ux';

bootstrap.toastSuccess('Profile updated successfully');

bootstrap.modal({
  title: 'Are you sure?',
  body: 'This action cannot be undone.',
  buttons: [
    { text: 'Cancel', class: 'btn-secondary', dismiss: true },
    { text: 'Delete', class: 'btn-danger', dismiss: false, handler: () => {
      console.log('Deleted');
    } },
  ],
});
```

Modal and offcanvas `body` values, toast messages, and alerts are rendered as text by default. To render HTML in a modal/offcanvas body, pass `html: true` only for trusted, application-authored content. Toasts expose polite live announcements by default, announce danger variants assertively, and respect reduced-motion preferences.

### 4) Validate a form

```js
import { form } from '@mlangeni-group/web-ux';

form.validate('#login-form', {
  email: {
    required: true,
    email: true,
  },
  password: {
    required: true,
    minlength: 8,
  },
}, {
  errorSummary: true,
  onSubmit: (data) => {
    console.log('Form payload:', data);
  },
});
```

For validators that return promises (for example, checking a username), use `form.validateAsync(...)`. Both validation APIs return a `destroy()` method that removes only listeners they registered.

### 5) Use the storage utility

```js
import { utils } from '@mlangeni-group/web-ux';

utils.storage.set('user', { id: 1, name: 'Ada' }, 3600);
const user = utils.storage.get('user');
```

## Module reference

### ajax

The `ajax` module is a Fetch-based HTTP helper with XHR-backed upload and download progress support.

Available exports:

- `configure(opts)`
- `request(options)`
- `requestAll(requests, options)`
- `get(url, data, opts)`
- `post(url, data, opts)`
- `put(url, data, opts)`
- `patch(url, data, opts)`
- `del(url, opts)`
- `upload(url, files, extraData, opts)`
- `download(url, filename, opts)`
- `sse(url, opts)`
- `clearCache()`
- `removeCacheEntry(url, method, data)`
- `abort(requestId)`
- `abortAll()`
- `isPending()`
- `HttpError`

Example with retry and cache:

```js
ajax.configure({
  cache: true,
  cacheTTL: 300,
  retries: 2,
  retryDelay: 1000,
  useExponentialBackoff: true,
});

ajax.get('/api/products', { category: 'books' });
```

### bootstrap

Provides simplified wrappers around Bootstrap 5 components.

Examples:

```js
bootstrap.toast({
  title: 'Info',
  message: 'Saved successfully',
  variant: 'success',
  delay: 5000,
});

bootstrap.alert('Your session is about to expire.', 'warning');

bootstrap.offcanvas({
  title: 'Filters',
  body: '<div>Filter controls go here...</div>',
  placement: 'end',
  html: true,
  html: true,
});
```

Supports:

- `initTooltipsAndPopovers(scope)`
- `modal(options)`
- `offcanvas(options)`
- `toast(options)`
- `toastSuccess(message, title)`
- `toastError(message, title)`
- `toastWarning(message, title)`
- `toastQueue(options)`
- `alert(message, variant, target, dismissible, fade)`
- `carousel(selector, options)`
- `collapse(selector, options)`
- `tab(selector)`
- `popover(element, options)`
- `tooltip(element, options)`
- `dropdown(element)`
- `notify({ title, message, variant })`

### form

The `form` module focuses on validation and form automation.

Common validators:

- `required`
- `minlength`
- `maxlength`
- `email`
- `url`
- `pattern`
- `match`

You can extend validation with custom rules:

```js
form.addRule('strongPassword', (value) => {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
    ? true
    : 'Password must be at least 8 characters and include one uppercase letter and one number.';
});
```

Additional helpers:

- `validateField(form, fieldName, fieldRules, options)`
- `validate(formSelector, rules, options)`
- `setValues(formSelector, data)`
- `clear(formSelector)`
- `mask(selector, pattern)`
- `serializeForm(form, asJson)`
- `autoSave(formSelector, saveFn, interval)`
- `filePreview(inputSelector, previewSelector)`
- `charCounter(inputSelector, targetSelector, max)`
- `confirmReset(formSelector, message)`

### encryption

Use the browser Web Crypto API for client-side encryption.

```js
import { encryption } from '@mlangeni-group/web-ux';

const secret = 'my-very-secret-key';
const cipher = await encryption.encryptAES('Hello world', secret);
const plain = await encryption.decryptAES(cipher, secret);
```

The module includes:

- `encryptAES(plaintext, password)`
- `decryptAES(ciphertextBase64, password)`
- `sha256(message)`
- `importRawKey(base64Key)`
- `encryptWithKey(plaintext, key)`
- `decryptWithKey(dataBase64, ivBase64, tagBase64, key)`
- `encryptToJson(plaintext, key)`
- `decryptFromJson(jsonString, key)`
- `base64.encode()` / `base64.decode()`
- `jwt.decode(token)`

`jwt.decode` only parses an untrusted token payload; it does not verify its signature or claims. Authorization and token verification must happen on the server. Do not embed signing secrets in browser code.

### utils

The `utils` module contains general-purpose browser utilities and helpers that reduce boilerplate.

Examples:

```js
import { utils } from '@mlangeni-group/web-ux';

const formData = utils.queryString.stringify({ page: 1, q: 'search term' });
const dateLabel = utils.date.format(new Date(), 'YYYY-MM-DD');
const value = utils.deepMerge({ a: { b: 1 } }, { a: { c: 2 } });

utils.copyToClipboard('copied text');
```

Key utilities include:

- `debounce(fn, delay)`
- `throttle(fn, limit)`
- `once(fn)`, `sleep(delay, { signal })`, `clamp(value, min, max)`
- `deepClone(obj)`
- `deepMerge(target, source)`
- `uuid()`
- `randomId(length)`
- `storage.set/get/remove/clear` (storage is namespaced; `clear` only removes this package's entries)
- `copyToClipboard(text)`
- `formatBytes(bytes, decimals)`
- `queryString.stringify` / `parse` (array values and repeated query keys are supported)
- `date.format` / `date.relativeTime`
- `number.format` / `number.currency`
- `isEmail`, `isUrl`, `isNumeric`
- `events.on/once/off/emit/clear/listenerCount`
- `cozyTheme(options)`
- `lazyLoadImages(selector, rootMargin)` (returns a disconnect function)
- `loadScript(url, attrs)`, `waitForElement(selector, options)`
- `onBreakpoint(callback)`, `initColorScheme(options)` (both return cleanup methods)

Random IDs use the Web Crypto API. `deepMerge` only accepts plain objects and ignores
prototype-related keys; arrays are replaced rather than merged. Debounced and throttled
functions support `cancel()` and `flush()`.

### env

Use the environment helper to set, merge, and read runtime config values.

The helper is now production-hardened and includes safe normalization, synchronized `window.__ENV` updates, and explicit helpers for inspecting or resetting runtime config.

```js
import { env } from '@mlangeni-group/web-ux';

env.setEnv({ API_URL: 'https://api.example.com', DEBUG: true });
console.log(env.env('API_URL', '/api'));
console.log(env.getEnv());
console.log(env.hasEnv('DEBUG'));
```

Additional helpers:

```js
env.mergeEnv({ FEATURE_X: true, API_TIMEOUT: 5000 });
env.resetEnv({ API_URL: '/api' });
```

You can also load settings from a JSON script tag:

```html
<script id="__env-data" type="application/json">
  {"API_URL":"https://api.example.com","DEBUG":true}
</script>
```

```js
env.loadFromBackend();
```

Remote JSON loading is also supported with timeout and credentials configuration:

```js
await env.loadFromUrl('/config/runtime.json', {
  timeout: 5000,
  credentials: 'same-origin',
  headers: {
    'X-App-Client': 'web-ux',
  },
});
```

Recent upgrades include:

- object normalization to avoid invalid runtime state
- safe `hasOwnProperty` handling without prototype pollution risk
- automatic `window.__ENV` synchronization
- `getEnv()`, `hasEnv()`, and `resetEnv()` helpers
- optional timeout support for remote env fetches
- script id customization for `loadFromBackend(scriptId)`
- backward-compatible exported API for existing integrations

The module also exports a default `envStore` instance for codebases that prefer a singleton-style runtime configuration object.

### i18n

Small translation helper for UI strings.

```js
import { i18n } from '@mlangeni-group/web-ux';

i18n.load({
  greeting: 'Hello, {{name}}!',
  logout: 'Sign out',
});

console.log(i18n.t('greeting', { name: 'Ada' }));

i18n.load({ greeting: 'Bonjour, {{name}}!' }, 'fr');
i18n.setLocale('fr');
console.log(i18n.t('greeting', { name: 'Ada' }));
```

Catalogs can use nested objects and dot-separated keys. Missing keys fall back to the English catalog and then to the key itself. Plural catalogs use `one`, `other`, and locale-specific `Intl.PluralRules` categories:

```js
i18n.load({ files: { one: '{{count}} file', other: '{{count}} files' } }, 'en');
i18n.tp('files', 3);
i18n.formatCurrency(12.5, 'USD');
i18n.formatDate(new Date(), { dateStyle: 'medium' });
i18n.formatRelativeTime(-2, 'day');
```

### store

Simple state container with a subscribe-based store API.

```js
import { store } from '@mlangeni-group/web-ux';

const appStore = store.create({ theme: 'light' });
appStore.subscribe('theme', (value) => {
  console.log('Theme changed:', value);
});

appStore.set('theme', 'dark');
console.log(appStore.get('theme'));
```

### loader

Loading indicators and skeletons for async UI states.

```js
import { loader } from '@mlangeni-group/web-ux';

loader.showSpinner('#app-loader');
loader.showPageLoader({ type: 'dots' });
loader.showPageLoader({ type: 'bars' });
loader.loadingButton('#save-button', true);
```

Available page loader presets: `spinner`, `dots`, `pulse`, `bounce`, `bars`,
`ring`, `progress`, and `text`. Unknown preset names use `spinner`.

Available helpers:

- `showSpinner(target)`
- `hideSpinner(target)`
- `showProgress(percent, options)`
- `hideProgress(target)`
- `showPageLoader(options)`
- `hidePageLoader()`
- `loadingButton(selector, loading)`
- `showSkeleton(container, options)`
- `hideSkeleton(container)`

`showSkeleton` measures each target before replacing its contents, then sizes the
skeleton to the target and fills its height with rounded, shimmering placeholder
lines. Its existing `rows` and Bootstrap `animation` options are supported; the
shimmer respects the user's reduced-motion preference.

### cookie

```js
import { cookie } from '@mlangeni-group/web-ux';

cookie.setCookie('preference', 'compact', {
  maxAge: 86400,
  path: '/',
  sameSite: 'Lax',
  secure: true,
});
const preference = cookie.getCookie('preference');
```

JavaScript cannot set `HttpOnly`. Session/authentication cookies should be issued by the server with `HttpOnly`, `Secure`, and an appropriate `SameSite` policy; do not store sensitive bearer tokens in `localStorage`.

### dom

Helpers for scrolling, viewport checks, and simple DOM-based form handling.

```js
import { dom } from '@mlangeni-group/web-ux';

dom.scrollTo('#pricing-section');
dom.infiniteScroll(window, async () => {
  console.log('Load more items');
});
```

### perf

Simple performance timing utilities.

```js
import { perf } from '@mlangeni-group/web-ux';

perf.start('render-chart');
// do work
perf.end('render-chart');

perf.measure('api-call', () => {
  // expensive operation
});
```

## Environment variables

You can load environment settings from a global `window.__ENV` value or an inline JSON block:

```js
window.__ENV = {
  API_URL: 'https://api.example.com',
  DEBUG: true,
};
```

Then:

```js
import { env } from '@mlangeni-group/web-ux';

const apiUrl = env.env('API_URL', '/api');
```

## Browser patterns and conventions

This package is intentionally opinionated toward browser-based workflows. Most helpers assume:

- a modern browser environment
- Bootstrap 5 is available for UI components
- jQuery is available for DOM operations and AJAX
- `window`, `document`, `localStorage`, and `crypto.subtle` are available in runtime

## Notes

- The package is primarily a frontend utility toolkit, not a framework.
- JWT payload decoding is not signature verification or authorization.
- Crypto helpers are designed for browser use and follow Web Crypto best practices.
- This package is best used in apps already built around jQuery and Bootstrap, or in migration projects where a shared frontend utility layer reduces duplication.
- `npm test` runs the focused Node test suite; `npm run build` generates ESM, CommonJS, and standalone browser artifacts.

## License

MIT

## Author

Precious Lyson, Mlangeni Group
