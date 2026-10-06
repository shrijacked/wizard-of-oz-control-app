# Paper structure and current coverage

Updated 7 October 2026. The manuscript follows the author-approved 5 October outline. Original structure interpretation and source comparison are preserved below and in the immutable baseline; those older notes describe expectations at that time.

## Current manuscript compared with the plan

| Section | What is now present | What still belongs here |
|---|---|---|
| Abstract | Problem, comparator, actual N=12, three policies, outcomes and qualified findings | Refresh with final accepted dataset/model; historical submitted abstract unchanged. |
| 1 Introduction | Timing problem, relevant prior work, RQ1/RQ2 and three contributions; no findings | Refine novelty after literature expansion. |
| 2 Related Work | Proactive timing, physiology, physical tasks/measures and Wizard-of-Oz;15 verified sources | Additional recent relevant sources, verified against PDFs. |
| 3 Task Profiling | 24-response survey demographics/procedure, familiarity, outcomes/time/stuckness, assistance expectations, graph and task rationale | Digital/timed task, recruitment and some overlap now confirmed; exact overlap, task link and chronology remain. |
| 4 System | Current architecture and setup schematic; apparatus, roles, piece positions; medianHR processing and all three protocols | Setup photo, robot model/piece material, actual baseline practice and signal-loss handling; repeated-flag 15-second wait and robot-plus-hint delivery now stated. |
| 5.1 Methods | Actual N=12 demographics, three sessions, measures, participant averaging, exploratory paired tests/Holm and correlations | Eligibility, practice, ethics review and final analysis; recruitment/coupons, five-minute breaks and success/timeout rule now stated. |
| 5.2 Objective | Updated completion/time table, paired graph and comparisons | Orientation-maximizing rule now stated; photographs, placement tolerance, scorers, scores and partial-progress graph remain. |
| 5.3 Workload | Updated dimensions/composite, paired workload/frustration graph and correlation heatmaps | Final results/model refresh; avoid independent interpretation of part-whole correlations. |
| 5.4 Assistance Experience | Updated four ratings, paired graph and qualified tests | Modality-specific evidence requires another analysis/study, not invented item separation. |
| 5.5 Overall | Final ratings and illustrative verbatim comments | Formal qualitative analysis only if undertaken and documented. |
| 6 Discussion | Performance/experience interpretation, physiology timing, robot-motion quote, direct-placement future work and limitations | Replace tangram-to-assembly drafting note with supported discussion; revisit scored partial progress. |
| 7 Ethics | Consent/withdrawal, physiological/camera data, operator role and handling principles | Consent/form/app workflow and workspace-only recording now described; nondisclosure during/after confirmed. Institutional review, enacted instruction version and data/safety facts remain. |
| 8 Conclusion | Updated findings and calibrated implication | Refresh after final analysis. |

The survey occupies the correct pre-system position in the argument. Its planned sample/procedure, task performance, expectations and relevance slots are condensed into two subsections rather than four short ones. This does not claim the survey preceded or determined the experimental design. Objective findings precede workload, intervention experience and final comments, as agreed. The physical setup and architecture are separate figures; the paper now contains graphs alongside all three results tables.

## Original outline interpretation and earlier comparison

## Sources and scope

- Handwritten sketch: `/Users/rishit/Downloads/IMG_2501.HEIC`.
- Typed meeting notes: supplied clipboard image.
- AdaptAI: `/Users/rishit/Downloads/2503.09150v1.pdf`, 11 PDF pages.
- GuideAI: `/Users/rishit/Downloads/2601.20402v1.pdf`, 17 PDF pages.
- Local checkout: `https://github.com/shrijacked/wizard-of-oz-control-app`, branch `writing`; reviewed `paper/aamas2027/`, including the manuscript, author notes, questionnaire inventory, evidence map, build notes, and template source. No separately named guidelines folder was found in the current checkout. The author notes link the official rules below.
- Existing author notes record earlier team decisions, but their reports of prior conversations are not independent verification of the actual experiment.

## User clarifications received during this review

- A separate survey is planned for a substantially larger sample than the 24-person experiment; responses are not yet available. It covers prior tangram experience, time to solve a standard tangram square linked in the form, and expected effectiveness of hints and robot assistance. Exact sample size, recruitment, overlap with the experimental sample, and instrument wording remain unconfirmed. This supports a task-profiling and assistance-expectations section. Do not report findings yet or claim the pending survey informed the already conducted experiment.
- The author clarified that 24 is the **planned** sample; collection is ongoing. Each participant is intended to experience all three conditions in a within-participant study, not three independent groups of eight. The current export contains nine complete participants and a tenth with five completed rounds. Final inclusion/exclusions still need to be established.
- Puzzle completion was recorded. Final photographs exist for unfinished puzzles, and correct-piece counts will be derived from those photographs. Those counts are a planned retrospective annotation, not an already analyzed outcome. Elapsed-time availability and definitions should still be verified against session records.
- “Sid's diagram” means the diagram that still needs to be made; no existing figure needs to be located.

