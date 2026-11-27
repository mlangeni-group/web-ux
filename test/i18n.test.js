import test from 'node:test';
import assert from 'node:assert/strict';
import * as i18n from '../lib/i18n.js';

test('translation supports nested keys, interpolation, and locale fallback', () => {
  i18n.load({ cart: { summary: 'Items: {{count}}' } }, 'en');
  i18n.load({ cart: { summary: 'Articles : {{count}}' } }, 'fr');
  i18n.setLocale('fr');

  assert.equal(i18n.t('cart.summary', { count: 3 }), 'Articles : 3');
  assert.equal(i18n.t('cart.missing'), 'cart.missing');

  i18n.setLocale('en');
});

test('plural translations use locale categories and interpolate the count', () => {
  i18n.load({
    itemCount: {
      one: '{{count}} item',
      other: '{{count}} items',
    },
  }, 'en');
  i18n.setLocale('en');

  assert.equal(i18n.tp('itemCount', 1), '1 item');
  assert.equal(i18n.tp('itemCount', 5), '5 items');
});

test('locale-aware formatting uses Intl and rejects invalid locale tags', () => {
  i18n.setLocale('en-US');
  assert.equal(i18n.formatCurrency(12.5, 'USD'), '$12.50');
  assert.equal(i18n.formatRelativeTime(-2, 'day'), '2 days ago');
  assert.throws(() => i18n.setLocale('not a locale'), RangeError);
});
