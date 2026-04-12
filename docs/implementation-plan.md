# Implementation Plan And Traceability

## Working assumptions

- The app runs on the researcher's machine on a trusted LAN.
- The browser will handle webcam preview directly through `getUserMedia`.
- The HRV watch collector remains a separate Python process and writes `watch/watch_data.json`.
- The gaze system may vary, so we provide a stable HTTP ingest endpoint instead of hard-coding a vendor SDK.
- Optional LLM-based reasoning is additive; heuristic logic remains the guaranteed baseline.

## Dependency graph

```mermaid
flowchart LR
    state["Experiment State Store"] --> api["HTTP API"]
    state --> ws["WebSocket Hub"]
    telemetry["Telemetry Ingestion"] --> state
    adaptive["Adaptive Logic Engine"] --> state
    ui["Frontend Routes"] --> api
    ui --> ws
    logging["Event Logger"] --> state
```

## Traceable task list

| Task ID | Task | Depends On | Design Reference |
| --- | --- | --- | --- |
| T1 | Initialize repo, runtime metadata, and file layout | None | Architecture: System topology |
| T2 | Build file-backed experiment state store and event logger | T1 | Architecture: Logging strategy |
| T3 | Implement WebSocket hub and route-aware broadcasting | T2 | Architecture: Component responsibilities |
| T4 | Implement HTTP API for hints, actions, telemetry, and session reset | T2 | Architecture: Route map |
| T5 | Implement adaptive logic engine with heuristic scoring | T2 | Architecture: Adaptive engine behavior |
| T6 | Implement watch file monitor and telemetry normalization | T2, T5 | Architecture: Sensor integration plan |
| T7 | Build admin dashboard UI | T3, T4, T5, T6 | Architecture: Frontend route views |
| T8 | Build subject and audit displays | T3, T4 | Architecture: Frontend route views |
| T9 | Add gaze bridge service, normalization, and operator diagnostics | T4, T6, T7 | Architecture: Sensor integration plan |
| T10 | Add export manifest, download routes, and export-center UI | T2, T4, T7 | Architecture: Logging strategy |
| T11 | Add automated tests for store, API, adaptive logic, and realtime flows | T2-T10 | Architecture: Data flow |
| T12 | Add operator docs and end-to-end runbook | T1-T11 | README + architecture docs |
| T13 | Add operator safeguards with local PIN lock and session-phase policy enforcement | T2, T4, T7, T11 | Architecture: Operator safeguard flow |
| T14 | Add adaptive threshold controls that persist into state, exports, and the dashboard | T5, T7, T10, T11, T13 | Architecture: Adaptive engine behavior |
| T15 | Add one-command study-day launcher and sensor health diagnostics | T4, T6, T7, T11, T12 | Architecture: Sensor integration plan |
| T16 | Add a before-participant readiness gate with live blockers, manual acknowledgements, and a study-day runbook | T6, T7, T11, T12, T15 | Architecture: Before-participant gate |
| T17 | Audit and reorganize the operator UI so task-heavy pages are easier to scan and navigate | T7, T10, T12, T16 | Docs: Operator navigation audit + Architecture: Operator information architecture |
| T18 | Replace the single long admin page with dedicated route-based operator pages that preserve the full workflow | T7, T10, T13, T14, T17 | Architecture: Frontend route views |

## Delivery slices

### Slice 1

- Create repo metadata
- Add docs and execution plan
- Define data contracts

### Slice 2

- Build backend core: server, store, logger, adaptive engine
- Cover backend with automated tests

### Slice 3

- Build admin, subject, and audit frontends
- Wire browser actions to REST and WebSockets

### Slice 4

- Add watch integration, simulation tools, and runbook polish
- Verify end-to-end flows locally

### Slice 5

- Add gaze bridge heartbeat and raw-frame normalization
- Add session export center and downloadable artifacts
- Verify operator flows and update docs

### Slice 6

- Add session metadata capture for study, participant, and condition
- Add explicit setup, running, and completed trial states
- Include lifecycle data in exports and operator workflow

### Slice 7

- Derive export analytics from the ordered event log
- Add replay timeline browsing to the export center
- Verify analytics and replay output through tests

### Slice 8

- Add local operator safeguards and browser unlock flow
- Enforce session-phase mutation policy at the API and dashboard layers
- Verify lock, read-only, and force-reset behaviors through tests and live checks

### Slice 9

- Add adaptive threshold, weight, and freshness controls to the admin dashboard
- Persist the active adaptive rule set into state, exports, and event logs
- Verify config changes through engine tests, store tests, API tests, and live checks

### Slice 10

- Add a one-command launcher for the app server and bridge processes
- Add sensor health summaries and stale-stream warnings to the admin dashboard and health endpoint
- Verify launcher planning, health derivation, and live startup behavior

### Slice 11

- Add a before-participant gate that blocks trial start until required setup conditions are satisfied
- Persist manual readiness acknowledgements into state, events, and exports
- Add the dry-run and internal-study readiness runbook

### Slice 12

- Audit the operator-facing pages for navigation friction
- Add a shared route shell and sticky section rail
- Reorganize admin and exports around operator tasks instead of a flat panel wall

### Slice 13

- Replace the long operator page with real admin subroutes
- Keep setup, live, monitoring, and review as dedicated pages with shared live state
- Verify the route contract through server tests and full verification

## Validation checklist

- Admin view loads and can preview the webcam
- Subject display updates without refresh when a hint is sent
- Audit display updates without refresh when a robotic action is logged
- Telemetry ingest updates charts and adaptive recommendation state
- Session metadata persists into state and export bundles
- Trial lifecycle transitions are logged with timestamps
- PIN-protected admin mutations stay locked until the correct local unlock flow succeeds
- Hints and robotic actions stay blocked outside the running phase
- Force reset is required before aborting an active run
- Adaptive control changes persist into the session state and export bundle
- Sensor health summaries warn when watch or gaze data goes stale
- The study-day launcher can bring up the local stack with one command
- The before-participant gate blocks trial start until required readiness items are clear
- Export center shows analytics and replay timeline for a selected session
- Session events append to disk with timestamps
- Tests pass before any commit is created
