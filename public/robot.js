import { connectSocket, fetchJson, formatTimestamp } from './shared.js';
import { createAudioCueController } from './audio-cue.mjs';
import { createUpdateCueTracker } from './display-alerts.mjs';

const actionElement = document.querySelector('#robot-action');
const updatedElement = document.querySelector('#robot-updated');
const solutionShellElement = document.querySelector('#robot-solution-shell');
const solutionEmptyElement = document.querySelector('#robot-solution-empty');
const solutionImageElement = document.querySelector('#robot-solution-image');
const solutionPdfElement = document.querySelector('#robot-solution-pdf');
const solutionMetaElement = document.querySelector('#robot-solution-meta');
const soundToggleElement = document.querySelector('#robot-sound-toggle');
const soundStatusElement = document.querySelector('#robot-sound-status');

const soundController = createAudioCueController({
  frequency: 560,
  durationMs: 200,
  gainValue: 0.05,
});
const robotAlertTracker = createUpdateCueTracker({
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
    setSoundStatus('Alert sound is armed on this robot screen.');
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

function renderSolution(asset, puzzleSet) {
  const hasSolution = Boolean(asset);
  solutionShellElement?.classList.toggle('empty', !hasSolution);

  if (!hasSolution) {
    solutionEmptyElement.hidden = false;
    solutionImageElement.hidden = true;
    solutionImageElement.removeAttribute('src');
    solutionPdfElement.hidden = true;
    solutionPdfElement.removeAttribute('src');
    solutionMetaElement.textContent = 'No solution file selected yet.';
    return;
  }

  solutionEmptyElement.hidden = true;

  if (asset.displayKind === 'pdf') {
    solutionImageElement.hidden = true;
    solutionImageElement.removeAttribute('src');
    solutionPdfElement.hidden = false;
    solutionPdfElement.src = `${asset.urlPath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  } else {
    solutionPdfElement.hidden = true;
    solutionPdfElement.removeAttribute('src');
    solutionImageElement.hidden = false;
    solutionImageElement.src = asset.urlPath;
    solutionImageElement.alt = asset.originalName || 'Selected puzzle solution';
  }

  solutionMetaElement.textContent = puzzleSet?.selectedAt
    ? `${asset.originalName} • selected ${formatTimestamp(puzzleSet.selectedAt)}`
    : `${asset.originalName} • visible for this session`;
}

function render(state) {
  const robotAction = state?.robotAction || {};
  actionElement.textContent = robotAction.label || 'No robot cue has been sent yet.';
  updatedElement.textContent = robotAction.updatedAt
    ? `Last updated ${formatTimestamp(robotAction.updatedAt)}`
    : 'Awaiting admin input.';
  renderSolution(state?.puzzleSet?.solutionAsset || null, state?.puzzleSet || null);
}

async function init() {
  const state = await fetchJson('/api/state?role=robot');
  robotAlertTracker.prime(state?.robotAction?.updatedAt || null);
  render(state);
  installAutoArm();

  connectSocket('robot', {
    onSnapshot(snapshot) {
      robotAlertTracker.push(snapshot?.robotAction?.updatedAt || null).catch(() => {
        setSoundStatus('Alert sound failed while trying to play the latest robot cue.');
      });
      render(snapshot);
    },
  });
}

init().catch((error) => {
  actionElement.textContent = error.message;
});
