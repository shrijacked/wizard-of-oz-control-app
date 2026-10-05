# Evidence map

Repository inspected: `modi5`, `cd1aa9d71032cd81bc1da8e195a086bd7471212f`. Application code was read but not changed. This map is internal author material, not part of the anonymized submission.

| Manuscript statement | Evidence | What remains to establish |
|---|---|---|
| 24 participants | Submitted abstract supplied by user | Recruited/completed/analyzed count and exclusions |
| Five-minute puzzle limit | User confirmation during this chat; `config/study.json` agrees | Timeout practice and any deviations |
| Orangewood robot | User clarification | Exact model, end effector, physical action and safety setup |
| Recruitment/profile questions | User-linked public Google Form, inspected read-only | Responses, actual inclusion/exclusion, recording practice |
| Initial expected efficacy | `public/subject.html`, `src/surveys.js` | Deployed questionnaire version |
| Nine puzzles; three sittings; three conditions | `src/study-design.js`, `config/study.json` | Actual session completeness |
| Six condition-order permutations, manual override | `src/study-design.js` | Realized allocation counts; overrides |
| Seeded global puzzle shuffle | `src/study-design.js` | Realized puzzle-by-condition distribution; difficulty matching is not established |
| Three coordinated browser screens | `README.md`, `docs/architecture.md`, `src/create-app.js`, `public/admin.js`, `public/subject.js`, `public/robot.js` | Actual hardware configuration and operator positioning |
| Seven piece-to-program mappings | `config/study.json` | Robot program trajectories are not in this code |
| Robot brings a piece | Mentor screenshot note; fixed program cues in code | Delivery location, orientation, whether any placement assistance occurs |
| On-screen hints and notification sounds | `public/subject.js`, `public/audio-cue.mjs`, `config/study.json` | Which presets/free-text hints were used; text/movement pairing |
| 30-second scheduled reminder default | `config/study.json`, `public/admin.js` around line 1270 | Actual interval and compliance with reminders |
| HR-based arousal cue, human decision | `integrations/watch/watch_core.py`, `integrations/watch/watch.py`, `src/adaptive-engine.js`, `public/admin.js` | Actual human decision protocol and threshold settings |
| 15-second current / prior 60-second reference; 5-bpm rise | `live_arousal_assessment` in `watch_core.py`; defaults in `watch.py` | Environment overrides, deployed revision, per-participant calibration |
| Signal checks and baseline reuse | `watch_core.py`; `watch.py` baseline load/calibration functions | Actual fresh-baseline workflow and signal failures |
| Six workload + four assistance-specific items | `public/subject.js`, `src/surveys.js` | Whether earlier collection used a different questionnaire |
| Overall trust once at end | `FINAL` in `public/subject.js` | Any separate external condition-specific trust measure |
| Pauses excluded in ordinary round completion | `src/store.js`, complete-round path | Early-end paths and timing convention in actual exports |
| Raw events and watch capture | `src/store.js`, `src/watch-bridge.js`, `watch.py`, architecture docs | Completeness, timestamp consistency, execution corroboration |
| Optional LLM advisor | `src/llm-advisor.js`, README runtime options | Whether enabled in the experiment; omitted as an actual study component until confirmed |

## Main literature links and scope

- [Yang et al., adaptive suction](https://doi.org/10.1177/00187208221129940): direct adaptive-versus-periodic surgical precedent, published online in 2022 and in the 2024 Human Factors issue. Periodic interval was 150 seconds to approximate prior observed assistance frequency. This is a multisensing workload system (EEG and gaze), **not a precedent validating a 5-bpm wrist-HR rule**. See the [author manuscript](https://pmc.ncbi.nlm.nih.gov/articles/PMC11558698/) for the experimental-design and procedure passages.
- [Teo et al.](https://doi.org/10.1016/j.apergo.2017.07.007): individualized physiological closed-loop aid versus imposed aid; not a surgical tangram study.
- [Luo et al.](https://doi.org/10.1016/j.aap.2020.105968): workload-adaptive haptic driving support; workload inferred from gaze, not heart rate.
- [Parasuraman et al.](https://doi.org/10.1109/3468.844354) and [Newman et al.](https://doi.org/10.3389/frobt.2021.720319): automation functions and assistance timing as design dimensions.
- [Hopko et al., assistance levels](https://doi.org/10.1109/LRA.2021.3062787): polishing task; performance and attention/engagement are distinct outcomes.
- [Delliaux et al.](https://doi.org/10.3389/fphys.2019.00565), [Kim et al.](https://doi.org/10.30773/pi.2017.08.17), and [Hopko et al., trust](https://doi.org/10.1016/j.apergo.2022.103863): cardiac-state evidence with different measures, contexts, and confounds. Do not treat HR and HRV as interchangeable or validate the current threshold by citation alone.
- [Hancock et al.](https://doi.org/10.1177/0018720811417254) and [Verhagen et al.](https://doi.org/10.3389/frobt.2022.993997): robot performance, communication, trust and teamwork. They motivate attention to experience; they do not make the present single items validated multi-item scales.
- [Andriella et al.](https://doi.org/10.1007/s11257-024-09421-1) and [PACE](https://doi.org/10.1109/ICRA55743.2025.11127399): recent proactive assistance approaches using task-related information.
- [Riek](https://doi.org/10.5898/JHRI.1.1.Riek) and [Yang et al., 2026 WoZ review](https://doi.org/10.1145/3772318.3791174): operator transparency and methodological reporting.
- [Hart and Staveland](https://doi.org/10.1016/S0166-4115(08)62386-9): original NASA-TLX; the present items are seven-point adaptations.
- [Hirth et al.](https://www.dfki.de/fileadmin/user_upload/import/6351_Hirth2012.pdf): prior physical tangram HRI scenario, so avoid a claim of first use of tangrams in HRI.
- AdaptAI and GuideAI: the supplied local PDFs were read for conceptual framing and paper structure; neither is cited or discussed in the manuscript, following the author’s explicit instruction. Their formative data, participant samples, model architectures, and results were not transferred into this study.

## Supplied synthesis audit

All ten named reference families in the user's follow-up are represented in the 18-reference first draft after identification against source records. The surgical comparison is additionally grounded in Yang et al. The supplied synthesis is a useful organizing aid, not an independent authority for paper-specific methods or results.

Claims softened or excluded: a single physiological threshold as an accurate detector; a standardized fixed-only hint policy (the app permits researcher input); condition-specific trust/automation-bias results; a pure timing effect without equal assistance exposure; participant preference or formative findings without responses. “Few studies” and broad claims of absent research were replaced with a specific description of the comparison, because this first literature pass is not a systematic review establishing absence.
