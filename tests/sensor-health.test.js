'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  summarizeWatchHealth,
  summarizeGazeHealth,
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

test('sensor health treats an active gaze heartbeat as healthy', () => {
  const now = new Date('2026-04-09T12:00:00.000Z');
  const gaze = summarizeGazeHealth({
    bridgeId: 'tobii-bridge',
    deviceLabel: 'Tobii 4C',
    transport: 'sdk-http',
    lastHeartbeatAt: '2026-04-09T11:59:57.000Z',
    lastFrameAt: '2026-04-09T11:59:58.000Z',
    active: true,
    staleAfterMs: 15000,
    lastError: null,
  }, now);

  assert.equal(gaze.level, 'healthy');
  assert.equal(gaze.state, 'healthy');
  assert.equal(gaze.summary.includes('healthy'), true);
});

test('sensor health summarizes running-session warnings across bridges', () => {
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
    gazeBridge: {
      bridgeId: null,
      active: false,
      lastHeartbeatAt: null,
      lastFrameAt: null,
      staleAfterMs: 15000,
      lastError: null,
    },
  }, now);

  assert.equal(health.overall.level, 'warning');
  assert.ok(health.overall.summary.includes('Attention'));
  assert.equal(health.watch.state, 'stale');
  assert.equal(health.gaze.state, 'waiting');
});
