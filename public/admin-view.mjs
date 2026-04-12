export function describeGuardBanner({ pinRequired, authenticated, sessionStatus } = {}) {
  const status = sessionStatus || 'setup';

  if (!pinRequired) {
    if (status === 'completed') {
      return {
        tone: 'neutral',
        message: 'No local admin PIN is configured on this host. The session is completed, so the remaining controls stay read-only until reset.',
      };
    }

    return {
      tone: 'neutral',
      message: 'No local admin PIN is configured on this host. Setup details and allowed controls are ready on this browser.',
    };
  }

  if (!authenticated) {
    return {
      tone: 'warning',
      message: 'Controls are locked on this browser. Enter the local admin PIN in Safeguards below to edit setup details and use protected actions.',
    };
  }

  if (status === 'completed') {
    return {
      tone: 'success',
      message: 'Controls are unlocked on this browser. This session is completed, so only reset and export review actions remain available.',
    };
  }

  if (status === 'running') {
    return {
      tone: 'success',
      message: 'Controls are unlocked on this browser. The trial is live and intervention controls are available.',
    };
  }

  return {
    tone: 'success',
    message: 'Controls are unlocked on this browser. You can edit setup details and save the before-participant checklist.',
  };
}
