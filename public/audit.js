import { connectSocket, fetchJson, formatTimestamp } from './shared.js';

const actionElement = document.querySelector('#audit-action');
const updatedElement = document.querySelector('#audit-updated');

function render(state) {
  const robotAction = state?.robotAction || {};
  actionElement.textContent = robotAction.label || 'No robotic action has been logged yet.';
  updatedElement.textContent = robotAction.updatedAt
    ? `Last action ${formatTimestamp(robotAction.updatedAt)}`
    : 'Awaiting admin input.';
}

async function init() {
  const state = await fetchJson('/api/state?role=audit');
  render(state);

  connectSocket('audit', {
    onSnapshot(snapshot) {
      render(snapshot);
    },
  });
}

init().catch((error) => {
  actionElement.textContent = error.message;
});
