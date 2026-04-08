'use strict';

const DEFAULT_ADAPTIVE_CONFIGURATION = Object.freeze({
  thresholds: Object.freeze({
    observe: 0.45,
    intervene: 0.75,
  }),
  weights: Object.freeze({
    hrv: 0.55,
    gaze: 0.45,
  }),
  distractionBoost: 0.12,
  freshness: Object.freeze({
    fullStrengthSeconds: 90,
    staleAfterSeconds: 300,
  }),
});

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function finiteNumber(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function toIsoDate(input) {
  if (!input) {
    return null;
  }

  let candidate = input;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)) {
    candidate = input.replace(' ', 'T');
  }

  const date = candidate instanceof Date ? candidate : new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function ageSeconds(timestamp, now = new Date()) {
  if (!timestamp) {
    return Number.POSITIVE_INFINITY;
  }

  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, (now.getTime() - then.getTime()) / 1000);
}

function freshnessWeight(timestamp, now = new Date(), freshness = DEFAULT_ADAPTIVE_CONFIGURATION.freshness) {
  const fullStrengthSeconds = Math.max(15, Math.round(finiteNumber(
    freshness?.fullStrengthSeconds,
    DEFAULT_ADAPTIVE_CONFIGURATION.freshness.fullStrengthSeconds,
  )));
  const staleAfterSeconds = Math.max(
    fullStrengthSeconds + 30,
    Math.round(finiteNumber(
      freshness?.staleAfterSeconds,
      DEFAULT_ADAPTIVE_CONFIGURATION.freshness.staleAfterSeconds,
    )),
  );
  const age = ageSeconds(timestamp, now);

  if (age <= fullStrengthSeconds) {
    return 1;
  }

  if (age >= staleAfterSeconds) {
    return 0;
  }

  return clamp(1 - ((age - fullStrengthSeconds) / Math.max(1, staleAfterSeconds - fullStrengthSeconds)));
}

function normalizeStressLevel(level) {
  const normalized = String(level || '').trim().toLowerCase();

  if (normalized === 'high') {
    return 0.85;
  }

  if (normalized === 'mild') {
    return 0.55;
  }

  return 0.15;
}

