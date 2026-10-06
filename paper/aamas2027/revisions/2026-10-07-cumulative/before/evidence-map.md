# Evidence map: current manuscript

Updated 7 October 2026, branch `writing`, base `3c4ddb9`. Internal author material.

| Claim/location | Evidence | Scope and remaining checks |
|---|---|---|
| Abstract and §5.1: N=12, ages/gender, nine trials each | Complete-cohort records; results summary and revision analysis | Actual observed records; planned target 24 remains in author notes. |
| §3:24 respondents, familiarity, reported completion/time/stuckness | Survey CSV headers and rows; revision-analysis `survey` | Self-report; recruitment, linked task and chronology awaiting confirmation. |
| §3 assistance expectations | Four explicitly anchored 1–5 survey columns | Independent hypothetical ratings, lower helpfulness scores better; not measured robot performance. |
| §4 apparatus/layout | Project documentation and author's confirmed sketch/layout | Opaque wall, top-mounted camera, pickup/drop/assembly positions and laptop confirmed; model/dimensions/photo pending. |
| §4 signal processing | `integrations/watch/watch_core.py:live_arousal_assessment`, `watch.py` | 15s current/60s preceding median, 5bpm threshold, quality and baseline fallback; historical overrides/practice still internal checks. |
| §4 timing and delivery | Explicit author clarification; dashboards and operator code | Scheduled 30 s and adaptive existing flag; content based on arrangement; repeated-flag handling pending. |
| Table1, Figure4, §5.2 | Results summary `primary`; revision-analysis participant averages/tests | Completion coding includes P101 reconstruction; sensitivity in analysis notes. Duration includes failures. |
| Table2, Figure5, §5.3 | Per-round survey fields/composite; checked scoring and participant averaging | NASA-TLX dimensions, seven-point ratings; mean composite reverses performance. |
| Figure6 and correlation paragraph | Revision-analysis rank correlations per condition | N=12 per panel, ties averaged; no significance or causal claims. Workload includes frustration. |
| Table3, Figure7, §5.4 | Assistance-only per-round questionnaire fields | Hints/arm rated together; no significant adaptive-scheduled difference. |
| §5.5 final ratings and quotations; §6 robot-motion quote | Participant final forms; summary `overall`, `nonempty_comments` | Once/person;6 nonempty comments; verbatim excerpts from P101/P103, no formal coding. |
| §6 direct placement future work | Author suggestion and P103 comment about arm movement | Proposed future action, not an executed procedure. |
| Ethics and missing correct-piece outcome | Existing procedure documentation and author requests | Do not invent approval, scoring rules or image-derived scores. |

Inputs were extracted to the gitignored results/survey directories identified in README. Hashes are retained in the revision input manifest and both numerical JSON outputs. Existing source coding is retained; scripts do not adjudicate missing completion labels. Detailed checks are in author notes and supplementary analysis notes.

The 15 literature sources and 21 citation occurrences are unchanged in content. The [reference-to-text map](literature/REFERENCE_TEXT_MAP.md) records every occurrence and 35 checked source anchors; its JSON binds the current manuscript hashes to source PDFs. Neither GuideAI nor AdaptAI is treated as evidence for this experiment.
