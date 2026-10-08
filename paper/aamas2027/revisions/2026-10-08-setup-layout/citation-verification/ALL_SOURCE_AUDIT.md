# Audit of every active citation — 8 October 2026

All **34 active bibliography entries** have a retained PDF, extracted text, and a claim-level review of the actual paper. A searchable author version supplements Cao's image-based official RSS PDF. This supersedes the earlier 19-new-reference-only scope in `CLAIM_AUDIT.md`.

Scope: title/author/version identification, study design or review scope, the passages supporting our manuscript's claims, and relevant limitations. This is **not** a claim that every page was read, that external datasets were reanalyzed, or that published findings were independently replicated. Page numbers below are one-based PDF pages, including repository covers. Conclusions are paraphrased, not copied abstracts.

`all-source-downloads.json` records the original public URLs, local page counts, file sizes and SHA-256 hashes. `pages/` contains page-indexed text. All 34 canonical files were re-opened and parsed in this audit; 13 older sources were freshly retrieved. For Karbouj and Yang, fresh requests failed (TLS certificate chain and a non-PDF response respectively); exact previously downloaded public-source PDFs were recovered with hashes matched to their original provenance. No access control or TLS validation was bypassed. The 19 already downloaded new sources were retained and rechecked, not falsely described as 19 fresh downloads.

## Assistance timing and coordination

### andriella2025 — Bayesian assistance learning

[PDF](andriella2025.pdf). Checked pages 1, 18, 25, 32. A two-phase influence-diagram architecture selects assistance using profiles and memory-game state. The analyzed evaluation includes 54 participants. Proactive support improves task performance relative to the comparison, but perceived differences against random assistance are not uniformly supported. Supports our description of learning assistance type/timing/confidence, not a universal claim that proactive assistance is preferred. Publisher PDF; online-first date and journal-year distinctions retained.

### delazzari2025 — PACE

[PDF](delazzari2025.pdf). Checked pages 1–2, 8. Twelve participants evaluate proactive coordination based on hand-motion/action-completion estimates. The explicit-query comparator shows longer human waiting than the proactive policies. Subjective outcomes are not uniformly strongest for the full PACE variant. Supports the waiting-time distinction and action-progress approach, not cardiac adaptation or a general superiority claim. MERL author/technical-report copy identifies the conference paper and DOI; its cover counts as PDF page 1.

### karbouj2026 — Adaptive HRC review

[PDF](karbouj2026.pdf). Checked pages 1–2, 21. Review of 124 publications distinguishes motion adaptation from task/control-level adaptation and identifies less-covered timing, synchronization and role-allocation questions. It is an evidence map, not a new efficacy trial. Supports task-level adaptation beyond robot motion. Published version: 2026 journal issue, with first-publication information in late 2025; DOI year alone is not the bibliographic year. Hash-verified cached public PDF used after fresh TLS failure.

### ramnauth2026 — Appropriateness of helping

[PDF](ramnauth2026.pdf). Checked pages 1, 8, 13, 22. The framework relates assistance utility and recipient cost to relative skills and task parallelizability. Evaluation comprises 215 online participants judging vignettes, not receiving live robot assistance. Supports the appropriateness factors while retaining that evaluation boundary. Rapport, negotiation and contextual differences limit direct transfer to our live timing comparison.

### lavitnicora2024 — Gaze and joint-action initiation

[PDF](lavitnicora2024.pdf). Checked pages 1, 6, 8–9. Assembly gaze analysis uses 37 participants; an automatic-initiation pilot uses ten volunteers. Gaze can indicate readiness for joint action, but early activations also occur. Readiness to coordinate is not equivalent to needing a hint. Publisher PDF. Cohort descriptions and authors overlap with related assembly work; separate papers are not asserted to be independent replications.

### tanneberg2024 — Attentive Support

[PDF](tanneberg2024.pdf). Checked pages 1, 3, 5–7. Scene perception, dialogue and LLM reasoning inform whether and how a physical robot should intervene or stay unobtrusive. Evaluation uses constructed interaction situations and a robot demonstration. This is not a controlled participant comparison establishing reduced workload. Our manuscript preserves that distinction. Author manuscript; publication identification is kept separate from the contents of the retrieved version.

### andriella2025mentalising — Mentalising assistance

[PDF](andriella2025mentalising.pdf). Checked pages 1, 5, 11–14. A separate memory-game architecture combines mentalising with Q-learning; 56 participants are analyzed. Reported performance and assistance acceptance improve. The authors acknowledge explanation-detail confounding and do not directly measure trust; assistance timing is fixed. Supports benefits of this architecture, not an isolated timing effect. Distinct paper and cohort from the 54-person Bayesian study.

