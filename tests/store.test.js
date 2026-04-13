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

function tinyPdfBase64() {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF').toString('base64');
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

test('store groups uploaded subject and solution files into selectable puzzle sets', async () => {
  const { store } = await createStore();

  const result = await store.uploadPuzzleAssets([
    {
      name: '1.pdf',
      mimeType: 'application/pdf',
      contentBase64: tinyPdfBase64(),
    },
    {
      name: '1s.pdf',
      mimeType: 'application/pdf',
      contentBase64: tinyPdfBase64(),
    },
    {
      name: '2.pdf',
      mimeType: 'application/pdf',
      contentBase64: tinyPdfBase64(),
    },
  ], {
    actor: 'Shrijacked',
    source: 'admin',
  });

  assert.equal(result.puzzleSets.length, 1);
  assert.equal(result.puzzleSets[0].setId, '1');
  assert.equal(result.puzzleSets[0].subjectAsset.originalName, '1.pdf');
  assert.equal(result.puzzleSets[0].solutionAsset.originalName, '1s.pdf');
  assert.equal(result.incompleteUploads.length, 1);
  assert.equal(result.incompleteUploads[0].originalName, '2.pdf');

  await store.selectPuzzleSet({
    setId: '1',
    actor: 'Shrijacked',
    source: 'admin',
  });

  const state = store.getState();
  assert.equal(state.assets.puzzleSets.length, 1);
  assert.equal(state.assets.incompleteUploads.length, 1);
  assert.equal(state.session.puzzleSet.setId, '1');
  assert.equal(state.session.puzzleSet.subjectAsset.originalName, '1.pdf');
  assert.equal(state.session.puzzleSet.solutionAsset.originalName, '1s.pdf');

  await store.resetSession({
    requestedBy: 'Shrijacked',
  });

  const resetState = store.getState();
  assert.equal(resetState.assets.puzzleSets.length, 1);
  assert.equal(resetState.assets.incompleteUploads.length, 1);
  assert.equal(resetState.session.puzzleSet, null);
});

test('store can start without preflight data and build the concise operator export', async () => {
  const { store } = await createStore(new Date('2026-04-01T06:31:30.000Z'));

  await store.configureSession({
    studyId: 'pilot-02',
    participantId: 'P-010',
    researcher: 'Shrijacked',
    notes: 'camera-only dry run',
  });

  await store.uploadPuzzleAssets([
    {
      name: '7.pdf',
      mimeType: 'application/pdf',
      contentBase64: tinyPdfBase64(),
    },
    {
      name: '7s.pdf',
      mimeType: 'application/pdf',
      contentBase64: tinyPdfBase64(),
    },
  ], {
    actor: 'Shrijacked',
  });

  await store.selectPuzzleSet({
    setId: '7',
    actor: 'Shrijacked',
  });

  await store.startSession({ operator: 'Shrijacked' });
  await store.setHint({ text: 'Try the outer edge first.' });
  await store.logRobotAction({ actionId: 'function-2', label: 'Function 2: Rotate Triangle' });
  await store.completeSession({
    operator: 'Shrijacked',
    summary: 'Participant completed the puzzle steadily.',
  });

  const conciseExport = await store.buildOperatorExport(store.getState().session.id);
  assert.equal(conciseExport.sessionId, store.getState().session.id);
  assert.equal(conciseExport.metadata.participantId, 'P-010');
  assert.equal(conciseExport.puzzle.setId, '7');
  assert.equal(conciseExport.puzzle.subjectFile, '7.pdf');
  assert.equal(conciseExport.puzzle.solutionFile, '7s.pdf');
  assert.equal(conciseExport.interventions.length, 2);
  assert.deepEqual(conciseExport.interventions.map((entry) => entry.type), ['hint', 'robot']);
  assert.equal(conciseExport.interventions[0].text, 'Try the outer edge first.');
  assert.equal(conciseExport.interventions[1].label, 'Function 2: Rotate Triangle');
  assert.ok(Number.isFinite(conciseExport.durationSeconds));
  assert.equal('adaptive' in conciseExport, false);
  assert.equal('preflight' in conciseExport, false);
  assert.equal('events' in conciseExport, false);

  const csv = await store.getSessionCsv(store.getState().session.id);
  assert.match(csv, /hint\.updated/);
  assert.match(csv, /robot\.action\.logged/);
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
