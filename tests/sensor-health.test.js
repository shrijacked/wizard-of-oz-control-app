'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  summarizeWatchHealth,
  summarizeSensorHealth,
} = require('../src/sensor-health');

test('sensor health marks the watch bridge stale after its threshold elapses', () => {
  const now = new Date('2026-04-09T12:00:00.000Z');
  const watch = summarizeWatchHealth({
    active: true,
    filePath: './watch/watch_data.json',
    lastCheckedAt: '2026-04-09T11:59:55.000Z',
    lastProcessedAt: '2026-04-09T11:58:00.000Z',
    lastError: null,
  }, now, { staleAfterMs: 60000 });

  assert.equal(watch.level, 'warning');
  assert.equal(watch.state, 'stale');
  assert.equal(watch.stale, true);
});

test('sensor health reports stale samples instead of frozen calibration progress', () => {
  const now = new Date('2026-04-09T12:00:00.000Z');
  const watch = summarizeWatchHealth({
    active: true,
    lastProcessedAt: '2026-04-09T11:58:00.000Z',
    lastError: null,
  }, now, {
    staleAfterMs: 60000,
    calibration: { active: true, progress: 42 },
  });

  assert.equal(watch.level, 'warning');
  assert.equal(watch.state, 'stale');
  assert.match(watch.summary, /stopped during baseline/i);
  assert.match(watch.detail, /42%/);
});

test('sensor health summarizes running-session watch warnings', () => {
  const now = new Date('2026-04-09T12:00:00.000Z');
  const health = summarizeSensorHealth({
    sessionStatus: 'running',
    watchBridge: {
      active: true,
      filePath: './watch/watch_data.json',
      lastCheckedAt: '2026-04-09T11:59:58.000Z',
      lastProcessedAt: '2026-04-09T11:58:10.000Z',
      lastError: null,
    },
  }, now);

  assert.equal(health.overall.level, 'warning');
  assert.match(health.overall.summary, /stale/i);
  assert.equal(health.watch.state, 'stale');
  assert.equal('gaze' in health, false);
});