### vitry2026 — Initiative in an escape room

[PDF](vitry2026.pdf). Checked pages 1, 3–5. Analysis uses 56 participant records in 28 pairs, with assignment at pair level. Proactivity increases interaction frequency, without a significant overall performance advantage. Both interaction models provide scheduled hints; therefore the comparison is not proactive hints versus no hints. Downloaded v2 title page confirms **Kieran von Valeburg**, correcting the fetched BibTeX. Final IEEE archival DOI/pagination were not independently confirmed and are not invented.

### candon2023 — Feedback reminders

[PDF](candon2023.pdf). Checked pages 1, 3, 5–8. A 71-participant, 2×2 Space Invaders study manipulates reminder framing and before/after timing relative to robot behavior changes. Before reminders elicit faster and more feedback within the immediate ten-second window; the whole-game timing effect is nonsignificant. Supports a local feedback-solicitation timing effect, not physiological task-help efficacy. Embedded fonts impair some extraction; Poppler text and surrounding methods/results were checked rather than treating corrupted glyphs as evidence.

### cao2025 — User-initiated interruptions

[Official PDF](cao2025.pdf); [searchable author version](cao2025-author.pdf). Official pages 5 and 7 were visually inspected; title/author/DOI identification also checked against the RSS record. Twenty-one participants perform timed decision-making and discussion tasks. Exploratory analyses associate unsuccessful interruption handling with lower inclusion and satisfaction. No alternative handling condition establishes causality. Canonical PDF contains image-based pages; the author text supplements, rather than replaces, the official-paper check.

## Physiological information and workload

### yang2024 — Workload-adaptive surgical suction

[PDF](yang2024.pdf). Checked pages 1–2, 8–9, 12–13. One experiment develops an EEG/eye-tracking workload model; another compares adaptive and periodic suction in a simulated surgical task. The periodic interval is 150 seconds, calibrated to approximate earlier adaptive assistance frequency. The manuscript's timing-comparison motivation is supported, but our HR-rise flag is not the same multimodal workload model. Training and simulation do not establish clinical efficacy. Public-access author manuscript identifies the final 2024 Human Factors volume/pages/DOI; exact cached copy recovered after the fresh request failed.

### teo2018 — Closed-loop robot aid

[PDF](teo2018.pdf). Checked pages 1, 3–4, 6. Individual low/high-workload baselines identify sensitive physiological markers; a rolling-window, debounced index triggers aid during simulated robot supervision. If adaptive aid has not triggered by ten minutes, aid is imposed later. Supports individualized closed-loop aid and the later-imposed comparator, not an HR-only threshold or a periodic intervention every fixed short interval. Online publication in 2017 and volume publication in 2018 are distinguished.

### hostettler2025 — Adaptive industrial robot

[PDF](hostettler2025.pdf). Checked pages 1, 5–8, 12. Sixteen participants evaluate robot behavior that adapts to user distance. Pupil responses and subjective experience are measured, but pupil-driven adaptation is a future direction. Supports distance-based behavior adaptation with physiological outcome measurement; it must not be cited as an already deployed pupil-triggered assistance system. Subjective and physiological measures are not interchangeable.

### ojstersek2024 — Personalized workplace parameters

[PDF](ojstersek2024.pdf). Checked pages 1, 3–4, 14. A preliminary skills test personalizes robot movement parameters across utilization scenarios. ECG recordings are transferred to analysis software at the end of the experiment. Supports pre-task personalization and offline cardiac analysis, not online physiological triggering. The workplace-specific performance findings do not validate our tangram timing policy.

### korivand2024 — Task-load prediction and Q-learning

[PDF](korivand2024.pdf). Checked pages 1, 8, 11, 15–16, 18. Physiological data support task-performance/load prediction, and Q-learning models adjustment of robot speed/temporal demand. The limitations explicitly state that the recorded wristband data could not be integrated directly in real time. Supports an adaptation framework with that deployment limitation, not a completed online cardiac-control validation. The framework is evaluated for a particular quality-control task and has limited generalizability.

### shukla2026 — GuideAI

[PDF](shukla2026.pdf). Checked pages 1–2, 6, 9. The educational system combines HRV, gaze and behavior to modify explanations, pacing, feedback and breaks. A preliminary within-participant comparison uses 25 participants and an unpersonalized LLM control. Supports multisensory educational adaptation, not a robotic timing-policy replication. Accepted-paper author version identifies IUI 2026 and its DOI. Its ethics practices and instrument choices cannot be borrowed as facts about our own study.

### wei2025 — Surgical performance prediction case study

