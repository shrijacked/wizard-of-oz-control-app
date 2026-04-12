# Wizard of Oz Control Application

Local-first control software for puzzle-session research studies. The app serves three synchronized web views from one machine:

- `/admin` for the primary researcher
- `/subject` for the participant hint display
- `/audit` for robotic action auditing

The system is designed to run on a laptop on the same Wi-Fi network as the secondary displays. It uses plain Node.js on the backend, browser-native frontend code, WebSockets for real-time updates, and file-backed logging for post-trial analysis.

## Repository layout

- `docs/architecture.md`: system architecture and data flow
- `docs/implementation-plan.md`: task traceability and staged plan
- `docs/internal-study-readiness.md`: before-first-participant checklist and dry-run protocol
- `src/`: backend server and services
- `public/`: browser UIs for admin, subject, and audit routes
- `integrations/gaze/`: vendor bridge for gaze SDKs
- `tests/`: automated test coverage
- `integrations/watch/watch.py`: reference watch ingestion script supplied for HRV monitoring

## Core capabilities

- Live webcam preview inside the admin dashboard
- Real-time HRV and gaze telemetry ingestion
- Adaptive intervention engine with heuristic fallback and optional LLM analysis
- Researcher-tunable adaptive thresholds, weights, and freshness windows
- Hint broadcasting to the subject display
- Robotic arm action logging and live audit broadcasting
- Automatic event logging to local files with timestamps
- Session export page with JSON and CSV downloads
- Session metadata and trial lifecycle controls for participant-ready runs
- Explicit live puzzle timer plus exported completion duration for each subject run
- Export analytics and replay timeline for post-trial review
- Optional local admin PIN lock with browser-scoped unlock tokens
- Session-phase protections that block hints, robot actions, and unsafe resets at the wrong time
- One-command study-day launcher for the local stack
- Sensor health summaries with stale-stream warnings for watch and gaze inputs

## Runbook

See `docs/architecture.md`, `docs/implementation-plan.md`, and `docs/internal-study-readiness.md` first. Once the implementation is in place, start the local server with:

```bash
npm start
```

For experiment-day startup, use the one-command launcher:

```bash
npm run launch:study
```

Then open:

- `http://localhost:3000/admin`
- `http://<host-ip>:3000/subject`
- `http://<host-ip>:3000/audit`

On `/admin`, the typical operator flow is:

1. Unlock the dashboard first if `ADMIN_PIN` is configured on the host.
2. Save the session profile with study ID, participant ID, condition, and notes.
3. Tune the adaptive controls for the study if the default rule set is not appropriate.
4. Clear the before-participant gate, including the four manual confirmations.
5. Start the trial when the participant is ready.
6. Use hints, action logging, and telemetry during the run.
7. Watch the live puzzle timer on `/admin/live`, then mark the session complete and enter an end-of-trial summary.
8. Download the final bundle or CSV from `/exports`.

Session protections are always active, even when no PIN is configured:

- hints and robot actions are blocked until the trial is running
- completed sessions become read-only until reset
- live sessions require an explicit force reset confirmation

## Optional runtime configuration

- `PORT`: override the listening port. Default is `3000`.
- `HOST`: override the listening host. Default is `0.0.0.0`.
- `ADMIN_PIN`: require a local PIN unlock before browser-based admin mutations are allowed.
- `OPENAI_API_KEY` or `ADAPTIVE_LLM_API_KEY`: enable optional OpenAI-compatible adaptive advice.
- `ADAPTIVE_LLM_ENDPOINT`: override the chat-completions endpoint.
- `ADAPTIVE_LLM_MODEL`: override the advisory model name.

## Verification

Run the full local verification bundle with:

```bash
npm run verify
```

That executes the Node test suite plus Python syntax validation for the watch and gaze bridge scripts. The same checks also run in GitHub Actions on pushes and pull requests.

## Sensor wiring

- HRV watch: run [`integrations/watch/watch.py`](/Users/owlxshri/Downloads/hti/integrations/watch/watch.py) from the repo root so it writes `watch/watch_data.json`.
- Gaze detector: either post samples to `POST /api/telemetry/gaze` directly or run the bridge in [`integrations/gaze/bridge.py`](/Users/owlxshri/Downloads/hti/integrations/gaze/bridge.py) and connect your SDK output to it.
- Manual or demo telemetry: use `POST /api/telemetry/simulate` or the built-in simulator on `/admin`.

Bridge and sensor ingestion routes stay available without admin unlock so the external devices can keep streaming during a study:

- `POST /api/telemetry/hrv`
- `POST /api/telemetry/gaze`
- `POST /api/bridge/gaze/heartbeat`
- `POST /api/bridge/gaze/frame`

Protected operator tuning is available through:

- `POST /api/adaptive/config`
- `GET /api/preflight`
- `POST /api/preflight/acknowledgements`

Launcher controls:

- `npm run launch:study`: starts the server, the watch bridge process, and a heartbeat-only gaze bridge
- `LAUNCH_WATCH=0 npm run launch:study`: skips the watch process when hardware is unavailable
- `GAZE_MODE=file-tail GAZE_FILE=/path/to/frames.jsonl npm run launch:study`: start the gaze bridge in file-tail mode
- `GAZE_MODE=stdin-jsonl npm run launch:study`: keep the gaze bridge open for stdin-fed SDK frames

## Export surface

- `GET /exports`: operator-facing session export page
- `GET /api/exports`: export manifest
- `GET /api/exports/current.bundle.json`: current session bundle with state, events, and CSV text
- `GET /api/exports/current.csv`: current session timeline CSV

The export center also renders:

- derived session analytics such as puzzle duration, event counts, and adaptive transitions
- the active adaptive configuration used for that session
- a replay timeline built from the ordered event log

## Health endpoints and operator status

- `GET /health`: server and sensor health summary with `ok`, `status`, and derived watch/gaze diagnostics
- `/admin`: now includes a before-participant gate plus a sensor-health panel that warns when watch data or gaze heartbeats go stale
