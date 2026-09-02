'use strict';

function buildPolicy(state, action, options = {}) {
  const session = state.session || {};
  const status = session.status || 'setup';
  const metadata = session.metadata || {};
  const queue = Array.isArray(session.queue) ? session.queue : [];
  const rounds = Array.isArray(session.rounds) ? session.rounds : [];
  const activeRound = session.activeRound || null;
  const force = Boolean(options.force);

  const allow = () => ({ allowed: true, reason: null });
  const deny = (reason) => ({ allowed: false, reason });

  if (action === 'configureSession' || action === 'queueRounds') {
    return status === 'setup'
      ? allow()
      : deny('Session setup is locked once the sitting has started.');
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

    if (queue.length === 0) {
      return deny('Queue at least one puzzle before starting the sitting.');
    }

    const preflight = options.preflight;
    if (!preflight || preflight.requiredReady !== true) {
      return deny((preflight && preflight.summary) || 'Sitting readiness is not complete.');
    }

    return allow();
  }

  if (action === 'startRound') {
    if (status !== 'running') {
      return deny('Start the sitting before opening a round.');
    }

    if (activeRound) {
      return deny('Finish the current round before starting the next one.');
    }

    if (rounds.length >= queue.length) {
      return deny('All queued puzzles for this sitting have been played.');
    }

    return allow();
  }

  if (action === 'completeRound') {
    return status === 'running' && activeRound
      ? allow()
      : deny('There is no active round to complete.');
  }

  if (action === 'completeSession') {
    return status === 'running'
      ? allow()
      : deny('Only running sittings can be completed.');
  }

  if (action === 'setHint' || action === 'logRobotAction') {
    if (status !== 'running') {
      return deny('Hints and robot cues are only allowed during an active sitting.');
    }

    if (!activeRound) {
      return deny('Start a round before sending hints or robot cues.');
    }

    return allow();
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
