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
      summary: 'Watch telemetry is waiting for its first sample.',
    },
  });

  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason, /watch telemetry/i);
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

test('nine-round policy gates surveys, breaks, control interventions, and final completion', () => {
  const state = {
    session: {
      status: 'running',
      queue: Array.from({ length: 9 }, (_, index) => ({ setId: String(index + 1) })),
      schedule: Array.from({ length: 9 }, (_, index) => ({ roundIndex: index + 1 })),
      rounds: [{ index: 1 }],
      activeRound: null,
      awaitingRoundSurvey: 1,
      betweenSittings: false,
      finalSurveyRequired: false,
      finalSurvey: null,
    },
  };
  assert.match(buildPolicy(state, 'startRound').reason, /questionnaire/i);

  state.session.awaitingRoundSurvey = null;
  state.session.activeRound = { index: 2, condition: 'control' };
  assert.match(buildPolicy(state, 'setHint').reason, /control/i);
  assert.equal(buildPolicy(state, 'pauseRound').allowed, true);

  state.session.activeRound = null;
  state.session.betweenSittings = true;
  assert.match(buildPolicy(state, 'startRound').reason, /between sittings/i);
  assert.equal(buildPolicy(state, 'resumeSitting').allowed, true);

  state.session.betweenSittings = false;
  state.session.rounds = Array.from({ length: 9 }, (_, index) => ({ index: index + 1 }));
  state.session.finalSurvey = { overallEfficacy: 5 };
  assert.equal(buildPolicy(state, 'completeSession').allowed, true);
});
