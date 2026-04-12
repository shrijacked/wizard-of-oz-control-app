'use strict';

const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const {
  AdaptiveEngine,
  DEFAULT_ADAPTIVE_CONFIGURATION,
  mergeAdaptiveConfiguration,
  normalizeAdaptiveConfiguration,
  toIsoDate,
} = require('./adaptive-engine');
const { LlmAdvisor } = require('./llm-advisor');
const { createInitialPreflightAcknowledgements, normalizePreflightAcknowledgements } = require('./preflight');

const MAX_HISTORY_POINTS = 60;
const MAX_TIMELINE_EVENTS = 200;

function createSessionId(now = new Date()) {
  const safe = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  return `session-${safe}`;
}

function createInitialAdaptiveState(now = new Date()) {
  return {
    status: 'normal',
    score: 0,
    reason: 'Waiting for telemetry.',
    updatedAt: toIsoDate(now),
    advisory: null,
    configuration: clone(DEFAULT_ADAPTIVE_CONFIGURATION),
    defaults: clone(DEFAULT_ADAPTIVE_CONFIGURATION),
    contributingSignals: {
      hrvScore: 0,
      gazeScore: 0,
      distractionDetected: false,
      hrvFreshness: 0,
      gazeFreshness: 0,
    },
  };
}

function createInitialPreflightState() {
  return {
    acknowledgements: createInitialPreflightAcknowledgements(),
    updatedAt: null,
    updatedBy: null,
  };
}