## Deciphered handwriting

High confidence unless qualified:

1. **Abstract:** gap in HRI; relevant research; what the work builds on; describe the experiment (what and why); general results/findings; connect back to the gap. Some connecting words and arrows are unclear.
2. **Introduction:** expand the abstract; HRI history, recent HRI, gaps; no results; end with contributions to the research area. The handwritten count looks like 3–4; the typed notes specify ideally three, maximum four.
3. **Related work:** a top-margin note appears to read “80% citations — last 2–3 years,” with “40 (min)” underneath. Treat these as mentor targets, not conference rules.
4. **Pre-study / formative assessment:** followed by design implications. Explain the tangram choice and what the assessment informed.
5. **Architecture / experiment design:** diagram on white background; processing information; setup, processing, inference/conditions; real images. The exact side-note wording is partly unclear, but the typed notes corroborate these themes.
6. **Findings + procedure:** the sketch lists (5.1) subjective NASA-TLX with statistical significance across groups; (5.2) objective task performance, apparently “time, correct pieces, completion”; and (5.3) non-NASA-TLX subjective ratings. It also mentions a time plot, correct-pieces plot, and the last form.
7. **Discussion:** general findings, limitations/challenges, future directions.
8. **Ethical considerations:** “check format”; GenAI disclosure is written alongside it.
9. **Conclusion**, then citations/bibliography.

The top reads “8 pages” and “Oct 9.” The date should be reconciled with the official AoE deadline, not treated as a standalone local-time deadline.

## How the typed notes refine this

- They explicitly prioritize objective task performance before subjective evidence. This reverses the order of the handwritten 5.1 and 5.2; the proposed outline below follows the typed refinement.
- “Task solving performance over learning perf (GuideAI)” means adapt the reference paper's evaluation framing to tangram performance. No learning or retention claim follows from completion/time alone.
- “3 groups, 3 bars each in NASA TLX” means three condition summaries per workload dimension: participants experience all three conditions; 24 is the target sample, not a completed count.
- “9th final from overall” likely means the overall questionnaire administered after the ninth puzzle. The questionnaire inventory corroborates this interpretation. It is not a ninth condition or a per-condition trust score.
- “Put sids diagram” was clarified by the user as the diagram still to be made. Plan an architecture diagram; no existing asset is implied.
- “After alms” may mean “after LLMs”; this is uncertain. The HRI introduction should only discuss LLMs where they matter to the actual study and gap.
- “Expo the metrics and finding” likely means explain the metrics and findings; uncertain wording, clear general intent.
- The note to put negative quotations in limitations should not become selective reporting. Relevant positive and negative experiences belong in findings; limitations explain implications. Preserve participants' actual wording when quoting them.
- Better framing of survey questions in prose should not change the historical wording of an administered instrument. Keep verbatim questions in supplementary material.

## What to borrow from each paper

| Source | Actual structure | Useful adaptation |
|---|---|---|
| GuideAI, §§1–9 | Introduction; Related Work; Formative Assessment; GuideAI Solution; Study Design and Evaluation; Discussion; Ethical Considerations; Conclusion; GenAI Usage Disclosure | Main structural model. Its §3 connects survey findings to design implications; §4 separates overview, capture, processing, and interventions; §5 separates procedure from findings. |
| AdaptAI, §§1–6 | Introduction; Related Works; AdaptAI Solution; Study Design and Evaluation; Ethical Considerations; Conclusion and Future Work | Compact system-to-evaluation narrative. Fig. 4 (PDF p.7) shows workload comparisons; Tables 1–2 (p.6) separate comparative ratings from assistance-only ratings. |
| GuideAI figures/tables | Architecture Fig. 4 (p.5); workload Figs. 8–9 (pp.10–11); performance Fig. 10 (p.11); questionnaire Tables 1–2 (p.12) | Figure purposes and the distinction between shared and assistance-only measures. Replace learning outcomes with actually measured tangram outcomes. |

GuideAI has a distinct formative study (reported N=66), separate from its evaluation (reported N=25). This is why copying its section title requires evidence of an analogous stage here. AdaptAI does not have a separate formative-assessment section.

Both references include results in their introductions, so the mentor's “no results in intro” preference is a deliberate departure from the exemplars. Their page counts and appended material are not an AAMAS page budget. Their statistical tests, result directions, significance markings, participant quotes, and ethics claims are not transferable to this study.

