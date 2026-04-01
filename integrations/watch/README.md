# Watch Integration

This directory contains the provided HRV watch collector script used by the study setup.

## How it connects to the web app

- Run the web server from the repository root.
- Run `watch.py` from the repository root as well.
- The script writes `watch/watch_data.json`.
- The Node server monitors that file automatically and ingests new entries as they appear.

## Important note

`watch.py` depends on external Python packages and BLE hardware access:

- `bleak`
- `numpy`
- `pylsl`

Those dependencies are not required for the web app itself, but they are required if you want live HRV collection from the watch.
