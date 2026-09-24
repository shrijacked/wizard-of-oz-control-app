'use strict';

function ageSeconds(timestamp, now = new Date()) {
  if (!timestamp) {
    return null;
  }

  const then = new Date(timestamp).getTime();
  const current = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(then) || !Number.isFinite(current)) {
    return null;
  }

  return Math.max(0, Math.round((current - then) / 1000));
}

function summarizeWatchHealth(status = {}, now = new Date(), options = {}) {
  const staleAfterMs = Number(options.staleAfterMs || status.staleAfterMs || 90000);
  const processedAgeSeconds = ageSeconds(status.lastProcessedAt, now);
  const telemetryAgeSeconds = ageSeconds(options.telemetryUpdatedAt, now);
  const liveAgeSeconds = processedAgeSeconds ?? telemetryAgeSeconds;

  if (status.lastError) {
    return {
      name: 'watch',
      level: 'error',
      state: 'error',
      stale: false,
      ageSeconds: liveAgeSeconds,
      summary: 'Watch bridge reported an error.',
      detail: status.lastError,
    };
  }

  if (options.calibration?.pending) {
    return {
      name: 'watch',
      level: liveAgeSeconds == null || (liveAgeSeconds * 1000) > staleAfterMs ? 'warning' : 'info',
      state: 'pending',
      stale: liveAgeSeconds != null && (liveAgeSeconds * 1000) > staleAfterMs,
      ageSeconds: liveAgeSeconds,
      summary: 'Watch recalibration is waiting for the collector.',
      detail: liveAgeSeconds == null
        ? 'No live hBand sample has arrived. Wake the band and make sure it is not connected to another device.'
        : `The request is saved; the last watch sample was ${liveAgeSeconds}s ago.`,
    };
  }

  if (
    options.calibration?.active
    && liveAgeSeconds != null
    && (liveAgeSeconds * 1000) > staleAfterMs
  ) {
    return {
      name: 'watch',
      level: 'warning',
      state: 'stale',
      stale: true,
      ageSeconds: liveAgeSeconds,
      summary: 'Watch samples stopped during baseline calibration.',
      detail: `Calibration paused at ${Math.round(Number(options.calibration.progress) || 0)}%; the collector will reconnect automatically.`,
    };
  }

  if (options.calibration?.active) {
    return {
      name: 'watch',
      level: 'info',
      state: 'calibrating',
      stale: false,
      ageSeconds: liveAgeSeconds,
      summary: `Watch baseline calibration is ${Math.round(Number(options.calibration.progress) || 0)}% complete.`,
      detail: 'Keep the participant still and relaxed until calibration finishes.',
    };
  }

  if (status.lastProcessedAt || options.telemetryUpdatedAt) {
    if (liveAgeSeconds != null && (liveAgeSeconds * 1000) > staleAfterMs) {
      return {
        name: 'watch',
        level: 'warning',
        state: 'stale',
        stale: true,
        ageSeconds: liveAgeSeconds,
        summary: 'Watch telemetry is stale.',
        detail: `The last HRV sample was ${liveAgeSeconds}s ago.`,
      };
    }

    const quality = options.quality || {};
    const heartRateReliable = quality.heartRateReliable ?? quality.heart_rate_reliable;
    const hrvReliable = quality.hrvReliable ?? quality.hrv_reliable;
    const poorContactPct = Number(
      quality.poorContactPacketPct ?? quality.poor_contact_packet_pct,
    );
    if (heartRateReliable === false || hrvReliable === false) {
      const poorContactDetail = Number.isFinite(poorContactPct)
        ? `${Math.round(poorContactPct)}% of recent packets report poor skin contact. `
        : '';
      return {
        name: 'watch',
        level: 'warning',
        state: 'poor-signal',
        stale: false,
        ageSeconds: liveAgeSeconds,
        summary: 'Watch is connected, but its signal is unreliable.',
        detail: `${poorContactDetail}Reposition the band snugly on the wrist and recalibrate before using HRV guidance.`,
      };
    }

    return {
      name: 'watch',
      level: 'healthy',
      state: 'healthy',
      stale: false,
      ageSeconds: liveAgeSeconds,
      summary: 'Watch telemetry looks healthy.',
      detail: liveAgeSeconds == null
        ? 'HRV samples are flowing.'
        : `The last HRV sample was processed ${liveAgeSeconds}s ago.`,
    };
  }

  if (!status.active) {
    return {
      name: 'watch',
      level: 'warning',
      state: 'offline',
      stale: false,
      ageSeconds: processedAgeSeconds,
      summary: 'Watch bridge is offline.',
      detail: `The watcher for ${status.filePath || 'watch/watch_data.json'} is not running.`,
    };
  }

  return {
    name: 'watch',
    level: 'info',
    state: 'waiting',
    stale: false,
    ageSeconds: null,
    summary: 'Watch telemetry is waiting for its first sample.',
    detail: `Watching ${status.filePath || 'watch/watch_data.json'} for new HRV entries.`,
  };
}

function severityRank(level) {
  if (level === 'error') {
    return 3;
  }

  if (level === 'warning') {
    return 2;
  }

  if (level === 'info') {
    return 1;
  }

  return 0;
}

function summarizeSensorHealth(input = {}, now = new Date(), options = {}) {
  const watch = summarizeWatchHealth(input.watchBridge || {}, now, {
    ...(options.watch || {}),
    telemetryUpdatedAt: input.telemetry?.hrv?.updatedAt,
    calibration: input.telemetry?.hrv?.calibration,
    quality: input.telemetry?.hrv?.quality,
  });
  const sessionStatus = input.sessionStatus || 'setup';

  const issues = [];
  if (watch.level !== 'healthy') {
    issues.push(watch);
  }
  let overallLevel = issues.length === 0 ? 'healthy' : 'info';
  if (issues.some((issue) => issue.level === 'error')) {
    overallLevel = 'error';
  } else if (sessionStatus === 'running' && issues.length > 0) {
    overallLevel = 'warning';
  } else if (issues.some((issue) => issue.level === 'warning')) {
    overallLevel = 'warning';
  }

  let summary = 'Watch telemetry looks healthy.';
  if (issues.length > 0) {
    summary = issues.map((issue) => issue.summary).join(' ');
  }

  const detail = sessionStatus === 'running'
    ? 'Warnings matter most during live trials because stale telemetry can weaken adaptive recommendations.'
    : 'Warnings are informational during setup and after completion, but they are still useful before a run begins.';

  return {
    overall: {
      level: overallLevel,
      state: overallLevel === 'healthy' ? 'healthy' : 'attention',
      summary,
      detail,
      issueCount: issues.length,
      sessionStatus,
    },
    watch,
  };
}

module.exports = {
  ageSeconds,
  summarizeSensorHealth,
  summarizeWatchHealth,
};