## Proposed outline

**Abstract:** concrete gap → relevant prior approach → what this study adds and why tangrams → design and measures → verified objective and subjective results → implication addressing the gap. Include formative results only if a formative study actually occurred.

**1. Introduction:** brief HRI context; the specific assistance problem; precise, literature-supported gaps; study scope/research questions; three contributions. The existing draft already has three contributions: the condition comparison, the coordinated Wizard-of-Oz platform, and the joint evaluation of performance and experience. Their novelty should be assessed against relevant prior work.

**2. Related Work:** assistance timing and proactive HRI; physiology-informed assistance; physical/spatial tasks and assessment; concise Wizard-of-Oz context. Organize by the argument, not by a list of paper summaries. Retain foundational sources where necessary despite the recent-literature target.

**3. Tangram Task Profiling and Assistance Expectations** is the proposed heading once the separate survey is collected and analyzed. Until then, retain the existing **Task and Design Rationale** in the manuscript and reserve the survey subsections in the outline:

- **3.1 Survey sample and procedure:** larger sample, recruitment, prior tangram experience, the linked square task, materials/interface, timing instructions, and order of task and expectation questions.
- **3.2 Tangram familiarity and task performance:** familiarity distribution, completion/non-completion, and square-solving time with its measurement method. Clarify whether time is self-reported or automatically logged and how success is checked. Describe incomplete attempts separately from successful completion times.
- **3.3 Expectations of assistance:** expected usefulness of hints, robot assistance, and combined assistance, to the extent these are separately asked. The wording should explain what the robot actually does in the experiment. These ratings describe expectations; they do not demonstrate observed assistance effectiveness.
- **3.4 Relevance to the main study:** contextualize task familiarity, variability in square-solving difficulty, and interest in assistance. A single square task does not establish the difficulty of all nine experimental puzzles. Report the actual collection chronology; a later survey can contextualize the experiment but cannot retrospectively have determined its design.

This preserves the reference paper's survey-before-system reading order without implying that the survey was collected first. Exact heading and scope remain provisional until the instrument is reviewed. Recruitment/background questions for the 24-person experiment stay under its study methods.

**4. System and Assistance Design:** overview and architecture; apparatus/task; combined data capture and processing; decision process and intervention delivery. Show the participant, researcher/wizard, robot operator, sensor, and logging flow. Clearly identify human decisions, sensed inputs, and robot actions. Use a real setup photograph and a clean technical diagram where space allows.

**5. Study Design and Findings:**

- **5.1 Participants and procedure:** sample, condition allocation/order, puzzle allocation, calibration, timing, breaks, success/timeout rules, measures, and analysis approach.
- **5.2 Objective task performance:** completion and verified time measures first; correct-piece counts from retrospective annotation of final photographs, clearly identified as such. Define the solution reference, allowed rotation/reflection or equivalent arrangements, placement tolerance, ambiguous/occluded cases, and the annotation/review process before scoring. Establish how solved trials enter the 0–7 measure, and report missing/unscorable photographs rather than assigning arbitrary counts.
- **5.3 Workload:** six adapted NASA-TLX dimensions, summarized across the three conditions with scale direction made explicit.
- **5.4 Intervention experience:** helpfulness, timing, disruption/seamlessness, frustration relief for the two assisted conditions.
- **5.5 Overall and qualitative experience:** end-of-study ratings and participant comments, with mixed experiences represented faithfully.

Separate Methods and Results into top-level sections if readability warrants it; the logical order matters more than preserving section numbers. The earlier draft stopped after methods. The revised paper now follows the combined study-and-findings structure above.

**6. Discussion, Limitations, and Future Work:** interpret performance/experience agreement or trade-offs; explain implications for assistance; discuss human mediation, intervention content/dose, physiological-signal interpretation, sample/task scope, and the arm's actual contribution. The note says the robot brings a piece while the participant solves the puzzle; verify the exact physical behavior.

**7. Ethical Considerations:** actual approval/exemption, consent, recording, withdrawal, human-control disclosure/debriefing, robot safety, and data handling. A compact methods subsection is also possible. Do not import another paper's protections or approval claims.

**8. Conclusion:** evidence-backed answer to the research problem and contribution. Include an accurate AI-use statement where appropriate; neither the exemplars' wording nor their reported AI usage describes this project's usage.

## Figure and table plan

