import { connectSocket, drawSeriesChart, fetchJson, formatTimestamp, postJson } from './shared.js';

const elements = {
  sessionId: document.querySelector('#session-id'),
  sessionStarted: document.querySelector('#session-started'),
  adaptiveStatus: document.querySelector('#adaptive-status'),
  adaptiveReason: document.querySelector('#adaptive-reason'),
  connectionCounts: document.querySelector('#connection-counts'),
  watchBridgeStatus: document.querySelector('#watch-bridge-status'),
  metricHr: document.querySelector('#metric-hr'),
  metricStress: document.querySelector('#metric-stress'),
  metricStressLevel: document.querySelector('#metric-stress-level'),
  metricAttention: document.querySelector('#metric-attention'),
  metricFixation: document.querySelector('#metric-fixation'),
  gazeBridgeSummary: document.querySelector('#gaze-bridge-summary'),
  gazeBridgeDetail: document.querySelector('#gaze-bridge-detail'),
  hrvSource: document.querySelector('#hrv-source'),
  gazeSource: document.querySelector('#gaze-source'),
  hrvChart: document.querySelector('#hrv-chart'),
  gazeChart: document.querySelector('#gaze-chart'),
  hintForm: document.querySelector('#hint-form'),
  hintText: document.querySelector('#hint-text'),
  hintPreview: document.querySelector('#hint-preview'),
  clearHint: document.querySelector('#clear-hint'),
  llmSummary: document.querySelector('#llm-summary'),
  llmHint: document.querySelector('#llm-hint'),
  useLlmHint: document.querySelector('#use-llm-hint'),
  actionGrid: document.querySelector('#action-grid'),
  latestAction: document.querySelector('#latest-action'),
  simulatorForm: document.querySelector('#simulator-form'),
  simStress: document.querySelector('#sim-stress'),
  simAttention: document.querySelector('#sim-attention'),
  simFixation: document.querySelector('#sim-fixation'),
  simDistraction: document.querySelector('#sim-distraction'),
  presetObserve: document.querySelector('#preset-observe'),
  presetIntervene: document.querySelector('#preset-intervene'),
  currentExportLinks: document.querySelector('#current-export-links'),
  exportSummary: document.querySelector('#export-summary'),
  localhostLinks: document.querySelector('#localhost-links'),
  lanLinks: document.querySelector('#lan-links'),
  eventList: document.querySelector('#event-list'),
  startCamera: document.querySelector('#start-camera'),
  stopCamera: document.querySelector('#stop-camera'),
  cameraFeed: document.querySelector('#camera-feed'),
  cameraStatus: document.querySelector('#camera-status'),
  resetSession: document.querySelector('#reset-session'),
};

let currentState = null;
let timelineEvents = [];
let mediaStream = null;
let exportManifest = null;

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '--';
}

function renderLinks(container, links) {
  container.innerHTML = '';
  Object.entries(links || {}).forEach(([label, href]) => {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = `${label}: ${href}`;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    container.append(anchor);
  });
}

function renderLanLinks(container, lan) {
  container.innerHTML = '';
  if (!lan || !lan.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No external IPv4 interfaces detected yet.';
    container.append(empty);
    return;
  }

  lan.forEach((entry) => {
    const group = document.createElement('div');
    group.className = 'link-group';

    const title = document.createElement('strong');
    title.textContent = entry.address;
    group.append(title);

    Object.values(entry.urls).forEach((href) => {
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.textContent = href;
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      group.append(anchor);
    });

    container.append(group);
  });
}

function renderEvents() {
  elements.eventList.innerHTML = '';

  timelineEvents.forEach((event) => {
    const item = document.createElement('li');
    item.className = 'event-item';

    const summary = document.createElement('strong');
    summary.textContent = event.summary;
    item.append(summary);

    const meta = document.createElement('small');
    meta.textContent = `${event.type} • ${event.source} • ${formatTimestamp(event.timestamp)}`;
    item.append(meta);

    elements.eventList.append(item);
  });
}

function renderCharts() {
  const hrvHistory = currentState?.telemetry?.history?.hrv || [];
  const gazeHistory = currentState?.telemetry?.history?.gaze || [];

  drawSeriesChart(
    elements.hrvChart,
    hrvHistory.map((point) => ({ value: point.stressScore ?? 0 })),
    { label: 'Stress score', stroke: '#d6553d', min: 0, max: 1 },
  );

  drawSeriesChart(
    elements.gazeChart,
    gazeHistory.map((point) => ({ value: point.attentionScore ?? 0 })),
    { label: 'Attention score', stroke: '#0a7a78', min: 0, max: 1 },
  );
}

