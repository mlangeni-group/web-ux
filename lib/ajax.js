// Fetch-based HTTP client with opt-in caching, retries, and XHR upload progress.

import { showSpinner, hideSpinner, showPageLoader, hidePageLoader, showProgress } from './loader.js';
import { events } from './utils.js';

let config = {
  baseUrl: '',
  contentType: 'application/json',
  dataType: 'json',
  timeout: 30000,
  credentials: 'same-origin',
  showLoader: true,
  showToasts: true,
  retries: 0,
  retryDelay: 300,
  useExponentialBackoff: true,
  retryUnsafeMethods: false,
  tokenGetter: null,
  cache: false,
  cacheTTL: 60,
  staleIfError: false,
  maxCacheEntries: 100,
  loaderType: 'spinner',
  loaderTarget: '#global-loader',
  interceptors: { beforeRequest: [], afterResponse: [], onError: [] },
};

let pendingCount = 0;
const requestCache = new Map();
const abortControllers = new Map();

export class HttpError extends Error {
  constructor(message, { status = 0, response = null, headers = null, cause } = {}) {
    super(message, { cause });
    this.name = 'HttpError';
    this.status = status;
    this.response = response;
    this.headers = headers;
  }
}

export function configure(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('HTTP configuration must be an object.');
  }
  config = {
    ...config,
    ...options,
    interceptors: { ...config.interceptors, ...options.interceptors },
  };
}

function runInterceptors(type, ...args) {
  const callbacks = config.interceptors[type] || [];
  for (const callback of callbacks) {
    if (typeof callback !== 'function') throw new TypeError(`The ${type} interceptor must be a function.`);
    callback(...args);
  }
}

function showRequestLoader() {
  pendingCount += 1;
  events.emit('ajax:pending', pendingCount);
  if (config.loaderType === 'page-overlay') showPageLoader();
  else if (config.loaderType === 'spinner') showSpinner(config.loaderTarget);
}

function hideRequestLoader() {
  pendingCount = Math.max(0, pendingCount - 1);
  events.emit('ajax:pending', pendingCount);
  if (pendingCount === 0) {
    if (config.loaderType === 'page-overlay') hidePageLoader();
    else if (config.loaderType === 'spinner') hideSpinner(config.loaderTarget);
  }
}

function appendQuery(url, data) {
  if (data == null) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== null && item !== undefined) params.append(key, String(item));
    }
  }
  const query = params.toString();
  if (!query) return url;
  const hashIndex = url.indexOf('#');
  const path = hashIndex < 0 ? url : url.slice(0, hashIndex);
  const hash = hashIndex < 0 ? '' : url.slice(hashIndex);
  return `${path}${path.includes('?') ? '&' : '?'}${query}${hash}`;
}

function resolveUrl(path, baseUrl) {
  const value = String(path || '');
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return value;
  if (!baseUrl) return value.startsWith('/') ? value : `/${value}`;
  return `${baseUrl.replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`;
}

function buildCacheKey(url, method, data, authorization) {
  return `${method}:${url}:${JSON.stringify(data ?? null)}:${authorization || ''}`;
}

function cacheValue(key, value, ttl, maximum) {
  if (!Number.isInteger(maximum) || maximum < 1) {
    throw new TypeError('maxCacheEntries must be a positive integer.');
  }
  if (!requestCache.has(key) && requestCache.size >= maximum) {
    requestCache.delete(requestCache.keys().next().value);
  }
  requestCache.set(key, { value: cloneCacheValue(value), expiresAt: Date.now() + ttl * 1000 });
}

function cloneCacheValue(value) {
  if (typeof globalThis.structuredClone === 'function') return globalThis.structuredClone(value);
  if (value === null || typeof value !== 'object') return value;
  if (typeof Blob !== 'undefined' && value instanceof Blob) return value.slice();
  return JSON.parse(JSON.stringify(value));
}

export function clearCache() {
  requestCache.clear();
}

