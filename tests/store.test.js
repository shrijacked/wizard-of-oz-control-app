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

test('store can configure session metadata and move through trial lifecycle states', async () => {
  const { store, dataDir } = await createStore();

  await store.configureSession({
    studyId: 'pilot-01',
    participantId: 'P-007',
    condition: 'adaptive',
    researcher: 'Shrijacked',
    notes: 'Evening pilot session',
  });

  await store.startSession({
    operator: 'Shrijacked',
  });

  await store.completeSession({
    operator: 'Shrijacked',
    summary: 'Participant completed the puzzle with one adaptive hint.',
  });

  const state = store.getState();
  assert.equal(state.session.status, 'completed');
  assert.equal(state.session.metadata.studyId, 'pilot-01');
  assert.equal(state.session.metadata.participantId, 'P-007');
  assert.equal(state.session.metadata.condition, 'adaptive');
  assert.equal(state.session.completedSummary, 'Participant completed the puzzle with one adaptive hint.');
  assert.ok(state.session.trialStartedAt);
  assert.ok(state.session.completedAt);

  const eventsLog = await fs.readFile(path.join(dataDir, 'events.jsonl'), 'utf8');
  assert.match(eventsLog, /session\.configured/);
  assert.match(eventsLog, /session\.started/);
  assert.match(eventsLog, /session\.completed/);
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

test('store preserves the loaded watch baseline across session resets', async () => {
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

  await store.resetSession({
    requestedBy: 'Shrijacked',
  });

  const state = store.getState();
  assert.deepEqual(state.telemetry.hrv.baseline, {
    hr: 70,
    sdnn: 40,
    rmssd: 30,
    pnn50: 20,
  });
});

test('store persists reference-puzzle uploads, selection, and resets only the active session choice', async () => {
  const { store, dataDir } = await createStore();

  await store.uploadPuzzleAssets([
    {
      name: 'puzzle-reference.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF'),
    },
  ], {
    actor: 'Shrijacked',
    source: 'admin',
  });

  let state = store.getState();
  assert.equal(state.assets.puzzles.length, 1);
  assert.equal(state.assets.puzzles[0].originalName, 'puzzle-reference.pdf');
  assert.equal(state.session.referencePuzzle, null);

  await store.selectReferencePuzzle({
    assetId: state.assets.puzzles[0].assetId,
    actor: 'Shrijacked',
    source: 'admin',
  });

  state = store.getState();
  assert.equal(state.session.referencePuzzle.originalName, 'puzzle-reference.pdf');
  assert.equal(state.session.referencePuzzle.mimeType, 'application/pdf');
  assert.match(state.session.referencePuzzle.urlPath, /\/media\/puzzles\//);

  const eventsLog = await fs.readFile(path.join(dataDir, 'events.jsonl'), 'utf8');
  assert.match(eventsLog, /puzzle\.library\.uploaded/);
  assert.match(eventsLog, /session\.reference-puzzle\.selected/);

  const bundle = await store.buildSessionExport(store.getCurrentSessionId());
  assert.equal(bundle.state.session.referencePuzzle.originalName, 'puzzle-reference.pdf');
  assert.equal(bundle.analytics.referencePuzzleLabel, 'puzzle-reference.pdf');

  await store.resetSession({
    requestedBy: 'Shrijacked',
  });

  state = store.getState();
  assert.equal(state.assets.puzzles.length, 1);
  assert.equal(state.session.referencePuzzle, null);
});

test('store can build a session export bundle and manifest', async () => {
  const { store } = await createStore();

  await store.configureSession({
    studyId: 'pilot-02',
    participantId: 'P-010',
    condition: 'control',
    researcher: 'Shrijacked',
  });

  await store.setHint({ text: 'Try the outer edge first.' });
  await store.logRobotAction({ actionId: 'function-2', label: 'Function 2: Rotate Triangle' });
  await store.startSession({ operator: 'Shrijacked' });
  await store.ingestGazeTelemetry({
    attentionScore: 0.42,
    fixationLoss: 0.53,
    pupilDilation: 0.49,
  }, { source: 'gaze-bridge' });
  await store.completeSession({
    operator: 'Shrijacked',
    summary: 'Participant completed the puzzle steadily.',
  });

  const manifest = await store.getExportManifest();
  assert.ok(Array.isArray(manifest.sessions));
  assert.equal(manifest.sessions[0].sessionId, store.getState().session.id);
  assert.ok(manifest.sessions[0].downloads.bundleJson.endsWith('.bundle.json'));

  const bundle = await store.buildSessionExport(store.getState().session.id);
  assert.equal(bundle.session.id, store.getState().session.id);
  assert.equal(bundle.state.hint.text, 'Try the outer edge first.');
  assert.equal(bundle.state.session.metadata.participantId, 'P-010');
  assert.equal(bundle.analytics.eventCounts['telemetry.gaze.updated'], 1);
  assert.equal(bundle.analytics.sessionStatus, 'completed');
  assert.ok(bundle.analytics.durationSeconds >= 0);
  assert.equal(bundle.analytics.puzzleDurationSeconds, bundle.analytics.durationSeconds);
  assert.equal(bundle.analytics.trialStartedAt, bundle.state.session.trialStartedAt);
  assert.equal(bundle.analytics.completedAt, bundle.state.session.completedAt);
  assert.equal(bundle.analytics.latestHint, 'Try the outer edge first.');
  assert.equal(bundle.analytics.latestRobotAction, 'Function 2: Rotate Triangle');
  assert.ok(bundle.replay.events.length >= 4);
  assert.equal(bundle.replay.events[0].step, 1);
  assert.ok(bundle.replay.events.some((event) => event.type === 'session.completed'));
  assert.ok(bundle.events.some((event) => event.type === 'telemetry.gaze.updated'));
  assert.match(bundle.csv, /telemetry\.gaze\.updated/);
});

test('store persists adaptive configuration updates into state and exports', async () => {
  const { store, dataDir } = await createStore();

  await store.updateAdaptiveConfiguration({
    configuration: {
      thresholds: {
        observe: 0.34,
        intervene: 0.62,
      },
      weights: {
        hrv: 0.7,
        gaze: 0.3,
      },
      distractionBoost: 0.18,
      freshness: {
        fullStrengthSeconds: 75,
        staleAfterSeconds: 240,
      },
    },
    actor: 'Shrijacked',
  });

  const state = store.getState();
  assert.equal(state.adaptive.configuration.thresholds.observe, 0.34);
  assert.equal(state.adaptive.configuration.thresholds.intervene, 0.62);
  assert.equal(state.adaptive.configuration.weights.hrv, 0.7);
  assert.equal(state.adaptive.configuration.freshness.staleAfterSeconds, 240);

  const savedState = JSON.parse(await fs.readFile(path.join(dataDir, 'state.json'), 'utf8'));
  assert.equal(savedState.adaptive.configuration.distractionBoost, 0.18);

  const eventsLog = await fs.readFile(path.join(dataDir, 'events.jsonl'), 'utf8');
  assert.match(eventsLog, /adaptive\.configuration\.updated/);

  const bundle = await store.buildSessionExport(store.getCurrentSessionId());
  assert.equal(bundle.state.adaptive.configuration.thresholds.observe, 0.34);
  assert.equal(bundle.analytics.adaptiveConfiguration.weights.gaze, 0.3);
});

test('store persists preflight acknowledgements into state and exports', async () => {
  const { store, dataDir } = await createStore();

  await store.updatePreflightAcknowledgements({
    acknowledgements: {
      cameraFramingChecked: true,
      subjectDisplayChecked: true,
      robotBoardReady: false,
      materialsReset: true,
    },
    actor: 'Shrijacked',
  });

  const state = store.getState();
  assert.equal(state.preflight.acknowledgements.cameraFramingChecked, true);
  assert.equal(state.preflight.acknowledgements.robotBoardReady, false);
  assert.equal(state.preflight.updatedBy, 'Shrijacked');

  const savedState = JSON.parse(await fs.readFile(path.join(dataDir, 'state.json'), 'utf8'));
  assert.equal(savedState.preflight.acknowledgements.subjectDisplayChecked, true);

  const bundle = await store.buildSessionExport(store.getCurrentSessionId());
  assert.equal(bundle.state.preflight.acknowledgements.materialsReset, true);
  assert.ok(bundle.events.some((event) => event.type === 'preflight.acknowledgements.updated'));
});
