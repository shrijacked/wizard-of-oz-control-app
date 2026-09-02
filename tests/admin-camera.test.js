'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAdminCameraModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-camera.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

function createVideoElement() {
  return {
    srcObject: null,
    playCalls: 0,
    async play() {
      this.playCalls += 1;
    },
  };
}

function createStatusElement() {
  return {
    textContent: '',
  };
}

test('camera controller starts preview, attaches the stream, and plays the video element', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const stream = {
    getTracks() {
      return [];
    },
  };
  let requestedConstraints = null;

  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: {
      async getUserMedia(constraints) {
        requestedConstraints = constraints;
        return stream;
      },
    },
  });

  await controller.start();

  assert.deepEqual(requestedConstraints, {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  assert.equal(videoElement.srcObject, stream);
  assert.equal(videoElement.playCalls, 1);
  assert.equal(controller.getStream(), stream);
  assert.match(statusElement.textContent, /live webcam preview active/i);
});

test('camera controller reports a clear message when camera APIs are unavailable', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: null,
  });

  await controller.start();

  assert.match(statusElement.textContent, /camera api is not available/i);
});

test('camera controller falls back to default video constraints when no specific camera was requested', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const requested = [];
  const stream = {
    getTracks() {
      return [];
    },
  };

  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: {
      async getUserMedia(constraints) {
        requested.push(constraints);
        if (requested.length === 1) {
          const error = new Error('Constraints not supported');
          error.name = 'OverconstrainedError';
          throw error;
        }
        return stream;
      },
    },
  });

  await controller.start();

  assert.equal(requested.length, 2);
  assert.deepEqual(requested[1], {
    video: true,
    audio: false,
  });
  assert.equal(videoElement.srcObject, stream);
  assert.match(statusElement.textContent, /live webcam preview active/i);
});

test('camera controller does not report live when the selected camera fails and another device would be substituted', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const requested = [];
  const reports = [];
  const fallbackStream = {
    getTracks() {
      return [{
        stop() {},
        label: 'FaceTime HD Camera',
        getSettings() {
          return { deviceId: 'facetime' };
        },
      }];
    },
    getVideoTracks() {
      return this.getTracks();
    },
  };

  const controller = createCameraController({
    videoElement,
    statusElement,
    storage: {
      getItem() {
        return 'c270-id';
      },
      setItem() {},
    },
    mediaDevices: {
      async enumerateDevices() {
        return [
          { kind: 'videoinput', deviceId: 'c270-id', label: 'HD Pro Webcam C270' },
          { kind: 'videoinput', deviceId: 'facetime', label: 'FaceTime HD Camera' },
        ];
      },
      async getUserMedia(constraints) {
        requested.push(constraints);
        const requestedId = constraints.video?.deviceId?.exact || constraints.video?.deviceId?.ideal;
        if (constraints.video === true || requestedId === 'facetime') {
          return fallbackStream;
        }
        const error = new Error('Constraints not supported');
        error.name = 'OverconstrainedError';
        throw error;
      },
    },
    onStatusChange(status) {
      reports.push(status);
    },
  });

  await controller.start();

  assert.equal(controller.getStatus().live, false);
  assert.equal(videoElement.srcObject, null);
  assert.equal(requested.some((constraints) => constraints.video === true), false);
  assert.ok(reports.every((status) => status.live === false));
  assert.match(statusElement.textContent, /unable to start camera/i);
});

test('camera controller explains permission denial clearly', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: {
      async getUserMedia() {
        const error = new Error('Permission denied');
        error.name = 'NotAllowedError';
        throw error;
      },
    },
  });

  await controller.start();

  assert.match(statusElement.textContent, /camera permission was denied/i);
});

test('camera controller explains when the device is busy', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: {
      async getUserMedia() {
        const error = new Error('Device busy');
        error.name = 'NotReadableError';
        throw error;
      },
    },
  });

  await controller.start();

  assert.match(statusElement.textContent, /camera is already in use/i);
});

test('camera controller immediately reports that it is requesting camera access', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  let resolveStream;
  const pendingStream = new Promise((resolve) => {
    resolveStream = resolve;
  });
  const stream = {
    getTracks() {
      return [];
    },
  };

  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: {
      getUserMedia() {
        return pendingStream;
      },
    },
  });

  const startPromise = controller.start();
  assert.match(statusElement.textContent, /requesting camera access/i);
  resolveStream(stream);
  await startPromise;
});

test('camera controller stops all tracks and clears the preview', async () => {
  const { createCameraController } = await loadAdminCameraModule();
  const stopped = [];
  const stream = {
    getTracks() {
      return [
        { stop() { stopped.push('video'); } },
        { stop() { stopped.push('audio'); } },
      ];
    },
  };
  const videoElement = createVideoElement();
  const statusElement = createStatusElement();
  const controller = createCameraController({
    videoElement,
    statusElement,
    mediaDevices: {
      async getUserMedia() {
        return stream;
      },
    },
  });

  await controller.start();
  controller.stop();

  assert.deepEqual(stopped, ['video', 'audio']);
  assert.equal(videoElement.srcObject, null);
  assert.equal(controller.getStream(), null);
  assert.match(statusElement.textContent, /camera is off/i);
});

test('camera controller prefers a Logitech C270 device id', async () => {
  const { preferredCameraDeviceId } = await loadAdminCameraModule();
  const chosen = preferredCameraDeviceId([
    { kind: 'videoinput', deviceId: 'built-in', label: 'FaceTime HD Camera' },
    { kind: 'videoinput', deviceId: 'c270-id', label: 'HD Pro Webcam C270' },
    { kind: 'audioinput', deviceId: 'mic', label: 'Microphone' },
  ]);

  assert.equal(chosen, 'c270-id');
});
