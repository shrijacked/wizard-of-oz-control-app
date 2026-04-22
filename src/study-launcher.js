'use strict';

const { spawn } = require('node:child_process');

function boolFrom(value, fallback = true) {
  if (value == null) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  return fallback;
}

function parseLauncherOptions(options = {}) {
  const host = String(options.host || process.env.HOST || '0.0.0.0').trim() || '0.0.0.0';
  const port = Number(options.port || process.env.PORT || 3000);
  const pythonCommand = String(options.pythonCommand || process.env.PYTHON_BIN || 'python3').trim() || 'python3';
  const internalServerHost = String(
    options.internalServerHost
      || process.env.INTERNAL_SERVER_HOST
      || (host === '0.0.0.0' ? '127.0.0.1' : host),
  ).trim() || '127.0.0.1';

  const gaze = {
    enabled: boolFrom(options.gaze?.enabled ?? process.env.LAUNCH_GAZE, true),
    mode: String(options.gaze?.mode || process.env.GAZE_MODE || 'heartbeat-only').trim() || 'heartbeat-only',
    file: options.gaze?.file || process.env.GAZE_FILE || null,
    bridgeId: String(options.gaze?.bridgeId || process.env.GAZE_BRIDGE_ID || 'gaze-bridge').trim() || 'gaze-bridge',
    deviceLabel: String(options.gaze?.deviceLabel || process.env.GAZE_DEVICE_LABEL || 'Configured gaze device').trim() || 'Configured gaze device',
    transport: String(options.gaze?.transport || process.env.GAZE_TRANSPORT || 'sdk-http').trim() || 'sdk-http',
    sdkName: options.gaze?.sdkName || process.env.GAZE_SDK_NAME || null,
    heartbeatInterval: Number(options.gaze?.heartbeatInterval || process.env.GAZE_HEARTBEAT_INTERVAL || 5),
    pollSeconds: Number(options.gaze?.pollSeconds || process.env.GAZE_POLL_SECONDS || 0.5),
  };

  return {
    host,
    port,
    pythonCommand,
    enableWatch: boolFrom(options.enableWatch ?? process.env.LAUNCH_WATCH, true),
    watchAutoCalibrate: boolFrom(options.watchAutoCalibrate ?? process.env.WATCH_AUTO_CALIBRATE, true),
    serverUrl: options.serverUrl || `http://${internalServerHost}:${port}`,
    gaze,
  };
}

function buildLaunchPlan(rawOptions = {}) {
  const options = parseLauncherOptions(rawOptions);

  const plan = {
    host: options.host,
    port: options.port,
    server: {
      label: 'server',
      command: 'node',
      args: ['src/server.js'],
      env: {
        HOST: options.host,
        PORT: String(options.port),
      },
      optional: false,
      readyPattern: 'listening on',
    },
    watch: null,
    gaze: null,
  };

  if (options.enableWatch) {
    plan.watch = {
      label: 'watch',
      command: options.pythonCommand,
      args: ['integrations/watch/watch.py'],
      env: {},
      optional: true,
      autoInput: options.watchAutoCalibrate
        ? [{ match: 'Press Enter to start calibration:', send: '\n', once: true }]
        : [],
    };
  }

  if (options.gaze.enabled) {
    const gazeArgs = [
      'integrations/gaze/bridge.py',
      '--server', options.serverUrl,
      '--bridge-id', options.gaze.bridgeId,
      '--device-label', options.gaze.deviceLabel,
      '--transport', options.gaze.transport,
      '--mode', options.gaze.mode,
      '--heartbeat-interval', String(options.gaze.heartbeatInterval),
      '--poll-seconds', String(options.gaze.pollSeconds),
    ];

    if (options.gaze.sdkName) {
      gazeArgs.push('--sdk-name', String(options.gaze.sdkName));
    }

    if (options.gaze.mode === 'file-tail' && options.gaze.file) {
      gazeArgs.push('--file', options.gaze.file);
    }

    plan.gaze = {
      label: 'gaze',
      command: options.pythonCommand,
      args: gazeArgs,
      env: {},
      optional: true,
      autoInput: [],
    };
  }

  return plan;
}

function prefixStream(child, stream, label, onChunk) {
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    onChunk?.(chunk);
    chunk.split(/\r?\n/).filter(Boolean).forEach((line) => {
      const writer = stream === child.stderr ? process.stderr : process.stdout;
      writer.write(`[${label}] ${line}\n`);
    });
  });
}

function spawnEntry(entry) {
  const child = spawn(entry.command, entry.args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...(entry.env || {}),
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const autoInput = Array.isArray(entry.autoInput) ? [...entry.autoInput] : [];
  prefixStream(child, child.stdout, entry.label, (chunk) => {
    autoInput.forEach((rule) => {
      if (!rule.triggered && chunk.includes(rule.match)) {
        child.stdin.write(rule.send);
        if (rule.once) {
          rule.triggered = true;
        }
      }
    });
  });
  prefixStream(child, child.stderr, entry.label);
  return child;
}

async function launchStudyStack(rawOptions = {}) {
  const plan = buildLaunchPlan(rawOptions);
  const children = new Map();
  let shuttingDown = false;

  const stopAll = () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    for (const child of children.values()) {
      if (!child.killed) {
        child.kill('SIGINT');
      }
    }
  };

  process.on('SIGINT', stopAll);
  process.on('SIGTERM', stopAll);

  return new Promise((resolve) => {
    const serverChild = spawnEntry(plan.server);
    children.set(plan.server.label, serverChild);

    const startOptionalChildren = () => {
      for (const entry of [plan.watch, plan.gaze].filter(Boolean)) {
        if (children.has(entry.label)) {
          continue;
        }

        const child = spawnEntry(entry);
        children.set(entry.label, child);
        child.on('exit', (code) => {
          if (!entry.optional || shuttingDown) {
            return;
          }

          const reason = code === 0 ? 'stopped' : `exited with code ${code}`;
          process.stderr.write(`[launcher] optional ${entry.label} process ${reason}.\n`);
        });
      }
    };

    let optionalStarted = false;
    serverChild.stdout.on('data', (chunk) => {
      if (!optionalStarted && chunk.includes(plan.server.readyPattern)) {
        optionalStarted = true;
        startOptionalChildren();
      }
    });

    serverChild.on('exit', (code) => {
      stopAll();
      resolve(Number.isFinite(code) ? code : 0);
    });
  });
}

async function main() {
  const exitCode = await launchStudyStack();
  process.exit(exitCode);
}

if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  buildLaunchPlan,
  launchStudyStack,
  parseLauncherOptions,
};
