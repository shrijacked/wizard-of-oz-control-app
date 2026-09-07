'use strict';

const GENDERS = Object.freeze(['woman', 'man', 'non-binary', 'self-describe', 'prefer-not-to-say']);

const CONSENT_STATEMENT = 'I confirm that I have read the participant information provided by the research team, had the opportunity to ask questions, and voluntarily agree to take part. I understand that I may stop at any time without penalty and that my study data will be handled as described to me.';

const SUBJECT_INSTRUCTIONS = [
  'You will solve nine tangram puzzles in three short sittings of three puzzles each.',
  'The amount and timing of assistance may vary. You may receive an on-screen hint, hear an alert, or see the robot move a piece.',
  'A timer will remain visible while each puzzle is active. Sounds mark the start, midpoint, and end of the planned puzzle time.',
  'After every puzzle, complete the short questionnaire on this screen. There will be a break after puzzles three and six.',
  'Work naturally and tell the researcher if you want to pause or stop. Your participation is voluntary and you may stop at any time without penalty.',
];

const WORKLOAD_KEYS = Object.freeze([
  'mentalDemand',
  'physicalDemand',
  'temporalDemand',
  'performance',
  'effort',
  'frustration',
]);
const INTERVENTION_KEYS = Object.freeze([
  'helpfulness',
  'timingEffectiveness',
  'clarityAndDistraction',
  'stressReduction',
]);
const FINAL_KEYS = Object.freeze([
  'overallHelpfulness',
  'overallEfficacy',
  'trust',
  'automationBias',
]);

function scaleValue(value, key) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > 7) {
    const error = new Error(`${key} must be a whole number from 1 to 7.`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function normalizeProfile(input = {}, options = {}) {
  const age = Number(input.age);
  const gender = String(input.gender || '').trim();
  const selfDescribe = String(input.genderSelfDescribe || '').trim();
  const consented = Boolean(input.consented);
  const instructionsAcknowledged = Boolean(input.instructionsAcknowledged);

  if (!Number.isInteger(age) || age < 18 || age > 120) {
    const error = new Error('Age must be a whole number from 18 to 120.');
    error.statusCode = 400;
    throw error;
  }
  if (!GENDERS.includes(gender)) {
    const error = new Error('Select a gender option.');
    error.statusCode = 400;
    throw error;
  }
  if (gender === 'self-describe' && !selfDescribe) {
    const error = new Error('Enter the self-described gender.');
    error.statusCode = 400;
    throw error;
  }
  if (!consented) {
    const error = new Error('Consent is required before the study can begin.');
    error.statusCode = 400;
    throw error;
  }
  if (options.requireInstructions !== false && !instructionsAcknowledged) {
    const error = new Error('The study instructions must be acknowledged.');
    error.statusCode = 400;
    throw error;
  }
  if (options.requireExpected && !Object.hasOwn(input, 'expectedEfficacy')) {
    const error = new Error('Rate how effective you expect the robot assistance to be.');
    error.statusCode = 400;
    throw error;
  }

  const profile = {
    age,
    gender,
    genderSelfDescribe: gender === 'self-describe' ? selfDescribe : '',
    consented: true,
    instructionsAcknowledged,
  };
  if (Object.hasOwn(input, 'expectedEfficacy')) {
    profile.expectedEfficacy = scaleValue(input.expectedEfficacy, 'expectedEfficacy');
  }
  return profile;
}

function normalizeRoundSurvey(input = {}, condition = 'control') {
  const response = {};
  for (const key of WORKLOAD_KEYS) {
    response[key] = scaleValue(input[key], key);
  }
  if (condition !== 'control') {
    for (const key of INTERVENTION_KEYS) {
      response[key] = scaleValue(input[key], key);
    }
  }
  return response;
}

function normalizeFinalSurvey(input = {}) {
  const response = {};
  for (const key of FINAL_KEYS) {
    response[key] = scaleValue(input[key], key);
  }
  response.comment = String(input.comment || '').trim().slice(0, 4000);
  return response;
}

module.exports = {
  CONSENT_STATEMENT,
  FINAL_KEYS,
  GENDERS,
  INTERVENTION_KEYS,
  SUBJECT_INSTRUCTIONS,
  WORKLOAD_KEYS,
  normalizeFinalSurvey,
  normalizeProfile,
  normalizeRoundSurvey,
};
