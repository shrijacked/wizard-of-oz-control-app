export function createCameraController({ videoElement, statusElement, mediaDevices } = {}) {
  let mediaStream = null;
  const preferredConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  async function requestCameraStream() {
    try {
      return await mediaDevices.getUserMedia(preferredConstraints);
    } catch (error) {
      if (error?.name !== 'OverconstrainedError') {
        throw error;
      }

      return mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
    }
  }

  function cameraErrorMessage(error) {
    if (error?.name === 'NotAllowedError') {
      return 'Unable to start camera: camera permission was denied. Allow access in the browser address bar and try again.';
    }

    if (error?.name === 'NotFoundError') {
      return 'Unable to start camera: no camera was found on this device.';
    }

    if (error?.name === 'NotReadableError') {
      return 'Unable to start camera: the camera is already in use by another tab or app.';
    }

    return `Unable to start camera: ${error.message}`;
  }

  async function start() {
    if (!videoElement || !statusElement) {
      return;
    }

    if (!mediaDevices?.getUserMedia) {
      setStatus('Unable to start camera: camera API is not available in this browser.');
      return;
    }

    try {
      stop();
      setStatus('Requesting camera access...');
      mediaStream = await requestCameraStream();
      videoElement.srcObject = mediaStream;
      videoElement.muted = true;
      videoElement.playsInline = true;
      if (typeof videoElement.play === 'function') {
        await videoElement.play();
      }
      setStatus('Live webcam preview active.');
    } catch (error) {
      setStatus(cameraErrorMessage(error));
    }
  }

  function stop() {
    if (!videoElement || !statusElement) {
      return;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    videoElement.srcObject = null;
    setStatus('Camera is off.');
  }

  return {
    start,
    stop,
  };
}
