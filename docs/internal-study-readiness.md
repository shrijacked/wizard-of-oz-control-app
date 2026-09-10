# Internal Study Readiness

Practical runbook for one participant's complete visit: nine puzzles in three consecutive sittings.

## Before the participant arrives

1. Start `npm run launch:study`, open `/admin`, start the C270, and frame the table.
2. Connect the Maxim H Band and let baseline calibration finish.
3. Open `/subject` and `/robot` on their devices and enable sounds.
4. Confirm all nine puzzle/solution pairs loaded and the hardware/display pills are ready.

## Participant setup

1. Keep the auto-assigned P## unless the protocol requires a new, unused custom ID.
2. Enter study ID, researcher, researcher demographic/consent copy, round duration, and constant reminder interval; save.
3. Read the dashboard script and provide the approved participant information.
4. On `/subject`, have the participant submit their own demographics, baseline rating, acknowledgement, and consent.
5. Resolve every required profile or schedule row. Hardware and display warnings may be accepted when necessary; the session log records them when the study starts.

## During and after

1. Start each round with the physical tangram; pause/resume when activity pauses.
2. Do not intervene in control. Use the scheduled reminder in constant and the HRV spike display as decision support in adaptive.
3. Complete each round and wait for its questionnaire. Skip only when necessary and record a reason.
4. After rounds 3 and 6, break, optionally recalibrate, and begin the next sitting when ready.
5. After round 9, wait for the final questionnaire, end the study, and download JSON plus CSV.
6. Confirm nine rounds and all expected data are present, then reset and verify the P## increments.

See [Participant Read-Aloud Script](participant-script.md) and [End-to-End Validation Plan](end-to-end-validation-plan.md). A hardware rehearsal is required before collection.
