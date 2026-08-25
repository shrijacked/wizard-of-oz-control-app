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
      return 'Unable to start camera: the camera is already in use by another tab or app. If Pupil Capture is using the C270, switch Capture back to the glasses camera.';
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
      option.textContent = 'No camera found';
      selectElement.append(option);
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

  async function requestCameraStream() {
    const devices = await listDevices();
    populateSelect(devices);
    selectedDeviceId = selectElement?.value || preferredCameraDeviceId(devices, selectedDeviceId);

    try {
      return await mediaDevices.getUserMedia(videoConstraints(selectedDeviceId, Boolean(selectedDeviceId)));
    } catch (error) {
      if (error?.name === 'OverconstrainedError' || error?.name === 'NotFoundError') {
        return mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      throw error;
    }
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
      setStatus('Unable to start camera: camera API is not available in this browser.');
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
    refreshDeviceList,
  };
}
