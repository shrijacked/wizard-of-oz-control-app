import { fetchJson, formatTimestamp } from './shared.js';

const currentSessionElement = document.querySelector('#exports-current-session');
const generatedAtElement = document.querySelector('#exports-generated-at');
const exportsListElement = document.querySelector('#exports-list');

function renderManifest(manifest) {
  currentSessionElement.textContent = manifest.currentSessionId;
  generatedAtElement.textContent = `Manifest generated ${formatTimestamp(manifest.generatedAt)}`;
  exportsListElement.innerHTML = '';

  manifest.sessions.forEach((session) => {
    const card = document.createElement('article');
    card.className = 'export-card';

    const title = document.createElement('h3');
    title.textContent = session.sessionId;
    card.append(title);

    const meta = document.createElement('p');
    meta.className = 'export-meta';
    meta.textContent = `${session.isCurrent ? 'Current session' : 'Archived session'} • ${session.eventCount} events • started ${formatTimestamp(session.startedAt)}`;
    card.append(meta);

    const actions = document.createElement('div');
    actions.className = 'button-row';

    const bundleLink = document.createElement('a');
    bundleLink.className = 'button button-primary';
    bundleLink.href = session.isCurrent ? '/api/exports/current.bundle.json' : session.downloads.bundleJson;
    bundleLink.textContent = 'Download bundle JSON';
    actions.append(bundleLink);

    const csvLink = document.createElement('a');
    csvLink.className = 'button button-ghost';
    csvLink.href = session.isCurrent ? '/api/exports/current.csv' : session.downloads.csv;
    csvLink.textContent = 'Download CSV timeline';
    actions.append(csvLink);

    card.append(actions);
    exportsListElement.append(card);
  });
}

async function init() {
  const manifest = await fetchJson('/api/exports');
  renderManifest(manifest);
}

init().catch((error) => {
  exportsListElement.textContent = error.message;
});
