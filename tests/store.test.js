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

test('store persists hints, actions, and HRV telemetry to disk-backed state', async () => {
  const { store, dataDir } = await createStore();

  await store.setHint({ text: 'Try the outer edge first.' });
  await store.logRobotAction({ pieceId: 'purple-triangle', pieceLabel: 'Purple Triangle', programNumber: 7 });
  await store.ingestHrvTelemetry({
    metrics: { hr: 74, rmssd: 31 },
    stressLevel: 'Not Stressed',
  });

  const state = store.getState();
  assert.equal(state.hint.text, 'Try the outer edge first.');
  assert.deepEqual(state.hint.history.map((entry) => entry.text), ['Try the outer edge first.']);
  assert.equal(state.robotAction.pieceLabel, 'Purple Triangle');
  assert.equal(state.robotAction.programNumber, 7);
  assert.equal(state.robotAction.slot, 7);
  assert.equal(state.robotAction.label, 'Run program 7 — PURPLE TRIANGLE');
  assert.equal(state.telemetry.hrv.metrics.hr, 74);
  assert.equal('gaze' in state.telemetry, false);
  assert.ok(['normal', 'observe', 'intervene'].includes(state.adaptive.status));

  const savedState = JSON.parse(await fs.readFile(path.join(dataDir, 'state.json'), 'utf8'));
  assert.equal(savedState.hint.text, 'Try the outer edge first.');
  assert.deepEqual(savedState.hint.history.map((entry) => entry.text), ['Try the outer edge first.']);

  const eventsLog = await fs.readFile(path.join(dataDir, 'events.jsonl'), 'utf8');
  assert.match(eventsLog, /hint\.updated/);
  assert.match(eventsLog, /robot\.action\.logged/);
});

test('hint history keeps earlier hints when the current hint is cleared', async () => {
  const { store } = await createStore();

  await store.setHint({ text: 'Start with the outside edge.' });
  await store.setHint({ text: 'Try the blue triangle next.' });
  assert.deepEqual(
    store.getState().hint.history.map((entry) => entry.text),
    ['Start with the outside edge.', 'Try the blue triangle next.'],
  );

  await store.clearHint({ author: 'Researcher' });
  assert.equal(store.getState().hint.text, '');
  assert.deepEqual(
    store.getState().hint.history.map((entry) => entry.text),
    ['Start with the outside edge.', 'Try the blue triangle next.'],
  );
});

test('watch recalibration stays pending until fresh collector telemetry acknowledges it', async () => {
  const { store } = await createStore();
  await store.requestWatchCalibration({
    requestId: 'calibration-1',
    requestedAt: '2026-04-01T06:31:30.000Z',
    requestedBy: 'Researcher',
  });
  assert.equal(store.getState().telemetry.hrv.calibration.pending, true);

  await store.ingestHrvTelemetry({
    metrics: { hr: 72 },
    calibration: { active: false, progress: 100 },
  }, { source: 'watch-bridge' });
  assert.equal(store.getState().telemetry.hrv.calibration.pending, true);

  await store.ingestHrvTelemetry({
    metrics: { hr: 73 },
    calibration: { active: true, progress: 8, request_id: 'calibration-1' },
  }, { source: 'watch-bridge' });
  const acknowledged = store.getState().telemetry.hrv.calibration;
  assert.equal(acknowledged.pending, false);
  assert.equal(acknowledged.active, true);
  assert.equal(acknowledged.progress, 8);
  assert.equal(acknowledged.requestId, 'calibration-1');
});

