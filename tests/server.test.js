'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createApp } = require('../src/create-app');

function tinyPdfBase64() {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF').toString('base64');
}

async function startApp(options = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-app-'));
  const app = await createApp({ dataDir, port: 0, seedPuzzles: false, ...options });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();

  return {
    app,
    baseUrl: `http://127.0.0.1:${address.port}`,
    dataDir,
  };
}

async function uploadPuzzlePair(baseUrl, label = '1') {
  const response = await fetch(`${baseUrl}/api/puzzles/upload`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      files: [
        {
          name: `${label}.pdf`,
          mimeType: 'application/pdf',
          contentBase64: tinyPdfBase64(),
        },
        {
          name: `${label}s.pdf`,
          mimeType: 'application/pdf',
          contentBase64: tinyPdfBase64(),
        },
      ],
    }),
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function postJson(baseUrl, pathname, body = {}, headers = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

async function queuePuzzles(baseUrl, setIds) {
  const response = await postJson(baseUrl, '/api/rounds/queue', { setIds, actor: 'Shrijacked' });
  assert.equal(response.status, 200);
  return response.json();
}

async function uploadSittingPairs(baseUrl, sittingNumber = 1) {
  const start = ((Number(sittingNumber) - 1) * 3) + 1;
  for (const label of [start, start + 1, start + 2]) {
    await uploadPuzzlePair(baseUrl, String(label));
  }
}

async function markSensorsLive(baseUrl) {
  const camera = await postJson(baseUrl, '/api/camera/status', {
    live: true,
    deviceLabel: 'HD Pro Webcam C270',
  });
  assert.equal(camera.status, 200);

  const hrv = await postJson(baseUrl, '/api/telemetry/hrv', {
    metrics: { hr: 72, rmssd: 30 },
    stressLevel: 'Not Stressed',
  });
  assert.equal(hrv.status, 200);

}

async function connectDisplayScreens(baseUrl) {
  const wsBase = baseUrl.replace('http://', 'ws://');
  const subject = await readSubjectSocket(wsBase);
  const robot = await readRobotSocket(wsBase);
  const subjectReady = await postJson(baseUrl, '/api/screens/ready', { role: 'subject', ready: true });
  const robotReady = await postJson(baseUrl, '/api/screens/ready', { role: 'robot', ready: true });
  assert.equal(subjectReady.status, 200);
  assert.equal(robotReady.status, 200);
  return { subject, robot };
}

async function prepareSitting(baseUrl, options = {}) {
  const sittingNumber = options.sittingNumber || 1;
  await postJson(baseUrl, '/api/session/configure', {
    studyId: options.studyId || 'pilot-01',
    participantId: options.participantId || 'P-001',
    researcher: options.researcher || 'Shrijacked',
    sittingNumber,
    notes: options.notes || '',
  });
  await uploadSittingPairs(baseUrl, sittingNumber);
  await markSensorsLive(baseUrl);
  const screens = await connectDisplayScreens(baseUrl);
  return screens;
}

async function startSitting(baseUrl) {
  const response = await postJson(baseUrl, '/api/session/start', { operator: 'Shrijacked' });
  if (response.status !== 200) {
    assert.equal(response.status, 200, await response.text());
  }
  return response.json();
}

async function startRound(baseUrl) {
  const response = await postJson(baseUrl, '/api/rounds/start', { operator: 'Shrijacked' });
  assert.equal(response.status, 200);
  return response.json();
}

async function readSubjectSocket(wsBase) {
  const socket = new WebSocket(`${wsBase}/ws?role=subject`);
  const messages = [];
  socket.addEventListener('message', (event) => {
    messages.push(JSON.parse(event.data));
  });
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  return { socket, messages };
}

async function readRobotSocket(wsBase) {
  const socket = new WebSocket(`${wsBase}/ws?role=robot`);
  const messages = [];
  socket.addEventListener('message', (event) => {
    messages.push(JSON.parse(event.data));
  });
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  return { socket, messages };
}

test('server serves the simplified three-screen routes and aliases /audit to /robot', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const adminHtml = await fetch(`${baseUrl}/admin`).then((response) => response.text());
    const subjectHtml = await fetch(`${baseUrl}/subject`).then((response) => response.text());
    const robotHtml = await fetch(`${baseUrl}/robot`).then((response) => response.text());
    const auditResponse = await fetch(`${baseUrl}/audit`, { redirect: 'manual' });

    assert.match(adminHtml, /Operator Dashboard/i);
    assert.match(adminHtml, /Start camera/i);
    assert.match(adminHtml, /Robot cue controls/i);
    assert.match(adminHtml, /Begin study/i);
    assert.match(adminHtml, /id="round-start"/);
    assert.match(subjectHtml, /Participant Display/i);
    assert.match(subjectHtml, /id="subject-puzzle"/);
    assert.match(subjectHtml, /Your puzzle/i);
    assert.match(robotHtml, /Robot Operator Screen/i);
    assert.match(robotHtml, /Move this piece/i);
    assert.ok([200, 302, 307, 308].includes(auditResponse.status));
  } finally {
    await app.close();
  }
});

