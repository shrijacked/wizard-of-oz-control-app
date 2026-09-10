'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-round-progress.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

test('admin round progress identifies active and waiting forms', async () => {
  const { describeRoundProgress } = await loadModule();
  const active = describeRoundProgress({
    plannedRounds: 9,
    rounds: [{ index: 1, survey: { mentalDemand: 4 } }],
    activeRound: { index: 2 },
  });
  assert.equal(active.roundText, 'Round 2 of 9');
  assert.match(active.formText, /Form 2: pending/);
  assert.equal(active.formStatus, 'pending');

  const waiting = describeRoundProgress({
    plannedRounds: 9,
    rounds: [{ index: 1, survey: { mentalDemand: 4 } }, { index: 2 }],
    awaitingRoundSurvey: 2,
  });
  assert.equal(waiting.roundText, 'Round 2 of 9');
  assert.match(waiting.formText, /Form 2: waiting/);
  assert.equal(waiting.formStatus, 'waiting');
});

test('admin round progress identifies filled and skipped forms', async () => {
  const { describeRoundProgress } = await loadModule();
  const filled = describeRoundProgress({
    plannedRounds: 9,
    rounds: [{ index: 1, survey: { mentalDemand: 4 } }],
  });
  assert.match(filled.formText, /Form 1: filled/);
  assert.equal(filled.formStatus, 'filled');

  const skipped = describeRoundProgress({
    plannedRounds: 9,
    rounds: [{ index: 1, survey: { skipped: true } }],
  });
  assert.match(skipped.formText, /Form 1: skipped/);
  assert.equal(skipped.formStatus, 'skipped');
});
