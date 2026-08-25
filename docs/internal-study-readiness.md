# Internal Study Readiness

Practical runbook for a real sitting. One sitting = three puzzles. Each participant does three sittings.

## Before the participant arrives

1. Start Pupil Capture with the Core headset. Confirm the Network API is on (port `50020`). Capture must use the glasses camera, not the Logitech C270.
2. Start the app with `npm run launch:study`.
3. Confirm the host machine opens `http://localhost:3000/admin`.
4. Choose the C270 in the camera list and click **Start camera**. Place it so the table workspace is in frame.
5. Put the Maxim H Band on. Heart rate should appear before the 60s baseline finishes. The dashboard may say `Watch live — calibrating` until RMSSD is ready.
6. Put the subject device and the robot-operator device on the same network.
7. If this machine still has rehearsal data, run `npm run study:reset`. The tangram pairs load from `tangram puzzles/` on startup.

## Screen setup

1. Open `/admin` on the host machine.
2. Open `/subject` on the participant device and tap once so the beep is armed. That screen shows only the written hint.
3. Open `/robot` on the robot-operator device and tap once so the beep is armed. That screen shows only the piece-and-slot cue.
4. If `ADMIN_PIN` is set, unlock the operator browser once.
5. Confirm the top-bar pills show **Subject: ready**, **Robot: ready**, **Camera: live**, **Watch: live**, and **Pupil: live**.

## Sitting setup

1. Enter Study ID, Participant ID, researcher, sitting number (1, 2, or 3), and condition. Save the profile.
2. Confirm the queue filled automatically:
   - sitting 1 → puzzles 1, 2, 3
   - sitting 2 → puzzles 4, 5, 6
   - sitting 3 → puzzles 7, 8, 9
3. Upload a replacement pair only if a file is missing or wrong.
4. Begin sitting only when the readiness list is green. The server will reject start if camera, watch, Pupil frames, or either display screen is missing.

## During the sitting

1. Keep the C270 running. The operator deck shows camera, current solution, hints, and robot buttons.
2. Click **Start round** when the participant begins that physical tangram.
3. Send hints from the presets or the text box. Use **Clear subject screen** to blank a hint.
4. Send robot cues by choosing a piece, then a numbered slot, then **Send robot cue**.
5. Click **Complete round** when that puzzle is done, then start the next round.
6. After the third puzzle, click **End sitting**.

## Finish and export

1. Download the session JSON.
2. Optionally download the CSV timeline.
3. Click **Reset for next participant**.
4. For sitting 2 and sitting 3 of the same person, use the same Participant ID and change only the sitting number.

## What to verify in the JSON export

- `sessionId`
- `metadata.participantId`
- `metadata.sittingNumber`
- `roundsCompleted` is 3 for a full sitting
- each round has `puzzle.subjectFile`, `puzzle.solutionFile`, `startedAt`, `completedAt`, `durationSeconds`
- each hint intervention has `at`, `offsetSeconds`, and `text`
- each robot intervention has `at`, `piece`, and `slot`

## Camera-only dry run

Software can be rehearsed without hardware, but **Begin sitting will stay blocked** until camera, watch, and Pupil frames are reported live. For a laptop rehearsal without the band or Capture, do not expect the start gate to open. After code lands, run one rehearsal with C270 + Pupil Capture + the band on the study laptop.
