'use strict';

const MANUAL_PREFLIGHT_ITEMS = Object.freeze([
  {
    id: 'cameraFramingChecked',
    label: 'Camera framing checked',
    detail: 'The overhead webcam shows the full puzzle area and participant workspace.',
  },
  {
    id: 'subjectDisplayChecked',
    label: 'Subject display confirmed',
    detail: 'The participant can clearly see the hint screen and it stays distraction-free.',
  },
  {
    id: 'robotBoardReady',
    label: 'Robot control board ready',
    detail: 'The manual robot controller is reachable and the seven preset actions are available.',
  },
  {
    id: 'materialsReset',
    label: 'Puzzle materials reset',
    detail: 'Puzzle pieces, props, and trial materials are reset for a fresh run.',
  },
]);

function createInitialPreflightAcknowledgements() {
  return Object.fromEntries(MANUAL_PREFLIGHT_ITEMS.map((item) => [item.id, false]));
}

function normalizePreflightAcknowledgements(input = {}) {
  const next = createInitialPreflightAcknowledgements();

  for (const item of MANUAL_PREFLIGHT_ITEMS) {
    if (Object.hasOwn(input, item.id)) {
      next[item.id] = Boolean(input[item.id]);
    }
  }

  return next;
}

function automaticIssueStatus(phase) {
  return phase === 'setup' ? 'blocked' : 'warning';
}

function metadataChecklistItem(session = {}) {
  const metadata = session.metadata || {};
  const missing = [];

  if (!String(metadata.studyId || '').trim()) {
    missing.push('study ID');
  }

  if (!String(metadata.participantId || '').trim()) {
    missing.push('participant ID');
  }

  if (!String(metadata.researcher || '').trim()) {
    missing.push('researcher');
  }

  if (missing.length === 0) {
    return {
      id: 'metadata',
      kind: 'automatic',
      required: true,
      status: 'ready',
      label: 'Session metadata complete',
      summary: 'Study, participant, and researcher metadata are complete.',
      detail: `Study ${metadata.studyId} • participant ${metadata.participantId} • researcher ${metadata.researcher}.`,
    };
  }

  return {
    id: 'metadata',
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(session.status || 'setup'),
    label: 'Session metadata complete',
    summary: `Add ${missing.join(', ')} before starting the trial.`,
    detail: 'The before-participant checklist requires those identifiers so exports stay analyzable later.',
  };
}

function subjectDisplayChecklistItem(phase, connections = {}) {
  const subjectCount = Number(connections.subject || 0);

  if (subjectCount >= 1) {
    return {
      id: 'subject-display',
      kind: 'automatic',
      required: true,
      status: 'ready',
      label: 'Subject display connected',
      summary: 'The participant hint display is connected.',
      detail: `${subjectCount} subject display connection${subjectCount === 1 ? '' : 's'} active on the local network.`,
    };
  }

  return {
    id: 'subject-display',
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(phase),
    label: 'Subject display connected',
    summary: 'Open /subject on the participant display before starting.',
    detail: 'The subject screen needs an active WebSocket connection so hints appear instantly during the run.',
  };
}

function telemetryChecklistItem({
  id,
  label,
  phase,
  updatedAt,
  health = {},
  waitingDetail,
}) {
  const acceptsDirectIngest = updatedAt && health.state !== 'stale' && health.state !== 'offline' && health.level !== 'error';

  if (acceptsDirectIngest) {
    return {
      id,
      kind: 'automatic',
      required: true,
      status: 'ready',
      label,
      summary: `${label} is live.`,
      detail: health.detail || `Last sample received at ${updatedAt}.`,
    };
  }

  const summary = updatedAt
    ? (health.summary || `${label} needs attention.`)
    : `No ${label.toLowerCase()} sample has been received yet.`;
  const detail = updatedAt
    ? (health.detail || waitingDetail)
    : waitingDetail;

  return {
    id,
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(phase),
    label,
    summary,
    detail,
  };
}

function auditChecklistItem(connections = {}) {
  const auditCount = Number(connections.audit || 0);

  if (auditCount >= 1) {
    return {
      id: 'audit-display',
      kind: 'automatic',
      required: false,
      status: 'ready',
      label: 'Audit display connected',
      summary: 'An audit display is connected.',
      detail: `${auditCount} audit display connection${auditCount === 1 ? '' : 's'} active on the local network.`,
    };
  }

  return {
    id: 'audit-display',
    kind: 'automatic',
    required: false,
    status: 'warning',
    label: 'Audit display connected',
    summary: 'Audit display is optional, but opening /audit gives the team a second view of robot actions.',
    detail: 'You can proceed without it, but a phone or tablet on /audit makes manual action logging easier to verify.',
  };
}

