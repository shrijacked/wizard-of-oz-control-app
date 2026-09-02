# Watch Integration

This directory contains the Maxim H Band HRV collector used by the study setup. The BLE name it matches is `hBand`.

## How it connects to the web app

- Run the web server from the repository root (`npm run launch:study` starts this script).
- Run `watch.py` from the repository root as well.
- The script writes `watch/watch_data.json`.
- The Node server monitors that file automatically and ingests new entries as they appear.
- A live heart-rate sample is written as soon as BLE connects, including during the 60s baseline, so the sitting gate can pass. Stress/RMSSD still wait for baseline; the dashboard may show `Watch live — calibrating`.

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
