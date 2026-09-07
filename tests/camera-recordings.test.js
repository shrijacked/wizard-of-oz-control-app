'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { recordingFileName, latestDownloadableRecording } = require('../src/camera-recordings');
const { ExperimentStore } = require('../src/store');
const { createApp } = require('../src/create-app');

async function createStore() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-rec-'));
  const store = new ExperimentStore({ dataDir, now: () => new Date('2026-09-02T16:00:00.000Z') });
  await store.initialize();
  return { store, dataDir };
}

async function startApp(options = {}) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-rec-app-'));
  const app = await createApp({ dataDir, port: 0, seedPuzzles: false, ...options });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  const address = app.server.address();
  return {
    app,
    baseUrl: `http://127.0.0.1:${address.port}`,
    dataDir,
  };
}

test('recording filenames use participant, sitting, and take with a safe fallback', () => {
  assert.equal(recordingFileName({
    participantId: 'P-001',
    sittingNumber: 2,
    take: 3,
  }), 'table-P-001-sitting2-3.webm');
  assert.equal(recordingFileName({
    participantId: '../evil name',
    sittingNumber: 1,
    take: 1,
  }), 'table-unknown-sitting1-1.webm');
});

test('latest downloadable take skips an in-progress recording', () => {
  assert.equal(latestDownloadableRecording([
    { id: 'a', status: 'saved', filename: 'one.webm' },
    { id: 'b', status: 'recording', filename: 'two.webm' },
  ])?.id, 'a');
});

test('store creates, appends, and finalizes a camera recording on disk', async () => {
  const { store, dataDir } = await createStore();

  const created = await store.createCameraRecording();
  assert.match(created.filename, /table-P01-sitting1-1\.webm/);
  assert.ok(created.recordingId);
  assert.ok(created.finalizeToken);

  await store.appendCameraRecordingChunk(created.recordingId, 0, Buffer.from('webm-one'));
  await store.appendCameraRecordingChunk(created.recordingId, 1, Buffer.from('webm-two'));
  const saved = await store.finalizeCameraRecording(created.recordingId);
  assert.equal(saved.status, 'saved');
  assert.equal(saved.bytes, 16);

  const filePath = path.join(dataDir, 'recordings', store.getCurrentSessionId(), `${created.recordingId}.webm`);
  assert.equal(await fs.readFile(filePath, 'utf8'), 'webm-onewebm-two');
});

test('store rejects a second in-flight recording and out-of-order chunks', async () => {
  const { store } = await createStore();
  const first = await store.createCameraRecording();

  await assert.rejects(() => store.createCameraRecording(), /already in progress/i);

  await store.appendCameraRecordingChunk(first.recordingId, 0, Buffer.from('a'));
  await assert.rejects(
    () => store.appendCameraRecordingChunk(first.recordingId, 2, Buffer.from('b')),
    /out of order/i,
  );
});

test('camera recording HTTP create, chunk, finalize, and download', async () => {
  const { app, baseUrl } = await startApp();

  try {
    const created = await fetch(`${baseUrl}/api/camera/recordings`, { method: 'POST' }).then((response) => {
      assert.equal(response.status, 200);
      return response.json();
    });

    const chunk = await fetch(`${baseUrl}/api/camera/recordings/${created.recordingId}/chunk`, {
      method: 'POST',
      headers: { 'content-type': 'application/octet-stream', 'x-chunk-index': '0' },
      body: Buffer.from('chunk-bytes'),
    });
    assert.equal(chunk.status, 200);

    const finalized = await fetch(`${baseUrl}/api/camera/recordings/${created.recordingId}/finalize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: created.finalizeToken }),
    });
    assert.equal(finalized.status, 200);

    const download = await fetch(`${baseUrl}/api/camera/recordings/${created.recordingId}`);
    assert.equal(download.status, 200);
    assert.equal(await download.text(), 'chunk-bytes');

    const exportJson = await fetch(`${baseUrl}/api/export/current.json`).then((response) => response.json());
    assert.equal(exportJson.recordings.length, 1);
    assert.equal(exportJson.recordings[0].id, created.recordingId);

    const secondFinalize = await fetch(`${baseUrl}/api/camera/recordings/${created.recordingId}/finalize`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: created.finalizeToken }),
    });
    assert.equal(secondFinalize.status, 200);
  } finally {
    await app.close();
  }
});

test('finishing a sitting keeps the camera take downloadable and copies it next to the session export', async () => {
  const { store, dataDir } = await createStore();
  const created = await store.createCameraRecording();
  await store.appendCameraRecordingChunk(created.recordingId, 0, Buffer.from('sitting-webm'));

  await store.completeSession({ operator: 'researcher' });

  const sessionId = store.getCurrentSessionId();
  const record = store.getCameraRecording(created.recordingId);
  assert.equal(record.status, 'saved');
  assert.equal(
    await fs.readFile(path.join(dataDir, 'recordings', sessionId, `${created.recordingId}.webm`), 'utf8'),
    'sitting-webm',
  );
  assert.equal(
    await fs.readFile(path.join(dataDir, 'export', sessionId, created.filename), 'utf8'),
    'sitting-webm',
  );
});

test('reset finalizes an open camera recording onto disk before the next session', async () => {
  const { store, dataDir } = await createStore();
  const created = await store.createCameraRecording();
  await store.appendCameraRecordingChunk(created.recordingId, 0, Buffer.from('keep-me'));
  const sessionId = store.getCurrentSessionId();

  await store.resetSession();

  assert.equal(store.getState().session.recordings.length, 0);
  assert.equal(
    await fs.readFile(path.join(dataDir, 'recordings', sessionId, `${created.recordingId}.webm`), 'utf8'),
    'keep-me',
  );
});

test('camera recording writes are blocked when the admin PIN is required', async () => {
  const { app, baseUrl } = await startApp({ adminPin: '2468' });

  try {
    const created = await fetch(`${baseUrl}/api/camera/recordings`, { method: 'POST' });
    assert.equal(created.status, 423);
  } finally {
    await app.close();
  }
});
