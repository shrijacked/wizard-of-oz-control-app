import { connectSocket, fetchJson, formatTimestamp } from './shared.js';

const actionElement = document.querySelector('#robot-action');
const updatedElement = document.querySelector('#robot-updated');
const solutionShellElement = document.querySelector('#robot-solution-shell');
const solutionEmptyElement = document.querySelector('#robot-solution-empty');
const solutionImageElement = document.querySelector('#robot-solution-image');
const solutionPdfElement = document.querySelector('#robot-solution-pdf');
const solutionMetaElement = document.querySelector('#robot-solution-meta');

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
  render(state);

  connectSocket('robot', {
    onSnapshot(snapshot) {
      render(snapshot);
    },
  });
}

init().catch((error) => {
  actionElement.textContent = error.message;
});
