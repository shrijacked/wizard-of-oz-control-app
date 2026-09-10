'use strict';

const { createHash } = require('node:crypto');

const CONDITIONS = Object.freeze(['control', 'constant', 'adaptive']);
const CONDITION_ORDERS = Object.freeze([
  Object.freeze(['control', 'constant', 'adaptive']),
  Object.freeze(['control', 'adaptive', 'constant']),
  Object.freeze(['constant', 'control', 'adaptive']),
  Object.freeze(['constant', 'adaptive', 'control']),
  Object.freeze(['adaptive', 'control', 'constant']),
  Object.freeze(['adaptive', 'constant', 'control']),
]);

function participantNumber(participantId) {
  const match = String(participantId || '').trim().match(/(\d+)$/);
  return match ? Math.max(1, Number(match[1])) : 1;
}

function conditionOrderForParticipant(participantId) {
  return [...CONDITION_ORDERS[(participantNumber(participantId) - 1) % CONDITION_ORDERS.length]];
}

function normalizeConditionOrder(value) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return null;
  }
  const order = Array.isArray(value)
    ? value.map((entry) => String(entry || '').trim().toLowerCase())
    : String(value).split(/[|,>]/).map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  if (order.length !== CONDITIONS.length
    || new Set(order).size !== CONDITIONS.length
    || order.some((condition) => !CONDITIONS.includes(condition))) {
    const error = new Error('Condition order must contain control, constant, and adaptive exactly once.');
    error.statusCode = 400;
    throw error;
  }
  return order;
}

function seededRandom(seed) {
  let state = createHash('sha256').update(String(seed || 'wizard-of-oz')).digest().readUInt32LE(0);
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(values, seed) {
  const result = [...values];
  const random = seededRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function buildStudySchedule(puzzleSets, participantId, options = {}) {
  const roundsPerSitting = Number(options.roundsPerSitting || 3);
  const totalRounds = Number(options.totalRounds || 9);
  const seed = String(options.seed || `${options.studyId || 'hti'}:${participantId || 'P01'}`);
  const order = normalizeConditionOrder(options.conditionOrder) || conditionOrderForParticipant(participantId);
  const selected = shuffled(puzzleSets, seed).slice(0, totalRounds);

  if (selected.length < totalRounds) {
    return { seed, conditionOrder: order, schedule: [] };
  }

  return {
    seed,
    conditionOrder: order,
    schedule: selected.map((puzzle, index) => {
      const sittingNumber = Math.floor(index / roundsPerSitting) + 1;
      return {
        roundIndex: index + 1,
        sittingNumber,
        condition: order[sittingNumber - 1],
        puzzle,
      };
    }),
  };
}

module.exports = {
  CONDITIONS,
  CONDITION_ORDERS,
  buildStudySchedule,
  conditionOrderForParticipant,
  normalizeConditionOrder,
  participantNumber,
  shuffled,
};
