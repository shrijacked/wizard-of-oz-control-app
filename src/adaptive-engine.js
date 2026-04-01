'use strict';

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
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

function freshnessWeight(timestamp, now = new Date()) {
  const age = ageSeconds(timestamp, now);

  if (age <= 90) {
    return 1;
  }

  if (age >= 300) {
    return 0;
  }

  return clamp(1 - (age - 90) / 210);
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

class AdaptiveEngine {
  constructor(options = {}) {
    this.thresholds = {
      observe: 0.45,
      intervene: 0.75,
      ...options.thresholds,
    };
  }

  evaluate(state, now = new Date()) {
    const hrv = state?.telemetry?.hrv || {};
    const gaze = state?.telemetry?.gaze || {};

    const hrvFreshness = freshnessWeight(hrv.updatedAt, now);
    const gazeFreshness = freshnessWeight(gaze.updatedAt, now);

    const hrvStressScore = clamp(
      Number.isFinite(hrv.stressScore) ? hrv.stressScore : normalizeStressLevel(hrv.stressLevel),
    );
    const gazeAttentionLoss = clamp(1 - (Number.isFinite(gaze.attentionScore) ? gaze.attentionScore : 1));
    const gazeFixationLoss = clamp(Number.isFinite(gaze.fixationLoss) ? gaze.fixationLoss : 0);
    const pupilActivation = clamp(Number.isFinite(gaze.pupilDilation) ? gaze.pupilDilation : 0);
    const distractionDetected = Boolean(hrv.distractionDetected);

    const weightedHrvScore = clamp(hrvStressScore + (distractionDetected ? 0.12 : 0)) * hrvFreshness;
    const weightedGazeScore = clamp(
      (gazeAttentionLoss * 0.5) + (gazeFixationLoss * 0.4) + (pupilActivation * 0.1),
    ) * gazeFreshness;

    const compositeScore = clamp((weightedHrvScore * 0.55) + (weightedGazeScore * 0.45));

    let status = 'normal';
    if (compositeScore >= this.thresholds.intervene) {
      status = 'intervene';
    } else if (compositeScore >= this.thresholds.observe) {
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
  freshnessWeight,
  normalizeStressLevel,
  toIsoDate,
};
