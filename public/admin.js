import {
  connectSocket,
  fetchJson,
  formatDurationSeconds,
  formatTimestamp,
  postJson,
} from './shared.js';
import { createCameraController } from './admin-camera.mjs';
import { bindCameraControls } from './admin-controls.mjs';

const ADMIN_TOKEN_KEY = 'woz.admin.token';

const elements = {
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
  selectedSetSummary: document.querySelector('#selected-set-summary'),
  selectedSetDetail: document.querySelector('#selected-set-detail'),
  solutionPreview: document.querySelector('#solution-preview'),
  sessionStatusSummary: document.querySelector('#session-status-summary'),
  sessionStatusDetail: document.querySelector('#session-status-detail'),
  sessionDurationSummary: document.querySelector('#session-duration-summary'),
  sessionDurationDetail: document.querySelector('#session-duration-detail'),
  connectionCounts: document.querySelector('#connection-counts'),
  screenLinks: document.querySelector('#screen-links'),
  sessionStart: document.querySelector('#session-start'),
  sessionComplete: document.querySelector('#session-complete'),
  resetSession: document.querySelector('#reset-session'),
  exportJsonLink: document.querySelector('#export-json-link'),
  exportCsvLink: document.querySelector('#export-csv-link'),
  hintForm: document.querySelector('#hint-form'),
  hintText: document.querySelector('#hint-text'),
  hintSend: document.querySelector('#hint-send'),
  clearHint: document.querySelector('#clear-hint'),
  hintPreview: document.querySelector('#hint-preview'),
  actionGrid: document.querySelector('#action-grid'),
  latestAction: document.querySelector('#latest-action'),
  startCamera: document.querySelector('#start-camera'),
  stopCamera: document.querySelector('#stop-camera'),
  cameraFeed: document.querySelector('#camera-feed'),
  cameraStatus: document.querySelector('#camera-status'),
};

let currentState = null;
let guardStatus = null;
let adminToken = window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
let durationTicker = null;
let previewSetId = null;

