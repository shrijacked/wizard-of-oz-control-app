'use strict';

const { createReadStream } = require('node:fs');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const { AdminGuard } = require('./admin-guard');
const { ExperimentStore } = require('./store');
const { WebSocketHub } = require('./websocket-hub');
const { WatchBridge } = require('./watch-bridge');
const { getLocalHostnameUrls, getLocalNetworkAddresses } = require('./network');
const { LlmAdvisor } = require('./llm-advisor');
const { summarizeSensorHealth } = require('./sensor-health');
const { summarizePreflight } = require('./preflight');
const { assertPolicy, buildPolicy } = require('./session-policy');
const { loadStudyConfig, normalizeStudyConfig, saveStudyConfig } = require('./study-config');
const { CONSENT_STATEMENT, SUBJECT_INSTRUCTIONS } = require('./surveys');

// Requests carry base64-encoded puzzle uploads (up to ~8 MB raw), so the JSON
// body cap sits above that with headroom but still bounds memory per request.
const MAX_REQUEST_BODY_BYTES = 16 * 1024 * 1024;

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

const SCRIPT_AUDIO_TYPES = Object.freeze({
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
});
const MAX_SCRIPT_TEXT_BYTES = 256 * 1024;
const MAX_SCRIPT_AUDIO_BYTES = 10 * 1024 * 1024;

function scriptInstructions(textValue) {
  return String(textValue || '')
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function uploadedBuffer(file = {}) {
  return Buffer.from(String(file.contentBase64 || '').trim(), 'base64');
}

const OPERATOR_ROUTE_FILES = {
  '/admin': 'admin.html',
  '/admin/setup': 'admin.html',
  '/admin/live': 'admin.html',
  '/admin/monitoring': 'admin.html',
  '/admin/review': 'admin.html',
};

function json(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    ...headers,
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request, maxBytes = MAX_REQUEST_BODY_BYTES) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readBinaryBody(request, maxBytes = MAX_REQUEST_BODY_BYTES) {
  const chunks = [];
  let total = 0;

  for await (const chunk of request) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error('Request body is too large.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function parseCameraRecordingPath(pathname) {
  const match = String(pathname || '').match(/^\/api\/camera\/recordings(?:\/([^/]+)(?:\/(chunk|finalize))?)?$/);
  if (!match) {
    return null;
  }

  return {
    recordingId: match[1] || null,
    action: match[2] || null,
  };
}

function isRecordingId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

async function serveCameraRecording(response, filePath, filename) {
  try {
    const stat = await fs.stat(filePath);
    response.writeHead(200, {
      'content-type': 'video/webm',
      'content-length': stat.size,
      'content-disposition': `attachment; filename="${String(filename || 'table-recording.webm').replace(/"/g, '')}"`,
    });
    await new Promise((resolve, reject) => {
      const stream = createReadStream(filePath);
      stream.on('error', reject);
      response.on('finish', resolve);
      stream.pipe(response);
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      json(response, 404, { error: 'Recording file not found.' });
      return;
    }
    throw error;
  }
}

function roleState(store, role, systemStatus, studyDefinition = {}) {
  const state = store.getState();

  if (role === 'subject') {
    const pendingRound = state.session.awaitingRoundSurvey
      ? state.session.rounds.find((round) => round.index === state.session.awaitingRoundSurvey)
      : null;
    return {
      session: {
        id: state.session.id,
        status: state.session.status,
        participantId: state.session.metadata.participantId,
        plannedRounds: state.session.plannedRounds,
        roundsPerSitting: state.session.roundsPerSitting,
        completedRounds: state.session.rounds.length,
        betweenSittings: state.session.betweenSittings,
        awaitingRoundSurvey: state.session.awaitingRoundSurvey,
        finalSurveyRequired: state.session.finalSurveyRequired,
        finalSurveySubmitted: Boolean(state.session.finalSurvey),
        participantProfile: state.session.participantProfiles?.subject || null,
        roundDurationSeconds: state.session.metadata.roundDurationSeconds,
        activeRound: state.session.activeRound
          ? {
            index: state.session.activeRound.index,
            sittingNumber: state.session.activeRound.sittingNumber,
            startedAt: state.session.activeRound.startedAt,
            pauseStartedAt: state.session.activeRound.pauseStartedAt,
            pausedDurationSeconds: state.session.activeRound.pausedDurationSeconds,
            puzzle: state.session.activeRound.puzzle
              ? {
                setId: state.session.activeRound.puzzle.setId,
                label: state.session.activeRound.puzzle.label,
                subjectAsset: state.session.activeRound.puzzle.subjectAsset,
              }
              : null,
          }
          : null,
        pendingSurvey: pendingRound ? {
          roundIndex: pendingRound.index,
          sittingNumber: pendingRound.sittingNumber,
          condition: pendingRound.condition,
        } : null,
      },
      hint: state.hint,
      robotCueUpdatedAt: state.robotAction.updatedAt,
      study: {
        consentStatement: CONSENT_STATEMENT,
        instructions: studyDefinition.instructions || SUBJECT_INSTRUCTIONS,
        scriptAudioUrl: studyDefinition.scriptAudioUrl || null,
        scriptAudioName: studyDefinition.scriptAudioName || null,
      },
    };
  }

  if (role === 'robot' || role === 'audit') {
    return {
      session: {
        status: state.session.status,
        activeRound: state.session.activeRound
          ? { index: state.session.activeRound.index }
          : null,
      },
      robotAction: state.robotAction,
    };
  }

  return {
    ...state,
    system: systemStatus,
  };
}

async function serveFile(response, filePath) {
  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, { 'content-type': CONTENT_TYPES[extension] || 'application/octet-stream' });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    throw error;
  }
}

function text(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    ...headers,
  });
  response.end(payload);
}

