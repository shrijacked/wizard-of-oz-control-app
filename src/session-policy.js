'use strict';

function buildPolicy(state, action, options = {}) {
  const session = state.session || {};
  const status = session.status || 'setup';
  const metadata = session.metadata || {};
  const queue = Array.isArray(session.queue) ? session.queue : [];
  const rounds = Array.isArray(session.rounds) ? session.rounds : [];
  const activeRound = session.activeRound || null;
  const fullStudy = Array.isArray(session.schedule) && session.schedule.length >= 9;
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

    if (fullStudy && session.awaitingRoundSurvey) {
      return deny(`Complete the round ${session.awaitingRoundSurvey} questionnaire before starting the next round.`);
    }

    if (fullStudy && session.betweenSittings) {
      return deny('The study is between sittings. Begin the next sitting before starting its first round.');
    }

    if (fullStudy && (session.finalSurveyRequired || session.finalSurvey)) {
      return deny('All nine rounds are finished. Complete the end-of-study flow.');
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
    if (fullStudy) {
      if (activeRound) {
        return deny('Complete the active round and its questionnaire before ending the study.');
      }
      if (rounds.length < session.schedule.length) {
        return deny('All nine rounds must be completed before ending the study.');
      }
      if (session.awaitingRoundSurvey || session.finalSurveyRequired || !session.finalSurvey) {
        return deny('The participant must finish the remaining questionnaires before the study can end.');
      }
    }
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

    if (activeRound.condition === 'control') {
      return deny('Hints and robot movements are disabled during control rounds.');
    }

    return allow();
  }

  if (action === 'pauseRound') {
    if (status !== 'running' || !activeRound) {
      return deny('Start a round before pausing its timer.');
    }
    return activeRound.pauseStartedAt
      ? deny('The round timer is already paused.')
      : allow();
  }

  if (action === 'resumeRound') {
    if (status !== 'running' || !activeRound?.pauseStartedAt) {
      return deny('Pause the active round before resuming its timer.');
    }
    return allow();
  }

  if (action === 'resumeSitting') {
    return status === 'running' && session.betweenSittings
      ? allow()
      : deny('The study is not currently between sittings.');
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
