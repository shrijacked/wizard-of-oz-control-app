'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAdminTelemetryModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-telemetry.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

function createTextNode() {
  return {
    textContent: '',
  };
}

function createTelemetryElements() {
  return {
    heartRate: createTextNode(),
    sdnn: createTextNode(),
    rmssd: createTextNode(),
    pnn50: createTextNode(),
    stressScore: createTextNode(),
    stressLevel: createTextNode(),
    distraction: createTextNode(),
    source: createTextNode(),
    updated: createTextNode(),
    interpretation: createTextNode(),
  };
}

test('renderHrvTelemetry fills the admin dashboard with live HRV metrics', async () => {
  const { renderHrvTelemetry } = await loadAdminTelemetryModule();
  const elements = createTelemetryElements();

  renderHrvTelemetry(elements, {
    telemetry: {
      hrv: {
        source: 'watch-bridge',
        updatedAt: '2026-04-22T12:15:00.000Z',
        metrics: {
          hr: 78,
          sdnn: 45.2,
          rmssd: 34.4,
          pnn50: 20.1,
        },
        stressScore: 0.35,
        stressLevel: 'Not Stressed',
        distractionDetected: false,
        interpretation: 'HRV telemetry received.',
      },
    },
  });

  assert.equal(elements.heartRate.textContent, '78 bpm');
  assert.equal(elements.sdnn.textContent, '45.2 ms');
  assert.equal(elements.rmssd.textContent, '34.4 ms');
  assert.equal(elements.pnn50.textContent, '20.1%');
  assert.equal(elements.stressScore.textContent, '0.35');
  assert.equal(elements.stressLevel.textContent, 'Not Stressed');
  assert.equal(elements.distraction.textContent, 'No');
  assert.equal(elements.source.textContent, 'watch-bridge');
  assert.match(elements.updated.textContent, /2026|Apr|22|12/i);
  assert.equal(elements.interpretation.textContent, 'HRV telemetry received.');
});

test('renderHrvTelemetry shows a clear waiting state before the watch starts sending data', async () => {
  const { renderHrvTelemetry } = await loadAdminTelemetryModule();
  const elements = createTelemetryElements();

  renderHrvTelemetry(elements, {
    telemetry: {
      hrv: {
        source: null,
        updatedAt: null,
        metrics: {},
        stressScore: 0,
        stressLevel: 'Not Stressed',
        distractionDetected: false,
        interpretation: 'Awaiting HRV data.',
      },
    },
  });

  assert.equal(elements.heartRate.textContent, '--');
  assert.equal(elements.sdnn.textContent, '--');
  assert.equal(elements.rmssd.textContent, '--');
  assert.equal(elements.pnn50.textContent, '--');
  assert.equal(elements.source.textContent, 'Waiting for watch');
  assert.equal(elements.updated.textContent, 'No HRV sample yet.');
  assert.equal(elements.interpretation.textContent, 'Awaiting HRV data.');
});