function manualChecklistItems(acknowledgements = {}, phase = 'setup') {
  return MANUAL_PREFLIGHT_ITEMS.map((item) => {
    const acknowledged = Boolean(acknowledgements[item.id]);

    return {
      id: item.id,
      kind: 'manual',
      required: true,
      acknowledged,
      status: acknowledged ? 'ready' : automaticIssueStatus(phase),
      label: item.label,
      summary: acknowledged ? `${item.label} is confirmed.` : `Confirm ${item.label.toLowerCase()} before the run.`,
      detail: item.detail,
    };
  });
}

function summarizePreflight(input = {}) {
  const state = input.state || {};
  const system = input.system || {};
  const phase = state.session?.status || 'setup';
  const telemetry = state.telemetry || {};
  const sensorHealth = system.sensorHealth || {};
  const acknowledgements = normalizePreflightAcknowledgements(state.preflight?.acknowledgements || {});

  const automaticItems = [
    metadataChecklistItem(state.session || {}),
    subjectDisplayChecklistItem(phase, system.connections || {}),
    telemetryChecklistItem({
      id: 'watch-telemetry',
      label: 'HRV telemetry',
      phase,
      updatedAt: telemetry.hrv?.updatedAt,
      health: sensorHealth.watch || {},
      waitingDetail: 'Run the watch bridge and confirm a fresh HRV sample arrives before the participant begins.',
    }),
    telemetryChecklistItem({
      id: 'gaze-telemetry',
      label: 'Gaze telemetry',
      phase,
      updatedAt: telemetry.gaze?.updatedAt,
      health: sensorHealth.gaze || {},
      waitingDetail: 'Start the gaze bridge or SDK connector and confirm a fresh attention sample arrives before the participant begins.',
    }),
    auditChecklistItem(system.connections || {}),
  ];
  const manualItems = manualChecklistItems(acknowledgements, phase);
  const items = [...automaticItems, ...manualItems];
  const blockers = items.filter((item) => item.status === 'blocked');
  const warnings = items.filter((item) => item.status === 'warning');
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const requiredReady = blockers.length === 0;

  let summary = 'Ready for participant.';
  let detail = 'The participant-facing display, telemetry feeds, and manual setup confirmations all look ready.';

  if (phase === 'setup') {
    if (blockers.length > 0) {
      summary = `${blockers.length} blocker${blockers.length === 1 ? '' : 's'} must be cleared before the trial can start.`;
      detail = blockers.map((item) => item.summary).join(' ');
    } else if (warnings.length > 0) {
      summary = `Ready for participant with ${warnings.length} recommendation${warnings.length === 1 ? '' : 's'}.`;
      detail = warnings.map((item) => item.summary).join(' ');
    }
  } else if (phase === 'running') {
    if (warnings.length > 0) {
      summary = `Live run has ${warnings.length} readiness warning${warnings.length === 1 ? '' : 's'}.`;
      detail = warnings.map((item) => item.summary).join(' ');
    } else {
      summary = 'Live run status still looks healthy.';
      detail = 'The setup gate was cleared and the participant-facing dependencies still look healthy.';
    }
  } else if (phase === 'completed') {
    summary = 'Session completed. Reset before running the readiness gate again.';
    detail = warnings.length > 0
      ? warnings.map((item) => item.summary).join(' ')
      : 'Exports and notes are ready for post-trial review.';
  }

  return {
    phase,
    ready: blockers.length === 0 && warnings.length === 0,
    requiredReady,
    status: blockers.length > 0 ? 'blocked' : (warnings.length > 0 ? 'warning' : 'ready'),
    summary,
    detail,
    blockingCount: blockers.length,
    warningCount: warnings.length,
    progress: {
      readyCount,
      totalCount: items.length,
    },
    blockers,
    warnings,
    automaticItems,
    manualItems,
    acknowledgements,
    updatedAt: state.preflight?.updatedAt || null,
    updatedBy: state.preflight?.updatedBy || null,
  };
}

module.exports = {
  MANUAL_PREFLIGHT_ITEMS,
  createInitialPreflightAcknowledgements,
  normalizePreflightAcknowledgements,
  summarizePreflight,
};
