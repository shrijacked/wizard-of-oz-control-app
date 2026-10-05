# Author notes for the first manuscript draft

This is a writing draft through methods, not a submission-ready paper. It is grounded in the user's submitted abstract and mentor notes, the attached papers as structural examples only (neither is cited), and branch `modi5` at commit `cd1aa9d71032cd81bc1da8e195a086bd7471212f` (28 September 2026). No participant outcome dataset was analyzed. Application code establishes implementation capability; it does not establish what actually happened in collected sessions.

## Files and editing

- `main.tex`: editable manuscript in the supplied anonymous AAMAS 2027 class, with an original vector architecture diagram.
- `manuscript.md`: readable review copy of the same first draft; numbered citations and a full reference list are included.
- `references.bib`: 18 references used in this first pass. This does **not yet meet the mentor's suggested 40-reference target**. Extend the review with directly relevant recent HRI work after confirming the exact predecessor and contribution; do not pad the bibliography with unrelated LLM papers.
- `submitted-abstract.txt`: the submitted abstract, preserved unchanged. Its results have not been verified.
- `questionnaire-inventory.md`: exact questions and scale anchors extracted from the current participant interface.
- `evidence-map.md`: mapping from claims to repository files and literature.
- [`literature/README.md`](literature/README.md): literature exploration register with dates and review status, plus source-located derivations from the 14 downloaded and reviewed papers. This audit is separate from the manuscript bibliography and includes additional unread follow-up leads.

Edit `main.tex` for the AAMAS submission. `manuscript.md` is a readable copy; update both when revising the paper.

## Details needed to finish the methods

1. **Actual protocol version.** Confirm which commit/configuration each participant used. The user confirmed a five-minute puzzle limit. Unconfirmed code defaults are 30 seconds between scheduled reminders and a 5-bpm rise using 15/60-second windows. The draft explicitly labels unconfirmed values as defaults.
2. **Adaptive decision rule.** Give the exact instructions to the wizard: observable signs of being stuck, interpretation of heart-rate changes, intervention spacing, choice of text versus movement, and reasons for withholding assistance. Also document training, number of operators, changes during collection, and deviations. Do not reconstruct a standardized rule if decisions were discretionary.
3. **Robot and setup.** Orangewood brand confirmed; exact model still needed, along with end effector, material and dimensions of pieces, marked pickup positions, delivery position, movement duration, and a consent-cleared photograph of the actual setup. Confirm whether the robot merely brings a piece or also orients/places it. Confirm participant/operator visibility.
4. **Sample and assignment.** Whether N=24 is recruited, completed, or analyzed; recruitment, compensation, demographics, exclusions, prior experience, and sample-size rationale. Actual condition-order and puzzle-by-condition counts are needed. Six order permutations are implemented; the “8 × 3” mentor note is ambiguous and is not silently treated as fact.
5. **Formative study.** The linked recruitment form was read on 5 October 2026; it profiles experience and supports recruitment, while the app adds a pre-task expectation item. No analyzed formative design study is established. If a separate assessment was conducted: original questionnaire, recruitment and N, response data, dates, analysis, and the specific decisions it informed. If none was conducted, keep “Task and Design Rationale” and omit claims of formative findings. Rewording questions for the paper must not alter what participants were actually asked; show verbatim administered wording in supplementary material.
6. **Procedure.** Instructions actually read, practice trials if any, fresh sensor calibration, break lengths, time limit, success tolerance, timeout handling, robot-movement timing, early termination, and total visit duration. Confirm whether the “three sessions” in the abstract are consecutive sittings in one visit.
7. **Ethics.** Actual approval/exemption, consent, recording coverage, operator disclosure and debriefing, withdrawal, robot safety, retention/access controls, and any external data transfers. The optional LLM integration requires a factual used/not-used statement, not an assumption.

## Interpretation points already reflected in the draft

- Heart-rate rise is an arousal cue, not a validated classification of stress, frustration, or cognitive overload. The live cue is not an HRV threshold despite internal `hrv` variable names.
- Adaptive assistance is researcher mediated. There is no automated puzzle-progress estimator in the inspected setup, and no automatic robot execution from a physiological event.
- Timing, content, modality, and assistance amount may all differ between the two assisted conditions. Unless controlled, describe the effect of each strategy as a whole rather than a causal effect of timing alone.
- The seven-point workload questions are adapted NASA-TLX items. The performance item runs in the opposite conceptual direction from demand/effort/frustration. Do not call an unweighted mean a standard weighted NASA-TLX score.
- The `stressReduction` question actually asks about frustration relief. The `clarityAndDistraction` item asks about disruption and is scored positively toward seamlessness.
- Intervention ratings are collected only after assisted rounds; absence in control is by design, not a zero score. Helpfulness combines hints and robot movements, so it does not isolate the arm's contribution.
- Trust is measured once at study end. It cannot support an adaptive-versus-scheduled trust claim without another condition-specific measure.
- Self-reported following of uncertain guidance is not observed automation bias. There is no retention/transfer test; task improvement is not a demonstrated learning gain.
- A robot cue's timestamp is not confirmed physical movement onset/completion. Sensor/context timestamps require checking before latency claims.
- Ordinary completed-round durations subtract pauses, but alternative early-end paths must be audited before pooling exports. Unsuccessful attempt duration is not successful completion time.

## What remains unwritten

Results, discussion, limitations, future work, and conclusion are deliberately omitted. The mentors' desired ordering—objective performance first, participant experience next—can guide the later Results section. No statistical tests, significance labels, effect directions, participant quotations, qualitative themes, or explanatory findings have been invented. In particular, the submitted abstract's findings are a record of supplied text, not results independently established by this draft.

