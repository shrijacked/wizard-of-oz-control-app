import { connectSocket, drawSeriesChart, fetchJson, formatTimestamp, postJson } from './shared.js';

const ADMIN_TOKEN_KEY = 'woz.admin.token';

const POLICY_LABELS = {
  configureSession: 'Configure session',
  updatePreflight: 'Update readiness checklist',
  startSession: 'Start trial',
  completeSession: 'Complete trial',
  updateAdaptiveConfig: 'Tune adaptive controls',
  setHint: 'Broadcast hint',
  logRobotAction: 'Log robot action',
  simulateTelemetry: 'Simulate telemetry',
  resetSession: 'Reset session',
  forceResetSession: 'Force reset session',
};

const elements = {
  sessionId: document.querySelector('#session-id'),
  sessionStarted: document.querySelector('#session-started'),
  sessionForm: document.querySelector('#session-form'),
  sessionStudyId: document.querySelector('#session-study-id'),
  sessionParticipantId: document.querySelector('#session-participant-id'),
  sessionCondition: document.querySelector('#session-condition'),
  sessionResearcher: document.querySelector('#session-researcher'),
  sessionNotes: document.querySelector('#session-notes'),
  sessionSave: document.querySelector('#session-save'),
  sessionStatusSummary: document.querySelector('#session-status-summary'),
  sessionStatusDetail: document.querySelector('#session-status-detail'),
  sessionSummary: document.querySelector('#session-summary'),
  sessionStart: document.querySelector('#session-start'),
  sessionComplete: document.querySelector('#session-complete'),
  preflightForm: document.querySelector('#preflight-form'),
  preflightSummary: document.querySelector('#preflight-summary'),
  preflightDetail: document.querySelector('#preflight-detail'),
  preflightProgress: document.querySelector('#preflight-progress'),
  preflightUpdated: document.querySelector('#preflight-updated'),
  preflightAutomaticList: document.querySelector('#preflight-automatic-list'),
  preflightCamera: document.querySelector('#preflight-camera'),
  preflightSubjectDisplay: document.querySelector('#preflight-subject-display'),
  preflightRobotBoard: document.querySelector('#preflight-robot-board'),
  preflightMaterials: document.querySelector('#preflight-materials'),
  preflightSave: document.querySelector('#preflight-save'),
  guardForm: document.querySelector('#guard-form'),
  guardPin: document.querySelector('#guard-pin'),
  guardUnlock: document.querySelector('#guard-unlock'),
  guardLock: document.querySelector('#guard-lock'),
  guardSummary: document.querySelector('#guard-summary'),
  guardDetail: document.querySelector('#guard-detail'),
  guardMessage: document.querySelector('#guard-message'),
  guardPolicyList: document.querySelector('#guard-policy-list'),
  adaptiveStatus: document.querySelector('#adaptive-status'),
  adaptiveReason: document.querySelector('#adaptive-reason'),
  connectionCounts: document.querySelector('#connection-counts'),
  watchBridgeStatus: document.querySelector('#watch-bridge-status'),
  sensorHealthSummary: document.querySelector('#sensor-health-summary'),
  sensorHealthDetail: document.querySelector('#sensor-health-detail'),
  watchHealthSummary: document.querySelector('#watch-health-summary'),
  watchHealthDetail: document.querySelector('#watch-health-detail'),
  gazeHealthSummary: document.querySelector('#gaze-health-summary'),
  gazeHealthDetail: document.querySelector('#gaze-health-detail'),
  launcherSummary: document.querySelector('#launcher-summary'),
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
  adaptiveConfigForm: document.querySelector('#adaptive-config-form'),
  adaptiveObserveThreshold: document.querySelector('#adaptive-observe-threshold'),
  adaptiveInterveneThreshold: document.querySelector('#adaptive-intervene-threshold'),
  adaptiveHrvWeight: document.querySelector('#adaptive-hrv-weight'),
  adaptiveGazeWeight: document.querySelector('#adaptive-gaze-weight'),
  adaptiveDistractionBoost: document.querySelector('#adaptive-distraction-boost'),
  adaptiveFullFreshness: document.querySelector('#adaptive-full-freshness'),
  adaptiveStaleAfter: document.querySelector('#adaptive-stale-after'),
  adaptiveConfigSave: document.querySelector('#adaptive-config-save'),
  adaptiveConfigReset: document.querySelector('#adaptive-config-reset'),
  adaptiveConfigSummary: document.querySelector('#adaptive-config-summary'),
  adaptiveConfigNote: document.querySelector('#adaptive-config-note'),
  hintForm: document.querySelector('#hint-form'),
  hintText: document.querySelector('#hint-text'),
  hintSend: document.querySelector('#hint-send'),
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
  simulateSubmit: document.querySelector('#simulate-submit'),
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
let guardStatus = null;
let adminToken = window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
let statePollTimer = null;

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : '--';
}

