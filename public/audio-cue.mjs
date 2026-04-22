const DEFAULT_FREQUENCY = 880;
const DEFAULT_DURATION_MS = 180;
const DEFAULT_GAIN = 0.045;
const DEFAULT_WAVEFORM = 'sine';

function getDefaultContextFactory() {
  const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
  return AudioContextCtor ? () => new AudioContextCtor() : null;
}

export function createAudioCueController(options = {}) {
  const createContext = options.createContext || getDefaultContextFactory();
  const frequency = Number.isFinite(options.frequency) ? options.frequency : DEFAULT_FREQUENCY;
  const durationMs = Number.isFinite(options.durationMs) ? options.durationMs : DEFAULT_DURATION_MS;
  const gainValue = Number.isFinite(options.gainValue) ? options.gainValue : DEFAULT_GAIN;
  const waveform = String(options.waveform || DEFAULT_WAVEFORM);

  let context = null;
  let armed = false;

  async function ensureContext() {
    if (!createContext) {
      return null;
    }

    if (!context) {
      context = createContext();
    }

    if (context?.state === 'suspended' && typeof context.resume === 'function') {
      await context.resume();
    }

    return context;
  }

  return {
    async arm() {
      const audioContext = await ensureContext();
      armed = Boolean(audioContext);
      return armed;
    },

    isArmed() {
      return armed;
    },

    async beep() {
      if (!armed) {
        return false;
      }

      const audioContext = await ensureContext();
      if (!audioContext?.createOscillator || !audioContext?.createGain) {
        return false;
      }

      const startAt = Number.isFinite(audioContext.currentTime) ? audioContext.currentTime : 0;
      const attackAt = startAt + 0.01;
      const endAt = startAt + (durationMs / 1000);
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = waveform;
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(gainValue, attackAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt);
      return true;
    },
  };
}
