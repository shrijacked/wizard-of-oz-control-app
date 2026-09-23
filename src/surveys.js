'use strict';

const GENDERS = Object.freeze(['woman', 'man', 'non-binary', 'self-describe', 'prefer-not-to-say']);

const CONSENT_STATEMENT = 'I consent to participate in this study.';

const SUBJECT_INSTRUCTIONS = [
  'You will solve nine tangram puzzles in three short sittings of three puzzles each.',
  'Each puzzle uses all seven tangram pieces. Every piece must be used in the final shape.',
  'Each designated starting spot has a dot marking the center of its piece. Whenever a piece is not in use—or you are unsure what to do—immediately put it back with its center directly over that dot. This is essential because the robot can only pick pieces up from their marked starting spots.',
  'The amount and timing of assistance may vary. You may receive an on-screen hint, hear an alert, or see the robot move a piece.',
  'Before the first puzzle, press Enable study sounds on this screen. One high beep means the puzzle has started, two medium beeps mean you are halfway through the available time, and the distinct descending low sound means the puzzle time has ended. A bright two-beep alert means that a questionnaire is ready. Additional alerts indicate a new hint or robot movement.',
  'The researcher uses fixed numbered robot programs for the seven colored shapes: 1 Orange Triangle, 2 Green Square, 3 Red Triangle, 4 Pink Triangle, 5 Yellow Parallelogram, 6 Blue Triangle, and 7 Purple Triangle.',
  'After every puzzle, complete the short questionnaire on this screen. The researcher will see when it has been filled. There will be a break after puzzles three and six.',
  'Important reminder: throughout every puzzle, keep every piece you are not actively using back on its own marked dot. If pieces are left elsewhere, the robot may be unable to pick them up and provide the intended assistance.',
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
