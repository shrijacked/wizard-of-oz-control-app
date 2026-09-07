'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AdaptiveEngine } = require('../src/adaptive-engine');

test('adaptive engine recommends intervene when HRV suggests high strain', () => {
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
    },
    adaptive: {
      configuration: {
        thresholds: {
          observe: 0.3,
          intervene: 0.5,
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
  assert.equal(result.configuration.weights.hrv, 1);
  assert.equal(result.configuration.freshness.staleAfterSeconds, 180);
});
