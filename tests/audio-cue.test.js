'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadAudioCueModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'public', 'audio-cue.mjs'));
  return import(`${moduleUrl.href}?cacheBust=${Date.now()}`);
}

function createFakeAudioContext() {
  const events = [];
  const context = {
    state: 'suspended',
    currentTime: 4,
    destination: { label: 'speaker' },
    async resume() {
      events.push({ type: 'resume' });
      this.state = 'running';
    },
    createOscillator() {
      const oscillator = {
        type: null,
        frequency: { value: 0 },
        connect(target) {
          events.push({ type: 'oscillator.connect', target });
        },
        start(time) {
          events.push({
            type: 'oscillator.start',
            time,
            frequency: oscillator.frequency.value,
            waveform: oscillator.type,
          });
        },
        stop(time) {
          events.push({ type: 'oscillator.stop', time });
        },
      };
      return oscillator;
    },
    createGain() {
      return {
        connect(target) {
          events.push({ type: 'gain.connect', target });
        },
        gain: {
          setValueAtTime(value, time) {
            events.push({ type: 'gain.set', value, time });
          },
          linearRampToValueAtTime(value, time) {
            events.push({ type: 'gain.linear', value, time });
          },
          exponentialRampToValueAtTime(value, time) {
            events.push({ type: 'gain.exponential', value, time });
          },
        },
      };
    },
  };

  return {
    context,
    events,
  };
}

test('audio cue controller does not beep before the screen is armed', async () => {
  const { createAudioCueController } = await loadAudioCueModule();
  const fake = createFakeAudioContext();
  const controller = createAudioCueController({
    createContext: () => fake.context,
  });

  assert.equal(await controller.beep(), false);
  assert.deepEqual(fake.events, []);
});

test('audio cue controller resumes audio and schedules an oscillator beep after arming', async () => {
  const { createAudioCueController } = await loadAudioCueModule();
  const fake = createFakeAudioContext();
  const controller = createAudioCueController({
    createContext: () => fake.context,
    frequency: 880,
    durationMs: 180,
    gainValue: 0.05,
  });

  assert.equal(await controller.arm(), true);
  assert.equal(await controller.beep(), true);

  assert.equal(fake.events[0].type, 'resume');
  assert.ok(fake.events.some((entry) => entry.type === 'oscillator.start'));
  assert.ok(fake.events.some((entry) => entry.type === 'oscillator.stop'));
  assert.ok(fake.events.some((entry) => entry.type === 'gain.linear'));
  assert.ok(fake.events.some((entry) => entry.type === 'gain.exponential'));
});

test('audio cue controller accepts a distinct per-cue finish sound', async () => {
  const { createAudioCueController } = await loadAudioCueModule();
  const fake = createFakeAudioContext();
  const controller = createAudioCueController({ createContext: () => fake.context });

  await controller.arm();
  await controller.beep({ frequency: 480, durationMs: 360, waveform: 'triangle' });

  const start = fake.events.find((entry) => entry.type === 'oscillator.start');
  const stop = fake.events.find((entry) => entry.type === 'oscillator.stop');
  assert.equal(start.frequency, 480);
  assert.equal(start.waveform, 'triangle');
  assert.equal(stop.time, 4.36);
});

test('audio cue controller plays a backend recording after the screen is armed', async () => {
  const { createAudioCueController } = await loadAudioCueModule();
  const fake = createFakeAudioContext();
  const events = [];
  const controller = createAudioCueController({
    createContext: () => fake.context,
    createAudio(url) {
      const listeners = new Map();
      return {
        currentTime: null,
        preload: '',
        volume: 0,
        addEventListener(name, listener) { listeners.set(name, listener); },
        removeEventListener(name) { listeners.delete(name); },
        pause() { events.push({ type: 'pause', url }); },
        async play() {
          events.push({ type: 'play', url, volume: this.volume });
          listeners.get('ended')?.();
        },
      };
    },
  });

  assert.equal(await controller.playRecording('/sound.wav'), false);
  await controller.arm();
  assert.equal(await controller.playRecording('/sound.wav', { volume: 0.9, waitForEnd: true }), true);
  assert.deepEqual(events, [{ type: 'play', url: '/sound.wav', volume: 0.9 }]);
});
