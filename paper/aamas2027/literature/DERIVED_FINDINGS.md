# Findings derived from downloaded and reviewed papers

Current expansion: see [7 October downloaded-PDF reading record](NEW_SOURCE_REVIEW_2026-10-07.md) and [current reference text map](REFERENCE_TEXT_MAP.md). The historical counts below describe the 5 October review. Five additional sources are now cited; AdaptAI was read only for presentation.

Prepared 5 October 2026 from the preserved full-text audits. **Eligibility: a PDF was downloaded and its relevant text reviewed.** All 14 eligible papers are included below. Online-only reading, abstracts, and search leads are excluded from this findings document, even where their metadata appears in the [reading register](READING_REGISTER.md).

Each entry separates what the source reports from our interpretation for this paper. Page numbers refer to the exact saved PDF version identified in [download provenance](download_provenance.json); they are not necessarily journal page numbers. The audits checked selected relevant passages, not every claim in every paper. These literature findings do not independently establish our experimental results.

## 1. Tabatabaei et al. — Gazing at Failure

[Publication](https://doi.org/10.1109/HRI61500.2025.10973935). HRI 2025; proceedings date 4 March 2025. Reviewed version: accepted-paper arXiv v1, 11 pages.

- **Source location:** Section III-A, PDF p. 3; Section V-C, p. 8.
- **Source evidence:** The human and robot collaborate on seven-piece tangrams with target positions and orientations. The discussion describes participants reasoning about their next piece placement. The study examines gaze around robot failures.
- **Derived for our paper:** Recent HRI precedent supports using tangrams as a physical collaborative placement task. Describing our task as combining spatial reasoning and manipulation is a design interpretation grounded in these task properties.
- **Limit:** It does not compare scheduled and physiological assistance, validate industrial transfer, or show tangrams to be uniquely suitable.

## 2. Hostettler et al. — Real-Time Adaptive Industrial Robots

[Publication](https://doi.org/10.1145/3706598.3713889). Online 25 April 2025; CHI proceedings dated 26 April 2025. Reviewed version: final CHI paper, 16 pages.

- **Source location:** Section 3, pp. 4–5; Section 3.2, pp. 6–7; Section 3.4, pp. 8–11; Section 4.1, p. 12.
- **Source evidence:** Distance drives robot adaptation during Lego assembly/handovers. Pupil measurements evaluate responses; direct pupil-triggered adaptation is proposed as future work. The physiological main effect is not uniformly significant; findings depend on particular interactions/events.
- **Derived for our paper:** Adaptive robot behavior is established, and physiological measures may be evaluation outcomes rather than control inputs. Our related-work comparison must identify which role physiology plays.
- **Limit:** Do not cite this as a demonstrated physiology-triggered assistance policy or claim physiological monitoring itself improved outcomes.

## 3. Capponi et al. — Assembly complexity and physiological response

[Publication](https://doi.org/10.1016/j.rcim.2024.102789). October 2024 issue; exact first-online date unverified. Reviewed version: published paper, 16 pages.

- **Source location:** Sections 3.1–3.4, pp. 3–6; Section 4.2, p. 8; Sections 5–6, pp. 11–14.
- **Source evidence:** Manual and collaborative assembly are compared across complexity levels using cardiac, electrodermal and eye measures. RMSSD differences are nonsignificant and SDNN does not show a uniform trend. Physiological adaptation is discussed as a future direction.
- **Derived for our paper:** Physiological monitoring during assembly is established background. Mixed cardiac findings justify cautious interpretation of our heart-rate cue rather than treating it as a direct reading of assistance need.
- **Limit:** This paper does not validate our wearable, threshold, or adaptive policy, and does not establish an advantage of adaptive over scheduled help.

## 4. Andriella et al. — A Bayesian framework for learning proactive robot behaviour

[Publication](https://doi.org/10.1007/s11257-024-09421-1). Online 26 December 2024; March 2025 issue. Reviewed version: published journal PDF, 43 pages.

- **Source location:** Sections 5.1.2 and 6–8, especially pp. 16–17 and 23–34; broader task/model checks at pp. 8–12.
- **Source evidence:** Assistance type, timing and confidence are learned from user profiles and game state. The final Furhat memory-game comparison includes 54 analysed participants and compares learned proactive behavior with randomly selected assistance. Score/error outcomes improve, while perceived social intelligence/proactivity differences are nonsignificant.
- **Derived for our paper:** Deciding when and how to help is established HRI research. Our comparison differs in its physiological/task-context inputs, scheduled baseline and physical spatial task.
- **Limit:** It is not a physiological-versus-scheduled trial. Do not infer a general improvement across subjective outcomes from the performance findings.

## 5. Karbouj et al. — Adaptive Robotic Behavior in Industrial HRC: systematic review

[Publication](https://doi.org/10.1109/ACCESS.2025.3649702). First publication 30 December 2025; current version 5 January 2026; IEEE Access volume 14 (2026). Reviewed version: published PDF, 25 pages.

- **Source location:** Review scope, pp. 1–4; taxonomy/gap synthesis, pp. 13–16; limitations, p. 21.
- **Source evidence:** The review covers 124 publications from 2018–2024. Its synthesis emphasizes motion adaptation relative to task-level timing, sequencing and role allocation, and identifies transfer/comparability limitations.
- **Derived for our paper:** Provides context for studying task-level assistance decisions and clearly describing adaptation inputs, outputs and evaluation conditions.
- **Limit:** Its search cutoff does not establish what all 2025–2026 work covers. A relative research emphasis is not proof that our particular comparison is absent.

## 6. Pereira et al. — Capturing Mental Workload Through Physiological Sensors in HRC

[Publication](https://doi.org/10.3390/app15063317). Published 18 March 2025. Reviewed version: published PDF, 26 pages.

- **Source location:** Cardiac-measure synthesis, pp. 13–15; Sections 4–5, pp. 18–21.
- **Source evidence:** Reviews 25 physiological workload-assessment studies in HRC, with heterogeneous workload definitions, measurements and cardiac findings.
- **Derived for our paper:** Physiological workload assessment is established; this supports careful terminology and contextual interpretation of heart-rate information.
- **Limit:** The review does not validate our sensor or threshold and cannot turn heart-rate rise into a specific diagnosis of stress, frustration or need for help.

## 7. Korivand et al. — Q-Learning-Based Task Load Adjustment and Physiological Data Analysis

[Publication](https://doi.org/10.3390/s24092817). Published 28 April 2024. Reviewed version: published PDF, 21 pages.

- **Source location:** Sections 4.3, 5.5 and 6, pp. 8 and 15–18; task/method context, pp. 1–8. Page 18 also visually checked.
- **Source evidence:** Physiological signals are collected during robotic quality inspection with 22 participants to develop task-load classification and Q-learning speed adjustment. Section 6 states that recorded wristband data could not be integrated directly for real-time operation.
- **Derived for our paper:** Relevant to the progression from sensing to adaptation, while distinguishing offline models from evaluated online assistance. It helps define what our researcher-mediated implementation actually does.
- **Limit:** Do not describe it as a completed online physiological-feedback user trial, or equate classification accuracy with an equivalent gain in task performance.

## 8. Ojsteršek et al. — Personalizing Human–Robot Workplace Parameters

[Publication](https://doi.org/10.3390/machines12080546). Published 11 August 2024. Reviewed version: published PDF, 16 pages.

- **Source location:** Sections 2.1–2.2 and 3.1–3.2, pp. 3–4 and 6–9.
- **Source evidence:** Nineteen participants complete assembly under low, high and individually adjusted robot settings. A preliminary skills test informs personalization; ECG is transferred for analysis after the experiment.
- **Derived for our paper:** Personalized robot pacing is prior work. Distinguish capacity-based parameter setting from discrete assistance triggered by current physiology and observed task progress.
- **Limit:** Physiological recording does not make this a live physiology-driven policy, and personalized pacing is not the same intervention as hints or part-delivery assistance.

## 9. Singh et al. — Neuroadaptation in Physical Human-Robot Collaboration

[Preprint](https://arxiv.org/abs/2310.00351). Posted 30 September 2023; peer-reviewed publication not verified. Reviewed version: arXiv PDF, 10 pages.

- **Source location:** Sections II–IV, pp. 2–4 and 8–9; introductory framing, p. 1.
- **Source evidence:** EEG-driven reinforcement learning adapts robot damping in a closed-loop versus open-loop physical interaction comparison. Fourteen participants are reported, with two excluded from EEG analysis.
- **Derived for our paper:** Physiological closed-loop robot adaptation predates our study. Specify the distinction between adapting robot control and choosing when to provide discrete problem-solving assistance.
- **Limit:** Different sensor, task and control variable; it does not predict our scheduled-versus-adaptive results. Retain its preprint label.

## 10. Melo et al. — SensCogAR

[Publication](https://doi.org/10.60401/ijabc.147). 2026 journal publication; released on J-STAGE 13 April 2026. Reviewed version: published PDF, 20 pages.

- **Source location:** Sections 4.1–4.3 and 5.1, pp. 7–11, especially Section 4.2, p. 8; Section 7, p. 15. Page 8 also visually checked.
- **Source evidence:** Tangrams are explicitly used as proxies for small-object manual assembly. Visible piece contours manipulate task demand, with differences in workload and completion time. Movement and physiological signals are used for load estimation. The authors limit transfer from seated tabletop activity to broader industrial movement.
- **Derived for our paper:** Direct support for describing tangrams as a simplified assembly task involving piece orientation, placement and manipulation. This underpins the task rationale alongside the HRI precedent from Tabatabaei.
- **Limit:** It does not compare robot-help policies or validate generalization to an assembly line. Suitability for our informational/physical help combination remains our design interpretation.

## 11. Teo et al. — Enhancing the effectiveness of human-robot teaming with a closed-loop system

[Publication](https://doi.org/10.1016/j.apergo.2017.07.007). Online 3 October 2017; February 2018 issue. Reviewed version: published PDF, 13 pages.

- **Source location:** Sections 2.1–2.3, p. 4; Section 2.4, p. 6; discussion/conclusion, pp. 11–12.
- **Source evidence:** In simulated robot supervision, physiological thresholds can enable auditory aid; otherwise aid begins after ten minutes. Group assignment follows whether physiological triggering occurs. The discussion calls for checking transfer across tasks and aid formats.
- **Derived for our paper:** Older prior art for workload-dependent versus imposed assistance. It supports examining transfer to different tasks and assistance formats without claiming the basic adaptive-aid idea is new.
- **Limit:** This is not periodic physical robot assistance or randomized assignment to assistance policies. Its age should remain visible even though it is important prior art.

## 12. Yang et al. — Adaptive surgical assistance using real-time workload sensing

[Publication](https://doi.org/10.1177/00187208221129940). Online 11 November 2022; April 2024 issue. Reviewed version: author manuscript, 32 pages (final journal pagination 1081–1102).

- **Source location:** Experiment 2 algorithms, pp. 8–9; experimental design, p. 9; analysed sample, p. 10; General Discussion/Future Work, pp. 12–14. Page 9 also visually checked.
- **Source evidence:** EEG and eye tracking inform suction triggering during a physical surgical training task. The periodic comparator activates suction every 150 seconds. Nine participants' data are analysed. The discussion addresses intervention timing and limits generalization beyond the training setting.
- **Derived for our paper:** This is the closest verified physiological-versus-periodic assistance precedent. It prompted withdrawal of the earlier broad scarcity claim. Our defensible extension concerns physical spatial problem solving, the assistance formats and participant experience.
- **Limit:** The paper does not establish that physiology-informed assistance will outperform scheduled support in tangrams. Do not hide its 2022 online date by presenting it solely as a 2024 study.

## 13. Caiazzo et al. — Comparative Analysis Of Mental Workload in Adaptive HRC During Assembly

[Repository record](https://scidar.kg.ac.rs/handle/123456789/21811). ESREL 2024; exact publication day and DOI unverified. Reviewed version: repository PDF with ResearchGate cover, 11 pages.

- **Source location:** Section 2, pp. 4–7; results/conclusion, pp. 7–9, especially Section 4, p. 9.
- **Source evidence:** Three participants perform manual, collaborative and guided collaborative assembly. Guidance uses labels/instructions; EEG assesses workload.
- **Derived for our paper:** Combined guidance, physical collaboration and physiological assessment already appear in assembly research. Describe the assistance decision mechanism rather than treating these ingredients as individually novel.
- **Limit:** The described procedure does not use EEG to decide when to intervene or compare physiological with periodic support. The small study does not establish broad generalizability.

## 14. Sanna et al. — BARI

[Publication](https://doi.org/10.3390/info13100460). Published 28 September 2022. Reviewed version: published PDF, 14 pages.

- **Source location:** Section 3.2, p. 5; Sections 3.4 and 4, p. 8; Section 5.2, p. 11; surrounding interface description, pp. 4–5.
- **Source evidence:** EEG detects intentional selection of augmented-reality targets to command robot movement of assembly parts. The evaluation addresses usability and has no scheduled-assistance comparator.
- **Derived for our paper:** Brain-controlled assistance is an adjacent precedent. Distinguish an intentional EEG command interface from passive physiological cues used to judge assistance timing.
- **Limit:** Do not classify this as a workload-triggered-versus-scheduled assistance experiment.

## Synthesis supported by this set

- **Task rationale:** Tabatabaei provides a recent HRI tangram precedent; Melo/SensCogAR provides the simplified-assembly rationale with explicit transfer limits.
- **Assistance timing and adaptation:** Andriella, Teo, Singh and Yang establish relevant prior work. Yang directly overlaps the physiological-versus-periodic comparison, so novelty cannot rest on that comparison alone.
- **Physiology's role:** Hostettler, Capponi, Pereira, Korivand and Ojsteršek help distinguish evaluation, offline modelling, prior personalization and live decision inputs. These roles should not be conflated.
- **Assembly support:** Caiazzo and Sanna show adjacent combinations of guidance, physical robot help and physiological/brain interfaces, with different assistance mechanisms.
- **Research framing:** Karbouj provides review context, but neither its coverage nor this targeted search proves an absence of prior work. Frame our contribution as evidence from a clearly described task and implemented assistance policies.

These are literature-grounded framing decisions. Claims about our completion rates, durations, helpfulness, timing and frustration require our own study records and analysis.
