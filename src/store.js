'use strict';

const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const { AdaptiveEngine, toIsoDate } = require('./adaptive-engine');
const { LlmAdvisor } = require('./llm-advisor');

const MAX_HISTORY_POINTS = 60;
const MAX_TIMELINE_EVENTS = 200;

function createSessionId(now = new Date()) {
  const safe = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  return `session-${safe}`;
}

function createInitialState(now = new Date()) {
  const timestamp = toIsoDate(now);
  return {
    session: {
      id: createSessionId(now),
      startedAt: timestamp,
      resetCount: 0,
    },
    hint: {
      text: '',
      updatedAt: null,
      author: null,
    },
    robotAction: {
      actionId: null,
      label: 'No action logged yet',
      payload: null,
      actor: null,
      updatedAt: null,
    },
    telemetry: {
      hrv: {
        source: null,
        updatedAt: null,
        baseline: null,
        metrics: {},
        changesFromBaseline: {},
        stressScore: 0,
        stressLevel: 'Not Stressed',
        distractionDetected: false,
        interpretation: 'Awaiting HRV data.',
        feedback: 'Start the watch monitor or post HRV telemetry.',
      },
      gaze: {
        source: null,
        updatedAt: null,
        attentionScore: null,
        fixationLoss: null,
        pupilDilation: null,
      },
      history: {
        hrv: [],
        gaze: [],
      },
    },
    adaptive: {
      status: 'normal',
      score: 0,
      reason: 'Waiting for telemetry.',
      updatedAt: timestamp,
      advisory: null,
      contributingSignals: {
        hrvScore: 0,
        gazeScore: 0,
        distractionDetected: false,
        hrvFreshness: 0,
        gazeFreshness: 0,
      },
    },
  };
}

function pushCapped(list, item, max = MAX_HISTORY_POINTS) {
  list.push(item);
  if (list.length > max) {
    list.splice(0, list.length - max);
  }
}

function clone(value) {
  return structuredClone(value);
}