function buildReason({ compositeScore, hrvScore, gazeScore, distractionDetected, hrvFreshness, gazeFreshness }) {
  if (compositeScore < 0.2) {
    return 'Telemetry is currently within the expected baseline range.';
  }

  const reasons = [];

  if (hrvFreshness > 0 && hrvScore >= 0.45) {
    reasons.push('HRV stress indicators are elevated');
  }

  if (gazeFreshness > 0 && gazeScore >= 0.4) {
    reasons.push('visual attention appears unstable');
  }

  if (distractionDetected) {
    reasons.push('the watch reported distraction risk');
  }

  if (reasons.length === 0) {
    return 'Signals are mixed, so the researcher should keep observing the participant.';
  }

  const sentence = reasons.join(' and ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

function mergeAdaptiveConfiguration(base = DEFAULT_ADAPTIVE_CONFIGURATION, override = {}) {
  return {
    thresholds: {
      ...base.thresholds,
      ...(override.thresholds || {}),
    },
    weights: {
      ...base.weights,
      ...(override.weights || {}),
    },
    distractionBoost: override.distractionBoost ?? base.distractionBoost,
    freshness: {
      ...base.freshness,
      ...(override.freshness || {}),
    },
  };
}

function normalizeAdaptiveConfiguration(input = {}) {
  const merged = mergeAdaptiveConfiguration(DEFAULT_ADAPTIVE_CONFIGURATION, input);
  const observe = clamp(finiteNumber(merged.thresholds.observe, DEFAULT_ADAPTIVE_CONFIGURATION.thresholds.observe), 0.05, 0.9);
  const intervene = clamp(
    finiteNumber(merged.thresholds.intervene, DEFAULT_ADAPTIVE_CONFIGURATION.thresholds.intervene),
    observe + 0.05,
    1,
  );

  const rawHrvWeight = clamp(finiteNumber(merged.weights.hrv, DEFAULT_ADAPTIVE_CONFIGURATION.weights.hrv), 0, 1);
  const rawGazeWeight = clamp(finiteNumber(merged.weights.gaze, DEFAULT_ADAPTIVE_CONFIGURATION.weights.gaze), 0, 1);
  const weightTotal = rawHrvWeight + rawGazeWeight;
  const weights = weightTotal === 0
    ? DEFAULT_ADAPTIVE_CONFIGURATION.weights
    : {
      hrv: rawHrvWeight / weightTotal,
      gaze: rawGazeWeight / weightTotal,
    };

  const fullStrengthSeconds = Math.round(clamp(
    finiteNumber(merged.freshness.fullStrengthSeconds, DEFAULT_ADAPTIVE_CONFIGURATION.freshness.fullStrengthSeconds),
    15,
    600,
  ));
  const staleAfterSeconds = Math.round(Math.max(
    fullStrengthSeconds + 30,
    clamp(
      finiteNumber(merged.freshness.staleAfterSeconds, DEFAULT_ADAPTIVE_CONFIGURATION.freshness.staleAfterSeconds),
      fullStrengthSeconds + 30,
      1200,
    ),
  ));

  return {
    thresholds: {
      observe: round(observe),
      intervene: round(intervene),
    },
    weights: {
      hrv: round(weights.hrv),
      gaze: round(weights.gaze),
    },
    distractionBoost: round(clamp(
      finiteNumber(merged.distractionBoost, DEFAULT_ADAPTIVE_CONFIGURATION.distractionBoost),
      0,
      0.5,
    )),
    freshness: {
      fullStrengthSeconds,
      staleAfterSeconds,
    },
  };
}

class AdaptiveEngine {
  constructor(options = {}) {
    this.defaultConfiguration = normalizeAdaptiveConfiguration({
      ...(options.configuration || {}),
      thresholds: options.thresholds || options.configuration?.thresholds,
    });
  }

  evaluate(state, now = new Date()) {
    const hrv = state?.telemetry?.hrv || {};
    const gaze = state?.telemetry?.gaze || {};
    const configuration = normalizeAdaptiveConfiguration(mergeAdaptiveConfiguration(
      this.defaultConfiguration,
      state?.adaptive?.configuration || {},
    ));

    const hrvFreshness = freshnessWeight(hrv.updatedAt, now, configuration.freshness);
    const gazeFreshness = freshnessWeight(gaze.updatedAt, now, configuration.freshness);

    const hrvStressScore = clamp(
      Number.isFinite(hrv.stressScore) ? hrv.stressScore : normalizeStressLevel(hrv.stressLevel),
    );
    const gazeAttentionLoss = clamp(1 - (Number.isFinite(gaze.attentionScore) ? gaze.attentionScore : 1));
    const gazeFixationLoss = clamp(Number.isFinite(gaze.fixationLoss) ? gaze.fixationLoss : 0);
    const pupilActivation = clamp(Number.isFinite(gaze.pupilDilation) ? gaze.pupilDilation : 0);
    const distractionDetected = Boolean(hrv.distractionDetected);

    const weightedHrvScore = clamp(hrvStressScore + (distractionDetected ? configuration.distractionBoost : 0)) * hrvFreshness;
    const weightedGazeScore = clamp(
      (gazeAttentionLoss * 0.5) + (gazeFixationLoss * 0.4) + (pupilActivation * 0.1),
    ) * gazeFreshness;

    const compositeScore = clamp(
      (weightedHrvScore * configuration.weights.hrv) + (weightedGazeScore * configuration.weights.gaze),
    );

    let status = 'normal';
    if (compositeScore >= configuration.thresholds.intervene) {
      status = 'intervene';
    } else if (compositeScore >= configuration.thresholds.observe) {
      status = 'observe';
    }

    if (hrvFreshness === 0 && gazeFreshness === 0) {
      status = 'normal';
    }

    return {
      status,
      score: Number(compositeScore.toFixed(2)),
      reason: buildReason({
        compositeScore,
        hrvScore: weightedHrvScore,
        gazeScore: weightedGazeScore,
        distractionDetected,
        hrvFreshness,
        gazeFreshness,
      }),
      updatedAt: toIsoDate(now),
      configuration,
      contributingSignals: {
        hrvScore: Number(weightedHrvScore.toFixed(2)),
        gazeScore: Number(weightedGazeScore.toFixed(2)),
        distractionDetected,
        hrvFreshness: Number(hrvFreshness.toFixed(2)),
        gazeFreshness: Number(gazeFreshness.toFixed(2)),
      },
    };
  }
}

module.exports = {
  AdaptiveEngine,
  ageSeconds,
  clamp,
  DEFAULT_ADAPTIVE_CONFIGURATION,
  freshnessWeight,
  mergeAdaptiveConfiguration,
  normalizeStressLevel,
  normalizeAdaptiveConfiguration,
  toIsoDate,
};
