'use strict';

const { createHash, randomUUID } = require('node:crypto');
const { URL } = require('node:url');

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const VALID_ROLES = new Set(['admin', 'subject', 'robot', 'audit']);

function encodeFrame(payload) {
  const data = Buffer.from(payload, 'utf8');
  let header;

  if (data.length < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = data.length;
  } else if (data.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(data.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(data.length), 2);
  }

  return Buffer.concat([header, data]);
}

class WebSocketHub {
  constructor(options = {}) {
    this.getStateForRole = options.getStateForRole;
    this.getSystemStatus = options.getSystemStatus || (() => ({}));
    this.onConnectionStatsChanged = options.onConnectionStatsChanged || (() => {});
    this.clients = new Map();
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
    const client = { id: clientId, role, socket };
    this.clients.set(clientId, client);

    const cleanup = () => {
      this.clients.delete(clientId);
      this.onConnectionStatsChanged(this.getConnectionStats());
    };

    socket.on('close', cleanup);
    socket.on('end', cleanup);
    socket.on('error', cleanup);
    socket.on('data', () => {
      // This transport is server-push only; admin mutations flow over HTTP.
    });

    this.sendToClient(client, {
      type: 'state.snapshot',
      role,
      data: this.getStateForRole(role),
      system: this.getSystemStatus(),
    });
    this.onConnectionStatsChanged(this.getConnectionStats());
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
};