const cameraController = createCameraController({
  videoElement: elements.cameraFeed,
  statusElement: elements.cameraStatus,
  mediaDevices: window.navigator?.mediaDevices || null,
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

function selectedPuzzleSet() {
  return currentState?.session?.puzzleSet || null;
}

function availablePuzzleSets() {
  return currentState?.assets?.puzzleSets || [];
}

function incompleteUploads() {
  return currentState?.assets?.incompleteUploads || [];
}

function getPreviewSet() {
  const selected = selectedPuzzleSet();
  const allSets = availablePuzzleSets();

  if (selected && (!previewSetId || previewSetId === selected.setId)) {
    previewSetId = selected.setId;
    return selected;
  }

  const preview = allSets.find((entry) => entry.setId === previewSetId);
  if (preview) {
    return preview;
  }

  previewSetId = allSets[0]?.setId || null;
  return allSets[0] || null;
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
    container.append(frame);
    return;
  }

  const image = document.createElement('img');
  image.className = 'reference-preview-image';
  image.src = asset.urlPath;
  image.alt = asset.originalName;
  container.append(image);
}

function connectionText() {
  const connections = currentState?.system?.connections || {};
  return `${connections.admin || 0} admin / ${connections.subject || 0} subject / ${connections.robot || 0} robot`;
}

function localPolicy(action) {
  const session = currentState?.session || {};
  const status = session.status || 'setup';

  if (action === 'configureSession' || action === 'selectPuzzleSet') {
    return status === 'setup'
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: 'Session setup is locked once the trial starts.' };
  }

  if (action === 'startSession') {
    if (status !== 'setup') {
      return { allowed: false, reason: 'Only setup sessions can be started.' };
    }

    if (!session.puzzleSet) {
      return { allowed: false, reason: 'Choose a puzzle set before starting the trial.' };
    }

    return { allowed: true, reason: '' };
  }

  if (action === 'completeSession') {
    return status === 'running'
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: 'Only running sessions can be completed.' };
  }

  if (action === 'setHint' || action === 'logRobotAction') {
    return status === 'running'
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: 'Hints and robot cues are only available during an active trial.' };
  }

  if (action === 'resetSession') {
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

function renderPuzzleLibrary() {
  const selected = selectedPuzzleSet();
  const preview = getPreviewSet();

  setText(
    elements.selectedSetSummary,
    selected ? `Set ${selected.setId} is active for this session.` : 'No puzzle set selected yet.',
  );
  setText(
    elements.selectedSetDetail,
    selected
      ? `Subject: ${selected.subjectAsset.originalName} • Solution: ${selected.solutionAsset.originalName}`
      : 'Upload a subject file and a matching solution file ending in s, then choose the set.',
  );
  renderAssetPreview(
    elements.solutionPreview,
    preview?.solutionAsset || selected?.solutionAsset || null,
    'The selected solution preview will appear here.',
  );

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
      if (selected?.setId === entry.setId) {
        card.classList.add('selected');
      }
      if (preview?.setId === entry.setId) {
        card.classList.add('previewing');
      }

      const title = document.createElement('strong');
      title.textContent = `Set ${entry.setId}`;
      card.append(title);

      const meta = document.createElement('small');
      meta.textContent = `Subject ${entry.subjectAsset.originalName} • Solution ${entry.solutionAsset.originalName}`;
      card.append(meta);

      const actions = document.createElement('div');
      actions.className = 'button-row';

      const previewButton = document.createElement('button');
      previewButton.type = 'button';
      previewButton.className = 'button button-ghost';
      previewButton.textContent = preview?.setId === entry.setId ? 'Previewing' : 'Preview';
      previewButton.disabled = preview?.setId === entry.setId;
      previewButton.addEventListener('click', () => {
        previewSetId = entry.setId;
        renderPuzzleLibrary();
      });
      actions.append(previewButton);

      const selectPolicy = resolvePolicy('selectPuzzleSet');
      const selectButton = document.createElement('button');
      selectButton.type = 'button';
      selectButton.className = 'button button-primary';
      selectButton.textContent = selected?.setId === entry.setId ? 'Selected' : 'Use set';
      selectButton.disabled = !selectPolicy.allowed || selected?.setId === entry.setId;
      selectButton.title = selectButton.disabled ? selectPolicy.reason : '';
      selectButton.addEventListener('click', async () => {
        try {
          await postJson('/api/puzzles/select', {
            setId: entry.setId,
            actor: elements.sessionResearcher?.value || currentState?.session?.metadata?.researcher || 'researcher',
          }, {
            headers: buildHeaders(),
          });
          await refreshAll();
        } catch (error) {
          await handleError(error);
        }
      });
      actions.append(selectButton);

      card.append(actions);
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

function renderSession() {
  const session = currentState?.session || {};
  const metadata = session.metadata || {};
  const status = session.status || 'setup';
  const label = status.toUpperCase();
  const durationSeconds = session.trialStartedAt
    ? Math.max(0, Math.round(((session.completedAt ? new Date(session.completedAt) : new Date()).getTime() - new Date(session.trialStartedAt).getTime()) / 1000))
    : null;

  setValueSafely(elements.sessionStudyId, metadata.studyId);
  setValueSafely(elements.sessionParticipantId, metadata.participantId);
  setValueSafely(elements.sessionResearcher, metadata.researcher);
  setValueSafely(elements.sessionCondition, metadata.condition || 'adaptive');
  setValueSafely(elements.sessionNotes, metadata.notes);

  setText(elements.sessionStatusSummary, `${label}${metadata.participantId ? ` • ${metadata.participantId}` : ''}`);

  if (status === 'running') {
    setText(elements.sessionStatusDetail, `Trial started ${formatTimestamp(session.trialStartedAt)}.`);
    setText(elements.sessionDurationSummary, `Elapsed puzzle time: ${formatDurationSeconds(durationSeconds)}`);
    setText(elements.sessionDurationDetail, 'Hints and robot cues are live on the two operator-facing screens.');
  } else if (status === 'completed') {
    setText(elements.sessionStatusDetail, `Trial completed ${formatTimestamp(session.completedAt)}.`);
    setText(elements.sessionDurationSummary, `Puzzle completed in ${formatDurationSeconds(durationSeconds)}`);
    setText(elements.sessionDurationDetail, 'Download the JSON export or reset the session for the next participant.');
  } else {
    setText(elements.sessionStatusDetail, 'Choose a puzzle set, then start the trial when ready.');
    setText(elements.sessionDurationSummary, 'Trial timer is waiting for the session to start.');
    setText(elements.sessionDurationDetail, 'The completion time will appear here as soon as the puzzle begins.');
  }

  setText(elements.connectionCounts, connectionText());
  const localhost = currentState?.system?.network?.localhost || {};
  setText(
    elements.screenLinks,
    `Subject ${localhost.subject || `${window.location.origin}/subject`} • Robot ${localhost.robot || `${window.location.origin}/robot`}`,
  );
  setText(elements.hintPreview, currentState?.hint?.text || 'No hint has been sent yet.');
  setText(
    elements.latestAction,
    currentState?.robotAction?.updatedAt
      ? `${currentState.robotAction.label} • ${formatTimestamp(currentState.robotAction.updatedAt)}`
      : 'No robotic action logged yet.',
  );

  const startPolicy = resolvePolicy('startSession');
  const completePolicy = resolvePolicy('completeSession');
  const hintPolicy = resolvePolicy('setHint');
  const actionPolicy = resolvePolicy('logRobotAction');
  const sessionPolicy = resolvePolicy('configureSession');
  const resetPolicy = resolvePolicy('resetSession');

  [
    elements.sessionStudyId,
    elements.sessionParticipantId,
    elements.sessionResearcher,
    elements.sessionCondition,
    elements.sessionNotes,
    elements.sessionSave,
    elements.puzzleUploadInput,
    elements.puzzleUploadSubmit,
    elements.puzzleClearSelection,
  ].forEach((element) => {
    setElementDisabled(element, !sessionPolicy.allowed, sessionPolicy.reason);
  });

  setElementDisabled(elements.sessionStart, !startPolicy.allowed, startPolicy.reason);
  setElementDisabled(elements.sessionComplete, !completePolicy.allowed, completePolicy.reason);
  setElementDisabled(elements.hintText, !hintPolicy.allowed, hintPolicy.reason);
  setElementDisabled(elements.hintSend, !hintPolicy.allowed, hintPolicy.reason);
  setElementDisabled(elements.clearHint, !hintPolicy.allowed, hintPolicy.reason);
  setElementDisabled(elements.resetSession, !resetPolicy.allowed, resetPolicy.reason);

  renderActionButtons(actionPolicy);

  if (elements.exportJsonLink) {
    elements.exportJsonLink.download = `${session.id || 'session'}.json`;
  }
  if (elements.exportCsvLink) {
    elements.exportCsvLink.download = `${session.id || 'session'}.csv`;
  }
}

function renderActionButtons(actionPolicy) {
  if (!elements.actionGrid) {
    return;
  }

  elements.actionGrid.innerHTML = '';
  const actions = currentState?.system?.robotActions || [];

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-button';
    button.textContent = action.label;
    button.disabled = !actionPolicy.allowed;
    button.title = actionPolicy.allowed ? '' : actionPolicy.reason;
    button.addEventListener('click', async () => {
      try {
        await postJson('/api/actions', {
          actionId: action.actionId,
          label: action.label,
          payload: { origin: 'admin-dashboard' },
          actor: elements.sessionResearcher?.value || currentState?.session?.metadata?.researcher || 'researcher',
        }, {
          headers: buildHeaders(),
        });
        await refreshAll();
      } catch (error) {
        await handleError(error);
      }
    });
    elements.actionGrid.append(button);
  });
}

