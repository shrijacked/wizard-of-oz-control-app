'use strict';

function buildPolicy(state, action, options = {}) {
  const session = state.session || {};
  const status = session.status || 'setup';
  const metadata = session.metadata || {};
  const force = Boolean(options.force);

  const allow = () => ({ allowed: true, reason: null });
  const deny = (reason) => ({ allowed: false, reason });

  if (action === 'configureSession') {
    return status === 'setup'
      ? allow()
      : deny('Session metadata is locked once the trial has started.');
  }

  if (action === 'updatePreflight') {
    return status === 'setup'
      ? allow()
      : deny('The before-participant checklist is locked once the trial has started.');
  }

  if (action === 'startSession') {
    if (status !== 'setup') {
      return deny('Only setup sessions can be started.');
    }

    if (!session.puzzleSet) {
      return deny('Choose a puzzle set before starting the trial.');
    }

    return allow();
  }

  if (action === 'completeSession') {
    return status === 'running'
      ? allow()
      : deny('Only running sessions can be completed.');
  }

  if (action === 'setHint' || action === 'logRobotAction') {
    return status === 'running'
      ? allow()
      : deny('Hints and robotic actions are only allowed during an active run.');
  }

  if (action === 'simulateTelemetry') {
    return status === 'completed'
      ? deny('Completed sessions are read-only until reset.')
      : allow();
  }

  if (action === 'updateAdaptiveConfig') {
    return status === 'completed'
      ? deny('Adaptive controls are read-only after completion.')
      : allow();
  }

  if (action === 'resetSession') {
    if (status === 'running' && !force) {
      return deny('Running sessions require a forced reset confirmation.');
    }

    return allow();
  }

  return allow();
}

function assertPolicy(state, action, options = {}) {
  const result = buildPolicy(state, action, options);
  if (result.allowed) {
    return;
  }

  const error = new Error(result.reason || 'This action is currently blocked.');
  error.statusCode = 409;
  throw error;
}

module.exports = {
  assertPolicy,
  buildPolicy,
};
