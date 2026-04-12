export function bindCameraControls({ startButton, stopButton, onStart, onStop } = {}) {
  startButton?.addEventListener('click', onStart);
  stopButton?.addEventListener('click', onStop);
}
