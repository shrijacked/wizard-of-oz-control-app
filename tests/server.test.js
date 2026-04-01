'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createApp } = require('../src/create-app');

async function startTestApp() {
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-app-'));
  const publicDir = path.join(rootDir, 'public');
  const dataDir = path.join(rootDir, 'data');

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, 'admin.html'), '<!doctype html><title>admin</title>', 'utf8');
  await fs.writeFile(path.join(publicDir, 'subject.html'), '<!doctype html><title>subject</title>', 'utf8');
  await fs.writeFile(path.join(publicDir, 'audit.html'), '<!doctype html><title>audit</title>', 'utf8');

  const app = await createApp({ publicDir, dataDir, port: 0 });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();

  return {
    app,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function startConfiguredApp(options = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-configured-'));
  const app = await createApp({ dataDir, port: 0, ...options });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();

  return {
    app,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

test('HTTP API updates state and exposes recent events', async () => {
  const { app, baseUrl } = await startTestApp();

  try {
    const configureResponse = await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        studyId: 'pilot-03',
        participantId: 'P-013',
        condition: 'adaptive',
        researcher: 'Shrijacked',
      }),
    });
    assert.equal(configureResponse.status, 200);

    const startResponse = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operator: 'Shrijacked',
      }),
    });
    assert.equal(startResponse.status, 200);

    const hintResponse = await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Look at the corner alignment.' }),
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

    const stateResponse = await fetch(`${baseUrl}/api/state`);
    const state = await stateResponse.json();
    assert.equal(state.hint.text, 'Look at the corner alignment.');
    assert.equal(state.robotAction.actionId, 'function-1');
    assert.equal(state.session.status, 'running');
    assert.equal(state.session.metadata.participantId, 'P-013');

    const eventsResponse = await fetch(`${baseUrl}/api/events?limit=5`);
    const payload = await eventsResponse.json();
    assert.equal(payload.events.length, 4);
    assert.equal(payload.events[0].type, 'robot.action.logged');
  } finally {
    await app.close();
  }
});

test('server serves the actual admin, subject, audit, and stylesheet assets', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-public-'));
  const app = await createApp({ dataDir, port: 0 });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const adminHtml = await fetch(`${baseUrl}/admin`).then((response) => response.text());
    const subjectHtml = await fetch(`${baseUrl}/subject`).then((response) => response.text());
    const auditHtml = await fetch(`${baseUrl}/audit`).then((response) => response.text());
    const exportsHtml = await fetch(`${baseUrl}/exports`).then((response) => response.text());
    const css = await fetch(`${baseUrl}/styles.css`).then((response) => response.text());

    assert.match(adminHtml, /Research Control Deck/);
    assert.match(adminHtml, /Operator Controls/);
    assert.match(subjectHtml, /Hint Terminal/);
    assert.match(auditHtml, /Robotic Action Monitor/);
    assert.match(exportsHtml, /Session Exports/);
    assert.match(exportsHtml, /Replay Timeline/);
    assert.match(css, /--teal/);
  } finally {
    await app.close();
  }
});

test('WebSocket clients receive role-specific snapshots after updates', async () => {
  const { app, baseUrl } = await startTestApp();
  const wsBase = baseUrl.replace('http://', 'ws://');

  try {
    const subjectSocket = new WebSocket(`${wsBase}/ws?role=subject`);
    const auditSocket = new WebSocket(`${wsBase}/ws?role=audit`);

    const subjectMessages = [];
    const auditMessages = [];

    subjectSocket.addEventListener('message', (event) => {
      subjectMessages.push(JSON.parse(event.data));
    });
    auditSocket.addEventListener('message', (event) => {
      auditMessages.push(JSON.parse(event.data));
    });

    await Promise.all([
      new Promise((resolve) => subjectSocket.addEventListener('open', resolve, { once: true })),
      new Promise((resolve) => auditSocket.addEventListener('open', resolve, { once: true })),
    ]);

    await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        participantId: 'P-020',
        researcher: 'Shrijacked',
      }),
    });

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

    assert.equal(subjectMessages.at(-1).data.hint.text, 'Try the blue piece next.');
    assert.equal(auditMessages.at(-1).data.robotAction.actionId, 'function-3');

    subjectSocket.close();
    auditSocket.close();
  } finally {
    await app.close();
  }
});

