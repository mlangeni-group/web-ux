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
- crypto utilities for AES, base64, and JWT usage in the browser
- page loading indicators, skeletons, and progress utilities

## Features

- AJAX client with request configuration, abort support, SSE, upload/download progress, and automatic loaders
- Bootstrap UI helpers: modal, toast, offcanvas, slide-ins, alerts, tooltips, popovers
- Form validation rules, custom rules, auto-save, reset confirmation, and file preview
- Translation support via `i18n.t(...)`
- Local storage wrappers and browser-friendly utility helpers
- Environment variable loading via `window.__ENV` or a JSON script tag
- Web Crypto-based encryption helpers, including Bangwe-compatible AES-GCM helpers
- Performance timing helpers and simple pub/sub event bus
- Cookie helpers and DOM utilities

## Installation

Install the package and required browser dependencies:

```bash
npm install @mlangeni-group/web-ux jquery bootstrap jsonwebtoken
```

If you are using Bootstrap in a plain HTML page, include the scripts before your bundle:

```html
<script src="/node_modules/jquery/dist/jquery.min.js"></script>
<script src="/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script type="module" src="dist/web-ux.js"></script>
```

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
  tokenGetter: () => localStorage.getItem('token'),
  showToasts: true,
});

ajax.get('/users', { page: 1, limit: 20 })
  .then((users) => console.log(users))
  .catch((error) => console.error(error));
```

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
  onSubmit: (data) => {
    console.log('Form payload:', data);
  },
});
```

### 5) Use the storage utility

```js
import { utils } from '@mlangeni-group/web-ux';

utils.storage.set('user', { id: 1, name: 'Ada' }, 3600);
const user = utils.storage.get('user');
```

## Module reference

### ajax

The `ajax` module is a jQuery-based HTTP helper with a feature set aimed at frontend productivity.

Available exports:

- `configure(opts)`
- `request(options)`
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

Use the browser Web Crypto API for secure client-side encryption and JWT support.

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
- `jwt.decode(token)` / `jwt.verify(token, secretOrPublicKey, options)`

Note: JWT verification is delegated to the `jsonwebtoken` package and is intended for browser use when required.

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
- `deepClone(obj)`
- `deepMerge(target, source)`
- `uuid()`
- `randomId(length)`
- `storage.set/get/remove/clear`
- `copyToClipboard(text)`
- `formatBytes(bytes, decimals)`
- `queryString.stringify` / `parse`
- `date.format` / `date.relativeTime`
- `number.format` / `number.currency`
- `isEmail`, `isUrl`, `isNumeric`
- `events.on/off/emit`
- `cozyTheme(options)`
- `lazyLoadImages(selector, rootMargin)`
- `loadScript(url, attrs)`

### env

Use the environment helper to set, merge, and read runtime config values.

```js
import { env } from '@mlangeni-group/web-ux';

env.setEnv({ API_URL: 'https://api.example.com', DEBUG: true });
console.log(env.env('API_URL', '/api'));
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

### i18n

Small translation helper for UI strings.

```js
import { i18n } from '@mlangeni-group/web-ux';

i18n.load({
  greeting: 'Hello, {{name}}!',
  logout: 'Sign out',
});

console.log(i18n.t('greeting', { name: 'Ada' }));
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
loader.loadingButton('#save-button', true);
```

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

### cookie

```js
import { cookie } from '@mlangeni-group/web-ux';

cookie.setCookie('token', 'abc123', 7, '/');
const token = cookie.getCookie('token');
```

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
- Some functions such as JWT validation require the `jsonwebtoken` peer dependency.
- Crypto helpers are designed for browser use and follow Web Crypto best practices.
- This package is best used in apps already built around jQuery and Bootstrap, or in migration projects where a shared frontend utility layer reduces duplication.

## License

MIT

## Author

Precious Lyson, Mlangeni Group
