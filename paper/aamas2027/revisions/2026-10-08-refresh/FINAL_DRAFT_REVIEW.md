# Manuscript review — 8 October 2026

This review is separate from the manuscript. It distinguishes completed editorial corrections from substantive interpretation and submission concerns.

## Corrections made

- Removed unfinished author checks, unavailable-role-count wording, participant IDs, later-confirmation narratives, and recording/reconciliation workflow from the manuscript and its hidden author-check comments.
- All primary round-level analyses now use 24 participants. Recomputed workload, subscales, intervention experience, confidence intervals, t statistics and Holm-adjusted p values; regenerated all three inferential figures. Earlier exclusion analyses remain internal robustness checks.
- Included all 15 available final surveys. Final survey n=15 is not the round-level sample size; there are complete round-level records for 24 participants. The supplied files contain no final questionnaire for nine sessions, so these responses cannot be invented.
- Simplified Task Performance to condition totals, meaningful differences and adjusted p values. Plots retain t statistics and confidence intervals.
- Kept three findings tables beside their introducing text. Converted the drifting full-width workload table to a compact single-column table; detailed p values remain in prose, plots and the analysis CSV.
- Removed all caption explanations of bold values; retained bold condition means as requested.
- Removed citation-verification workflow notes from the printed bibliography. Version/evidence information stays in the citation audit.
- Changed the title from “Trade-offs Between” to “Comparing”: significant trade-offs between the assisted policies are not established. The abstract's concluding sentence now describes differences as descriptive.
- Kept final-survey quotations anonymous and clearly separate from round-specific questionnaires; they are illustrative, not a coded thematic analysis.
- Preserved raw exports, entered counts, participant confirmation overlays and historical copies. Editorial removal of provenance from prose does not delete source provenance.
- At the author's request, removed the limitations paragraph about adapted-TLX psychometrics, combined modalities, end-only trust, and formative expectations/sample overlap. These review considerations remain here separately; factual scale/method definitions elsewhere in the manuscript are unchanged.
- Simplified Section4.5 to the main paired analysis and Holm adjustment. Additional tests and sensitivity-check descriptions are removed throughout the manuscript but preserved internally. Removed the sentence on researcher-scoring error and the shared scoring source, as requested. No test outputs or significance conclusions were changed.
- Figures6 and7 now use side-by-side constant/adaptive mean bars with SD whiskers and adjusted paired-test p values; they replace the paired-difference displays. Figure5 retains paired differences and pointwise95% confidence intervals. The descriptive bar heights and SD whiskers do not change the paired tests.

## Substantive points to retain or resolve outside the manuscript

1. **No statistically established adaptive–constant advantage.** Every corrected policy comparison is nonsignificant. Constant's better task means and adaptive's better experience means are descriptive; the paper must not claim superiority, equivalence, or an established speed–comfort trade-off. This is now reflected in the title, findings and conclusion.
2. **Robot contribution is not isolated.** Assistance combines hints with researcher-selected retrieval. Benefits cannot be attributed specifically to robot embodiment, retrieval, physiology, or timing alone. The contribution and discussion have been narrowed accordingly. A future factorial comparison would separate these components.
3. **Physiological trigger is not a validated stress detector.** A heart-rate rise can reflect movement and other influences. The manuscript describes a heart-rate-rise timing cue and explicitly avoids treating it as validated psychological stress. The dashboard's physiological labels illustrate the interface, not validation evidence.
4. **Exploratory inference.** Test families were selected during analysis, not preregistered. Holm controls family-wise false positives for the specified family, assuming valid tests; it does not cure outcome selection or confounding. The assisted–control piece/completion/workload findings also survive the stricter all-34-test check. Paired tests do not explicitly model puzzle difficulty, period, device or learning effects; balanced condition orders do not eliminate these effects.
5. **Measurement limits.** Correct-piece counts are researcher scores supported by notes/photos, selecting the highest count across admissible orientations. No independent inter-rater reliability is established. Solved puzzles receive seven pieces, so piece counts and completion are related measures, not independent replications. Seven-point unweighted NASA-TLX is an adaptation, not psychometrically interchangeable with the original instrument. The adaptation remains defined in Methods; the dedicated limitations paragraph was removed at the author's request. These are substantive review considerations, not drafting placeholders.
6. **Limited generalization.** The sample is 24 college-recruited volunteers aged 20–27, mostly undergraduates, with some faculty and graduate students/researchers. Transfer to industrial workers, older adults, or surgery is untested. Formative ratings concern expected assistance and partly overlap with the experimental sample.
7. **Ethics and concealed operation.** No ethics-committee review occurred and no exemption was established. The paper does not invent approval. The recorded procedure says concealed Wizard-of-Oz operation was not disclosed during or after the task; this is a substantive ethical concern, not an editorial phrase to hide. Authors must check applicable institutional/venue obligations before submission and provide truthful disclosure if required. Consent is not committee approval. [AAMAS instructions](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/instructions/) and reviewer policy should be checked against the actual procedure.
8. **Submission/distribution.** Verify AI-use disclosure against actual tool use and venue requirements. Genuine photos/screenshots are retained; no generated photographic assets were introduced. The repository is public: raw participant data, recordings and full copyrighted reference PDFs are not part of the proposed public push. The source ZIP includes private review/provenance documents and is a working handoff bundle, not an anonymous supplemental submission.

## What the current results establish

Holm-adjusted paired comparisons (24 participants):

| Measure | Constant vs control | Adaptive vs control | Adaptive vs constant |
|---|---:|---:|---:|
| Correct pieces | <.001 | <.001 | .273 |
| Completion | <.001 | <.001 | .296 |
| Adapted workload | <.001 | <.001 | .296 |
| Attempt duration | .0064 | .0064 | 1.000 |
| Frustration | .086 | .0019 | .997 |

Both assisted conditions also improve mental demand and perceived performance versus control (all adjusted p<.001). Constant reduces effort versus control (p=.004); adaptive's effort contrast is not significant (p=.078). Adaptive's timing rating is higher descriptively, but raw p=.0079 becomes adjusted p=.1189. All other assisted-policy experience contrasts are nonsignificant.

The statistical result is support for assistance in this task, not evidence that adaptive assistance is better than constant assistance. See `analysis/HOLM_EXPLAINED.md` and `analysis/paired-tests.csv` for the exact calculations.

## Verification scope

All 34 active references have downloaded actual PDFs, matching hashes, source-review cards and manuscript citation pointers. Reviews checked identity/version, study design, the passages supporting manuscript claims and relevant caveats. This does not mean every page was read or external experiments were independently replicated. Preserve this distinction in any description of verification.

Publication of the current paper, supporting source, aggregate analysis, scripts and audits was authorized by the author on8October2026. Raw participant datasets, recordings and full third-party papers remain local. See the writing-branch Git history for the actual publication commit; historical pause notes in the change record describe earlier states.
