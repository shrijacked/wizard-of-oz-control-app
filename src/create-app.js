'use strict';

const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const { ExperimentStore } = require('./store');
const { WebSocketHub } = require('./websocket-hub');
const { WatchBridge } = require('./watch-bridge');
const { getLocalNetworkAddresses } = require('./network');
const { LlmAdvisor } = require('./llm-advisor');

const ROBOT_ACTIONS = [
  { actionId: 'function-1', label: 'Function 1: Move Square' },
  { actionId: 'function-2', label: 'Function 2: Rotate Triangle' },
  { actionId: 'function-3', label: 'Function 3: Blue Triangle' },
  { actionId: 'function-4', label: 'Function 4: Lift Circle' },
  { actionId: 'function-5', label: 'Function 5: Shift Hexagon' },
  { actionId: 'function-6', label: 'Function 6: Nudge Edge' },
  { actionId: 'function-7', label: 'Function 7: Reset Pose' },
];

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function json(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function roleState(store, role, systemStatus) {
  const state = store.getState();

  if (role === 'subject') {
    return {
      session: state.session,
      hint: state.hint,
    };
  }

  if (role === 'audit') {
    return {
      session: state.session,
      robotAction: state.robotAction,
    };
  }

  return {
    ...state,
    system: systemStatus,
  };
}

async function serveFile(response, filePath) {
  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath);
    response.writeHead(200, { 'content-type': CONTENT_TYPES[extension] || 'application/octet-stream' });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    throw error;
  }
}

async function createApp(options = {}) {
  const port = Number(options.port || process.env.PORT || 3000);
  const publicDir = options.publicDir || path.join(process.cwd(), 'public');
  const store = options.store || new ExperimentStore({
    dataDir: options.dataDir,
    adaptiveEngine: options.adaptiveEngine,
    llmAdvisor: options.llmAdvisor || new LlmAdvisor(),
  });
  const watchBridge = options.watchBridge || new WatchBridge({
    store,
    watchFilePath: options.watchFilePath || path.join(process.cwd(), 'watch', 'watch_data.json'),
  });

  await store.initialize();
  await watchBridge.start();

  const getSystemStatus = () => ({
    watchBridge: watchBridge.getStatus(),
    connections: hub.getConnectionStats(),
    robotActions: ROBOT_ACTIONS,
    network: {
      localhost: {
        admin: `http://localhost:${port}/admin`,
        subject: `http://localhost:${port}/subject`,
        audit: `http://localhost:${port}/audit`,
      },
      lan: getLocalNetworkAddresses(port),
    },
  });

  const hub = new WebSocketHub({
    getStateForRole: (role) => roleState(store, role, getSystemStatus()),
    getSystemStatus,
  });

  store.on('state', () => {
    hub.broadcastSnapshots();
  });

  store.on('event', ({ event }) => {
    hub.broadcastEvent(event);
  });

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      if (request.method === 'GET' && pathname === '/') {
        response.writeHead(302, { location: '/admin' });
        response.end();
        return;
      }

      if (request.method === 'GET' && pathname === '/admin') {
        await serveFile(response, path.join(publicDir, 'admin.html'));
        return;
      }

      if (request.method === 'GET' && pathname === '/subject') {
        await serveFile(response, path.join(publicDir, 'subject.html'));
        return;
      }

      if (request.method === 'GET' && pathname === '/audit') {
        await serveFile(response, path.join(publicDir, 'audit.html'));
        return;
      }

      if (request.method === 'GET' && pathname === '/health') {
        json(response, 200, { ok: true });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/state') {
        const role = url.searchParams.get('role') || 'admin';
        json(response, 200, roleState(store, role, getSystemStatus()));
        return;
      }

      if (request.method === 'GET' && pathname === '/api/events') {
        const limit = Number(url.searchParams.get('limit') || 25);
        json(response, 200, { events: store.getRecentEvents(limit) });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/network') {
        json(response, 200, getSystemStatus().network);
        return;
      }

      if (request.method === 'GET' && pathname.startsWith('/')) {
        const candidatePath = path.join(publicDir, pathname.replace(/^\/+/, ''));
        if (candidatePath.startsWith(publicDir)) {
          try {
            await serveFile(response, candidatePath);
            return;
          } catch (error) {
            if (error.code !== 'ENOENT') {
              throw error;
            }
          }
        }
      }

      if (request.method === 'POST' && pathname === '/api/hints') {
        const body = await readJsonBody(request);
        const state = await store.setHint({
          text: body.text,
          author: body.author || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/actions') {
        const body = await readJsonBody(request);
        const state = await store.logRobotAction({
          actionId: body.actionId,
          label: body.label,
          payload: body.payload || {},
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/telemetry/hrv') {
        const body = await readJsonBody(request);
        const state = await store.ingestHrvTelemetry(body, { source: body.source || 'api' });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/telemetry/gaze') {
        const body = await readJsonBody(request);
        const state = await store.ingestGazeTelemetry(body, { source: body.source || 'api' });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/telemetry/simulate') {
        const body = await readJsonBody(request);
        const state = await store.ingestSimulatedTelemetry(body, { source: 'simulator' });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/reset') {
        const body = await readJsonBody(request);
        const state = await store.resetSession({
          requestedBy: body.requestedBy || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      json(response, 404, { error: 'Not found' });
    } catch (error) {
      json(response, 500, {
        error: error.message || 'Unexpected server error',
      });
    }
  });

  server.on('upgrade', (request, socket) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    hub.handleUpgrade(request, socket);
  });

  return {
    port,
    server,
    store,
    watchBridge,
    hub,
    robotActions: ROBOT_ACTIONS,
    close() {
      watchBridge.stop();
      hub.close();
      return new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}

module.exports = {
  ROBOT_ACTIONS,
  createApp,
  readJsonBody,
  roleState,
};
