export function canUseWebmRecorder(MediaRecorderCtor = globalThis.MediaRecorder) {
  return Boolean(MediaRecorderCtor?.isTypeSupported?.('video/webm'));
}

export function createCameraRecorder({
  MediaRecorder: MediaRecorderCtor = globalThis.MediaRecorder,
  createRecording,
  uploadChunk,
  finalizeRecording,
  onStatus,
} = {}) {
  let recorder = null;
  let recordingId = null;
  let finalizeToken = null;
  let filename = '';
  let startedAt = null;
  let chunkQueue = Promise.resolve();
  let nextIndex = 0;
  let active = false;
  let failureStopScheduled = false;

  function setStatus(message) {
    onStatus?.(message);
  }

  function enqueueChunk(blob) {
    if (!blob || !blob.size || !recordingId) {
      return;
    }

    const index = nextIndex;
    nextIndex += 1;
    chunkQueue = chunkQueue.then(async () => {
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await uploadChunk(recordingId, index, blob);
          return;
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    }).catch((error) => {
      setStatus(error?.message || 'Recording upload failed.');
      // Do not await stop() from inside chunkQueue: stop() itself waits for
      // chunkQueue, which would deadlock the finish-study controls.
      if (!failureStopScheduled) {
        failureStopScheduled = true;
        globalThis.setTimeout(() => {
          stop({ partial: true, silent: true })
            .catch((stopError) => setStatus(stopError?.message || 'Unable to finalize the partial recording.'))
            .finally(() => { failureStopScheduled = false; });
        }, 0);
      }
    });
  }

  async function start(stream) {
    if (!stream) {
      throw new Error('Camera must be live before recording.');
    }
    if (!canUseWebmRecorder(MediaRecorderCtor)) {
      throw new Error('Recording needs Chrome WebM on this laptop.');
    }
    if (active) {
      throw new Error('A recording is already in progress.');
    }

    const created = await createRecording();
    recordingId = created.recordingId;
    finalizeToken = created.finalizeToken;
    filename = created.filename || '';
    startedAt = Date.now();
    nextIndex = 0;
    active = true;
    failureStopScheduled = false;
    recorder = new MediaRecorderCtor(stream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: 2_500_000,
    });
    recorder.addEventListener('dataavailable', (event) => {
      enqueueChunk(event.data);
    });
    recorder.start(2000);
    setStatus(`Recording 00:00 · ${filename}`);
  }

  async function stop({ partial = false, silent = false } = {}) {
    if (!active && !recordingId) {
      return;
    }

    active = false;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise((resolve) => {
        recorder.addEventListener('stop', resolve, { once: true });
        recorder.stop();
      });
    }
    recorder = null;
    await chunkQueue;
    if (recordingId) {
      await finalizeRecording(recordingId, { token: finalizeToken, partial });
      if (!silent) {
        setStatus(`${partial ? 'Partial' : 'Saved'} ${filename}`);
      }
    }
    recordingId = null;
    finalizeToken = null;
    filename = '';
    startedAt = null;
  }

  function flush() {
    if (recorder && recorder.state === 'recording' && typeof recorder.requestData === 'function') {
      recorder.requestData();
    }
  }

  function getActive() {
    return {
      recordingId,
      finalizeToken,
      filename,
      startedAt,
      active,
    };
  }

  return {
    start,
    stop,
    flush,
    getActive,
  };
}
