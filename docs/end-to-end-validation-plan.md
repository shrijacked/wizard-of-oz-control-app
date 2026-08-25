# End-to-End Validation Plan

This plan validates the three-screen study flow from setup to export.

## Goal

Prove that:

- the operator dashboard works from a single page
- `/subject` shows only the written hint plus a beep
- `/robot` shows only the piece-and-slot cue plus a beep
- the operator keeps the C270 and the current solution
- **Begin sitting** stays blocked until camera, watch, Pupil frames, both screens, and the sitting queue are live
- saving sitting 2 auto-queues puzzles 4, 5, and 6
- the session export captures sitting metadata, per-round filenames, durations, and piece+slot interventions

## Validation checklist

### 1. Route contract

Open these pages and confirm they load:

- `/admin`
- `/subject`
- `/robot`

Optional:

- `/audit` should redirect or behave as a compatibility alias to `/robot`

### 2. Puzzle pairing

On a fresh data directory, start the server so `tangram puzzles/` seeds sets `1`–`9`.

Save sitting 2.

Expected:

- queue is `4`, `5`, `6` in that order
- `/subject` still has no puzzle image
- `/admin` solution pane stays empty until a round starts, then shows `4s.pdf`

Upload fallback:

- `1.pdf`
- `1s.pdf`
- one unmatched file such as `2.pdf`

Expected:

- set `1` appears as a complete pair
- `2.pdf` appears in the incomplete uploads list

### 3. Multi-screen propagation

Arm `/subject` and `/robot`, start the C270, wait for watch and Pupil frames, begin sitting 1, and start round 1.

Expected:

- `/subject` shows the hint area only, not `1.pdf`
- `/robot` shows the cue area only, not `1s.pdf`
- `/admin` shows `1s.pdf` after the round starts
- after tapping once on each display, both screens report that alert sound is ready

### 4. Sitting start gate

Expected:

1. camera can start from setup, before **Begin sitting**
2. **Begin sitting** stays disabled without C270 / watch / Pupil frames / armed screens
3. a gaze heartbeat without a frame is not enough
4. sending a hint updates `/subject` and triggers one subject-screen beep
5. logging a robot cue updates `/robot` and triggers one robot-screen beep
6. if the watch feed is connected, `/admin` shows fresh HRV values and updated time
7. **End sitting** locks further interventions

### 5. Export validation

Download `/api/export/current.json`.

Expected:

- `sessionId` is present
- `metadata.sittingNumber` matches the sitting
- `roundsCompleted` matches finished rounds
- each round has `puzzle.subjectFile` and `puzzle.solutionFile`
- `interventions` are in timestamp order
- the hint intervention includes `type=hint` and `text`
- the robot intervention includes `type=robot`, `piece`, and `slot`

## Suggested dry run

1. Start Pupil Capture, then `npm run launch:study`.
2. Open `/admin`, `/subject`, and `/robot`.
3. Start the C270. Confirm Capture is not using it.
4. Tap once on `/subject` and `/robot`.
5. Save sitting 1 (or 2, or 3) and confirm the three puzzles queued.
6. Click **Begin sitting** only after every readiness row is green.
7. Start round 1, send one hint, send one robot cue.
8. Complete three rounds, end the sitting, download JSON.

A hardware pass cannot be claimed from unit tests alone. After code lands, rehearse once with C270 + Pupil Capture + the Maxim H Band on the study laptop.
