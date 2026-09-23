'use strict';

const SAMPLE_RATE = 44_100;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function buildWav(tones = []) {
  const normalized = tones.map((tone) => ({
    frequency: Math.max(40, Number(tone.frequency) || 440),
    durationMs: Math.max(20, Number(tone.durationMs) || 100),
    gapMs: Math.max(0, Number(tone.gapMs) || 0),
    gain: Math.max(0.05, Math.min(0.9, Number(tone.gain) || 0.5)),
  }));
  const sampleCounts = normalized.map((tone) => ({
    tone: Math.round((tone.durationMs / 1000) * SAMPLE_RATE),
    gap: Math.round((tone.gapMs / 1000) * SAMPLE_RATE),
  }));
  const totalSamples = sampleCounts.reduce((sum, entry) => sum + entry.tone + entry.gap, 0);
  const dataSize = totalSamples * (BITS_PER_SAMPLE / 8);
  const output = Buffer.alloc(44 + dataSize);

  output.write('RIFF', 0);
  output.writeUInt32LE(36 + dataSize, 4);
  output.write('WAVE', 8);
  output.write('fmt ', 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(CHANNELS, 22);
  output.writeUInt32LE(SAMPLE_RATE, 24);
  output.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), 28);
  output.writeUInt16LE(CHANNELS * (BITS_PER_SAMPLE / 8), 32);
  output.writeUInt16LE(BITS_PER_SAMPLE, 34);
  output.write('data', 36);
  output.writeUInt32LE(dataSize, 40);

  let cursor = 44;
  normalized.forEach((tone, index) => {
    const { tone: toneSamples, gap: gapSamples } = sampleCounts[index];
    const fadeSamples = Math.min(Math.round(SAMPLE_RATE * 0.012), Math.floor(toneSamples / 4));
    for (let sampleIndex = 0; sampleIndex < toneSamples; sampleIndex += 1) {
      const seconds = sampleIndex / SAMPLE_RATE;
      const attack = fadeSamples ? Math.min(1, sampleIndex / fadeSamples) : 1;
      const release = fadeSamples ? Math.min(1, (toneSamples - sampleIndex - 1) / fadeSamples) : 1;
      const envelope = Math.max(0, Math.min(attack, release));
      const fundamental = Math.sin(2 * Math.PI * tone.frequency * seconds);
      const harmonic = Math.sin(2 * Math.PI * tone.frequency * 2 * seconds) * 0.18;
      const value = Math.max(-1, Math.min(1, (fundamental + harmonic) * tone.gain * envelope));
      output.writeInt16LE(Math.round(value * 32767), cursor);
      cursor += 2;
    }
    cursor += gapSamples * 2;
  });

  return output;
}

const DEFAULT_STUDY_SOUNDS = Object.freeze({
  robotCue: Object.freeze({
    fileName: 'default-robot-cue.wav',
    label: 'Built-in robot movement cue',
    buffer: buildWav([
      { frequency: 740, durationMs: 100, gapMs: 70, gain: 0.55 },
      { frequency: 980, durationMs: 120, gapMs: 70, gain: 0.6 },
      { frequency: 1240, durationMs: 190, gain: 0.65 },
    ]),
  }),
  puzzleFinish: Object.freeze({
    fileName: 'default-puzzle-finished.wav',
    label: 'Built-in definitive puzzle-finished cue',
    buffer: buildWav([
      { frequency: 880, durationMs: 150, gapMs: 90, gain: 0.62 },
      { frequency: 660, durationMs: 210, gapMs: 100, gain: 0.66 },
      { frequency: 440, durationMs: 700, gain: 0.72 },
    ]),
  }),
});

module.exports = {
  DEFAULT_STUDY_SOUNDS,
  buildWav,
};
