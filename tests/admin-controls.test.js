'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAdminControlsModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-controls.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

function createFakeElement() {
  const handlers = new Map();

  return {
    addEventListener(eventName, handler) {
      handlers.set(eventName, handler);
    },
    dispatch(eventName) {
      const handler = handlers.get(eventName);
      if (handler) {
        handler({ type: eventName });
      }
    },
  };
}

test('bindCameraControls wires camera buttons without waiting on dashboard bootstrap', async () => {
  const { bindCameraControls } = await loadAdminControlsModule();
  const startButton = createFakeElement();
  const stopButton = createFakeElement();
  let started = 0;
  let stopped = 0;

  bindCameraControls({
    startButton,
    stopButton,
    onStart: () => {
      started += 1;
    },
    onStop: () => {
      stopped += 1;
    },
  });

  startButton.dispatch('click');
  stopButton.dispatch('click');

  assert.equal(started, 1);
  assert.equal(stopped, 1);
});

test('bindCameraControls tolerates missing buttons', async () => {
  const { bindCameraControls } = await loadAdminControlsModule();

  assert.doesNotThrow(() => {
    bindCameraControls({
      startButton: null,
      stopButton: null,
      onStart: () => {},
      onStop: () => {},
    });
  });
});

test('camera controls stay available after the sitting completes so the operator can stop the preview', async () => {
  const { shouldShowCameraControls } = await loadAdminControlsModule();

  assert.equal(shouldShowCameraControls('setup'), true);
  assert.equal(shouldShowCameraControls('running'), true);
  assert.equal(shouldShowCameraControls('completed'), true);
});

test('latest downloadable recording skips an in-progress take', async () => {
  const { latestDownloadableRecording } = await loadAdminControlsModule();

  assert.equal(latestDownloadableRecording([
    { id: 'a', status: 'saved', filename: 'one.webm' },
    { id: 'b', status: 'recording', filename: 'two.webm' },
  ])?.id, 'a');
});

test('finished sittings download every saved or partial take, not the in-progress one', async () => {
  const { recordingsToDownloadAfterSitting } = await loadAdminControlsModule();

  assert.deepEqual(
    recordingsToDownloadAfterSitting([
      { id: 'a', status: 'saved', filename: 'one.webm' },
      { id: 'b', status: 'recording', filename: 'two.webm' },
      { id: 'c', status: 'partial', filename: 'three.webm' },
    ]).map((entry) => entry.id),
    ['a', 'c'],
  );
});

test('camera recording stays manual by default and can be explicitly enabled', async () => {
  const { shouldAutoStartSittingRecording } = await loadAdminControlsModule();

  assert.equal(shouldAutoStartSittingRecording({ cameraLive: true, recorderActive: false }), false);
  assert.equal(shouldAutoStartSittingRecording({ cameraLive: true, recorderActive: false, autoRecordEnabled: true }), true);
  assert.equal(shouldAutoStartSittingRecording({ cameraLive: true, recorderActive: true }), false);
  assert.equal(shouldAutoStartSittingRecording({ cameraLive: false, recorderActive: false }), false);
});
