'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { setIdsForSitting, queueMatchesSitting } = require('../src/sitting-queue');

test('sitting numbers map onto three tangram pairs in order', () => {
  assert.deepEqual(setIdsForSitting(1), ['1', '2', '3']);
  assert.deepEqual(setIdsForSitting(2), ['4', '5', '6']);
  assert.deepEqual(setIdsForSitting(3), ['7', '8', '9']);
});

test('queueMatchesSitting requires the sitting pairs in order', () => {
  assert.equal(queueMatchesSitting([{ setId: '4' }, { setId: '5' }, { setId: '6' }], 2), true);
  assert.equal(queueMatchesSitting([{ setId: '1' }, { setId: '2' }, { setId: '3' }], 2), false);
  assert.equal(queueMatchesSitting([{ setId: '4' }, { setId: '5' }], 2), false);
});
