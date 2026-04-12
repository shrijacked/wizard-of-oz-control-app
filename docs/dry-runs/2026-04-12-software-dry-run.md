# Dry Run Log

## Dry run metadata

- Date: 2026-04-12
- Researcher: Codex software-side rehearsal
- Branch: `main`
- Commit at rehearsal start: `d2358fe`
- Host machine: `/Users/owlxshri/Downloads/hti`
- Network: localhost plus local WebSocket listeners outside the sandbox
- Launcher command: `ADMIN_PIN=1357 LAUNCH_WATCH=0 npm run launch:study`
- Watch mode: file-backed watch bridge using `watch/watch_data.json`
- Gaze mode: launcher heartbeat-only bridge plus simulated frames for adaptive-state validation

## Phase results

### Phase 1. Build verification

- Status: pass
- Command run: `npm run verify`
- Notes:
  - verification passed after the latest reset-baseline regression fix
  - final baseline was 28 passing Node tests plus Python bridge syntax checks

### Phase 2. Launcher and routing

- Status: pass
- Admin loaded: yes
- Health endpoint checked: yes
- Notes:
  - the study launcher started cleanly on `http://127.0.0.1:3000/admin`
  - `/health`, `/admin`, `/admin/setup`, `/admin/live`, `/admin/monitoring`, and `/admin/review` all responded

### Phase 3. Screen connectivity

- Status: pass
- Subject display connected: yes
- Audit display connected: yes
- Reconnect after refresh: not browser-verified, but live WebSocket listener sessions connected and received snapshots
- Notes:
  - subject and audit WebSocket listeners received state snapshots after live updates
  - connection counts were reflected in server state during the run

### Phase 4. Real sensor validation

- Status: partial
- HRV feed live: yes, through the watch bridge file path
- Gaze feed live: yes, through the gaze bridge heartbeat and simulated frame path
- Watch stale warning check: yes
- Gaze stale warning check: yes for bridge heartbeat behavior, not with the real device
- Notes:
  - this was not a physical hardware rehearsal
  - the software gate correctly blocked trial start when watch telemetry became stale
  - a fresh watch entry cleared the gate as expected

### Phase 5. Full mock session

- Status: pass
- Session metadata saved: yes
- Readiness gate cleared: yes
- Hints tested: yes, two hints sent
- Robot actions tested: yes, two actions logged
- Adaptive transitions observed: yes, state escalated to `intervene`
- Session completed: yes
- Notes:
  - the live operator flow completed end to end without restarting the stack
  - the subject listener received hint updates
  - the audit listener received robot-action updates
  - the live puzzle timer requirement is now explicitly surfaced in the UI and exports

### Phase 6. Failure and recovery drills

- Status: partial
- Admin refresh: not run
- Subject refresh: not run
- Watch reconnect: simulated through a fresh watch-file update
- Gaze reconnect: not run with a real device
- Force reset: not run in this rehearsal
- Lock and unlock: yes
- Notes:
  - the admin PIN lock was cycled successfully
  - a normal reset after session completion produced a clean new setup session
  - the reset path exposed one real defect during rehearsal: HRV baseline calibration was being lost after reset
  - that defect was fixed with a regression test before this log was written

### Phase 7. Export and analysis validation

- Status: pass
- Bundle reviewed: yes
- CSV reviewed: yes
- Replay reviewed: yes
- Required fields complete: yes for the software-side rehearsal
- Notes:
  - `current.bundle.json` included session metadata, lifecycle events, adaptive state, and completion summary
  - `current.csv` contained 26 ordered rows for the rehearsal timeline
  - the export analytics now expose puzzle duration explicitly instead of relying only on raw timestamps

## Final assessment

- Ready to advance to next rehearsal step: yes
- Safe for internal participant run: not yet
- Open issues:
  - one real-hardware rehearsal is still required for the actual watch and gaze setup
  - refresh and reconnect drills with the physical devices are still pending
- Follow-up actions:
  - run the same ladder on the real experiment laptop with the actual watch and gaze devices
  - complete at least one physical dry run and one pilot-student run before collecting internal-study data
