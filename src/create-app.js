'use strict';

const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { URL } = require('node:url');

const { AdminGuard } = require('./admin-guard');
const { ExperimentStore } = require('./store');
const { WebSocketHub } = require('./websocket-hub');
const { WatchBridge } = require('./watch-bridge');
const { GazeBridge } = require('./gaze-bridge');
const { getLocalNetworkAddresses } = require('./network');
const { LlmAdvisor } = require('./llm-advisor');
const { summarizeSensorHealth } = require('./sensor-health');
const { assertPolicy, buildPolicy } = require('./session-policy');

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

function text(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    ...headers,
  });
  response.end(payload);
}

async function createApp(options = {}) {
  const port = Number(options.port || process.env.PORT || 3000);
  const publicDir = options.publicDir || path.join(process.cwd(), 'public');
  const adminGuard = options.adminGuard || new AdminGuard({
    pin: options.adminPin,
  });
  const store = options.store || new ExperimentStore({
    dataDir: options.dataDir,
    adaptiveEngine: options.adaptiveEngine,
    llmAdvisor: options.llmAdvisor || new LlmAdvisor(),
  });
  const watchBridge = options.watchBridge || new WatchBridge({
    store,
    watchFilePath: options.watchFilePath || path.join(process.cwd(), 'watch', 'watch_data.json'),
  });
  const gazeBridge = options.gazeBridge || new GazeBridge({
    store,
  });

  await store.initialize();
  await watchBridge.start();

  const getAdminToken = (request) => request.headers['x-admin-token'];

  const getSystemStatus = () => ({
    watchBridge: watchBridge.getStatus(),
    gazeBridge: gazeBridge.getStatus(),
    sensorHealth: summarizeSensorHealth({
      sessionStatus: store.getState().session.status,
      watchBridge: watchBridge.getStatus(),
      gazeBridge: gazeBridge.getStatus(),
    }),
    safeguards: adminGuard.getPublicStatus(),
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

      if (request.method === 'GET' && pathname === '/exports') {
        await serveFile(response, path.join(publicDir, 'exports.html'));
        return;
      }

      if (request.method === 'GET' && pathname === '/health') {
        const systemStatus = getSystemStatus();
        const healthLevel = systemStatus.sensorHealth?.overall?.level || 'healthy';
        json(response, 200, {
          ok: true,
          status: healthLevel === 'healthy' ? 'ok' : (healthLevel === 'error' ? 'error' : 'degraded'),
          sessionStatus: store.getState().session.status,
          sensorHealth: systemStatus.sensorHealth,
        });
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

      if (request.method === 'GET' && pathname === '/api/bridge/gaze') {
        json(response, 200, gazeBridge.getStatus());
        return;
      }

      if (request.method === 'GET' && pathname === '/api/guard') {
        const token = getAdminToken(request);
        const state = store.getState();
        json(response, 200, {
          ...adminGuard.getStatusForToken(token),
          sessionStatus: state.session.status,
          permittedActions: {
            configureSession: buildPolicy(state, 'configureSession'),
            startSession: buildPolicy(state, 'startSession'),
            completeSession: buildPolicy(state, 'completeSession'),
            updateAdaptiveConfig: buildPolicy(state, 'updateAdaptiveConfig'),
            setHint: buildPolicy(state, 'setHint'),
            logRobotAction: buildPolicy(state, 'logRobotAction'),
            simulateTelemetry: buildPolicy(state, 'simulateTelemetry'),
            resetSession: buildPolicy(state, 'resetSession'),
            forceResetSession: buildPolicy(state, 'resetSession', { force: true }),
          },
        });
        return;
      }

      if (request.method === 'GET' && pathname === '/api/exports') {
        json(response, 200, await store.getExportManifest());
        return;
      }

      if (request.method === 'GET' && pathname.startsWith('/api/exports/')) {
        const slug = pathname.slice('/api/exports/'.length);

        if (slug.endsWith('.bundle.json')) {
          const sessionId = slug.slice(0, -'.bundle.json'.length);
          json(response, 200, await store.buildSessionExport(sessionId));
          return;
        }

        if (slug.endsWith('.csv')) {
          const sessionId = slug.slice(0, -'.csv'.length);
          const csv = await store.getSessionCsv(sessionId);
          const resolvedSessionId = sessionId === 'current' ? store.getCurrentSessionId() : sessionId;
          text(response, 200, csv, {
            'content-disposition': `attachment; filename="${resolvedSessionId}.csv"`,
          });
          return;
        }
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
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'setHint');
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
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'logRobotAction');
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
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'simulateTelemetry');
        const body = await readJsonBody(request);
        const state = await store.ingestSimulatedTelemetry(body, { source: 'simulator' });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/adaptive/config') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'updateAdaptiveConfig');
        const body = await readJsonBody(request);
        const state = await store.updateAdaptiveConfiguration({
          ...body,
          actor: body.actor || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/bridge/gaze/heartbeat') {
        const body = await readJsonBody(request);
        json(response, 200, await gazeBridge.heartbeat(body));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/bridge/gaze/frame') {
        const body = await readJsonBody(request);
        json(response, 200, await gazeBridge.ingestFrame(body));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/guard/unlock') {
        const body = await readJsonBody(request);
        json(response, 200, adminGuard.unlock(body.pin));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/guard/lock') {
        adminGuard.assertAuthorized(getAdminToken(request));
        adminGuard.lock(getAdminToken(request));
        json(response, 200, {
          pinRequired: adminGuard.isEnabled(),
          authenticated: false,
        });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/configure') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'configureSession');
        const body = await readJsonBody(request);
        const state = await store.configureSession({
          studyId: body.studyId,
          participantId: body.participantId,
          condition: body.condition,
          researcher: body.researcher,
          notes: body.notes,
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/start') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'startSession');
        const body = await readJsonBody(request);
        const state = await store.startSession({
          operator: body.operator || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/complete') {
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'completeSession');
        const body = await readJsonBody(request);
        const state = await store.completeSession({
          operator: body.operator || 'researcher',
          summary: body.summary,
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      if (request.method === 'POST' && pathname === '/api/session/reset') {
        const body = await readJsonBody(request);
        adminGuard.assertAuthorized(getAdminToken(request));
        assertPolicy(store.getState(), 'resetSession', { force: body.force });
        const state = await store.resetSession({
          requestedBy: body.requestedBy || 'researcher',
          source: 'admin',
        });
        json(response, 200, state);
        return;
      }

      json(response, 404, { error: 'Not found' });
    } catch (error) {
      json(response, error.statusCode || 500, {
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
    gazeBridge,
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