test('gaze bridge endpoints update system state and export endpoints return downloadable session artifacts', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-bridge-'));
  const app = await createApp({ dataDir, port: 0 });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const heartbeatResponse = await fetch(`${baseUrl}/api/bridge/gaze/heartbeat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bridgeId: 'tobii-bridge',
        deviceLabel: 'Tobii 4C',
        transport: 'sdk-http',
      }),
    });
    assert.equal(heartbeatResponse.status, 200);

    const frameResponse = await fetch(`${baseUrl}/api/bridge/gaze/frame`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        bridgeId: 'tobii-bridge',
        frame: {
          focus: 0.22,
          fixationLoss: 0.71,
          pupil: 0.58,
        },
      }),
    });
    assert.equal(frameResponse.status, 200);

    const state = await fetch(`${baseUrl}/api/state`).then((response) => response.json());
    assert.equal(state.telemetry.gaze.source, 'gaze-bridge');
    assert.equal(state.system.gazeBridge.bridgeId, 'tobii-bridge');
    assert.equal(state.system.gazeBridge.deviceLabel, 'Tobii 4C');

    const exportsView = await fetch(`${baseUrl}/exports`).then((response) => response.text());
    assert.match(exportsView, /Session Exports/);

    const manifest = await fetch(`${baseUrl}/api/exports`).then((response) => response.json());
    assert.ok(manifest.sessions.length >= 1);

    const bundle = await fetch(`${baseUrl}/api/exports/current.bundle.json`).then((response) => response.json());
    assert.equal(bundle.state.session.id, state.session.id);
    assert.ok(bundle.events.some((event) => event.type === 'telemetry.gaze.updated'));
    assert.ok(bundle.analytics);
    assert.ok(bundle.replay);
    assert.ok(bundle.replay.events.length >= 1);

    const csv = await fetch(`${baseUrl}/api/exports/current.csv`).then((response) => response.text());
    assert.match(csv, /telemetry\.gaze\.updated/);
  } finally {
    await app.close();
  }
});

test('operator safeguards require unlock before mutating admin routes when a PIN is configured', async () => {
  const { app, baseUrl } = await startConfiguredApp({ adminPin: '2468' });

  try {
    const guardStatus = await fetch(`${baseUrl}/api/guard`).then((response) => response.json());
    assert.equal(guardStatus.pinRequired, true);
    assert.equal(guardStatus.authenticated, false);

    const lockedHintResponse = await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'This should be blocked.' }),
    });
    assert.equal(lockedHintResponse.status, 423);

    const badUnlock = await fetch(`${baseUrl}/api/guard/unlock`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin: '0000' }),
    });
    assert.equal(badUnlock.status, 401);

    const unlockPayload = await fetch(`${baseUrl}/api/guard/unlock`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin: '2468' }),
    }).then((response) => response.json());
    assert.ok(unlockPayload.token);

    await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        participantId: 'P-200',
        researcher: 'Shrijacked',
      }),
    });

    await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });

    const unlockedHintResponse = await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({ text: 'Allowed after unlock.' }),
    });
    assert.equal(unlockedHintResponse.status, 200);

    const lockResponse = await fetch(`${baseUrl}/api/guard/lock`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
    });
    assert.equal(lockResponse.status, 200);

    const actionAfterLock = await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        actionId: 'function-1',
        label: 'Function 1: Move Square',
      }),
    });
    assert.equal(actionAfterLock.status, 423);
  } finally {
    await app.close();
  }
});

test('session protections block unsafe actions before start, after completion, and during reset', async () => {
  const { app, baseUrl } = await startConfiguredApp();

  try {
    await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        participantId: 'P-300',
        researcher: 'Shrijacked',
      }),
    });

    const beforeStartHint = await fetch(`${baseUrl}/api/hints`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Blocked before start.' }),
    });
    assert.equal(beforeStartHint.status, 409);

    await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });

    const guardDuringRun = await fetch(`${baseUrl}/api/guard`).then((response) => response.json());
    assert.equal(guardDuringRun.permittedActions.resetSession.allowed, false);
    assert.equal(guardDuringRun.permittedActions.forceResetSession.allowed, true);

    const resetDuringRun = await fetch(`${baseUrl}/api/session/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestedBy: 'Shrijacked' }),
    });
    assert.equal(resetDuringRun.status, 409);

    await fetch(`${baseUrl}/api/session/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operator: 'Shrijacked',
        summary: 'Finished safely.',
      }),
    });

    const afterCompleteAction = await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        actionId: 'function-2',
        label: 'Function 2: Rotate Triangle',
      }),
    });
    assert.equal(afterCompleteAction.status, 409);

    const forcedReset = await fetch(`${baseUrl}/api/session/reset`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        requestedBy: 'Shrijacked',
        force: true,
      }),
    });
    assert.equal(forcedReset.status, 200);
  } finally {
    await app.close();
  }
});