function csvEscape(value) {
  const stringValue = value == null ? '' : String(value);
  if (!/[,"\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

class ExperimentStore extends EventEmitter {
  constructor(options = {}) {
    super();
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.exportDir = path.join(this.dataDir, 'export');
    this.statePath = path.join(this.dataDir, 'state.json');
    this.eventsPath = path.join(this.dataDir, 'events.jsonl');
    this.adaptiveEngine = options.adaptiveEngine || new AdaptiveEngine();
    this.llmAdvisor = options.llmAdvisor || new LlmAdvisor();
    this.now = options.now || (() => new Date());
    this.state = createInitialState(this.now());
    this.timeline = [];
    this.writeQueue = Promise.resolve();
    this.lastAdvisorySignature = null;
  }

  async initialize() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.exportDir, { recursive: true });

    try {
      const raw = await fs.readFile(this.statePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.session && parsed.telemetry && parsed.adaptive) {
        this.state = parsed;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await this.#writeState();
    }

    await this.#ensureCsvFile();
  }

  getState() {
    return clone(this.state);
  }

  getRecentEvents(limit = 25) {
    return clone(this.timeline.slice(-limit).reverse());
  }

  getCurrentSessionId() {
    return this.state.session.id;
  }

  async resetSession(meta = {}) {
    const previousResetCount = Number(this.state?.session?.resetCount || 0);
    this.state = createInitialState(this.now());
    this.state.session.resetCount = previousResetCount + 1;

    const event = this.#createEvent('session.reset', {
      source: meta.source || 'admin',
      summary: 'The experiment session was reset.',
      payload: {
        requestedBy: meta.requestedBy || 'researcher',
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async setHint(payload = {}) {
    const text = String(payload.text || '').trim();
    if (!text) {
      throw new Error('Hint text is required.');
    }

    const timestamp = toIsoDate(this.now());
    this.state.hint = {
      text,
      updatedAt: timestamp,
      author: payload.author || 'researcher',
    };

    const event = this.#createEvent('hint.updated', {
      source: payload.source || 'admin',
      summary: `Hint broadcast: ${text}`,
      payload: clone(this.state.hint),
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async logRobotAction(payload = {}) {
    const actionId = String(payload.actionId || '').trim();
    const label = String(payload.label || '').trim();
    if (!actionId || !label) {
      throw new Error('Both actionId and label are required.');
    }

    const timestamp = toIsoDate(this.now());
    this.state.robotAction = {
      actionId,
      label,
      payload: payload.payload || null,
      actor: payload.actor || 'researcher',
      updatedAt: timestamp,
    };

    const event = this.#createEvent('robot.action.logged', {
      source: payload.source || 'admin',
      summary: `Robotic action logged: ${label}`,
      payload: clone(this.state.robotAction),
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async ingestHrvTelemetry(payload = {}, meta = {}) {
    const timestamp = toIsoDate(payload.timestamp || this.now());
    const metrics = clone(payload.metrics || {});
    const stressScore = Number.isFinite(payload.stressScore) ? payload.stressScore : 0;
    const stressLevel = payload.stressLevel || 'Not Stressed';
    const distractionDetected = Boolean(payload.distractionDetected);

    this.state.telemetry.hrv = {
      source: meta.source || payload.source || 'api',
      updatedAt: timestamp,
      baseline: payload.baseline || this.state.telemetry.hrv.baseline || null,
      metrics,
      changesFromBaseline: clone(payload.changesFromBaseline || {}),
      stressScore,
      stressLevel,
      distractionDetected,
      interpretation: payload.interpretation || 'HRV telemetry received.',
      feedback: payload.feedback || 'Continue monitoring the participant.',
    };

    pushCapped(this.state.telemetry.history.hrv, {
      timestamp,
      stressScore,
      heartRate: Number.isFinite(metrics.hr) ? metrics.hr : null,
      stressLevel,
    });

    const telemetryEvent = this.#createEvent('telemetry.hrv.updated', {
      source: meta.source || payload.source || 'api',
      summary: `HRV telemetry updated with stress level ${stressLevel}.`,
      payload: clone(this.state.telemetry.hrv),
    });

    const adaptiveEvents = await this.#refreshAdaptiveState(meta.source || payload.source || 'api');
    const events = [telemetryEvent, ...adaptiveEvents];
    await this.#persistAndBroadcast(events);
    return this.getState();
  }

  async ingestGazeTelemetry(payload = {}, meta = {}) {
    const timestamp = toIsoDate(payload.timestamp || this.now());
    this.state.telemetry.gaze = {
      source: meta.source || payload.source || 'api',
      updatedAt: timestamp,
      attentionScore: Number.isFinite(payload.attentionScore) ? payload.attentionScore : null,
      fixationLoss: Number.isFinite(payload.fixationLoss) ? payload.fixationLoss : null,
      pupilDilation: Number.isFinite(payload.pupilDilation) ? payload.pupilDilation : null,
    };

    pushCapped(this.state.telemetry.history.gaze, {
      timestamp,
      attentionScore: this.state.telemetry.gaze.attentionScore,
      fixationLoss: this.state.telemetry.gaze.fixationLoss,
    });

    const telemetryEvent = this.#createEvent('telemetry.gaze.updated', {
      source: meta.source || payload.source || 'api',
      summary: 'Gaze telemetry updated.',
      payload: clone(this.state.telemetry.gaze),
    });

    const adaptiveEvents = await this.#refreshAdaptiveState(meta.source || payload.source || 'api');
    const events = [telemetryEvent, ...adaptiveEvents];
    await this.#persistAndBroadcast(events);
    return this.getState();
  }

  async ingestSimulatedTelemetry(payload = {}, meta = {}) {
    if (payload.hrv) {
      await this.ingestHrvTelemetry(payload.hrv, { source: meta.source || 'simulator' });
    }

    if (payload.gaze) {
      await this.ingestGazeTelemetry(payload.gaze, { source: meta.source || 'simulator' });
    }

    return this.getState();
  }

  async ingestWatchEntry(entry = {}) {
    const watchData = entry.watch_data || {};

    if (watchData.is_baseline) {
      this.state.telemetry.hrv.baseline = clone(watchData.baseline_metrics || {});

      const event = this.#createEvent('telemetry.hrv.baseline.loaded', {
        source: 'watch-bridge',
        summary: 'Baseline HRV calibration was loaded from the watch feed.',
        payload: {
          baseline: clone(this.state.telemetry.hrv.baseline),
          sequenceNumber: entry.sequence_number || null,
          timestamp: entry.timestamp || null,
        },
      });

      await this.#persistAndBroadcast([event]);
      return this.getState();
    }

    return this.ingestHrvTelemetry({
      timestamp: entry.timestamp || this.now(),
      baseline: this.state.telemetry.hrv.baseline,
      metrics: clone(watchData.current_metrics || {}),
      changesFromBaseline: clone(watchData.changes_from_baseline || {}),
      stressScore: Number.isFinite(watchData.stress_score) ? watchData.stress_score : 0,
      stressLevel: watchData.stress_level || 'Not Stressed',
      distractionDetected: Boolean(watchData.distraction_detected),
      interpretation: watchData.interpretation,
      feedback: watchData.feedback,
      source: 'watch-bridge',
    }, { source: 'watch-bridge' });
  }

  async logSystemEvent(details = {}) {
    const event = this.#createEvent(details.type || 'system.event', {
      source: details.source || 'system',
      summary: details.summary || 'System event recorded.',
      payload: clone(details.payload || {}),
    });

    await this.#persistAndBroadcast([event]);
    return event;
  }

  async getExportManifest() {
    const events = await this.#readPersistedEvents();
    const sessions = new Map();

    for (const event of events) {
      if (!event.sessionId) {
        continue;
      }

      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, {
          sessionId: event.sessionId,
          startedAt: event.timestamp,
          lastEventAt: event.timestamp,
          eventCount: 0,
        });
      }

      const session = sessions.get(event.sessionId);
      session.eventCount += 1;

      if (!session.startedAt || event.timestamp < session.startedAt) {
        session.startedAt = event.timestamp;
      }

      if (!session.lastEventAt || event.timestamp > session.lastEventAt) {
        session.lastEventAt = event.timestamp;
      }
    }

    const currentSessionId = this.getCurrentSessionId();
    if (!sessions.has(currentSessionId)) {
      sessions.set(currentSessionId, {
        sessionId: currentSessionId,
        startedAt: this.state.session.startedAt,
        lastEventAt: null,
        eventCount: 0,
      });
    }

    const manifestSessions = [...sessions.values()]
      .sort((left, right) => String(right.startedAt || '').localeCompare(String(left.startedAt || '')))
      .map((session) => ({
        ...session,
        startedAt: session.sessionId === currentSessionId
          ? this.state.session.startedAt
          : session.startedAt,
        isCurrent: session.sessionId === currentSessionId,
        downloads: {
          bundleJson: `/api/exports/${session.sessionId}.bundle.json`,
          csv: `/api/exports/${session.sessionId}.csv`,
        },
      }));

    return {
      generatedAt: toIsoDate(this.now()),
      currentSessionId,
      sessions: manifestSessions,
    };
  }

  async buildSessionExport(sessionIdInput) {
    const sessionId = this.#resolveSessionId(sessionIdInput);
    const events = await this.#readPersistedEvents();
    const sessionEvents = events.filter((event) => event.sessionId === sessionId);
    const csv = await this.getSessionCsv(sessionId);

    return {
      session: {
        id: sessionId,
        exportedAt: toIsoDate(this.now()),
        eventCount: sessionEvents.length,
      },
      state: sessionId === this.getCurrentSessionId()
        ? this.getState()
        : {
            session: { id: sessionId },
          },
      events: sessionEvents,
      csv,
    };
  }

  async getSessionCsv(sessionIdInput) {
    const sessionId = this.#resolveSessionId(sessionIdInput);
    const csvPath = this.#csvPathForSession(sessionId);

    try {
      return await fs.readFile(csvPath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') {
        return 'timestamp,sessionId,type,source,summary,payload\n';
      }

      throw error;
    }
  }

  #createEvent(type, details) {
    return {
      id: randomUUID(),
      type,
      sessionId: this.state.session.id,
      timestamp: toIsoDate(this.now()),
      source: details.source || 'system',
      summary: details.summary || type,
      payload: details.payload || null,
    };
  }

  async #refreshAdaptiveState(source) {
    const previous = this.state.adaptive;
    const next = this.adaptiveEngine.evaluate(this.state, this.now());
    const events = [];

    if (next.status === 'observe' || next.status === 'intervene') {
      const advisory = await this.#maybeRequestLlmAdvice(next);
      next.advisory = advisory;
    } else {
      next.advisory = null;
      this.lastAdvisorySignature = null;
    }

    this.state.adaptive = next;

    const materiallyChanged = (
      previous.status !== next.status ||
      Math.abs((previous.score || 0) - (next.score || 0)) >= 0.1 ||
      previous.reason !== next.reason
    );

    if (!materiallyChanged) {
      if (this.#shouldEmitAdvisoryEvent(previous.advisory, next.advisory)) {
        events.push(this.#createEvent('adaptive.llm.advice.updated', {
          source,
          summary: 'LLM-backed adaptive guidance was refreshed.',
          payload: clone(next.advisory),
        }));
      }

      return events;
    }

    events.push(this.#createEvent('adaptive.status.changed', {
      source,
      summary: `Adaptive recommendation is now ${next.status}.`,
      payload: clone(next),
    }));

    if (this.#shouldEmitAdvisoryEvent(previous.advisory, next.advisory)) {
      events.push(this.#createEvent('adaptive.llm.advice.updated', {
        source,
        summary: 'LLM-backed adaptive guidance was refreshed.',
        payload: clone(next.advisory),
      }));
    }

    return events;
  }

  async #maybeRequestLlmAdvice(nextAdaptiveState) {
    if (!this.llmAdvisor.isEnabled()) {
      return null;
    }

    const signature = JSON.stringify({
      status: nextAdaptiveState.status,
      score: nextAdaptiveState.score,
      hrv: this.state.telemetry.hrv.stressScore,
      gazeAttention: this.state.telemetry.gaze.attentionScore,
      fixationLoss: this.state.telemetry.gaze.fixationLoss,
      distractionDetected: this.state.telemetry.hrv.distractionDetected,
    });

    if (this.lastAdvisorySignature === signature && this.state.adaptive?.advisory) {
      return this.state.adaptive.advisory;
    }

    this.lastAdvisorySignature = signature;
    return this.llmAdvisor.analyze(this.state, nextAdaptiveState);
  }

  #shouldEmitAdvisoryEvent(previousAdvisory, nextAdvisory) {
    if (!nextAdvisory) {
      return false;
    }

    if (!previousAdvisory) {
      return true;
    }

    return previousAdvisory.generatedAt !== nextAdvisory.generatedAt;
  }

  async #persistAndBroadcast(events) {
    const stateSnapshot = clone(this.state);
    for (const event of events) {
      pushCapped(this.timeline, event, MAX_TIMELINE_EVENTS);
    }

    await this.#queueWrite(async () => {
      await Promise.all([
        this.#appendEvents(events),
        this.#appendCsv(events),
        this.#writeState(),
      ]);
    });

    const fullSnapshot = clone(stateSnapshot);
    this.emit('state', fullSnapshot);
    for (const event of events) {
      this.emit('event', { event: clone(event), state: clone(fullSnapshot) });
    }
  }

  async #ensureCsvFile() {
    const csvPath = this.#csvPathForSession();
    try {
      await fs.access(csvPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await fs.writeFile(
        csvPath,
        'timestamp,sessionId,type,source,summary,payload\n',
        'utf8',
      );
    }
  }

  async #appendCsv(events) {
    await this.#ensureCsvFile();
    const csvPath = this.#csvPathForSession();
    const lines = events.map((event) => [
      csvEscape(event.timestamp),
      csvEscape(event.sessionId),
      csvEscape(event.type),
      csvEscape(event.source),
      csvEscape(event.summary),
      csvEscape(JSON.stringify(event.payload || {})),
    ].join(',')).join('\n') + '\n';

    await fs.appendFile(csvPath, lines, 'utf8');
  }

  async #appendEvents(events) {
    const lines = events.map((event) => JSON.stringify(event)).join('\n') + '\n';
    await fs.appendFile(this.eventsPath, lines, 'utf8');
  }

  async #readPersistedEvents() {
    try {
      const raw = await fs.readFile(this.eventsPath, 'utf8');
      return raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async #writeState() {
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  async #queueWrite(operation) {
    this.writeQueue = this.writeQueue.then(operation, operation);
    return this.writeQueue;
  }

  #resolveSessionId(sessionIdInput) {
    const sessionId = String(sessionIdInput || '').trim();
    if (!sessionId || sessionId === 'current') {
      return this.getCurrentSessionId();
    }

    return sessionId;
  }

  #csvPathForSession(sessionId = this.state.session.id) {
    return path.join(this.exportDir, `${sessionId}.csv`);
  }
}

module.exports = {
  ExperimentStore,
  createInitialState,
  createSessionId,
};