test('watch entries save every raw notification with session and round context', async () => {
  const { store, dataDir } = await createStore();
  await store.ingestWatchEntry({
    timestamp: '2026-04-01T06:31:30.000Z',
    raw_readings: [{
      timestamp: 1775025091,
      timestamp_iso: '2026-04-01T12:01:31+05:30',
      raw_packet_hex: '1648ff03',
      flags: 22,
      heart_rate_bpm: 72,
      rr_raw_1024: [1023],
      rr_ms: [999.0234375],
    }],
    watch_data: {
      is_baseline: false,
      current_metrics: { hr: 72, rmssd: 30 },
      stress_score: 0.56,
      stress_level: 'Possible arousal — review participant',
      arousal: {
        status: 'possible_arousal',
        label: 'Possible arousal — review participant',
        possible: true,
        score: 0.56,
        heart_rate_delta_bpm: 8,
      },
      quality: {
        heart_rate_reliable: true,
        hrv_reliable: false,
      },
    },
  });

  const state = store.getState();
  assert.equal(state.telemetry.hrv.arousal.status, 'possible_arousal');
  assert.equal(state.telemetry.hrv.rawReadingsSaved, 1);
  assert.equal(state.adaptive.status, 'observe');
  const raw = await fs.readFile(path.join(dataDir, 'export', `${state.session.id}.watch.jsonl`), 'utf8');
  const saved = JSON.parse(raw.trim());
  assert.equal(saved.raw_packet_hex, '1648ff03');
  assert.equal(saved.heart_rate_bpm, 72);
  assert.equal(saved.app_context.sessionId, state.session.id);
  assert.equal(saved.app_context.participantId, state.session.metadata.participantId);
});

