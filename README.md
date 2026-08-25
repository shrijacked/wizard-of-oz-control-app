# Wizard of Oz Control Application

Local-first control software for a three-screen Wizard of Oz puzzle study.

One sitting is one session with three queued puzzles. Each participant does three sittings.

- `/admin` for the dashboard operator
- `/subject` for the participant (written hint + beep only)
- `/robot` for the robot operator (piece + slot cue + beep only)

The host machine serves all three screens over the local network and keeps them synchronized with WebSockets and file-backed logging.

## What the app does

- shows a live Logitech C270 preview on the operator dashboard, with a camera picker
- seeds puzzle pairs from `tangram puzzles/` (`1.pdf`+`1s.pdf` through `9.pdf`+`9s.pdf`)
- auto-queues sitting 1 as puzzles 1–3, sitting 2 as 4–6, and sitting 3 as 7–9 when the operator saves the sitting number
- sends text hints from the dashboard to the subject screen
- sends robot cues as **piece + numbered slot** to the robot screen
- plays a short alert beep on the subject screen when a new hint arrives
- plays a short alert beep on the robot screen when a new robot cue arrives
- blocks **Begin sitting** until the C270, Maxim H Band, Pupil Core gaze frames, both display screens, and the sitting queue are live
- tracks sitting and round lifecycle with start, complete, reset, and elapsed time
- shows live HRV and Pupil gaze metrics on the operator dashboard
- exports a concise session JSON with sitting metadata, per-round durations, and ordered interventions
- keeps CSV timeline output available as a secondary export

## Puzzle file pairing

The study folder is the source of truth. Pairing uses the `s` suffix convention:

- `1.pdf` pairs with `1s.pdf`
- sitting 1 queues `1`, `2`, `3`
- sitting 2 queues `4`, `5`, `6`
- sitting 3 queues `7`, `8`, `9`

Manual upload remains a fallback for a missing or replaced file. Only complete pairs become selectable sets.

## Robot cues

Edit [`config/study.json`](config/study.json) to change piece names, slot count, planned rounds, and hint presets. No code change is required.

The robot screen shows a sentence such as `Move ORANGE TRIANGLE to slot 4`.

## Routes

- `GET /admin`: operator dashboard (camera, solution, hints, robot cues)
- `GET /subject`: participant hint display
- `GET /robot`: robot-operator cue display
- `GET /audit`: compatibility redirect to `/robot`
- `GET /api/export/current.json`: concise primary session export
- `GET /api/export/current.csv`: raw timeline CSV

## Quick start

```bash
npm install
npm run launch:study
```

`npm run launch:study` starts the Node server, `watch.py` for the Maxim H Band, and the Pupil Core gaze bridge. Use `npm start` if you only want the web app.

Then open:

- `http://localhost:3000/admin`
- `http://<host-ip>:3000/subject`
- `http://<host-ip>:3000/robot`

Reset between participants with:

```bash
npm run study:reset
```

That archives `data/state.json`, the event log, exports, and uploaded puzzles into `data/archive/<timestamp>/`.

## Operator runbook

1. Start **Pupil Capture** with the Core headset. Capture must use the **glasses** world camera, not the C270. If Capture grabs the Logitech, the operator preview will fail with “camera already in use”.
2. Put the Maxim H Band on and start the app with `npm run launch:study`. Heart rate should appear as soon as BLE is connected; stress/RMSSD still wait for the 60s baseline.
3. Open `/admin` on the host machine. Choose the C270 in the camera list and click **Start camera**.
4. Open `/subject` and `/robot` on the other two devices. Tap once on each so the alert sound is armed.
5. Fill in participant ID, researcher, and sitting number (1/2/3). Save the profile. The three puzzles for that sitting queue automatically.
6. When the readiness list is green, click **Begin sitting**. The button stays disabled until camera, watch, Pupil frames, both screens, and the sitting queue are live.
7. Click **Start round** when the participant begins a puzzle. The physical tangram is on the table; `/subject` does not show the puzzle PDF.
8. Send hints and robot cues (piece, then slot) only while a round is open.
9. Click **Complete round**, then start the next one.
10. After the third puzzle, click **End sitting** and download the session JSON.
11. Click **Reset for next participant**, or run `npm run study:reset` if you also want a clean archive.

## Runtime options

- `PORT`: listening port, default `3000`
- `HOST`: listening host, default `0.0.0.0`
- `ADMIN_PIN`: optional browser unlock PIN for operator actions
- `OPENAI_API_KEY` or `ADAPTIVE_LLM_API_KEY`: optional LLM advisory support for adaptive analysis
- `PUPIL_HOST` / `PUPIL_PORT`: Pupil Capture Network API, default `127.0.0.1:50020`
- `GAZE_MODE`: default `pupil-core`; set `heartbeat-only` or `file-tail` only for rehearsal without Capture

## Sensor integration

- Maxim H Band: [`integrations/watch/watch.py`](integrations/watch/watch.py) writes `watch/watch_data.json`. `pylsl` is optional; `bleak` and `numpy` are required for BLE.
- Pupil Core: [`integrations/gaze/pupil_core_bridge.py`](integrations/gaze/pupil_core_bridge.py) reads Capture’s ZMQ Network API and posts gaze frames. Heartbeats alone do not clear the start gate.
- C270: selected in the operator camera list and reported to `POST /api/camera/status`.

These feeds **do** block a sitting from starting.

## Verification

```bash
npm run verify
```

That runs the Node test suite plus Python syntax validation for the watch and gaze scripts. A hardware rehearsal with C270 + Pupil Capture + the band is still required on the study laptop.

## Documentation

- [Architecture](docs/architecture.md)
- [Internal Study Readiness](docs/internal-study-readiness.md)
- [End-to-End Validation Plan](docs/end-to-end-validation-plan.md)
