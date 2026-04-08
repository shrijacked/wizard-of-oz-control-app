# Gaze Bridge

This integration provides a concrete bridge process for vendor gaze SDKs. It translates raw device frames into the app's normalized gaze telemetry format and sends them to the local server.

## What it does

- sends bridge heartbeats to `POST /api/bridge/gaze/heartbeat`
- sends normalized gaze frames to `POST /api/bridge/gaze/frame`
- supports two acquisition modes out of the box:
  - `stdin-jsonl`: read raw SDK frames from standard input
  - `file-tail`: tail a local JSONL file produced by another process
  - `heartbeat-only`: keep the bridge alive and visible in the dashboard before frames are flowing

## Quick start

Run the app server first, then start the bridge:

```bash
python3 integrations/gaze/bridge.py \
  --server http://127.0.0.1:3000 \
  --bridge-id tobii-bridge \
  --device-label "Tobii 4C" \
  --transport sdk-http \
  --mode stdin-jsonl
```

Then pipe one JSON object per line into the bridge. Example frame shapes that are accepted:

```json
{"focus": 0.32, "fixationLoss": 0.61, "pupil": 0.54}
```

```json
{"metrics": {"attentionScore": 0.44, "fixation_loss": 0.48, "pupilDilation": 0.41}}
```

## Integrating a real SDK

In your SDK callback, serialize each frame to JSON and write it to stdin or a JSONL file. The bridge already understands several common aliases:

- `attentionScore`, `attention`, `focus`, `focusScore`, `engagement`
- `fixationLoss`, `fixation_loss`, `gazeLoss`, `fixationInstability`
- `pupilDilation`, `pupil`, `pupil_size`, `dilation`

That keeps the SDK-specific code very small while preserving one stable interface at the server.

## Experiment-day launcher

The repository also includes:

```bash
npm run launch:study
```

By default that starts the gaze bridge in `heartbeat-only` mode so the admin dashboard can confirm the bridge is alive before real SDK frames are connected.
