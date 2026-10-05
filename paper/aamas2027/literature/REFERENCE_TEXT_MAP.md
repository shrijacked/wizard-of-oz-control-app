# Manuscript citations mapped to source PDF text

Updated 5 October 2026 for the metadata and draft-wording revision on branch `writing` (base commit `11c9a7b`). The exact manuscript versions are identified by hashes in the JSON companion. This maps **all 15 references and every in-text citation occurrence**, including repeated citations and both members of the joint tangram citation. It supplements the [reference audit](MANUSCRIPT_REFERENCE_AUDIT.md), rather than replacing its metadata/version history.

For each reference: **our exact wording → source PDF page and short verbatim search anchor → explanation of support → boundary on interpretation**. The surrounding explanations are paraphrases, not quotations. Short anchors normalize PDF line wrapping and typographic ligatures; no wording is invented. Page numbers are one-based **PDF pages**, including repository covers, rather than journal page numbers. Each source’s excerpts total at most 25 words.

All 15 PDF hashes were checked again and the text was freshly extracted from the PDFs for this map. Every quoted anchor was mechanically matched on the stated page. This establishes traceability of the claim; it does not independently replicate the cited experiment. The map is a reading aid, not evidence that every page was exhaustively appraised.

Local PDF links work only in a checkout containing the gitignored `data/writing-reference/literature-pdfs/` cache. Public source links provide a recovery route; access and `#page=` navigation depend on the host/viewer. Twelve papers first appeared in 2024–2026. Older exceptions are Hart, Teo and Yang; Thunberg is a workshop proposal.

## Coverage index

