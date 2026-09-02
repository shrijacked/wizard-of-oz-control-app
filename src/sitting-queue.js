'use strict';

const SETS_PER_SITTING = 3;

function normalizeSittingNumber(value) {
  const sitting = Math.floor(Number(value));
  if (!Number.isFinite(sitting) || sitting < 1) {
    return 1;
  }

  return sitting;
}

function setIdsForSitting(sittingNumber) {
  const sitting = normalizeSittingNumber(sittingNumber);
  const start = ((sitting - 1) * SETS_PER_SITTING) + 1;
  return [String(start), String(start + 1), String(start + 2)];
}

function queueMatchesSitting(queue = [], sittingNumber, plannedRounds = SETS_PER_SITTING) {
  const expected = setIdsForSitting(sittingNumber).slice(0, plannedRounds);
  const actual = Array.isArray(queue)
    ? queue.map((entry) => String(entry?.setId || '').trim()).filter(Boolean)
    : [];

  if (actual.length !== expected.length) {
    return false;
  }

  return expected.every((setId, index) => actual[index] === setId);
}

module.exports = {
  SETS_PER_SITTING,
  normalizeSittingNumber,
  queueMatchesSitting,
  setIdsForSitting,
};
