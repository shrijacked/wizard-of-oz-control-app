'use strict';

const { queueMatchesSitting, setIdsForSitting } = require('./sitting-queue');

function metadataChecklistItem(session = {}) {
  const metadata = session.metadata || {};
  const missing = [];

  if (!String(metadata.participantId || '').trim()) {
    missing.push('participant ID');
  }

  if (!String(metadata.researcher || '').trim()) {
    missing.push('researcher');
  }

  if (!Number.isFinite(Number(metadata.sittingNumber)) || Number(metadata.sittingNumber) < 1) {
    missing.push('sitting number');
  }

  if (missing.length === 0) {
    const fullStudy = Array.isArray(session.schedule) && session.schedule.length >= 9;
    return {
      id: 'metadata',
      kind: 'automatic',
      required: true,
      status: 'ready',
      label: fullStudy ? 'Study profile saved' : 'Sitting profile saved',
      summary: fullStudy ? 'Participant and researcher IDs are saved.' : 'Participant, researcher, and sitting number are saved.',
      detail: fullStudy
        ? `Participant ${metadata.participantId} • researcher ${metadata.researcher}.`
        : `Participant ${metadata.participantId} • researcher ${metadata.researcher} • sitting ${metadata.sittingNumber}.`,
    };
  }

  return {
    id: 'metadata',
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(session.status || 'setup'),
    label: 'Sitting profile saved',
    summary: `Add ${missing.join(', ')} before starting the sitting.`,
    detail: 'The export needs those identifiers so later analysis can match the sitting.',
  };
}

function automaticIssueStatus(phase) {
  return phase === 'setup' ? 'blocked' : 'warning';
}

function sittingQueueChecklistItem(session = {}) {
  const schedule = Array.isArray(session.schedule) ? session.schedule : [];
  if (schedule.length >= 9) {
    if (schedule.length === session.plannedRounds) {
      return {
        id: 'study-schedule',
        kind: 'automatic',
        required: true,
        status: 'ready',
        label: 'Nine-round study schedule generated',
        summary: `Nine puzzles are assigned across ${session.conditionOrder?.join(' → ') || 'three conditions'}.`,
        detail: `Randomization seed: ${session.randomizationSeed || 'saved with session'}.`,
      };
    }
    return {
      id: 'study-schedule',
      kind: 'automatic',
      required: true,
      status: automaticIssueStatus(session.status || 'setup'),
      label: 'Nine-round study schedule generated',
      summary: 'All nine puzzle pairs must be available before the randomized schedule can be generated.',
      detail: 'The schedule assigns three puzzles to each counterbalanced condition block.',
    };
  }

  const sittingNumber = session.metadata?.sittingNumber || 1;
  const plannedRounds = Number(session.plannedRounds) || 3;
  const expected = setIdsForSitting(sittingNumber).slice(0, plannedRounds);
  const queue = Array.isArray(session.queue) ? session.queue : [];

  if (queueMatchesSitting(queue, sittingNumber, plannedRounds)) {
    return {
      id: 'sitting-queue',
      kind: 'automatic',
      required: true,
      status: 'ready',
      label: 'Sitting puzzles queued',
      summary: `Sitting ${sittingNumber} is queued as puzzles ${expected.join(', ')}.`,
      detail: `Round order is ${expected.join(' → ')}.`,
    };
  }

  return {
    id: 'sitting-queue',
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(session.status || 'setup'),
    label: 'Sitting puzzles queued',
    summary: `Sitting ${sittingNumber} needs puzzles ${expected.join(', ')} in that order.`,
    detail: 'Save the sitting profile after the tangram library has loaded, or upload the missing pair files.',
  };
}

function participantProfileChecklistItems(session = {}) {
  if (!Array.isArray(session.schedule) || session.schedule.length < 9) {
    return [];
  }
  const admin = session.participantProfiles?.admin;
  const subject = session.participantProfiles?.subject;
  const phase = session.status || 'setup';
  const items = [];

  items.push(subject?.consented && subject?.instructionsAcknowledged && Number.isFinite(subject?.expectedEfficacy)
    ? {
      id: 'participant-profile', kind: 'automatic', required: true, status: 'ready',
      label: 'Participant consent and baseline complete',
      summary: 'The participant submitted demographics, consent, instructions acknowledgement, and the baseline rating.',
      detail: 'The participant-facing copy is saved with a timestamp.',
    }
    : {
      id: 'participant-profile', kind: 'automatic', required: true, status: automaticIssueStatus(phase),
      label: 'Participant consent and baseline complete',
      summary: 'The participant must complete the opening section on the subject screen.',
      detail: 'Age, gender, consent, instructions acknowledgement, and expected efficacy are required.',
    });

  let profilesMatch = false;
  if (admin?.consented && subject?.consented) {
    profilesMatch = admin.age === subject.age
      && admin.gender === subject.gender
      && String(admin.genderSelfDescribe || '') === String(subject.genderSelfDescribe || '');
  }
  items.push(profilesMatch
    ? {
      id: 'profile-crosscheck', kind: 'automatic', required: true, status: 'ready',
      label: 'Researcher cross-check matches',
      summary: 'The admin and participant demographic entries match.',
      detail: 'Both copies remain in the export for auditing.',
    }
    : {
      id: 'profile-crosscheck', kind: 'automatic', required: true, status: automaticIssueStatus(phase),
      label: 'Researcher cross-check matches',
      summary: admin ? 'The admin and participant entries do not match yet.' : 'Complete the researcher cross-check on the admin screen.',
      detail: 'Confirm age, gender, and consent against the participant entry.',
    });
  return items;
}

