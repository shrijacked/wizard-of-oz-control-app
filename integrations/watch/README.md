# Watch Integration

This directory contains the Maxim H Band HRV collector used by the study setup. The BLE name it matches is `hBand`.

## How it connects to the web app

- Run the web server from the repository root (`npm run launch:study` starts this script).
- Run `watch.py` from the repository root as well.
- The script writes `watch/watch_data.json`.
- The Node server monitors that file automatically and ingests new entries as they appear.
- A live heart-rate sample is written as soon as BLE connects, including during the 60s baseline, so the sitting gate can pass. The dashboard may show `Watch live — calibrating` while the reference is built.
- The live app flags **possible arousal** when the median heart rate over the latest 15 seconds is at least 5 bpm above the preceding 60-second rolling reference (or the calibrated baseline while a rolling reference builds). This is an admin cue, not a stress classification, and it cannot automatically trigger a robot intervention.
- Heart-rate and RR/HRV quality are shown separately. Poor contact suppresses the arousal flag; noisy RR data is labelled unreliable instead of being interpreted.
- Every BLE notification is appended locally to `watch/raw/watch_raw_*.jsonl`. The app also saves it with participant, session, sitting, round, and condition context at `data/export/<session-id>.watch.jsonl`.

The live thresholds can be adjusted before launch if a later validated protocol requires it:

```bash
WATCH_AROUSAL_HR_RISE_BPM=5 WATCH_AROUSAL_CURRENT_SECONDS=15 WATCH_AROUSAL_REFERENCE_SECONDS=60 npm run launch:study
```

Keep the default 5 bpm threshold for pilot use unless your labelled validation data supports a change.

## Python packages

Required for BLE collection:

- `bleak`
- `numpy`

Optional:

- `pylsl` — if it is missing, JSON output still feeds the app

macOS needs Bluetooth permission for the terminal or app that launches Python.

```bash
python3 -m pip install bleak numpy
```

## Qualify and calibrate the watch separately

Do this before changing the live study thresholds. The standalone setup tool
does **not** start the web app and does not write `watch/watch_data.json`.

First, stop the study launcher so it releases the watch, then list nearby BLE
devices:

```bash
npm run watch:setup -- scan
```

Run a short device-quality check while wearing the band snugly and keeping the
wrist still:

```bash
npm run watch:setup -- check
```

If more than one device matches `hBand`, copy the identifier printed by `scan`
and put the global option before the command:

```bash
npm run watch:setup -- --device-id "THE-PRINTED-ID" check
```

After the check reports RR data and plausible intervals, record a pilot
calibration. The defaults are a 5-minute quiet baseline, a 3-minute
representative tangram task, and a 2-minute quiet recovery:

```bash
npm run watch:setup -- calibrate --participant-id pilot-01
```

The tool prompts before each stage and saves all raw BLE packets (including the
original hex), a quality report, and a candidate profile under
`watch/calibration-runs/`. The candidate model detects physiological deviation
from that participant's baseline; it is not a medical or psychological
diagnosis of stress. The live app intentionally does not consume the candidate
HRV profile. It uses the conservative rolling heart-rate advisory described
above while retaining all raw data for later analysis.

`BLE transport gate: PASS` means the connection supplied enough packets, RR
data, and contact information. The separate `HRV signal-quality gate` checks
whether beat-to-beat intervals are consistent enough for thresholding. Neither
alone means that the candidate thresholds distinguish task strain from rest;
also check `Ready for live threshold integration`. The report includes task vs.
baseline separation and a `threshold_sweep` showing the baseline false-positive
rate and task-detection rate for each cutoff. Do not lower a threshold only to
make detections appear; require an acceptable false-positive rate and a
separately labelled/self-reported task response.

An existing capture can be checked again without reconnecting the band:

```bash
npm run watch:setup -- analyze watch/calibration-runs/CAPTURE.jsonl
```

### Mild challenge validation run

Only use this under the study's approved consent/ethics protocol. The
participant can stop at any time. This mode records a quiet baseline, an easy
tangram, a difficult time-pressured tangram, a quiet period between tasks, and
final recovery. It prompts for 0-10 participant stress and difficulty ratings
and stores those labels in the raw JSONL:

```bash
npm run watch:setup -- stress-test --participant-id pilot-stress-01 --challenge-order low-high
```

When time is limited, use the approximately 9-minute mode (1-minute enforced
settling period, 2-minute baseline, two 90-second tasks, 1-minute between-task
recovery, and 2-minute final recovery):

```bash
npm run watch:setup -- stress-test --quick --participant-id pilot-stress-quick-01
```

The quick mode can show whether the low/high conditions separate, but the
report marks its threshold profile as provisional. Use a full 5-minute
baseline before deploying final thresholds.

Across pilots, alternate `--challenge-order low-high` and
`--challenge-order high-low` to expose order effects. Use an easy/familiar
puzzle without a countdown for the low-pressure phase. Use a difficult,
unfamiliar puzzle with the normal visible countdown for the high-challenge
phase. Keep researcher wording neutral and standardized; do not use deception,
threats, humiliation, pain, or false performance feedback. The defaults total
19 minutes: 5-minute baseline, two 3-minute tasks, 3-minute between-task
recovery, and 5-minute final recovery.
