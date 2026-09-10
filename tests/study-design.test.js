'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CONDITION_ORDERS,
  buildStudySchedule,
  conditionOrderForParticipant,
  normalizeConditionOrder,
} = require('../src/study-design');

test('participant numbers cycle evenly through all six condition orders', () => {
  const firstCycle = Array.from({ length: 6 }, (_, index) => conditionOrderForParticipant(`P${index + 1}`));
  assert.deepEqual(firstCycle, CONDITION_ORDERS.map((order) => [...order]));
  assert.deepEqual(conditionOrderForParticipant('P07'), CONDITION_ORDERS[0]);
  assert.deepEqual(conditionOrderForParticipant('participant-12'), CONDITION_ORDERS[5]);
});

test('a valid manual condition order overrides participant counterbalancing', () => {
  const puzzles = Array.from({ length: 9 }, (_, index) => ({ setId: String(index + 1) }));
  const result = buildStudySchedule(puzzles, 'P01', {
    seed: 'manual-order',
    conditionOrder: ['adaptive', 'constant', 'control'],
  });
  assert.deepEqual(result.conditionOrder, ['adaptive', 'constant', 'control']);
  assert.deepEqual(result.schedule.map((round) => round.condition), [
    'adaptive', 'adaptive', 'adaptive',
    'constant', 'constant', 'constant',
    'control', 'control', 'control',
  ]);
  assert.throws(() => normalizeConditionOrder(['control', 'control', 'adaptive']), /exactly once/i);
});

test('nine puzzles are deterministically shuffled before being assigned to condition blocks', () => {
  const puzzles = Array.from({ length: 9 }, (_, index) => ({ setId: String(index + 1) }));
  const first = buildStudySchedule(puzzles, 'P02', { seed: 'study:P02' });
  const repeated = buildStudySchedule(puzzles, 'P02', { seed: 'study:P02' });

  assert.deepEqual(first, repeated);
  assert.equal(first.schedule.length, 9);
  assert.equal(new Set(first.schedule.map((round) => round.puzzle.setId)).size, 9);
  assert.deepEqual(first.schedule.map((round) => round.condition), [
    'control', 'control', 'control',
    'adaptive', 'adaptive', 'adaptive',
    'constant', 'constant', 'constant',
  ]);
  assert.deepEqual(first.schedule.map((round) => round.sittingNumber), [1, 1, 1, 2, 2, 2, 3, 3, 3]);
  assert.notDeepEqual(first.schedule.map((round) => round.puzzle.setId), puzzles.map((puzzle) => puzzle.setId));
});