test('starting a new round clears the previous round hint', async () => {
  const { store, dataDir } = await createStore();
  await store.uploadPuzzleAssets([
    { name: '1.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    { name: '1s.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    { name: '2.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    { name: '2s.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
  ]);
  await store.queuePuzzleSets({ setIds: ['1', '2'] });
  await store.startSession({ operator: 'Researcher' });
  await store.startRound({ operator: 'Researcher' });
  await store.setHint({ text: 'This must not carry into the next puzzle.' });
  await store.completeRound({ operator: 'Researcher', solved: false });
  assert.equal(store.getState().session.rounds[0].solved, false);
  assert.equal(store.getState().session.rounds[0].outcome, 'not_solved');
  const roundExport = await store.buildOperatorExport(store.getState().session.id);
  assert.equal(roundExport.rounds[0].solved, false);
  assert.equal(roundExport.rounds[0].outcome, 'not_solved');
  await store.skipRoundSurvey({ roundIndex: 1, reason: 'Test transition' });
  await store.startRound({ operator: 'Researcher' });

  assert.equal(store.getState().hint.text, '');
  assert.deepEqual(store.getState().hint.history, []);
  const events = await fs.readFile(path.join(dataDir, 'events.jsonl'), 'utf8');
  assert.match(events, /Previous hint cleared before round 2/);
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

  await store.queuePuzzleSets({
    setIds: ['1'],
    actor: 'Shrijacked',
    source: 'admin',
  });

  const state = store.getState();
  assert.equal(state.assets.puzzleSets.length, 1);
  assert.equal(state.assets.incompleteUploads.length, 1);
  assert.equal(state.session.queue.length, 1);
  assert.equal(state.session.queue[0].setId, '1');
  assert.equal(state.session.queue[0].subjectAsset.originalName, '1.pdf');
  assert.equal(state.session.queue[0].solutionAsset.originalName, '1s.pdf');

  await store.resetSession({
    requestedBy: 'Shrijacked',
  });

  const resetState = store.getState();
  assert.equal(resetState.assets.puzzleSets.length, 1);
  assert.equal(resetState.assets.incompleteUploads.length, 1);
  assert.equal(resetState.session.queue.length, 1);
  assert.equal(resetState.session.queue[0].setId, '1');
  assert.equal(resetState.session.puzzleSet, null);
});

test('store continuously writes JSON beside CSV and preserves an early partial ending', async () => {
  const { store, dataDir } = await createStore();
  await store.uploadPuzzleAssets([
    { name: '1.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    { name: '1s.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
  ]);
  await store.queuePuzzleSets({ setIds: ['1'] });
  await store.startSession({ operator: 'Researcher' });
  await store.startRound({ operator: 'Researcher' });
  await store.endSessionEarly({ operator: 'Researcher', reason: 'Participant requested to stop' });

  const state = store.getState();
  assert.equal(state.session.status, 'completed');
  assert.equal(state.session.completedEarly, true);
  assert.equal(state.session.rounds.length, 1);
  assert.equal(state.session.rounds[0].endedEarly, true);
  const jsonPath = path.join(dataDir, 'export', `${state.session.id}.json`);
  const formsPath = path.join(dataDir, 'export', `${state.session.id}-forms.json`);
  const csvPath = path.join(dataDir, 'export', `${state.session.id}.csv`);
  const automaticJson = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  const automaticForms = JSON.parse(await fs.readFile(formsPath, 'utf8'));
  assert.equal(automaticJson.completedEarly, true);
  assert.equal(automaticJson.earlyEndReason, 'Participant requested to stop');
  assert.equal(automaticJson.rounds[0].endedEarly, true);
  assert.equal(automaticForms.sessionId, state.session.id);
  assert.equal(automaticForms.roundForms[0].formStatus, 'missing');
  assert.match(await fs.readFile(csvPath, 'utf8'), /session\.ended-early/);
});

test('dedicated form export contains profile, round, and final questionnaire responses', async () => {
  const { store, dataDir } = await createStore();
  await store.configureSession({
    studyId: 'forms-study',
    participantId: 'P-FORMS',
    researcher: 'Researcher',
    adminProfile: {
      age: 28,
      gender: 'non-binary',
      consented: true,
    },
  });
  await store.submitParticipantProfile({
    age: 28,
    gender: 'non-binary',
    consented: true,
    instructionsAcknowledged: true,
    expectedEfficacy: 5,
  });
  await store.uploadPuzzleAssets([
    { name: '1.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    { name: '1s.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
  ]);
  await store.queuePuzzleSets({ setIds: ['1'] });
  await store.startSession({ operator: 'Researcher' });
  await store.startRound({ operator: 'Researcher' });
  await store.completeRound({ operator: 'Researcher' });
  await store.submitRoundSurvey({
    roundIndex: 1,
    responses: {
      mentalDemand: 4,
      physicalDemand: 2,
      temporalDemand: 3,
      performance: 6,
      effort: 4,
      frustration: 2,
      helpfulness: 5,
      timingEffectiveness: 4,
      clarityAndDistraction: 5,
      stressReduction: 4,
    },
  });
  await store.submitFinalSurvey({
    responses: {
      overallHelpfulness: 6,
      overallEfficacy: 5,
      trust: 6,
      automationBias: 3,
      comment: 'The timing was useful.',
    },
  });

  const forms = await store.buildFormResponsesExport('current');
  assert.equal(forms.participantId, 'P-FORMS');
  assert.equal(forms.preStudyForms.admin.age, 28);
  assert.equal(forms.preStudyForms.subject.expectedEfficacy, 5);
  assert.equal(forms.roundForms[0].formStatus, 'submitted');
  assert.equal(forms.roundForms[0].responses.mentalDemand, 4);
  assert.equal(forms.finalStudyForm.formStatus, 'submitted');
  assert.equal(forms.finalStudyForm.responses.comment, 'The timing was useful.');

  const formsPath = path.join(dataDir, 'export', `${store.getCurrentSessionId()}-forms.json`);
  const automaticForms = JSON.parse(await fs.readFile(formsPath, 'utf8'));
  assert.equal(automaticForms.finalStudyForm.responses.overallHelpfulness, 6);
});

test('store can skip a waiting round while retaining its puzzle and reason', async () => {
  const { store } = await createStore();
  await store.uploadPuzzleAssets([
    { name: '1.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    { name: '1s.pdf', mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
  ]);
  await store.queuePuzzleSets({ setIds: ['1'] });
  await store.startSession({ operator: 'Researcher' });
  await store.skipNextRound({ operator: 'Researcher', reason: 'Practice fast-forward' });
  const round = store.getState().session.rounds[0];
  assert.equal(round.skipped, true);
  assert.equal(round.skipReason, 'Practice fast-forward');
  assert.equal(round.puzzle.setId, '1');
  assert.equal(store.getState().session.finalSurveyRequired, true);
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

  await store.queuePuzzleSets({
    setIds: ['7'],
    actor: 'Shrijacked',
  });

  await store.startSession({ operator: 'Shrijacked' });
  await store.startRound({ operator: 'Shrijacked' });
  await store.setHint({ text: 'Try the outer edge first.' });
  await store.logRobotAction({ pieceId: 'green-square', pieceLabel: 'Green Square', programNumber: 2 });
  await store.completeRound({ operator: 'Shrijacked' });
  await store.completeSession({
    operator: 'Shrijacked',
    summary: 'Participant completed the puzzle steadily.',
  });

  const conciseExport = await store.buildOperatorExport(store.getState().session.id);
  assert.equal(conciseExport.sessionId, store.getState().session.id);
  assert.equal(conciseExport.metadata.participantId, 'P-010');
  assert.equal(conciseExport.roundsCompleted, 1);
  assert.equal(conciseExport.rounds.length, 1);
  assert.equal(conciseExport.rounds[0].puzzle.setId, '7');
  assert.equal(conciseExport.rounds[0].puzzle.subjectFile, '7.pdf');
  assert.equal(conciseExport.rounds[0].puzzle.solutionFile, '7s.pdf');
  assert.equal(conciseExport.rounds[0].interventions.length, 2);
  assert.deepEqual(conciseExport.rounds[0].interventions.map((entry) => entry.type), ['hint', 'robot']);
  assert.equal(conciseExport.rounds[0].interventions[1].programNumber, 2);
  assert.equal(conciseExport.rounds[0].interventions[0].text, 'Try the outer edge first.');
  assert.equal(conciseExport.rounds[0].interventions[1].piece, 'Green Square');
  assert.equal(conciseExport.rounds[0].interventions[1].slot, 2);
  assert.ok(Number.isFinite(conciseExport.totalDurationSeconds));
  assert.equal('adaptive' in conciseExport, false);
  assert.equal('preflight' in conciseExport, false);
  assert.equal('events' in conciseExport, false);

  const csv = await store.getSessionCsv(store.getState().session.id);
  assert.match(csv, /hint\.updated/);
  assert.match(csv, /robot\.action\.logged/);
});

test('store backs up a corrupt state.json instead of crashing on startup', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-store-'));
  await fs.writeFile(path.join(dataDir, 'state.json'), '{ this is not valid json', 'utf8');

  const store = new ExperimentStore({ dataDir });
  await store.initialize();

  // Starts from a clean state rather than throwing.
  assert.equal(store.getState().session.status, 'setup');

  // The corrupt file is preserved for inspection.
  const entries = await fs.readdir(dataDir);
  assert.ok(entries.some((name) => name.startsWith('state.json.corrupt-')));
});

test('store migrates an untouched setup state to the configured nine-round design', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-migrate-'));
  const legacy = new ExperimentStore({ dataDir, plannedRounds: 3 });
  await legacy.initialize();
  const legacyStatePath = path.join(dataDir, 'state.json');
  const legacyState = JSON.parse(await fs.readFile(legacyStatePath, 'utf8'));
  legacyState.telemetry.gaze = { attentionScore: 0.8, updatedAt: '2026-04-01T00:00:00.000Z' };
  legacyState.telemetry.history.gaze = [{ attentionScore: 0.8 }];
  await fs.writeFile(legacyStatePath, JSON.stringify(legacyState), 'utf8');

  const upgraded = new ExperimentStore({ dataDir, plannedRounds: 9, roundsPerSitting: 3 });
  await upgraded.initialize();
  assert.equal(upgraded.getState().session.plannedRounds, 9);
  assert.equal(upgraded.getState().session.metadata.participantId, 'P01');
  assert.equal('gaze' in upgraded.getState().telemetry, false);
  assert.equal('gaze' in upgraded.getState().telemetry.history, false);
});

test('store starts a fresh watch baseline and participant ID after reset', async () => {
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
  assert.equal(state.telemetry.hrv.baseline, null);
  assert.equal(state.session.metadata.participantId, 'P02');
});

test('store refuses to reuse a previously assigned participant ID', async () => {
  const { store } = await createStore();
  assert.equal(store.getState().session.metadata.participantId, 'P01');
  await store.resetSession({ requestedBy: 'Researcher' });
  assert.equal(store.getState().session.metadata.participantId, 'P02');
  await assert.rejects(
    () => store.configureSession({ participantId: 'P01', researcher: 'Researcher' }),
    /already been assigned/i,
  );
});

test('store seeds tangram pairs and auto-queues sitting 2 as puzzles 4, 5, 6', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-store-'));
  const puzzleDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-tangram-'));
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF');

  for (const name of ['1.pdf', '1s.pdf', '2.pdf', '2s.pdf', '3.pdf', '3s.pdf', '4.pdf', '4s.pdf', '5.pdf', '5s.pdf', '6.pdf', '6s.pdf']) {
    await fs.writeFile(path.join(puzzleDir, name), pdf);
  }

  const store = new ExperimentStore({
    dataDir,
    tangramPuzzlesDir: puzzleDir,
    now: () => new Date('2026-04-01T06:31:30.000Z'),
  });
  await store.initialize();

  const seeded = store.getState();
  assert.equal(seeded.assets.puzzleSets.length, 6);
  assert.deepEqual(seeded.session.queue.map((entry) => entry.setId), ['1', '2', '3']);

  await store.configureSession({
    participantId: 'P-010',
    researcher: 'Shrijacked',
    sittingNumber: 2,
  });

  const sittingTwo = store.getState();
  assert.deepEqual(sittingTwo.session.queue.map((entry) => entry.setId), ['4', '5', '6']);
});

test('store runs one persisted nine-round participant study with surveys and sitting breaks', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-study-'));
  let now = new Date('2026-09-07T10:00:00.000Z');
  const store = new ExperimentStore({
    dataDir,
    plannedRounds: 9,
    roundsPerSitting: 3,
    now: () => now,
  });
  await store.initialize();
  const files = [];
  for (let index = 1; index <= 9; index += 1) {
    files.push(
      { name: `${index}.pdf`, mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
      { name: `${index}s.pdf`, mimeType: 'application/pdf', contentBase64: tinyPdfBase64() },
    );
  }
  await store.uploadPuzzleAssets(files, { actor: 'researcher' });
  await store.configureSession({
    studyId: 'hti-20260907',
    participantId: 'P01',
    researcher: 'Researcher',
    adminProfile: { age: 24, gender: 'non-binary', consented: true, instructionsAcknowledged: true },
  });
  await store.submitParticipantProfile({
    age: 24,
    gender: 'non-binary',
    consented: true,
    instructionsAcknowledged: true,
    expectedEfficacy: 5,
  });
  await store.startSession({ operator: 'Researcher' });

  const baseSurvey = {
    mentalDemand: 3,
    physicalDemand: 2,
    temporalDemand: 4,
    performance: 5,
    effort: 4,
    frustration: 2,
  };
  for (let roundIndex = 1; roundIndex <= 9; roundIndex += 1) {
    await store.startRound({ operator: 'Researcher' });
    now = new Date(now.getTime() + 30_000);
    if (roundIndex === 1) {
      await store.pauseRound({ operator: 'Researcher' });
      now = new Date(now.getTime() + 10_000);
      await store.resumeRound({ operator: 'Researcher' });
    }
    now = new Date(now.getTime() + 30_000);
    await store.completeRound({ operator: 'Researcher', solved: roundIndex % 2 === 1 });
    const condition = store.getState().session.rounds.at(-1).condition;
    await store.submitRoundSurvey({
      roundIndex,
      responses: condition === 'control' ? baseSurvey : {
        ...baseSurvey,
        helpfulness: 5,
        timingEffectiveness: 5,
        clarityAndDistraction: 5,
        stressReduction: 5,
      },
    });
    if (roundIndex === 3 || roundIndex === 6) {
      assert.equal(store.getState().session.betweenSittings, true);
      await store.resumeNextSitting({ operator: 'Researcher' });
    }
  }

  assert.equal(store.getState().session.finalSurveyRequired, true);
  assert.equal(store.getState().session.rounds.filter((round) => round.solved === true).length, 5);
  assert.equal(store.getState().session.rounds.filter((round) => round.solved === false).length, 4);
  await store.submitFinalSurvey({ responses: {
    overallHelpfulness: 5,
    overallEfficacy: 5,
    trust: 5,
    automationBias: 3,
    comment: 'Completed.',
  } });
  await store.completeSession({ operator: 'Researcher' });

  const state = store.getState();
  assert.equal(state.session.status, 'completed');
  assert.equal(state.session.rounds.length, 9);
  assert.equal(state.session.rounds[0].durationSeconds, 60);
  assert.equal(new Set(state.session.queue.map((puzzle) => puzzle.setId)).size, 9);
  assert.deepEqual(state.session.rounds.map((round) => round.condition), [
    'control', 'control', 'control',
    'constant', 'constant', 'constant',
    'adaptive', 'adaptive', 'adaptive',
  ]);
  assert.ok(state.session.rounds.every((round) => round.survey));
  assert.equal(state.session.finalSurvey.comment, 'Completed.');
});
