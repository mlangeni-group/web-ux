import test from 'node:test';
import assert from 'node:assert/strict';
import { clearCache, configure, get, post, request, HttpError } from '../lib/ajax.js';

function resetConfig() {
  clearCache();
  configure({
    baseUrl: '',
    cache: false,
    staleIfError: false,
    retries: 0,
    showLoader: false,
    showToasts: false,
    tokenGetter: null,
  });
}

test('GET encodes query data and parses JSON responses', async () => {
  resetConfig();
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    assert.equal(options.method, 'GET');
    return new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
  };

  try {
    const result = await get('https://example.test/items', { tag: ['a', 'b'], page: 2 });
    assert.deepEqual(result, { ok: true });
    assert.equal(requestedUrl, 'https://example.test/items?tag=a&tag=b&page=2');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unsafe methods do not retry unless explicitly enabled', async () => {
  resetConfig();
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return new Response('{"message":"failed"}', {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    await assert.rejects(post('https://example.test/items', {}, { retries: 2, retryDelay: 0 }), error => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.status, 503);
      return true;
    });
    assert.equal(attempts, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('idempotent requests retry transient failures and cache can serve stale data offline', async () => {
  resetConfig();
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) return new Response('', { status: 503 });
    if (attempts === 2) return new Response('{"value":7}', { headers: { 'content-type': 'application/json' } });
    throw new TypeError('offline');
  };

  try {
    const result = await get('https://example.test/items', undefined, {
      retries: 1,
      retryDelay: 0,
      useExponentialBackoff: false,
      cache: true,
      cacheTTL: 0,
      staleIfError: true,
    });
    assert.deepEqual(result, { value: 7 });
    const offlineResult = await get('https://example.test/items', undefined, {
      retries: 0,
      cache: true,
      cacheTTL: 0,
      staleIfError: true,
    });
    assert.deepEqual(offlineResult, { value: 7 });
    assert.equal(attempts, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('external abort signals reject with AbortError', async () => {
  resetConfig();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  const controller = new AbortController();
  const result = request({ url: 'https://example.test/slow', signal: controller.signal });
  controller.abort();

  try {
    await assert.rejects(result, error => error.name === 'AbortError');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
