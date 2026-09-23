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
  const createAudio = options.createAudio
    || (typeof globalThis.Audio === 'function' ? (url) => new globalThis.Audio(url) : null);
  const frequency = Number.isFinite(options.frequency) ? options.frequency : DEFAULT_FREQUENCY;
  const durationMs = Number.isFinite(options.durationMs) ? options.durationMs : DEFAULT_DURATION_MS;
  const gainValue = Number.isFinite(options.gainValue) ? options.gainValue : DEFAULT_GAIN;
  const waveform = String(options.waveform || DEFAULT_WAVEFORM);

  let context = null;
  let armed = false;
  let activeRecording = null;

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

    async beep(cueOptions = {}) {
      if (!armed) {
        return false;
      }

      const audioContext = await ensureContext();
      if (!audioContext?.createOscillator || !audioContext?.createGain) {
        return false;
      }

      const startAt = Number.isFinite(audioContext.currentTime) ? audioContext.currentTime : 0;
      const cueFrequency = Number.isFinite(cueOptions.frequency) ? cueOptions.frequency : frequency;
      const cueDurationMs = Number.isFinite(cueOptions.durationMs) ? cueOptions.durationMs : durationMs;
      const cueGainValue = Number.isFinite(cueOptions.gainValue) ? cueOptions.gainValue : gainValue;
      const cueWaveform = String(cueOptions.waveform || waveform);
      const attackAt = startAt + 0.01;
      const endAt = startAt + (cueDurationMs / 1000);
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = cueWaveform;
      oscillator.frequency.value = cueFrequency;

      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(cueGainValue, attackAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt);
      return true;
    },

    async pattern(count = 2, gapMs = 140, cueOptions = {}) {
      if (!armed) {
        return false;
      }
      const total = Math.max(1, Math.min(6, Math.floor(Number(count) || 1)));
      for (let index = 0; index < total; index += 1) {
        await this.beep(cueOptions);
        if (index < total - 1) {
          await new Promise((resolve) => setTimeout(resolve, gapMs));
        }
      }
      return true;
    },

    async playRecording(url, recordingOptions = {}) {
      if (!armed || !createAudio || !url) {
        return false;
      }

      try {
        if (activeRecording?.pause) {
          activeRecording.pause();
        }
        const audio = createAudio(url);
        activeRecording = audio;
        audio.preload = 'auto';
        audio.volume = Math.max(0, Math.min(1, Number(recordingOptions.volume ?? 1)));
        audio.currentTime = 0;

        let completion = null;
        if (recordingOptions.waitForEnd && typeof audio.addEventListener === 'function') {
          completion = new Promise((resolve) => {
            const finish = (played) => {
              audio.removeEventListener?.('ended', onEnded);
              audio.removeEventListener?.('error', onError);
              resolve(played);
            };
            const onEnded = () => finish(true);
            const onError = () => finish(false);
            audio.addEventListener('ended', onEnded, { once: true });
            audio.addEventListener('error', onError, { once: true });
          });
        }

        await audio.play();
        return completion ? completion : true;
      } catch {
        return false;
      }
    },
  };
}
