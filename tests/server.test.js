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

async function prepareReadySetup(baseUrl, session = {}) {
  const wsBase = baseUrl.replace('http://', 'ws://');
  const subjectSocket = new WebSocket(`${wsBase}/ws?role=subject`);
  await new Promise((resolve) => subjectSocket.addEventListener('open', resolve, { once: true }));

  await fetch(`${baseUrl}/api/session/configure`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      studyId: session.studyId || 'pilot-test',
      participantId: session.participantId || 'P-ready',
      condition: session.condition || 'adaptive',
      researcher: session.researcher || 'Shrijacked',
    }),
  });

  await fetch(`${baseUrl}/api/telemetry/hrv`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      source: 'watch-bridge',
      metrics: {
        hr: 74,
        sdnn: 41,
        rmssd: 29,
        pnn50: 18,
      },
      stressScore: 0.22,
      stressLevel: 'Not Stressed',
    }),
  });

  await fetch(`${baseUrl}/api/telemetry/gaze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      source: 'gaze-bridge',
      attentionScore: 0.63,
      fixationLoss: 0.21,
      pupilDilation: 0.41,
    }),
  });

  await fetch(`${baseUrl}/api/preflight/acknowledgements`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      acknowledgements: {
        cameraFramingChecked: true,
        subjectDisplayChecked: true,
        robotBoardReady: true,
        materialsReset: true,
      },
      actor: session.researcher || 'Shrijacked',
    }),
  });

  return {
    subjectSocket,
    close() {
      subjectSocket.close();
    },
  };
}

test('HTTP API updates state and exposes recent events', async () => {
  const { app, baseUrl } = await startTestApp();
  let readySetup = null;

  try {
    readySetup = await prepareReadySetup(baseUrl, {
      studyId: 'pilot-03',
      participantId: 'P-013',
    });

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
    assert.equal(payload.events.length, 5);
    assert.equal(payload.events[0].type, 'robot.action.logged');
  } finally {
    readySetup?.close();
    await app.close();
  }
});

test('server serves the actual multi-page admin routes, display routes, and stylesheet assets', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-public-'));
  const app = await createApp({ dataDir, port: 0 });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const adminHtml = await fetch(`${baseUrl}/admin`).then((response) => response.text());
    const setupHtml = await fetch(`${baseUrl}/admin/setup`).then((response) => response.text());
    const liveHtml = await fetch(`${baseUrl}/admin/live`).then((response) => response.text());
    const monitoringHtml = await fetch(`${baseUrl}/admin/monitoring`).then((response) => response.text());
    const reviewHtml = await fetch(`${baseUrl}/admin/review`).then((response) => response.text());
    const subjectHtml = await fetch(`${baseUrl}/subject`).then((response) => response.text());
    const auditHtml = await fetch(`${baseUrl}/audit`).then((response) => response.text());
    const exportsHtml = await fetch(`${baseUrl}/exports`).then((response) => response.text());
    const css = await fetch(`${baseUrl}/styles.css`).then((response) => response.text());

    assert.match(adminHtml, /Research Control Deck/);
    assert.match(adminHtml, /Workspace overview/);
    assert.match(adminHtml, /\/admin\/setup/);
    assert.match(setupHtml, /Run Setup/);
    assert.match(setupHtml, /Before Participant Gate/);
    assert.match(liveHtml, /Live Controls/);
    assert.match(liveHtml, /Digital Hint Terminal/);
    assert.match(liveHtml, /Puzzle timer/);
    assert.match(monitoringHtml, /Monitoring/);
    assert.match(monitoringHtml, /Sensor Health And Stream Status/);
    assert.match(reviewHtml, /Review And Routing/);
    assert.match(reviewHtml, /Puzzle duration/);
    assert.match(reviewHtml, /Global Event Logger/);
    assert.match(subjectHtml, /Hint Terminal/);
    assert.match(auditHtml, /Robotic Action Monitor/);
    assert.match(exportsHtml, /Session Exports/);
    assert.match(exportsHtml, /Export Center/);
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
        studyId: 'pilot-ws',
        participantId: 'P-020',
        researcher: 'Shrijacked',
      }),
    });

    await fetch(`${baseUrl}/api/telemetry/hrv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'watch-bridge',
        metrics: {
          hr: 74,
          sdnn: 41,
          rmssd: 29,
          pnn50: 18,
        },
        stressScore: 0.22,
        stressLevel: 'Not Stressed',
      }),
    });

    await fetch(`${baseUrl}/api/telemetry/gaze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'gaze-bridge',
        attentionScore: 0.63,
        fixationLoss: 0.21,
        pupilDilation: 0.41,
      }),
    });

    await fetch(`${baseUrl}/api/preflight/acknowledgements`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        acknowledgements: {
          cameraFramingChecked: true,
          subjectDisplayChecked: true,
          robotBoardReady: true,
          materialsReset: true,
        },
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

test('health endpoint reports degraded sensor summaries when streams are stale or missing', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-health-'));
  const watchBridge = {
    async start() {},
    stop() {},
    getStatus() {
      return {
        filePath: './watch/watch_data.json',
        active: true,
        lastCheckedAt: '2026-04-01T11:59:58.000Z',
        lastProcessedAt: '2026-04-01T11:58:00.000Z',
        lastError: null,
        lastSequenceNumber: 7,
      };
    },
  };
  const gazeBridge = {
    getStatus() {
      return {
        bridgeId: null,
        deviceLabel: null,
        transport: null,
        sdkName: null,
        lastHeartbeatAt: null,
        lastFrameAt: null,
        active: false,
        staleAfterMs: 15000,
        lastError: null,
      };
    },
    async heartbeat() {
      return this.getStatus();
    },
    async ingestFrame() {
      return {
        status: this.getStatus(),
      };
    },
  };

  const app = await createApp({
    dataDir,
    port: 0,
    watchBridge,
    gazeBridge,
    store: undefined,
  });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await fetch(`${baseUrl}/health`).then((response) => response.json());
    assert.equal(health.ok, true);
    assert.equal(health.status, 'degraded');
    assert.equal(health.sensorHealth.watch.state, 'stale');
    assert.equal(health.sensorHealth.gaze.state, 'waiting');
  } finally {
    await app.close();
  }
});

test('preflight endpoint blocks trial start until readiness blockers are cleared', async () => {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-preflight-'));
  const app = await createApp({ dataDir, port: 0 });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const initialPreflight = await fetch(`${baseUrl}/api/preflight`).then((response) => response.json());
    assert.equal(initialPreflight.phase, 'setup');
    assert.equal(initialPreflight.requiredReady, false);
    assert.ok(initialPreflight.blockers.some((item) => item.id === 'metadata'));

    const configureResponse = await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        studyId: 'pilot-09',
        participantId: 'P-030',
        condition: 'adaptive',
        researcher: 'Shrijacked',
      }),
    });
    assert.equal(configureResponse.status, 200);

    const blockedStart = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operator: 'Shrijacked',
      }),
    });
    assert.equal(blockedStart.status, 409);

    const subjectSocket = new WebSocket(`${baseUrl.replace('http://', 'ws://')}/ws?role=subject`);
    await new Promise((resolve) => subjectSocket.addEventListener('open', resolve, { once: true }));

    await fetch(`${baseUrl}/api/telemetry/hrv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'watch-bridge',
        metrics: {
          hr: 74,
          sdnn: 41,
          rmssd: 29,
          pnn50: 18,
        },
        stressScore: 0.22,
        stressLevel: 'Not Stressed',
      }),
    });

    await fetch(`${baseUrl}/api/telemetry/gaze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'gaze-bridge',
        attentionScore: 0.63,
        fixationLoss: 0.21,
        pupilDilation: 0.41,
      }),
    });

    const checklistResponse = await fetch(`${baseUrl}/api/preflight/acknowledgements`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        acknowledgements: {
          cameraFramingChecked: true,
          subjectDisplayChecked: true,
          robotBoardReady: true,
          materialsReset: true,
        },
        actor: 'Shrijacked',
      }),
    });
    assert.equal(checklistResponse.status, 200);

    const readyPreflight = await fetch(`${baseUrl}/api/preflight`).then((response) => response.json());
    assert.equal(readyPreflight.requiredReady, true);
    assert.equal(readyPreflight.blockingCount, 0);

    const startResponse = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        operator: 'Shrijacked',
      }),
    });
    assert.equal(startResponse.status, 200);

    subjectSocket.close();
  } finally {
    await app.close();
  }
});

test('operator safeguards require unlock before mutating admin routes when a PIN is configured', async () => {
  const { app, baseUrl } = await startConfiguredApp({ adminPin: '2468' });
  let subjectSocket = null;

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
        studyId: 'pilot-pin',
        participantId: 'P-200',
        researcher: 'Shrijacked',
      }),
    });

    subjectSocket = new WebSocket(`${baseUrl.replace('http://', 'ws://')}/ws?role=subject`);
    await new Promise((resolve) => subjectSocket.addEventListener('open', resolve, { once: true }));

    await fetch(`${baseUrl}/api/telemetry/hrv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'watch-bridge',
        metrics: {
          hr: 74,
          sdnn: 41,
          rmssd: 29,
          pnn50: 18,
        },
        stressScore: 0.22,
        stressLevel: 'Not Stressed',
      }),
    });

    await fetch(`${baseUrl}/api/telemetry/gaze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'gaze-bridge',
        attentionScore: 0.63,
        fixationLoss: 0.21,
        pupilDilation: 0.41,
      }),
    });

    await fetch(`${baseUrl}/api/preflight/acknowledgements`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        acknowledgements: {
          cameraFramingChecked: true,
          subjectDisplayChecked: true,
          robotBoardReady: true,
          materialsReset: true,
        },
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
    subjectSocket?.close();
    await app.close();
  }
});

test('session protections block unsafe actions before start, after completion, and during reset', async () => {
  const { app, baseUrl } = await startConfiguredApp();
  let readySetup = null;

  try {
    await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        studyId: 'pilot-protection',
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

    readySetup = await prepareReadySetup(baseUrl, {
      studyId: 'pilot-protection',
      participantId: 'P-300',
    });

    const startResponse = await fetch(`${baseUrl}/api/session/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });
    assert.equal(startResponse.status, 200);

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
    readySetup?.close();
    await app.close();
  }
});

