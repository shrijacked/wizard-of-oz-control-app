# Wizard of Oz Control Application

Local-first control software for a three-screen Wizard of Oz puzzle study.

One participant record contains nine randomized puzzles in three consecutive sittings of three. Each sitting uses one condition: control, constant intervention, or adaptive intervention.

- `/admin` for the dashboard operator
- `/subject` for participant onboarding, timer, written hints, breaks, and questionnaires
- `/robot` for the robot operator (piece + slot cue + beep only)

The host machine serves all three screens over the local network and keeps them synchronized with WebSockets and file-backed logging.

## What the app does

- shows a live Logitech C270 preview on the operator dashboard, with a camera picker
- seeds puzzle pairs from `tangram puzzles/` (`1.pdf`+`1s.pdf` through `9.pdf`+`9s.pdf`)
- reserves the next participant ID (`P01`, `P02`, …) without reusing saved IDs
- cycles participants through all six possible condition orders and saves the assigned order
- globally shuffles all nine puzzles with a persisted participant-specific seed, then assigns three to each sitting
- records separate participant-entered and researcher-entered demographic/consent copies for cross-checking
- collects baseline expected efficacy, a questionnaire after every round, and an end-of-study questionnaire in the app
- sends text hints from the dashboard to the subject screen
- sends robot cues as **piece + numbered slot** to the robot screen
- plays a short alert beep on the subject screen when a new hint arrives
- plays a short alert beep on the robot screen when a new robot cue arrives
- blocks **Begin study** until the C270, Maxim H Band, both displays, matching profile copies, and nine-round schedule are ready
- tracks study, sitting, and round lifecycle with start, pause, resume, complete, breaks, and elapsed active time
- provides configurable constant-condition reminders and highlights detected HRV stress spikes in adaptive rounds
- allows watch recalibration between rounds and sittings without restarting the app
- shows live HRV metrics and stress-spike guidance on the operator dashboard
- exports a concise participant-session JSON with counterbalancing, puzzle order, both profile copies, per-round surveys, final survey, durations, and ordered interventions
- keeps CSV timeline output available as a secondary export

## Puzzle file pairing

The study folder is the source of truth. Pairing uses the `s` suffix convention:

- `1.pdf` pairs with `1s.pdf`
- all nine complete pairs are shuffled across the full participant schedule
- the resulting order and randomization seed are saved and remain stable for that participant

Manual upload remains a fallback for a missing or replaced file. Only complete pairs become selectable sets.

## Robot cues

Edit [`config/study.json`](config/study.json) to change piece names, slot count, planned rounds, and hint presets. No code change is required.

The robot screen shows a sentence such as `Move ORANGE TRIANGLE to slot 4`.

## Routes

- `GET /admin`: operator dashboard (camera, solution, hints, robot cues)
- `GET /subject`: participant study screen
- `GET /robot`: robot-operator cue display
- `GET /audit`: compatibility redirect to `/robot`
- `GET /api/export/current.json`: concise primary session export
- `GET /api/export/current.csv`: raw timeline CSV

## Quick start

```bash
npm install
npm run launch:study
```

`npm run launch:study` starts the Node server and `watch.py` for the Maxim H Band. Use `npm start` if you only want the web app.

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

1. Put the Maxim H Band on and start the app with `npm run launch:study`. Heart rate should appear as soon as BLE is connected; stress/RMSSD still wait for the 60s baseline.
2. Open `/admin` on the host machine. Choose the C270 in the camera list and click **Start camera**.
3. Open `/subject` and `/robot` on the other two devices. Tap once on each so the alert sound is armed.
4. Use the auto-assigned participant ID. Enter the researcher’s demographic/consent cross-check, timer length, and constant reminder interval, then save. The nine-round condition and puzzle schedule is generated once and shown in the dashboard.
5. Read the on-screen participant script. On `/subject`, have the participant enter their own age/gender copy, baseline expected-efficacy rating, instruction acknowledgement, and consent.
6. When the readiness list is green, click **Begin study**. The button stays disabled until both profile copies match and the camera, watch, both screens, and nine-puzzle schedule are ready.
7. Click **Start round** when the participant begins. Use **Pause timer** and **Resume timer** when needed. The participant sees the countdown and hears start, midpoint, and end cues.
8. Control rounds disable hints and robot movements. In constant rounds, use the configured researcher reminder. In adaptive rounds, use the HRV spike highlight as decision support rather than an automatic intervention.
9. Click **Complete round**. The next round remains locked until the participant submits the in-app questionnaire. A researcher can skip it only by recording a reason.
10. After rounds 3 and 6, take a break. Recalibrate the watch if needed, click **Begin next sitting**, and continue the same participant record.
11. After round 9, wait for the participant’s end-of-study questionnaire, click **End study**, and download the exports.
12. Click **Reset for next participant**, or run `npm run study:reset` if you also want a clean archive.

## Runtime options

- `PORT`: listening port, default `3000`
- `HOST`: listening host, default `0.0.0.0`
- `ADMIN_PIN`: optional browser unlock PIN for operator actions
- `OPENAI_API_KEY` or `ADAPTIVE_LLM_API_KEY`: optional LLM advisory support for adaptive analysis

## Sensor integration

- Maxim H Band: [`integrations/watch/watch.py`](integrations/watch/watch.py) writes `watch/watch_data.json`. `pylsl` is optional; `bleak` and `numpy` are required for BLE.
- C270: selected in the operator camera list and reported to `POST /api/camera/status`.

The watch still establishes a baseline when its bridge starts. **Recalibrate watch** writes a runtime control request for `watch.py`; use it between rounds or sittings while the participant is still.

The camera and watch feeds **do** block a sitting from starting.

## Verification

```bash
npm run verify
```

That runs the Node test suite plus Python syntax validation for the watch script. A hardware rehearsal with the C270 and band is still required on the study laptop.

## Documentation

- [Architecture](docs/architecture.md)
- [Internal Study Readiness](docs/internal-study-readiness.md)
- [End-to-End Validation Plan](docs/end-to-end-validation-plan.md)
- [Participant Read-Aloud Script](docs/participant-script.md)