function screenChecklistItem({
  id,
  label,
  noun,
  path,
  phase,
  connected,
  ready,
}) {
  if (connected && ready) {
    return {
      id,
      kind: 'automatic',
      required: true,
      status: 'ready',
      label,
      summary: `${noun} screen is connected and the alert sound is armed.`,
      detail: `Open ${path}, tap once, and keep that tab in the foreground.`,
    };
  }

  if (connected) {
    return {
      id,
      kind: 'automatic',
      required: true,
      status: automaticIssueStatus(phase),
      label,
      summary: `${noun} screen is connected, but the alert sound is not armed yet.`,
      detail: `Tap once on ${path} so new messages play a beep.`,
    };
  }

  return {
    id,
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(phase),
    label,
    summary: `Open ${path} on the ${noun.toLowerCase()} device before starting.`,
    detail: `The ${noun.toLowerCase()} screen needs a live WebSocket connection.`,
  };
}

function cameraChecklistItem(system = {}, phase = 'setup') {
  const camera = system.camera || {};
  if (camera.live) {
    return {
      id: 'camera',
      kind: 'automatic',
      required: true,
      status: 'ready',
      label: 'C270 camera live',
      summary: camera.deviceLabel
        ? `Camera is live (${camera.deviceLabel}).`
        : 'Operator camera is live.',
      detail: 'Keep the table workspace in frame for the whole sitting.',
    };
  }

  return {
    id: 'camera',
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(phase),
    label: 'C270 camera live',
    summary: 'Start the Logitech C270 on the operator dashboard.',
    detail: 'Choose the C270 in the camera list, then click Start camera.',
  };
}

function telemetryChecklistItem({
  id,
  label,
  phase,
  health = {},
  waitingDetail,
}) {
  if (health.state === 'healthy') {
    return {
      id,
      kind: 'automatic',
      required: true,
      status: 'ready',
      label,
      summary: `${label} is live.`,
      detail: health.detail || `${label} samples are arriving.`,
    };
  }

  return {
    id,
    kind: 'automatic',
    required: true,
    status: automaticIssueStatus(phase),
    label,
    summary: health.summary || `No ${label.toLowerCase()} sample has been received yet.`,
    detail: health.detail || waitingDetail,
  };
}

function summarizePreflight(input = {}) {
  const state = input.state || {};
  const system = input.system || {};
  const phase = state.session?.status || 'setup';
  const screens = system.screens || {};
  const sensorHealth = system.sensorHealth || {};

  const items = [
    metadataChecklistItem(state.session || {}),
    ...participantProfileChecklistItems(state.session || {}),
    sittingQueueChecklistItem(state.session || {}),
    screenChecklistItem({
      id: 'subject-display',
      label: 'Subject screen ready',
      noun: 'Subject',
      path: '/subject',
      phase,
      connected: Boolean(screens.subject?.connected || Number(system.connections?.subject || 0) > 0),
      ready: Boolean(screens.subject?.ready),
    }),
    screenChecklistItem({
      id: 'robot-display',
      label: 'Robot screen ready',
      noun: 'Robot',
      path: '/robot',
      phase,
      connected: Boolean(screens.robot?.connected || Number(system.connections?.robot || 0) > 0),
      ready: Boolean(screens.robot?.ready),
    }),
    cameraChecklistItem(system, phase),
    telemetryChecklistItem({
      id: 'watch-telemetry',
      label: 'Maxim H Band',
      phase,
      health: sensorHealth.watch || {},
      waitingDetail: 'Wear the band, start the watch script, and wait until heart rate appears.',
    }),
  ];

  const blockers = items.filter((item) => item.status === 'blocked');
  const warnings = items.filter((item) => item.status === 'warning');
  const readyCount = items.filter((item) => item.status === 'ready').length;
  const requiredReady = blockers.length === 0;

  let summary = 'Ready for participant.';
  let detail = 'Screens, camera, watch, and the sitting queue are ready.';

  if (phase === 'setup') {
    if (blockers.length > 0) {
      summary = `${blockers.length} blocker${blockers.length === 1 ? '' : 's'} must be cleared before the sitting can start.`;
      detail = blockers.map((item) => item.summary).join(' ');
    } else if (warnings.length > 0) {
      summary = `Ready for participant with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`;
      detail = warnings.map((item) => item.summary).join(' ');
    }
  } else if (phase === 'running') {
    if (warnings.length > 0) {
      summary = `Live run has ${warnings.length} readiness warning${warnings.length === 1 ? '' : 's'}.`;
      detail = warnings.map((item) => item.summary).join(' ');
    } else {
      summary = 'Live run status still looks healthy.';
      detail = 'The setup gate was cleared and the live dependencies still look healthy.';
    }
  } else if (phase === 'completed') {
    summary = 'Session completed. Reset before running the readiness gate again.';
    detail = warnings.length > 0
      ? warnings.map((item) => item.summary).join(' ')
      : 'Exports are ready for the next participant.';
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
    automaticItems: items,
    manualItems: [],
    items,
    acknowledgements: {},
    updatedAt: state.preflight?.updatedAt || null,
    updatedBy: state.preflight?.updatedBy || null,
  };
}

module.exports = {
  createInitialPreflightAcknowledgements() {
    return {};
  },
  normalizePreflightAcknowledgements() {
    return {};
  },
  summarizePreflight,
};
