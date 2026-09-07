'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { LlmAdvisor } = require('../src/llm-advisor');

test('LLM advisor parses an OpenAI-compatible JSON response', async () => {
  const advisor = new LlmAdvisor({
    apiKey: 'test-key',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                summary: 'HRV stress is rising.',
                recommendedHint: 'Try the outer edge for alignment.',
                urgency: 'observe',
              }),
            },
          },
        ],
      }),
    }),
  });

  const result = await advisor.analyze({
    telemetry: {
      hrv: { stressScore: 0.6 },
    },
    hint: {},
    robotAction: {},
  }, {
    status: 'observe',
    score: 0.61,
    reason: 'Observe the participant.',
  });

  assert.equal(result.summary, 'HRV stress is rising.');
  assert.equal(result.recommendedHint, 'Try the outer edge for alignment.');
  assert.equal(result.urgency, 'observe');
  assert.equal(result.error, null);
});