function renderActionButtons() {
  const actions = currentState?.system?.robotActions || [];
  elements.actionGrid.innerHTML = '';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-button';
    button.textContent = action.label;
    button.addEventListener('click', async () => {
      try {
        await postJson('/api/actions', {
          actionId: action.actionId,
          label: action.label,
          payload: { origin: 'admin-dashboard' },
        });
      } catch (error) {
        window.alert(error.message);
      }
    });
    elements.actionGrid.append(button);
  });
}

function renderState() {
  if (!currentState) {
    return;
  }

  elements.sessionId.textContent = currentState.session.id;
  elements.sessionStarted.textContent = `Started ${formatTimestamp(currentState.session.startedAt)}`;

  const adaptive = currentState.adaptive;
  elements.adaptiveStatus.textContent = `${adaptive.status.toUpperCase()} • ${formatNumber(adaptive.score)}`;
  elements.adaptiveReason.textContent = adaptive.reason;
  elements.adaptiveStatus.dataset.status = adaptive.status;

  const connections = currentState.system.connections;
  elements.connectionCounts.textContent = `${connections.admin} admin / ${connections.subject} subject / ${connections.audit} audit`;

  const watchStatus = currentState.system.watchBridge;
  elements.watchBridgeStatus.textContent = watchStatus.lastProcessedAt
    ? `Watch file ${watchStatus.filePath} • last processed ${formatTimestamp(watchStatus.lastProcessedAt)}`
    : `Watching ${watchStatus.filePath} for HRV updates`;

  const hrv = currentState.telemetry.hrv;
  const gaze = currentState.telemetry.gaze;
  const advisory = adaptive.advisory;
  const gazeBridge = currentState.system.gazeBridge;
  elements.metricHr.textContent = formatNumber(hrv.metrics.hr, 0);
  elements.metricStress.textContent = formatNumber(hrv.stressScore);
  elements.metricStressLevel.textContent = hrv.stressLevel || 'Not Stressed';
  elements.metricAttention.textContent = formatNumber(gaze.attentionScore);
  elements.metricFixation.textContent = formatNumber(gaze.fixationLoss);
  elements.hrvSource.textContent = hrv.source ? `Source: ${hrv.source}` : 'No HRV source yet';
  elements.gazeSource.textContent = gaze.source ? `Source: ${gaze.source}` : 'No gaze source yet';
  elements.gazeBridgeSummary.textContent = gazeBridge?.bridgeId
    ? `${gazeBridge.deviceLabel || gazeBridge.bridgeId} • ${gazeBridge.active ? 'active' : 'stale'}`
    : 'No gaze bridge connected.';
  elements.gazeBridgeDetail.textContent = gazeBridge?.bridgeId
    ? `Bridge ${gazeBridge.bridgeId} via ${gazeBridge.transport || 'unknown transport'} • last frame ${formatTimestamp(gazeBridge.lastFrameAt || gazeBridge.lastHeartbeatAt)}`
    : 'Use the Python bridge or your SDK callback to start streaming gaze frames.';
  elements.hintPreview.textContent = currentState.hint.text || 'No hint has been sent yet.';
  elements.latestAction.textContent = currentState.robotAction.updatedAt
    ? `${currentState.robotAction.label} • ${formatTimestamp(currentState.robotAction.updatedAt)}`
    : 'No robotic action logged yet.';
  elements.llmSummary.textContent = advisory?.summary || 'No LLM recommendation has been generated.';
  elements.llmHint.textContent = advisory?.recommendedHint
    ? `Suggested hint: ${advisory.recommendedHint}`
    : 'Suggested hint: unavailable';
  elements.useLlmHint.disabled = !advisory?.recommendedHint;

  renderLinks(elements.localhostLinks, currentState.system.network.localhost);
  renderLanLinks(elements.lanLinks, currentState.system.network.lan);
  renderCharts();
  renderActionButtons();
}

function renderExportInfo() {
  if (!exportManifest) {
    return;
  }

  const current = exportManifest.sessions.find((session) => session.sessionId === exportManifest.currentSessionId);
  elements.currentExportLinks.innerHTML = '';

  const bundleLink = document.createElement('a');
  bundleLink.href = '/api/exports/current.bundle.json';
  bundleLink.textContent = 'Download current bundle JSON';
  elements.currentExportLinks.append(bundleLink);

  const csvLink = document.createElement('a');
  csvLink.href = '/api/exports/current.csv';
  csvLink.textContent = 'Download current CSV timeline';
  elements.currentExportLinks.append(csvLink);

  elements.exportSummary.textContent = current
    ? `${exportManifest.sessions.length} sessions available • current session has ${current.eventCount} events`
    : `${exportManifest.sessions.length} sessions available`;
}

