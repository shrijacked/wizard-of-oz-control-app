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

test('HTTP API updates state and exposes recent events', async () => {
  const { app, baseUrl } = await startTestApp();

  try {
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

    const eventsResponse = await fetch(`${baseUrl}/api/events?limit=5`);
    const payload = await eventsResponse.json();
    assert.equal(payload.events.length, 2);
    assert.equal(payload.events[0].type, 'robot.action.logged');
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
