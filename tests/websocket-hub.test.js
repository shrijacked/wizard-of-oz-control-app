'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const { WebSocketHub, decodeFrames } = require('../src/websocket-hub');

class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.destroyed = false;
    this.written = [];
  }

  write(buffer) {
    this.written.push(buffer);
    return true;
  }

  destroy() {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.emit('close');
  }
}

function fakeUpgrade(hub, role) {
  const socket = new FakeSocket();
  const request = {
    url: `/ws?role=${role}`,
    headers: {
      upgrade: 'websocket',
      'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
    },
  };
  hub.handleUpgrade(request, socket);
  return socket;
}

// Builds a masked client->server frame, the way a browser sends control frames.
function maskedFrame(opcode, payload = Buffer.alloc(0)) {
  const mask = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i += 1) {
    masked[i] = payload[i] ^ mask[i % 4];
  }
  const header = Buffer.alloc(2);
  header[0] = 0x80 | opcode;
  header[1] = 0x80 | payload.length;
  return Buffer.concat([header, mask, masked]);
}

test('a half-open client that misses a ping is evicted and drops out of the stats', async () => {
  const hub = new WebSocketHub({
    getStateForRole: () => ({}),
    getSystemStatus: () => ({}),
    heartbeatIntervalMs: 0,
  });

  const subject = fakeUpgrade(hub, 'subject');
  assert.equal(hub.getConnectionStats().subject, 1);

  // First sweep marks the client as awaiting a pong and sends a ping.
  hub.sweepLiveness();
  assert.equal(hub.getConnectionStats().subject, 1);

  // The dead socket never answered, so the next sweep evicts it.
  hub.sweepLiveness();
  assert.equal(hub.getConnectionStats().subject, 0);
  assert.equal(subject.destroyed, true);

  hub.close();
});

test('a responsive client that pongs survives repeated liveness sweeps', async () => {
  const hub = new WebSocketHub({
    getStateForRole: () => ({}),
    getSystemStatus: () => ({}),
    heartbeatIntervalMs: 0,
  });

  const robot = fakeUpgrade(hub, 'robot');

  hub.sweepLiveness();
  // Browser answers the ping with a masked pong frame.
  robot.emit('data', maskedFrame(0xa));
  hub.sweepLiveness();

  assert.equal(hub.getConnectionStats().robot, 1);
  assert.equal(robot.destroyed, false);

  hub.close();
});

test('a client close frame removes the client', async () => {
  const hub = new WebSocketHub({
    getStateForRole: () => ({}),
    getSystemStatus: () => ({}),
    heartbeatIntervalMs: 0,
  });

  const subject = fakeUpgrade(hub, 'subject');
  subject.emit('data', maskedFrame(0x8));

  assert.equal(hub.getConnectionStats().subject, 0);
  hub.close();
});

test('decodeFrames unmasks a client frame and reports leftover bytes', () => {
  const frame = maskedFrame(0x1, Buffer.from('hi', 'utf8'));
  const withPartial = Buffer.concat([frame, Buffer.from([0x81])]);
  const { frames, rest } = decodeFrames(withPartial);

  assert.equal(frames.length, 1);
  assert.equal(frames[0].opcode, 0x1);
  assert.equal(frames[0].payload.toString('utf8'), 'hi');
  assert.equal(rest.length, 1);
});
