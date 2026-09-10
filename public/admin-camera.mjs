const STORAGE_KEY = 'woz.camera.deviceId';

export function preferredCameraDeviceId(devices = [], storedId = null) {
  const cameras = devices.filter((device) => device.kind === 'videoinput' && device.deviceId);
  if (storedId && cameras.some((device) => device.deviceId === storedId)) {
    return storedId;
  }

  const named = cameras.find((device) => /c270|logitech/i.test(String(device.label || '')));
  return named?.deviceId || cameras[0]?.deviceId || null;
}

export function createCameraController({
  videoElement,
  statusElement,
  selectElement,
  mediaDevices,
  storage = (typeof window !== 'undefined' ? window.localStorage : null),
  secureContext = (typeof window !== 'undefined' ? window.isSecureContext : true),
  hostname = (typeof window !== 'undefined' ? window.location.hostname : ''),
  onStatusChange,
} = {}) {
  let mediaStream = null;
  let selectedDeviceId = storage?.getItem(STORAGE_KEY) || null;
  let live = false;
  let deviceLabel = '';

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function reportStatus() {
    onStatusChange?.({
      live,
      deviceId: selectedDeviceId,
      deviceLabel,
    });
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

  function populateSelect(devices) {
    if (!selectElement) {
      return;
    }

    const cameras = devices.filter((device) => device.kind === 'videoinput' && device.deviceId);
    selectElement.innerHTML = '';
    if (!cameras.length) {
      const option = document.createElement('option');
      // An option without an explicit value inherits its label. That previously
      // made "No camera found" look like a real device id and prevented the
      // initial permission request that reveals camera labels on Safari/Chrome.
      option.value = '';
      option.textContent = 'Default camera (allow access first)';
      selectElement.append(option);
      selectedDeviceId = null;
      return;
    }

    cameras.forEach((device) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${device.deviceId.slice(0, 8)}`;
      selectElement.append(option);
    });

    selectedDeviceId = preferredCameraDeviceId(cameras, selectedDeviceId);
    selectElement.value = selectedDeviceId || cameras[0].deviceId;
    selectedDeviceId = selectElement.value;
  }

  async function listDevices() {
    if (!mediaDevices?.enumerateDevices) {
      return [];
    }

    return mediaDevices.enumerateDevices();
  }

  function videoConstraints(deviceId, exact = true) {
    const video = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
    if (deviceId) {
      video.deviceId = exact ? { exact: deviceId } : { ideal: deviceId };
    }
    return { video, audio: false };
  }

  function openedDeviceId(stream) {
    const track = stream.getVideoTracks?.()[0];
    return track?.getSettings?.()?.deviceId || '';
  }

  async function openCamera(requestedDeviceId) {
    const attempts = requestedDeviceId
      ? [
        videoConstraints(requestedDeviceId, true),
        { video: { deviceId: { exact: requestedDeviceId } }, audio: false },
      ]
      : [
        videoConstraints(null, false),
        { video: true, audio: false },
      ];

    let lastError = null;
    for (const constraints of attempts) {
      try {
        return await mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
        const retryable = error?.name === 'OverconstrainedError' || error?.name === 'NotFoundError';
        if (!retryable) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async function requestCameraStream() {
    const devices = await listDevices();
    populateSelect(devices);
    selectedDeviceId = selectElement?.value || preferredCameraDeviceId(devices, selectedDeviceId) || null;
    const requestedDeviceId = selectedDeviceId;
    const stream = await openCamera(requestedDeviceId);
    const actualDeviceId = openedDeviceId(stream);
    if (requestedDeviceId && actualDeviceId && actualDeviceId !== requestedDeviceId) {
      stream.getTracks?.().forEach((track) => track.stop());
      const error = new Error('the selected camera could not be opened. Another camera was not substituted.');
      error.name = 'NotFoundError';
      throw error;
    }
    return stream;
  }

  async function refreshDeviceList() {
    const devices = await listDevices();
    populateSelect(devices);
    return devices;
  }

  async function start() {
    if (!videoElement || !statusElement) {
      return;
    }

    if (!mediaDevices?.getUserMedia) {
      const localHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      setStatus(!secureContext && !localHost
        ? 'Unable to start camera: browsers block camera access on a non-secure network address. Open the Admin page on this Mac at http://localhost:3000/admin.'
        : 'Unable to start camera: camera API is not available in this browser.');
      live = false;
      reportStatus();
      return;
    }

    try {
      stop(true);
      setStatus('Requesting camera access...');
      mediaStream = await requestCameraStream();
      videoElement.srcObject = mediaStream;
      videoElement.muted = true;
      videoElement.playsInline = true;
      if (typeof videoElement.play === 'function') {
        await videoElement.play();
      }

      const track = mediaStream.getVideoTracks?.()[0];
      const settings = track?.getSettings?.() || {};
      selectedDeviceId = settings.deviceId || selectedDeviceId;
      deviceLabel = track?.label || deviceLabel;
      if (selectedDeviceId && storage) {
        storage.setItem(STORAGE_KEY, selectedDeviceId);
      }
      await refreshDeviceList();
      live = true;
      setStatus(deviceLabel ? `Live: ${deviceLabel}` : 'Live webcam preview active.');
      reportStatus();
    } catch (error) {
      live = false;
      deviceLabel = '';
      setStatus(cameraErrorMessage(error));
      reportStatus();
    }
  }

  function stop(silent = false) {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
    live = false;
    if (!silent && statusElement) {
      setStatus('Camera is off.');
    }
    if (!silent) {
      reportStatus();
    }
  }

  function getStatus() {
    return {
      live,
      deviceId: selectedDeviceId,
      deviceLabel,
    };
  }

  function getStream() {
    return live ? mediaStream : null;
  }

  selectElement?.addEventListener('change', () => {
    selectedDeviceId = selectElement.value;
    if (storage && selectedDeviceId) {
      storage.setItem(STORAGE_KEY, selectedDeviceId);
    }
  });

  return {
    start,
    stop,
    getStatus,
    getStream,
    refreshDeviceList,
  };
}
