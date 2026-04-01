'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { ExperimentStore } = require('../src/store');

async function createStore(now = new Date('2026-04-01T06:31:30.000Z')) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-store-'));
  const store = new ExperimentStore({ dataDir, now: () => now });
  await store.initialize();
  return { store, dataDir };
}

test('store persists hints, actions, and telemetry to disk-backed state', async () => {
  const { store, dataDir } = await createStore();

  await store.setHint({ text: 'Try the outer edge first.' });
  await store.logRobotAction({ actionId: 'function-3', label: 'Function 3: Blue Triangle' });
  await store.ingestGazeTelemetry({
    attentionScore: 0.3,
    fixationLoss: 0.7,
    pupilDilation: 0.5,
  });

  const state = store.getState();
  assert.equal(state.hint.text, 'Try the outer edge first.');
  assert.equal(state.robotAction.actionId, 'function-3');
  assert.equal(state.telemetry.gaze.fixationLoss, 0.7);
  assert.ok(['normal', 'observe', 'intervene'].includes(state.adaptive.status));

  const savedState = JSON.parse(await fs.readFile(path.join(dataDir, 'state.json'), 'utf8'));
  assert.equal(savedState.hint.text, 'Try the outer edge first.');

  const eventsLog = await fs.readFile(path.join(dataDir, 'events.jsonl'), 'utf8');
  assert.match(eventsLog, /hint\.updated/);
  assert.match(eventsLog, /robot\.action\.logged/);
});

test('store can ingest watch baseline and metric entries', async () => {
  const { store } = await createStore();

  await store.ingestWatchEntry({
    sequence_number: 1,
    timestamp: '2026-04-01 12:00:00',
    watch_data: {
      is_baseline: true,
      baseline_metrics: {
        hr: 70,
        sdnn: 40,
        rmssd: 30,
        pnn50: 20,
      },
    },
  });

  await store.ingestWatchEntry({
    sequence_number: 2,
    timestamp: '2026-04-01 12:01:00',
    watch_data: {
      is_baseline: false,
      current_metrics: {
        hr: 88,
        sdnn: 20,
        rmssd: 14,
        pnn50: 8,
      },
      changes_from_baseline: {
        hr: 25.7,
      },
      stress_score: 0.81,
      stress_level: 'High',
      distraction_detected: true,
      interpretation: 'High stress detected.',
      feedback: 'Consider a break.',
    },
  });

  const state = store.getState();
  assert.equal(state.telemetry.hrv.baseline.hr, 70);
  assert.equal(state.telemetry.hrv.metrics.hr, 88);
  assert.equal(state.telemetry.hrv.stressLevel, 'High');
  assert.equal(state.adaptive.status, 'observe');
});
