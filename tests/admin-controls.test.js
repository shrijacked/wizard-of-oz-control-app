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