function buildLocalhostUrls(port) {
  return {
    admin: `http://localhost:${port}/admin`,
    subject: `http://localhost:${port}/subject`,
    robot: `http://localhost:${port}/robot`,
    audit: `http://localhost:${port}/audit`,
  };
}

async function createApp(options = {}) {
  const port = Number(options.port || process.env.PORT || 3000);
  const publicDir = options.publicDir || path.join(process.cwd(), 'public');
  const defaultStudyConfigPath = path.join(process.cwd(), 'config', 'study.json');
  const studyConfigPath = options.studyConfigPath
    || (options.studyConfig ? null : defaultStudyConfigPath);
  const studyConfig = normalizeStudyConfig(
    options.studyConfig || loadStudyConfig(studyConfigPath || defaultStudyConfigPath),
  );
  const adminGuard = options.adminGuard || new AdminGuard({
    pin: options.adminPin,
  });
  const tangramPuzzlesDir = options.tangramPuzzlesDir === null || options.seedPuzzles === false
    ? null
    : (options.tangramPuzzlesDir || path.resolve(process.cwd(), studyConfig.tangramPuzzlesDir || 'tangram puzzles'));
  const store = options.store || new ExperimentStore({
    dataDir: options.dataDir,
    adaptiveEngine: options.adaptiveEngine,
    llmAdvisor: options.llmAdvisor || new LlmAdvisor(),
    plannedRounds: studyConfig.plannedRounds,
    roundsPerSitting: studyConfig.roundsPerSitting,
    roundDurationSeconds: studyConfig.roundDurationSeconds,
    constantIntervalSeconds: studyConfig.constantIntervalSeconds,
    tangramPuzzlesDir,
  });

  // Tracks whether each display device has reported in (connected + sound armed)
  // so the operator can see readiness before starting a sitting.
  const screenReadiness = {
    subject: { ready: false, updatedAt: null },
    robot: { ready: false, updatedAt: null },
  };
  const cameraStatus = {
    live: false,
    deviceLabel: null,
    deviceId: null,
    updatedAt: null,
  };

  const pieceById = new Map(studyConfig.pieces.map((piece) => [piece.id, piece]));
  const pieceByLabel = new Map(studyConfig.pieces.map((piece) => [piece.label.toLowerCase(), piece]));
  const watchBridge = options.watchBridge || new WatchBridge({
    store,
    watchFilePath: options.watchFilePath || path.join(process.cwd(), 'watch', 'watch_data.json'),
  });
  await store.initialize();
  const scriptDir = path.join(store.dataDir, 'study-script');
  const scriptManifestPath = path.join(scriptDir, 'manifest.json');
  await fs.mkdir(scriptDir, { recursive: true });
  let studyScript = {
    text: SUBJECT_INSTRUCTIONS.join('\n'),
    customTextName: null,
    audioFileName: null,
    audioOriginalName: null,
  };
  try {
    const persisted = JSON.parse(await fs.readFile(scriptManifestPath, 'utf8'));
    if (typeof persisted.text === 'string' && persisted.text.trim()) {
      studyScript = { ...studyScript, ...persisted };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      // A damaged optional script should not prevent the experiment from opening.
      studyScript = { ...studyScript };
    }
  }
  const getStudyDefinition = () => ({
    instructions: scriptInstructions(studyScript.text).length
      ? scriptInstructions(studyScript.text)
      : SUBJECT_INSTRUCTIONS,
    scriptAudioUrl: studyScript.audioFileName
      ? `/media/study-script/${studyScript.audioFileName}`
      : null,
    scriptAudioName: studyScript.audioOriginalName || null,
    customTextName: studyScript.customTextName || null,
  });
  await watchBridge.start();

  const getAdminToken = (request) => request.headers['x-admin-token'];

  const getBaseSystemStatus = () => {
    const state = store.getState();
    const watchStatus = watchBridge.getStatus();
    const connections = hub.getConnectionStats();
    const sensorHealth = summarizeSensorHealth({
      sessionStatus: state.session.status,
      watchBridge: watchStatus,
      telemetry: state.telemetry,
    });

    return {
      watchBridge: watchStatus,
      sensorHealth,
      camera: { ...cameraStatus },
      safeguards: adminGuard.getPublicStatus(),
      connections,
      study: {
        plannedRounds: studyConfig.plannedRounds,
        roundsPerSitting: studyConfig.roundsPerSitting,
        roundDurationSeconds: studyConfig.roundDurationSeconds,
        constantIntervalSeconds: studyConfig.constantIntervalSeconds,
        slotCount: studyConfig.slotCount,
        pieces: studyConfig.pieces,
        hintPresets: studyConfig.hintPresets,
        consentStatement: CONSENT_STATEMENT,
        ...getStudyDefinition(),
      },
      screens: {
        subject: {
          connected: (connections.subject || 0) > 0,
          ready: screenReadiness.subject.ready,
          updatedAt: screenReadiness.subject.updatedAt,
        },
        robot: {
          connected: (connections.robot || 0) > 0,
          ready: screenReadiness.robot.ready,
          updatedAt: screenReadiness.robot.updatedAt,
        },
      },
      network: {
        localhost: buildLocalhostUrls(port),
        stableHost: getLocalHostnameUrls(port),
        lan: getLocalNetworkAddresses(port),
      },
    };
  };

  const getSystemStatus = () => {
    const state = store.getState();
    const system = getBaseSystemStatus();

    return {
      ...system,
      preflight: summarizePreflight({
        state,
        system,
      }),
    };
  };

  const clearDisconnectedScreenReadiness = (stats) => {
    for (const role of ['subject', 'robot']) {
      if ((stats[role] || 0) > 0 || !screenReadiness[role].ready) {
        continue;
      }

      screenReadiness[role] = {
        ready: false,
        updatedAt: new Date().toISOString(),
      };
    }
  };

  const hub = new WebSocketHub({
    getStateForRole: (role) => roleState(store, role, getSystemStatus(), getStudyDefinition()),
    getSystemStatus,
    onConnectionStatsChanged(stats) {
      clearDisconnectedScreenReadiness(stats);
      hub.broadcastSnapshots();
    },
  });

  store.on('state', () => {
    hub.broadcastSnapshots();
  });

  store.on('event', ({ event }) => {
    hub.broadcastEvent(event);
  });

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (request.method === 'GET' && pathname === '/') {
        response.writeHead(302, { location: '/admin' });
        response.end();
        return;
      }

      if (request.method === 'GET' && OPERATOR_ROUTE_FILES[pathname]) {
        await serveFile(response, path.join(publicDir, OPERATOR_ROUTE_FILES[pathname]));
        return;
      }

      if (request.method === 'GET' && pathname === '/subject') {
        await serveFile(response, path.join(publicDir, 'subject.html'));
        return;
      }

      if (request.method === 'GET' && pathname === '/robot') {
        await serveFile(response, path.join(publicDir, 'robot.html'));
        return;
      }

      if (request.method === 'GET' && pathname === '/audit') {
        response.writeHead(302, { location: '/robot' });
        response.end();
        return;
      }

      if (request.method === 'GET' && pathname === '/exports') {
        response.writeHead(302, { location: '/admin' });
        response.end();
        return;
      }

      if (request.method === 'GET' && pathname.startsWith('/media/puzzles/')) {
        const fileName = pathname.slice('/media/puzzles/'.length);
        const candidatePath = path.join(store.puzzleDir, fileName);
        if (candidatePath.startsWith(store.puzzleDir)) {
          await serveFile(response, candidatePath);
          return;
        }
      }

      if (request.method === 'GET' && pathname.startsWith('/media/study-script/')) {
        const fileName = pathname.slice('/media/study-script/'.length);
        const candidatePath = path.join(scriptDir, fileName);
        const relative = path.relative(scriptDir, candidatePath);
        if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
          await serveFile(response, candidatePath);
          return;
        }
      }

      if (request.method === 'GET' && pathname === '/health') {
        const systemStatus = getSystemStatus();
        const healthLevel = systemStatus.sensorHealth?.overall?.level || 'healthy';
        json(response, 200, {
          ok: true,
          status: healthLevel === 'healthy' ? 'ok' : (healthLevel === 'error' ? 'error' : 'degraded'),
          sessionStatus: store.getState().session.status,
          sensorHealth: systemStatus.sensorHealth,
          preflight: systemStatus.preflight,
        });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/state') {
        const role = url.searchParams.get('role') || 'admin';
        if (role === 'admin') {
          adminGuard.assertAuthorized(getAdminToken(request));
        }
        json(response, 200, roleState(store, role, getSystemStatus(), getStudyDefinition()));
        return;
      }

      if (request.method === 'GET' && pathname === '/api/events') {
        const limit = Number(url.searchParams.get('limit') || 25);
        json(response, 200, { events: store.getRecentEvents(limit) });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/network') {
        json(response, 200, getSystemStatus().network);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/guard') {
        const token = getAdminToken(request);
        const state = store.getState();
        const preflight = getSystemStatus().preflight;
        json(response, 200, {
          ...adminGuard.getStatusForToken(token),
          sessionStatus: state.session.status,
          permittedActions: {
            configureSession: buildPolicy(state, 'configureSession'),
            queueRounds: buildPolicy(state, 'queueRounds'),
            updatePreflight: buildPolicy(state, 'updatePreflight'),
            startSession: buildPolicy(state, 'startSession', { preflight }),
            startRound: buildPolicy(state, 'startRound'),
            completeRound: buildPolicy(state, 'completeRound'),
            skipRound: buildPolicy(state, 'skipRound'),
            completeSession: buildPolicy(state, 'completeSession'),
            endSessionEarly: buildPolicy(state, 'endSessionEarly'),
            updateAdaptiveConfig: buildPolicy(state, 'updateAdaptiveConfig'),
            setHint: buildPolicy(state, 'setHint'),
            logRobotAction: buildPolicy(state, 'logRobotAction'),
            simulateTelemetry: buildPolicy(state, 'simulateTelemetry'),
            resetSession: buildPolicy(state, 'resetSession'),
            forceResetSession: buildPolicy(state, 'resetSession', { force: true }),
          },
        });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/preflight') {
        json(response, 200, getSystemStatus().preflight);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/exports') {
        adminGuard.assertAuthorized(getAdminToken(request));
        json(response, 200, await store.getExportManifest());
        return;
      }

      if (request.method === 'GET' && pathname === '/api/export/current.json') {
        adminGuard.assertAuthorized(getAdminToken(request));
        json(response, 200, await store.buildOperatorExport('current'), {
          'content-disposition': `attachment; filename="${store.getCurrentSessionId()}.json"`,
        });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/export/current.forms.json') {
        adminGuard.assertAuthorized(getAdminToken(request));
        json(response, 200, await store.buildFormResponsesExport('current'), {
          'content-disposition': `attachment; filename="${store.getCurrentSessionId()}-forms.json"`,
        });
        return;
      }

      if (request.method === 'GET' && pathname.startsWith('/api/camera/recordings')) {
        adminGuard.assertAuthorized(getAdminToken(request));
        const recordingPath = parseCameraRecordingPath(pathname);
        if (!recordingPath?.recordingId || recordingPath.action || !isRecordingId(recordingPath.recordingId)) {
          json(response, 404, { error: 'Recording not found.' });
          return;
        }
        const record = store.getCameraRecording(recordingPath.recordingId);
        if (!record) {
          json(response, 404, { error: 'Recording not found.' });
          return;
        }
        await serveCameraRecording(response, store.recordingFilePath(record.id), record.filename);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/export/current.csv') {
        adminGuard.assertAuthorized(getAdminToken(request));
        const csv = await store.getSessionCsv('current');
        text(response, 200, csv, {
          'content-disposition': `attachment; filename="${store.getCurrentSessionId()}.csv"`,
        });
        return;
      }

      if (request.method === 'GET' && pathname.startsWith('/api/exports/')) {
        adminGuard.assertAuthorized(getAdminToken(request));
        const slug = pathname.slice('/api/exports/'.length);

        if (slug.endsWith('.bundle.json')) {
          const sessionId = slug.slice(0, -'.bundle.json'.length);
          const resolvedSessionId = sessionId === 'current' ? store.getCurrentSessionId() : sessionId;
          json(response, 200, await store.buildSessionExport(sessionId), {
            'content-disposition': `attachment; filename="${resolvedSessionId}.bundle.json"`,
          });
          return;
        }

        if (slug.endsWith('.forms.json')) {
          const sessionId = slug.slice(0, -'.forms.json'.length);
          const resolvedSessionId = sessionId === 'current' ? store.getCurrentSessionId() : sessionId;
          json(response, 200, await store.buildFormResponsesExport(sessionId), {
            'content-disposition': `attachment; filename="${resolvedSessionId}-forms.json"`,
          });
          return;
        }

        if (slug.endsWith('.json')) {
          const sessionId = slug.slice(0, -'.json'.length);
          const resolvedSessionId = sessionId === 'current' ? store.getCurrentSessionId() : sessionId;
          json(response, 200, await store.buildOperatorExport(sessionId), {
            'content-disposition': `attachment; filename="${resolvedSessionId}.json"`,
          });
          return;
        }

        if (slug.endsWith('.csv')) {
          const sessionId = slug.slice(0, -'.csv'.length);
          const csv = await store.getSessionCsv(sessionId);
          const resolvedSessionId = sessionId === 'current' ? store.getCurrentSessionId() : sessionId;
          text(response, 200, csv, {
            'content-disposition': `attachment; filename="${resolvedSessionId}.csv"`,
          });
          return;
        }
      }

      if (request.method === 'GET' && pathname.startsWith('/')) {
        const candidatePath = path.join(publicDir, pathname.replace(/^\/+/, ''));
        if (candidatePath.startsWith(publicDir)) {
          try {
            await serveFile(response, candidatePath);
            return;
          } catch (error) {
            if (error.code !== 'ENOENT') {
              throw error;
            }
          }
        }
      }

      if (request.method === 'POST' && pathname === '/api/hint-presets') {
        adminGuard.assertAuthorized(getAdminToken(request));
        const body = await readJsonBody(request);
        const next = normalizeStudyConfig({
          ...studyConfig,
          hintPresets: Array.isArray(body.presets) ? body.presets : body.hintPresets,
        });
        studyConfig.hintPresets = next.hintPresets;
        if (studyConfigPath) {
          saveStudyConfig(studyConfig, studyConfigPath);
        }
        hub.broadcastSnapshots();
        json(response, 200, { hintPresets: studyConfig.hintPresets });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/study-script') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'configureSession');
        const body = await readJsonBody(request);
        if (!body.textFile && !body.audioFile) {
          const error = new Error('Choose a text file, an audio recording, or both.');
          error.statusCode = 400;
          throw error;
        }
        const nextScript = { ...studyScript };
        if (body.textFile) {
          const textFile = body.textFile;
          const textBuffer = uploadedBuffer(textFile);
          const extension = path.extname(String(textFile.name || '')).toLowerCase();
          if (extension !== '.txt' && String(textFile.mimeType || textFile.type || '') !== 'text/plain') {
            const error = new Error('The displayed script must be a plain .txt file.');
            error.statusCode = 400;
            throw error;
          }
          if (!textBuffer.length || textBuffer.length > MAX_SCRIPT_TEXT_BYTES) {
            const error = new Error('The script text file must be non-empty and no larger than 256 KB.');
            error.statusCode = 400;
            throw error;
          }
          const scriptText = textBuffer.toString('utf8').trim();
          if (!scriptText) {
            const error = new Error('The script text file did not contain any readable text.');
            error.statusCode = 400;
            throw error;
          }
          await fs.writeFile(path.join(scriptDir, 'script.txt'), `${scriptText}\n`, 'utf8');
          nextScript.text = scriptText;
          nextScript.customTextName = path.basename(String(textFile.name || 'script.txt'));
        }
        if (body.audioFile) {
          const audioFile = body.audioFile;
          const extension = path.extname(String(audioFile.name || '')).toLowerCase();
          const mimeType = SCRIPT_AUDIO_TYPES[extension];
          const audioBuffer = uploadedBuffer(audioFile);
          if (!mimeType) {
            const error = new Error('Use an MP3, M4A, WAV, or OGG script recording.');
            error.statusCode = 400;
            throw error;
          }
          if (!audioBuffer.length || audioBuffer.length > MAX_SCRIPT_AUDIO_BYTES) {
            const error = new Error('The script recording must be non-empty and no larger than 10 MB.');
            error.statusCode = 400;
            throw error;
          }
          const storedName = `script-audio${extension}`;
          await fs.writeFile(path.join(scriptDir, storedName), audioBuffer);
          nextScript.audioFileName = storedName;
          nextScript.audioOriginalName = path.basename(String(audioFile.name || storedName));
        }
        studyScript = nextScript;
        const temporaryManifest = `${scriptManifestPath}.tmp`;
        await fs.writeFile(temporaryManifest, `${JSON.stringify(studyScript, null, 2)}\n`, 'utf8');
        await fs.rename(temporaryManifest, scriptManifestPath);
        await store.logSystemEvent({
          type: 'study.script.updated',
          source: 'admin',
          summary: 'The participant script text or recording was updated.',
          payload: {
            actor: body.actor || 'researcher',
            customTextName: studyScript.customTextName,
            audioOriginalName: studyScript.audioOriginalName,
          },
        });
        hub.broadcastSnapshots();
        json(response, 200, getStudyDefinition());
        return;
      }

      if (request.method === 'POST' && pathname === '/api/hints') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'setHint');
        const body = await readJsonBody(request);
        const state = await store.setHint({
          text: body.text,
          author: body.author || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/actions') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'logRobotAction');
        const body = await readJsonBody(request);

        const requestedPieceId = String(body.pieceId || body.actionId || '').trim();
        const requestedLabel = String(body.pieceLabel || '').trim();
        const piece = pieceById.get(requestedPieceId) || pieceByLabel.get(requestedLabel.toLowerCase());
        if (!piece) {
          json(response, 400, { error: 'Unknown puzzle piece for this robot cue.' });
          return;
        }

        const programNumber = Number(piece.programNumber);
        if (!Number.isInteger(programNumber) || programNumber < 1) {
          json(response, 500, { error: `No robot program is configured for ${piece.label}.` });
          return;
        }

        const state = await store.logRobotAction({
          pieceId: piece.id,
          pieceLabel: piece.label,
          programNumber,
          payload: { ...(body.payload || {}), color: piece.color, programNumber },
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/hints/clear') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'logRobotAction');
        const body = await readJsonBody(request);
        const state = await store.clearHint({
          author: body.author || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/telemetry/hrv') {
        const body = await readJsonBody(request);
        const state = await store.ingestHrvTelemetry(body, { source: body.source || 'api' });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/telemetry/simulate') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'simulateTelemetry');
        const body = await readJsonBody(request);
        const state = await store.ingestSimulatedTelemetry(body, { source: 'simulator' });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/adaptive/config') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'updateAdaptiveConfig');
        const body = await readJsonBody(request);
        const state = await store.updateAdaptiveConfiguration({
          ...body,
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/puzzles/upload') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'configureSession');
        const body = await readJsonBody(request);
        const result = await store.uploadPuzzleAssets(body.files || [], {
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, result);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/rounds/queue') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'queueRounds');
        const body = await readJsonBody(request);
        const state = await store.queuePuzzleSets({
          setIds: Array.isArray(body.setIds) ? body.setIds : [],
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/rounds/start') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'startRound');
        const body = await readJsonBody(request);
        const state = await store.startRound({
          operator: body.operator || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/rounds/complete') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'completeRound');
        const body = await readJsonBody(request);
        const state = await store.completeRound({
          operator: body.operator || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/rounds/skip') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'skipRound');
        const body = await readJsonBody(request);
        json(response, 200, await store.skipNextRound({
          reason: body.reason,
          operator: body.operator || 'researcher',
          source: 'admin',
        }));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/rounds/pause') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'pauseRound');
        const body = await readJsonBody(request);
        json(response, 200, await store.pauseRound({
          operator: body.operator || 'researcher',
          source: 'admin',
        }));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/rounds/resume') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'resumeRound');
        const body = await readJsonBody(request);
        json(response, 200, await store.resumeRound({
          operator: body.operator || 'researcher',
          source: 'admin',
        }));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/camera/status') {
        adminGuard.assertAuthorized(getAdminToken(request));
        const body = await readJsonBody(request);
        cameraStatus.live = Boolean(body.live);
        cameraStatus.deviceLabel = body.deviceLabel ? String(body.deviceLabel).trim() : null;
        cameraStatus.deviceId = body.deviceId ? String(body.deviceId).trim() : null;
        cameraStatus.updatedAt = new Date().toISOString();
        hub.broadcastSnapshots();
        json(response, 200, { ok: true, camera: { ...cameraStatus } });
        return;
      }

      if (request.method === 'POST' && pathname.startsWith('/api/camera/recordings')) {
        const recordingPath = parseCameraRecordingPath(pathname);
        if (!recordingPath) {
          json(response, 404, { error: 'Not found' });
          return;
        }

        if (!recordingPath.recordingId && !recordingPath.action) {
          adminGuard.assertAuthorized(getAdminToken(request));
          await readJsonBody(request);
          json(response, 200, await store.createCameraRecording());
          return;
        }

        if (!isRecordingId(recordingPath.recordingId)) {
          json(response, 404, { error: 'Recording not found.' });
          return;
        }

        if (recordingPath.action === 'chunk') {
          adminGuard.assertAuthorized(getAdminToken(request));
          const chunkIndex = Number(request.headers['x-chunk-index']);
          const buffer = await readBinaryBody(request);
          json(response, 200, await store.appendCameraRecordingChunk(
            recordingPath.recordingId,
            Number.isInteger(chunkIndex) ? chunkIndex : Number.NaN,
            buffer,
          ));
          return;
        }

        if (recordingPath.action === 'finalize') {
          const body = await readJsonBody(request);
          if (!body.token) {
            adminGuard.assertAuthorized(getAdminToken(request));
          }
          json(response, 200, await store.finalizeCameraRecording(recordingPath.recordingId, {
            token: body.token,
            reason: body.reason || 'stop',
          }));
          return;
        }

        json(response, 404, { error: 'Not found' });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/screens/ready') {
        const body = await readJsonBody(request);
        const role = body.role === 'robot' ? 'robot' : (body.role === 'subject' ? 'subject' : null);
        if (!role) {
          json(response, 400, { error: 'A valid screen role is required.' });
          return;
        }
        const connected = (hub.getConnectionStats()[role] || 0) > 0;
        if (body.ready && !connected) {
          const error = new Error('That screen must be connected before it can be marked ready.');
          error.statusCode = 409;
          throw error;
        }
        screenReadiness[role] = {
          ready: Boolean(body.ready),
          updatedAt: new Date().toISOString(),
        };
        hub.broadcastSnapshots();
        json(response, 200, { ok: true, role, ready: screenReadiness[role].ready });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/watch/calibrate') {
        adminGuard.assertAuthorized(getAdminToken(request));
        const state = store.getState();
        if (state.session.activeRound) {
          const error = new Error('Pause or complete the active round before recalibrating the watch.');
          error.statusCode = 409;
          throw error;
        }
        const body = await readJsonBody(request);
        const result = await watchBridge.requestCalibration({ requestedBy: body.requestedBy || 'researcher' });
        await store.logSystemEvent({
          type: 'watch.calibration.requested',
          source: 'admin',
          summary: `Watch recalibration requested by ${body.requestedBy || 'researcher'}.`,
          payload: result,
        });
        json(response, 200, result);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/participant/profile') {
        const body = await readJsonBody(request);
        await store.submitParticipantProfile(body);
        json(response, 200, roleState(store, 'subject', getSystemStatus(), getStudyDefinition()));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/surveys/round') {
        const body = await readJsonBody(request);
        await store.submitRoundSurvey(body);
        json(response, 200, roleState(store, 'subject', getSystemStatus(), getStudyDefinition()));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/surveys/round/skip') {
        adminGuard.assertAuthorized(getAdminToken(request));
        const body = await readJsonBody(request);
        json(response, 200, await store.skipRoundSurvey({
          ...body,
          operator: body.operator || 'researcher',
          source: 'admin',
        }));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/surveys/final') {
        const body = await readJsonBody(request);
        await store.submitFinalSurvey(body);
        json(response, 200, roleState(store, 'subject', getSystemStatus(), getStudyDefinition()));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/guard/unlock') {
        const body = await readJsonBody(request);
        json(response, 200, adminGuard.unlock(body.pin));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/guard/lock') {
        adminGuard.assertAuthorized(getAdminToken(request));
        adminGuard.lock(getAdminToken(request));
        json(response, 200, {
          pinRequired: adminGuard.isEnabled(),
          authenticated: false,
        });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/configure') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'configureSession');
        const body = await readJsonBody(request);
        const state = await store.configureSession({
          studyId: body.studyId,
          participantId: body.participantId,
          sittingNumber: body.sittingNumber,
          condition: body.condition,
          researcher: body.researcher,
          notes: body.notes,
          roundDurationSeconds: body.roundDurationSeconds,
          constantIntervalSeconds: body.constantIntervalSeconds,
          conditionOrder: body.conditionOrder,
          adminProfile: body.adminProfile,
          actor: body.actor || body.researcher || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/start') {
        adminGuard.assertAuthorized(getAdminToken(request));
        const preflight = getSystemStatus().preflight;
        assertPolicy(store.getState(), 'startSession', { preflight });
        const body = await readJsonBody(request);
        const state = await store.startSession({
          operator: body.operator || 'researcher',
          source: 'admin',
          readinessWarnings: preflight.warnings,
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/resume-sitting') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'resumeSitting');
        const body = await readJsonBody(request);
        json(response, 200, await store.resumeNextSitting({
          operator: body.operator || 'researcher',
          source: 'admin',
        }));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/preflight/acknowledgements') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'updatePreflight');
        const body = await readJsonBody(request);
        const state = await store.updatePreflightAcknowledgements({
          acknowledgements: body.acknowledgements,
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/complete') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'completeSession');
        const body = await readJsonBody(request);
        const state = await store.completeSession({
          operator: body.operator || 'researcher',
          summary: body.summary,
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/end-early') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'endSessionEarly');
        const body = await readJsonBody(request);
        const state = await store.endSessionEarly({
          operator: body.operator || 'researcher',
          reason: body.reason,
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/reset') {
        const body = await readJsonBody(request);
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'resetSession', { force: body.force });
        const state = await store.resetSession({
          requestedBy: body.requestedBy || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      json(response, 404, { error: 'Not found' });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      // When we reject an oversized body the client may still be streaming, so
      // close the connection to abort the upload rather than hanging.
      const headers = statusCode === 413 ? { connection: 'close' } : {};
      if (!response.headersSent) {
        json(response, statusCode, {
          error: error.message || 'Unexpected server error',
        }, headers);
      }
    }
  });

  server.on('upgrade', (request, socket) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname !== '/ws') {
        socket.destroy();
        return;
      }

      hub.handleUpgrade(request, socket);
    } catch (error) {
      // A malformed upgrade request must never take the server down mid-session.
      try {
        socket.destroy();
      } catch (destroyError) {
        // Ignore secondary teardown failures.
      }
    }
  });

  return {
    port,
    server,
    store,
    watchBridge,
    hub,
    studyConfig,
    close() {
      watchBridge.stop();
      hub.close();
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}

module.exports = {
  createApp,
  readJsonBody,
  roleState,
};