function setValueSafely(element, value) {
  if (!element) {
    return;
  }

  if (document.activeElement === element) {
    return;
  }

  element.value = value ?? '';
}

function setCheckedSafely(element, value) {
  if (!element) {
    return;
  }

  element.checked = Boolean(value);
}

function setAdminToken(token) {
  adminToken = token || '';

  if (adminToken) {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function buildAdminHeaders() {
  return adminToken
    ? {
      'x-admin-token': adminToken,
    }
    : {};
}

function setGuardMessage(message, tone = 'neutral') {
  elements.guardMessage.textContent = message;
  elements.guardMessage.dataset.tone = tone;
}

function adaptiveConfiguration() {
  return currentState?.adaptive?.configuration || null;
}

function adaptiveDefaults() {
  return currentState?.adaptive?.defaults || currentState?.adaptive?.configuration || null;
}

function setAdaptiveConfigurationFields(configuration) {
  if (!configuration) {
    return;
  }

  setValueSafely(elements.adaptiveObserveThreshold, configuration.thresholds?.observe);
  setValueSafely(elements.adaptiveInterveneThreshold, configuration.thresholds?.intervene);
  setValueSafely(elements.adaptiveHrvWeight, configuration.weights?.hrv);
  setValueSafely(elements.adaptiveGazeWeight, configuration.weights?.gaze);
  setValueSafely(elements.adaptiveDistractionBoost, configuration.distractionBoost);
  setValueSafely(elements.adaptiveFullFreshness, configuration.freshness?.fullStrengthSeconds);
  setValueSafely(elements.adaptiveStaleAfter, configuration.freshness?.staleAfterSeconds);
}

function adaptiveSummary(configuration) {
  if (!configuration) {
    return 'Adaptive rules will appear here once the current state is loaded.';
  }

  return `observe at ${formatNumber(configuration.thresholds?.observe)} and intervene at ${formatNumber(configuration.thresholds?.intervene)} with HRV ${formatNumber(configuration.weights?.hrv)} / gaze ${formatNumber(configuration.weights?.gaze)} weighting.`;
}

function adaptiveNote(configuration) {
  if (!configuration) {
    return 'Changes are logged immediately and included in exports.';
  }

  return `Distraction boost ${formatNumber(configuration.distractionBoost)} • full freshness ${configuration.freshness?.fullStrengthSeconds || '--'}s • stale after ${configuration.freshness?.staleAfterSeconds || '--'}s.`;
}

function readAdaptiveConfigurationForm() {
  return {
    thresholds: {
      observe: Number(elements.adaptiveObserveThreshold.value),
      intervene: Number(elements.adaptiveInterveneThreshold.value),
    },
    weights: {
      hrv: Number(elements.adaptiveHrvWeight.value),
      gaze: Number(elements.adaptiveGazeWeight.value),
    },
    distractionBoost: Number(elements.adaptiveDistractionBoost.value),
    freshness: {
      fullStrengthSeconds: Number(elements.adaptiveFullFreshness.value),
      staleAfterSeconds: Number(elements.adaptiveStaleAfter.value),
    },
  };
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

function buildLocalPolicy(actionName) {
  const session = currentState?.session || {};
  const status = session.status || 'setup';
  const metadata = session.metadata || {};
  const preflight = currentState?.system?.preflight || null;

  if (actionName === 'configureSession') {
    return status === 'setup'
      ? { allowed: true, reason: null }
      : { allowed: false, reason: 'Session metadata is locked once the trial has started.' };
  }

  if (actionName === 'updatePreflight') {
    return status === 'setup'
      ? { allowed: true, reason: null }
      : { allowed: false, reason: 'The before-participant checklist is locked once the trial has started.' };
  }

  if (actionName === 'startSession') {
    if (status !== 'setup') {
      return { allowed: false, reason: 'Only setup sessions can be started.' };
    }

    if (!metadata.studyId || !metadata.participantId || !metadata.researcher) {
      return { allowed: false, reason: 'Study ID, participant ID, and researcher must be set before starting the trial.' };
    }

    if ((preflight?.blockingCount || 0) > 0) {
      return { allowed: false, reason: preflight.blockers?.[0]?.summary || 'Resolve the before-participant checklist blockers before starting the trial.' };
    }

    return { allowed: true, reason: null };
  }

  if (actionName === 'completeSession') {
    return status === 'running'
      ? { allowed: true, reason: null }
      : { allowed: false, reason: 'Only running sessions can be completed.' };
  }

  if (actionName === 'updateAdaptiveConfig') {
    return status === 'completed'
      ? { allowed: false, reason: 'Adaptive controls are read-only after completion.' }
      : { allowed: true, reason: null };
  }

  if (actionName === 'setHint' || actionName === 'logRobotAction') {
    return status === 'running'
      ? { allowed: true, reason: null }
      : { allowed: false, reason: 'Hints and robotic actions are only allowed during an active run.' };
  }

  if (actionName === 'simulateTelemetry') {
    return status === 'completed'
      ? { allowed: false, reason: 'Completed sessions are read-only until reset.' }
      : { allowed: true, reason: null };
  }

  if (actionName === 'resetSession') {
    return status === 'running'
      ? { allowed: false, reason: 'Running sessions require a forced reset confirmation.' }
      : { allowed: true, reason: null };
  }

  if (actionName === 'forceResetSession') {
    return { allowed: true, reason: null };
  }

  return { allowed: true, reason: null };
}

function getSafeguardState() {
  const pinRequired = guardStatus?.pinRequired ?? currentState?.system?.safeguards?.pinRequired ?? false;

  return {
    pinRequired,
    authenticated: pinRequired ? Boolean(guardStatus?.authenticated) : true,
    activeUnlocks: currentState?.system?.safeguards?.activeUnlocks ?? guardStatus?.activeUnlocks ?? 0,
    permittedActions: guardStatus?.permittedActions || {},
    sessionStatus: currentState?.session?.status ?? guardStatus?.sessionStatus ?? 'setup',
  };
}

function resolvePolicy(actionName) {
  const safeguard = getSafeguardState();
  if (safeguard.pinRequired && !safeguard.authenticated) {
    return {
      allowed: false,
      reason: 'Unlock this browser with the local admin PIN before using protected controls.',
    };
  }

  return buildLocalPolicy(actionName);
}

function policyMessage(actionName, policy) {
  if (policy.reason) {
    return policy.reason;
  }

  if (actionName === 'forceResetSession') {
    return 'Available if you need to abort a live run and start a fresh log immediately.';
  }

  if (actionName === 'simulateTelemetry') {
    return 'Available during setup and live rehearsals while the session is not completed.';
  }

  if (actionName === 'updateAdaptiveConfig') {
    return 'Available during setup and live sessions. Every change is logged into the export bundle.';
  }

  return 'Ready in the current session state.';
}

function setElementDisabled(element, disabled, reason = '') {
  if (!element) {
    return;
  }

  element.disabled = disabled;
  element.title = disabled ? reason : '';
}

function renderGuardStatus() {
  const safeguard = getSafeguardState();

  if (!safeguard.pinRequired) {
    elements.guardSummary.textContent = 'No local admin PIN is configured on this host.';
    elements.guardDetail.textContent = 'Session-phase protections still apply, but any operator on the trusted LAN can use the dashboard until ADMIN_PIN is set.';
  } else if (safeguard.authenticated) {
    elements.guardSummary.textContent = 'Controls are unlocked on this browser.';
    elements.guardDetail.textContent = `${safeguard.activeUnlocks} unlocked browser${safeguard.activeUnlocks === 1 ? '' : 's'} across the local network. Sensor bridges continue to post telemetry without operator unlock.`;
  } else {
    elements.guardSummary.textContent = 'Controls are locked on this browser.';
    elements.guardDetail.textContent = 'Enter the local admin PIN on the host machine to enable hints, robot actions, session changes, and telemetry simulation.';
  }

  setElementDisabled(elements.guardPin, !safeguard.pinRequired || safeguard.authenticated);
  setElementDisabled(
    elements.guardUnlock,
    !safeguard.pinRequired || safeguard.authenticated,
    'This browser is already unlocked.',
  );
  setElementDisabled(
    elements.guardLock,
    !safeguard.pinRequired || !safeguard.authenticated,
    'Unlock the browser before locking it again.',
  );

  const policyEntries = [
    ['configureSession', POLICY_LABELS.configureSession],
    ['updatePreflight', POLICY_LABELS.updatePreflight],
    ['startSession', POLICY_LABELS.startSession],
    ['completeSession', POLICY_LABELS.completeSession],
    ['updateAdaptiveConfig', POLICY_LABELS.updateAdaptiveConfig],
    ['setHint', POLICY_LABELS.setHint],
    ['logRobotAction', POLICY_LABELS.logRobotAction],
    ['simulateTelemetry', POLICY_LABELS.simulateTelemetry],
    ['resetSession', POLICY_LABELS.resetSession],
  ];

  if (safeguard.sessionStatus === 'running') {
    policyEntries.push(['forceResetSession', POLICY_LABELS.forceResetSession]);
  }

  elements.guardPolicyList.innerHTML = '';
  policyEntries.forEach(([actionName, label]) => {
    const policy = resolvePolicy(actionName);
    const item = document.createElement('li');
    item.className = `policy-item ${policy.allowed ? 'allowed' : 'blocked'}`;

    const header = document.createElement('div');
    header.className = 'policy-item-header';

    const title = document.createElement('strong');
    title.textContent = label;
    header.append(title);

    const badge = document.createElement('span');
    badge.className = 'policy-badge';
    badge.textContent = policy.allowed ? 'Ready' : 'Blocked';
    header.append(badge);

    item.append(header);

    const detail = document.createElement('small');
    detail.textContent = policyMessage(actionName, policy);
    item.append(detail);

    elements.guardPolicyList.append(item);
  });

  renderInteractionControls();
}

function renderActionButtons() {
  const actions = currentState?.system?.robotActions || [];
  const actionPolicy = resolvePolicy('logRobotAction');
  elements.actionGrid.innerHTML = '';

  actions.forEach((action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'action-button';
    button.textContent = action.label;
    button.disabled = !actionPolicy.allowed;
    button.title = actionPolicy.allowed ? '' : actionPolicy.reason || '';
    button.addEventListener('click', async () => {
      try {
        await postJson('/api/actions', {
          actionId: action.actionId,
          label: action.label,
          payload: { origin: 'admin-dashboard' },
        }, {
          headers: buildAdminHeaders(),
        });
        setGuardMessage(`Logged ${action.label}.`, 'success');
      } catch (error) {
        await handleAdminError(error);
      }
    });
    elements.actionGrid.append(button);
  });
}

function preflightBadgeText(item) {
  if (item.status === 'ready') {
    return 'Ready';
  }

  if (item.required) {
    return item.status === 'warning' ? 'Attention' : 'Blocked';
  }

  return 'Recommended';
}

function preflightItemClass(item) {
  if (item.status === 'ready') {
    return 'allowed';
  }

  if (item.status === 'blocked') {
    return 'blocked';
  }

  return 'warning';
}

function renderPreflight() {
  const preflight = currentState?.system?.preflight;
  const acknowledgements = currentState?.preflight?.acknowledgements || {};

  if (!preflight) {
    elements.preflightSummary.textContent = 'Readiness details are not available yet.';
    elements.preflightDetail.textContent = 'The server has not published the before-participant gate.';
    elements.preflightProgress.textContent = '0 of 0 checks ready.';
    elements.preflightUpdated.textContent = 'Manual confirmations have not been saved yet.';
    elements.preflightAutomaticList.innerHTML = '';
    return;
  }

  elements.preflightSummary.textContent = preflight.summary;
  elements.preflightDetail.textContent = preflight.detail;
  elements.preflightProgress.textContent = `${preflight.progress?.readyCount || 0} of ${preflight.progress?.totalCount || 0} checks ready`;
  elements.preflightProgress.dataset.tone = preflight.blockingCount > 0
    ? 'warning'
    : (preflight.warningCount > 0 ? 'neutral' : 'success');
  elements.preflightUpdated.textContent = preflight.updatedAt
    ? `Manual checklist last updated ${formatTimestamp(preflight.updatedAt)} by ${preflight.updatedBy || 'researcher'}.`
    : 'Manual confirmations have not been saved yet.';

  elements.preflightAutomaticList.innerHTML = '';
  (preflight.automaticItems || []).forEach((item) => {
    const entry = document.createElement('li');
    entry.className = `policy-item ${preflightItemClass(item)}`;

    const header = document.createElement('div');
    header.className = 'policy-item-header';

    const title = document.createElement('strong');
    title.textContent = item.label;
    header.append(title);

    const badge = document.createElement('span');
    badge.className = 'policy-badge';
    badge.textContent = preflightBadgeText(item);
    header.append(badge);

    entry.append(header);

    const summary = document.createElement('small');
    summary.textContent = item.summary;
    entry.append(summary);

    const detail = document.createElement('small');
    detail.textContent = item.detail;
    entry.append(detail);

    elements.preflightAutomaticList.append(entry);
  });

  setCheckedSafely(elements.preflightCamera, acknowledgements.cameraFramingChecked);
  setCheckedSafely(elements.preflightSubjectDisplay, acknowledgements.subjectDisplayChecked);
  setCheckedSafely(elements.preflightRobotBoard, acknowledgements.robotBoardReady);
  setCheckedSafely(elements.preflightMaterials, acknowledgements.materialsReset);
}

function renderInteractionControls() {
  const configurePolicy = resolvePolicy('configureSession');
  const preflightPolicy = resolvePolicy('updatePreflight');
  const startPolicy = resolvePolicy('startSession');
  const completePolicy = resolvePolicy('completeSession');
  const adaptiveConfigPolicy = resolvePolicy('updateAdaptiveConfig');
  const hintPolicy = resolvePolicy('setHint');
  const simulatePolicy = resolvePolicy('simulateTelemetry');
  const resetPolicy = resolvePolicy('resetSession');
  const forceResetPolicy = resolvePolicy('forceResetSession');
  const sessionStatus = currentState?.session?.status || 'setup';
  const resetControlPolicy = sessionStatus === 'running' ? forceResetPolicy : resetPolicy;

  [
    elements.sessionStudyId,
    elements.sessionParticipantId,
    elements.sessionCondition,
    elements.sessionResearcher,
    elements.sessionNotes,
    elements.sessionSave,
  ].forEach((element) => {
    setElementDisabled(element, !configurePolicy.allowed, configurePolicy.reason || '');
  });

  [
    elements.preflightCamera,
    elements.preflightSubjectDisplay,
    elements.preflightRobotBoard,
    elements.preflightMaterials,
    elements.preflightSave,
  ].forEach((element) => {
    setElementDisabled(element, !preflightPolicy.allowed, preflightPolicy.reason || '');
  });

  setElementDisabled(elements.sessionStart, !startPolicy.allowed, startPolicy.reason || '');
  setElementDisabled(elements.sessionComplete, !completePolicy.allowed, completePolicy.reason || '');
  setElementDisabled(elements.sessionSummary, !completePolicy.allowed, completePolicy.reason || '');

  [
    elements.adaptiveObserveThreshold,
    elements.adaptiveInterveneThreshold,
    elements.adaptiveHrvWeight,
    elements.adaptiveGazeWeight,
    elements.adaptiveDistractionBoost,
    elements.adaptiveFullFreshness,
    elements.adaptiveStaleAfter,
    elements.adaptiveConfigSave,
    elements.adaptiveConfigReset,
  ].forEach((element) => {
    setElementDisabled(element, !adaptiveConfigPolicy.allowed, adaptiveConfigPolicy.reason || '');
  });

  setElementDisabled(elements.hintText, !hintPolicy.allowed, hintPolicy.reason || '');
  setElementDisabled(elements.hintSend, !hintPolicy.allowed, hintPolicy.reason || '');
  setElementDisabled(elements.clearHint, !hintPolicy.allowed, hintPolicy.reason || '');
  setElementDisabled(
    elements.useLlmHint,
    !hintPolicy.allowed || !currentState?.adaptive?.advisory?.recommendedHint,
    hintPolicy.reason || 'No suggested hint is available yet.',
  );

  [
    elements.simStress,
    elements.simAttention,
    elements.simFixation,
    elements.simDistraction,
    elements.simulateSubmit,
    elements.presetObserve,
    elements.presetIntervene,
  ].forEach((element) => {
    setElementDisabled(element, !simulatePolicy.allowed, simulatePolicy.reason || '');
  });

  elements.resetSession.textContent = sessionStatus === 'running' ? 'Force reset session' : 'Reset session';
  setElementDisabled(elements.resetSession, !resetControlPolicy.allowed, resetControlPolicy.reason || '');

  renderActionButtons();
}

function renderState() {
  if (!currentState) {
    return;
  }

  elements.sessionId.textContent = currentState.session.id;
  elements.sessionStarted.textContent = `Created ${formatTimestamp(currentState.session.startedAt)}`;

  const session = currentState.session;
  const metadata = session.metadata || {};
  setValueSafely(elements.sessionStudyId, metadata.studyId);
  setValueSafely(elements.sessionParticipantId, metadata.participantId);
  setValueSafely(elements.sessionCondition, metadata.condition || 'adaptive');
  setValueSafely(elements.sessionResearcher, metadata.researcher);
  setValueSafely(elements.sessionNotes, metadata.notes);

  const statusLabel = session.status ? session.status.toUpperCase() : 'SETUP';
  elements.sessionStatusSummary.textContent = `${statusLabel} • ${metadata.participantId || 'participant not assigned'}`;
  if (session.status === 'running') {
    elements.sessionStatusDetail.textContent = `Trial started ${formatTimestamp(session.trialStartedAt)} by ${metadata.researcher || 'researcher'}. Hints and robotic actions are now enabled.`;
  } else if (session.status === 'completed') {
    elements.sessionStatusDetail.textContent = session.completedSummary
      ? `${session.completedSummary} Completed ${formatTimestamp(session.completedAt)}. The session is now read-only until reset.`
      : `Completed ${formatTimestamp(session.completedAt)}. The session is now read-only until reset.`;
  } else {
    elements.sessionStatusDetail.textContent = 'Save metadata, then start the trial when the participant is ready. During setup, only session configuration and telemetry rehearsal are available.';
  }
  setValueSafely(elements.sessionSummary, session.completedSummary);

  const adaptive = currentState.adaptive;
  const configuration = adaptive.configuration;
  elements.adaptiveStatus.textContent = `${adaptive.status.toUpperCase()} • ${formatNumber(adaptive.score)}`;
  elements.adaptiveReason.textContent = adaptive.reason;
  elements.adaptiveStatus.dataset.status = adaptive.status;
  setAdaptiveConfigurationFields(configuration);
  elements.adaptiveConfigSummary.textContent = adaptiveSummary(configuration);
  elements.adaptiveConfigNote.textContent = adaptiveNote(configuration);

  const connections = currentState.system.connections;
  const sensorHealth = currentState.system.sensorHealth || {};
  const watchHealth = sensorHealth.watch || {};
  const gazeHealth = sensorHealth.gaze || {};
  elements.connectionCounts.textContent = `${connections.admin} admin / ${connections.subject} subject / ${connections.audit} audit`;

  const watchStatus = currentState.system.watchBridge;
  elements.watchBridgeStatus.textContent = sensorHealth.overall?.summary
    || (watchStatus.lastProcessedAt
      ? `Watch file ${watchStatus.filePath} • last processed ${formatTimestamp(watchStatus.lastProcessedAt)}`
      : `Watching ${watchStatus.filePath} for HRV updates`);
  elements.sensorHealthSummary.textContent = sensorHealth.overall?.summary || 'Sensor health is unavailable.';
  elements.sensorHealthDetail.textContent = sensorHealth.overall?.detail || 'The server has not published sensor health details yet.';
  elements.watchHealthSummary.textContent = watchHealth.summary || 'Watch bridge status is unavailable.';
  elements.watchHealthDetail.textContent = watchHealth.detail || `Watching ${watchStatus.filePath} for HRV updates.`;
  elements.gazeHealthSummary.textContent = gazeHealth.summary || 'Gaze bridge status is unavailable.';
  elements.gazeHealthDetail.textContent = gazeHealth.detail || 'The gaze bridge has not reported any status yet.';
  elements.launcherSummary.textContent = `Launch the local stack with npm run launch:study, then check ${sensorHealth.overall?.issueCount || 0} active sensor issue${(sensorHealth.overall?.issueCount || 0) === 1 ? '' : 's'} here.`;
  renderPreflight();

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

  renderLinks(elements.localhostLinks, currentState.system.network.localhost);
  renderLanLinks(elements.lanLinks, currentState.system.network.lan);
  renderCharts();
  renderGuardStatus();
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

async function refreshStateSnapshot() {
  currentState = await fetchJson('/api/state');
  renderState();
}

async function refreshExportManifest() {
  exportManifest = await fetchJson('/api/exports');
  renderExportInfo();
}

async function refreshGuardStatus() {
  guardStatus = await fetchJson('/api/guard', {
    headers: buildAdminHeaders(),
  });

  if (guardStatus.pinRequired && !guardStatus.authenticated && adminToken) {
    setAdminToken('');
  }

  renderGuardStatus();
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

  await postJson('/api/telemetry/simulate', payload, {
    headers: buildAdminHeaders(),
  });
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

async function handleAdminError(error) {
  if (error.status === 423) {
    setAdminToken('');
  }

  if (error.status === 401 || error.status === 409 || error.status === 423) {
    setGuardMessage(error.message, 'warning');
    await refreshGuardStatus();
    return;
  }

  setGuardMessage(error.message || 'Unexpected dashboard error.', 'warning');
  window.alert(error.message);
}

async function init() {
  setGuardMessage('Loading safeguard status...', 'neutral');

  await Promise.all([
    bootstrapState(),
    refreshExportManifest(),
    refreshGuardStatus(),
  ]);

  statePollTimer = window.setInterval(() => {
    refreshStateSnapshot().catch((error) => {
      setGuardMessage(error.message || 'State refresh failed.', 'warning');
    });
  }, 10000);

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

  elements.guardForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const response = await postJson('/api/guard/unlock', {
        pin: elements.guardPin.value,
      });
      setAdminToken(response.token);
      elements.guardPin.value = '';
      setGuardMessage('Controls unlocked on this browser.', 'success');
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.guardLock.addEventListener('click', async () => {
    if (!getSafeguardState().pinRequired) {
      setGuardMessage('No admin PIN is configured, so there is nothing to lock locally.', 'neutral');
      return;
    }

    try {
      await postJson('/api/guard/lock', {}, {
        headers: buildAdminHeaders(),
      });
      setAdminToken('');
      setGuardMessage('Controls locked on this browser.', 'success');
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.hintForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/hints', { text: elements.hintText.value }, {
        headers: buildAdminHeaders(),
      });
      elements.hintText.value = '';
      setGuardMessage('Hint broadcast to the participant display.', 'success');
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.sessionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/session/configure', {
        studyId: elements.sessionStudyId.value,
        participantId: elements.sessionParticipantId.value,
        condition: elements.sessionCondition.value,
        researcher: elements.sessionResearcher.value,
        notes: elements.sessionNotes.value,
      }, {
        headers: buildAdminHeaders(),
      });
      setGuardMessage('Session profile saved.', 'success');
      await refreshExportManifest();
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.preflightForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/preflight/acknowledgements', {
        acknowledgements: {
          cameraFramingChecked: elements.preflightCamera.checked,
          subjectDisplayChecked: elements.preflightSubjectDisplay.checked,
          robotBoardReady: elements.preflightRobotBoard.checked,
          materialsReset: elements.preflightMaterials.checked,
        },
        actor: elements.sessionResearcher.value || 'researcher',
      }, {
        headers: buildAdminHeaders(),
      });
      setGuardMessage('Before-participant checklist saved.', 'success');
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.sessionStart.addEventListener('click', async () => {
    try {
      await postJson('/api/session/start', {
        operator: elements.sessionResearcher.value || 'researcher',
      }, {
        headers: buildAdminHeaders(),
      });
      setGuardMessage('Trial started. Live interventions are now enabled.', 'success');
      await refreshExportManifest();
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.sessionComplete.addEventListener('click', async () => {
    try {
      await postJson('/api/session/complete', {
        operator: elements.sessionResearcher.value || 'researcher',
        summary: elements.sessionSummary.value,
      }, {
        headers: buildAdminHeaders(),
      });
      setGuardMessage('Trial marked complete. The session is now read-only until reset.', 'success');
      await refreshExportManifest();
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.adaptiveConfigForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/adaptive/config', readAdaptiveConfigurationForm(), {
        headers: buildAdminHeaders(),
      });
      setGuardMessage('Adaptive controls updated for the current session.', 'success');
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  elements.adaptiveConfigReset.addEventListener('click', async () => {
    const defaults = adaptiveDefaults();
    if (!defaults) {
      return;
    }

    try {
      await postJson('/api/adaptive/config', defaults, {
        headers: buildAdminHeaders(),
      });
      setGuardMessage('Adaptive controls reset to the default rule set.', 'success');
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
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
      setGuardMessage('Simulated telemetry pushed into the adaptive engine.', 'success');
    } catch (error) {
      await handleAdminError(error);
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
    const isRunning = (currentState?.session?.status || 'setup') === 'running';
    const message = isRunning
      ? 'Force reset the live session and start a fresh log immediately?'
      : 'Reset the current session and start a fresh log?';
    const confirmed = window.confirm(message);
    if (!confirmed) {
      return;
    }

    try {
      await postJson('/api/session/reset', {
        requestedBy: 'researcher',
        force: isRunning,
      }, {
        headers: buildAdminHeaders(),
      });
      timelineEvents = [];
      setGuardMessage('Session reset. A fresh log is ready.', 'success');
      await bootstrapState();
      await refreshExportManifest();
      await refreshGuardStatus();
    } catch (error) {
      await handleAdminError(error);
    }
  });

  window.addEventListener('resize', renderCharts);
  window.addEventListener('beforeunload', () => {
    if (statePollTimer) {
      window.clearInterval(statePollTimer);
    }
  });
}

init().catch((error) => {
  setGuardMessage(error.message || 'Failed to initialize the dashboard.', 'warning');
  window.alert(error.message);
});