| Item | Content | Evidence dependency |
|---|---|---|
| Fig. 1 | System diagram, optionally with setup photo | Verify actual information flow, operator roles, and hardware |
| Fig. 2 | Completion and time in separate panels; correct-piece panel after annotation | Verify timing/denominators; score unfinished-puzzle photographs under a stated rule and define treatment of solved trials |
| Fig. 3 | Six workload dimensions, three condition estimates per dimension | Confirm scale anchors and actual allocation; identify each tested contrast explicitly |
| Table 1 | Assistance-specific question summaries and comparisons | Scheduled vs. adaptive only where control was not asked those questions |
| Compact table/text | End-of-study overall items | One overall response per participant, not three condition-specific responses |
| Short quotations | Themes explaining experience | Traceable participant comments and a stated analysis process |

The notes emphasize control–adaptive and control–scheduled contrasts. Scheduled–adaptive also matters directly to the paper's timing question. Report whichever contrasts the analysis supports; no significance is established by the notes. Define error bars, give effect sizes/uncertainty where appropriate, and explain any bolding or significance symbols. Repeated puzzles from the same person require an analysis reflecting that dependency; do not copy a reference paper's test merely to reproduce its table.

Supplementary candidates: full questionnaires, full hint inventory/operator protocol, sensor-processing details, additional plots, and reproducibility materials. Essential condition rules, outcomes, and methods remain in the main paper.

## AAMAS 2027 check

The official instructions require an anonymous PDF produced with LaTeX and the unmodified template: eight main-text pages plus references. Supplementary material is an anonymous ZIP up to 25 MB; reviewers need not read it. Essential material stays in the paper. The instructions do not specify a minimum citation count or recency quota. AI-assisted hypothesis/methodology creation requires details including tool/version and prompts; AI-generated imagery is restricted to qualitative research evidence when generative AI is the paper's topic. [Submission instructions](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/instructions/).

Appendices in the paper count within eight pages. Missing AI records must be disclosed, not reconstructed. The full-paper deadline is 8 October 2026 AoE, corresponding to 9 October at 17:30 IST; this may explain the handwritten date. Substantive changes to registered abstract/title metadata after the abstract deadline are restricted. [Official Q&A](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/qa/).

Illustrative eight-page allocation, including figures: front matter/abstract 0.4; introduction 0.9; related work 0.8; rationale/formative stage 0.5; system 1.2; study methods 1.1; findings 1.8; discussion/ethics/conclusion 1.3. This sums to eight but is not a compiled layout measurement.

## Decisions and difference from the earlier outline

The author approved this outline on 5 October and requested a complete paper draft using the available findings, to be replaced as experiments finish. The separate survey and photograph scoring remain pending. The current manuscript uses three results tables in place of the planned result figures; these preserve the same outcome order without implying that plots or piece scores already exist.

| Earlier draft / outline | Agreed outline and current implementation |
|---|---|
| §3 Task and Design Rationale, with physical-task and design-requirement subsections | Reserve a separate task-profile survey section, including square-task performance and assistance expectations. Retain factual rationale until responses exist; state the real collection chronology. |
| §4 System and Assistance Strategies, four implementation subsections | System and Assistance Design: architecture/apparatus → physiological capture → condition rules. State the condition timing rules and operator delivery roles. |
| §5 Study Design and Measures, six methods/measurement subsections; no results | Study Design and Findings: concise methods followed by objective performance, workload, intervention experience and final responses. |
| Handwritten sketch placed subjective workload before objective performance | Typed refinement places objective outcomes first, followed by workload and assistance ratings. |
| Related work separated trust/communication from assessment | Integrate experience and measurement with the physical-task literature; keep final trust distinct from condition-specific intervention ratings. |
| No discussion, ethics section or conclusion in the initial draft | Complete discussion/limitations/future work, ethics, conclusion and AI disclosure. Missing factual checks stay in author notes. |
| Historical abstract asserted a completed N=24 study | Latest author-supplied working abstract retains N=24; current numerical results derive from nine complete participants, with that interim sample recorded in author documentation. Reconcile after collection; submitted text remains archived unchanged. |

The introduction retains three contributions and no results. The new outline changes the argument and placement of evidence; it does not authorize inventing the missing survey, scoring, statistical significance or study procedures.


## Remaining evidence needed now

Square task confirmed; survey interface/method/chronology confirmation; correct-piece photos and scoring; final participant-source and outcome adjudication; protocol/recruitment/ethics details; setup photograph and dimensions; additional verified references and submission metadata. See author-notes.md for the complete handoff.

## Anonymous protocol revision

The manuscript now uses the original class’s anonymous option and submission ID 2613, without the named author spacing/hook. Additional author-confirmed methods fill the same approved structure. The complete results/tables/plots stay unchanged. A new immutable pre-change copy and highlighted review are in revisions/2026-10-07-protocol/.
