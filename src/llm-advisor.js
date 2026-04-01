'use strict';

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4.1-mini';

function buildPrompt(state, adaptiveState) {
  const summary = {
    adaptive: {
      status: adaptiveState.status,
      score: adaptiveState.score,
      reason: adaptiveState.reason,
    },
    hrv: state.telemetry.hrv,
    gaze: state.telemetry.gaze,
    latestHint: state.hint,
    latestRobotAction: state.robotAction,
  };

  return [
    {
      role: 'system',
      content: [
        'You are assisting a human researcher during a Wizard of Oz study.',
        'Return compact JSON with keys summary, recommendedHint, and urgency.',
        'recommendedHint should be a short sentence that could be shown to the participant.',
        'If no intervention is warranted, set recommendedHint to an empty string.',
      ].join(' '),
    },
    {
      role: 'user',
      content: JSON.stringify(summary),
    },
  ];
}

class LlmAdvisor {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.ADAPTIVE_LLM_API_KEY || process.env.OPENAI_API_KEY || '';
    this.endpoint = options.endpoint || process.env.ADAPTIVE_LLM_ENDPOINT || DEFAULT_ENDPOINT;
    this.model = options.model || process.env.ADAPTIVE_LLM_MODEL || DEFAULT_MODEL;
    this.timeoutMs = Number(options.timeoutMs || process.env.ADAPTIVE_LLM_TIMEOUT_MS || 1800);
    this.fetchImpl = options.fetchImpl || globalThis.fetch;
  }

  isEnabled() {
    return Boolean(this.apiKey && this.fetchImpl);
  }

  async analyze(state, adaptiveState) {
    if (!this.isEnabled()) {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: buildPrompt(state, adaptiveState),
          temperature: 0.2,
          response_format: {
            type: 'json_object',
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const rawContent = payload?.choices?.[0]?.message?.content || '{}';
      const parsed = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;

      return {
        generatedAt: new Date().toISOString(),
        model: this.model,
        endpoint: this.endpoint,
        summary: parsed.summary || adaptiveState.reason,
        recommendedHint: parsed.recommendedHint || '',
        urgency: parsed.urgency || adaptiveState.status,
        error: null,
      };
    } catch (error) {
      return {
        generatedAt: new Date().toISOString(),
        model: this.model,
        endpoint: this.endpoint,
        summary: adaptiveState.reason,
        recommendedHint: '',
        urgency: adaptiveState.status,
        error: error.message,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = {
  LlmAdvisor,
};
