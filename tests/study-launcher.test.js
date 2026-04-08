'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildLaunchPlan } = require('../src/study-launcher');

test('study launcher builds a server, watch, and heartbeat-only gaze plan by default', () => {
  const plan = buildLaunchPlan({
    host: '127.0.0.1',
    port: 3030,
  });

  assert.equal(plan.server.label, 'server');
  assert.deepEqual(plan.server.args, ['src/server.js']);
  assert.equal(plan.server.env.PORT, '3030');

  assert.equal(plan.watch.label, 'watch');
  assert.equal(plan.watch.command, 'python3');
  assert.deepEqual(plan.watch.args, ['integrations/watch/watch.py']);
  assert.equal(plan.watch.optional, true);

  assert.equal(plan.gaze.label, 'gaze');
  assert.equal(plan.gaze.command, 'python3');
  assert.equal(plan.gaze.args.includes('--mode'), true);
  assert.equal(plan.gaze.args.includes('heartbeat-only'), true);
  assert.equal(plan.gaze.args.includes('http://127.0.0.1:3030'), true);
});

test('study launcher supports file-tail gaze mode and disabling optional bridges', () => {
  const plan = buildLaunchPlan({
    host: '127.0.0.1',
    port: 3040,
    enableWatch: false,
    gaze: {
      enabled: true,
      mode: 'file-tail',
      file: '/tmp/gaze.jsonl',
      bridgeId: 'pupil-bridge',
      deviceLabel: 'Pupil Labs',
    },
  });

  assert.equal(plan.watch, null);
  assert.equal(plan.gaze.args.includes('file-tail'), true);
  assert.equal(plan.gaze.args.includes('/tmp/gaze.jsonl'), true);
  assert.equal(plan.gaze.args.includes('pupil-bridge'), true);
});
