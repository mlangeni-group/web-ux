import test from 'node:test';
import assert from 'node:assert/strict';
import { date } from '../lib/utils.js';

test('relative time formatting handles the present without throwing', () => {
  assert.equal(typeof date.relativeTime(Date.now()), 'string');
});
