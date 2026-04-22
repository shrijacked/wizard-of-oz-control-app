function normalizeCueToken(value) {
  const normalized = String(value || '').trim();
  return normalized || null;
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
