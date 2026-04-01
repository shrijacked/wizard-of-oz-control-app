# Wizard of Oz Control Application

Local-first control software for puzzle-session research studies. The app serves three synchronized web views from one machine:

- `/admin` for the primary researcher
- `/subject` for the participant hint display
- `/audit` for robotic action auditing

The system is designed to run on a laptop on the same Wi-Fi network as the secondary displays. It uses plain Node.js on the backend, browser-native frontend code, WebSockets for real-time updates, and file-backed logging for post-trial analysis.

## Repository layout

- `docs/architecture.md`: system architecture and data flow
- `docs/implementation-plan.md`: task traceability and staged plan
- `src/`: backend server and services
- `public/`: browser UIs for admin, subject, and audit routes
- `integrations/gaze/`: vendor bridge for gaze SDKs
- `tests/`: automated test coverage
- `integrations/watch/watch.py`: reference watch ingestion script supplied for HRV monitoring

## Core capabilities

- Live webcam preview inside the admin dashboard
- Real-time HRV and gaze telemetry ingestion
- Adaptive intervention engine with heuristic fallback and optional LLM analysis
- Hint broadcasting to the subject display
- Robotic arm action logging and live audit broadcasting
- Automatic event logging to local files with timestamps
- Session export page with JSON and CSV downloads
- Session metadata and trial lifecycle controls for participant-ready runs

## Runbook

See `docs/architecture.md` and `docs/implementation-plan.md` first. Once the implementation is in place, start the local server with:

```bash
npm start
```

Then open:

- `http://localhost:3000/admin`
- `http://<host-ip>:3000/subject`
- `http://<host-ip>:3000/audit`

On `/admin`, the typical operator flow is:

1. Save the session profile with study ID, participant ID, condition, and notes.
2. Start the trial when the participant is ready.
3. Use hints, action logging, and telemetry during the run.
4. Mark the session complete and enter an end-of-trial summary.
5. Download the final bundle or CSV from `/exports`.

## Optional runtime configuration

- `PORT`: override the listening port. Default is `3000`.
- `HOST`: override the listening host. Default is `0.0.0.0`.
- `OPENAI_API_KEY` or `ADAPTIVE_LLM_API_KEY`: enable optional OpenAI-compatible adaptive advice.
- `ADAPTIVE_LLM_ENDPOINT`: override the chat-completions endpoint.
- `ADAPTIVE_LLM_MODEL`: override the advisory model name.

## Sensor wiring

- HRV watch: run [`integrations/watch/watch.py`](/Users/owlxshri/Downloads/hti/integrations/watch/watch.py) from the repo root so it writes `watch/watch_data.json`.
- Gaze detector: either post samples to `POST /api/telemetry/gaze` directly or run the bridge in [`integrations/gaze/bridge.py`](/Users/owlxshri/Downloads/hti/integrations/gaze/bridge.py) and connect your SDK output to it.
- Manual or demo telemetry: use `POST /api/telemetry/simulate` or the built-in simulator on `/admin`.

## Export surface

- `GET /exports`: operator-facing session export page
- `GET /api/exports`: export manifest
- `GET /api/exports/current.bundle.json`: current session bundle with state, events, and CSV text
- `GET /api/exports/current.csv`: current session timeline CSV