The introduction's research questions organize the objectives already in the abstract. They are not represented as preregistered hypotheses. Check their wording against the team's original study documents.

## Page budget for the completed paper

A possible budget is 0.4 page for abstract/front matter, 0.9 introduction, 1.0 related work, 0.5 rationale or formative assessment, 1.2 system, 1.3 methods, 1.7 results, and 1.0 discussion/limitations/conclusion. This is a planning allocation, not a measured final layout. Outstanding author checks are collected below and must be resolved before submission; tighten system detail and relocate the full questionnaire and program mapping to supplementary material when results are inserted.

The official [AAMAS submission instructions](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/instructions/) specify eight main-track pages plus references, mandatory LaTeX, anonymous review, and unmodified template layout. The [Q&A](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/qa/) clarifies that an appendix in the main PDF counts within those eight pages. Core methods must remain in the main paper; supplementary material is optional for reviewers to read. Checked 5 October 2026.

## AI assistance record

The AAMAS instructions permit polishing/formatting and code assistance, and require detailed information when AI is used to create hypotheses or methodologies, including tool/version and prompts; authors remain responsible for accuracy. Their Q&A says not to invent missing records.

For this work, Codex inspected the source branch, read the supplied references and mentor notes, searched for relevant literature, drafted introductory and methodological prose from supplied evidence, organized the existing study objectives as research questions, and created the manuscript source and diagram. This is broader than proofreading. No data analysis or study execution was performed. Preserve this chat as the prompt/conversation record and record the exact model identifier from the session UI if available; do not infer a precise model version. Human authors should verify every claim and determine the accurate disclosure under the conference policy, including any earlier AI use in study design or implementation. The actual study methodology must come from the team, not retrospective suggestions in this draft.

## Building

The supplied `aamas.cls`, `ACM-Reference-Format.bst`, and `by.pdf` are beside `main.tex`. Import the folder into Overleaf, select `main.tex`, and use pdfLaTeX. In an existing local TeX installation use `pdflatex main`, `bibtex main`, then `pdflatex main` twice. The built-in editor could not compile this multi-file template because it did not load `aamas.cls`; the final PDF layout remains unchecked.

## Corrections requested by the author

The abstract in both manuscript copies is the author-supplied submitted abstract, unchanged in wording. Its existing findings remain as supplied; later results and discussion sections are still unwritten. AdaptAI and GuideAI are structural examples only and are not cited or discussed in the paper. The readable manuscript uses numbered square-bracket citations; the LaTeX source uses the template’s ACM numeric citation style and ACM-Reference-Format bibliography. The bibliography currently has 18 sources, below the mentor’s requested target.

## Outstanding method checks (kept outside the paper text)

**AUTHOR CHECK — Formative assessment:** The supplied recruitment form and the in-app pre-task questions establish a pre-study profiling stage (Section 5.1), but no response analysis demonstrating that it informed task or system design has been provided. The rationale above is based on task properties and the implementation. Do not recast recruitment or an initial expectation rating as a completed formative design study. If a separate formative assessment was conducted, add its method and evidence here.

**AUTHOR CHECK — Apparatus and assistance:** The robot is an Orangewood arm according to the study team; confirm the exact model, end effector, piece dimensions, pickup and delivery locations, actual movement behavior, and workspace layout. The description that the robot brings a piece follows the mentor's note; the code establishes the program-cue mechanism but cannot verify its physical effect. Also specify whether text and movement were always paired, their order and delay, and whether researchers used free-text hints in addition to presets.

**AUTHOR CHECK — Collection settings:** The 15/60-second windows, 5-bpm threshold, and 60-second calibration are code defaults at commit `cd1aa9d`, not verified settings for every collected session. Confirm the deployed revision, environment overrides, fresh-baseline procedure, watch placement, and handling of missing signals. The collector can load an earlier baseline unless a new one is requested. No claim of validated stress detection is made here.

**AUTHOR CHECK — Intervention protocol:** Replace the default interval with the interval actually used. Provide the operator rule for scheduled and adaptive assistance, including the first eligible intervention, when help was withheld, how lack of progress was judged, minimum spacing, repeated cues, participant requests, and fallback behavior when the watch was unavailable. The repository establishes available controls, but not a complete standardized operator policy or evidence that intervention dose was matched.

**AUTHOR CHECK — Sample and assignment:** Add recruitment, eligibility, compensation, demographics, prior tangram/robot experience, exclusions, and the basis for sample size. Confirm whether 24 denotes recruited, completed, or analyzed participants. Report the actual six order counts from the session records, including overrides. Four participants per order follows only if 24 assignments follow the uninterrupted default cycle. The mentor's “8 × 3” note is not enough to establish the allocation used.

**AUTHOR CHECK — Procedure in practice:** Confirm timeout and success criteria, familiarization, baseline timing, break duration, total visit duration, timer handling during robot movement, and any differences from this software-supported sequence. State what participants knew about human control and whether debriefing occurred. Confirm the number, training, visibility, and responsibilities of the operators.

**AUTHOR CHECK — Ethics and data handling:** Add the actual ethics approval or exemption, consent coverage for physiological data and recordings, withdrawal/debriefing procedure, robot safety arrangements, access controls, retention policy, and handling of identifying information. Local storage and participant codes alone do not establish anonymity or adequate data protection. State whether the optional external LLM advisor was enabled during collection; its presence in the repository is not evidence that it formed part of the experiment.
