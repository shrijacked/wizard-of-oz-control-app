# Gaze Bridge

The study sitting uses **Pupil Labs Pupil Core**. Capture’s Network API is ZMQ on port `50020`. Heartbeats are not enough: the start gate needs a recent gaze **frame**.

## Pupil Core (default)

1. Start Pupil Capture and put on the Core headset.
2. Confirm the Network API is enabled.
3. Keep Capture on the **glasses** world camera. Do not let it grab the Logitech C270.
4. Start the app with `npm run launch:study`, or run the bridge directly:

```bash
python3 integrations/gaze/pupil_core_bridge.py \
  --server http://127.0.0.1:3000 \
  --host 127.0.0.1 \
  --port 50020
```

The bridge:

- REQ `SUB_PORT` from Capture
- subscribes to `gaze` and `pupil`
- maps `confidence` → `attentionScore`, `1 - confidence` → `fixationLoss`, pupil diameter → `pupilDilation`
- POSTs heartbeats to `/api/bridge/gaze/heartbeat` and frames to `/api/bridge/gaze/frame`

Needs `pyzmq` and `msgpack`:

```bash
python3 -m pip install pyzmq msgpack
```

Calibration stays in Pupil Capture. This app only needs a live gaze stream.

## Generic SDK bridge (rehearsal fallback)

[`bridge.py`](bridge.py) still exists for stdin/file-tail/heartbeat-only rehearsal:

```bash
python3 integrations/gaze/bridge.py \
  --server http://127.0.0.1:3000 \
  --bridge-id tobii-bridge \
  --device-label "Tobii 4C" \
  --transport sdk-http \
  --mode stdin-jsonl
```

`heartbeat-only` mode will **not** clear the sitting start gate.

## Experiment-day launcher

```bash
npm run launch:study
```

By default that starts [`pupil_core_bridge.py`](pupil_core_bridge.py). Override with `GAZE_MODE=file-tail` only when you are not using Capture.
