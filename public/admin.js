import {
  connectSocket,
  fetchJson,
  formatDurationSeconds,
  formatTimestamp,
  postJson,
} from './shared.js';
import { createCameraController } from './admin-camera.mjs';
import { canUseWebmRecorder, createCameraRecorder } from './admin-camera-recorder.mjs';
import {
  bindCameraControls,
  latestDownloadableRecording,
  recordingsToDownloadAfterSitting,
  shouldAutoStartSittingRecording,
  shouldShowCameraControls,
} from './admin-controls.mjs';
import { renderHrvTelemetry } from './admin-telemetry.mjs';

const ADMIN_TOKEN_KEY = 'woz.admin.token';

const elements = {
  modeNote: document.querySelector('#mode-note'),
  modeSetup: document.querySelector('#mode-setup'),
  modeRun: document.querySelector('#mode-run'),
  modeReview: document.querySelector('#mode-review'),
  linkStatus: document.querySelector('#link-status'),
  subjectHealth: document.querySelector('#subject-health'),
  robotHealth: document.querySelector('#robot-health'),
  cameraHealth: document.querySelector('#camera-health'),
  watchHealth: document.querySelector('#watch-health'),
  gazeHealth: document.querySelector('#gaze-health'),
  guardShell: document.querySelector('#guard-shell'),
  guardForm: document.querySelector('#guard-form'),
  guardPin: document.querySelector('#guard-pin'),
  guardUnlock: document.querySelector('#guard-unlock'),
  guardLock: document.querySelector('#guard-lock'),
  guardMessage: document.querySelector('#guard-message'),
  sessionForm: document.querySelector('#session-form'),
  sessionStudyId: document.querySelector('#session-study-id'),
  sessionParticipantId: document.querySelector('#session-participant-id'),
  sessionResearcher: document.querySelector('#session-researcher'),
  sessionSittingNumber: document.querySelector('#session-sitting-number'),
  sessionCondition: document.querySelector('#session-condition'),
  sessionNotes: document.querySelector('#session-notes'),
  sessionSave: document.querySelector('#session-save'),
  puzzleUploadForm: document.querySelector('#puzzle-upload-form'),
  puzzleUploadInput: document.querySelector('#puzzle-upload-input'),
  puzzleUploadSubmit: document.querySelector('#puzzle-upload-submit'),
  puzzleUploadStatus: document.querySelector('#puzzle-upload-status'),
  puzzleClearSelection: document.querySelector('#puzzle-clear-selection'),
  puzzleLibraryList: document.querySelector('#puzzle-library-list'),
  incompleteLibraryList: document.querySelector('#incomplete-library-list'),
  queueList: document.querySelector('#queue-list'),
  readinessList: document.querySelector('#readiness-list'),
  selectedSetSummary: document.querySelector('#selected-set-summary'),
  selectedSetDetail: document.querySelector('#selected-set-detail'),
  solutionPreview: document.querySelector('#solution-preview'),
  roundSummary: document.querySelector('#round-summary'),
  hrvHeartRate: document.querySelector('#hrv-heart-rate'),
  hrvSdnn: document.querySelector('#hrv-sdnn'),
  hrvRmssd: document.querySelector('#hrv-rmssd'),
  hrvPnn50: document.querySelector('#hrv-pnn50'),
  hrvStressScore: document.querySelector('#hrv-stress-score'),
  hrvStressLevel: document.querySelector('#hrv-stress-level'),
  hrvDistraction: document.querySelector('#hrv-distraction'),
  hrvUpdated: document.querySelector('#hrv-updated'),
  hrvSource: document.querySelector('#hrv-source'),
  hrvInterpretation: document.querySelector('#hrv-interpretation'),
  sessionStatusSummary: document.querySelector('#session-status-summary'),
  sessionStatusDetail: document.querySelector('#session-status-detail'),
  sessionDurationSummary: document.querySelector('#session-duration-summary'),
  sessionDurationDetail: document.querySelector('#session-duration-detail'),
  screenLinks: document.querySelector('#screen-links'),
  sessionStart: document.querySelector('#session-start'),
  sessionComplete: document.querySelector('#session-complete'),
  roundStart: document.querySelector('#round-start'),
  roundComplete: document.querySelector('#round-complete'),
  resetSession: document.querySelector('#reset-session'),
  resetSessionSetup: document.querySelector('#reset-session-setup'),
  resetSessionReview: document.querySelector('#reset-session-review'),
  exportJsonLink: document.querySelector('#export-json-link'),
  exportCsvLink: document.querySelector('#export-csv-link'),
  reviewSummary: document.querySelector('#review-summary'),
  reviewRounds: document.querySelector('#review-rounds'),
  hintForm: document.querySelector('#hint-form'),
  hintText: document.querySelector('#hint-text'),
  hintSend: document.querySelector('#hint-send'),
  hintSavePreset: document.querySelector('#hint-save-preset'),
  clearHint: document.querySelector('#clear-hint'),
  hintPreview: document.querySelector('#hint-preview'),
  hintPresets: document.querySelector('#hint-presets'),
  pieceGrid: document.querySelector('#piece-grid'),
  slotGrid: document.querySelector('#slot-grid'),
  sendRobotCue: document.querySelector('#send-robot-cue'),
  latestAction: document.querySelector('#latest-action'),
  interventionLog: document.querySelector('#intervention-log'),
  startCamera: document.querySelector('#start-camera'),
  stopCamera: document.querySelector('#stop-camera'),
  startRecording: document.querySelector('#start-recording'),
  stopRecording: document.querySelector('#stop-recording'),
  downloadRecording: document.querySelector('#download-recording'),
  cameraDevice: document.querySelector('#camera-device'),
  cameraFeed: document.querySelector('#camera-feed'),
  cameraStatus: document.querySelector('#camera-status'),
  recordingStatus: document.querySelector('#recording-status'),
  reviewRecordings: document.querySelector('#review-recordings'),
  gazeAttention: document.querySelector('#gaze-attention'),
  gazeUpdated: document.querySelector('#gaze-updated'),
};

