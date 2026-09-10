'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildLaunchPlan } = require('../src/study-launcher');

test('study launcher binds the server to all interfaces by default', () => {
  const plan = buildLaunchPlan({
    port: 3030,
  });

  assert.equal(plan.host, '0.0.0.0');
  assert.equal(plan.server.env.HOST, '0.0.0.0');
  assert.equal(plan.server.env.PORT, '3030');
  assert.equal(plan.gaze, undefined);
});

test('study launcher builds a server and watch plan without gaze by default', () => {
  const plan = buildLaunchPlan({
    host: '127.0.0.1',
    port: 3030,
  });

  assert.equal(plan.server.label, 'server');
  assert.deepEqual(plan.server.args, ['src/server.js']);
  assert.equal(plan.server.env.HOST, '127.0.0.1');
  assert.equal(plan.server.env.PORT, '3030');

  assert.equal(plan.watch.label, 'watch');
  assert.equal(plan.watch.command, 'python3');
  assert.deepEqual(plan.watch.args, ['integrations/watch/watch.py']);
  assert.equal(plan.watch.env.WATCH_CALIBRATE_ON_START, '1');
  assert.deepEqual(plan.watch.autoInput, []);
  assert.equal(plan.watch.optional, true);

  assert.equal(plan.gaze, undefined);
});

test('study launcher can disable the optional watch bridge', () => {
  const plan = buildLaunchPlan({
    host: '127.0.0.1',
    port: 3040,
    enableWatch: false,
  });

  assert.equal(plan.watch, null);
  assert.equal(plan.gaze, undefined);
});

test('study launcher can reuse a saved baseline when startup calibration is disabled', () => {
  const plan = buildLaunchPlan({
    watchAutoCalibrate: false,
  });

  assert.equal(plan.watch.env.WATCH_CALIBRATE_ON_START, '0');
  assert.deepEqual(plan.watch.autoInput, []);
});
