import {
  connectSocket,
  fetchJson,
  formatTimestamp,
  reportScreenReady,
  setConnectionBadge,
} from './shared.js';
import { createAudioCueController } from './audio-cue.mjs';
import { createDelayedCueScheduler, createUpdateCueTracker, remainingDelayMs } from './display-alerts.mjs';

const actionElement = document.querySelector('#robot-action');
const updatedElement = document.querySelector('#robot-updated');
const soundToggleElement = document.querySelector('#robot-sound-toggle');
const soundStatusElement = document.querySelector('#robot-sound-status');
const connectionBadgeElement = document.querySelector('#connection-badge');
const historyElement = document.querySelector('#robot-history');

const cueHistory = [];

const soundController = createAudioCueController({
  frequency: 560,
  durationMs: 240,
  gainValue: 0.14,
  waveform: 'square',
});
const ROBOT_MOVE_WARNING_MS = 10_000;
const moveAlertScheduler = createDelayedCueScheduler({
  delayMs: ROBOT_MOVE_WARNING_MS,
  onCue: async () => {
    await soundController.pattern(2, 120);
  },
});
const robotAlertTracker = createUpdateCueTracker({
  onCue: async (token) => {
    await soundController.pattern(3, 100);
    const remaining = remainingDelayMs(token, ROBOT_MOVE_WARNING_MS);
    if (remaining <= -2000) {
      return;
    }
    if (remaining <= 0) {
      await soundController.beep();
      return;
    }
    moveAlertScheduler.schedule(token, remaining);
  },
});

function setSoundStatus(message) {
  if (soundStatusElement) {
    soundStatusElement.textContent = message;
  }
}

async function armAlertSound() {
  const armed = await soundController.arm();
  if (armed) {
    if (soundToggleElement) {
      soundToggleElement.textContent = 'Alert sound ready';
      soundToggleElement.disabled = true;
    }
    setSoundStatus('Alert sound is armed. This screen is ready for the sitting.');
    await reportScreenReady('robot', true);
    return true;
  }

  setSoundStatus('This browser could not enable sound. Check browser audio permissions on this screen.');
  return false;
}

function installAutoArm() {
  const attemptArm = () => {
    if (soundController.isArmed()) {
      return;
    }

    armAlertSound().catch(() => {
      setSoundStatus('This browser could not enable sound. Use the button to try again.');
    });
  };

  window.addEventListener('pointerdown', attemptArm, { once: true });
  window.addEventListener('keydown', attemptArm, { once: true });
  soundToggleElement?.addEventListener('click', () => {
    armAlertSound().catch(() => {
      setSoundStatus('This browser could not enable sound. Try again on this screen.');
    });
  });
}

function rememberCue(robotAction) {
  if (!robotAction?.updatedAt || !robotAction.label) {
    return;
  }

  if (cueHistory[0]?.updatedAt === robotAction.updatedAt) {
    return;
  }

  cueHistory.unshift({
    label: robotAction.label,
    updatedAt: robotAction.updatedAt,
  });
  cueHistory.splice(3);
}

function renderHistory() {
  if (!historyElement) {
    return;
  }

  historyElement.innerHTML = '';
  cueHistory.forEach((entry, index) => {
    const item = document.createElement('li');
    item.textContent = index === 0
      ? entry.label
      : `${entry.label} • ${formatTimestamp(entry.updatedAt)}`;
    historyElement.append(item);
  });
}

function render(state) {
  const robotAction = state?.robotAction || {};
  if (actionElement) {
    actionElement.textContent = robotAction.updatedAt
      ? (robotAction.label || 'No robot cue has been sent yet.')
      : 'No robot cue has been sent yet.';
  }
  if (updatedElement) {
    updatedElement.textContent = robotAction.updatedAt
      ? `Last updated ${formatTimestamp(robotAction.updatedAt)}`
      : 'Awaiting admin input.';
  }
  rememberCue(robotAction.updatedAt ? robotAction : null);
  renderHistory();
}

async function init() {
  setConnectionBadge(connectionBadgeElement, 'reconnecting');

  try {
    const state = await fetchJson('/api/state?role=robot');
    robotAlertTracker.prime(state?.robotAction?.updatedAt || null);
    render(state);
  } catch {
    if (actionElement) {
      actionElement.textContent = 'Waiting for the researcher to reconnect this screen.';
    }
  }

  installAutoArm();

  connectSocket('robot', {
    onOpen() {
      setConnectionBadge(connectionBadgeElement, 'connected');
      if (soundController.isArmed()) {
        reportScreenReady('robot', true);
      }
    },
    onClose() {
      setConnectionBadge(connectionBadgeElement, 'reconnecting');
    },
    onSnapshot(snapshot) {
      robotAlertTracker.push(snapshot?.robotAction?.updatedAt || null).catch(() => {
        setSoundStatus('Alert sound failed while trying to play the latest robot cue.');
      });
      render(snapshot);
    },
  });
}

init();
