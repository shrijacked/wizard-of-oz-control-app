'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildPolicy } = require('../src/session-policy');

test('startSession is blocked when preflight is not requiredReady', () => {
  const state = {
    session: {
      status: 'setup',
      queue: [{ setId: '1' }, { setId: '2' }, { setId: '3' }],
    },
  };

  const blocked = buildPolicy(state, 'startSession', {
    preflight: {
      requiredReady: false,
      summary: 'Pupil Core has not sent a gaze frame yet.',
    },
  });

  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason, /pupil core/i);
});

test('startSession is blocked when preflight is omitted', () => {
  const state = {
    session: {
      status: 'setup',
      queue: [{ setId: '1' }, { setId: '2' }, { setId: '3' }],
    },
  };

  const blocked = buildPolicy(state, 'startSession');
  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason, /readiness is not complete/i);
});

test('startSession is allowed when preflight is ready', () => {
  const state = {
    session: {
      status: 'setup',
      queue: [{ setId: '1' }, { setId: '2' }, { setId: '3' }],
    },
  };

  const allowed = buildPolicy(state, 'startSession', {
    preflight: { requiredReady: true },
  });

  assert.equal(allowed.allowed, true);
});