| Reference | Manuscript locations | Exact evidence pages |
|---|---|---|
| [1] [Andriella et al. — Bayesian proactive assistance](#ref-1) | Introduction; §2.1 | 1, 16, 23 |
| [2] [Caiazzo et al. — Assembly workload comparison](#ref-2) | §2.3 | 2 |
| [3] [Capponi et al. — Assembly complexity and physiological response](#ref-3) | §2.2 | 3, 8 |
| [4] [De Lazzari et al. — PACE](#ref-4) | Introduction; §2.1 | 3, 7 |
| [5] [Hart — NASA-TLX: 20 Years Later](#ref-5) | §2.3 | 1, 3 |
| [6] [Hostettler et al. — Real-time adaptive industrial robots](#ref-6) | §2.2 | 5, 6 |
| [7] [Karbouj et al. — Adaptive HRC systematic review](#ref-7) | Introduction; §2.1 | 21 |
| [8] [Korivand et al. — Physiological analysis and Q-learning](#ref-8) | §2.2 | 8, 15, 18 |
| [9] [Melo et al. — SensCogAR](#ref-9) | Introduction; §2.3 | 8 |
| [10] [Ojsteršek et al. — Personalized human–robot workplace](#ref-10) | §2.2 | 3, 4 |
| [11] [Pereira et al. — Physiological workload review](#ref-11) | §2.2 | 14, 18 |
| [12] [Tabatabaei et al. — Gazing at Failure](#ref-12) | Introduction; §2.3 | 1, 3 |
| [13] [Teo et al. — Closed-loop human–robot teaming](#ref-13) | §2.2 | 4, 6 |
| [14] [Thunberg et al. — Experiences of Wizards of Oz](#ref-14) | §2.4 | 1 |
| [15] [Yang et al. — Workload-adaptive surgical suction](#ref-15) | Introduction; §2.2 | 8, 9 |

## Detailed mapping

<a id="ref-1"></a>
### [1] Andriella et al. — Bayesian proactive assistance

Key: `andriella2025`. [Local PDF](../../../data/writing-reference/literature-pdfs/Andriella_2025_Bayesian_Proactive_Assistance.pdf) · [Public PDF](https://link.springer.com/content/pdf/10.1007/s11257-024-09421-1.pdf). Version: Published journal PDF.

**Where our paper uses it**

- **1. Introduction** — [Markdown line 15](../manuscript.md#L15); [LaTeX line 62](../main.tex#L62). Evidence: A1, A2.
  > Andriella et al. model assistance type, timing, and confidence [1]

- **2.1. Assistance timing and proactive coordination** — [Markdown line 37](../manuscript.md#L37); [LaTeX line 86](../main.tex#L86). Evidence: A1, A2, A3.
  > Andriella et al. learn proactive assistance from user profiles and task state in a sequential memory game, jointly addressing assistance type, timing, and confidence [1].

**Supporting PDF text**

- **A1 — [PDF p. 1](https://link.springer.com/content/pdf/10.1007/s11257-024-09421-1.pdf#page=1)**
  > when to intervene, and with what confidence

  The abstract identifies assistance selection, intervention timing and confidence in taking control as the learned decisions.

- **A2 — [PDF p. 16](https://link.springer.com/content/pdf/10.1007/s11257-024-09421-1.pdf#page=16)**
  > the user profile and the game state

  The request-time classifier associates assistance level, user profile and game state with the time of a help request. This supports the user/task information part of our sentence.

- **A3 — [PDF p. 23](https://link.springer.com/content/pdf/10.1007/s11257-024-09421-1.pdf#page=23)**
  > sequential memory game

  The evaluation section describes participants playing the game with Furhat and contrasts proactive and non-proactive robot assistance.

**Interpretation limit:** Supports the three decision dimensions and this particular game implementation. It does not establish a physiological trigger or validate the present HR-rise threshold.

<a id="ref-2"></a>
### [2] Caiazzo et al. — Assembly workload comparison

Key: `caiazzo2024`. [Local PDF](../../../data/writing-reference/literature-pdfs/Caiazzo_2024_Comparative_Assembly_Workload.pdf) · [Public PDF](https://scidar.kg.ac.rs/bitstream/123456789/21811/1/comparative-analysis-of-mental-workload-in-adaptive-human-robot-collaboration-during-assembly-tasks.pdf). Version: Conference paper in university repository; PDF includes ResearchGate cover.

**Where our paper uses it**

- **2.3. Physical tasks and participant experience** — [Markdown line 49](../manuscript.md#L49); [LaTeX line 98](../main.tex#L98). Evidence: C1, C2, C3.
  > Adjacent assembly work by Caiazzo et al. compares manual, collaborative, and guided collaborative conditions, with EEG used for workload assessment [2].

**Supporting PDF text**

- **C1 — [PDF p. 2](https://scidar.kg.ac.rs/bitstream/123456789/21811/1/comparative-analysis-of-mental-workload-in-adaptive-human-robot-collaboration-during-assembly-tasks.pdf#page=2)**
  > three different scenarios

  The abstract enumerates assembly without the robot, with the robot, and with the robot plus task guidance. Our word “manual” paraphrases the no-robot condition.

- **C2 — [PDF p. 2](https://scidar.kg.ac.rs/bitstream/123456789/21811/1/comparative-analysis-of-mental-workload-in-adaptive-human-robot-collaboration-during-assembly-tasks.pdf#page=2)**
  > The analysis was conducted for three participants.

  This identifies the source study’s sample size, retained here as context for interpreting its scope.

- **C3 — [PDF p. 2](https://scidar.kg.ac.rs/bitstream/123456789/21811/1/comparative-analysis-of-mental-workload-in-adaptive-human-robot-collaboration-during-assembly-tasks.pdf#page=2)**
  > electroencephalogram (EEG) sensor cap

  The abstract identifies EEG as the workload measurement; PDF p. 4 describes preprocessing and feature extraction. The scenarios concern collaboration/guidance, not a reported online EEG trigger.

**Interpretation limit:** The N=3 qualification is essential. This is adjacent assembly evidence, not a test of our timing policy. Unverified DOI and proceedings pagination are omitted from the bibliography.

<a id="ref-3"></a>
### [3] Capponi et al. — Assembly complexity and physiological response

Key: `capponi2024`. [Local PDF](../../../data/writing-reference/literature-pdfs/Capponi_2024_Assembly_Complexity.pdf) · [Public PDF](https://www.qualityengineering.polito.it/content/download/1126/6184/file/Assembly%20complexity%20and%20physiological%20response%20in%20human-robot%20collaboration%20_%20Insights%20from%20a%20preliminary%20experimental%20analysis.pdf). Version: Published version; university research-group website.

**Where our paper uses it**

- **2.2. Physiological information in assistance** — [Markdown line 45](../manuscript.md#L45); [LaTeX line 94](../main.tex#L94). Evidence: CP1, CP2.
  > Capponi et al. similarly find no clear RMSSD pattern across their assembly configurations and distinguish cognitive effort from stress [3].

**Supporting PDF text**

- **CP1 — [PDF p. 8](https://www.qualityengineering.polito.it/content/download/1126/6184/file/Assembly%20complexity%20and%20physiological%20response%20in%20human-robot%20collaboration%20_%20Insights%20from%20a%20preliminary%20experimental%20analysis.pdf#page=8)**
  > the RMSSD metric provided no significant evidence

  In §4.2.1 the authors describe overlapping distributions without clear trends, and no significant evidence for their hypothesis from RMSSD or its signed-rank tests.

- **CP2 — [PDF p. 3](https://www.qualityengineering.polito.it/content/download/1126/6184/file/Assembly%20complexity%20and%20physiological%20response%20in%20human-robot%20collaboration%20_%20Insights%20from%20a%20preliminary%20experimental%20analysis.pdf#page=3)**
  > not all increases in cognitive load lead to stress

  The background distinguishes task-related cognitive demand from stress and explains that their relationship depends on the person and situation.

**Interpretation limit:** The negative RMSSD finding is specific to these tasks/configurations. It does not mean every cardiac measure is uninformative or that physiological state has no relationship with workload.

<a id="ref-4"></a>
### [4] De Lazzari et al. — PACE

Key: `delazzari2025`. [Local PDF](../../../data/writing-reference/literature-pdfs/PACE_2025.pdf) · [Public PDF](https://www.merl.com/publications/docs/TR2025-064.pdf). Version: ICRA paper hosted by MERL, technical-report cover.

**Where our paper uses it**

- **1. Introduction** — [Markdown line 15](../manuscript.md#L15); [LaTeX line 62](../main.tex#L62). Evidence: P1, P2.
  > PACE uses action-completion estimates to coordinate proactive assistance [4].

- **2.1. Assistance timing and proactive coordination** — [Markdown line 37](../manuscript.md#L37); [LaTeX line 86](../main.tex#L86). Evidence: P1, P2, P3.
  > PACE estimates action completion from hand movements and uses a learned policy to coordinate assistance during collaborative assembly [4].

**Supporting PDF text**

- **P1 — [PDF p. 3](https://www.merl.com/publications/docs/TR2025-064.pdf#page=3)**
  > track human task progression from hand movements

  The paper describes DTW with correlation analysis to estimate human progress; methods on PDF pp. 4–5 develop the action-completion estimator.

- **P2 — [PDF p. 3](https://www.merl.com/publications/docs/TR2025-064.pdf#page=3)**
  > reinforcement learning policy from limited demonstrations

  The learned policy coordinates robot assistance with estimated progress; the methods explain the policy formulation. This supports “learned policy,” without importing claims of superiority.

- **P3 — [PDF p. 7](https://www.merl.com/publications/docs/TR2025-064.pdf#page=7)**
  > robot hands an Allen key to the human

  The task description and Figure 3 describe collaborative wooden-chair assembly, including joint transport and tool handovers. Right-hand position is recorded with motion capture.

**Interpretation limit:** This is hand-motion/task-progress assistance, not physiology-based assistance. PDF p. 1 is a MERL cover and p. 2 is blank; the actual article begins on PDF p. 3.

<a id="ref-5"></a>
### [5] Hart — NASA-TLX: 20 Years Later

Key: `hart2006`. [Local PDF](../../../data/writing-reference/literature-pdfs/Hart_2006_NASA_TLX.pdf) · [Public PDF](https://www.nasa.gov/wp-content/uploads/2026/01/hfes-2006-paper.pdf). Version: NASA-hosted author paper.

**Where our paper uses it**

- **2.3. Physical tasks and participant experience** — [Markdown line 51](../manuscript.md#L51); [LaTeX line 100](../main.tex#L100). Evidence: H1, H2.
  > Hart describes the six NASA-TLX workload dimensions and the use of an unweighted overall score [5].

**Supporting PDF text**

- **H1 — [PDF p. 1](https://www.nasa.gov/wp-content/uploads/2026/01/hfes-2006-paper.pdf#page=1)**
  > Mental, Physical, and Temporal Demands, Frustration, Effort, and Performance.

  The background names the six subscales. These are the dimensions referred to in our manuscript.

- **H2 — [PDF p. 3](https://www.nasa.gov/wp-content/uploads/2026/01/hfes-2006-paper.pdf#page=3)**
  > ratings are simply averaged or added

  The modifications discussion explains Raw TLX after removal of the weighting procedure.

**Interpretation limit:** Hart supports describing and qualifying an adaptation; it does not validate our particular seven-point items, scoring, or psychometric properties. The paper is from 2006, regardless of its 2026 NASA upload path.

<a id="ref-6"></a>
### [6] Hostettler et al. — Real-time adaptive industrial robots

Key: `hostettler2025`. [Local PDF](../../../data/writing-reference/literature-pdfs/Hostettler_2025_Real_Time_Adaptive_Industrial_Robots.pdf) · [Public PDF](https://alexandria.unisg.ch/bitstreams/b9548afd-a853-40ed-9141-7bb837ce1f77/download). Version: Final CHI 2025 version; university repository.

**Where our paper uses it**

- **2.2. Physiological information in assistance** — [Markdown line 43](../manuscript.md#L43); [LaTeX line 92](../main.tex#L92). Evidence: HO1, HO2, HO3.
  > Hostettler et al. adapt robot behavior to user distance while measuring pupil responses; direct pupil-driven adaptation is a future direction [6].

**Supporting PDF text**

- **HO1 — [PDF p. 5](https://alexandria.unisg.ch/bitstreams/b9548afd-a853-40ed-9141-7bb837ce1f77/download#page=5)**
  > distance between the user and the robot only

  The study design explicitly limits the implemented adaptation input to distance so the authors can examine effects on proximity and pupil responses.

- **HO2 — [PDF p. 6](https://alexandria.unisg.ch/bitstreams/b9548afd-a853-40ed-9141-7bb837ce1f77/download#page=6)**
  > recorded pupil dilation data and proximity behavior

  The measures section lists these as objective responses, alongside subjective questionnaires.

- **HO3 — [PDF p. 5](https://alexandria.unisg.ch/bitstreams/b9548afd-a853-40ed-9141-7bb837ce1f77/download#page=5)**
  > future systems

  The surrounding paragraph presents adaptation to workload measured through real-time pupil dilation as a future direction, rather than the implemented control input.

**Interpretation limit:** Do not cite the paper as an implemented pupil-triggered assistance policy. Its table of possible human characteristics includes prior literature; that table alone is not evidence of what its own experiment implemented.

<a id="ref-7"></a>
### [7] Karbouj et al. — Adaptive HRC systematic review

Key: `karbouj2026`. [Local PDF](../../../data/writing-reference/literature-pdfs/Karbouj_2026_Adaptive_HRC_Review.pdf) · [Public PDF](https://publica-rest.fraunhofer.de/server/api/core/bitstreams/e60c03db-8192-404a-a885-43c61307f554/content). Version: Published journal PDF.

**Where our paper uses it**

- **1. Introduction** — [Markdown line 15](../manuscript.md#L15); [LaTeX line 62](../main.tex#L62). Evidence: K1, K2.
  > A recent review distinguishes adaptation of robot motion from task-level decisions about timing, sequencing, and role allocation [7].

- **2.1. Assistance timing and proactive coordination** — [Markdown line 35](../manuscript.md#L35); [LaTeX line 84](../main.tex#L84). Evidence: K1, K2.
  > Karbouj et al.'s review of adaptive industrial HRC distinguishes motion, task, and control adaptations and identifies task-level timing and coordination as areas warranting further attention [7].

**Supporting PDF text**

- **K1 — [PDF p. 21](https://publica-rest.fraunhofer.de/server/api/core/bitstreams/e60c03db-8192-404a-a885-43c61307f554/content#page=21)**
  > three-layer taxonomy

  The discussion identifies motion, task and control layers and contrasts how much adaptation research concentrates on each.

- **K2 — [PDF p. 21](https://publica-rest.fraunhofer.de/server/api/core/bitstreams/e60c03db-8192-404a-a885-43c61307f554/content#page=21)**
  > relative under-representation of task-dependent adaptation

  The surrounding passage names timing/synchronization, sequencing and role allocation, and discusses resulting coordination costs.

**Interpretation limit:** This supports the taxonomy and the review authors’ emphasis. It does not establish that no earlier study made our particular comparison. First publication was December 2025; the issue/volume is 2026.

<a id="ref-8"></a>
### [8] Korivand et al. — Physiological analysis and Q-learning

Key: `korivand2024`. [Local PDF](../../../data/writing-reference/literature-pdfs/Korivand_2024_Physiological_Task_Load_Adjustment.pdf) · [Public PDF](https://mdpi-res.com/d_attachment/sensors/sensors-24-02817/article_deploy/sensors-24-02817.pdf). Version: Published journal PDF.

**Where our paper uses it**

- **2.2. Physiological information in assistance** — [Markdown line 43](../manuscript.md#L43); [LaTeX line 92](../main.tex#L92). Evidence: KO1, KO2, KO3.
  > Korivand et al. develop physiological task-load prediction and Q-learning-based adjustment, while explicitly reporting that their recorded wristband data could not be integrated directly for real-time use [8].

**Supporting PDF text**

- **KO1 — [PDF p. 8](https://mdpi-res.com/d_attachment/sensors/sensors-24-02817/article_deploy/sensors-24-02817.pdf#page=8)**
  > NASA TLX questionnaire

  Data collection uses two robot-speed scenarios, wristband recordings and post-task workload ratings; the preprocessing section describes the physiological records.

- **KO2 — [PDF p. 15](https://mdpi-res.com/d_attachment/sensors/sensors-24-02817/article_deploy/sensors-24-02817.pdf#page=15)**
  > primary adjustable parameter

  In §5.5 this parameter is robot speed; the section describes physiological prediction followed by Q-learning-based task-load adjustment.

- **KO3 — [PDF p. 18](https://mdpi-res.com/d_attachment/sensors/sensors-24-02817/article_deploy/sensors-24-02817.pdf#page=18)**
  > cannot transmit data in real time but only after recording is complete

  The limitations paragraph explicitly explains why the collected wristband data could not be directly integrated for live application.

**Interpretation limit:** The limitation qualifies the implemented evidence. The framework should not be presented as a demonstrated end-to-end real-time wrist-triggered deployment.

<a id="ref-9"></a>
### [9] Melo et al. — SensCogAR

Key: `melo2026`. [Local PDF](../../../data/writing-reference/literature-pdfs/SensCogAR_2026_Tangram_Assembly.pdf) · [Public PDF](https://www.jstage.jst.go.jp/article/ijabc/2026/1/2026_147/_pdf). Version: Published journal PDF.

**Where our paper uses it**

- **1. Introduction** — [Markdown line 19](../manuscript.md#L19); [LaTeX line 66](../main.tex#L66). Evidence: M1.
  > Recent work uses tangrams for collaborative HRI and as a simplified assembly task [12, 9].

- **2.3. Physical tasks and participant experience** — [Markdown line 49](../manuscript.md#L49); [LaTeX line 98](../main.tex#L98). Evidence: M1, M2.
  > SensCogAR uses tangrams as a proxy for small-object assembly, manipulating the visibility of piece contours to vary task demand [9].

**Supporting PDF text**

- **M1 — [PDF p. 8](https://www.jstage.jst.go.jp/article/ijabc/2026/1/2026_147/_pdf#page=8)**
  > Tangram puzzles as proxies for manual assembly tasks

  §4.2 explains that participants manipulate similarly sized geometric objects to match a reference image; this supports the assembly-proxy half of the joint introduction citation.

- **M2 — [PDF p. 8](https://www.jstage.jst.go.jp/article/ijabc/2026/1/2026_147/_pdf#page=8)**
  > visibility of piece contours

  The following paragraph distinguishes fully visible contours in low-difficulty puzzles from partly obscured contours in high-difficulty puzzles.

**Interpretation limit:** Task rationale transfers at the level of spatial manipulation. Neither the validity of all nine current puzzles nor generalization to industrial assembly follows automatically. PDF p. 15 discusses task/context limitations.

<a id="ref-10"></a>
### [10] Ojsteršek et al. — Personalized human–robot workplace

Key: `ojstersek2024`. [Local PDF](../../../data/writing-reference/literature-pdfs/Ojstersek_2024_Personalizing_Workplace.pdf) · [Public PDF](https://mdpi-res.com/d_attachment/machines/machines-12-00546/article_deploy/machines-12-00546.pdf). Version: Published journal PDF.

**Where our paper uses it**

- **2.2. Physiological information in assistance** — [Markdown line 43](../manuscript.md#L43); [LaTeX line 92](../main.tex#L92). Evidence: O1, O2.
  > Ojsteršek et al. personalize robot parameters using a preliminary skills test and analyze ECG recordings after the experiment [10].

**Supporting PDF text**

- **O1 — [PDF p. 3](https://mdpi-res.com/d_attachment/machines/machines-12-00546/article_deploy/machines-12-00546.pdf#page=3)**
  > Participants began with a skills test

  The experimental sequence uses that test to adjust robot movement parameters to worker utilization before the three scenarios.

- **O2 — [PDF p. 4](https://mdpi-res.com/d_attachment/machines/machines-12-00546/article_deploy/machines-12-00546.pdf#page=4)**
  > At the end of the experiment

  The measurement paragraph says ECG data were transferred to KUBIOS HRV Scientific for subsequent analysis. The same paragraph identifies the ECG hardware and electrodes.

**Interpretation limit:** Personalization and physiological measurement both occur, but the described ECG analysis is not the real-time control input. The PDF extraction repeats some layout text; locators refer to the actual PDF page.

<a id="ref-11"></a>
### [11] Pereira et al. — Physiological workload review

Key: `pereira2025`. [Local PDF](../../../data/writing-reference/literature-pdfs/Pereira_2025_Workload_Sensors_Review.pdf) · [Public PDF](https://mdpi-res.com/d_attachment/applsci/applsci-15-03317/article_deploy/applsci-15-03317.pdf). Version: Published journal PDF.

**Where our paper uses it**

- **2.2. Physiological information in assistance** — [Markdown line 45](../manuscript.md#L45); [LaTeX line 94](../main.tex#L94). Evidence: PE1, PE2.
  > Pereira et al.'s review documents heterogeneous workload measures and mixed cardiac findings across HRC studies [11].

**Supporting PDF text**

- **PE1 — [PDF p. 14](https://mdpi-res.com/d_attachment/applsci/applsci-15-03317/article_deploy/applsci-15-03317.pdf#page=14)**
  > relationship with task complexity and robotic assistance remains unclear

  The cardiac-measures synthesis contrasts studies with nonsignificant HRV differences and studies with condition-specific RMSSD differences.

- **PE2 — [PDF p. 18](https://mdpi-res.com/d_attachment/applsci/applsci-15-03317/article_deploy/applsci-15-03317.pdf#page=18)**
  > challenging to compare among the different studies

  The discussion describes variation in workload measures, tasks, environments and interacting variables.

**Interpretation limit:** We cite the review’s synthesis, not independently verified findings from every study it includes. It supplies no validation for our specific sensor, threshold or task.

<a id="ref-12"></a>
### [12] Tabatabaei et al. — Gazing at Failure

Key: `tabatabaei2025`. [Local PDF](../../../data/writing-reference/literature-pdfs/Tabatabaei_2025_Gazing_at_Failure.pdf) · [Public PDF](https://arxiv.org/pdf/2502.16899). Version: arXiv v1; accepted HRI full paper.

**Where our paper uses it**

- **1. Introduction** — [Markdown line 19](../manuscript.md#L19); [LaTeX line 66](../main.tex#L66). Evidence: T1.
  > Recent work uses tangrams for collaborative HRI and as a simplified assembly task [12, 9].

- **2.3. Physical tasks and participant experience** — [Markdown line 49](../manuscript.md#L49); [LaTeX line 98](../main.tex#L98). Evidence: T1, T2.
  > Tabatabaei et al. study gaze around robot failures during collaborative tangram solving [12].

**Supporting PDF text**

- **T1 — [PDF p. 3](https://arxiv.org/pdf/2502.16899#page=3)**
  > one participant and a robot collaboratively solve Tangram puzzles

  §III.A describes seven physical pieces, a division of pieces between robot and participant, and 3D-printed task materials. This supports the collaborative-HRI half of the joint citation.

- **T2 — [PDF p. 1](https://arxiv.org/pdf/2502.16899#page=1)**
  > human gaze dynamics can signal a robot’s failure

  The abstract defines the gaze/failure question and describes programmed executional and decisional robot failures; the methods describe the task and failure manipulations.

**Interpretation limit:** This is a gaze-and-failure study, not a test of physiological or scheduled help. The local version is arXiv v1 of the accepted HRI paper, so its PDF page numbers differ from proceedings pagination.

<a id="ref-13"></a>
### [13] Teo et al. — Closed-loop human–robot teaming

Key: `teo2018`. [Local PDF](../../../data/writing-reference/literature-pdfs/Teo_2018_Closed_Loop_Teaming.pdf) · [Public PDF](https://sciences.ucf.edu/psychology/perl/wp-content/uploads/sites/29/2019/08/Enhancing-the-effectiveness-of-human-robot-teaming-with-a-closed-loop-system..pdf). Version: Published version from university research-group website; journal issue 2018; online 2017.

**Where our paper uses it**

- **2.2. Physiological information in assistance** — [Markdown line 41](../manuscript.md#L41); [LaTeX line 90](../main.tex#L90). Evidence: TE1, TE2.
  > Earlier work by Teo et al. uses individualized physiological workload markers to trigger aid during robot supervision, imposing aid later when it has not been triggered [13].

**Supporting PDF text**

- **TE1 — [PDF p. 6](https://sciences.ucf.edu/psychology/perl/wp-content/uploads/sites/29/2019/08/Enhancing-the-effectiveness-of-human-robot-teaming-with-a-closed-loop-system..pdf#page=6)**
  > individual's own set of physiological workload markers

  §2.4 constructs markers from individual single-/dual-task baselines, compares the workload index to a threshold, and requires repeated high samples before triggering assistance.

- **TE2 — [PDF p. 4](https://sciences.ucf.edu/psychology/perl/wp-content/uploads/sites/29/2019/08/Enhancing-the-effectiveness-of-human-robot-teaming-with-a-closed-loop-system..pdf#page=4)**
  > aid was imposed by the system for the last 5 min

  The experimental design allows a trigger during the first ten minutes; if none occurs, aid is imposed during the last five minutes.

**Interpretation limit:** The study uses personalized multimeasure workload logic in robot supervision. It does not establish our heart-rate-rise threshold or identical assistance mechanics. Online publication was 2017; journal issue 2018.

<a id="ref-14"></a>
### [14] Thunberg et al. — Experiences of Wizards of Oz

Key: `thunberg2026`. [Local PDF](../../../data/writing-reference/literature-pdfs/Thunberg_2026_Wizards.pdf) · [Public PDF](https://repositum.tuwien.at/bitstream/20.500.12708/227993/1/Thunberg-2026-Unpacking%20Lived%20Experiences%20of%20Wizards%20of%20Oz-vor.pdf). Version: Published HRI Companion workshop proposal.

**Where our paper uses it**

- **2.4. Wizard-of-Oz evaluation** — [Markdown line 55](../manuscript.md#L55); [LaTeX line 104](../main.tex#L104). Evidence: TH1.
  > A recent HRI workshop proposal by Thunberg et al. emphasizes the practical, ethical, and methodological tensions of the wizard's role [14].

**Supporting PDF text**

- **TH1 — [PDF p. 1](https://repositum.tuwien.at/bitstream/20.500.12708/227993/1/Thunberg-2026-Unpacking%20Lived%20Experiences%20of%20Wizards%20of%20Oz-vor.pdf#page=1)**
  > ethical, practical, methodological, personal, and philosophical tensions

  The abstract says surfacing these tensions is the workshop’s goal; the subsequent three-page proposal lays out its agenda and planned elicitation of wizard experiences.

**Interpretation limit:** Supports identifying a methodological concern and research agenda. It is explicitly a workshop proposal, not completed empirical evidence or a validated operator protocol.

<a id="ref-15"></a>
### [15] Yang et al. — Workload-adaptive surgical suction

Key: `yang2024`. [Local PDF](../../../data/writing-reference/literature-pdfs/Yang_2024_Adaptive_Surgical_Assistance.pdf) · [Public PDF](https://scholarworks.indianapolis.iu.edu/bitstreams/5eb42ad8-e6eb-4495-9c1d-f520e3877a06/download). Version: Author manuscript; published Human Factors 66(4), 1081–1102 (2024); first online 2022-11-11.

**Where our paper uses it**

- **1. Introduction** — [Markdown line 17](../manuscript.md#L17); [LaTeX line 64](../main.tex#L64). Evidence: Y1, Y2, Y3.
  > Yang et al. compared workload-adaptive robotic suction with periodic support during surgical training [15].

- **2.2. Physiological information in assistance** — [Markdown line 41](../manuscript.md#L41); [LaTeX line 90](../main.tex#L90). Evidence: Y1, Y2, Y3.
  > Yang et al.'s surgical system uses EEG and eye tracking to inform adaptive suction, with a periodic comparator selected to approximate earlier observed assistance frequency [15].

**Supporting PDF text**

- **Y1 — [PDF p. 8](https://scholarworks.indianapolis.iu.edu/bitstreams/5eb42ad8-e6eb-4495-9c1d-f520e3877a06/download#page=8)**
  > EEG and eye-tracking data were synchronized

  Experiment 2’s algorithm description combines the physiological/eye-tracking streams in the workload-adaptive suction system and evaluates it with surgical trainees.

- **Y2 — [PDF p. 9](https://scholarworks.indianapolis.iu.edu/bitstreams/5eb42ad8-e6eb-4495-9c1d-f520e3877a06/download#page=9)**
  > two conditions as follows

  The experimental design explicitly contrasts workload-adaptive automation with periodic automation that does not consider current workload.

- **Y3 — [PDF p. 9](https://scholarworks.indianapolis.iu.edu/bitstreams/5eb42ad8-e6eb-4495-9c1d-f520e3877a06/download#page=9)**
  > activated every 150 seconds

  The next sentences explain that the periodic interval was estimated from prior observed suction frequency under the adaptive system.

**Interpretation limit:** This is the direct precedent that prevents a claim that the comparison itself is new. “Closest” is our assessment within the reviewed set, not proof from an exhaustive review. Online publication was 2022 despite the 2024 issue; the cached PDF is an author manuscript.

## What this map does not source from the literature

The participant counts, outcome percentages, workload scores and intervention counts in §5 come from our study exports and [analysis summary](../analysis/interim-summary.json), not these papers. Implementation descriptions come from the code and team-supplied protocol information; see [evidence-map.md](../evidence-map.md). The research questions, study-specific interpretation and future comparisons are author synthesis, not findings established by a cited PDF.

The sources support the cited comparisons and methodological distinctions. They do **not** validate the present 5-bpm threshold, establish a completed N=24 study, supply the pending task-profile survey or photograph scores, or establish significance of our interim findings.

The paper follows the approved 5 October structure; see [the current section-by-section structure](../structure-review.md#current-structure-in-the-compiled-paper).
