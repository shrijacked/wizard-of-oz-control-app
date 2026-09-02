function normalizeCueToken(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

export function remainingDelayMs(token, delayMs, now = Date.now()) {
  const cueAt = Date.parse(token);
  if (!Number.isFinite(cueAt)) {
    return delayMs;
  }

  return delayMs - (now - cueAt);
}

export function createDelayedCueScheduler({
  delayMs = 10_000,
  onCue,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  let timer = null;
  let scheduledToken = null;

  return {
    schedule(token, delayMsOverride) {
      const next = normalizeCueToken(token);
      if (!next || next === scheduledToken) {
        return false;
      }

      if (timer) {
        clearTimer(timer);
        timer = null;
      }

      scheduledToken = next;
      const waitMs = Number.isFinite(delayMsOverride) ? delayMsOverride : delayMs;
      timer = setTimer(async () => {
        timer = null;
        scheduledToken = null;
        await onCue?.(next);
      }, waitMs);
      return true;
    },

    cancel() {
      if (timer) {
        clearTimer(timer);
      }
      timer = null;
      scheduledToken = null;
    },
  };
}

export function createUpdateCueTracker({ onCue } = {}) {
  let lastSeen = null;

  return {
    prime(token) {
      lastSeen = normalizeCueToken(token);
      return lastSeen;
    },

    async push(token) {
      const next = normalizeCueToken(token);
      if (!next) {
        return false;
      }

      if (lastSeen && next <= lastSeen) {
        return false;
      }

      lastSeen = next;
      await onCue?.(next);
      return true;
    },

    getLastSeen() {
      return lastSeen;
    },
  };
}
