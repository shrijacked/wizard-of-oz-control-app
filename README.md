# Wizard of Oz Control Application

Local-first control software for a three-screen Wizard of Oz puzzle study.

The app now centers around one clean operator dashboard and two synchronized secondary screens:

- `/admin` for the dashboard operator
- `/subject` for the participant
- `/robot` for the robot operator

The host machine serves all three screens over the local network and keeps them synchronized with WebSockets and file-backed logging.

## What the app does

- shows a live webcam preview on the operator dashboard
- lets the operator upload puzzle files and auto-pair subject files with solution files using the `s` suffix convention
- sends text hints from the dashboard to the subject screen
- sends robot cues from the dashboard to the robot screen
- plays a short alert beep on the subject screen when a new hint arrives
- plays a short alert beep on the robot screen when a new robot cue arrives
- tracks the trial lifecycle with start, completion, reset, and elapsed time
- shows live HRV watch metrics on the operator dashboard when telemetry is available
- exports a concise session JSON with timestamps, selected puzzle filenames, and ordered interventions
- keeps CSV timeline output available as a secondary export
- keeps HRV and gaze ingestion routes available in the backend without making them part of the main operator workflow

## Puzzle file pairing

Upload files in subject and solution pairs:

- `1.pdf` pairs with `1s.pdf`
- `7.png` pairs with `7s.png`

Only complete pairs appear as selectable puzzle sets in the dashboard. Any unmatched file stays listed as an incomplete upload until its matching pair is added.

## Routes

- `GET /admin`: single operator dashboard
- `GET /subject`: participant-facing puzzle and hint screen
- `GET /robot`: robot-operator solution and cue screen
- `GET /audit`: compatibility redirect to `/robot`
- `GET /api/export/current.json`: concise primary session export
- `GET /api/export/current.csv`: raw timeline CSV

## Quick start

```bash
npm install
npm start
```

Then open:

- `http://localhost:3000/admin`
- `http://<host-ip>:3000/subject`
- `http://<host-ip>:3000/robot`

## Operator runbook

1. Open `/admin` on the host machine.
2. Upload puzzle files and choose the puzzle set for the run.
3. Open `/subject` on the participant-facing device.
4. Open `/robot` on the robot-operator-facing device.
5. Tap `Enable alert sound` once on both `/subject` and `/robot` so the browser is allowed to beep.
6. Start the camera preview on the dashboard.
7. Optionally fill in study metadata.
8. Start the trial.
9. Send hints and robot cues from the dashboard during the run.
10. Watch the HRV panel on `/admin` if the watch feed is connected.
11. Mark the trial complete.
12. Download the session JSON from the dashboard.

## Runtime options

- `PORT`: listening port, default `3000`
- `HOST`: listening host, default `0.0.0.0`
- `ADMIN_PIN`: optional browser unlock PIN for operator actions
- `OPENAI_API_KEY` or `ADAPTIVE_LLM_API_KEY`: optional LLM advisory support for adaptive analysis

The adaptive backend and telemetry bridges can stay enabled for future hardware integration, but they do not block the simplified operator workflow.

## Sensor integration

- HRV watch: run [`integrations/watch/watch.py`](/Users/owlxshri/Downloads/hti/integrations/watch/watch.py) from the repo root so it writes `watch/watch_data.json`
- Gaze detector: post frames to `POST /api/telemetry/gaze` or use [`integrations/gaze/bridge.py`](/Users/owlxshri/Downloads/hti/integrations/gaze/bridge.py)

These feeds still update backend state, but the dashboard no longer requires them before a trial can start.

When the watch feed is active, the `/admin` page shows heart rate, SDNN, RMSSD, pNN50, stress score, stress level, distraction flag, source, and last-update time.

## Verification

Run the full suite with:

```bash
npm run verify
```

That runs the Node test suite plus Python syntax validation for the watch and gaze scripts.

## Documentation

- [Architecture](/Users/owlxshri/Downloads/hti/docs/architecture.md)
- [Internal Study Readiness](/Users/owlxshri/Downloads/hti/docs/internal-study-readiness.md)
- [End-to-End Validation Plan](/Users/owlxshri/Downloads/hti/docs/end-to-end-validation-plan.md)