export function removeCacheEntry(url, method = 'GET', data) {
  const resolvedUrl = resolveUrl(url, config.baseUrl);
  const prefix = `${method.toUpperCase()}:${resolvedUrl}:${JSON.stringify(data ?? null)}:`;
  for (const key of requestCache.keys()) {
    if (key.startsWith(prefix)) requestCache.delete(key);
  }
}

export function abort(requestId) {
  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
  }
}

export function abortAll() {
  for (const controller of abortControllers.values()) controller.abort();
  abortControllers.clear();
}

function isBody(value) {
  return typeof value === 'string'
    || (typeof FormData !== 'undefined' && value instanceof FormData)
    || (typeof Blob !== 'undefined' && value instanceof Blob)
    || (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams)
    || (typeof ArrayBuffer !== 'undefined' && (value instanceof ArrayBuffer || ArrayBuffer.isView(value)));
}

function parseResponse(response, dataType) {
  if (dataType === 'response') return Promise.resolve(response);
  if (response.status === 204 || response.status === 205) return Promise.resolve(null);
  if (dataType === 'blob') return response.blob();
  if (dataType === 'arrayBuffer') return response.arrayBuffer();
  if (dataType === 'text') return response.text();
  if (dataType === 'json' || response.headers.get('content-type')?.includes('json')) {
    return response.text().then(text => text ? JSON.parse(text) : null);
  }
  return response.text();
}

function errorMessage(response, body) {
  if (body && typeof body === 'object' && typeof body.message === 'string') return body.message;
  return `${response.status} ${response.statusText}`.trim() || 'The request failed.';
}

