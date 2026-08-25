'use strict';

const { createHash, randomUUID } = require('node:crypto');
const { URL } = require('node:url');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const VALID_ROLES = new Set(['admin', 'subject', 'robot', 'audit']);

const OPCODE = {
  TEXT: 0x1,
  BINARY: 0x2,
  CLOSE: 0x8,
  PING: 0x9,
  PONG: 0xa,
};

function encodeFrame(payload, opcode = OPCODE.TEXT) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  let header;

  if (data.length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = data.length;
  } else if (data.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }

  return Buffer.concat([header, data]);
}

// Decodes as many complete frames as are present in the buffer. Client->server
// frames are masked per the WebSocket spec, so we unmask their payloads.
function decodeFrames(buffer) {
  const frames = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const firstByte = buffer[offset];
    const secondByte = buffer[offset + 1];
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) === 0x80;
    let length = secondByte & 0x7f;
    let headerLength = 2;

    if (length === 126) {
      if (offset + 4 > buffer.length) {
        break;
      }
      length = buffer.readUInt16BE(offset + 2);
      headerLength = 4;
    } else if (length === 127) {
      if (offset + 10 > buffer.length) {
        break;
      }
      length = Number(buffer.readBigUInt64BE(offset + 2));
      headerLength = 10;
    }

    const maskLength = masked ? 4 : 0;
    const totalLength = headerLength + maskLength + length;
    if (offset + totalLength > buffer.length) {
      break;
    }

    let payload = buffer.subarray(offset + headerLength + maskLength, offset + totalLength);
    if (masked) {
      const mask = buffer.subarray(offset + headerLength, offset + headerLength + maskLength);
      const unmasked = Buffer.allocUnsafe(length);
      for (let index = 0; index < length; index += 1) {
        unmasked[index] = payload[index] ^ mask[index % 4];
      }
      payload = unmasked;
    }

    frames.push({ opcode, payload });
    offset += totalLength;
  }

  return { frames, rest: buffer.subarray(offset) };
}

class WebSocketHub {
  constructor(options = {}) {
    this.getStateForRole = options.getStateForRole;
    this.getSystemStatus = options.getSystemStatus || (() => ({}));
    this.onConnectionStatsChanged = options.onConnectionStatsChanged || (() => {});
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 15000;
    this.clients = new Map();
    this.heartbeatTimer = null;

    if (this.heartbeatIntervalMs > 0) {
      this.heartbeatTimer = setInterval(() => this.sweepLiveness(), this.heartbeatIntervalMs);
      // Do not keep the process alive solely for the heartbeat.
      this.heartbeatTimer.unref?.();
    }
  }

  handleUpgrade(request, socket) {
    const url = new URL(request.url, 'http://localhost');
    const requestedRole = VALID_ROLES.has(url.searchParams.get('role')) ? url.searchParams.get('role') : 'admin';
    const role = requestedRole === 'audit' ? 'robot' : requestedRole;
    const key = request.headers['sec-websocket-key'];

    if (!key || request.headers.upgrade?.toLowerCase() !== 'websocket') {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const acceptKey = createHash('sha1').update(key + WS_GUID).digest('base64');
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${acceptKey}`,
        '\r\n',
      ].join('\r\n'),
    );

    const clientId = randomUUID();
    const client = {
      id: clientId,
      role,
      socket,
      isAlive: true,
      buffer: Buffer.alloc(0),
    };
    this.clients.set(clientId, client);

    const cleanup = () => {
      this.clients.delete(clientId);
      this.onConnectionStatsChanged(this.getConnectionStats());
    };

    socket.on('close', cleanup);
    socket.on('end', cleanup);
    socket.on('error', cleanup);
    socket.on('data', (chunk) => this.#handleIncoming(client, chunk));

    this.sendToClient(client, {
      type: 'state.snapshot',
      role,
      data: this.getStateForRole(role),
      system: this.getSystemStatus(),
    });
    this.onConnectionStatsChanged(this.getConnectionStats());
  }

  #handleIncoming(client, chunk) {
    // Any inbound traffic proves the socket is still alive.
    client.isAlive = true;
    client.buffer = Buffer.concat([client.buffer, chunk]);

    const { frames, rest } = decodeFrames(client.buffer);
    client.buffer = rest;

    for (const frame of frames) {
      if (frame.opcode === OPCODE.CLOSE) {
        this.#evict(client);
        return;
      }

      if (frame.opcode === OPCODE.PING) {
        this.#sendControl(client, OPCODE.PONG, frame.payload);
      }
      // PONG (and TEXT/BINARY) already refreshed isAlive above.
    }
  }

  // Sends a ping to every client and evicts any that failed to answer the
  // previous ping. Browsers auto-answer pings, so a missed pong means the
  // socket is half-open (sleep, WiFi roam) and must be dropped.
  sweepLiveness() {
    for (const client of [...this.clients.values()]) {
      if (client.isAlive === false) {
        this.#evict(client);
        continue;
      }

      client.isAlive = false;
      this.#sendControl(client, OPCODE.PING);
    }
  }

  #evict(client) {
    if (!this.clients.has(client.id)) {
      return;
    }

    this.clients.delete(client.id);
    try {
      client.socket.destroy();
    } catch (error) {
      // Ignore teardown failures.
    }
    this.onConnectionStatsChanged(this.getConnectionStats());
  }

  #sendControl(client, opcode, payload = Buffer.alloc(0)) {
    if (client.socket.destroyed) {
      this.clients.delete(client.id);
      return;
    }

    try {
      client.socket.write(encodeFrame(payload, opcode));
    } catch (error) {
      this.#evict(client);
    }
  }

  getConnectionStats() {
    const robotConnections = [...this.clients.values()].filter((client) => client.role === 'robot').length;
    return {
      admin: [...this.clients.values()].filter((client) => client.role === 'admin').length,
      subject: [...this.clients.values()].filter((client) => client.role === 'subject').length,
      robot: robotConnections,
      audit: robotConnections,
    };
  }

  broadcastSnapshots() {
    for (const client of this.clients.values()) {
      this.sendToClient(client, {
        type: 'state.snapshot',
        role: client.role,
        data: this.getStateForRole(client.role),
        system: this.getSystemStatus(),
      });
    }
  }

  broadcastEvent(event) {
    for (const client of this.clients.values()) {
      if (client.role !== 'admin') {
        continue;
      }

      this.sendToClient(client, {
        type: 'event.created',
        role: client.role,
        data: event,
        system: this.getSystemStatus(),
      });
    }
  }

  close() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const client of this.clients.values()) {
      try {
        client.socket.destroy();
      } catch (error) {
        // Ignore shutdown errors.
      }
    }

    this.clients.clear();
  }

  sendToClient(client, payload) {
    if (client.socket.destroyed) {
      this.clients.delete(client.id);
      return;
    }

    try {
      client.socket.write(encodeFrame(JSON.stringify(payload)));
    } catch (error) {
      this.clients.delete(client.id);
      try {
        client.socket.destroy();
      } catch (destroyError) {
        // Ignore double-fault shutdown errors.
      }
    }
  }
}

module.exports = {
  WebSocketHub,
  encodeFrame,
  decodeFrames,
};
