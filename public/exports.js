import { fetchJson, formatTimestamp } from './shared.js';

const currentSessionElement = document.querySelector('#exports-current-session');
const generatedAtElement = document.querySelector('#exports-generated-at');
const exportsListElement = document.querySelector('#exports-list');
const analyticsGridElement = document.querySelector('#analytics-grid');
const replaySummaryElement = document.querySelector('#replay-summary');
const replayListElement = document.querySelector('#replay-list');

let currentManifest = null;

function metricCard(label, value, note = '') {
  const article = document.createElement('article');
  article.className = 'metric-card';

  const span = document.createElement('span');
  span.textContent = label;
  article.append(span);

  const strong = document.createElement('strong');
  strong.textContent = value;
  article.append(strong);

  const small = document.createElement('small');
  small.textContent = note;
  article.append(small);

  return article;
}

function renderBundle(bundle) {
  analyticsGridElement.innerHTML = '';

  const analytics = bundle.analytics || {};
  analyticsGridElement.append(
    metricCard('Status', analytics.sessionStatus || 'setup', bundle.state?.session?.metadata?.condition || 'condition unavailable'),
    metricCard('Participant', analytics.participantId || 'Unassigned', bundle.state?.session?.metadata?.studyId || 'study unavailable'),
    metricCard('Duration', analytics.durationSeconds == null ? '--' : `${analytics.durationSeconds}s`, `${analytics.totalEvents || 0} logged events`),
    metricCard('Adaptive transitions', String(analytics.adaptiveTransitions || 0), `${analytics.gazeFrames || 0} gaze frames / ${analytics.hrvFrames || 0} HRV frames`),
    metricCard(
      'Adaptive rule set',
      `o ${analytics.adaptiveConfiguration?.thresholds?.observe ?? '--'} / i ${analytics.adaptiveConfiguration?.thresholds?.intervene ?? '--'}`,
      `weights ${analytics.adaptiveConfiguration?.weights?.hrv ?? '--'} HRV / ${analytics.adaptiveConfiguration?.weights?.gaze ?? '--'} gaze`,
    ),
  );

  replaySummaryElement.textContent = analytics.lastEventAt
    ? `Showing ${bundle.replay?.totalSteps || 0} replay steps through ${formatTimestamp(analytics.lastEventAt)}`
    : 'No replay events are available yet.';

  replayListElement.innerHTML = '';
  (bundle.replay?.events || []).forEach((event) => {
    const item = document.createElement('li');
    item.className = 'event-item';

    const summary = document.createElement('strong');
    summary.textContent = `Step ${event.step} • ${event.summary}`;
    item.append(summary);

    const meta = document.createElement('small');
    meta.textContent = `${event.type} • ${event.source} • +${event.offsetSeconds}s`;
    item.append(meta);

    replayListElement.append(item);
  });
}

async function selectSession(sessionId) {
  const slug = sessionId === currentManifest.currentSessionId ? 'current' : sessionId;
  const bundle = await fetchJson(`/api/exports/${slug}.bundle.json`);
  renderBundle(bundle);
}

function renderManifest(manifest) {
  currentManifest = manifest;
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

    const inspectButton = document.createElement('button');
    inspectButton.className = 'button button-ghost';
    inspectButton.type = 'button';
    inspectButton.textContent = 'Inspect analytics';
    inspectButton.addEventListener('click', () => {
      selectSession(session.sessionId).catch((error) => {
        replaySummaryElement.textContent = error.message;
      });
    });
    actions.append(inspectButton);

    card.append(actions);
    exportsListElement.append(card);
  });
}

async function init() {
  const manifest = await fetchJson('/api/exports');
  renderManifest(manifest);
  await selectSession(manifest.currentSessionId);
}

init().catch((error) => {
  exportsListElement.textContent = error.message;
});
