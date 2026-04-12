export function mergeAdminState(previousState, incomingState) {
  if (!previousState) {
    return incomingState;
  }

  if (!incomingState) {
    return previousState;
  }

  if (incomingState.system) {
    return incomingState;
  }

  return {
    ...previousState,
    ...incomingState,
    system: previousState.system,
  };
}
