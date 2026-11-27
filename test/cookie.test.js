import test from 'node:test';
import assert from 'node:assert/strict';
import { getCookie, setCookie } from '../lib/cookie.js';

function withDocument(callback) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { cookie: '' },
  });
  try {
    callback(globalThis.document);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  }
}

test('cookies encode values and support secure SameSite options', () => {
  withDocument(document => {
    setCookie('preference', 'compact mode', {
      maxAge: 60,
      sameSite: 'Lax',
      secure: true,
    });
    assert.match(document.cookie, /preference=compact%20mode/);
    assert.match(document.cookie, /SameSite=Lax/);
    assert.match(document.cookie, /Secure/);
    assert.equal(getCookie('preference'), 'compact mode');
  });
});

test('SameSite=None requires secure transport', () => {
  withDocument(() => {
    assert.throws(
      () => setCookie('preference', 'value', { sameSite: 'None', secure: false }),
      /must be Secure/,
    );
  });
});
