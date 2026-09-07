# End-to-End Validation Plan

This pass validates the complete three-screen, nine-round participant study.

## Setup and onboarding

1. Start `npm run launch:study`.
2. Open `/admin`, `/subject`, and `/robot`; arm sound on both secondary screens.
3. Start the C270 and confirm live watch data.
4. Confirm `/admin` shows a unique P##, all nine puzzle pairs exactly once, and a three-condition order.
5. Enter matching researcher and participant demographic/consent copies. On `/subject`, also submit instruction acknowledgement and baseline expected efficacy.

Expected: **Begin study** stays blocked until the copies match, displays and hardware are ready, watch calibration is finished, and all nine puzzles are scheduled.

## Round and intervention flow

For each of nine rounds:

1. Start the round and confirm the participant countdown and start sound.
2. Pause/resume at least one round; confirm time freezes and the saved duration excludes the pause.
3. Confirm midpoint and end patterns in a shortened rehearsal configuration.
4. Confirm interventions are disabled in control, the configured reminder appears in constant, and a new in-round HRV spike is highlighted in adaptive.
5. Send a hint and robot cue in an intervention round; confirm screen updates, sound patterns, and logs.
6. Complete the round and confirm the next round stays locked until the participant questionnaire is submitted.
7. Confirm six workload questions always appear and four intervention questions appear only outside control.

After rounds 3 and 6, confirm the break screen, optionally recalibrate the watch, wait for it to finish, and click **Begin next sitting**.

## Final flow and export

1. After round 9, confirm the final helpfulness, efficacy, trust, automation-bias, and comment fields.
2. Confirm **End study** stays disabled until the final survey is submitted.
3. Download JSON and CSV; verify both profiles, baseline rating, condition order, shuffle seed, nine unique puzzle IDs, conditions, pauses, surveys, interventions, and recording metadata.
4. Reset, confirm the P## increments, and confirm the previous ID is rejected if re-entered.

Automated tests cannot validate actual speaker volume, camera framing, or BLE quality. Complete one full hardware rehearsal on the study laptop before collection.
