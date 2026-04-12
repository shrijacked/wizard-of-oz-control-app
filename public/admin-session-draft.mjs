const normalizeScopeKey = (value) => String(value || '');

export function createSessionDraftController(fields = []) {
  const trackedFields = new Set(fields);
  const dirtyValues = new Map();
  let currentScopeKey = '';

  function resolve(scopeKey, serverValues = {}) {
    const nextScopeKey = normalizeScopeKey(scopeKey);
    if (nextScopeKey !== currentScopeKey) {
      currentScopeKey = nextScopeKey;
      dirtyValues.clear();
    }

    const resolved = {
      ...serverValues,
    };

    for (const field of trackedFields) {
      if (!dirtyValues.has(field)) {
        continue;
      }

      const dirtyValue = dirtyValues.get(field);
      if ((serverValues[field] ?? '') === dirtyValue) {
        dirtyValues.delete(field);
        continue;
      }

      resolved[field] = dirtyValue;
    }

    return resolved;
  }

  function noteChange(field, value) {
    if (!trackedFields.has(field)) {
      return;
    }

    dirtyValues.set(field, value ?? '');
  }

  function discard(scopeKey = currentScopeKey) {
    currentScopeKey = normalizeScopeKey(scopeKey);
    dirtyValues.clear();
  }

  function isDirty(field) {
    if (field) {
      return dirtyValues.has(field);
    }

    return dirtyValues.size > 0;
  }

  return {
    discard,
    isDirty,
    noteChange,
    resolve,
  };
}
