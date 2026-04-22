# End-to-End Validation Plan

This plan validates the simplified three-screen study flow from setup to export.

## Goal

Prove that:

- the operator dashboard works from a single page
- the subject screen receives the chosen puzzle and hint
- the robot screen receives the solution file and robot cue
- the subject and robot screens each play an alert beep after being armed once
- the operator dashboard shows live HRV metrics when watch data is present
- the session export captures timestamps, selected filenames, and interventions

## Validation checklist

### 1. Route contract

Open these pages and confirm they load:

- `/admin`
- `/subject`
- `/robot`

Optional:

- `/audit` should redirect or behave as a compatibility alias to `/robot`

### 2. Puzzle pairing

Upload:

- `1.pdf`
- `1s.pdf`
- one unmatched file such as `2.pdf`

Expected:

- set `1` appears as a selectable puzzle set
- `2.pdf` appears in the incomplete uploads list

### 3. Multi-screen propagation

Select set `1`.

Expected:

- `/subject` shows `1.pdf`
- `/robot` shows `1s.pdf`
- after clicking `Enable alert sound` once on each screen, both screens report that alert sound is ready

### 4. Trial lifecycle

Expected dashboard flow:

1. camera can start and stop
2. `Start trial` becomes available once a puzzle set is selected
3. sending a hint updates `/subject` and triggers one subject-screen beep
4. logging a robot cue updates `/robot` and triggers one robot-screen beep
5. if the watch feed is connected, `/admin` shows fresh HRV values and updated time
6. `Mark complete` locks further interventions

### 5. Export validation

Download `/api/export/current.json`.

Expected:

- `sessionId` is present
- `trialStartedAt` is present
- `completedAt` is present after completion
- `durationSeconds` is numeric
- `puzzle.subjectFile` matches the chosen subject file
- `puzzle.solutionFile` matches the chosen solution file
- `interventions` are in timestamp order
- the hint intervention includes `type=hint` and `text`
- the robot intervention includes `type=robot`, `actionId`, and `label`

## Suggested dry run

1. Start the app.
2. Open `/admin`, `/subject`, and `/robot`.
3. Upload `1.pdf` and `1s.pdf`.
4. Select set `1`.
5. Start the camera.
6. Click `Enable alert sound` once on `/subject`.
7. Click `Enable alert sound` once on `/robot`.
8. Start the trial.
9. Send one hint.
10. Send one robot cue.
11. If the watch is connected, confirm the HRV panel updates on `/admin`.
12. Mark the trial complete.
13. Download the JSON export and review it.
