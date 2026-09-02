import {
  connectSocket,
  fetchJson,
  formatTimestamp,
  reportScreenReady,
  setConnectionBadge,
} from './shared.js';
import { createAudioCueController } from './audio-cue.mjs';
import { createUpdateCueTracker } from './display-alerts.mjs';

const hintElement = document.querySelector('#subject-hint');
const updatedElement = document.querySelector('#subject-updated');
const soundToggleElement = document.querySelector('#subject-sound-toggle');
const soundStatusElement = document.querySelector('#subject-sound-status');
const connectionBadgeElement = document.querySelector('#connection-badge');

const soundController = createAudioCueController({
  frequency: 920,
  durationMs: 170,
  gainValue: 0.05,
});
const hintAlertTracker = createUpdateCueTracker({
  onCue: async () => {
    await soundController.beep();
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
    await reportScreenReady('subject', true);
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

function render(state) {
  const hintText = String(state?.hint?.text || '').trim();
  if (hintElement) {
    hintElement.textContent = hintText || 'Waiting for a hint from the researcher.';
  }
  if (updatedElement) {
    updatedElement.textContent = state?.hint?.updatedAt
      ? `Last updated ${formatTimestamp(state.hint.updatedAt)}`
      : 'No broadcast received yet.';
  }
}

async function init() {
  setConnectionBadge(connectionBadgeElement, 'reconnecting');

  try {
    const state = await fetchJson('/api/state?role=subject');
    hintAlertTracker.prime(state?.hint?.updatedAt || null);
    render(state);
  } catch {
    if (hintElement) {
      hintElement.textContent = 'Waiting for the researcher to reconnect this screen.';
    }
  }

  installAutoArm();

  connectSocket('subject', {
    onOpen() {
      setConnectionBadge(connectionBadgeElement, 'connected');
      if (soundController.isArmed()) {
        reportScreenReady('subject', true);
      }
    },
    onClose() {
      setConnectionBadge(connectionBadgeElement, 'reconnecting');
    },
    onSnapshot(snapshot) {
      const hintText = String(snapshot?.hint?.text || '').trim();
      if (hintText) {
        hintAlertTracker.push(snapshot?.hint?.updatedAt || null).catch(() => {
          setSoundStatus('Alert sound failed while trying to play the latest hint cue.');
        });
      } else {
        hintAlertTracker.prime(snapshot?.hint?.updatedAt || null);
      }
      render(snapshot);
    },
  });
}

init();
