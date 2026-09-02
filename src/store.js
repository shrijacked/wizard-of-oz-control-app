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
const { setIdsForSitting } = require('./sitting-queue');
const {
  normalizeRecordings,
  publicRecording,
  recordingFileName,
} = require('./camera-recordings');

const MAX_HISTORY_POINTS = 60;
const MAX_TIMELINE_EVENTS = 200;
const MAX_PUZZLE_FILE_BYTES = 8 * 1024 * 1024;

const PUZZLE_MIME_TYPES = Object.freeze({
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.webp': 'image/webp',
});

const PUZZLE_EXTENSIONS = Object.freeze({
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

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

function createInitialAssetState() {
  return {
    puzzles: [],
    puzzleSets: [],
    incompleteUploads: [],
  };
}

function baseNameLabel(name = '') {
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return 'Reference puzzle';
  }

  return path.basename(trimmed, path.extname(trimmed)) || trimmed;
}

function inferPuzzleExtension(name = '', mimeType = '') {
  const extension = path.extname(String(name || '').trim()).toLowerCase();
  if (PUZZLE_MIME_TYPES[extension]) {
    return extension;
  }

  return PUZZLE_EXTENSIONS[String(mimeType || '').trim().toLowerCase()] || null;
}

function inferPuzzleMimeType(name = '', mimeType = '') {
  const normalizedMimeType = String(mimeType || '').trim().toLowerCase();
  if (PUZZLE_EXTENSIONS[normalizedMimeType]) {
    return normalizedMimeType;
  }

  const extension = inferPuzzleExtension(name, mimeType);
  return extension ? PUZZLE_MIME_TYPES[extension] : null;
}

function puzzleDisplayKind(mimeType = '') {
  return String(mimeType || '').trim().toLowerCase() === 'application/pdf' ? 'pdf' : 'image';
}

function normalizePuzzleAsset(asset = {}) {
  const assetId = String(asset.assetId || '').trim();
  const storedFileName = String(asset.storedFileName || '').trim();
  const originalName = String(asset.originalName || '').trim();
  const mimeType = inferPuzzleMimeType(originalName || storedFileName, asset.mimeType);

  if (!assetId || !storedFileName || !mimeType) {
    return null;
  }

  return {
    assetId,
    originalName: originalName || storedFileName,
    label: String(asset.label || '').trim() || baseNameLabel(originalName || storedFileName),
    mimeType,
    extension: inferPuzzleExtension(storedFileName, mimeType),
    storedFileName,
    sizeBytes: Number(asset.sizeBytes || 0),
    uploadedAt: asset.uploadedAt || null,
    uploadedBy: asset.uploadedBy || null,
    displayKind: puzzleDisplayKind(mimeType),
    urlPath: `/media/puzzles/${storedFileName}`,
  };
}

function puzzleBaseName(name = '') {
  return path.basename(String(name || '').trim(), path.extname(String(name || '').trim()));
}

function inferPuzzleRole(asset = {}) {
  const baseName = puzzleBaseName(asset.originalName || asset.storedFileName || '');
  if (!baseName) {
    return 'subject';
  }

  return baseName.endsWith('s') ? 'solution' : 'subject';
}

function inferPuzzleSetId(asset = {}) {
  const baseName = puzzleBaseName(asset.originalName || asset.storedFileName || '');
  if (!baseName) {
    return '';
  }

  if (baseName.endsWith('s') && baseName.length > 1) {
    return baseName.slice(0, -1);
  }

  return baseName;
}

function buildPuzzleCatalog(puzzles = []) {
  const groups = new Map();

  for (const asset of puzzles.map((entry) => normalizePuzzleAsset(entry)).filter(Boolean)) {
    const setId = inferPuzzleSetId(asset);
    if (!setId) {
      continue;
    }

    if (!groups.has(setId)) {
      groups.set(setId, {
        setId,
        label: setId,
        subjectAssets: [],
        solutionAssets: [],
      });
    }

    const group = groups.get(setId);
    if (inferPuzzleRole(asset) === 'solution') {
      group.solutionAssets.push(asset);
    } else {
      group.subjectAssets.push(asset);
    }
  }

  const usedAssetIds = new Set();
  const puzzleSets = [];

  for (const group of groups.values()) {
    const subjectAsset = group.subjectAssets.at(-1) || null;
    const solutionAsset = group.solutionAssets.at(-1) || null;
    if (!subjectAsset || !solutionAsset) {
      continue;
    }

    usedAssetIds.add(subjectAsset.assetId);
    usedAssetIds.add(solutionAsset.assetId);
    puzzleSets.push({
      setId: group.setId,
      label: group.label,
      subjectAsset,
      solutionAsset,
    });
  }

  return {
    puzzleSets: puzzleSets.sort((left, right) => left.setId.localeCompare(right.setId, undefined, { numeric: true, sensitivity: 'base' })),
    incompleteUploads: puzzles
      .map((entry) => normalizePuzzleAsset(entry))
      .filter((asset) => asset && !usedAssetIds.has(asset.assetId)),
  };
}

function createPuzzleSetSnapshot(puzzleSet, selection = {}) {
  if (!puzzleSet) {
    return null;
  }

  const subjectAsset = normalizePuzzleAsset(puzzleSet.subjectAsset);
  const solutionAsset = normalizePuzzleAsset(puzzleSet.solutionAsset);
  if (!subjectAsset || !solutionAsset) {
    return null;
  }

  return {
    setId: String(puzzleSet.setId || '').trim() || inferPuzzleSetId(subjectAsset),
    label: String(puzzleSet.label || '').trim() || inferPuzzleSetId(subjectAsset),
    subjectAsset,
    solutionAsset,
    selectedAt: selection.selectedAt || null,
    selectedBy: selection.selectedBy || null,
  };
}

function hydrateRound(round = {}) {
  const puzzle = createPuzzleSetSnapshot(round?.puzzle, {
    selectedAt: round?.puzzle?.selectedAt || null,
    selectedBy: round?.puzzle?.selectedBy || null,
  });
  if (!puzzle) {
    return null;
  }

  return {
    index: Number(round.index) || 0,
    puzzle,
    startedAt: round.startedAt || null,
    completedAt: round.completedAt || null,
    durationSeconds: Number.isFinite(round.durationSeconds) ? round.durationSeconds : null,
  };
}

function rebuildAssetState(assets = {}) {
  const puzzles = Array.isArray(assets.puzzles)
    ? assets.puzzles.map((asset) => normalizePuzzleAsset(asset)).filter(Boolean)
    : [];
  const catalog = buildPuzzleCatalog(puzzles);

  return {
    puzzles,
    puzzleSets: catalog.puzzleSets,
    incompleteUploads: catalog.incompleteUploads,
  };
}

function createInitialState(now = new Date(), options = {}) {
  const timestamp = toIsoDate(now);
  const plannedRounds = Number.isFinite(options.plannedRounds) && options.plannedRounds > 0
    ? Math.floor(options.plannedRounds)
    : 3;
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
        sittingNumber: 1,
        condition: 'adaptive',
        researcher: '',
        notes: '',
      },
      plannedRounds,
      queue: [],
      rounds: [],
      activeRound: null,
      puzzleSet: null,
      resetCount: 0,
      recordings: [],
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
    assets: createInitialAssetState(),
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
      plannedRounds: Number.isFinite(parsed.session?.plannedRounds) && parsed.session.plannedRounds > 0
        ? Math.floor(parsed.session.plannedRounds)
        : initial.session.plannedRounds,
      queue: Array.isArray(parsed.session?.queue)
        ? parsed.session.queue.map((entry) => createPuzzleSetSnapshot(entry, {
          selectedAt: entry?.selectedAt || null,
          selectedBy: entry?.selectedBy || null,
        })).filter(Boolean)
        : [],
      rounds: Array.isArray(parsed.session?.rounds)
        ? parsed.session.rounds.map((round) => hydrateRound(round)).filter(Boolean)
        : [],
      activeRound: parsed.session?.activeRound ? hydrateRound(parsed.session.activeRound) : null,
      puzzleSet: createPuzzleSetSnapshot(
        parsed.session?.puzzleSet,
        {
          selectedAt: parsed.session?.puzzleSet?.selectedAt || null,
          selectedBy: parsed.session?.puzzleSet?.selectedBy || null,
        },
      ),
      recordings: normalizeRecordings(parsed.session?.recordings).map((entry) => {
        const source = (parsed.session?.recordings || []).find((item) => item?.id === entry.id) || {};
        return {
          ...entry,
          lastIndex: Number.isFinite(source.lastIndex) ? source.lastIndex : -1,
          updatedAt: source.updatedAt || entry.startedAt,
        };
      }),
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
    assets: rebuildAssetState(parsed.assets || initial.assets),
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
    this.puzzleDir = path.join(this.dataDir, 'puzzles');
    this.recordingsDir = path.join(this.dataDir, 'recordings');
    this.recordingTokens = new Map();
    this.statePath = path.join(this.dataDir, 'state.json');
    this.eventsPath = path.join(this.dataDir, 'events.jsonl');
    this.adaptiveEngine = options.adaptiveEngine || new AdaptiveEngine();
    this.llmAdvisor = options.llmAdvisor || new LlmAdvisor();
    this.now = options.now || (() => new Date());
    this.plannedRounds = Number.isFinite(options.plannedRounds) && options.plannedRounds > 0
      ? Math.floor(options.plannedRounds)
      : (Number.isFinite(options.studyConfig?.plannedRounds) ? Math.floor(options.studyConfig.plannedRounds) : 3);
    this.tangramPuzzlesDir = options.tangramPuzzlesDir
      ? path.resolve(String(options.tangramPuzzlesDir))
      : null;
    this.state = createInitialState(this.now(), { plannedRounds: this.plannedRounds });
    this.timeline = [];
    this.writeQueue = Promise.resolve();
    this.lastAdvisorySignature = null;
  }

  async initialize() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.exportDir, { recursive: true });
    await fs.mkdir(this.puzzleDir, { recursive: true });
    await fs.mkdir(this.recordingsDir, { recursive: true });

    try {
      const raw = await fs.readFile(this.statePath, 'utf8');
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.session && parsed.telemetry && parsed.adaptive) {
          this.state = hydrateState(parsed, this.now());
        }
      } catch (parseError) {
        // A truncated or corrupt state file must never take a study machine down.
        // Preserve it for inspection and start from a clean state instead.
        const backupPath = `${this.statePath}.corrupt-${Date.now()}`;
        await fs.rename(this.statePath, backupPath).catch(() => {});
        // eslint-disable-next-line no-console
        console.error(`Corrupt state.json detected (${parseError.message}). Backed up to ${backupPath} and started fresh.`);
        await this.#writeState();
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await this.#writeState();
    }

    await this.#ensureCsvFile();
    await this.#loadRecordingTokens();
    await this.promoteStaleCameraRecordings();
    await this.seedPuzzleLibraryFromDir();
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

  recordingFilePath(recordingId) {
    return path.join(this.recordingsDir, this.state.session.id, `${recordingId}.webm`);
  }

  getCameraRecording(recordingId) {
    return (this.state.session.recordings || []).find((entry) => entry.id === recordingId) || null;
  }

  async promoteStaleCameraRecordings() {
    const staleAfterMs = 20_000;
    const nowMs = this.now().getTime();
    let changed = false;
    for (const entry of this.state.session.recordings || []) {
      if (entry.status !== 'recording') {
        continue;
      }
      const updatedMs = Date.parse(entry.updatedAt || entry.startedAt || '') || 0;
      if (nowMs - updatedMs < staleAfterMs) {
        continue;
      }
      entry.status = 'partial';
      entry.endedAt = toIsoDate(this.now());
      this.recordingTokens.delete(entry.id);
      changed = true;
    }
    if (changed) {
      await this.#saveRecordingTokens();
      await this.#persistAndBroadcast([{
        id: randomUUID(),
        timestamp: toIsoDate(this.now()),
        sessionId: this.state.session.id,
        type: 'camera_recording_stale',
        source: 'system',
        summary: 'Stale camera recording marked partial.',
        payload: {},
      }]);
    }
  }

  async finalizeOpenCameraRecordings({ reason } = {}) {
    for (const entry of [...(this.state.session.recordings || [])]) {
      if (entry.status === 'recording') {
        await this.finalizeCameraRecording(entry.id, { reason: reason || 'stop' });
      }
    }
  }

  async createCameraRecording() {
    await this.promoteStaleCameraRecordings();
    if ((this.state.session.recordings || []).some((entry) => entry.status === 'recording')) {
      const error = new Error('A recording is already in progress.');
      error.statusCode = 409;
      throw error;
    }

    const id = randomUUID();
    const token = randomUUID();
    const take = (this.state.session.recordings || []).length + 1;
    const timestamp = toIsoDate(this.now());
    const filename = recordingFileName({
      participantId: this.state.session.metadata.participantId,
      sittingNumber: this.state.session.metadata.sittingNumber,
      take,
    });
    this.state.session.recordings = [
      ...(this.state.session.recordings || []),
      {
        id,
        startedAt: timestamp,
        endedAt: null,
        bytes: 0,
        lastIndex: -1,
        mimeType: 'video/webm',
        filename,
        status: 'recording',
        updatedAt: timestamp,
      },
    ];
    this.recordingTokens.set(id, token);
    await fs.mkdir(path.dirname(this.recordingFilePath(id)), { recursive: true });
    await this.#saveRecordingTokens();
    await this.#persistAndBroadcast([{
      id: randomUUID(),
      timestamp,
      sessionId: this.state.session.id,
      type: 'camera_recording_started',
      source: 'admin',
      summary: `Camera recording started (${filename}).`,
      payload: { recordingId: id, filename },
    }]);
    return { recordingId: id, filename, finalizeToken: token };
  }

  async appendCameraRecordingChunk(recordingId, chunkIndex, buffer) {
    const record = this.getCameraRecording(recordingId);
    if (!record || record.status !== 'recording') {
      const error = new Error('Recording is not open.');
      error.statusCode = 409;
      throw error;
    }
    if (!Number.isInteger(chunkIndex) || chunkIndex !== record.lastIndex + 1) {
      const error = new Error('Chunk index is out of order.');
      error.statusCode = 409;
      throw error;
    }
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      const error = new Error('Chunk body is required.');
      error.statusCode = 400;
      throw error;
    }

    await fs.appendFile(this.recordingFilePath(recordingId), buffer);
    record.lastIndex = chunkIndex;
    record.bytes += buffer.length;
    record.updatedAt = toIsoDate(this.now());
    await this.#writeState();
    return { accepted: true, lastIndex: record.lastIndex, bytes: record.bytes };
  }

  async finalizeCameraRecording(recordingId, { token, reason } = {}) {
    const record = this.getCameraRecording(recordingId);
    if (!record) {
      const error = new Error('Recording not found.');
      error.statusCode = 404;
      throw error;
    }
    if (record.status !== 'recording') {
      return { ok: true, alreadyFinalized: true, status: record.status, bytes: record.bytes };
    }

    if (token) {
      const expected = this.recordingTokens.get(recordingId);
      if (!expected || expected !== token) {
        const error = new Error('Invalid finalize token.');
        error.statusCode = 403;
        throw error;
      }
    }

    record.status = record.bytes > 0 ? 'saved' : 'partial';
    record.endedAt = toIsoDate(this.now());
    record.updatedAt = record.endedAt;
    this.recordingTokens.delete(recordingId);
    await this.#saveRecordingTokens();
    await this.#persistAndBroadcast([{
      id: randomUUID(),
      timestamp: record.endedAt,
      sessionId: this.state.session.id,
      type: 'camera_recording_finalized',
      source: 'admin',
      summary: `Camera recording ${record.status} (${record.filename}).`,
      payload: { recordingId, status: record.status, bytes: record.bytes, reason: reason || 'stop' },
    }]);
    return { ok: true, alreadyFinalized: false, status: record.status, bytes: record.bytes };
  }

  recordingTokensPath() {
    return path.join(this.recordingsDir, this.state.session.id, 'tokens.json');
  }

  async #loadRecordingTokens() {
    this.recordingTokens = new Map();
    try {
      const parsed = JSON.parse(await fs.readFile(this.recordingTokensPath(), 'utf8'));
      if (parsed && typeof parsed === 'object') {
        this.recordingTokens = new Map(Object.entries(parsed).filter(([id, token]) => id && token));
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.recordingTokens = new Map();
      }
    }
  }

  async #saveRecordingTokens() {
    await fs.mkdir(path.dirname(this.recordingTokensPath()), { recursive: true });
    await fs.writeFile(
      this.recordingTokensPath(),
      `${JSON.stringify(Object.fromEntries(this.recordingTokens), null, 2)}\n`,
    );
  }

  async resetSession(meta = {}) {
    await this.finalizeOpenCameraRecordings({ reason: 'reset' });
    this.recordingTokens.clear();
    const previousResetCount = Number(this.state?.session?.resetCount || 0);
    const preservedBaseline = clone(this.state?.telemetry?.hrv?.baseline || null);
    const preservedAssets = clone(this.state?.assets || createInitialAssetState());
    this.state = createInitialState(this.now(), { plannedRounds: this.plannedRounds });
    this.state.session.resetCount = previousResetCount + 1;
    this.state.telemetry.hrv.baseline = preservedBaseline;
    this.state.assets = preservedAssets;

    const event = this.#createEvent('session.reset', {
      source: meta.source || 'admin',
      summary: 'The experiment session was reset.',
      payload: {
        requestedBy: meta.requestedBy || 'researcher',
      },
    });

    await this.#persistAndBroadcast([event]);
    await this.#syncSittingQueue({
      actor: meta.requestedBy || 'researcher',
      source: meta.source || 'admin',
    });
    return this.getState();
  }

  async configureSession(payload = {}) {
    const sittingNumber = Number.isFinite(Number(payload.sittingNumber)) && Number(payload.sittingNumber) > 0
      ? Math.floor(Number(payload.sittingNumber))
      : (this.state.session.metadata.sittingNumber || 1);
    const nextMetadata = {
      ...this.state.session.metadata,
      studyId: String(payload.studyId || '').trim(),
      participantId: String(payload.participantId || '').trim(),
      sittingNumber,
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
    await this.#syncSittingQueue({
      actor: payload.actor || nextMetadata.researcher || 'researcher',
      source: payload.source || 'admin',
    });
    return this.getState();
  }

  async uploadPuzzleAssets(files = [], meta = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Select at least one puzzle file to upload.');
    }

    const uploadedAt = toIsoDate(this.now());
    const uploadedBy = meta.actor || 'researcher';
    const preparedAssets = await Promise.all(files.map((file) => this.#preparePuzzleAsset(file, {
      uploadedAt,
      uploadedBy,
    })));

    await Promise.all(preparedAssets.map((entry) => fs.writeFile(
      path.join(this.puzzleDir, entry.asset.storedFileName),
      entry.buffer,
    )));

    this.state.assets = rebuildAssetState({
      puzzles: [...this.state.assets.puzzles, ...preparedAssets.map((entry) => entry.asset)],
    });

    const event = this.#createEvent('puzzle.library.uploaded', {
      source: meta.source || 'admin',
      summary: `Uploaded ${preparedAssets.length} puzzle file${preparedAssets.length === 1 ? '' : 's'}.`,
      payload: {
        actor: uploadedBy,
        assets: clone(preparedAssets.map((entry) => entry.asset)),
      },
    });

    await this.#persistAndBroadcast([event]);
    const catalog = buildPuzzleCatalog(this.state.assets.puzzles);
    await this.#syncSittingQueue({
      actor: uploadedBy,
      source: meta.source || 'admin',
    });
    return {
      uploaded: preparedAssets.map((entry) => entry.asset),
      puzzleSets: clone(catalog.puzzleSets),
      incompleteUploads: clone(catalog.incompleteUploads),
      state: this.getState(),
    };
  }

  async seedPuzzleLibraryFromDir(sourceDir = this.tangramPuzzlesDir, meta = {}) {
    if (!sourceDir) {
      return {
        seeded: [],
        puzzleSets: clone(this.state.assets.puzzleSets),
        state: this.getState(),
      };
    }

    let names;
    try {
      names = await fs.readdir(sourceDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          seeded: [],
          puzzleSets: clone(this.state.assets.puzzleSets),
          state: this.getState(),
        };
      }
      throw error;
    }

    const existingNames = new Set(this.state.assets.puzzles.map((asset) => asset.originalName));
    const uploadedAt = toIsoDate(this.now());
    const uploadedBy = meta.actor || 'tangram-library';
    const preparedAssets = [];

    for (const name of names.sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))) {
      if (existingNames.has(name) || !inferPuzzleMimeType(name)) {
        continue;
      }

      const buffer = await fs.readFile(path.join(sourceDir, name));
      if (!buffer.length) {
        continue;
      }

      preparedAssets.push(await this.#preparePuzzleAsset({
        name,
        mimeType: inferPuzzleMimeType(name),
        buffer,
      }, {
        uploadedAt,
        uploadedBy,
      }));
    }

    if (preparedAssets.length === 0) {
      await this.#syncSittingQueue({
        actor: uploadedBy,
        source: meta.source || 'system',
      });
      return {
        seeded: [],
        puzzleSets: clone(this.state.assets.puzzleSets),
        state: this.getState(),
      };
    }

    await Promise.all(preparedAssets.map((entry) => fs.writeFile(
      path.join(this.puzzleDir, entry.asset.storedFileName),
      entry.buffer,
    )));

    this.state.assets = rebuildAssetState({
      puzzles: [...this.state.assets.puzzles, ...preparedAssets.map((entry) => entry.asset)],
    });

    const event = this.#createEvent('puzzle.library.uploaded', {
      source: meta.source || 'system',
      summary: `Loaded ${preparedAssets.length} tangram file${preparedAssets.length === 1 ? '' : 's'} from the study folder.`,
      payload: {
        actor: uploadedBy,
        assets: clone(preparedAssets.map((entry) => entry.asset)),
      },
    });

    await this.#persistAndBroadcast([event]);
    await this.#syncSittingQueue({
      actor: uploadedBy,
      source: meta.source || 'system',
    });

    return {
      seeded: preparedAssets.map((entry) => entry.asset),
      puzzleSets: clone(this.state.assets.puzzleSets),
      state: this.getState(),
    };
  }

  async queuePuzzleSets(payload = {}) {
    const actor = payload.actor || 'researcher';
    const selectedAt = toIsoDate(this.now());
    const setIds = Array.isArray(payload.setIds) ? payload.setIds.map((id) => String(id || '').trim()).filter(Boolean) : [];

    const queue = setIds.map((setId) => {
      const matchedPuzzleSet = this.state.assets.puzzleSets.find((entry) => entry.setId === setId);
      if (!matchedPuzzleSet) {
        throw new Error(`Puzzle set ${setId} was not found in the library.`);
      }

      return createPuzzleSetSnapshot(matchedPuzzleSet, { selectedAt, selectedBy: actor });
    });

    this.state.session = {
      ...this.state.session,
      queue,
    };

    const event = this.#createEvent('session.queue.updated', {
      source: payload.source || 'admin',
      summary: queue.length
        ? `Queued ${queue.length} puzzle${queue.length === 1 ? '' : 's'} for this sitting.`
        : 'Cleared the puzzle queue for this sitting.',
      payload: {
        actor,
        setIds: queue.map((entry) => entry.setId),
        queue: clone(queue),
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async #syncSittingQueue(meta = {}) {
    if (this.state.session.status !== 'setup') {
      return this.getState();
    }

    const sittingNumber = this.state.session.metadata.sittingNumber || 1;
    const setIds = setIdsForSitting(sittingNumber).filter((setId) => (
      this.state.assets.puzzleSets.some((entry) => entry.setId === setId)
    ));

    if (setIds.length === 0) {
      return this.getState();
    }

    const current = this.state.session.queue.map((entry) => entry.setId);
    if (current.length === setIds.length && current.every((setId, index) => setId === setIds[index])) {
      return this.getState();
    }

    return this.queuePuzzleSets({
      setIds,
      actor: meta.actor || 'researcher',
      source: meta.source || 'system',
    });
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
      summary: `Sitting started by ${payload.operator || 'researcher'}.`,
      payload: {
        operator: payload.operator || 'researcher',
        trialStartedAt: timestamp,
        queuedSetIds: this.state.session.queue.map((entry) => entry.setId),
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async startRound(payload = {}) {
    const session = this.state.session;
    const nextIndex = session.rounds.length;
    const puzzle = session.queue[nextIndex];
    if (!puzzle) {
      throw new Error('No queued puzzle is available for the next round.');
    }

    const startedAt = toIsoDate(this.now());
    const activeRound = {
      index: nextIndex + 1,
      puzzle: clone(puzzle),
      startedAt,
      completedAt: null,
      durationSeconds: null,
    };

    this.state.session = {
      ...session,
      activeRound,
      puzzleSet: clone(puzzle),
    };

    const event = this.#createEvent('round.started', {
      source: payload.source || 'admin',
      summary: `Round ${activeRound.index} started on puzzle ${puzzle.setId}.`,
      payload: {
        index: activeRound.index,
        puzzle: clone(puzzle),
        startedAt,
        operator: payload.operator || 'researcher',
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async completeRound(payload = {}) {
    const session = this.state.session;
    const activeRound = session.activeRound;
    if (!activeRound) {
      throw new Error('No round is currently active.');
    }

    const completedAt = toIsoDate(this.now());
    const completedRound = {
      ...activeRound,
      completedAt,
      durationSeconds: secondsBetween(activeRound.startedAt, completedAt),
    };

    this.state.session = {
      ...session,
      rounds: [...session.rounds, completedRound],
      activeRound: null,
      puzzleSet: null,
    };

    const event = this.#createEvent('round.completed', {
      source: payload.source || 'admin',
      summary: `Round ${completedRound.index} completed on puzzle ${completedRound.puzzle.setId}.`,
      payload: {
        index: completedRound.index,
        puzzle: clone(completedRound.puzzle),
        startedAt: completedRound.startedAt,
        completedAt,
        durationSeconds: completedRound.durationSeconds,
        operator: payload.operator || 'researcher',
      },
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async copyDownloadableRecordingsToExport() {
    const sessionId = this.state.session.id;
    const destDir = path.join(this.exportDir, sessionId);
    await fs.mkdir(destDir, { recursive: true });
    for (const entry of this.state.session.recordings || []) {
      if (entry.status !== 'saved' && entry.status !== 'partial') {
        continue;
      }
      try {
        await fs.copyFile(this.recordingFilePath(entry.id), path.join(destDir, entry.filename));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  async completeSession(payload = {}) {
    await this.finalizeOpenCameraRecordings({ reason: 'complete' });
    await this.copyDownloadableRecordingsToExport();
    const events = [];

    // Auto-close a round that is still open so the sitting always ends cleanly.
    if (this.state.session.activeRound) {
      const activeRound = this.state.session.activeRound;
      const roundCompletedAt = toIsoDate(this.now());
      const completedRound = {
        ...activeRound,
        completedAt: roundCompletedAt,
        durationSeconds: secondsBetween(activeRound.startedAt, roundCompletedAt),
      };
      this.state.session = {
        ...this.state.session,
        rounds: [...this.state.session.rounds, completedRound],
        activeRound: null,
        puzzleSet: null,
      };
      events.push(this.#createEvent('round.completed', {
        source: payload.source || 'admin',
        summary: `Round ${completedRound.index} completed on puzzle ${completedRound.puzzle.setId}.`,
        payload: {
          index: completedRound.index,
          puzzle: clone(completedRound.puzzle),
          startedAt: completedRound.startedAt,
          completedAt: roundCompletedAt,
          durationSeconds: completedRound.durationSeconds,
          operator: payload.operator || 'researcher',
          autoClosed: true,
        },
      }));
    }

    const timestamp = toIsoDate(this.now());
    const completedSummary = String(payload.summary || '').trim() || null;
    this.state.session = {
      ...this.state.session,
      status: 'completed',
      completedAt: timestamp,
      completedSummary,
    };

    events.push(this.#createEvent('session.completed', {
      source: payload.source || 'admin',
      summary: `Sitting completed by ${payload.operator || 'researcher'}.`,
      payload: {
        operator: payload.operator || 'researcher',
        completedAt: timestamp,
        summary: completedSummary,
        roundsCompleted: this.state.session.rounds.length,
      },
    }));

    await this.#persistAndBroadcast(events);
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
    const pieceId = String(payload.pieceId || payload.actionId || '').trim();
    const pieceLabel = String(payload.pieceLabel || '').trim();
    const slot = Number(payload.slot);

    if (!pieceLabel) {
      throw new Error('A piece is required for a robot cue.');
    }

    if (!Number.isFinite(slot) || slot <= 0) {
      throw new Error('A destination slot is required for a robot cue.');
    }

    const label = String(payload.label || '').trim() || `Move ${pieceLabel.toUpperCase()} to slot ${slot}`;
    const timestamp = toIsoDate(this.now());
    this.state.robotAction = {
      actionId: pieceId || null,
      pieceId: pieceId || null,
      pieceLabel,
      slot,
      label,
      payload: payload.payload || null,
      actor: payload.actor || 'researcher',
      updatedAt: timestamp,
    };

    const event = this.#createEvent('robot.action.logged', {
      source: payload.source || 'admin',
      summary: `Robot cue: ${label}`,
      payload: clone(this.state.robotAction),
    });

    await this.#persistAndBroadcast([event]);
    return this.getState();
  }

  async clearHint(payload = {}) {
    const timestamp = toIsoDate(this.now());
    this.state.hint = {
      text: '',
      updatedAt: timestamp,
      author: payload.author || 'researcher',
    };

    const event = this.#createEvent('hint.cleared', {
      source: payload.source || 'admin',
      summary: 'Subject hint screen was cleared.',
      payload: clone(this.state.hint),
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

  async buildOperatorExport(sessionIdInput) {
    const sessionId = this.#resolveSessionId(sessionIdInput);
    const events = await this.#readPersistedEvents();
    const sessionEvents = events.filter((event) => event.sessionId === sessionId);
    const state = sessionId === this.getCurrentSessionId()
      ? this.getState()
      : this.#reconstructStateFromEvents(sessionId, sessionEvents);
    const session = state.session || {};
    const rounds = this.#buildRoundExports(sessionEvents);
    const totalDurationSeconds = rounds.reduce(
      (total, round) => total + (Number.isFinite(round.durationSeconds) ? round.durationSeconds : 0),
      0,
    );

    return {
      sessionId,
      startedAt: session.startedAt || null,
      trialStartedAt: session.trialStartedAt || null,
      completedAt: session.completedAt || null,
      metadata: clone(session.metadata || {}),
      plannedRounds: session.plannedRounds || rounds.length,
      roundsCompleted: rounds.length,
      totalDurationSeconds,
      rounds,
      recordings: (session.recordings || []).map((entry) => publicRecording(entry)),
    };
  }

  #buildRoundExports(sessionEvents) {
    const rounds = [];
    let current = null;

    const pushIntervention = (event) => {
      if (!current) {
        return;
      }

      if (event.type === 'hint.updated') {
        current.interventions.push({
          type: 'hint',
          at: event.timestamp,
          offsetSeconds: secondsBetween(current.startedAt, event.timestamp) || 0,
          text: event.payload?.text || '',
        });
      } else if (event.type === 'robot.action.logged') {
        current.interventions.push({
          type: 'robot',
          at: event.timestamp,
          offsetSeconds: secondsBetween(current.startedAt, event.timestamp) || 0,
          pieceId: event.payload?.pieceId || event.payload?.actionId || '',
          piece: event.payload?.pieceLabel || '',
          slot: Number.isFinite(event.payload?.slot) ? event.payload.slot : null,
          label: event.payload?.label || '',
        });
      }
    };

    for (const event of sessionEvents) {
      if (event.type === 'round.started') {
        current = {
          index: event.payload?.index || rounds.length + 1,
          puzzle: {
            setId: event.payload?.puzzle?.setId || '',
            label: event.payload?.puzzle?.label || '',
            subjectFile: event.payload?.puzzle?.subjectAsset?.originalName || '',
            solutionFile: event.payload?.puzzle?.solutionAsset?.originalName || '',
          },
          startedAt: event.payload?.startedAt || event.timestamp,
          completedAt: null,
          durationSeconds: null,
          interventions: [],
        };
        continue;
      }

      if (event.type === 'round.completed') {
        if (current) {
          current.completedAt = event.payload?.completedAt || event.timestamp;
          current.durationSeconds = Number.isFinite(event.payload?.durationSeconds)
            ? event.payload.durationSeconds
            : secondsBetween(current.startedAt, current.completedAt);
          rounds.push(current);
          current = null;
        }
        continue;
      }

      pushIntervention(event);
    }

    if (current) {
      rounds.push(current);
    }

    return rounds;
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
    // Write to a temp file and rename so a crash mid-write can never leave a
    // truncated state.json that would fail to parse on the next boot.
    const tempPath = `${this.statePath}.tmp-${process.pid}`;
    await fs.writeFile(tempPath, JSON.stringify(this.state, null, 2), 'utf8');
    await fs.rename(tempPath, this.statePath);
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

    // Session ids only ever contain these characters; reject anything that could
    // be used to traverse out of the export directory.
    if (!/^[A-Za-z0-9._-]+$/.test(sessionId) || sessionId.includes('..')) {
      const error = new Error('Invalid session identifier.');
      error.statusCode = 400;
      throw error;
    }

    return sessionId;
  }

  #csvPathForSession(sessionId = this.state.session.id) {
    const csvPath = path.join(this.exportDir, `${sessionId}.csv`);
    const relative = path.relative(this.exportDir, csvPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      const error = new Error('Invalid session identifier.');
      error.statusCode = 400;
      throw error;
    }

    return csvPath;
  }

  async #preparePuzzleAsset(file = {}, meta = {}) {
    const originalName = String(file.name || file.originalName || '').trim();
    if (!originalName) {
      throw new Error('Every uploaded puzzle file needs a filename.');
    }

    const mimeType = inferPuzzleMimeType(originalName, file.mimeType || file.type);
    if (!mimeType) {
      throw new Error(`Unsupported puzzle file type for ${originalName}. Use PNG, JPG, WEBP, or PDF.`);
    }

    const buffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(String(file.contentBase64 || '').trim(), 'base64');

    if (!buffer.length) {
      throw new Error(`Uploaded puzzle file ${originalName} was empty.`);
    }

    if (buffer.length > MAX_PUZZLE_FILE_BYTES) {
      throw new Error(`Uploaded puzzle file ${originalName} exceeded the ${MAX_PUZZLE_FILE_BYTES} byte limit.`);
    }

    const extension = inferPuzzleExtension(originalName, mimeType);
    const assetId = randomUUID();
    const storedFileName = `${assetId}${extension}`;
    const asset = normalizePuzzleAsset({
      assetId,
      originalName,
      storedFileName,
      mimeType,
      sizeBytes: buffer.length,
      uploadedAt: meta.uploadedAt || null,
      uploadedBy: meta.uploadedBy || null,
    });

    return {
      asset,
      buffer,
    };
  }

  #reconstructStateFromEvents(sessionId, sessionEvents) {
    const reconstructed = createInitialState(this.now(), { plannedRounds: this.plannedRounds });
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

      if (event.type === 'puzzle.library.uploaded' && Array.isArray(event.payload?.assets)) {
        const uploadedAssets = event.payload.assets
          .map((asset) => normalizePuzzleAsset(asset))
          .filter(Boolean);
        reconstructed.assets = rebuildAssetState({
          puzzles: [
            ...reconstructed.assets.puzzles.filter((existing) => !uploadedAssets.some((asset) => asset.assetId === existing.assetId)),
            ...uploadedAssets,
          ],
        });
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

      if (event.type === 'session.queue.updated' && Array.isArray(event.payload?.queue)) {
        reconstructed.session.queue = event.payload.queue
          .map((entry) => createPuzzleSetSnapshot(entry, {
            selectedAt: entry?.selectedAt || null,
            selectedBy: entry?.selectedBy || null,
          }))
          .filter(Boolean);
      }

      if (event.type === 'round.started' && event.payload?.puzzle) {
        const puzzle = createPuzzleSetSnapshot(event.payload.puzzle, {
          selectedAt: event.payload.puzzle?.selectedAt || null,
          selectedBy: event.payload.puzzle?.selectedBy || null,
        });
        reconstructed.session.activeRound = {
          index: event.payload.index || reconstructed.session.rounds.length + 1,
          puzzle,
          startedAt: event.payload.startedAt || event.timestamp,
          completedAt: null,
          durationSeconds: null,
        };
        reconstructed.session.puzzleSet = puzzle;
      }

      if (event.type === 'round.completed' && event.payload?.puzzle) {
        const puzzle = createPuzzleSetSnapshot(event.payload.puzzle, {
          selectedAt: event.payload.puzzle?.selectedAt || null,
          selectedBy: event.payload.puzzle?.selectedBy || null,
        });
        reconstructed.session.rounds.push({
          index: event.payload.index || reconstructed.session.rounds.length + 1,
          puzzle,
          startedAt: event.payload.startedAt || null,
          completedAt: event.payload.completedAt || event.timestamp,
          durationSeconds: Number.isFinite(event.payload.durationSeconds) ? event.payload.durationSeconds : null,
        });
        reconstructed.session.activeRound = null;
        reconstructed.session.puzzleSet = null;
      }

      if (event.type === 'hint.updated' && event.payload) {
        reconstructed.hint = {
          ...reconstructed.hint,
          ...event.payload,
        };
      }

      if (event.type === 'hint.cleared' && event.payload) {
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
      referencePuzzleLabel: state.session?.puzzleSet?.subjectAsset?.originalName || '',
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
