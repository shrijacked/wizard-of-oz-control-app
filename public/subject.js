import { connectSocket, fetchJson, formatTimestamp } from './shared.js';

const hintElement = document.querySelector('#subject-hint');
const updatedElement = document.querySelector('#subject-updated');

function render(state) {
  hintElement.textContent = state?.hint?.text || 'Waiting for a hint from the researcher.';
  updatedElement.textContent = state?.hint?.updatedAt
    ? `Last updated ${formatTimestamp(state.hint.updatedAt)}`
    : 'No broadcast received yet.';
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
