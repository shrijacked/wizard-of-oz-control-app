'use strict';

const { toIsoDate } = require('./adaptive-engine');

function firstFinite(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function normalizeGazeFrame(payload = {}) {
  const frame = payload.frame && typeof payload.frame === 'object'
    ? payload.frame
    : payload;
  const metrics = frame.metrics && typeof frame.metrics === 'object'
    ? frame.metrics
    : frame;

  const attentionScore = firstFinite(
    metrics.attentionScore,
    metrics.attention,
    metrics.focus,
    metrics.focusScore,
    metrics.engagement,
  );

  let fixationLoss = firstFinite(
    metrics.fixationLoss,
    metrics.fixation_loss,
    metrics.gazeLoss,
    metrics.fixationInstability,
  );

  if (!Number.isFinite(fixationLoss) && Number.isFinite(metrics.fixationStability)) {
    fixationLoss = 1 - metrics.fixationStability;
  }

  const pupilDilation = firstFinite(
    metrics.pupilDilation,
    metrics.pupil,
    metrics.pupil_size,
    metrics.dilation,
  );

  return {
    timestamp: payload.timestamp || frame.timestamp || new Date().toISOString(),
    attentionScore,
    fixationLoss,
    pupilDilation,
    source: 'gaze-bridge',
  };
}

class GazeBridge {
  constructor(options = {}) {
    this.store = options.store;
    this.now = options.now || (() => new Date());
    this.staleAfterMs = Number(options.staleAfterMs || 15000);
    this.status = {
      bridgeId: null,
      deviceLabel: null,
      transport: null,
      sdkName: null,
      lastHeartbeatAt: null,
      lastFrameAt: null,
      active: false,
      staleAfterMs: this.staleAfterMs,
      lastError: null,
    };
  }

  getStatus() {
    const now = this.now();
    const lastSeen = this.status.lastHeartbeatAt || this.status.lastFrameAt;
    let active = false;

    if (lastSeen) {
      const lastSeenTime = new Date(lastSeen).getTime();
      active = Number.isFinite(lastSeenTime) && (now.getTime() - lastSeenTime) <= this.staleAfterMs;
    }

    return {
      ...this.status,
      active,
    };
  }

  async heartbeat(payload = {}) {
    const bridgeId = String(payload.bridgeId || '').trim();
    if (!bridgeId) {
      throw new Error('bridgeId is required.');
    }

    const previous = this.getStatus();
    const timestamp = toIsoDate(payload.timestamp || this.now());

    this.status = {
      ...this.status,
      bridgeId,
      deviceLabel: payload.deviceLabel || this.status.deviceLabel || 'Unknown gaze device',
      transport: payload.transport || this.status.transport || 'sdk-http',
      sdkName: payload.sdkName || this.status.sdkName || null,
      lastHeartbeatAt: timestamp,
      lastError: null,
    };

    const next = this.getStatus();
    const shouldLogConnection = (
      !previous.bridgeId ||
      previous.bridgeId !== next.bridgeId ||
      previous.deviceLabel !== next.deviceLabel
    );

    if (shouldLogConnection && this.store?.logSystemEvent) {
      await this.store.logSystemEvent({
        type: 'bridge.gaze.connected',
        source: 'gaze-bridge',
        summary: `Gaze bridge connected: ${next.deviceLabel}.`,
        payload: next,
      });
    }

    return next;
  }

  async ingestFrame(payload = {}) {
    const bridgeId = String(payload.bridgeId || this.status.bridgeId || '').trim();
    if (!bridgeId) {
      throw new Error('bridgeId is required before posting gaze frames.');
    }

    if (!this.status.bridgeId) {
      await this.heartbeat({
        bridgeId,
        deviceLabel: payload.deviceLabel,
        transport: payload.transport,
        sdkName: payload.sdkName,
        timestamp: payload.timestamp,
      });
    }

    const normalized = normalizeGazeFrame(payload);
    this.status = {
      ...this.status,
      bridgeId,
      deviceLabel: payload.deviceLabel || this.status.deviceLabel,
      transport: payload.transport || this.status.transport,
      sdkName: payload.sdkName || this.status.sdkName,
      lastFrameAt: toIsoDate(normalized.timestamp || this.now()),
      lastError: null,
    };

    const state = await this.store.ingestGazeTelemetry(normalized, { source: 'gaze-bridge' });
    return {
      status: this.getStatus(),
      state,
    };
  }
}

module.exports = {
  GazeBridge,
  normalizeGazeFrame,
};
