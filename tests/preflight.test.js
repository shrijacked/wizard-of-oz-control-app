'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createInitialPreflightAcknowledgements,
  summarizePreflight,
} = require('../src/preflight');

test('preflight blocks setup when required metadata, signals, or manual confirmations are missing', () => {
  const summary = summarizePreflight({
    state: {
      session: {
        status: 'setup',
        metadata: {
          studyId: '',
          participantId: 'P-001',
          researcher: '',
        },
      },
      telemetry: {
        hrv: { updatedAt: null },
        gaze: { updatedAt: null },
      },
      preflight: {
        acknowledgements: createInitialPreflightAcknowledgements(),
      },
    },
    system: {
      connections: {
        subject: 0,
        audit: 0,
      },
      sensorHealth: {
        watch: {
          level: 'info',
          summary: 'Watch telemetry is waiting for its first sample.',
          detail: 'Waiting for the first HRV sample.',
        },
        gaze: {
          level: 'info',
          summary: 'Attention stream is waiting for a bridge connection.',
          detail: 'Waiting for a gaze bridge.',
        },
      },
    },
  });

  assert.equal(summary.phase, 'setup');
  assert.equal(summary.requiredReady, false);
  assert.ok(summary.blockingCount >= 6);
  assert.match(summary.summary, /must be cleared before the trial can start/i);
  assert.ok(summary.blockers.some((item) => item.id === 'metadata'));
  assert.ok(summary.blockers.some((item) => item.id === 'subject-display'));
  assert.ok(summary.warnings.some((item) => item.id === 'audit-display'));
});

test('preflight marks setup ready once required checklist items are satisfied', () => {
  const summary = summarizePreflight({
    state: {
      session: {
        status: 'setup',
        metadata: {
          studyId: 'pilot-01',
          participantId: 'P-001',
          researcher: 'Shrijacked',
        },
      },
      telemetry: {
        hrv: { updatedAt: '2026-04-09T12:00:10.000Z' },
        gaze: { updatedAt: '2026-04-09T12:00:12.000Z' },
      },
      preflight: {
        acknowledgements: {
          cameraFramingChecked: true,
          subjectDisplayChecked: true,
          robotBoardReady: true,
          materialsReset: true,
        },
      },
    },
    system: {
      connections: {
        subject: 1,
        audit: 0,
      },
      sensorHealth: {
        watch: {
          level: 'healthy',
          detail: 'Last HRV sample was processed 2s ago.',
        },
        gaze: {
          level: 'healthy',
          detail: 'Bridge Tobii 4C was seen 1s ago.',
        },
      },
    },
  });

  assert.equal(summary.requiredReady, true);
  assert.equal(summary.blockingCount, 0);
  assert.equal(summary.warningCount, 1);
  assert.match(summary.summary, /ready for participant/i);
  assert.ok(summary.warnings.some((item) => item.id === 'audit-display'));
});
