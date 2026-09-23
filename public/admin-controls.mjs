export function bindCameraControls({ startButton, stopButton, onStart, onStop } = {}) {
  startButton?.addEventListener('click', onStart);
  stopButton?.addEventListener('click', onStop);
}

export function shouldShowCameraControls(sessionStatus) {
  return sessionStatus === 'setup' || sessionStatus === 'running' || sessionStatus === 'completed';
}

export function latestDownloadableRecording(recordings = []) {
  return [...recordings]
    .reverse()
    .find((entry) => entry.status === 'saved' || entry.status === 'partial') || null;
}

export function recordingsToDownloadAfterSitting(recordings = []) {
  return recordings.filter((entry) => entry.status === 'saved' || entry.status === 'partial');
}

export function shouldAutoStartSittingRecording({
  cameraLive = false,
  recorderActive = false,
  autoRecordEnabled = false,
} = {}) {
  return Boolean(autoRecordEnabled) && Boolean(cameraLive) && !recorderActive;
}
