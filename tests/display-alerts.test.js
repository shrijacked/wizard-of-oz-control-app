'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadDisplayAlertsModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'display-alerts.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

test('subject hint alert tracker stays quiet for the initial state and beeps on the first live hint', async () => {
  const { createUpdateCueTracker } = await loadDisplayAlertsModule();
  const heard = [];
  const tracker = createUpdateCueTracker({
    onCue: async (token) => {
      heard.push(token);
    },
  });

  tracker.prime(null);

  assert.equal(await tracker.push(null), false);
  assert.equal(await tracker.push('2026-04-22T12:00:00.000Z'), true);
  assert.deepEqual(heard, ['2026-04-22T12:00:00.000Z']);
  assert.equal(await tracker.push('2026-04-22T12:00:00.000Z'), false);
  assert.deepEqual(heard, ['2026-04-22T12:00:00.000Z']);
});

test('robot cue alert tracker ignores reconnect snapshots and only beeps for fresh robot actions', async () => {
  const { createUpdateCueTracker } = await loadDisplayAlertsModule();
  const heard = [];
  const tracker = createUpdateCueTracker({
    onCue: async (token) => {
      heard.push(token);
    },
  });

  tracker.prime('2026-04-22T12:00:00.000Z');

  assert.equal(await tracker.push('2026-04-22T12:00:00.000Z'), false);
  assert.equal(await tracker.push(null), false);
  assert.equal(await tracker.push('2026-04-22T12:00:05.000Z'), true);
  assert.deepEqual(heard, ['2026-04-22T12:00:05.000Z']);
});
