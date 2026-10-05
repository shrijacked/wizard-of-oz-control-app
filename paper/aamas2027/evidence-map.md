# Evidence map — active manuscript

Updated 5 October 2026, branch `writing`, base `caea038`. Internal author material. Code demonstrates implementation; session records demonstrate recorded use; neither alone establishes all aspects of the actual experiment. Earlier source review used `modi5` at `cd1aa9d`; this table supersedes its participant and writing-status assumptions.

## Study and numerical claims

Paths are relative to the repository root unless linked. The current snapshot root is `data/writing-reference/hti-results-2026-10-05/`.

| Claim / paper location | Source | Limit or required follow-up |
|---|---|---|
| Target N=24; ongoing collection, abstract/§5.1 | Explicit author clarification in this task | Recruitment and sample-size rationale still needed |
| Nine complete participants; tenth has five completed rounds | Snapshot `relevant-files/consolidated-data.json`, participant raw session records; [summary](analysis/interim-summary.json) | P111 counter is stale; count finished rounds |
| Complete sample 81 rounds, 27 per condition | Summary cohort checks; [summary script](../../scripts/summarize-writing-results.py) | P108–P110 provisional exports |
| Table 1 completion/rate/duration; §5.2 | Summary `primary`, `recorded_only`, `available_rounds`; source outcome provenance | P101 completion inference explicitly retained; duration includes unsuccessful attempts |
| P101 alternative adaptive coding | Source R9 ambiguity; 13+1 adaptive successes / 27 | Sensitivity, not adjudication |
| Six realized orders and uneven puzzle allocation | Summary `condition_order_counts`, `primary.*.puzzle_counts` | Manual overrides/difficulty matching not established |
| Intervention amounts | Summary hint and robot-cue totals | Cues are commands, not verified physical completion |
| Table 2 workload and composite | Summary `primary.*.survey`, `tlxMean`; source per-round questionnaire responses | Seven-point adaptation, performance reversed before mean; no weighting |
| Table 3 intervention ratings | Same summary, assistance-only fields | No control responses; hints and robot actions rated together |
| §5.5 final ratings, five written comments | Summary `overall`, `nonempty_comments`; source participant `final` objects | One questionnaire/person; comments not thematically coded |
| Five-minute intended limit | Author confirmation; `config/study.json` | Actual records can exceed 300 s; timeout practice unresolved |
| Separate survey pending; photo scores pending | Explicit author clarification | No survey or correct-piece findings available |

The summary records its exact consolidated-source SHA-256. The original archive hash and restoration instructions are in [README.md](README.md). The bundled `relevant-files/analysis/reproduce-analysis.mjs` provides an independent route to its original descriptive summaries. Neither analysis routine supplies a final repeated-measures model.

## Methods and implementation claims

| Claim | Evidence | What remains to establish |
|---|---|---|
| Three blocks × three puzzles, six condition permutations, seeded puzzle shuffle | `src/study-design.js`, `config/study.json`, realized session records | Overrides and collection chronology |
| Three coordinated interfaces and event logging | `docs/architecture.md`, `src/create-app.js`, `public/admin.js`, `public/subject.js`, `public/robot.js`, `src/store.js` | Actual physical positioning |
| Orangewood arm, Maxim H Band, Logitech C270 | Existing project apparatus documentation and team description | Exact robot model, dimensions, deployed hardware and setup photo |
| Seven piece/program mappings | `config/study.json`; team note that robot brings a piece | Program trajectories and actual delivery/orientation behavior |
| Hints, notification sounds and control restrictions | `public/subject.js`, `public/audio-cue.mjs`, `public/admin.js`, `config/study.json` | Preset/free-text use and pairing with movement |
| 30-second scheduled reminder default | `config/study.json`, `public/admin.js` | Actual reminders/settings and researcher compliance |
| Human interpretation of physiological cue | `integrations/watch/watch_core.py`, `integrations/watch/watch.py`, `src/adaptive-engine.js`, dashboard | Standardized operator rule, if one existed |
| 15/60-second windows and 5-bpm rise default | `live_arousal_assessment` and watch configuration | Environment overrides and historical deployment |
| Signal filters, quality indicators and baseline fallback | Watch collector and calibration/baseline code | Actual calibration, missing signals, reuse and reliability |
| Workload, intervention and final questions | `public/subject.js`, `src/surveys.js`; [questionnaire inventory](questionnaire-inventory.md) | Historical versions if different from bundled snapshots |
| Consent/acknowledgement, stop instructions and pauses | Participant interface and `docs/participant-script.md` | Actual consent, approval/exemption, debriefing and safety practice |
| Pause-adjusted ordinary completion duration | `src/store.js`, source completed-round exports | Early-end paths and late-success criteria |
| Optional LLM capability, omitted as an enacted component | `src/llm-advisor.js` and runtime options | Whether enabled; do not assume either used or unused |

The bundle's four study-definition snapshots match the corresponding current files. This corroborates those copies, not every historical protocol setting.

## Literature claims

Use [MANUSCRIPT_REFERENCE_AUDIT.md](literature/MANUSCRIPT_REFERENCE_AUDIT.md) for the active 15 citations, relevant PDF pages, bounded claims and limitations. Its JSON records downloaded versions, source URLs and hashes. The manuscript bibliography is restricted to those entries; the historical literature register includes additional sources and unread leads.

The strongest methodological distinctions checked against paper text are: Yang's adaptive/periodic surgical comparison predates its 2024 issue; Teo uses individualized physiological aid thresholds; Hostettler adapts to distance while measuring pupils; Ojsteršek's ECG is analyzed after collection; Korivand reports a real-time wrist-data integration limit; Hart describes six TLX dimensions and cautions about adapted instruments. None validates the present 5-bpm rule.

No broad absence-of-prior-work claim, condition-specific trust claim, physiological stress diagnosis, invented participant quote, formative finding, correct-piece score, or statistical significance has been imported into the manuscript. AdaptAI and GuideAI supplied structural examples only.