async function bootstrapState() {
  const [state, events] = await Promise.all([
    fetchJson('/api/state'),
    fetchJson('/api/events?limit=20'),
  ]);
  currentState = state;
  timelineEvents = events.events;
  renderState();
  renderEvents();
}

async function refreshExportManifest() {
  exportManifest = await fetchJson('/api/exports');
  renderExportInfo();
}

function buildStressLevel(stressScore) {
  if (stressScore >= 0.75) {
    return 'High';
  }

  if (stressScore >= 0.45) {
    return 'Mild';
  }

  return 'Not Stressed';
}

async function submitSimulation() {
  const stressScore = Number(elements.simStress.value);
  const attentionScore = Number(elements.simAttention.value);
  const fixationLoss = Number(elements.simFixation.value);
  const distractionDetected = elements.simDistraction.checked;

  const baselineHr = 68;
  const payload = {
    hrv: {
      metrics: {
        hr: Math.round(baselineHr + (stressScore * 28)),
        sdnn: Math.max(10, Math.round(55 - (stressScore * 30))),
        rmssd: Math.max(8, Math.round(42 - (stressScore * 24))),
        pnn50: Math.max(4, Math.round(26 - (stressScore * 16))),
      },
      stressScore,
      stressLevel: buildStressLevel(stressScore),
      distractionDetected,
      interpretation: 'Simulated HRV frame submitted from the dashboard.',
      feedback: 'Simulation mode is active.',
    },
    gaze: {
      attentionScore,
      fixationLoss,
      pupilDilation: Math.min(1, 0.35 + stressScore * 0.4),
    },
  };

  await postJson('/api/telemetry/simulate', payload);
}

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    elements.cameraFeed.srcObject = mediaStream;
    elements.cameraStatus.textContent = 'Live webcam preview active.';
  } catch (error) {
    elements.cameraStatus.textContent = `Unable to start camera: ${error.message}`;
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  elements.cameraFeed.srcObject = null;
  elements.cameraStatus.textContent = 'Camera is off.';
}

async function init() {
  await bootstrapState();
  await refreshExportManifest();

  connectSocket('admin', {
    onSnapshot(state) {
      currentState = state;
      renderState();
    },
    onEvent(event) {
      const existing = timelineEvents.find((entry) => entry.id === event.id);
      if (existing) {
        return;
      }
      timelineEvents = [event, ...timelineEvents].slice(0, 20);
      renderEvents();
    },
  });

  elements.hintForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/hints', { text: elements.hintText.value });
      elements.hintText.value = '';
    } catch (error) {
      window.alert(error.message);
    }
  });

  elements.clearHint.addEventListener('click', () => {
    elements.hintText.value = '';
  });

  elements.useLlmHint.addEventListener('click', () => {
    const advisory = currentState?.adaptive?.advisory;
    if (!advisory?.recommendedHint) {
      return;
    }

    elements.hintText.value = advisory.recommendedHint;
    elements.hintText.focus();
  });

  elements.simulatorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await submitSimulation();
    } catch (error) {
      window.alert(error.message);
    }
  });

  elements.presetObserve.addEventListener('click', () => {
    elements.simStress.value = '0.52';
    elements.simAttention.value = '0.48';
    elements.simFixation.value = '0.45';
    elements.simDistraction.checked = false;
  });

  elements.presetIntervene.addEventListener('click', () => {
    elements.simStress.value = '0.88';
    elements.simAttention.value = '0.14';
    elements.simFixation.value = '0.82';
    elements.simDistraction.checked = true;
  });

  elements.startCamera.addEventListener('click', startCamera);
  elements.stopCamera.addEventListener('click', stopCamera);

  elements.resetSession.addEventListener('click', async () => {
    const confirmed = window.confirm('Reset the current session and start a fresh log?');
    if (!confirmed) {
      return;
    }

    try {
      await postJson('/api/session/reset', { requestedBy: 'researcher' });
      timelineEvents = [];
      await bootstrapState();
      await refreshExportManifest();
    } catch (error) {
      window.alert(error.message);
    }
  });

  window.addEventListener('resize', renderCharts);
}

init().catch((error) => {
  window.alert(error.message);
});
