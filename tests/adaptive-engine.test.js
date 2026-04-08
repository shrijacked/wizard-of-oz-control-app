'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AdaptiveEngine } = require('../src/adaptive-engine');

test('adaptive engine recommends intervene when both HRV and gaze suggest high strain', () => {
  const engine = new AdaptiveEngine();
  const now = new Date('2026-04-01T12:00:00.000Z');
  const result = engine.evaluate({
    telemetry: {
      hrv: {
        updatedAt: now.toISOString(),
        stressScore: 0.9,
        stressLevel: 'High',
        distractionDetected: true,
      },
      gaze: {
        updatedAt: now.toISOString(),
        attentionScore: 0.1,
        fixationLoss: 0.9,
        pupilDilation: 0.8,
      },
    },
  }, now);

  assert.equal(result.status, 'intervene');
  assert.ok(result.score >= 0.75);
});

test('adaptive engine falls back to normal when telemetry is stale', () => {
  const engine = new AdaptiveEngine();
  const now = new Date('2026-04-01T12:10:00.000Z');
  const result = engine.evaluate({
    telemetry: {
      hrv: {
        updatedAt: '2026-04-01T11:59:00.000Z',
        stressScore: 0.95,
        stressLevel: 'High',
        distractionDetected: true,
      },
      gaze: {
        updatedAt: '2026-04-01T11:58:30.000Z',
        attentionScore: 0.05,
        fixationLoss: 0.95,
        pupilDilation: 0.9,
      },
    },
  }, now);

  assert.equal(result.status, 'normal');
  assert.equal(result.score, 0);
});

test('adaptive engine honors custom configuration from state', () => {
  const engine = new AdaptiveEngine();
  const now = new Date('2026-04-01T12:00:00.000Z');
  const result = engine.evaluate({
    telemetry: {
      hrv: {
        updatedAt: now.toISOString(),
        stressScore: 0.62,
        stressLevel: 'Mild',
        distractionDetected: true,
      },
      gaze: {
        updatedAt: now.toISOString(),
        attentionScore: 0.5,
        fixationLoss: 0.4,
        pupilDilation: 0.3,
      },
    },
    adaptive: {
      configuration: {
        thresholds: {
          observe: 0.3,
          intervene: 0.5,
        },
        weights: {
          hrv: 0.8,
          gaze: 0.2,
        },
        distractionBoost: 0.2,
        freshness: {
          fullStrengthSeconds: 45,
          staleAfterSeconds: 180,
        },
      },
    },
  }, now);

  assert.equal(result.status, 'intervene');
  assert.equal(result.configuration.thresholds.observe, 0.3);
  assert.equal(result.configuration.thresholds.intervene, 0.5);
  assert.equal(result.configuration.weights.hrv, 0.8);
  assert.equal(result.configuration.freshness.staleAfterSeconds, 180);
});
