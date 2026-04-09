# Operator Navigation Audit

## Audit summary

The dashboard already exposes the right capabilities, but the page is still harder to scan than it should be during a live run. The biggest navigation issues are:

- the admin page reads like one long wall of panels instead of a task-based workspace
- high-frequency controls compete visually with setup, routing, and review utilities
- exports feel like a separate page instead of part of the same operator system
- operators do not have a persistent, glanceable jump map while moving through the session

## Target information architecture

```mermaid
flowchart LR
    shell["Shared app shell"] --> rail["Sticky operator rail"]
    shell --> routes["Persistent route navigation"]
    rail --> setup["Run setup"]
    rail --> live["Live controls"]
    rail --> monitor["Monitoring"]
    rail --> review["Review and routing"]
```

## Traceable cleanup plan

```mermaid
flowchart TD
    audit["Audit existing page flow"] --> ia["Define task-based information architecture"]
    ia --> shell["Add shared route shell across admin and exports"]
    ia --> admin["Group admin into setup, live, monitoring, review"]
    ia --> nav["Add sticky section jump navigation"]
    shell --> polish["Tighten styles for scanability and hierarchy"]
    admin --> polish
    nav --> polish
    polish --> verify["Verify served HTML and tests"]
```

## Planned operator workspaces

| Workspace | Primary job | Panels |
| --- | --- | --- |
| Run setup | Prepare the next participant safely | Session metadata, readiness gate, safeguards |
| Live controls | Act quickly during the run | Hint terminal, robot action log |
| Monitoring | Understand participant state | Camera, telemetry, sensor health, adaptive rules |
| Review and routing | Lower-frequency support tasks | Exports, network routing, simulator, event log |
