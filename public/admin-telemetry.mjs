import { formatTimestamp } from './shared.js';

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function hasLiveTelemetry(hrv = {}) {
  return Boolean(hrv.updatedAt);
}

function formatMetric(value, options = {}) {
  const {
    decimals = 1,
    suffix = '',
  } = options;

  if (!Number.isFinite(value)) {
    return '--';
  }

  return `${Number(value).toFixed(decimals)}${suffix}`;
}

function formatHeartRate(value) {
  if (!Number.isFinite(value)) {
    return '--';
  }

  return `${Math.round(value)} bpm`;
}

export function renderHrvTelemetry(elements, state) {
  const hrv = state?.telemetry?.hrv || {};
  const metrics = hrv.metrics || {};
  const arousal = hrv.arousal || {};
  const quality = hrv.quality || arousal.quality || {};
  const live = hasLiveTelemetry(hrv);
  const delta = arousal.heartRateDeltaBpm ?? arousal.heart_rate_delta_bpm;
  const heartRateReliable = quality.heartRateReliable ?? quality.heart_rate_reliable;
  const hrvReliable = quality.hrvReliable ?? quality.hrv_reliable;
  const qualityLabel = heartRateReliable === false
    ? 'HR unreliable'
    : hrvReliable === false
      ? 'HR usable; RR/HRV unreliable'
      : heartRateReliable === true
        ? 'Usable'
        : 'Awaiting data';

  setText(elements.heartRate, live ? formatHeartRate(metrics.hr) : '--');
  setText(elements.sdnn, live ? formatMetric(metrics.sdnn, { decimals: 1, suffix: ' ms' }) : '--');
  setText(elements.rmssd, live ? formatMetric(metrics.rmssd, { decimals: 1, suffix: ' ms' }) : '--');
  setText(elements.pnn50, live ? formatMetric(metrics.pnn50, { decimals: 1, suffix: '%' }) : '--');
  setText(elements.stressScore, live ? formatMetric(hrv.stressScore, { decimals: 2 }) : '--');
  setText(elements.stressLevel, live ? (arousal.label || hrv.stressLevel || '--') : 'Awaiting data');
  setText(elements.heartRateDelta, live && Number.isFinite(delta)
    ? `${delta >= 0 ? '+' : ''}${Number(delta).toFixed(1)} bpm`
    : '--');
  setText(elements.signalQuality, live ? qualityLabel : 'Awaiting data');
  setText(elements.distraction, live ? (hrv.distractionDetected ? 'Yes' : 'No') : '--');
  setText(elements.source, hrv.source || 'Waiting for watch');
  setText(elements.updated, hrv.updatedAt ? formatTimestamp(hrv.updatedAt) : 'No HRV sample yet.');
  setText(elements.interpretation, hrv.interpretation || 'Awaiting HRV data.');
}
