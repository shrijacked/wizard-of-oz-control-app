# Author checks and decision record

Updated 5 October 2026. Internal working material, excluded from the submission. Begin with [README.md](README.md) for the writing flow and refresh procedure.

## OpenReview metadata and named working draft

The author-provided OpenReview screenshot for https://openreview.net/forum?id=p8Xw6g42Zz supplies the title **When to Intervene: Trade-offs Between Scheduled and Physiology-Triggered Robotic Assistance**, author order **Rishit Anand, Shrijak Kumar, Tanvi Sanghai, Sandeep Manjanna, Siddharth**, and submission number **2613**. These are now used in both manuscript formats. No affiliations or email addresses were supplied or inferred. The working PDF displays author names; restore the `anonymous` class option for an anonymous review submission. The original submitted-abstract archive is unchanged.

## Author-voice and protocol revision

The author supplied a new working abstract and clarified the enacted timing policy: **scheduled assistance is offered every 30 seconds; adaptive assistance is offered whenever the existing dashboard arousal flag is raised**. Task progress informs the assistance content, not a discretionary decision about whether to follow the timing trigger. The author confirmed that “HRV goes up” refers to this existing flag; the inspected signal is heart-rate change, not a separate HRV-increase threshold. This clarification supersedes the earlier draft's inference from what the interface permits.

The main text now uses a consistent research-author voice. Software-default comparisons, export dates, provisional-file provenance, detailed outcome sensitivities and scoring mechanics belong in these notes and [supplementary analysis notes](supplementary/analysis-notes.md). Following the subsequent author request, the interim sample-size statements are kept in author documentation rather than the main narrative. The paper retains a concise statement about reconstructed completion outcomes and the recorded-only sensitivity. All current numerical results still derive from nine complete participants and must be replaced before submission.

The supplied working abstract describes N=24 and the anticipated full-paper framing. The actual tables still summarize nine complete participants; no outcomes have been invented for the planned remaining sample. Reconcile the abstract with the final dataset before submission. The historical `submitted-abstract.txt` is unchanged.

The main AI disclosure is brief. An additional [supplementary statement](supplementary/ai-use-statement.md) is retained; the author requested removing the cross-reference sentence from the main text. Required information has been moved, not reclassified as proofreading or removed. The team should reconcile that statement with the retained conversation and any earlier study-design use before submission.

## Confirmed decisions

- Follow the 5 October [structure-review.md](structure-review.md): separate task profiling, system, and study; objective findings before subjective findings; three contributions; no results in the introduction.
- The author clarified that **24 is the planned sample and collection is ongoing**. The available snapshot supports nine complete participants and one partial session, not a completed N=24 study.
- The separate tangram survey needs responses; correct-piece scoring still needs calculation. Neither has findings to write yet.
- The author requested an actual paper now, with findings replaced later. Both manuscript copies now include results, discussion and conclusion using the available evidence. The working abstract is revised; `submitted-abstract.txt` remains unchanged as a historical record.
- All retained references must have downloaded PDFs and relevant paper text checked. The current 15 satisfy that audit; 12 first appeared in 2024–2026. This does not meet the mentor's 40-reference target. AdaptAI and GuideAI remain structural examples only, neither cited nor imported as study evidence.

## Method details the team still needs to supply

1. **Deployed settings:** record the commit/configuration for each session, threshold/window overrides, watch placement, baseline procedure, and signal-failure handling. The scheduled interval and flag-triggered adaptive policy are now author-confirmed. The inspected detector uses 15/60-second windows and a 5-bpm rise; exact historical overrides remain an internal check. Four bundled study-definition files match this checkout without proving every historical setting.
2. **Operator delivery:** document first scheduled intervention, handling of a sustained/repeated flag, any refractory interval, signal failures, participant requests, preset versus free-text hints, text/movement pairing, training, operator count and deviations. The confirmed policy fixes when help is offered; remaining checks concern operational details and assistance content.
3. **Apparatus and physical behavior:** exact Orangewood model/end effector; piece dimensions/material; pickup/delivery positions; whether the arm also orients or places pieces; action duration; participant/operator visibility; actual sensor and camera use; consent-cleared setup photo. The code establishes program cues, not the arm's executed trajectory.
4. **Recruitment and participants:** eligibility, recruitment, compensation, demographics, prior experience, target-sample rationale, exclusions and missing participants. The complete subset includes P101 and P103–P110. Explain P102's absence and upstream exclusions from source records rather than guessing. Realized allocation counts are in the summary; six available orders do not imply equal realized groups.
5. **Procedure and outcome rules:** familiarization/practice, calibration, break lengths, total visit duration, interpretation of the three blocks/sittings, five-minute limit enforcement, late-success handling, success tolerance and early-stop paths. Exported durations exceed 300 seconds for some rounds; do not truncate or recode these without a documented decision.
6. **Ethics and data:** actual approval/exemption and identifier, consent coverage, withdrawal/debriefing, disclosure of human control, camera/physiology retention and access, robot safety procedures, external data transfers and whether the optional LLM advisor was enabled. The current ethics section describes supported interface/data facts; it cannot substitute for actual institutional and procedural details.

## Pending evidence streams

**Task-profile survey:** locate/finalize the form and linked square task, establish sample/recruitment/overlap, physical or digital materials, timing and success verification, exact hint/robot/combined assistance questions, incomplete-attempt treatment, and actual collection dates. After analysis, expand §3 using the reserved subsections in the outline. A later survey contextualizes the main study; it did not prospectively inform earlier design decisions.

