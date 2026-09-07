# Dry run — 2026-08-23 software + UI

- Host: `/Users/owlxshri/Desktop/hti`
- Server: `PORT=3010 npm start` (port 3000 was already taken by another local app)
- Scope: automated sitting + browser check of the three screens
- Hardware rehearsal: not run

## What passed

- `npm test`: 57 passing
- `npm run test:python`: watch script compiles
- Scripted sitting: 3 queued puzzles, 3 rounds, hint + piece/slot cue per round, export had `roundsCompleted: 3` and `Move ORANGE TRIANGLE to slot 1`
- `/admin` loads setup mode with a real readiness list; Begin sitting stays disabled until checks pass
- `/subject` arms sound and reports ready; operator pill changes to `Subject: ready`
- `/robot` loads and appears as connected on the operator dashboard
- WebSocket link pill shows `Link: live`

## What was not run

- Physical three-device rehearsal (laptop + two other screens)
- Camera permission on the study laptop
- Watch hardware
- Deliberate WiFi drop / laptop sleep
- Arming robot sound in the browser (automation stopped after the subject screen)

## Assessment

Safe for a software-only walkthrough: yes.

Safe for a real participant sitting: not until you run the same flow once on the three actual devices and confirm camera + beeps.