test('adaptive configuration endpoint updates state and is blocked after completion', async () => {
  const { app, baseUrl } = await startConfiguredApp({ adminPin: '2468' });
  let subjectSocket = null;

  try {
    const unlockPayload = await fetch(`${baseUrl}/api/guard/unlock`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin: '2468' }),
    }).then((response) => response.json());

    const configureResponse = await fetch(`${baseUrl}/api/adaptive/config`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        thresholds: {
          observe: 0.33,
          intervene: 0.61,
        },
        weights: {
          hrv: 0.72,
          gaze: 0.28,
        },
        distractionBoost: 0.16,
        freshness: {
          fullStrengthSeconds: 80,
          staleAfterSeconds: 210,
        },
      }),
    });
    assert.equal(configureResponse.status, 200);

    const state = await fetch(`${baseUrl}/api/state`).then((response) => response.json());
    assert.equal(state.adaptive.configuration.thresholds.observe, 0.33);
    assert.equal(state.adaptive.configuration.weights.hrv, 0.72);

    await fetch(`${baseUrl}/api/session/configure`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        studyId: 'pilot-adaptive',
        participantId: 'P-900',
        researcher: 'Shrijacked',
      }),
    });

    subjectSocket = new WebSocket(`${baseUrl.replace('http://', 'ws://')}/ws?role=subject`);
    await new Promise((resolve) => subjectSocket.addEventListener('open', resolve, { once: true }));

    await fetch(`${baseUrl}/api/telemetry/hrv`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'watch-bridge',
        metrics: {
          hr: 74,
          sdnn: 41,
          rmssd: 29,
          pnn50: 18,
        },
        stressScore: 0.22,
        stressLevel: 'Not Stressed',
      }),
    });

    await fetch(`${baseUrl}/api/telemetry/gaze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'gaze-bridge',
        attentionScore: 0.63,
        fixationLoss: 0.21,
        pupilDilation: 0.41,
      }),
    });

    await fetch(`${baseUrl}/api/preflight/acknowledgements`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        acknowledgements: {
          cameraFramingChecked: true,
          subjectDisplayChecked: true,
          robotBoardReady: true,
          materialsReset: true,
        },
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

    await fetch(`${baseUrl}/api/session/complete`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({ operator: 'Shrijacked' }),
    });

    const guardAfterComplete = await fetch(`${baseUrl}/api/guard`, {
      headers: {
        'x-admin-token': unlockPayload.token,
      },
    }).then((response) => response.json());
    assert.equal(guardAfterComplete.permittedActions.updateAdaptiveConfig.allowed, false);

    const afterCompleteResponse = await fetch(`${baseUrl}/api/adaptive/config`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-admin-token': unlockPayload.token,
      },
      body: JSON.stringify({
        thresholds: {
          observe: 0.4,
          intervene: 0.7,
        },
      }),
    });
    assert.equal(afterCompleteResponse.status, 409);
  } finally {
    subjectSocket?.close();
    await app.close();
  }
});
