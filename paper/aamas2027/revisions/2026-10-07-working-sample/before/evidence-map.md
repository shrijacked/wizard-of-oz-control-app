# Evidence map: current manuscript

Updated 7 October 2026, branch `writing`, base `3c4ddb9`. Internal author material.

| Claim/location | Evidence | Scope and remaining checks |
|---|---|---|
| Abstract and §5.1: N=12, ages/gender, nine trials each | Complete-cohort records; results summary and revision analysis | Actual observed records; planned target 24 remains in author notes. |
| §3:24 respondents, familiarity, reported completion/time/stuckness | Survey CSV headers and rows; revision-analysis `survey` | Self-report; digital timed square tangram, college mailing groups and some overlap confirmed; exact overlap/link/chronology pending. |
| §3 assistance expectations | Four explicitly anchored 1–5 survey columns | Independent hypothetical ratings, lower helpfulness scores better; not measured robot performance. |
| §4 apparatus/layout | Project documentation and author's confirmed sketch/layout | Opaque wall, top-mounted camera, pickup/drop/assembly positions and laptop confirmed; 10×10-inch piece set confirmed; robot model, piece material and photo pending. |
| §4 signal processing | `integrations/watch/watch_core.py:live_arousal_assessment`, `watch.py` | 15s current/60s preceding median, 5bpm threshold, quality and baseline fallback; historical overrides/practice still internal checks. |
| §4 timing and delivery | Explicit author clarification; dashboards and operator code | Scheduled 30 s and adaptive existing flag; content based on arrangement; rapid/sustained repeated flags use a 15-second wait; preset hints and paired robot-plus-hint delivery confirmed. |
| Table1, Figure4, §5.2 | Results summary `primary`; revision-analysis participant averages/tests | Completion coding includes P101 reconstruction; sensitivity in analysis notes. Duration includes failures. |
| Table2, Figure5, §5.3 | Per-round survey fields/composite; checked scoring and participant averaging | NASA-TLX dimensions, seven-point ratings; mean composite reverses performance. |
| Figure6 and correlation paragraph | Revision-analysis rank correlations per condition | N=12 per panel, ties averaged; no significance or causal claims. Workload includes frustration. |
| Table3, Figure7, §5.4 | Assistance-only per-round questionnaire fields | Hints/arm rated together; no significant adaptive-scheduled difference. |
| §5.5 final ratings and quotations; §6 robot-motion quote | Participant final forms; summary `overall`, `nonempty_comments` | Once/person;6 nonempty comments; verbatim excerpts from P101/P103, no formal coding. |
| §6 direct placement future work | Author suggestion and P103 comment about arm movement | Proposed future action, not an executed procedure. |
| Ethics and missing correct-piece outcome | Existing procedure documentation and author requests | Consent twice and no disclosure afterward confirmed; approval remains unknown. Orientation-maximizing rule supplied; image-derived scores still pending. |

Inputs were extracted to the gitignored results/survey directories identified in README. Hashes are retained in the revision input manifest and both numerical JSON outputs. Existing source coding is retained; scripts do not adjudicate missing completion labels. Detailed checks are in author notes and supplementary analysis notes.

The 15 literature sources and 21 citation occurrences are unchanged in content. The [reference-to-text map](literature/REFERENCE_TEXT_MAP.md) records every occurrence and 35 checked source anchors; its JSON binds the current manuscript hashes to source PDFs. Neither GuideAI nor AdaptAI is treated as evidence for this experiment.

## Author-confirmed protocol additions

The 7 October clarification confirms digital square tangram/timer/Google Form, recruitment through college groups and some sample overlap (§3); preset hints and robot-plus-hint pairing, ten-inch square pieces and 15-second handling of rapid/sustained flags (§4); volunteering/coupons, five-minute breaks, seven-piece target-resemblance success and five-minute stops (§5.1); maximizing correct-piece count across two candidate partial-solution orientations (§5.2); consent twice, camera showing only table/hands, and no disclosure of concealed operation during or after participation (§7). These claims come from the author, with consent corroborated by the supplied form screenshot and app workflow, not inferred from related papers.

The three-minute baseline window is temporary; watch.py uses a 60-second calibration. The participant-instruction source mentions researcher-controlled programs, so enacted instruction delivery remains to be reconciled. Institutional review/exemption is unconfirmed. Current source/PDF use the class's anonymous mode with ID 2613. Outcome/graph/reference content is unchanged; citation-map hashes/locations identify the anonymous protocol revision.
