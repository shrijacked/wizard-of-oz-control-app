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
  const app = await createApp({ dataDir, port: 0, ...options });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();

  return {
    app,
    baseUrl: `http://127.0.0.1:${address.port}`,
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

async function selectPuzzlePair(baseUrl, setId = '1') {
  const response = await fetch(`${baseUrl}/api/puzzles/select`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      setId,
      actor: 'Shrijacked',
    }),
  });
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
    assert.match(subjectHtml, /Participant Display/i);
    assert.match(subjectHtml, /Hint Terminal/i);
    assert.match(robotHtml, /Robot Operator Screen/i);
    assert.match(robotHtml, /Latest robot cue/i);
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

    await selectPuzzlePair(baseUrl, '1');

    const state = await fetch(`${baseUrl}/api/state`).then((res) => res.json());
    assert.equal(state.session.puzzleSet.setId, '1');
    assert.equal(state.session.puzzleSet.subjectAsset.originalName, '1.pdf');
    assert.equal(state.session.puzzleSet.solutionAsset.originalName, '1s.pdf');
  } finally {
    await app.close();
  }
});

test('subject and robot sockets receive role-specific snapshots for the selected puzzle pair and live interventions', async () => {
  const { app, baseUrl } = await startApp();
  const wsBase = baseUrl.replace('http://', 'ws://');

  try {
    await uploadPuzzlePair(baseUrl, '3');
    await selectPuzzlePair(baseUrl, '3');

    const { socket: subjectSocket, messages: subjectMessages } = await readSubjectSocket(wsBase);
    const { socket: robotSocket, messages: robotMessages } = await readRobotSocket(wsBase);

    await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operator: 'Shrijacked',
      }),
    });

    await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Try the blue piece next.' }),
    });

    await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actionId: 'function-3',
        label: 'Function 3: Blue Triangle',
      }),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const subjectState = subjectMessages.at(-1).data;
    const robotState = robotMessages.at(-1).data;

    assert.equal(subjectState.hint.text, 'Try the blue piece next.');
    assert.equal(subjectState.puzzleSet.subjectAsset.originalName, '3.pdf');
    assert.equal('robotAction' in subjectState, false);

    assert.equal(robotState.robotAction.actionId, 'function-3');
    assert.equal(robotState.puzzleSet.solutionAsset.originalName, '3s.pdf');
    assert.equal('hint' in robotState, false);

    subjectSocket.close();
    robotSocket.close();
  } finally {
    await app.close();
  }
});

test('session flow starts without preflight, allows interventions during run, and blocks them after completion', async () => {
  const { app, baseUrl } = await startApp();

  try {
    await uploadPuzzlePair(baseUrl, '4');
    await selectPuzzlePair(baseUrl, '4');

    const beforeStartHint = await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Blocked before start.' }),
    });
    assert.equal(beforeStartHint.status, 409);

    const startResponse = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });
    assert.equal(startResponse.status, 200);

    const hintResponse = await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Allowed after start.' }),
    });
    assert.equal(hintResponse.status, 200);

    const actionResponse = await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actionId: 'function-1',
        label: 'Function 1: Move Square',
      }),
    });
    assert.equal(actionResponse.status, 200);

    const completeResponse = await fetch(`${baseUrl}/api/session/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operator: 'Shrijacked',
      }),
    });
    assert.equal(completeResponse.status, 200);

    const afterCompleteAction = await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actionId: 'function-2',
        label: 'Function 2: Rotate Triangle',
      }),
    });
    assert.equal(afterCompleteAction.status, 409);
  } finally {
    await app.close();
  }
});

test('concise export endpoint returns timestamps, selected filenames, and ordered interventions only', async () => {
  const { app, baseUrl } = await startApp();

  try {
    await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        studyId: 'pilot-01',
        participantId: 'P-001',
        researcher: 'Shrijacked',
        notes: 'camera-only dry run',
      }),
    });

    await uploadPuzzlePair(baseUrl, '5');
    await selectPuzzlePair(baseUrl, '5');

    await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });

    await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Try the outer edge first.' }),
    });

    await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actionId: 'function-2',
        label: 'Function 2: Rotate Triangle',
      }),
    });

    await fetch(`${baseUrl}/api/session/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });

    const exportResponse = await fetch(`${baseUrl}/api/export/current.json`);
    assert.equal(exportResponse.status, 200);
    const payload = await exportResponse.json();

    assert.equal(payload.metadata.participantId, 'P-001');
    assert.equal(payload.puzzle.subjectFile, '5.pdf');
    assert.equal(payload.puzzle.solutionFile, '5s.pdf');
    assert.deepEqual(payload.interventions.map((entry) => entry.type), ['hint', 'robot']);
    assert.ok(Number.isFinite(payload.durationSeconds));
    assert.equal('adaptive' in payload, false);
    assert.equal('events' in payload, false);
    assert.equal('state' in payload, false);

    const csv = await fetch(`${baseUrl}/api/export/current.csv`).then((response) => response.text());
    assert.match(csv, /hint\.updated/);
    assert.match(csv, /robot\.action\.logged/);
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

    assert.match(adminHtml, /id="start-camera"/);
    assert.match(adminHtml, /id="stop-camera"/);
    assert.match(adminModule, /bindCameraControls/);
    assert.match(cameraModuleResponse.headers.get('content-type') || '', /text\/javascript/);
    assert.match(cameraModule, /Requesting camera access/i);
  } finally {
    await app.close();
  }
});