**Photograph scoring:** inventory usable final images before scoring. Specify solution references, alternative valid arrangements, symmetry/rotation/reflection, placement tolerance, occlusion and unscorable cases. Define how solved trials enter a 0–7 score. Record annotators, independent review/agreement and adjudication. Preserve missing scores as missing; do not infer piece counts from the binary success flag alone.

**Comments:** five of the nine final questionnaires have nonempty comments. Their availability is recorded in the supplementary analysis notes; the paper reports the final ratings without qualitative themes. Choose and document an analysis method before adding qualitative findings; represent mixed experiences faithfully.

## Current results audit

- The through-P111 bundle is incomplete. P108–P110 exports are provisional; replace carefully when definitive versions arrive. P109 lacks a raw watch file although exported telemetry exists. Participant aliases P09→P109 and P11→P111 are recorded in the bundle.
- P111 has five finished rounds. Its stale counter is not evidence of a sixth finished round: R6 is in progress and R7–R9 are unstarted. Only finished rounds enter its separate descriptive supplement.
- P101 lacks recorded binary outcomes in all nine rounds. The bundle's working coding marks scheduled R4 and R5 solved and all others unsolved; adaptive R9 is ambiguous. The manuscript identifies reconstructed outcomes and reports the recorded-only sensitivity; the alternative-R9 sensitivity is documented in the supplementary analysis notes. Resolve against original evidence before finalizing.
- Primary completion counts are control 4/27, scheduled 19/27, adaptive 13/27. Recorded-only counts are 4/24, 17/24, 13/24. Treating ambiguous adaptive R9 as solved gives 14/27. Including the partial session gives 4/30, 19/27, 14/29. These are descriptive counts, not a significance analysis.
- Ratings and continuous measures are averaged across three rounds within each participant-condition, then summarized across nine participants using sample SD. The workload composite reverses performance as `8 - response` before averaging six items. Neither a 0–100 scale nor weighted NASA-TLX is used.
- Puzzle allocation and intervention amounts differ by condition. Adaptive has no puzzle 2 or 3 in this snapshot. Scheduled logs 270 hints/54 robot cues; adaptive logs 230/31. These facts prevent attributing differences to timing alone.
- `stressReduction` is frustration relief; `clarityAndDistraction` is positively scored seamlessness. Assistance items are absent in control by design. Final trust/reliance items occur once after all conditions, not once per condition.
- Commands are not proof of physical execution. HR-rise flags are not validated psychological labels. Round duration includes unsuccessful attempts and is not successful completion time. Self-reported reliance is not observed automation bias; no learning/retention test exists.

The script, numerical output and evidence paths are linked in [evidence-map.md](evidence-map.md). Choose any final inferential model with the team; account for repeated participants and consider puzzle identity, block position, missingness and coding sensitivity. No retrospective preregistration claim is appropriate.

## AI assistance record

Codex inspected repository materials and downloaded paper text; organized research questions from the existing study aims; drafted and revised the manuscript, diagram and author documentation; wrote a descriptive-summary script; and checked calculations and citation support. The present work includes data summarization and substantive writing, beyond proofreading. It did not execute the study, collect the pending survey, score photographs, or establish missing protocol/ethics facts.

Preserve this task's conversation as the prompt record, including the author's clarifications and request for provisional findings. Record the exact model identifier from the session UI if available rather than guessing a version. Review earlier AI use in implementation/study design separately. Human authors must check the complete disclosure against the official conference policy and retain responsibility for claims.

## Submission readiness

The class, bibliography style and historical submitted abstract are preserved. The working draft uses submission ID `2613`. The revised PDF preview was compiled with Tectonic 0.17.0; see `BUILD.txt` for its current page count and validation. CCS concepts, some bibliography fields and a class/bibliography balancing/conditional warning remain for submission cleanup. Resolve the method/ethics checks, reconcile the working abstract with the final sample, verify anonymity and rerun the recommended pdfLaTeX build before submission.

## Visible drafting reminders

Brief notes now appear in §3, §4.1, §4.2 and §5.1–§5.5 in both manuscript formats and the PDF. Remove them as the corresponding material is completed. The section-by-section comparison is recorded in structure-review.md.

## Plain-language methods and final-analysis reminders

The author requested removing the term “within-participant” and the sentence labeling the current results descriptive from the paper. The procedure still states that each person experiences the three conditions. The author also requested removing the interim condition-order, puzzle-allocation and intervention-frequency caveats from the discussion/limitations. These are editorial changes for the working draft; the data checks and unfinished inferential analysis remain recorded above and must be resolved during final analysis.

Visible notes now request additional references in §2, pairwise comparisons and correlation graphs at the end of §5.1, and graphs alongside workload and intervention-experience results. Pairwise condition comparisons and correlations between measures are different analyses. Select the measures and appropriate treatment of repeated observations before calculating or plotting correlations. No new tests, correlations or findings have been generated by this edit.

The named working PDF now visibly prints Submission Id: 2613 beneath the author row. Anonymous mode continues to use the template’s built-in ID line.

## Intervention-count and robot-role revision

The author requested removing the intervention-count paragraph and the claim about fewer adaptive interventions from the main manuscript. Counts remain in the analysis records and supplementary notes for the final analysis.

The author also supplied participant feedback that robot assistance helped retrieve pieces, while hints mattered more to puzzle solving. Section 6.3 now discusses this limitation and proposes direct placement of pieces by the robot as future work. This is an author-reported feedback summary, not a newly completed qualitative analysis. Link it to the final-form responses and insert actual quotations during the planned comment analysis; no participant quotation or frequency was invented. The discussion now carries the visible note INSERT QUOTATIONS FROM FINAL FORM.
