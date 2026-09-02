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

test('delayed cue scheduler fires once after the remaining move warning delay', async () => {
  const { createDelayedCueScheduler, remainingDelayMs } = await loadDisplayAlertsModule();
  const fired = [];
  const timers = [];
  const scheduler = createDelayedCueScheduler({
    delayMs: 10_000,
    onCue: async (token) => {
      fired.push(token);
    },
    setTimer: (fn, delayMs) => {
      timers.push({ fn, delayMs });
      return timers.length;
    },
    clearTimer: () => {},
  });

  assert.equal(remainingDelayMs('2026-04-22T12:00:00.000Z', 10_000, Date.parse('2026-04-22T12:00:03.000Z')), 7000);
  assert.equal(scheduler.schedule('2026-04-22T12:00:00.000Z', 7000), true);
  assert.equal(scheduler.schedule('2026-04-22T12:00:00.000Z', 7000), false);
  assert.equal(timers[0].delayMs, 7000);
  await timers[0].fn();
  assert.deepEqual(fired, ['2026-04-22T12:00:00.000Z']);
});

test('a newer robot cue cancels the previous move-warning timer', async () => {
  const { createDelayedCueScheduler } = await loadDisplayAlertsModule();
  const fired = [];
  let nextId = 1;
  const active = new Map();
  const scheduler = createDelayedCueScheduler({
    delayMs: 10_000,
    onCue: async (token) => {
      fired.push(token);
    },
    setTimer: (fn) => {
      const id = nextId;
      nextId += 1;
      active.set(id, fn);
      return id;
    },
    clearTimer: (id) => {
      active.delete(id);
    },
  });

  assert.equal(scheduler.schedule('cue-1'), true);
  assert.equal(scheduler.schedule('cue-2'), true);
  assert.equal(active.size, 1);
  await [...active.values()][0]();
  assert.deepEqual(fired, ['cue-2']);
});
