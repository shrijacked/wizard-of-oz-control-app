import { connectSocket, fetchJson, formatTimestamp } from './shared.js';
import { createAudioCueController } from './audio-cue.mjs';
import { createUpdateCueTracker } from './display-alerts.mjs';

const hintElement = document.querySelector('#subject-hint');
const updatedElement = document.querySelector('#subject-updated');
const referenceShellElement = document.querySelector('#subject-reference-shell');
const referenceEmptyElement = document.querySelector('#subject-reference-empty');
const referenceImageElement = document.querySelector('#subject-reference-image');
const referencePdfElement = document.querySelector('#subject-reference-pdf');
const referenceMetaElement = document.querySelector('#subject-reference-meta');
const soundToggleElement = document.querySelector('#subject-sound-toggle');
const soundStatusElement = document.querySelector('#subject-sound-status');

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
    setSoundStatus('Alert sound is armed on this subject screen.');
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

function renderReference(asset, puzzleSet) {
  const hasReference = Boolean(asset);
  referenceShellElement?.classList.toggle('empty', !hasReference);

  if (!hasReference) {
    if (referenceEmptyElement) {
      referenceEmptyElement.hidden = false;
    }
    if (referenceImageElement) {
      referenceImageElement.hidden = true;
      referenceImageElement.removeAttribute('src');
    }
    if (referencePdfElement) {
      referencePdfElement.hidden = true;
      referencePdfElement.removeAttribute('src');
    }
    if (referenceMetaElement) {
      referenceMetaElement.textContent = 'No reference puzzle selected yet.';
    }
    return;
  }

  if (referenceEmptyElement) {
    referenceEmptyElement.hidden = true;
  }

  if (asset.displayKind === 'pdf') {
    if (referenceImageElement) {
      referenceImageElement.hidden = true;
      referenceImageElement.removeAttribute('src');
    }
    if (referencePdfElement) {
      referencePdfElement.hidden = false;
      referencePdfElement.src = `${asset.urlPath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
    }
  } else {
    if (referencePdfElement) {
      referencePdfElement.hidden = true;
      referencePdfElement.removeAttribute('src');
    }
    if (referenceImageElement) {
      referenceImageElement.hidden = false;
      referenceImageElement.src = asset.urlPath;
      referenceImageElement.alt = asset.originalName || 'Selected reference puzzle';
    }
  }

  if (referenceMetaElement) {
    referenceMetaElement.textContent = puzzleSet?.selectedAt
      ? `${asset.originalName} • selected ${formatTimestamp(puzzleSet.selectedAt)}`
      : `${asset.originalName} • visible for this session`;
  }
}

function render(state) {
  hintElement.textContent = state?.hint?.text || 'Waiting for a hint from the researcher.';
  updatedElement.textContent = state?.hint?.updatedAt
    ? `Last updated ${formatTimestamp(state.hint.updatedAt)}`
    : 'No broadcast received yet.';
  renderReference(state?.puzzleSet?.subjectAsset || null, state?.puzzleSet || null);
}

async function init() {
  const state = await fetchJson('/api/state?role=subject');
  hintAlertTracker.prime(state?.hint?.updatedAt || null);
  render(state);
  installAutoArm();

  connectSocket('subject', {
    onSnapshot(snapshot) {
      hintAlertTracker.push(snapshot?.hint?.updatedAt || null).catch(() => {
        setSoundStatus('Alert sound failed while trying to play the latest hint cue.');
      });
      render(snapshot);
    },
  });
}

init().catch((error) => {
  hintElement.textContent = error.message;
});
