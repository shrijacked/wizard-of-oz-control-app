'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function defaultPythonCommand() {
  const virtualEnvironmentPython = process.platform === 'win32'
    ? path.join(process.cwd(), '.venv', 'Scripts', 'python.exe')
    : path.join(process.cwd(), '.venv', 'bin', 'python');

  return fs.existsSync(virtualEnvironmentPython) ? virtualEnvironmentPython : 'python3';
}

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
  const pythonCommand = String(
    options.pythonCommand || process.env.PYTHON_BIN || defaultPythonCommand(),
  ).trim() || defaultPythonCommand();
  return {
    host,
    port,
    pythonCommand,
    enableWatch: boolFrom(options.enableWatch ?? process.env.LAUNCH_WATCH, true),
    watchAutoCalibrate: boolFrom(options.watchAutoCalibrate ?? process.env.WATCH_AUTO_CALIBRATE, true),
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
  };

  if (options.enableWatch) {
    plan.watch = {
      label: 'watch',
      command: options.pythonCommand,
      args: ['integrations/watch/watch.py'],
      env: {
        WATCH_CALIBRATE_ON_START: options.watchAutoCalibrate ? '1' : '0',
      },
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
      for (const entry of [plan.watch].filter(Boolean)) {
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