let currentState = null;
let guardStatus = null;
let adminToken = window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
let durationTicker = null;
let selectedPieceId = null;
let selectedSlot = null;
let lastHintToken = null;
let lastRobotToken = null;
const liveLog = [];

const cameraController = createCameraController({
  videoElement: elements.cameraFeed,
  statusElement: elements.cameraStatus,
  selectElement: elements.cameraDevice,
  mediaDevices: window.navigator?.mediaDevices || null,
  async onStatusChange(status) {
    try {
      await postJson('/api/camera/status', {
        live: Boolean(status.live),
        deviceLabel: status.deviceLabel || '',
        deviceId: status.deviceId || '',
      }, {
        headers: buildHeaders(),
      });
    } catch {
      // Camera status is best-effort; the preview still works locally.
    }
  },
});

const webmRecorderSupported = canUseWebmRecorder();
const cameraRecorder = createCameraRecorder({
  createRecording: () => postJson('/api/camera/recordings', {}, { headers: buildHeaders() }),
  uploadChunk: uploadRecordingChunk,
  finalizeRecording: (recordingId, options = {}) => postJson(`/api/camera/recordings/${recordingId}/finalize`, {
    token: options.token,
    reason: options.partial ? 'partial' : 'stop',
  }, {
    headers: buildHeaders(),
  }),
  onStatus(message) {
    setText(elements.recordingStatus, message);
    if (elements.recordingStatus) {
      elements.recordingStatus.dataset.active = cameraRecorder.getActive().active ? 'true' : 'false';
    }
  },
});

const PUZZLE_ACCEPTED_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setValueSafely(element, value) {
  if (!element || document.activeElement === element) {
    return;
  }

  element.value = value ?? '';
}

function setElementDisabled(element, disabled, reason = '') {
  if (!element) {
    return;
  }

  element.disabled = disabled;
  element.title = disabled ? reason : '';
}

function setAdminToken(token) {
  adminToken = token || '';
  if (adminToken) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
  } else {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function buildHeaders() {
  return adminToken ? { 'x-admin-token': adminToken } : {};
}

function formatRecordingClock(startedAt) {
  const elapsed = Math.max(0, Math.floor((Date.now() - Number(startedAt || 0)) / 1000));
  return `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
}

async function uploadRecordingChunk(recordingId, index, blob) {
  const response = await fetch(`/api/camera/recordings/${recordingId}/chunk`, {
    method: 'POST',
    headers: {
      ...buildHeaders(),
      'content-type': 'application/octet-stream',
      'x-chunk-index': String(index),
    },
    body: blob,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `Recording upload failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
}

function actorName() {
  return elements.sessionResearcher?.value
    || currentState?.session?.metadata?.researcher
    || 'researcher';
}

function studyConfig() {
  return currentState?.system?.study || {
    plannedRounds: 3,
    slotCount: 7,
    pieces: [],
    hintPresets: [],
  };
}

function guessPuzzleMimeType(name = '') {
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
  return PUZZLE_ACCEPTED_TYPES[extension] || '';
}

function readUploadFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      resolve({
        name: file.name,
        mimeType: file.type || guessPuzzleMimeType(file.name),
        contentBase64: commaIndex >= 0 ? result.slice(commaIndex + 1) : result,
      });
    });

    reader.addEventListener('error', () => {
      reject(new Error(`Failed to read ${file.name}.`));
    });

    reader.readAsDataURL(file);
  });
}

function availablePuzzleSets() {
  return currentState?.assets?.puzzleSets || [];
}

function incompleteUploads() {
  return currentState?.assets?.incompleteUploads || [];
}

function sessionQueue() {
  return currentState?.session?.queue || [];
}

