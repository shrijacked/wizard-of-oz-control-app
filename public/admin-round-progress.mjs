export function describeRoundProgress(session = {}) {
  const rounds = Array.isArray(session.rounds) ? session.rounds : [];
  const planned = Math.max(1, Number(session.plannedRounds) || Number(session.schedule?.length) || 9);
  const activeRound = session.activeRound || null;
  const awaitingRound = Number(session.awaitingRoundSurvey) || null;
  const submittedCount = rounds.filter((round) => round.survey && !round.survey.skipped).length;
  const resolvedCount = rounds.filter((round) => round.survey).length;
  const lastRound = rounds[rounds.length - 1] || null;
  const displayedRound = activeRound?.index || awaitingRound || Math.min(rounds.length, planned);

  let formText = `No form yet • ${submittedCount}/${planned} filled`;
  let formStatus = 'pending';

  if (awaitingRound) {
    formText = `Form ${awaitingRound}: waiting • ${submittedCount}/${planned} filled`;
    formStatus = 'waiting';
  } else if (activeRound) {
    formText = `Form ${activeRound.index}: pending • ${submittedCount}/${planned} filled`;
  } else if (lastRound?.survey?.skipped) {
    formText = `Form ${lastRound.index}: skipped • ${resolvedCount}/${planned} resolved`;
    formStatus = 'skipped';
  } else if (lastRound?.survey) {
    formText = `Form ${lastRound.index}: filled • ${submittedCount}/${planned} filled`;
    formStatus = 'filled';
  }

  return {
    roundText: `Round ${displayedRound} of ${planned}`,
    formText,
    formStatus,
  };
}
