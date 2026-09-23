'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadRecorderModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-camera-recorder.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

function createFakeMediaRecorder() {
  class FakeMediaRecorder {
    constructor(stream, options) {
      this.stream = stream;
      this.options = options;
      this.state = 'inactive';
      this.listeners = new Map();
    }

    addEventListener(name, handler) {
      const list = this.listeners.get(name) || [];
      list.push(handler);
      this.listeners.set(name, list);
    }

    start(timeslice) {
      this.timeslice = timeslice;
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      for (const handler of this.listeners.get('dataavailable') || []) {
        handler({ data: { size: 6 } });
      }
      for (const handler of this.listeners.get('stop') || []) {
        handler();
      }
    }

    requestData() {
      for (const handler of this.listeners.get('dataavailable') || []) {
        handler({ data: { size: 3 } });
      }
    }
  }

  FakeMediaRecorder.isTypeSupported = (type) => type === 'video/webm';
  return FakeMediaRecorder;
}

test('webm recorder support requires Chrome-style video/webm', async () => {
  const { canUseWebmRecorder } = await loadRecorderModule();
  assert.equal(canUseWebmRecorder({ isTypeSupported: (type) => type === 'video/webm' }), true);
  assert.equal(canUseWebmRecorder({ isTypeSupported: () => false }), false);
  assert.equal(canUseWebmRecorder(undefined), false);
});

test('camera recorder uploads chunks then finalizes the take', async () => {
  const { createCameraRecorder } = await loadRecorderModule();
  const uploaded = [];
  const finalized = [];
  const statuses = [];
  const FakeMediaRecorder = createFakeMediaRecorder();

  const recorder = createCameraRecorder({
    MediaRecorder: FakeMediaRecorder,
    async createRecording() {
      return { recordingId: 'rec-1', filename: 'table-unknown-sitting1-1.webm', finalizeToken: 'tok-1' };
    },
    async uploadChunk(recordingId, index, blob) {
      uploaded.push({ recordingId, index, size: blob.size });
    },
    async finalizeRecording(recordingId, options) {
      finalized.push({ recordingId, ...options });
    },
    onStatus(message) {
      statuses.push(message);
    },
  });

  await recorder.start({ id: 'stream' });
  assert.equal(recorder.getActive().active, true);
  recorder.flush();
  await recorder.stop();

  assert.deepEqual(uploaded.map((entry) => entry.index), [0, 1]);
  assert.equal(finalized[0].recordingId, 'rec-1');
  assert.equal(finalized[0].token, 'tok-1');
  assert.equal(recorder.getActive().active, false);
  assert.match(statuses.at(-1), /saved/i);
});

test('a failed chunk upload finalizes a partial take without deadlocking stop', async () => {
  const { createCameraRecorder } = await loadRecorderModule();
  const finalized = [];
  const FakeMediaRecorder = createFakeMediaRecorder();
  const recorder = createCameraRecorder({
    MediaRecorder: FakeMediaRecorder,
    async createRecording() {
      return { recordingId: 'rec-failed', filename: 'partial.webm', finalizeToken: 'tok-failed' };
    },
    async uploadChunk() {
      throw new Error('Network upload failed.');
    },
    async finalizeRecording(recordingId, options) {
      finalized.push({ recordingId, ...options });
    },
  });

  await recorder.start({ id: 'stream' });
  recorder.flush();
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(recorder.getActive().active, false);
  assert.equal(finalized.length, 1);
  assert.equal(finalized[0].recordingId, 'rec-failed');
  assert.equal(finalized[0].partial, true);
});
