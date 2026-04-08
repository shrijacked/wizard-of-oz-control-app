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

  if (status.lastError) {
    return {
      name: 'watch',
      level: 'error',
      state: 'error',
      stale: false,
      ageSeconds: processedAgeSeconds,
      summary: 'Watch bridge reported an error.',
      detail: status.lastError,
    };
  }

  if (!status.lastProcessedAt) {
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

  if (processedAgeSeconds != null && (processedAgeSeconds * 1000) > staleAfterMs) {
    return {
      name: 'watch',
      level: 'warning',
      state: 'stale',
      stale: true,
      ageSeconds: processedAgeSeconds,
      summary: 'Watch telemetry is stale.',
      detail: `The last HRV sample was processed ${processedAgeSeconds}s ago.`,
    };
  }

  return {
    name: 'watch',
    level: 'healthy',
    state: 'healthy',
    stale: false,
    ageSeconds: processedAgeSeconds,
    summary: 'Watch telemetry looks healthy.',
    detail: processedAgeSeconds == null
      ? 'HRV samples are flowing.'
      : `The last HRV sample was processed ${processedAgeSeconds}s ago.`,
  };
}

function summarizeGazeHealth(status = {}, now = new Date()) {
  const lastSeenAt = status.lastFrameAt || status.lastHeartbeatAt || null;
  const seenAgeSeconds = ageSeconds(lastSeenAt, now);

  if (status.lastError) {
    return {
      name: 'gaze',
      level: 'error',
      state: 'error',
      stale: false,
      ageSeconds: seenAgeSeconds,
      summary: 'Attention stream reported an error.',
      detail: status.lastError,
    };
  }

  if (!status.bridgeId) {
    return {
      name: 'gaze',
      level: 'info',
      state: 'waiting',
      stale: false,
      ageSeconds: null,
      summary: 'Attention stream is waiting for a bridge connection.',
      detail: 'Start the gaze bridge or SDK connector to begin sending heartbeats.',
    };
  }

  if (!status.active) {
    return {
      name: 'gaze',
      level: 'warning',
      state: 'stale',
      stale: true,
      ageSeconds: seenAgeSeconds,
      summary: 'Attention stream is stale.',
      detail: seenAgeSeconds == null
        ? `Bridge ${status.deviceLabel || status.bridgeId} has not delivered a recent heartbeat.`
        : `Bridge ${status.deviceLabel || status.bridgeId} was last seen ${seenAgeSeconds}s ago.`,
    };
  }

  return {
    name: 'gaze',
    level: 'healthy',
    state: 'healthy',
    stale: false,
    ageSeconds: seenAgeSeconds,
    summary: 'Attention stream looks healthy.',
    detail: seenAgeSeconds == null
      ? `Bridge ${status.deviceLabel || status.bridgeId} is connected.`
      : `Bridge ${status.deviceLabel || status.bridgeId} was seen ${seenAgeSeconds}s ago.`,
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
  const watch = summarizeWatchHealth(input.watchBridge || {}, now, options.watch || {});
  const gaze = summarizeGazeHealth(input.gazeBridge || {}, now);
  const sessionStatus = input.sessionStatus || 'setup';

  const issues = [];
  if (watch.level !== 'healthy') {
    issues.push(watch);
  }
  if (gaze.level !== 'healthy') {
    issues.push(gaze);
  }

  let overallLevel = issues.length === 0 ? 'healthy' : 'info';
  if (issues.some((issue) => issue.level === 'error')) {
    overallLevel = 'error';
  } else if (sessionStatus === 'running' && issues.length > 0) {
    overallLevel = 'warning';
  } else if (issues.some((issue) => issue.level === 'warning')) {
    overallLevel = 'warning';
  }

  let summary = 'All sensor streams look healthy.';
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
    gaze,
  };
}

module.exports = {
  ageSeconds,
  summarizeGazeHealth,
  summarizeSensorHealth,
  summarizeWatchHealth,
};
