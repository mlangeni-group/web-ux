// HTTP client with interceptors, retries, caching, SSE, upload/download progress, and cozy loaders.

import $ from 'jquery';
import { toast } from './bootstrap';
import { showSpinner, hideSpinner, showPageLoader, hidePageLoader, showProgress } from './loader';
import { events } from './utils';

let config = {
  contentType: 'application/json',
  dataType: 'json',
  timeout: 30000,
  showLoader: true,
  showToasts: true,
  retries: 0,
  retryDelay: 1000,
  useExponentialBackoff: false,
  tokenGetter: null,
  cache: false,
  cacheTTL: 60,
  loaderType: 'spinner',    // 'spinner' | 'page-overlay'
  loaderTarget: '#global-loader',
  interceptors: { beforeRequest: [], afterResponse: [], onError: [] },
};

let pendingCount = 0;
const requestCache = new Map();
const abortControllers = new Map();

export function configure(opts = {}) { config = { ...config, ...opts }; }
function runInterceptors(type, ...args) { (config.interceptors[type] || []).forEach(fn => fn(...args)); }

function showLoader() {
  if (!config.showLoader) return;
  pendingCount++;
  events.emit('ajax:pending', pendingCount);
  if (config.loaderType === 'page-overlay') showPageLoader();
  else if (config.loaderType === 'spinner') showSpinner(config.loaderTarget);
}
function hideLoader() {
  if (!config.showLoader) return;
  pendingCount = Math.max(0, pendingCount - 1);
  events.emit('ajax:pending', pendingCount);
  if (pendingCount === 0) {
    if (config.loaderType === 'page-overlay') hidePageLoader();
    else hideSpinner(config.loaderTarget);
  }
}

function cacheKey(url, method, data) { return `${method}:${url}:${JSON.stringify(data || {})}`; }
export function clearCache() { requestCache.clear(); }
export function removeCacheEntry(url, method, data) { requestCache.delete(cacheKey(url, method, data)); }

export function abort(requestId) {
  if (abortControllers.has(requestId)) { abortControllers.get(requestId).abort(); abortControllers.delete(requestId); }
}
export function abortAll() { abortControllers.forEach(xhr => xhr.abort()); abortControllers.clear(); }

export function request(options) {
  const {
    showLoader: reqShowLoader, retries, retryDelay, useExponentialBackoff, raw, requestId,
    cache: reqCache, cacheTTL: reqCacheTTL, ...ajaxSettings
  } = { ...config, ...options };

  if (requestId) abort(requestId);

  const token = config.tokenGetter ? config.tokenGetter() : null;
  if (token) ajaxSettings.headers = { ...ajaxSettings.headers, Authorization: `Bearer ${token}` };

  if (ajaxSettings.url && !ajaxSettings.url.startsWith('http') && !ajaxSettings.url.startsWith('/'))
    ajaxSettings.url = '/' + ajaxSettings.url;

  const useCache = reqCache !== undefined ? reqCache : config.cache;
  const ttl = reqCacheTTL !== undefined ? reqCacheTTL : config.cacheTTL;
  const isGet = (ajaxSettings.method || 'GET').toUpperCase() === 'GET';
  if (useCache && isGet) {
    const key = cacheKey(ajaxSettings.url, 'GET', ajaxSettings.data);
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl * 1000) return Promise.resolve(cached.data);
  }

  runInterceptors('beforeRequest', ajaxSettings);
  if (reqShowLoader !== false) showLoader();

  const xhr = $.ajax(ajaxSettings);
  if (requestId) abortControllers.set(requestId, xhr);

  return xhr
    .then((data, textStatus, jqXHR) => {
      if (reqShowLoader !== false) hideLoader();
      if (requestId) abortControllers.delete(requestId);
      if (useCache && isGet) requestCache.set(cacheKey(ajaxSettings.url, 'GET', ajaxSettings.data), { data, timestamp: Date.now() });
      runInterceptors('afterResponse', data, jqXHR);
      return raw ? jqXHR : data;
    })
    .catch((jqXHR, textStatus, errorThrown) => {
      if (reqShowLoader !== false) hideLoader();
      if (requestId) abortControllers.delete(requestId);

      const shouldRetry = retries > 0 && jqXHR.status >= 500;
      if (shouldRetry) {
        const delay = useExponentialBackoff ? retryDelay * Math.pow(2, retries - 1) : retryDelay;
        return new Promise(resolve => setTimeout(() => resolve(request({ ...options, retries: retries - 1 })), delay));
      }

      let errorMessage = 'An unexpected error occurred.';
      if (jqXHR.responseJSON?.message) errorMessage = jqXHR.responseJSON.message;
      else if (jqXHR.statusText) errorMessage = `${jqXHR.status}: ${jqXHR.statusText}`;

      if (config.showToasts) toast({ title: 'Request Failed', message: errorMessage, variant: 'danger' });
      const error = new Error(errorMessage);
      error.status = jqXHR.status; error.response = jqXHR.responseJSON || jqXHR.responseText; error.jqXHR = jqXHR;
      runInterceptors('onError', error);
      throw error;
    });
}

export const get = (url, data, opts) => request({ ...opts, method: 'GET', url, data });
export const post = (url, data, opts) => request({ ...opts, method: 'POST', url, data });
export const put = (url, data, opts) => request({ ...opts, method: 'PUT', url, data });
export const patch = (url, data, opts) => request({ ...opts, method: 'PATCH', url, data });
export const del = (url, opts) => request({ ...opts, method: 'DELETE', url });

export function upload(url, files, extraData = {}, opts = {}) {
  const formData = new FormData();
  if (files instanceof File) formData.append('file', files);
  else if (files instanceof FileList) Array.from(files).forEach((file, i) => formData.append(`file${i}`, file));
  else if (typeof files === 'object') Object.entries(files).forEach(([key, file]) => formData.append(key, file));
  Object.entries(extraData).forEach(([key, value]) => formData.append(key, value));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    const token = config.tokenGetter ? config.tokenGetter() : null;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (opts.showProgress !== false) showProgress(percent, { target: opts.progressTarget || '#global-progress' });
        opts.onProgress?.(percent);
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

export function download(url, filename, { onProgress, showProgress: showProg = true, progressTarget, ...opts } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    const token = config.tokenGetter ? config.tokenGetter() : null;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (showProg) showProgress(percent, { target: progressTarget || '#global-progress' });
        onProgress?.(percent);
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const blob = xhr.response;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        resolve({ success: true });
      } else reject(new Error(`Download failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send();
  });
}

export function sse(url, { onMessage, onOpen, onError, reconnect = true, maxReconnect = 5 } = {}) {
  let reconnectAttempts = 0, source;
  function connect() {
    source = new EventSource(url);
    if (onOpen) source.onopen = onOpen;
    source.onmessage = onMessage;
    source.onerror = (event) => {
      if (reconnect && reconnectAttempts < maxReconnect) {
        reconnectAttempts++;
        setTimeout(connect, 3000);
      } else onError?.(event);
    };
  }
  connect();
  return { close: () => source.close(), source };
}

export function requestAll(requests, { showLoader = true } = {}) {
  if (showLoader) showPageLoader();
  return Promise.all(requests.map(r => request(r))).finally(() => { if (showLoader) hidePageLoader(); });
}

export function isPending() { return pendingCount > 0; }