function renderAssetPreview(container, asset, emptyMessage) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  container.classList.toggle('empty', !asset);

  if (!asset) {
    const empty = document.createElement('p');
    empty.className = 'panel-note';
    empty.textContent = emptyMessage;
    container.append(empty);
    return;
  }

  if (asset.displayKind === 'pdf') {
    const frame = document.createElement('iframe');
    frame.className = 'reference-preview-frame';
    frame.src = `${asset.urlPath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
    frame.title = asset.originalName;
    frame.addEventListener('error', () => {
      container.innerHTML = '';
      const failed = document.createElement('p');
      failed.className = 'panel-note';
      failed.textContent = 'The solution file could not be loaded.';
      container.append(failed);
    });
    container.append(frame);
    return;
  }

  const image = document.createElement('img');
  image.className = 'reference-preview-image';
  image.src = asset.urlPath;
  image.alt = asset.originalName;
  image.addEventListener('error', () => {
    container.innerHTML = '';
    const failed = document.createElement('p');
    failed.className = 'panel-note';
    failed.textContent = 'The solution file could not be loaded.';
    container.append(failed);
  });
  container.append(image);
}

function localPolicy(action) {
  const session = currentState?.session || {};
  const status = session.status || 'setup';
  const queue = session.queue || [];
  const rounds = session.rounds || [];
  const activeRound = session.activeRound || null;

  if (action === 'configureSession' || action === 'queueRounds') {
    return status === 'setup'
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: 'Session setup is locked once the sitting has started.' };
  }

  if (action === 'startSession') {
    if (status !== 'setup') {
      return { allowed: false, reason: 'Only setup sessions can be started.' };
    }
    if (queue.length === 0) {
      return { allowed: false, reason: 'Queue at least one puzzle before starting the sitting.' };
    }
    return { allowed: true, reason: '' };
  }

  if (action === 'startRound') {
    if (status !== 'running') {
      return { allowed: false, reason: 'Start the sitting before opening a round.' };
    }
    if (activeRound) {
      return { allowed: false, reason: 'Finish the current round before starting the next one.' };
    }
    if (rounds.length >= queue.length) {
      return { allowed: false, reason: 'All queued puzzles for this sitting have been played.' };
    }
    return { allowed: true, reason: '' };
  }

  if (action === 'completeRound') {
    return status === 'running' && activeRound
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: 'There is no active round to complete.' };
  }

  if (action === 'completeSession') {
    return status === 'running'
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: 'Only running sittings can be completed.' };
  }

  if (action === 'setHint' || action === 'logRobotAction') {
    if (status !== 'running') {
      return { allowed: false, reason: 'Hints and robot cues are only available during an active sitting.' };
    }
    if (!activeRound) {
      return { allowed: false, reason: 'Start a round before sending hints or robot cues.' };
    }
    return { allowed: true, reason: '' };
  }

  return { allowed: true, reason: '' };
}

function resolvePolicy(action) {
  const pinRequired = Boolean(guardStatus?.pinRequired);
  const authenticated = pinRequired ? Boolean(guardStatus?.authenticated) : true;

  if (pinRequired && !authenticated) {
    return {
      allowed: false,
      reason: 'Unlock this browser with the admin PIN before using operator controls.',
    };
  }

  return localPolicy(action);
}

function setPill(element, status, label) {
  if (!element) {
    return;
  }

  element.dataset.status = status;
  element.textContent = label;
}

function renderHealth() {
  const screens = currentState?.system?.screens || {};
  const subject = screens.subject || {};
  const robot = screens.robot || {};
  const camera = currentState?.system?.camera || {};
  const sensorHealth = currentState?.system?.sensorHealth || {};

  if (subject.ready) {
    setPill(elements.subjectHealth, 'ready', 'Subject: ready');
  } else if (subject.connected) {
    setPill(elements.subjectHealth, 'connected', 'Subject: connected, sound off');
  } else {
    setPill(elements.subjectHealth, 'offline', 'Subject: offline');
  }

  if (robot.ready) {
    setPill(elements.robotHealth, 'ready', 'Robot: ready');
  } else if (robot.connected) {
    setPill(elements.robotHealth, 'connected', 'Robot: connected, sound off');
  } else {
    setPill(elements.robotHealth, 'offline', 'Robot: offline');
  }

  if (camera.live) {
    setPill(elements.cameraHealth, 'ready', camera.deviceLabel ? `Camera: ${camera.deviceLabel}` : 'Camera: live');
  } else {
    setPill(elements.cameraHealth, 'offline', 'Camera: off');
  }

  const watchState = sensorHealth.watch?.state;
  if (watchState === 'healthy') {
    setPill(elements.watchHealth, 'ready', 'Watch: live');
  } else if (watchState === 'stale' || watchState === 'error') {
    setPill(elements.watchHealth, 'connected', 'Watch: check band');
  } else {
    setPill(elements.watchHealth, 'offline', 'Watch: waiting');
  }

  const gazeState = sensorHealth.gaze?.state;
  if (gazeState === 'healthy') {
    setPill(elements.gazeHealth, 'ready', 'Pupil: live');
  } else if (gazeState === 'stale' || gazeState === 'error') {
    setPill(elements.gazeHealth, 'connected', 'Pupil: check Capture');
  } else {
    setPill(elements.gazeHealth, 'offline', 'Pupil: waiting');
  }
}

function renderGuard() {
  const pinRequired = Boolean(guardStatus?.pinRequired);
  if (!elements.guardShell) {
    return;
  }

  elements.guardShell.hidden = !pinRequired;
  if (!pinRequired) {
    return;
  }

  const authenticated = Boolean(guardStatus?.authenticated);
  setText(
    elements.guardMessage,
    authenticated
      ? 'This browser is unlocked for operator controls.'
      : 'Enter the admin PIN to enable the dashboard controls on this browser.',
  );
  setElementDisabled(elements.guardPin, authenticated);
  setElementDisabled(elements.guardUnlock, authenticated, 'This browser is already unlocked.');
  setElementDisabled(elements.guardLock, !authenticated, 'Unlock the browser before locking it again.');
}

function renderModes() {
  const status = currentState?.session?.status || 'setup';
  if (elements.modeSetup) {
    elements.modeSetup.hidden = status !== 'setup';
  }
  if (elements.modeRun) {
    elements.modeRun.hidden = !shouldShowCameraControls(status);
  }
  if (elements.modeReview) {
    elements.modeReview.hidden = status !== 'completed';
  }
  document.body.dataset.sessionPhase = status;

  if (status === 'running') {
    setText(elements.modeNote, 'Live sitting. Camera, solution, hints, and robot cues stay on this deck.');
  } else if (status === 'completed') {
    setText(elements.modeNote, 'Sitting complete. Download the export, then reset for the next participant.');
  } else {
    setText(elements.modeNote, 'Start the C270, arm both screens, and wait for Watch and Pupil before beginning.');
  }
}

async function persistQueue(setIds) {
  await postJson('/api/rounds/queue', {
    setIds,
    actor: actorName(),
  }, {
    headers: buildHeaders(),
  });
  await refreshState();
}

function renderQueueAndLibrary() {
  const queue = sessionQueue();
  const queuedIds = new Set(queue.map((entry) => entry.setId));

  if (elements.queueList) {
    elements.queueList.innerHTML = '';
    if (!queue.length) {
      const empty = document.createElement('p');
      empty.className = 'panel-note';
      empty.textContent = 'Save the sitting profile to auto-queue that sitting\'s three puzzles.';
      elements.queueList.append(empty);
    }

    queue.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'queue-item';
      const title = document.createElement('strong');
      title.textContent = `${index + 1}. Set ${entry.setId}`;
      const meta = document.createElement('small');
      meta.textContent = `${entry.subjectAsset.originalName} / ${entry.solutionAsset.originalName}`;
      row.append(title, meta);
      elements.queueList.append(row);
    });
  }

  if (elements.puzzleLibraryList) {
    elements.puzzleLibraryList.innerHTML = '';
    if (!availablePuzzleSets().length) {
      const empty = document.createElement('p');
      empty.className = 'panel-note';
      empty.textContent = 'No complete subject and solution pairs uploaded yet.';
      elements.puzzleLibraryList.append(empty);
    }

    availablePuzzleSets().forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'reference-library-item';
      if (queuedIds.has(entry.setId)) {
        card.classList.add('selected');
      }

      const title = document.createElement('strong');
      title.textContent = `Set ${entry.setId}`;
      const meta = document.createElement('small');
      meta.textContent = `Subject ${entry.subjectAsset.originalName} • Solution ${entry.solutionAsset.originalName}`;
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'button button-primary';
      const queuePolicy = resolvePolicy('queueRounds');
      const alreadyQueued = queuedIds.has(entry.setId);
      add.textContent = alreadyQueued ? 'In queue' : 'Add to queue';
      add.disabled = !queuePolicy.allowed || alreadyQueued;
      add.title = add.disabled ? (alreadyQueued ? 'This set is already queued.' : queuePolicy.reason) : '';
      add.addEventListener('click', async () => {
        try {
          await persistQueue([...queue.map((item) => item.setId), entry.setId]);
        } catch (error) {
          await handleError(error);
        }
      });

      card.append(title, meta, add);
      elements.puzzleLibraryList.append(card);
    });
  }

  if (elements.incompleteLibraryList) {
    elements.incompleteLibraryList.innerHTML = '';
    if (!incompleteUploads().length) {
      const empty = document.createElement('p');
      empty.className = 'panel-note';
      empty.textContent = 'All uploaded files are currently paired.';
      elements.incompleteLibraryList.append(empty);
    }

    incompleteUploads().forEach((asset) => {
      const item = document.createElement('small');
      item.textContent = asset.originalName;
      elements.incompleteLibraryList.append(item);
    });
  }
}

function readinessChecks() {
  const preflight = currentState?.system?.preflight || {};
  const items = preflight.items || preflight.automaticItems || [];
  if (items.length) {
    return items.map((item) => ({
      ok: item.status === 'ready',
      label: item.summary || item.label,
    }));
  }

  return [{ ok: false, label: 'Waiting for readiness from the server.' }];
}

function renderReadiness() {
  const checks = readinessChecks();
  if (elements.readinessList) {
    elements.readinessList.innerHTML = '';
    checks.forEach((check) => {
      const item = document.createElement('p');
      item.className = check.ok ? 'readiness-ok' : 'readiness-wait';
      item.textContent = `${check.ok ? 'Ready' : 'Waiting'} — ${check.label}`;
      elements.readinessList.append(item);
    });
  }

  const startPolicy = resolvePolicy('startSession');
  const blocked = checks.find((check) => !check.ok);
  const preflightBlocked = currentState?.system?.preflight?.requiredReady === false;
  const canStart = startPolicy.allowed && !blocked && !preflightBlocked;
  setElementDisabled(
    elements.sessionStart,
    !canStart,
    blocked ? blocked.label : (preflightBlocked ? currentState.system.preflight.summary : startPolicy.reason),
  );
}

function rememberInterventions() {
  const hint = currentState?.hint || {};
  const robot = currentState?.robotAction || {};
  const activeRound = currentState?.session?.activeRound;

  if (hint.updatedAt && hint.updatedAt !== lastHintToken) {
    lastHintToken = hint.updatedAt;
    if (hint.text && activeRound) {
      liveLog.unshift({
        at: hint.updatedAt,
        label: `Hint: ${hint.text}`,
        round: activeRound.index,
      });
    }
  }

  if (robot.updatedAt && robot.updatedAt !== lastRobotToken) {
    lastRobotToken = robot.updatedAt;
    if (robot.label && activeRound) {
      liveLog.unshift({
        at: robot.updatedAt,
        label: robot.label,
        round: activeRound.index,
      });
    }
  }

  liveLog.splice(20);
}

function renderInterventionLog() {
  if (!elements.interventionLog) {
    return;
  }

  elements.interventionLog.innerHTML = '';
  const activeIndex = currentState?.session?.activeRound?.index;
  const rows = liveLog.filter((entry) => !activeIndex || entry.round === activeIndex);
  if (!rows.length) {
    const empty = document.createElement('li');
    empty.textContent = 'No interventions in this round yet.';
    elements.interventionLog.append(empty);
    return;
  }

  rows.forEach((entry) => {
    const item = document.createElement('li');
    item.textContent = `${formatTimestamp(entry.at)} — ${entry.label}`;
    elements.interventionLog.append(item);
  });
}

async function persistHintPresets(presets) {
  await postJson('/api/hint-presets', { presets }, {
    headers: buildHeaders(),
  });
  await refreshState();
}

function renderHintPresets(hintPolicy) {
  if (!elements.hintPresets) {
    return;
  }

  elements.hintPresets.innerHTML = '';
  studyConfig().hintPresets.forEach((preset) => {
    const chip = document.createElement('div');
    chip.className = 'preset-chip';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-ghost';
    button.textContent = preset;
    button.addEventListener('click', async () => {
      if (elements.hintText) {
        elements.hintText.value = preset;
      }
      if (!hintPolicy.allowed) {
        return;
      }
      try {
        await postJson('/api/hints', {
          text: preset,
          author: actorName(),
        }, {
          headers: buildHeaders(),
        });
        await refreshState();
      } catch (error) {
        await handleError(error);
      }
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'preset-remove';
    remove.setAttribute('aria-label', `Remove preset: ${preset}`);
    remove.textContent = '×';
    remove.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();
      try {
        await persistHintPresets(studyConfig().hintPresets.filter((entry) => entry !== preset));
      } catch (error) {
        await handleError(error);
      }
    });

    chip.append(button, remove);
    elements.hintPresets.append(chip);
  });
}

function renderRobotComposer(actionPolicy) {
  const pieces = studyConfig().pieces || [];
  const slotCount = studyConfig().slotCount || 7;

  if (elements.pieceGrid) {
    elements.pieceGrid.innerHTML = '';
    pieces.forEach((piece) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'action-button';
      if (selectedPieceId === piece.id) {
        button.classList.add('selected');
      }
      button.textContent = piece.label;
      button.style.setProperty('--piece-color', piece.color);
      button.disabled = !actionPolicy.allowed;
      button.title = actionPolicy.allowed ? '' : actionPolicy.reason;
      button.addEventListener('click', () => {
        selectedPieceId = piece.id;
        renderRobotComposer(actionPolicy);
      });
      elements.pieceGrid.append(button);
    });
  }

  if (elements.slotGrid) {
    elements.slotGrid.innerHTML = '';
    for (let slot = 1; slot <= slotCount; slot += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slot-button';
      if (selectedSlot === slot) {
        button.classList.add('selected');
      }
      button.textContent = String(slot);
      button.disabled = !actionPolicy.allowed;
      button.addEventListener('click', () => {
        selectedSlot = slot;
        renderRobotComposer(actionPolicy);
      });
      elements.slotGrid.append(button);
    }
  }

  const canSend = actionPolicy.allowed && selectedPieceId && selectedSlot;
  setElementDisabled(
    elements.sendRobotCue,
    !canSend,
    actionPolicy.allowed ? 'Choose a piece and a slot first.' : actionPolicy.reason,
  );
}

function renderSession() {
  const session = currentState?.session || {};
  const metadata = session.metadata || {};
  const status = session.status || 'setup';
  const activeRound = session.activeRound;
  const completedRounds = session.rounds || [];
  const queue = session.queue || [];
  const planned = session.plannedRounds || studyConfig().plannedRounds;
  const timerStart = activeRound?.startedAt || session.trialStartedAt;
  const timerEnd = activeRound?.completedAt || session.completedAt;
  const durationSeconds = timerStart
    ? Math.max(0, Math.round(((timerEnd ? new Date(timerEnd) : new Date()).getTime() - new Date(timerStart).getTime()) / 1000))
    : null;

  setValueSafely(elements.sessionStudyId, metadata.studyId);
  setValueSafely(elements.sessionParticipantId, metadata.participantId);
  setValueSafely(elements.sessionResearcher, metadata.researcher);
  setValueSafely(elements.sessionSittingNumber, String(metadata.sittingNumber || 1));
  setValueSafely(elements.sessionCondition, metadata.condition || 'adaptive');
  setValueSafely(elements.sessionNotes, metadata.notes);

  const label = status.toUpperCase();
  setText(elements.sessionStatusSummary, `${label}${metadata.participantId ? ` • ${metadata.participantId}` : ''}${metadata.sittingNumber ? ` • sitting ${metadata.sittingNumber}` : ''}`);

  if (status === 'running' && activeRound) {
    setText(elements.sessionStatusDetail, `Round ${activeRound.index} of ${queue.length || planned} is live.`);
    setText(elements.roundSummary, `Round ${activeRound.index} of ${queue.length || planned} • Set ${activeRound.puzzle?.setId || ''}`);
    setText(elements.sessionDurationSummary, `Elapsed: ${formatDurationSeconds(durationSeconds)}`);
    setText(elements.sessionDurationDetail, `Started ${formatTimestamp(activeRound.startedAt)}.`);
  } else if (status === 'running') {
    const nextIndex = completedRounds.length + 1;
    setText(elements.sessionStatusDetail, completedRounds.length
      ? `Round ${completedRounds.length} finished. Start the next one when ready.`
      : 'Sitting is open. Start round 1 when the participant begins.');
    setText(elements.roundSummary, nextIndex <= queue.length
      ? `Next: round ${nextIndex} • Set ${queue[nextIndex - 1]?.setId || ''}`
      : 'All queued rounds are finished. End the sitting.');
    setText(elements.sessionDurationSummary, 'Round timer is waiting.');
    setText(elements.sessionDurationDetail, 'The timer starts when you open a round.');
  } else if (status === 'completed') {
    setText(elements.sessionStatusDetail, `Sitting completed ${formatTimestamp(session.completedAt)}.`);
    setText(elements.roundSummary, `${completedRounds.length} round${completedRounds.length === 1 ? '' : 's'} recorded.`);
    setText(elements.sessionDurationSummary, `Sitting time ${formatDurationSeconds(durationSeconds)}`);
    setText(elements.sessionDurationDetail, 'Download the JSON export or reset for the next participant.');
  } else {
    setText(elements.sessionStatusDetail, 'Save the profile, queue puzzles, then begin the sitting.');
    setText(elements.roundSummary, 'Waiting to start round 1.');
    setText(elements.sessionDurationSummary, 'Timer waiting.');
    setText(elements.sessionDurationDetail, 'Start the round when the participant begins this puzzle.');
  }

  const localhost = currentState?.system?.network?.localhost || {};
  const lanUrls = (currentState?.system?.network?.lan || [])[0]?.urls || {};
  setText(
    elements.screenLinks,
    `Subject ${lanUrls.subject || localhost.subject || `${window.location.origin}/subject`} • Robot ${lanUrls.robot || localhost.robot || `${window.location.origin}/robot`}`,
  );
  setText(elements.hintPreview, currentState?.hint?.text || 'No hint has been sent yet.');
  setText(
    elements.latestAction,
    currentState?.robotAction?.updatedAt
      ? `${currentState.robotAction.label} • ${formatTimestamp(currentState.robotAction.updatedAt)}`
      : 'No robotic action logged yet.',
  );

  const previewAsset = activeRound?.puzzle?.solutionAsset || session.puzzleSet?.solutionAsset || null;
  renderAssetPreview(
    elements.solutionPreview,
    previewAsset,
    'The solution for the active round will appear here.',
  );
  setText(
    elements.selectedSetSummary,
    previewAsset ? `Set ${activeRound?.puzzle?.setId || session.puzzleSet?.setId} is on screen.` : 'No puzzle set selected yet.',
  );

  const configurePolicy = resolvePolicy('configureSession');
  const hintPolicy = resolvePolicy('setHint');
  const actionPolicy = resolvePolicy('logRobotAction');
  const startRoundPolicy = resolvePolicy('startRound');
  const completeRoundPolicy = resolvePolicy('completeRound');
  const completePolicy = resolvePolicy('completeSession');
  const resetPolicy = resolvePolicy('resetSession');

  [
    elements.sessionStudyId,
    elements.sessionParticipantId,
    elements.sessionResearcher,
    elements.sessionSittingNumber,
    elements.sessionCondition,
    elements.sessionNotes,
    elements.sessionSave,
    elements.puzzleUploadInput,
    elements.puzzleUploadSubmit,
    elements.puzzleClearSelection,
  ].forEach((element) => {
    setElementDisabled(element, !configurePolicy.allowed, configurePolicy.reason);
  });

  setElementDisabled(elements.roundStart, !startRoundPolicy.allowed, startRoundPolicy.reason);
  setElementDisabled(elements.roundComplete, !completeRoundPolicy.allowed, completeRoundPolicy.reason);
  setElementDisabled(elements.sessionComplete, !completePolicy.allowed, completePolicy.reason);
  setElementDisabled(elements.hintText, !hintPolicy.allowed, hintPolicy.reason);
  setElementDisabled(elements.hintSend, !hintPolicy.allowed, hintPolicy.reason);
  setElementDisabled(elements.clearHint, !hintPolicy.allowed, hintPolicy.reason);
  [elements.resetSession, elements.resetSessionSetup, elements.resetSessionReview].forEach((element) => {
    setElementDisabled(element, !resetPolicy.allowed, resetPolicy.reason);
  });

  renderHintPresets(hintPolicy);
  renderRobotComposer(actionPolicy);
}

function renderRecordingControls() {
  const live = Boolean(cameraController.getStatus().live);
  const active = cameraRecorder.getActive();
  const latest = latestDownloadableRecording(currentState?.session?.recordings || []);
  const canRecord = webmRecorderSupported && live && !active.active;

  setElementDisabled(
    elements.startRecording,
    !canRecord,
    webmRecorderSupported
      ? (live ? 'A recording is already in progress.' : 'Start the camera before recording.')
      : 'Recording needs Chrome WebM on this laptop.',
  );
  setElementDisabled(elements.stopRecording, !active.active, 'No recording is in progress.');
  setElementDisabled(
    elements.downloadRecording,
    !latest,
    'Save a camera take before downloading.',
  );
  setElementDisabled(elements.startCamera, active.active, 'Stop recording before switching the camera.');
  setElementDisabled(elements.cameraDevice, active.active, 'Stop recording before switching the camera.');

  if (elements.recordingStatus) {
    if (active.active) {
      setText(elements.recordingStatus, `Recording ${formatRecordingClock(active.startedAt)} · ${active.filename}`);
      elements.recordingStatus.dataset.active = 'true';
    } else if (!webmRecorderSupported) {
      setText(elements.recordingStatus, 'Recording needs Chrome WebM on this laptop.');
      elements.recordingStatus.dataset.active = 'false';
    } else if (!elements.recordingStatus.textContent) {
      setText(elements.recordingStatus, latest ? `Last take: ${latest.filename}` : '');
      elements.recordingStatus.dataset.active = 'false';
    } else {
      elements.recordingStatus.dataset.active = 'false';
    }
  }
}

function renderReviewRecordings() {
  if (!elements.reviewRecordings) {
    return;
  }

  const recordings = (currentState?.session?.recordings || [])
    .filter((entry) => entry.status === 'saved' || entry.status === 'partial');
  elements.reviewRecordings.innerHTML = '';
  if (!recordings.length) {
    const empty = document.createElement('p');
    empty.className = 'panel-note';
    empty.textContent = 'No camera takes were saved in this sitting.';
    elements.reviewRecordings.append(empty);
    return;
  }

  recordings.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'review-recording';
    const label = document.createElement('p');
    label.className = 'panel-note';
    label.textContent = `${entry.status === 'partial' ? 'Partial' : 'Saved'} · ${entry.filename}`;
    const button = document.createElement('button');
    button.className = 'button button-ghost';
    button.type = 'button';
    button.textContent = 'Download take';
    button.addEventListener('click', async () => {
      try {
        await downloadExport(`/api/camera/recordings/${entry.id}`, entry.filename);
      } catch (error) {
        await handleError(error);
      }
    });
    row.append(label, button);
    elements.reviewRecordings.append(row);
  });
}

function renderReview() {
  const session = currentState?.session || {};
  const metadata = session.metadata || {};
  const rounds = session.rounds || [];
  setText(
    elements.reviewSummary,
    `${metadata.participantId || 'Unnamed participant'} • sitting ${metadata.sittingNumber || 1} • ${rounds.length} round${rounds.length === 1 ? '' : 's'}.`,
  );
  renderReviewRecordings();

  if (!elements.reviewRounds) {
    return;
  }

  elements.reviewRounds.innerHTML = '';
  if (!rounds.length) {
    const empty = document.createElement('p');
    empty.className = 'panel-note';
    empty.textContent = 'No rounds were recorded in this sitting.';
    elements.reviewRounds.append(empty);
    return;
  }

  rounds.forEach((round) => {
    const card = document.createElement('article');
    card.className = 'review-round';
    const title = document.createElement('strong');
    title.textContent = `Round ${round.index} • Set ${round.puzzle?.setId || ''}`;
    const meta = document.createElement('p');
    meta.className = 'panel-note';
    meta.textContent = `${round.puzzle?.subjectAsset?.originalName || ''} / ${round.puzzle?.solutionAsset?.originalName || ''} • ${formatDurationSeconds(round.durationSeconds)}`;
    card.append(title, meta);
    elements.reviewRounds.append(card);
  });
}

function renderState() {
  if (!currentState) {
    renderGuard();
    return;
  }

  rememberInterventions();
  renderGuard();
  renderModes();
  renderHealth();
  renderQueueAndLibrary();
  renderReadiness();
  renderSession();
  renderInterventionLog();
  renderReview();
  renderRecordingControls();
  renderHrvTelemetry({
    heartRate: elements.hrvHeartRate,
    sdnn: elements.hrvSdnn,
    rmssd: elements.hrvRmssd,
    pnn50: elements.hrvPnn50,
    stressScore: elements.hrvStressScore,
    stressLevel: elements.hrvStressLevel,
    distraction: elements.hrvDistraction,
    source: elements.hrvSource,
    updated: elements.hrvUpdated,
    interpretation: elements.hrvInterpretation,
  }, currentState);

  const gaze = currentState?.telemetry?.gaze || {};
  if (elements.gazeAttention) {
    elements.gazeAttention.textContent = Number.isFinite(gaze.attentionScore)
      ? Number(gaze.attentionScore).toFixed(2)
      : '--';
  }
  if (elements.gazeUpdated) {
    elements.gazeUpdated.textContent = gaze.updatedAt
      ? formatTimestamp(gaze.updatedAt)
      : 'No Pupil frame yet.';
  }
}

async function refreshState() {
  currentState = await fetchJson('/api/state', {
    headers: buildHeaders(),
  });
  renderState();
}

async function refreshGuard() {
  guardStatus = await fetchJson('/api/guard', {
    headers: buildHeaders(),
  });

  if (guardStatus.pinRequired && !guardStatus.authenticated && adminToken) {
    setAdminToken('');
  }

  renderGuard();
}

async function refreshAll() {
  await refreshGuard();
  const pinRequired = Boolean(guardStatus?.pinRequired);
  const authenticated = pinRequired ? Boolean(guardStatus?.authenticated) : true;
  if (!authenticated) {
    renderGuard();
    return;
  }

  await refreshState();
}

async function handleError(error) {
  if (error.status === 423) {
    setAdminToken('');
    await refreshGuard();
  }

  if (elements.guardShell && !elements.guardShell.hidden && elements.guardMessage) {
    setText(elements.guardMessage, error.message || 'Dashboard request failed.');
  }

  if (![401, 409, 423].includes(error.status)) {
    window.alert(error.message || 'Unexpected dashboard error.');
  }
}

async function downloadExport(url, filename) {
  const response = await fetch(url, {
    headers: buildHeaders(),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `Download failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

async function resetSession() {
  const isRunning = (currentState?.session?.status || 'setup') === 'running';
  const confirmed = window.confirm(
    isRunning
      ? 'Reset the live sitting and start fresh?'
      : 'Reset the current session and clear the selected run state?',
  );
  if (!confirmed) {
    return;
  }

  await cameraRecorder.stop({ silent: true });
  await postJson('/api/session/reset', {
    requestedBy: actorName(),
    force: isRunning,
  }, {
    headers: buildHeaders(),
  });
  selectedPieceId = null;
  selectedSlot = null;
  liveLog.splice(0, liveLog.length);
  lastHintToken = null;
  lastRobotToken = null;
  await refreshState();
}

async function startCamera() {
  await cameraRecorder.stop({ silent: true });
  await cameraController.start();
  renderRecordingControls();
}

async function stopCamera() {
  await cameraRecorder.stop();
  cameraController.stop();
  renderRecordingControls();
}

async function startRecording() {
  await cameraRecorder.start(cameraController.getStream());
  renderRecordingControls();
}

async function stopRecording() {
  await cameraRecorder.stop();
  renderRecordingControls();
}

async function downloadLastTake() {
  const latest = latestDownloadableRecording(currentState?.session?.recordings || []);
  if (!latest) {
    return;
  }
  await downloadExport(`/api/camera/recordings/${latest.id}`, latest.filename);
}

async function downloadSittingFootage(recordings = currentState?.session?.recordings || []) {
  const takes = recordingsToDownloadAfterSitting(recordings);
  for (const take of takes) {
    await downloadExport(`/api/camera/recordings/${take.id}`, take.filename);
  }
}

async function autoStartSittingRecording() {
  if (!shouldAutoStartSittingRecording({
    cameraLive: Boolean(cameraController.getStatus().live),
    recorderActive: Boolean(cameraRecorder.getActive().active),
  })) {
    return;
  }

  try {
    await startRecording();
  } catch (error) {
    setText(elements.recordingStatus, error.message === 'Not found'
      ? 'Recording API is missing. Restart node src/server.js, then begin again.'
      : (error.message || 'Unable to start the sitting recording.'));
  }
}

function finalizeRecordingOnUnload() {
  cameraRecorder.flush();
  const active = cameraRecorder.getActive();
  if (!active.recordingId || !active.finalizeToken) {
    return;
  }

  const url = `/api/camera/recordings/${active.recordingId}/finalize`;
  const payload = JSON.stringify({ token: active.finalizeToken, reason: 'unload' });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    return;
  }

  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

async function init() {
  bindCameraControls({
    startButton: elements.startCamera,
    stopButton: elements.stopCamera,
    onStart: startCamera,
    onStop: stopCamera,
  });
  elements.startRecording?.addEventListener('click', async () => {
    try {
      await startRecording();
    } catch (error) {
      setText(
        elements.recordingStatus,
        error.message === 'Not found'
          ? 'Recording API is missing. Restart node src/server.js, then Record again.'
          : (error.message || 'Unable to start recording.'),
      );
      await handleError(error);
    }
  });
  elements.stopRecording?.addEventListener('click', async () => {
    try {
      await stopRecording();
    } catch (error) {
      await handleError(error);
    }
  });
  elements.downloadRecording?.addEventListener('click', async () => {
    try {
      await downloadLastTake();
    } catch (error) {
      await handleError(error);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      cameraRecorder.flush();
    }
  });
  window.addEventListener('pagehide', finalizeRecordingOnUnload);
  window.addEventListener('beforeunload', finalizeRecordingOnUnload);
  cameraController.refreshDeviceList().catch(() => {});

  setPill(elements.linkStatus, 'reconnecting', 'Link: connecting');
  await refreshAll();

  durationTicker = window.setInterval(() => {
    if (currentState?.session?.status === 'running') {
      renderSession();
    }
    if (cameraRecorder.getActive().active) {
      renderRecordingControls();
    }
  }, 1000);

  connectSocket('admin', {
    onOpen() {
      setPill(elements.linkStatus, 'ready', 'Link: live');
    },
    onClose() {
      setPill(elements.linkStatus, 'reconnecting', 'Link: reconnecting');
    },
    onSnapshot(snapshot) {
      currentState = snapshot;
      renderState();
    },
  });

  elements.guardForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const response = await postJson('/api/guard/unlock', {
        pin: elements.guardPin.value,
      });
      setAdminToken(response.token);
      elements.guardPin.value = '';
      await refreshAll();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.guardLock?.addEventListener('click', async () => {
    try {
      await postJson('/api/guard/lock', {}, {
        headers: buildHeaders(),
      });
      setAdminToken('');
      await refreshGuard();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.sessionForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/session/configure', {
        studyId: elements.sessionStudyId.value,
        participantId: elements.sessionParticipantId.value,
        researcher: elements.sessionResearcher.value,
        sittingNumber: Number(elements.sessionSittingNumber.value || 1),
        condition: elements.sessionCondition.value,
        notes: elements.sessionNotes.value,
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.puzzleUploadForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const files = [...(elements.puzzleUploadInput?.files || [])];
    if (!files.length) {
      setText(elements.puzzleUploadStatus, 'Choose one or more files before uploading.');
      return;
    }

    try {
      setText(elements.puzzleUploadStatus, `Uploading ${files.length} file${files.length === 1 ? '' : 's'}...`);
      const preparedFiles = await Promise.all(files.map((file) => readUploadFileAsBase64(file)));
      await postJson('/api/puzzles/upload', {
        files: preparedFiles,
        actor: actorName(),
      }, {
        headers: buildHeaders(),
      });
      elements.puzzleUploadInput.value = '';
      setText(elements.puzzleUploadStatus, 'Upload complete.');
      await refreshState();
    } catch (error) {
      setText(elements.puzzleUploadStatus, error.message || 'Upload failed.');
      await handleError(error);
    }
  });

  elements.puzzleClearSelection?.addEventListener('click', async () => {
    try {
      await persistQueue([]);
    } catch (error) {
      await handleError(error);
    }
  });

  elements.sessionStart?.addEventListener('click', async () => {
    try {
      await postJson('/api/session/start', {
        operator: actorName(),
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
      await autoStartSittingRecording();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.roundStart?.addEventListener('click', async () => {
    try {
      liveLog.splice(0, liveLog.length);
      await postJson('/api/rounds/start', {
        operator: actorName(),
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.roundComplete?.addEventListener('click', async () => {
    try {
      await postJson('/api/rounds/complete', {
        operator: actorName(),
      }, {
        headers: buildHeaders(),
      });
      selectedPieceId = null;
      selectedSlot = null;
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.sessionComplete?.addEventListener('click', async () => {
    try {
      await cameraRecorder.stop();
      await postJson('/api/session/complete', {
        operator: actorName(),
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
      await downloadSittingFootage();
    } catch (error) {
      await handleError(error);
    }
  });

  const resetHandler = async () => {
    try {
      await resetSession();
    } catch (error) {
      await handleError(error);
    }
  };
  elements.resetSession?.addEventListener('click', resetHandler);
  elements.resetSessionSetup?.addEventListener('click', resetHandler);
  elements.resetSessionReview?.addEventListener('click', resetHandler);

  elements.exportJsonLink?.addEventListener('click', async () => {
    try {
      const sessionId = currentState?.session?.id || 'session';
      await downloadExport('/api/export/current.json', `${sessionId}.json`);
    } catch (error) {
      await handleError(error);
    }
  });

  elements.exportCsvLink?.addEventListener('click', async () => {
    try {
      const sessionId = currentState?.session?.id || 'session';
      await downloadExport('/api/export/current.csv', `${sessionId}.csv`);
    } catch (error) {
      await handleError(error);
    }
  });

  elements.hintSavePreset?.addEventListener('click', async () => {
    const text = String(elements.hintText?.value || '').trim();
    if (!text) {
      return;
    }

    const presets = [...studyConfig().hintPresets];
    if (presets.includes(text)) {
      return;
    }

    try {
      await persistHintPresets([...presets, text]);
    } catch (error) {
      await handleError(error);
    }
  });

  elements.hintForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/hints', {
        text: elements.hintText.value,
        author: actorName(),
      }, {
        headers: buildHeaders(),
      });
      elements.hintText.value = '';
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.clearHint?.addEventListener('click', async () => {
    try {
      await postJson('/api/hints/clear', {
        author: actorName(),
      }, {
        headers: buildHeaders(),
      });
      if (elements.hintText) {
        elements.hintText.value = '';
      }
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.sendRobotCue?.addEventListener('click', async () => {
    if (!selectedPieceId || !selectedSlot) {
      return;
    }

    try {
      await postJson('/api/actions', {
        pieceId: selectedPieceId,
        slot: selectedSlot,
        payload: { origin: 'admin-dashboard' },
        actor: actorName(),
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });
}

init().catch((error) => {
  window.alert(error.message || 'Failed to start the dashboard.');
});
