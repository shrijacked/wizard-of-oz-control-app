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
- `tests/`: automated test coverage
- `integrations/watch/watch.py`: reference watch ingestion script supplied for HRV monitoring

## Core capabilities

- Live webcam preview inside the admin dashboard
- Real-time HRV and gaze telemetry ingestion
- Adaptive intervention engine with heuristic fallback and optional LLM analysis
- Hint broadcasting to the subject display
- Robotic arm action logging and live audit broadcasting
- Automatic event logging to local files with timestamps

## Runbook

See `docs/architecture.md` and `docs/implementation-plan.md` first. Once the implementation is in place, start the local server with:

```bash
npm start
```

Then open:

- `http://localhost:3000/admin`
- `http://<host-ip>:3000/subject`
- `http://<host-ip>:3000/audit`