function createInitialState(now = new Date()) {
  const timestamp = toIsoDate(now);
  return {
    session: {
      id: createSessionId(now),
      startedAt: timestamp,
      status: 'setup',
      trialStartedAt: null,
      completedAt: null,
      completedSummary: null,
      metadata: {
        studyId: '',
        participantId: '',
        condition: 'adaptive',
        researcher: '',
        notes: '',
      },
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
    adaptive: createInitialAdaptiveState(now),
    preflight: createInitialPreflightState(),
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

function hydrateState(parsed, now = new Date()) {
  const initial = createInitialState(now);
  if (!parsed || typeof parsed !== 'object') {
    return initial;
  }

  return {
    ...initial,
    ...parsed,
    session: {
      ...initial.session,
      ...(parsed.session || {}),
      metadata: {
        ...initial.session.metadata,
        ...(parsed.session?.metadata || {}),
      },
    },
    hint: {
      ...initial.hint,
      ...(parsed.hint || {}),
    },
    robotAction: {
      ...initial.robotAction,
      ...(parsed.robotAction || {}),
    },
    telemetry: {
      ...initial.telemetry,
      ...(parsed.telemetry || {}),
      hrv: {
        ...initial.telemetry.hrv,
        ...(parsed.telemetry?.hrv || {}),
      },
      gaze: {
        ...initial.telemetry.gaze,
        ...(parsed.telemetry?.gaze || {}),
      },
      history: {
        hrv: Array.isArray(parsed.telemetry?.history?.hrv)
          ? parsed.telemetry.history.hrv
          : initial.telemetry.history.hrv,
        gaze: Array.isArray(parsed.telemetry?.history?.gaze)
          ? parsed.telemetry.history.gaze
          : initial.telemetry.history.gaze,
      },
    },
    adaptive: {
      ...initial.adaptive,
      ...(parsed.adaptive || {}),
      configuration: normalizeAdaptiveConfiguration(mergeAdaptiveConfiguration(
        initial.adaptive.configuration,
        parsed.adaptive?.configuration || {},
      )),
      defaults: clone(DEFAULT_ADAPTIVE_CONFIGURATION),
      contributingSignals: {
        ...initial.adaptive.contributingSignals,
        ...(parsed.adaptive?.contributingSignals || {}),
      },
    },
    preflight: {
      ...initial.preflight,
      ...(parsed.preflight || {}),
      acknowledgements: normalizePreflightAcknowledgements(parsed.preflight?.acknowledgements || {}),
    },
  };
}

function csvEscape(value) {
  const stringValue = value == null ? '' : String(value);
  if (!/[,"\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replaceAll('"', '""')}"`;
}

function eventCounts(events) {
  const counts = {};
  for (const event of events) {
    counts[event.type] = (counts[event.type] || 0) + 1;
  }
  return counts;
}

function secondsBetween(start, end) {
  if (!start || !end) {
    return null;
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return null;
  }

  return Math.max(0, Math.round((endTime - startTime) / 1000));
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
        this.state = hydrateState(parsed, this.now());
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
    const preservedBaseline = clone(this.state?.telemetry?.hrv?.baseline || null);
    this.state = createInitialState(this.now());
    this.state.session.resetCount = previousResetCount + 1;
    this.state.telemetry.hrv.baseline = preservedBaseline;

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

  async configureSession(payload = {}) {
    const nextMetadata = {
      ...this.state.session.metadata,
      studyId: String(payload.studyId || '').trim(),
      participantId: String(payload.participantId || '').trim(),
      condition: String(payload.condition || this.state.session.metadata.condition || 'adaptive').trim() || 'adaptive',
      researcher: String(payload.researcher || '').trim(),
      notes: String(payload.notes || '').trim(),
    };

    this.state.session = {
      ...this.state.session,
      metadata: nextMetadata,
    };

    const event = this.#createEvent('session.configured', {
      source: payload.source || 'admin',
      summary: `Session configured for participant ${nextMetadata.participantId || 'unassigned'}.`,
      payload: {
        metadata: clone(nextMetadata),
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async startSession(payload = {}) {
    const timestamp = toIsoDate(this.now());
    this.state.session = {
      ...this.state.session,
      status: 'running',
      trialStartedAt: timestamp,
      completedAt: null,
      completedSummary: null,
    };

    const event = this.#createEvent('session.started', {
      source: payload.source || 'admin',
      summary: `Session started by ${payload.operator || 'researcher'}.`,
      payload: {
        operator: payload.operator || 'researcher',
        trialStartedAt: timestamp,
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async completeSession(payload = {}) {
    const timestamp = toIsoDate(this.now());
    const completedSummary = String(payload.summary || '').trim() || null;
    this.state.session = {
      ...this.state.session,
      status: 'completed',
      completedAt: timestamp,
      completedSummary,
    };

    const event = this.#createEvent('session.completed', {
      source: payload.source || 'admin',
      summary: `Session completed by ${payload.operator || 'researcher'}.`,
      payload: {
        operator: payload.operator || 'researcher',
        completedAt: timestamp,
        summary: completedSummary,
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

  async updateAdaptiveConfiguration(payload = {}) {
    const nextConfiguration = normalizeAdaptiveConfiguration(mergeAdaptiveConfiguration(
      this.state.adaptive.configuration || DEFAULT_ADAPTIVE_CONFIGURATION,
      payload.configuration || payload,
    ));

    this.state.adaptive = {
      ...this.state.adaptive,
      configuration: nextConfiguration,
      defaults: clone(DEFAULT_ADAPTIVE_CONFIGURATION),
    };

    const configEvent = this.#createEvent('adaptive.configuration.updated', {
      source: payload.source || 'admin',
      summary: `Adaptive controls were updated by ${payload.actor || 'researcher'}.`,
      payload: {
        actor: payload.actor || 'researcher',
        configuration: clone(nextConfiguration),
      },
    });

    const adaptiveEvents = await this.#refreshAdaptiveState(payload.source || 'admin');
    await this.#persistAndBroadcast([configEvent, ...adaptiveEvents]);
    return this.getState();
  }

  async updatePreflightAcknowledgements(payload = {}) {
    const timestamp = toIsoDate(this.now());
    const incoming = payload.acknowledgements || {};
    const nextAcknowledgements = {
      ...this.state.preflight.acknowledgements,
    };

    for (const [key, value] of Object.entries(normalizePreflightAcknowledgements(incoming))) {
      if (Object.hasOwn(incoming, key)) {
        nextAcknowledgements[key] = value;
      }
    }

    this.state.preflight = {
      acknowledgements: nextAcknowledgements,
      updatedAt: timestamp,
      updatedBy: payload.actor || 'researcher',
    };

    const event = this.#createEvent('preflight.acknowledgements.updated', {
      source: payload.source || 'admin',
      summary: `Preflight checklist updated by ${payload.actor || 'researcher'}.`,
      payload: clone(this.state.preflight),
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
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
    const state = sessionId === this.getCurrentSessionId()
      ? this.getState()
      : this.#reconstructStateFromEvents(sessionId, sessionEvents);

    return {
      session: {
        id: sessionId,
        exportedAt: toIsoDate(this.now()),
        eventCount: sessionEvents.length,
      },
      state,
      analytics: this.#buildAnalytics(state, sessionEvents),
      replay: this.#buildReplay(sessionEvents),
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
    next.defaults = clone(DEFAULT_ADAPTIVE_CONFIGURATION);
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
      configuration: nextAdaptiveState.configuration,
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

  #reconstructStateFromEvents(sessionId, sessionEvents) {
    const reconstructed = createInitialState(this.now());
    reconstructed.session.id = sessionId;

    if (sessionEvents.length > 0) {
      reconstructed.session.startedAt = sessionEvents[0].timestamp;
    }

    for (const event of sessionEvents) {
      if (event.type === 'session.configured' && event.payload?.metadata) {
        reconstructed.session.metadata = {
          ...reconstructed.session.metadata,
          ...event.payload.metadata,
        };
      }

      if (event.type === 'session.started') {
        reconstructed.session.status = 'running';
        reconstructed.session.trialStartedAt = event.payload?.trialStartedAt || event.timestamp;
      }

      if (event.type === 'session.completed') {
        reconstructed.session.status = 'completed';
        reconstructed.session.completedAt = event.payload?.completedAt || event.timestamp;
        reconstructed.session.completedSummary = event.payload?.summary || null;
      }

      if (event.type === 'hint.updated' && event.payload) {
        reconstructed.hint = {
          ...reconstructed.hint,
          ...event.payload,
        };
      }

      if (event.type === 'robot.action.logged' && event.payload) {
        reconstructed.robotAction = {
          ...reconstructed.robotAction,
          ...event.payload,
        };
      }

      if (event.type === 'telemetry.hrv.updated' && event.payload) {
        reconstructed.telemetry.hrv = {
          ...reconstructed.telemetry.hrv,
          ...event.payload,
        };
      }

      if (event.type === 'telemetry.gaze.updated' && event.payload) {
        reconstructed.telemetry.gaze = {
          ...reconstructed.telemetry.gaze,
          ...event.payload,
        };
      }

      if (event.type === 'adaptive.status.changed' && event.payload) {
        reconstructed.adaptive = {
          ...reconstructed.adaptive,
          ...event.payload,
          configuration: normalizeAdaptiveConfiguration(mergeAdaptiveConfiguration(
            reconstructed.adaptive.configuration,
            event.payload.configuration || {},
          )),
          defaults: clone(DEFAULT_ADAPTIVE_CONFIGURATION),
        };
      }

      if (event.type === 'adaptive.configuration.updated' && event.payload?.configuration) {
        reconstructed.adaptive = {
          ...reconstructed.adaptive,
          configuration: normalizeAdaptiveConfiguration(mergeAdaptiveConfiguration(
            reconstructed.adaptive.configuration,
            event.payload.configuration,
          )),
          defaults: clone(DEFAULT_ADAPTIVE_CONFIGURATION),
        };
      }

      if (event.type === 'preflight.acknowledgements.updated' && event.payload) {
        reconstructed.preflight = {
          ...reconstructed.preflight,
          ...event.payload,
          acknowledgements: normalizePreflightAcknowledgements(event.payload.acknowledgements || {}),
        };
      }
    }

    return reconstructed;
  }

  #buildAnalytics(state, sessionEvents) {
    const counts = eventCounts(sessionEvents);
    const session = state.session || {};
    const firstEventAt = sessionEvents[0]?.timestamp || session.startedAt || null;
    const lastEventAt = sessionEvents.at(-1)?.timestamp || session.completedAt || session.trialStartedAt || null;
    const durationSeconds = secondsBetween(session.trialStartedAt || firstEventAt, session.completedAt || lastEventAt);

    return {
      sessionStatus: session.status || 'setup',
      eventCounts: counts,
      totalEvents: sessionEvents.length,
      durationSeconds,
      puzzleDurationSeconds: durationSeconds,
      trialStartedAt: session.trialStartedAt || null,
      completedAt: session.completedAt || null,
      firstEventAt,
      lastEventAt,
      latestHint: state.hint?.text || '',
      latestRobotAction: state.robotAction?.label || '',
      adaptiveTransitions: counts['adaptive.status.changed'] || 0,
      hrvFrames: counts['telemetry.hrv.updated'] || 0,
      gazeFrames: counts['telemetry.gaze.updated'] || 0,
      participantId: session.metadata?.participantId || '',
      condition: session.metadata?.condition || '',
      adaptiveConfiguration: clone(state.adaptive?.configuration || DEFAULT_ADAPTIVE_CONFIGURATION),
    };
  }

  #buildReplay(sessionEvents) {
    const firstTimestamp = sessionEvents[0]?.timestamp || null;
    const replayEvents = sessionEvents.map((event, index) => ({
      step: index + 1,
      type: event.type,
      source: event.source,
      timestamp: event.timestamp,
      offsetSeconds: secondsBetween(firstTimestamp, event.timestamp) || 0,
      summary: event.summary,
    }));

    return {
      totalSteps: replayEvents.length,
      events: replayEvents,
    };
  }
}

module.exports = {
  ExperimentStore,
  createInitialState,
  createSessionId,
};
