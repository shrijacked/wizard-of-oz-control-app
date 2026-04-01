'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeGazeFrame } = require('../src/gaze-bridge');

test('gaze bridge normalizes common vendor field aliases', () => {
  const normalized = normalizeGazeFrame({
    timestamp: '2026-04-01T12:00:00.000Z',
    frame: {
      focus: 0.28,
      fixation_loss: 0.63,
      pupil: 0.51,
    },
  });

  assert.equal(normalized.attentionScore, 0.28);
  assert.equal(normalized.fixationLoss, 0.63);
  assert.equal(normalized.pupilDilation, 0.51);
  assert.equal(normalized.source, 'gaze-bridge');
});
