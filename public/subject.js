import { connectSocket, fetchJson, formatTimestamp, postJson, reportScreenReady, setConnectionBadge } from './shared.js';
import { createAudioCueController } from './audio-cue.mjs';
import { createUpdateCueTracker } from './display-alerts.mjs';

const byId = (id) => document.querySelector(`#${id}`);
const panelIds = ['subject-onboarding', 'subject-waiting', 'subject-round', 'subject-round-survey', 'subject-break', 'subject-final-survey', 'subject-complete'];
const panels = Object.fromEntries(panelIds.map((id) => [id, byId(id)]));
const sound = createAudioCueController({ frequency: 920, durationMs: 230, gainValue: 0.14, waveform: 'square' });
let state = null;
let surveyRound = null;
let timerRoundToken = null;
let instructionAudioUrl = null;
let instructionAudioStarted = false;
const timerMilestones = new Set();

const WORKLOAD = [
  ['mentalDemand', 'Mental Demand: How much mental and perceptual activity was required to solve the tangram puzzle?', 'Very low', 'Very high'],
  ['physicalDemand', 'Physical Demand: How much physical activity was required to complete the puzzle?', 'Very low', 'Very high'],
  ['temporalDemand', 'Temporal Demand: How hurried or rushed was the pace of the task?', 'Very low', 'Very high'],
  ['performance', 'Performance: How successful were you in accomplishing the task?', 'Failure', 'Perfect'],
  ['effort', 'Effort: How much effort did you have to put in to achieve your level of performance?', 'Very low', 'Very high'],
  ['frustration', 'Frustration: How insecure, discouraged, irritated, stressed, and annoyed were you?', 'Very low', 'Very high'],
];
const INTERVENTION = [
  ['helpfulness', "Helpfulness: How helpful did you find the text hints and the robotic arm's movements in solving the tangram puzzle?", 'Not helpful at all (I completely ignored or did not need the assistance)', 'Extremely helpful (I could not have progressed without the assistance)'],
  ['timingEffectiveness', 'Timing Effectiveness: How appropriately timed were the interventions while you were working on the puzzle?', "Poorly timed (they interrupted my flow or arrived when I didn't need them)", 'Perfectly timed (they arrived exactly when I was stuck and needed them)'],
  ['clarityAndDistraction', 'Clarity and Distraction: To what extent did the incoming hint indicators (the audio beeps and on-screen text) disrupt your focus?', 'Highly disruptive (they broke my concentration entirely)', 'Completely seamless (they felt natural and did not distract me at all)'],
  ['stressReduction', 'Stress Reduction: When you found yourself stuck, how effective were the interventions at reducing your frustration?', 'Not effective at all (my frustration remained the same or increased)', 'Highly effective (they completely relieved my frustration)'],
];
const FINAL = [
  ['overallHelpfulness', 'Overall, how helpful was the robot and its accompanying hints across the study?', 'Not helpful at all', 'Extremely helpful'],
  ['overallEfficacy', 'Overall, how effective was the robot assistance at helping you make progress?', 'Not effective at all', 'Extremely effective'],
  ['trust', 'How much did you trust the robot to provide useful and appropriate assistance?', 'Not at all', 'Completely'],
  ['automationBias', "I tended to follow the robot's guidance even when I was uncertain it was correct.", 'Strongly disagree', 'Strongly agree'],
];

function showPanel(id) {
  panelIds.forEach((name) => { panels[name].hidden = name !== id; });
  document.body.dataset.subjectPhase = id.replace('subject-', '');
}

function scaleMarkup(name, low, high) {
  const choices = Array.from({ length: 7 }, (_, index) => `<label><input type="radio" name="${name}" value="${index + 1}" required><span>${index + 1}</span></label>`).join('');
  return `<div class="scale-labels"><span>${low}</span><span>${high}</span></div><div class="scale-options">${choices}</div>`;
}

function fillScaleRows(root = document) {
  root.querySelectorAll('[data-scale-name]').forEach((row) => {
    row.innerHTML = scaleMarkup(row.dataset.scaleName, row.dataset.low, row.dataset.high);
  });
}

