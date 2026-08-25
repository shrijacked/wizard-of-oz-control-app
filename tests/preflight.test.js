'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { summarizePreflight } = require('../src/preflight');

function readySystem() {
  return {
    screens: {
      subject: { connected: true, ready: true },
      robot: { connected: true, ready: true },
    },
    camera: { live: true, deviceLabel: 'HD Pro Webcam C270' },
    sensorHealth: {
      watch: { state: 'healthy', detail: 'HRV sample 1s ago.' },
      gaze: { state: 'healthy', detail: 'Gaze frame 1s ago.' },
    },
  };
}

test('preflight blocks setup when screens, camera, or sensors are missing', () => {
  const summary = summarizePreflight({
    state: {
      session: {
        status: 'setup',
        plannedRounds: 3,
        metadata: {
          participantId: '',
          researcher: '',
          sittingNumber: 1,
        },
        queue: [],
      },
    },
    system: {
      screens: {
        subject: { connected: false, ready: false },
        robot: { connected: false, ready: false },
      },
      camera: { live: false },
      sensorHealth: {
        watch: { state: 'waiting', summary: 'Watch telemetry is waiting for its first sample.' },
        gaze: { state: 'waiting', summary: 'Pupil Core has not sent a gaze frame yet.' },
      },
    },
  });

  assert.equal(summary.requiredReady, false);
  assert.ok(summary.blockingCount >= 6);
  assert.ok(summary.blockers.some((item) => item.id === 'metadata'));
  assert.ok(summary.blockers.some((item) => item.id === 'camera'));
  assert.ok(summary.blockers.some((item) => item.id === 'robot-display'));
  assert.ok(summary.blockers.some((item) => item.id === 'gaze-telemetry'));
});

test('preflight marks setup ready once sitting queue, screens, camera, and sensors are live', () => {
  const summary = summarizePreflight({
    state: {
      session: {
        status: 'setup',
        plannedRounds: 3,
        metadata: {
          participantId: 'P-001',
          researcher: 'Shrijacked',
          sittingNumber: 2,
        },
        queue: [{ setId: '4' }, { setId: '5' }, { setId: '6' }],
      },
    },
    system: readySystem(),
  });

  assert.equal(summary.requiredReady, true);
  assert.equal(summary.blockingCount, 0);
  assert.match(summary.summary, /ready for participant/i);
});