test('uploading paired files creates a selectable puzzle set and leaves unmatched uploads incomplete', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const response = await fetch(`${baseUrl}/api/puzzles/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        files: [
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
        ],
      }),
    });
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.puzzleSets.length, 1);
    assert.equal(payload.puzzleSets[0].setId, '1');
    assert.equal(payload.incompleteUploads.length, 1);
    assert.equal(payload.incompleteUploads[0].originalName, '2.pdf');

    await queuePuzzles(baseUrl, ['1']);
    const screens = await connectDisplayScreens(baseUrl);
    await markSensorsLive(baseUrl);
    await postJson(baseUrl, '/api/session/configure', {
      participantId: 'P-001',
      researcher: 'Shrijacked',
      sittingNumber: 1,
    });
    await uploadPuzzlePair(baseUrl, '2');
    await uploadPuzzlePair(baseUrl, '3');
    await startSitting(baseUrl);
    await startRound(baseUrl);

    const state = await fetch(`${baseUrl}/api/state`).then((res) => res.json());
    assert.equal(state.session.activeRound.index, 1);
    assert.equal(state.session.activeRound.puzzle.setId, '1');
    assert.equal(state.session.puzzleSet.subjectAsset.originalName, '1.pdf');
    assert.equal(state.session.puzzleSet.solutionAsset.originalName, '1s.pdf');
    screens.subject.socket.close();
    screens.robot.socket.close();
  } finally {
    await app.close();
  }
});

test('subject and robot sockets receive role-specific snapshots for live interventions', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const { subject, robot } = await prepareSitting(baseUrl, { sittingNumber: 1 });
    const { socket: subjectSocket, messages: subjectMessages } = subject;
    const { socket: robotSocket, messages: robotMessages } = robot;

    await startSitting(baseUrl);
    await startRound(baseUrl);

    await postJson(baseUrl, '/api/hints', { text: 'Try the blue piece next.' });

    const cueResponse = await postJson(baseUrl, '/api/actions', {
      pieceId: 'purple-triangle',
    });
    assert.equal(cueResponse.status, 200);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const subjectState = subjectMessages.at(-1).data;
    const robotState = robotMessages.at(-1).data;

    assert.equal(subjectState.hint.text, 'Try the blue piece next.');
    assert.equal('puzzleSet' in subjectState, false);
    assert.equal('robotAction' in subjectState, false);
    assert.equal(subjectState.session.activeRound.puzzle.setId, '1');
    assert.equal(subjectState.session.activeRound.puzzle.subjectAsset.originalName, '1.pdf');
    assert.equal('solutionAsset' in subjectState.session.activeRound.puzzle, false);

    assert.equal(robotState.robotAction.pieceLabel, 'Purple Triangle');
    assert.equal(robotState.robotAction.programNumber, 7);
    assert.equal(robotState.robotAction.slot, 7);
    assert.equal(robotState.robotAction.label, 'Run program 7 — PURPLE TRIANGLE');
    assert.equal('puzzleSet' in robotState, false);
    assert.equal('hint' in robotState, false);

    subjectSocket.close();
    robotSocket.close();
  } finally {
    await app.close();
  }
});

test('interventions require an active round and are blocked between rounds and after completion', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const screens = await prepareSitting(baseUrl, { sittingNumber: 1 });

    // Cannot start the sitting until a puzzle is queued (it is), but a hint is
    // blocked until both the sitting and a round are open.
    const beforeStartHint = await postJson(baseUrl, '/api/hints', { text: 'Blocked before start.' });
    assert.equal(beforeStartHint.status, 409);

    await startSitting(baseUrl);

    // Sitting is running but no round is open yet — still blocked.
    const beforeRoundHint = await postJson(baseUrl, '/api/hints', { text: 'Blocked before round.' });
    assert.equal(beforeRoundHint.status, 409);

    await startRound(baseUrl);

    const hintResponse = await postJson(baseUrl, '/api/hints', { text: 'Allowed during round.' });
    assert.equal(hintResponse.status, 200);

    const actionResponse = await postJson(baseUrl, '/api/actions', { pieceId: 'orange-triangle' });
    assert.equal(actionResponse.status, 200);

    const completeRound = await postJson(baseUrl, '/api/rounds/complete', { operator: 'Shrijacked' });
    assert.equal(completeRound.status, 200);

    // Round closed — interventions blocked again.
    const betweenRoundsHint = await postJson(baseUrl, '/api/hints', { text: 'Blocked between rounds.' });
    assert.equal(betweenRoundsHint.status, 409);

    const completeResponse = await postJson(baseUrl, '/api/session/complete', { operator: 'Shrijacked' });
    assert.equal(completeResponse.status, 200);

    const afterCompleteAction = await postJson(baseUrl, '/api/actions', { pieceId: 'green-square' });
    assert.equal(afterCompleteAction.status, 409);
    screens.subject.socket.close();
    screens.robot.socket.close();
  } finally {
    await app.close();
  }
});

test('a full sitting records three rounds with attributed interventions in the export', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const screens = await prepareSitting(baseUrl, {
      studyId: 'pilot-09',
      participantId: 'P-020',
      sittingNumber: 2,
    });
    await startSitting(baseUrl);

    for (let round = 1; round <= 3; round += 1) {
      await startRound(baseUrl);
      await postJson(baseUrl, '/api/hints', { text: `Round ${round} hint.` });
      await postJson(baseUrl, '/api/actions', { pieceId: 'blue-triangle' });
      const complete = await postJson(baseUrl, '/api/rounds/complete', { operator: 'Shrijacked' });
      assert.equal(complete.status, 200);
    }

    // A fourth round is not allowed once the queue is exhausted.
    const fourthRound = await postJson(baseUrl, '/api/rounds/start', { operator: 'Shrijacked' });
    assert.equal(fourthRound.status, 409);

    await postJson(baseUrl, '/api/session/complete', { operator: 'Shrijacked' });

    const exportPayload = await fetch(`${baseUrl}/api/export/current.json`).then((response) => response.json());
    assert.equal(exportPayload.metadata.sittingNumber, 2);
    assert.equal(exportPayload.roundsCompleted, 3);
    assert.equal(exportPayload.rounds.length, 3);
    assert.equal(exportPayload.rounds[0].puzzle.setId, '4');
    assert.equal(exportPayload.rounds[2].puzzle.setId, '6');
    assert.deepEqual(exportPayload.rounds[1].interventions.map((entry) => entry.type), ['hint', 'robot']);
    assert.equal(exportPayload.rounds[1].interventions[1].piece, 'Blue Triangle');
    assert.equal(exportPayload.rounds[1].interventions[1].programNumber, 6);
    assert.equal(exportPayload.rounds[1].interventions[1].slot, 6);
    screens.subject.socket.close();
    screens.robot.socket.close();
  } finally {
    await app.close();
  }
});

test('the round export carries metadata, per-round filenames, and ordered interventions only', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const screens = await prepareSitting(baseUrl, {
      studyId: 'pilot-01',
      participantId: 'P-001',
      notes: 'camera-only dry run',
    });
    await startSitting(baseUrl);
    await startRound(baseUrl);

    await postJson(baseUrl, '/api/hints', { text: 'Try the outer edge first.' });
    await postJson(baseUrl, '/api/actions', { pieceId: 'green-square' });
    await postJson(baseUrl, '/api/session/complete', { operator: 'Shrijacked' });

    const exportResponse = await fetch(`${baseUrl}/api/export/current.json`);
    assert.equal(exportResponse.status, 200);
    const payload = await exportResponse.json();

    assert.equal(payload.metadata.participantId, 'P-001');
    assert.equal(payload.rounds.length, 1);
    assert.equal(payload.rounds[0].puzzle.subjectFile, '1.pdf');
    assert.equal(payload.rounds[0].puzzle.solutionFile, '1s.pdf');
    assert.deepEqual(payload.rounds[0].interventions.map((entry) => entry.type), ['hint', 'robot']);
    assert.ok(Number.isFinite(payload.totalDurationSeconds));
    assert.equal('adaptive' in payload, false);
    assert.equal('events' in payload, false);
    assert.equal('state' in payload, false);

    const csv = await fetch(`${baseUrl}/api/export/current.csv`).then((response) => response.text());
    assert.match(csv, /hint\.updated/);
    assert.match(csv, /robot\.action\.logged/);
    const formsResponse = await fetch(`${baseUrl}/api/export/current.forms.json`);
    assert.equal(formsResponse.status, 200);
    assert.match(formsResponse.headers.get('content-disposition') || '', /-forms\.json/);
    const forms = await formsResponse.json();
    assert.equal(forms.participantId, 'P-001');
    assert.equal(forms.roundForms[0].formStatus, 'missing');
    screens.subject.socket.close();
    screens.robot.socket.close();
  } finally {
    await app.close();
  }
});

test('admin controls and exports are gated by the PIN when ADMIN_PIN is set', async () => {
  const { app, baseUrl } = await startApp({ adminPin: '2468' });

  try {
    // Without a token, mutating admin routes and admin reads are locked (423).
    const lockedConfigure = await postJson(baseUrl, '/api/session/configure', { participantId: 'P-1' });
    assert.equal(lockedConfigure.status, 423);

    const lockedExport = await fetch(`${baseUrl}/api/export/current.json`);
    assert.equal(lockedExport.status, 423);

    const lockedAdminState = await fetch(`${baseUrl}/api/state?role=admin`);
    assert.equal(lockedAdminState.status, 423);

    // A wrong PIN is rejected.
    const badUnlock = await postJson(baseUrl, '/api/guard/unlock', { pin: '0000' });
    assert.equal(badUnlock.status, 401);

    // The subject screen still reads its own state without a token.
    const subjectState = await fetch(`${baseUrl}/api/state?role=subject`);
    assert.equal(subjectState.status, 200);

    // A correct PIN yields a token that unlocks admin routes.
    const unlock = await postJson(baseUrl, '/api/guard/unlock', { pin: '2468' });
    assert.equal(unlock.status, 200);
    const { token } = await unlock.json();
    assert.ok(token);

    const authedConfigure = await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ participantId: 'P-1' }),
    });
    assert.equal(authedConfigure.status, 200);
  } finally {
    await app.close();
  }
});

test('csv export rejects a path-traversal session identifier', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const response = await fetch(`${baseUrl}/api/exports/..secret.csv`);
    assert.equal(response.status, 400);
  } finally {
    await app.close();
  }
});

test('oversized request bodies are rejected with 413', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const huge = 'x'.repeat(17 * 1024 * 1024);
    let status = null;
    try {
      const response = await fetch(`${baseUrl}/api/session/configure`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes: huge }),
      });
      status = response.status;
    } catch (error) {
      // Closing the connection to abort the oversized upload can surface as a
      // client-side network error, which is also a valid rejection.
      status = 'connection-closed';
    }
    assert.ok(status === 413 || status === 'connection-closed', `expected rejection, got ${status}`);
  } finally {
    await app.close();
  }
});

test('display screens can report sound-armed readiness only while that display is connected', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const spoofed = await postJson(baseUrl, '/api/screens/ready', { role: 'subject', ready: true });
    assert.equal(spoofed.status, 409);

    const { socket } = await readSubjectSocket(baseUrl.replace('http://', 'ws://'));
    const ready = await postJson(baseUrl, '/api/screens/ready', { role: 'subject', ready: true });
    assert.equal(ready.status, 200);

    const state = await fetch(`${baseUrl}/api/state`).then((response) => response.json());
    assert.equal(state.system.screens.subject.ready, true);
    assert.equal(state.system.screens.subject.connected, true);
    assert.equal(state.system.screens.robot.ready, false);

    const invalid = await postJson(baseUrl, '/api/screens/ready', { role: 'admin', ready: true });
    assert.equal(invalid.status, 400);

    socket.close();
    await new Promise((resolve) => socket.addEventListener('close', resolve, { once: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    const afterDisconnect = await fetch(`${baseUrl}/api/state`).then((response) => response.json());
    assert.equal(afterDisconnect.system.screens.subject.connected, false);
    assert.equal(afterDisconnect.system.screens.subject.ready, false);
  } finally {
    await app.close();
  }
});

test('camera live status cannot be spoofed without the admin PIN unlock', async () => {
  const { app, baseUrl } = await startApp({ adminPin: '2468' });

  try {
    const spoofed = await postJson(baseUrl, '/api/camera/status', {
      live: true,
      deviceLabel: 'HD Pro Webcam C270',
    });
    assert.equal(spoofed.status, 423);

    const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
    const cameraItem = health.preflight.items.find((item) => item.id === 'camera');
    assert.ok(cameraItem);
    assert.notEqual(cameraItem.status, 'ready');

    const unlock = await postJson(baseUrl, '/api/guard/unlock', { pin: '2468' });
    assert.equal(unlock.status, 200);
    const { token } = await unlock.json();
    const authed = await postJson(baseUrl, '/api/camera/status', {
      live: true,
      deviceLabel: 'HD Pro Webcam C270',
    }, {
      'x-admin-token': token,
    });
    assert.equal(authed.status, 200);

    const liveHealth = await fetch(`${baseUrl}/health`).then((response) => response.json());
    const liveCamera = liveHealth.preflight.items.find((item) => item.id === 'camera');
    assert.equal(liveCamera.status, 'ready');
  } finally {
    await app.close();
  }
});

test('camera controller assets remain reachable from the single admin page build', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const adminHtml = await fetch(`${baseUrl}/admin`).then((response) => response.text());
    const adminModule = await fetch(`${baseUrl}/admin.js`).then((response) => response.text());
    const cameraModuleResponse = await fetch(`${baseUrl}/admin-camera.mjs`);
    const cameraModule = await cameraModuleResponse.text();

    assert.match(adminHtml, /id="camera-device"/);
    assert.match(adminHtml, /id="start-camera"/);
    assert.match(adminHtml, /id="stop-camera"/);
    assert.match(adminHtml, /class="library-split"/);
    assert.match(adminHtml, /run-column-sensors/);
    assert.match(adminHtml, /run-panel-camera/);
    assert.match(adminHtml, /run-panel-hints/);
    assert.match(adminHtml, /id="hint-save-preset"/);
    assert.match(adminHtml, /class="run-ops"/);
    assert.match(adminHtml, /One-click programs/);
    assert.doesNotMatch(adminHtml, /id="slot-grid"|id="send-robot-cue"|id="operator-sound"/);
    const styles = await fetch(`${baseUrl}/styles.css`).then((response) => response.text());
    assert.match(styles, /body\[data-session-phase="setup"\] \.run-column-sensors \{\s*display: contents;/);
    assert.doesNotMatch(
      styles,
      /body\[data-session-phase="setup"\] \.run-column-trial \{\s*display:\s*none/,
      'setup must show solution, hint, and robot panels so the operator board is visible before Begin sitting',
    );
    assert.match(
      styles,
      /body\[data-session-phase="setup"\] \.run-deck \{[\s\S]*?grid-template-areas:\s*"cam cam sol"\s*"hrv hint robot"/,
      'setup must use the camera|solution / HRV|hint|robot board, not a camera-only pair',
    );
    assert.match(styles, /grid-template-areas:\s*"ops ops ops"\s*"cam cam sol"\s*"hrv hint robot"/);
    assert.match(
      styles,
      /body:is\(\[data-session-phase="setup"\], \[data-session-phase="running"\]\) \.run-panel-robot \.action-button \{[\s\S]*?min-height:\s*28px/,
      'robot cue buttons stay compact on the live board so the camera cell keeps its size',
    );
    assert.match(
      styles,
      /body\[data-session-phase="setup"\] \.run-deck \{[\s\S]*?grid-template-rows:\s*minmax\([^)]+\)\s+auto/,
      'setup bottom row must size to HRV, hint, and robot content instead of clipping them',
    );
    assert.match(adminModule, /bindCameraControls/);
    assert.match(adminModule, /shouldShowCameraControls/);
    assert.match(adminModule, /container\.dataset\.previewKey === previewKey/);
    assert.doesNotMatch(adminModule, /createAudioCueController|operatorSound/);
    assert.match(cameraModuleResponse.headers.get('content-type') || '', /text\/javascript/);
    assert.match(cameraModule, /Requesting camera access/i);
  } finally {
    await app.close();
  }
});

test('starting a sitting permits hardware and display warnings and records the override', async () => {
  const { app, baseUrl } = await startApp();

  try {
    await postJson(baseUrl, '/api/session/configure', {
      participantId: 'P-001',
      researcher: 'Shrijacked',
      sittingNumber: 1,
    });
    await uploadSittingPairs(baseUrl, 1);
    const preflight = await fetch(`${baseUrl}/api/preflight`).then((response) => response.json());
    assert.equal(preflight.requiredReady, true);
    assert.ok(preflight.warningCount >= 3);
    assert.ok(preflight.warnings.some((warning) => warning.id === 'camera'));
    assert.ok(preflight.warnings.some((warning) => warning.id === 'subject-display'));
    assert.ok(preflight.warnings.some((warning) => warning.id === 'robot-display'));

    const started = await postJson(baseUrl, '/api/session/start', { operator: 'Shrijacked' });
    assert.equal(started.status, 200);
    const events = await fetch(`${baseUrl}/api/events?limit=10`).then((response) => response.json());
    assert.ok(events.events.some((event) => event.type === 'preflight.warnings.accepted'));
  } finally {
    await app.close();
  }
});

test('hint presets can be updated and persist into the next admin state snapshot', async () => {
  const configPath = path.join(os.tmpdir(), `woz-presets-${Date.now()}.json`);
  await fs.writeFile(configPath, JSON.stringify({
    plannedRounds: 3,
    slotCount: 7,
    hintPresets: ['Try rotating that piece.'],
  }));
  const { app, baseUrl } = await startApp({
    studyConfigPath: configPath,
  });

  try {
    const saved = await postJson(baseUrl, '/api/hint-presets', {
      presets: ['Try rotating that piece.', 'Look at the outline.'],
    });
    assert.equal(saved.status, 200);
    const body = await saved.json();
    assert.deepEqual(body.hintPresets, ['Try rotating that piece.', 'Look at the outline.']);

    const state = await fetch(`${baseUrl}/api/state`).then((response) => response.json());
    assert.deepEqual(state.system.study.hintPresets, ['Try rotating that piece.', 'Look at the outline.']);

    const disk = JSON.parse(await fs.readFile(configPath, 'utf8'));
    assert.deepEqual(disk.hintPresets, ['Try rotating that piece.', 'Look at the outline.']);
  } finally {
    await app.close();
    await fs.unlink(configPath).catch(() => {});
  }
});

test('admin can replace the displayed script and add a participant-playable recording', async () => {
  const { app, baseUrl } = await startApp();
  try {
    const scriptText = 'Use all seven pieces.\nReturn unused pieces to their designated spots.';
    const audioBytes = Buffer.from('test-audio-recording');
    const saved = await postJson(baseUrl, '/api/study-script', {
      textFile: {
        name: 'updated-script.txt',
        mimeType: 'text/plain',
        contentBase64: Buffer.from(scriptText).toString('base64'),
      },
      audioFile: {
        name: 'updated-script.mp3',
        mimeType: 'audio/mpeg',
        contentBase64: audioBytes.toString('base64'),
      },
      actor: 'Researcher',
    });
    assert.equal(saved.status, 200, await saved.text());

    const subjectState = await fetch(`${baseUrl}/api/state?role=subject`).then((response) => response.json());
    assert.deepEqual(subjectState.study.instructions, [
      'Use all seven pieces.',
      'Return unused pieces to their designated spots.',
    ]);
    assert.equal(subjectState.study.scriptAudioName, 'updated-script.mp3');
    const audio = await fetch(`${baseUrl}${subjectState.study.scriptAudioUrl}`);
    assert.equal(audio.status, 200);
    assert.deepEqual(Buffer.from(await audio.arrayBuffer()), audioBytes);
  } finally {
    await app.close();
  }
});