function retryAfter(response) {
  const header = response?.headers?.get('retry-after');
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

function wait(delay, signal) {
  if (signal?.aborted) return Promise.reject(signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function notifyError(error) {
  if (!config.showToasts || typeof document === 'undefined') return;
  import('./bootstrap.js')
    .then(({ toast }) => toast({ title: 'Request Failed', message: error.message, variant: 'danger' }))
    .catch(toastError => console.error('[web-ux] Unable to show request error toast:', toastError));
}

export async function request(options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Request options must be an object.');
  }

  const requestOptions = { ...config, ...options };
  const {
    showLoader: requestShowsLoader = config.showLoader,
    retries = 0,
    retryDelay = config.retryDelay,
    useExponentialBackoff = config.useExponentialBackoff,
    retryUnsafeMethods = config.retryUnsafeMethods,
    raw = false,
    requestId,
    cache: useCache = config.cache,
    cacheTTL = config.cacheTTL,
    staleIfError = config.staleIfError,
    maxCacheEntries = config.maxCacheEntries,
    tokenGetter = config.tokenGetter,
    signal,
    timeout = config.timeout,
    dataType = config.dataType,
    contentType = config.contentType,
    credentials = config.credentials,
    baseUrl = config.baseUrl,
    data,
    ...fetchOptions
  } = requestOptions;

  if (!Number.isInteger(retries) || retries < 0) throw new TypeError('Retries must be a non-negative integer.');
  if (!Number.isFinite(retryDelay) || retryDelay < 0) throw new TypeError('Retry delay must be non-negative.');
  if (!Number.isFinite(timeout) || timeout < 0) throw new TypeError('Timeout must be non-negative.');
  if (!Number.isFinite(cacheTTL) || cacheTTL < 0 || !Number.isFinite(Date.now() + cacheTTL * 1000)) {
    throw new TypeError('Cache TTL must be non-negative and finite.');
  }
  if (!Number.isInteger(maxCacheEntries) || maxCacheEntries < 1) {
    throw new TypeError('maxCacheEntries must be a positive integer.');
  }
  if (!fetchOptions.url) throw new TypeError('A request URL is required.');

  const method = String(fetchOptions.method || 'GET').toUpperCase();
  const url = resolveUrl(fetchOptions.url, baseUrl);
  const isGet = method === 'GET';
  const fullUrl = isGet ? appendQuery(url, data) : url;
  const headers = new Headers(fetchOptions.headers || {});
  const token = typeof tokenGetter === 'function' ? tokenGetter() : null;
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

  let body = fetchOptions.body;
  if (body === undefined && data !== undefined && !isGet && method !== 'HEAD') {
    if (isBody(data)) body = data;
    else if (contentType === 'application/json') {
      headers.set('Content-Type', contentType);
      body = JSON.stringify(data);
    } else {
      headers.set('Content-Type', contentType);
      body = new URLSearchParams(data).toString();
    }
  }

  const cacheKey = useCache && isGet && !raw
    ? buildCacheKey(fullUrl, method, data, headers.get('Authorization'))
    : null;
  const cached = cacheKey ? requestCache.get(cacheKey) : null;
  if (cached && cached.expiresAt > Date.now()) return cloneCacheValue(cached.value);

  const requestConfig = {
    ...fetchOptions,
    url: fullUrl,
    method,
    headers,
    body,
    credentials,
    signal,
  };
  runInterceptors('beforeRequest', requestConfig);

  const shouldShowLoader = Boolean(requestShowsLoader);
  if (shouldShowLoader) showRequestLoader();
  if (requestId) abort(requestId);

  const canRetry = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method) || retryUnsafeMethods;
  let attempt = 0;
  let lastError;

  try {
    while (attempt <= retries) {
      const controller = new AbortController();
      const onExternalAbort = () => controller.abort(signal.reason);
      if (signal?.aborted) onExternalAbort();
      else signal?.addEventListener('abort', onExternalAbort, { once: true });
      if (requestId) abortControllers.set(requestId, controller);

      let timeoutId;
      let didTimeout = false;
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          didTimeout = true;
          controller.abort(new DOMException('The request timed out.', 'TimeoutError'));
        }, timeout);
      }

      let response;
      try {
        response = await fetch(requestConfig.url, { ...requestConfig, signal: controller.signal });
        const parsed = await parseResponse(response.clone(), dataType);

        if (!response.ok) {
          throw new HttpError(errorMessage(response, parsed), {
            status: response.status,
            response: parsed,
            headers: response.headers,
          });
        }

        if (cacheKey && !raw) cacheValue(cacheKey, parsed, cacheTTL, maxCacheEntries);
        runInterceptors('afterResponse', parsed, response);
        return raw ? response : parsed;
      } catch (error) {
        lastError = didTimeout
          ? new HttpError('The request timed out.', { cause: error })
          : error;
        const retryableStatus = error instanceof HttpError
          && (error.status === 408 || error.status === 429 || error.status >= 500);
        const retryableNetworkError = error instanceof TypeError && !controller.signal.aborted;
        const isAbort = controller.signal.aborted && !didTimeout;
        if (isAbort) throw signal?.reason || error;
        if (staleIfError && cached && (retryableStatus || retryableNetworkError || didTimeout)) {
          return cloneCacheValue(cached.value);
        }
        if (attempt >= retries || !canRetry || !(retryableStatus || retryableNetworkError || didTimeout)) throw lastError;

        const serverDelay = retryAfter(response);
        const backoff = useExponentialBackoff ? retryDelay * (2 ** attempt) : retryDelay;
        const delay = serverDelay ?? Math.round(backoff * (0.5 + Math.random() * 0.5));
        attempt += 1;
        await wait(delay, signal);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        signal?.removeEventListener('abort', onExternalAbort);
        if (requestId && abortControllers.get(requestId) === controller) abortControllers.delete(requestId);
      }
    }
    throw lastError;
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw error;
    const normalizedError = error instanceof HttpError
      ? error
      : new HttpError(error?.message || 'The request failed.', { cause: error });
    runInterceptors('onError', normalizedError);
    notifyError(normalizedError);
    throw normalizedError;
  } finally {
    if (shouldShowLoader) hideRequestLoader();
  }
}

export const get = (url, data, options) => request({ ...options, method: 'GET', url, data });
export const post = (url, data, options) => request({ ...options, method: 'POST', url, data });
export const put = (url, data, options) => request({ ...options, method: 'PUT', url, data });
export const patch = (url, data, options) => request({ ...options, method: 'PATCH', url, data });
export const del = (url, options) => request({ ...options, method: 'DELETE', url });

