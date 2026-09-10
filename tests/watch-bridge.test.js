'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { WatchBridge } = require('../src/watch-bridge');

test('watch bridge processes low sequence numbers after watch.py resets its file', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-watch-bridge-'));
  const watchFilePath = path.join(directory, 'watch_data.json');
  const received = [];
  const bridge = new WatchBridge({
    watchFilePath,
    store: {
      async ingestWatchEntry(entry) {
        received.push(entry.sequence_number);
      },
    },
  });

  await fs.writeFile(watchFilePath, JSON.stringify({
    current_sequence: 5,
    entries: [{ sequence_number: 5, watch_data: {} }],
  }));
  await bridge.processFile();
  await fs.writeFile(watchFilePath, JSON.stringify({
    current_sequence: 1,
    entries: [{ sequence_number: 1, watch_data: {} }],
  }));
  await bridge.processFile();

  assert.deepEqual(received, [5, 1]);
  assert.equal(bridge.getStatus().lastSequenceNumber, 1);
});

test('watch bridge writes an identifiable pending calibration request', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'woz-watch-control-'));
  const watchFilePath = path.join(directory, 'watch_data.json');
  await fs.writeFile(watchFilePath, JSON.stringify({ current_sequence: 0, entries: [] }));
  const bridge = new WatchBridge({ watchFilePath, store: { ingestWatchEntry: async () => {} } });
  bridge.status.active = true;

  const result = await bridge.requestCalibration({ requestedBy: 'Researcher' });
  const control = JSON.parse(await fs.readFile(path.join(directory, 'control.json'), 'utf8'));
  assert.equal(result.awaitingWatch, true);
  assert.equal(result.requestId, control.requestId);
  assert.equal(control.action, 'calibrate');
});