function renderState() {
  if (!currentState) {
    return;
  }

  renderGuard();
  renderPuzzleLibrary();
  renderSession();
}

async function refreshState() {
  currentState = await fetchJson('/api/state');
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
  renderSession();
}

async function refreshAll() {
  await Promise.all([
    refreshState(),
    refreshGuard(),
  ]);
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

async function startCamera() {
  await cameraController.start();
}

function stopCamera() {
  cameraController.stop();
}

async function init() {
  bindCameraControls({
    startButton: elements.startCamera,
    stopButton: elements.stopCamera,
    onStart: startCamera,
    onStop: stopCamera,
  });

  await refreshAll();

  durationTicker = window.setInterval(() => {
    if (currentState?.session?.status === 'running') {
      renderSession();
    }
  }, 1000);

  connectSocket('admin', {
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
      await refreshGuard();
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
        actor: elements.sessionResearcher?.value || currentState?.session?.metadata?.researcher || 'researcher',
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
      await postJson('/api/puzzles/select', {
        setId: null,
        actor: elements.sessionResearcher?.value || currentState?.session?.metadata?.researcher || 'researcher',
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.sessionStart?.addEventListener('click', async () => {
    try {
      await postJson('/api/session/start', {
        operator: elements.sessionResearcher.value || currentState?.session?.metadata?.researcher || 'researcher',
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.sessionComplete?.addEventListener('click', async () => {
    try {
      await postJson('/api/session/complete', {
        operator: elements.sessionResearcher.value || currentState?.session?.metadata?.researcher || 'researcher',
      }, {
        headers: buildHeaders(),
      });
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.resetSession?.addEventListener('click', async () => {
    const isRunning = (currentState?.session?.status || 'setup') === 'running';
    const confirmed = window.confirm(
      isRunning
        ? 'Reset the live session and start fresh?'
        : 'Reset the current session and clear the selected run state?',
    );
    if (!confirmed) {
      return;
    }

    try {
      await postJson('/api/session/reset', {
        requestedBy: elements.sessionResearcher.value || currentState?.session?.metadata?.researcher || 'researcher',
        force: isRunning,
      }, {
        headers: buildHeaders(),
      });
      previewSetId = null;
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.hintForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/hints', {
        text: elements.hintText.value,
        author: elements.sessionResearcher.value || currentState?.session?.metadata?.researcher || 'researcher',
      }, {
        headers: buildHeaders(),
      });
      elements.hintText.value = '';
      await refreshState();
    } catch (error) {
      await handleError(error);
    }
  });

  elements.clearHint?.addEventListener('click', () => {
    if (elements.hintText) {
      elements.hintText.value = '';
    }
  });
}

init().catch((error) => {
  window.alert(error.message || 'Failed to start the dashboard.');
});