[PDF](wei2025.pdf). Checked pages 1–2, 5. One expert surgeon performs simulated tasks under varied noise, posture and task conditions. Model interpretation highlights subjective workload, mean HR and muscle activity among influential predictors. Supports the named predictive features, not causal effects of HR, population-wide predictive validity, or adaptive-assistance benefits. Single-person and model-specific interpretation qualifications retained.

### prajod2024 — Flow and perceived challenge

[PDF](prajod2024.pdf). Checked pages 1, 6–9. Assembly conditions vary pacing; ECG-HRV and facial data support offline perceived-challenge analysis with leave-one-subject-out evaluation. Crucially, adaptive robot delivery is triggered by a Wizard-of-Oz judgment that the participant is nearly finished, not by physiology. Supports the measurement approach without conflating it with our live HR-rise trigger. ECG-quality exclusions and possible cohort overlap limit simplistic cross-paper comparisons.

### bhagatsmith2026 — Unknown-task workload estimation

[PDF](bhagatsmith2026.pdf). Checked pages 1, 4, 6, 10–12. This survey examines distribution shift and assesses learning approaches by portability, complexity and adaptability. Domain generalization and few-shot learning are proposed as promising directions requiring empirical investigation. Supports the portability caution, not a newly validated workload classifier or assistance trigger. Publisher review, not a participant trial.

### pereira2025 — Physiological workload review

[PDF](pereira2025.pdf). Checked pages 1, 9, 14–15, 18. Systematic review selects 25 papers from an initial 413 and documents diverse tasks, physiological features and subjective/performance measures. Cardiac measures differ across studies; they do not justify equating any HR rise with workload or stress. Supports the heterogeneity/mixed-cardiac-evidence framing. Not a pooled efficacy estimate for our intervention.

### capponi2024 — Assembly complexity and physiology

[PDF](capponi2024.pdf). Checked pages 1, 3–6, 8, 13–14. Eighteen engineering students perform manual/collaborative assembly at different complexities. EDA and eye measures reveal patterns, whereas RMSSD does not show a clear trend across configurations. Cognitive effort and stress are not equivalent constructs. Supports our caution about cardiac interpretation; small, inexperienced student sample and learning/context effects constrain generalization.

### quigley2024 — Cardiac measurement guidelines

[PDF](quigley2024.pdf). Checked pages 1, 7–9. Guidelines distinguish HR, heart period and beat-to-beat variability; discuss ECG/PPG acquisition, movement, contact/pressure and site-dependent effects. Supports signal-quality and physical-activity caveats for our wrist sensor. It does **not** validate a +5-bpm threshold as a stress detector, an intervention threshold, or an equivalent HRV measure. Publisher guideline, not an assistance experiment.

### hart2006 — NASA-TLX retrospective review

[PDF](hart2006.pdf). Checked pages 1, 3. Describes six workload dimensions, the original weighting procedure and unweighted averaging/summing variants. Also cautions about modifications and sensitivity. Supports the six dimensions and unweighted-score rationale, but not psychometric equivalence of our modified 1–7 instrument to standard weighted NASA-TLX. The paper explicitly labels our score adapted and explains reversal/rescaling. NASA-hosted author copy; optional bibliographic page fields remain a final author check.

## Physical tasks and participant experience

### tabatabaei2025 — Gaze around tangram robot failures

[PDF](tabatabaei2025.pdf). Checked pages 1, 3–5, 8. Twenty-seven recruited participants collaborate with a mobile manipulator on tangrams while executional/decisional failures, timing and acknowledgement are manipulated. Gaze and perceptions are analyzed, with missing data noted. Supports tangrams as a physical collaborative HRI task, not evidence that our assistance improves performance. Retrieved arXiv v1; failures and direct placement differ from our piece retrieval.

### melo2026 — SensCogAR

[PDF](melo2026.pdf). Checked pages 1, 7, 12, 15. Tangram contour visibility varies assembly demand. Twenty-four participants are recruited, 23 remain initially, and sensor-specific missingness further affects analyses. Movement-based classifiers outperform the physiological-only classifiers in this setting, using participant-held-out evaluation. Supports the task-demand manipulation and assembly analogy, not live workload-adaptive robot intervention. Publisher article; exact sensor/model cohorts should not be collapsed into a single nominal N.

### caiazzo2024 — Preliminary assembly workload comparison

[PDF](caiazzo2024.pdf). Checked pages 2, 4, 9. Three participants perform manual, robot-collaborative and guided-collaborative assembly; EEG ratios and production measures are compared. The authors explicitly call for more participants/statistical validation. Our text now labels it a **preliminary three-participant study**. Supports the task/measurement comparison, not a robust efficacy conclusion. University-hosted manuscript has a repository/social-platform cover; cover metadata alone was not treated as evidence.

### zhao2025 — MRChaos

