import { connectSocket, fetchJson, formatTimestamp } from './shared.js';

const hintElement = document.querySelector('#subject-hint');
const updatedElement = document.querySelector('#subject-updated');
const referenceShellElement = document.querySelector('#subject-reference-shell');
const referenceEmptyElement = document.querySelector('#subject-reference-empty');
const referenceImageElement = document.querySelector('#subject-reference-image');
const referencePdfElement = document.querySelector('#subject-reference-pdf');
const referenceMetaElement = document.querySelector('#subject-reference-meta');

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
  render(state);

  connectSocket('subject', {
    onSnapshot(snapshot) {
      render(snapshot);
    },
  });
}

init().catch((error) => {
  hintElement.textContent = error.message;
});
