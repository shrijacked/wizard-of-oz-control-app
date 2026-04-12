'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAdminViewModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'admin-view.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

test('describeGuardBanner explains why setup fields are locked before browser unlock', async () => {
  const { describeGuardBanner } = await loadAdminViewModule();

  const banner = describeGuardBanner({
    pinRequired: true,
    authenticated: false,
    sessionStatus: 'setup',
  });

  assert.equal(banner.tone, 'warning');
  assert.match(banner.message, /locked on this browser/i);
  assert.match(banner.message, /local admin pin/i);
  assert.match(banner.message, /setup details/i);
});

test('describeGuardBanner confirms setup controls are available after unlock', async () => {
  const { describeGuardBanner } = await loadAdminViewModule();

  const banner = describeGuardBanner({
    pinRequired: true,
    authenticated: true,
    sessionStatus: 'setup',
  });

  assert.equal(banner.tone, 'success');
  assert.match(banner.message, /controls are unlocked/i);
  assert.match(banner.message, /setup details/i);
});
