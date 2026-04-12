'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAdminSessionDraftModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-session-draft.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

test('session draft preserves unsaved metadata across stale snapshots for the same session', async () => {
  const { createSessionDraftController } = await loadAdminSessionDraftModule();
  const draft = createSessionDraftController([
    'studyId',
    'participantId',
    'condition',
    'researcher',
    'notes',
  ]);

  draft.resolve('session-1', {
    studyId: '',
    participantId: '',
    condition: 'adaptive',
    researcher: 'shrijak',
    notes: '',
  });

  draft.noteChange('studyId', 'pilot-01');
  draft.noteChange('participantId', 'P-001');

  const resolved = draft.resolve('session-1', {
    studyId: '',
    participantId: '',
    condition: 'adaptive',
    researcher: 'shrijak',
    notes: '',
  });

  assert.equal(resolved.studyId, 'pilot-01');
  assert.equal(resolved.participantId, 'P-001');
  assert.equal(resolved.researcher, 'shrijak');
  assert.equal(draft.isDirty(), true);
});

test('session draft clears once the server catches up or a new session starts', async () => {
  const { createSessionDraftController } = await loadAdminSessionDraftModule();
  const draft = createSessionDraftController([
    'studyId',
    'participantId',
    'condition',
    'researcher',
    'notes',
  ]);

  draft.resolve('session-1', {
    studyId: '',
    participantId: '',
    condition: 'adaptive',
    researcher: 'shrijak',
    notes: '',
  });

  draft.noteChange('studyId', 'pilot-01');

  const saved = draft.resolve('session-1', {
    studyId: 'pilot-01',
    participantId: '',
    condition: 'adaptive',
    researcher: 'shrijak',
    notes: '',
  });

  assert.equal(saved.studyId, 'pilot-01');
  assert.equal(draft.isDirty(), false);

  draft.noteChange('participantId', 'P-001');

  const nextSession = draft.resolve('session-2', {
    studyId: '',
    participantId: '',
    condition: 'adaptive',
    researcher: '',
    notes: '',
  });

  assert.equal(nextSession.participantId, '');
  assert.equal(draft.isDirty(), false);
});
