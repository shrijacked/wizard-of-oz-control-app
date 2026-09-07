'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeFinalSurvey, normalizeProfile, normalizeRoundSurvey } = require('../src/surveys');

const workload = {
  mentalDemand: 1,
  physicalDemand: 2,
  temporalDemand: 3,
  performance: 4,
  effort: 5,
  frustration: 6,
};

test('control questionnaires save workload only while intervention rounds require feedback', () => {
  assert.deepEqual(normalizeRoundSurvey({ ...workload, helpfulness: 7 }, 'control'), workload);
  assert.throws(() => normalizeRoundSurvey(workload, 'adaptive'), /helpfulness/i);
  assert.equal(normalizeRoundSurvey({
    ...workload,
    helpfulness: 7,
    timingEffectiveness: 6,
    clarityAndDistraction: 5,
    stressReduction: 4,
  }, 'constant').stressReduction, 4);
});

test('participant profile and final survey enforce required scales and consent', () => {
  assert.throws(() => normalizeProfile({ age: 25, gender: 'woman', consented: false }), /consent/i);
  const profile = normalizeProfile({
    age: 25,
    gender: 'self-describe',
    genderSelfDescribe: 'agender',
    consented: true,
    instructionsAcknowledged: true,
    expectedEfficacy: 5,
  }, { requireExpected: true });
  assert.equal(profile.genderSelfDescribe, 'agender');

  const final = normalizeFinalSurvey({
    overallHelpfulness: 4,
    overallEfficacy: 5,
    trust: 6,
    automationBias: 2,
    comment: 'Useful overall.',
  });
  assert.equal(final.comment, 'Useful overall.');
});
