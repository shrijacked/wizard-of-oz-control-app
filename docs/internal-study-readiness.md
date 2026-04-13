# Internal Study Readiness

Use this as the practical runbook for a real study session with the simplified three-screen app.

## Before the participant arrives

1. Start the app with `npm start` or `npm run launch:study`.
2. Confirm the host machine opens `http://localhost:3000/admin`.
3. Place the camera so the puzzle workspace is clearly visible.
4. Prepare the subject-facing and robot-facing devices on the same network.
5. Make sure your puzzle files are named in subject and solution pairs such as `4.pdf` and `4s.pdf`.

## Screen setup

1. Open `/admin` on the host machine.
2. Open `/subject` on the participant device.
3. Open `/robot` on the robot-operator device.
4. If `ADMIN_PIN` is configured, unlock the operator browser once.

## Trial setup

1. Upload the puzzle files from the dashboard.
2. Choose the puzzle set you want to run.
3. Verify the subject screen shows the subject puzzle.
4. Verify the robot screen shows the paired solution file.
5. Start the camera preview on the dashboard.
6. Optionally enter the study metadata fields.

## During the run

1. Click `Start trial` when the participant begins.
2. Send hints from the dashboard as needed.
3. Use the robot cue buttons when the robot operator needs an action instruction.
4. Watch the elapsed timer on the dashboard.

## Finish and export

1. Click `Mark complete` when the participant finishes.
2. Download the session JSON from the dashboard.
3. Optionally download the CSV timeline too.
4. Click `Reset session` before the next participant.

## What to verify in the JSON export

- `sessionId`
- `trialStartedAt`
- `completedAt`
- `durationSeconds`
- selected `subjectFile`
- selected `solutionFile`
- ordered `interventions`
- every hint intervention has a timestamp and text
- every robot intervention has a timestamp, action ID, and label

## Camera-only dry run

If you only have the camera hardware available right now:

1. Run the app normally.
2. Upload one paired puzzle set.
3. Open `/subject` and `/robot` on extra tabs or devices.
4. Start the camera.
5. Start a trial.
6. Send at least one hint and one robot cue.
7. Complete the trial.
8. Download the JSON and confirm it includes the selected filenames and the two interventions.
