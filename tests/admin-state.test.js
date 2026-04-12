'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAdminStateModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-state.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

test('mergeAdminState preserves prior system data when a mutation route returns state-only payload', async () => {
  const { mergeAdminState } = await loadAdminStateModule();

  const previousState = {
    session: {
      id: 'session-1',
      metadata: {
        studyId: '',
      },
    },
    system: {
      connections: {
        admin: 1,
        subject: 1,
        audit: 0,
      },
      network: {
        localhost: {
          admin: 'http://127.0.0.1:3000/admin',
        },
      },
    },
  };

  const responseState = {
    session: {
      id: 'session-1',
      metadata: {
        studyId: 'pilot-01',
      },
    },
  };

  const merged = mergeAdminState(previousState, responseState);

  assert.equal(merged.session.metadata.studyId, 'pilot-01');
  assert.deepEqual(merged.system.connections, {
    admin: 1,
    subject: 1,
    audit: 0,
  });
  assert.equal(merged.system.network.localhost.admin, 'http://127.0.0.1:3000/admin');
});

test('mergeAdminState prefers incoming system data when a full snapshot arrives', async () => {
  const { mergeAdminState } = await loadAdminStateModule();

  const previousState = {
    system: {
      connections: {
        admin: 1,
        subject: 1,
        audit: 0,
      },
    },
  };

  const incomingState = {
    session: {
      id: 'session-2',
    },
    system: {
      connections: {
        admin: 2,
        subject: 0,
        audit: 1,
      },
    },
  };

  const merged = mergeAdminState(previousState, incomingState);

  assert.deepEqual(merged.system.connections, {
    admin: 2,
    subject: 0,
    audit: 1,
  });
  assert.equal(merged.session.id, 'session-2');
});