function xhrRequest(method, url, { signal, timeout = config.timeout, headers = {}, onProgress, showProgress: showProg = true, progressTarget, credentials = config.credentials, ...options } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, resolveUrl(url, config.baseUrl), true);
    xhr.timeout = timeout;
    xhr.withCredentials = credentials === 'include';
    const requestHeaders = new Headers(headers);
    const token = config.tokenGetter?.();
    if (token && !requestHeaders.has('Authorization')) requestHeaders.set('Authorization', `Bearer ${token}`);
    requestHeaders.forEach((value, name) => xhr.setRequestHeader(name, value));

    const cleanup = () => signal?.removeEventListener('abort', abort);
    const abort = () => xhr.abort();
    if (signal?.aborted) {
      reject(signal.reason || new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }
    signal?.addEventListener('abort', abort, { once: true });

    const progressTargetObject = method === 'POST' ? xhr.upload : xhr;
    progressTargetObject.addEventListener('progress', event => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      if (showProg) showProgress(percent, { target: progressTarget || '#global-progress' });
      onProgress?.(percent);
    });
    xhr.addEventListener('load', () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        if (method === 'GET' && options.responseType === 'blob') resolve(xhr.response);
        else if (!xhr.responseText) resolve(null);
        else {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            reject(new HttpError('The server returned invalid JSON.', { status: xhr.status, cause: error }));
          }
        }
      } else {
        reject(new HttpError(`Request failed with status ${xhr.status}.`, { status: xhr.status, response: xhr.responseText }));
      }
    });
    xhr.addEventListener('error', () => {
      cleanup();
      reject(new HttpError('A network error interrupted the request.'));
    });
    xhr.addEventListener('timeout', () => {
      cleanup();
      reject(new HttpError('The request timed out.'));
    });
    xhr.addEventListener('abort', () => {
      cleanup();
      reject(signal?.reason || new DOMException('The operation was aborted.', 'AbortError'));
    });
    xhr.send(options.body ?? null);
  });
}

export function upload(url, files, extraData = {}, options = {}) {
  const formData = new FormData();
  if (typeof File !== 'undefined' && files instanceof File) formData.append('file', files);
  else if (typeof FileList !== 'undefined' && files instanceof FileList) {
    Array.from(files).forEach((file, index) => formData.append(`file${index}`, file));
  } else if (files && typeof files === 'object') {
    Object.entries(files).forEach(([key, file]) => formData.append(key, file));
  } else {
    throw new TypeError('Upload files must be a File, FileList, or named file object.');
  }
  for (const [key, value] of Object.entries(extraData)) formData.append(key, value);
  return xhrRequest('POST', url, { ...options, body: formData, onProgress: options.onProgress, showProgress: options.showProgress });
}

export function download(url, filename, options = {}) {
  return xhrRequest('GET', url, { ...options, responseType: 'blob' }).then(blob => {
    if (typeof document === 'undefined') throw new Error('Downloads are only available in a browser.');
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    return { success: true };
  });
}

export function sse(url, { onMessage, onOpen, onError, reconnect = true, maxReconnect = 5, retryDelay = 3000 } = {}) {
  let reconnectAttempts = 0;
  let source;
  let closed = false;
  let timer;
  function connect() {
    if (closed) return;
    source = new EventSource(resolveUrl(url, config.baseUrl));
    if (onOpen) source.onopen = event => {
      reconnectAttempts = 0;
      onOpen(event);
    };
    source.onmessage = onMessage;
    source.onerror = event => {
      source.close();
      if (reconnect && reconnectAttempts < maxReconnect && !closed) {
        reconnectAttempts += 1;
        timer = setTimeout(connect, retryDelay);
      } else onError?.(event);
    };
  }
  connect();
  return {
    close() {
      closed = true;
      clearTimeout(timer);
      source?.close();
    },
    get source() { return source; },
  };
}

export function requestAll(requests, { showLoader: showBatchLoader = true } = {}) {
  if (showBatchLoader) showPageLoader();
  return Promise.all(requests.map(options => request({ ...options, showLoader: false })))
    .finally(() => {
      if (showBatchLoader) hidePageLoader();
    });
}

export function isPending() {
  return pendingCount > 0;
}