[PDF](zhao2025.pdf). Checked pages 1, 4, 6. Robot assembly policies are trained in simulation and evaluated on physical tangram targets; extensions include cutlery and soda-can arrangements. Supports reasoning/planning/manipulation and the transfer-task examples. There is no participant-assistance evaluation establishing cognitive or experiential benefits. Author preprint; robotic coverage/success metrics are not imported into our human outcome analysis.

### cavicchi2025 — Cognitive offloading review

[PDF](cavicchi2025.pdf). Checked pages 1, 3–4, 8. Narrative review examines humanoid robots in cognitive-conflict settings. Social cues can interfere with cognition; delegation of part of the main task is recommended as an offloading strategy. Supports these design cautions, not a quantitative efficacy meta-analysis. Effects depend on task and interaction; retrieval alone is not demonstrated to offload spatial reasoning in our study.

### vandijk2023 — Autonomy and robot work pace

[PDF](vandijk2023.pdf). Checked pages 1–3, 5, 7. Twenty participants perform assembly with human-led and robot-led pacing. Human-led control lowers five workload dimensions; slower pacing lowers mental and temporal demand. Pacing changes movement onset, while robot movement speed stays constant. Supports autonomy/pacing distinctions, not a velocity-change or physiological-timing experiment. Task-load differences and task-specific generalization limitations retained.

### varrasi2026 — Human versus robot guidance across age groups

[PDF](varrasi2026.pdf). Checked pages 2, 4, 6, 11. Sixty adults (30 younger, 30 older) complete a modified Trail Making Test with human/robot guidance. Older adults report higher workload with robot than human guidance; the younger-group difference is nonsignificant. Supports age-sensitive interpretation, not a general claim that robot assistance lowers workload. Published copy obtained through the university repository, with its cover included in local pagination.

### smit2024 — Collaborative order picking

[PDF](smit2024.pdf). Checked pages 1, 6, 8. A discrete-event simulation and multi-objective reinforcement learning optimize human-AMR picking efficiency and fairness. Workload is accumulated lifted-product mass, and fairness concerns its distribution across pickers—not TLX or physiological stress. Supports material-provision/coordination analogies with that explicit measure distinction. Retrieved preprint status retained; no human intervention trial is inferred.

### tanjim2025 — Robot communication in action teams

[PDF](tanjim2025.pdf). Checked pages 1, 3–5. Eighty-four participants take part in 26 simulated medical-team sessions. A Wizard-of-Oz crash cart compares verbal object-search/visual-reminder cues, reversed cues, and no feedback. The former combination improves reported workload, usefulness and ease in this setting. Supports modality-sensitive assistance design, not clinical effectiveness or physiological adaptation. Repeated team sessions and simulation context limit direct comparison to our individual puzzle task. Downloaded v3 author list matches the citation.

## Wizard-of-Oz methodology

### thunberg2026 — Wizard experiences

[PDF](thunberg2026.pdf). Checked pages 1–3. HRI Companion workshop proposal foregrounds ethical, practical, methodological and personal tensions experienced by wizards and proposes participatory discussion. Supports the methodological concern, not findings from a new completed user trial. Venue, five authors and DOI are shown in the downloaded three-page author copy.

### bejarano2024 — Robot-control hardships

[PDF](bejarano2024.pdf). Checked pages 1–5. Interviews with six HRI researchers identify operator expertise/response-processing, robot delays, participant unpredictability and control-precision challenges. Comparison with real-world teleoperation is interpretive, not a new sample of real-world teleoperators. Supports operator/interface constraints in our study, not empirical proof that our delivery was consistent.

## Verification decisions and remaining boundaries

- All 34 manuscript citation keys occur in the bibliography and download manifest. The retained versions are sufficient to check the claims above; that does not certify the latest archival version of every preprint.
- Corrected the Vitry author name; clarified Smit's lifted-mass workload and Caiazzo's preliminary N=3 design. Preserved important offline/online, prediction/intervention, simulation/clinical, vignette/live and review/experiment distinctions.
- No reviewed source validates this study's HR-rise threshold, provides ethics approval for this study, or resolves its scoring-reliability limitations.
- Numerical results in our Findings come from our participant analysis, not from cited-paper effect sizes. Our primary completion cohort now contains all 24 participants following the researcher's confirmation with P101; this is an independent data-provenance change, not a consequence of literature review.
- Optional reference fields and unconfirmed final archival metadata remain author checks; Hart's publisher-confirmed904–908 page range has now been added. Researcher confirms no committee review took place; institutional/venue ethics requirements, scoring tolerance and independent scorer agreement remain author checks. See REFERENCE_AND_POLICY_STATUS.md for the current status and recency counts.