function questionMarkup([name, question, low, high]) {
  return `<fieldset class="survey-question"><legend>${question}</legend><div class="scale-row" data-scale-name="${name}" data-low="${low}" data-high="${high}"></div></fieldset>`;
}

function formResponses(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function elapsedSeconds(round) {
  if (!round?.startedAt) return 0;
  const end = round.pauseStartedAt ? new Date(round.pauseStartedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((end - new Date(round.startedAt).getTime()) / 1000) - Number(round.pausedDurationSeconds || 0));
}

function formatClock(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

async function playFinishCue() {
  await sound.beep({ frequency: 650, durationMs: 240, gainValue: 0.16, waveform: 'triangle' });
  await wait(100);
  await sound.beep({ frequency: 520, durationMs: 300, gainValue: 0.16, waveform: 'triangle' });
}

async function playFormReadyCue({ includeFinish = false } = {}) {
  if (includeFinish) {
    await playFinishCue();
    await wait(300);
  }
  await sound.beep({ frequency: 1040, durationMs: 170, gainValue: 0.15, waveform: 'sine' });
  await wait(110);
  await sound.beep({ frequency: 1320, durationMs: 220, gainValue: 0.15, waveform: 'sine' });
}

function formCueToken(session = {}) {
  if (session.awaitingRoundSurvey) {
    return `${session.id}:${String(session.awaitingRoundSurvey).padStart(3, '0')}`;
  }
  if (session.finalSurveyRequired) {
    return `${session.id}:999`;
  }
  return null;
}

async function attemptInstructionAutoplay() {
  const audio = byId('subject-script-audio');
  const status = byId('subject-script-audio-status');
  if (!audio?.getAttribute('src') || instructionAudioStarted) {
    return false;
  }
  try {
    await audio.play();
    instructionAudioStarted = true;
    if (status) status.textContent = 'Recorded instructions are playing.';
    return true;
  } catch (error) {
    if (status) status.textContent = 'Your browser blocked automatic audio. Tap Play once to hear the instructions.';
    return false;
  }
}

function renderPuzzle(asset) {
  const container = byId('subject-puzzle');
  if (!container) return;

  const previewKey = asset
    ? `${asset.assetId || asset.urlPath || asset.originalName}:${asset.displayKind || ''}`
    : 'empty';
  if (container.dataset.previewKey === previewKey) return;
  container.dataset.previewKey = previewKey;
  container.innerHTML = '';
  container.classList.toggle('empty', !asset);

  if (!asset) {
    const empty = document.createElement('p');
    empty.className = 'subject-reference-empty';
    empty.textContent = 'The puzzle diagram will appear when the round starts.';
    container.append(empty);
    return;
  }

  const preview = document.createElement(asset.displayKind === 'pdf' ? 'iframe' : 'img');
  preview.className = asset.displayKind === 'pdf' ? 'subject-reference-pdf' : 'subject-reference-image';
  preview.title = `Puzzle ${asset.originalName || ''}`.trim();
  if (asset.displayKind === 'pdf') {
    preview.src = `${asset.urlPath}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`;
  } else {
    preview.src = asset.urlPath;
    preview.alt = `Puzzle diagram ${asset.originalName || ''}`.trim();
  }
  preview.addEventListener('error', () => {
    container.innerHTML = '';
    container.classList.add('empty');
    const failed = document.createElement('p');
    failed.className = 'subject-reference-empty';
    failed.textContent = 'The puzzle diagram could not be loaded. Please tell the researcher.';
    container.append(failed);
  });
  container.append(preview);
}

function renderTimer() {
  const round = state?.session?.activeRound;
  if (!round || panels['subject-round'].hidden) return;
  const duration = Number(state.session.roundDurationSeconds || 300);
  const elapsed = elapsedSeconds(round);
  const remaining = duration - elapsed;
  byId('subject-timer').textContent = remaining >= 0 ? formatClock(remaining) : `+${formatClock(-remaining)}`;
  byId('subject-timer').dataset.overtime = remaining <= 0 ? 'true' : 'false';
  byId('subject-timer-status').textContent = round.pauseStartedAt ? 'Timer paused' : (remaining <= 0 ? 'Planned time reached' : 'Puzzle timer running');
  const token = `${state.session.id}:${round.index}:${round.startedAt}`;
  if (timerRoundToken !== token) {
    timerRoundToken = token;
    timerMilestones.clear();
    timerMilestones.add('start');
    sound.beep({ frequency: 1100, durationMs: 300, gainValue: 0.16, waveform: 'square' });
  }
  if (elapsed >= Math.floor(duration / 2) && !timerMilestones.has('mid')) {
    timerMilestones.add('mid');
    sound.pattern(2, 260, { frequency: 760, durationMs: 210, gainValue: 0.13, waveform: 'sine' });
  }
  if (elapsed >= duration && !timerMilestones.has('end')) {
    timerMilestones.add('end');
    playFinishCue().catch(() => {});
  }
}

const hintTracker = createUpdateCueTracker({ onCue: () => sound.pattern(2, 90) });
const robotTracker = createUpdateCueTracker({ onCue: () => sound.pattern(3, 90) });
const formTracker = createUpdateCueTracker({
  onCue: (token) => playFormReadyCue({
    includeFinish: !token.endsWith(':999') && !timerMilestones.has('end'),
  }),
});

function render(current) {
  state = current;
  const session = current?.session || {};
  const instructionList = byId('subject-instructions');
  if (instructionList) {
    const instructions = current?.study?.instructions || [];
    const key = JSON.stringify(instructions);
    if (instructionList.dataset.scriptKey !== key) {
      instructionList.dataset.scriptKey = key;
      instructionList.innerHTML = '';
      for (const line of instructions) {
        const item = document.createElement('li');
        item.textContent = line;
        instructionList.append(item);
      }
    }
  }
  const scriptAudio = byId('subject-script-audio');
  const audioBlock = byId('subject-script-audio-block');
  const audioUrl = current?.study?.scriptAudioUrl || '';
  if (scriptAudio && instructionAudioUrl !== audioUrl) {
    instructionAudioUrl = audioUrl;
    instructionAudioStarted = false;
    if (audioUrl) {
      scriptAudio.src = audioUrl;
    } else {
      scriptAudio.removeAttribute('src');
    }
    scriptAudio.load();
  }
  if (audioBlock) {
    audioBlock.hidden = !audioUrl;
  }
  renderPuzzle(session.activeRound?.puzzle?.subjectAsset || null);
  byId('participant-id-label').textContent = session.participantId || 'Participant';
  byId('subject-participant-id').value = session.participantId || '';
  if (!session.participantProfile && session.status === 'setup') {
    showPanel('subject-onboarding');
    attemptInstructionAutoplay().catch(() => {});
  } else if (session.awaitingRoundSurvey) {
    showPanel('subject-round-survey');
    if (surveyRound !== session.awaitingRoundSurvey) {
      surveyRound = session.awaitingRoundSurvey;
      const questions = session.pendingSurvey?.condition === 'control' ? WORKLOAD : [...WORKLOAD, ...INTERVENTION];
      byId('round-survey-label').textContent = `After puzzle ${surveyRound} of ${session.plannedRounds}`;
      byId('round-survey-questions').innerHTML = questions.map(questionMarkup).join('');
      fillScaleRows(byId('round-survey-questions'));
      byId('round-survey-form').reset();
    }
  } else if (session.finalSurveyRequired) {
    showPanel('subject-final-survey');
  } else if (session.betweenSittings) {
    showPanel('subject-break');
  } else if (session.activeRound) {
    showPanel('subject-round');
    byId('subject-round-label').textContent = `Sitting ${session.activeRound.sittingNumber} · Puzzle ${session.activeRound.index} of ${session.plannedRounds}`;
    const hint = String(current?.hint?.text || '').trim();
    byId('subject-hint').textContent = hint || 'No hint right now — continue with the puzzle.';
    byId('subject-updated').textContent = current?.hint?.updatedAt ? `Last updated ${formatTimestamp(current.hint.updatedAt)}` : 'No hint received yet.';
    renderTimer();
  } else if (session.status === 'completed' || session.finalSurveySubmitted) {
    showPanel('subject-complete');
  } else {
    showPanel('subject-waiting');
  }
}

async function armSound() {
  if (await sound.arm()) {
    byId('subject-sound-toggle').textContent = 'Study sounds ready';
    byId('subject-sound-toggle').disabled = true;
    byId('subject-sound-status').textContent = 'Timer and intervention sounds are armed.';
    await reportScreenReady('subject', true);
  }
}

async function init() {
  setConnectionBadge(byId('connection-badge'), 'reconnecting');
  fillScaleRows();
  byId('final-survey-questions').innerHTML = FINAL.map(questionMarkup).join('');
  fillScaleRows(byId('final-survey-questions'));
  state = await fetchJson('/api/state?role=subject');
  byId('subject-consent-copy').textContent = state.study?.consentStatement || '';
  hintTracker.prime(state?.hint?.updatedAt || null);
  robotTracker.prime(state?.robotCueUpdatedAt || null);
  formTracker.prime(formCueToken(state?.session));
  render(state);

  const tryArm = () => {
    if (!sound.isArmed()) armSound().catch(() => {});
    attemptInstructionAutoplay().catch(() => {});
  };
  window.addEventListener('pointerdown', tryArm, { once: true });
  window.addEventListener('keydown', tryArm, { once: true });
  byId('subject-sound-toggle').addEventListener('click', () => {
    armSound().then(() => attemptInstructionAutoplay()).catch(() => {
      byId('subject-sound-status').textContent = 'Sound could not be enabled. Check browser permissions.';
    });
  });
  byId('subject-gender').addEventListener('change', () => { byId('subject-gender-self-field').hidden = byId('subject-gender').value !== 'self-describe'; });

  byId('participant-profile-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/participant/profile', {
        age: Number(byId('subject-age').value), gender: byId('subject-gender').value,
        genderSelfDescribe: byId('subject-gender-self').value, consented: byId('subject-consent').checked,
        instructionsAcknowledged: byId('subject-instructions-check').checked,
        expectedEfficacy: Number(new FormData(event.currentTarget).get('expectedEfficacy')),
      });
      render(await fetchJson('/api/state?role=subject'));
    } catch (error) { byId('participant-profile-status').textContent = error.message; }
  });
  byId('round-survey-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await postJson('/api/surveys/round', { roundIndex: surveyRound, responses: formResponses(event.currentTarget) });
      render(await fetchJson('/api/state?role=subject'));
    } catch (error) { byId('round-survey-status').textContent = error.message; }
  });
  byId('final-survey-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const responses = formResponses(event.currentTarget);
      responses.comment = byId('final-comment').value;
      await postJson('/api/surveys/final', { responses });
      render(await fetchJson('/api/state?role=subject'));
    } catch (error) { byId('final-survey-status').textContent = error.message; }
  });

  connectSocket('subject', {
    onOpen() { setConnectionBadge(byId('connection-badge'), 'connected'); if (sound.isArmed()) reportScreenReady('subject', true); },
    onClose() { setConnectionBadge(byId('connection-badge'), 'reconnecting'); },
    onSnapshot(snapshot) {
      const hint = String(snapshot?.hint?.text || '').trim();
      if (hint) hintTracker.push(snapshot?.hint?.updatedAt || null); else hintTracker.prime(snapshot?.hint?.updatedAt || null);
      robotTracker.push(snapshot?.robotCueUpdatedAt || null);
      formTracker.push(formCueToken(snapshot?.session)).catch(() => {});
      render(snapshot);
    },
  });
  window.setInterval(renderTimer, 250);
}

init().catch(() => { showPanel('subject-waiting'); });
