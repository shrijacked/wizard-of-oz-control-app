# Supplementary analysis details

Updated 7 October 2026. Internal analysis record; review before inclusion in a public supplement.

## Scoring and denominators

The source contains 12 complete participants with three rounds per condition (108 rounds, 36 per condition). Round ratings and durations are averaged within participant-condition before means/sample SD are computed across the 12 people. Overall workload is the unweighted mean of mental, physical, temporal, `8 - performance`, effort and frustration, each on 1–7 scales; performance in the dimension table retains its original direction. The scripts verify each round's stored composite against the six responses.

Completion uses the supplied `analysisSolved` coding. Primary counts are control 5/36, scheduled 24/36, adaptive 18/36. Excluding P101, whose completion outcomes are reconstructed, gives 5/33, 22/33, 18/33. Coding ambiguous P101 adaptive R9 solved gives 19/36 adaptive. Including P111's five completed rounds gives 5/39, 24/36, 19/38. Unfinished/unstarted rounds are missing, not failures. P119 is setup-only and excluded. P118's reused setup identifier is not a second participant. Source aliases/provisional flags and actual allocation/exposure audits are preserved in the numerical summary.

Duration is exported pause-adjusted time across solved and unsolved attempts. It is not successful completion time. Some values exceed the intended five-minute limit; no truncation or recoding is imposed. Final trust and reliance are once per person; assistance-specific items are absent in control by design.

## Exploratory paired tests

`scripts/update-paper-analysis.py` enumerates all 4096 sign assignments for each 12-person paired-difference vector. The two-sided statistic is the absolute mean difference, including ties within a numerical tolerance of 1e-12. Exact enumeration avoids Monte Carlo p-value error; it does not establish a randomized or preregistered confirmatory test. Sign-flip inference requires an appropriate symmetric paired-difference null. Review the final inferential approach with the team.

Holm adjustment uses a separate family of three condition contrasts for each endpoint (completion, duration, overall workload, frustration), and one family of four adaptive-scheduled assistance-item contrasts. There is no global correction across endpoints. Reported manuscript p-values use these adjusted values. Bootstrap percentile intervals in the JSON resample the paired participant differences 20,000 times with seed 2613; they are not multiplicity-adjusted and are not claimed as confirmatory intervals. No bootstrap interval is currently printed in the paper.

Completion improves versus control for both policies. Scheduled-control duration and both workload contrasts are significant within the stated exploratory families. Adaptive-control frustration is significant; scheduled-control frustration is not after correction. None of the assisted-policy contrasts is significant. Higher adaptive means must not be rewritten as demonstrated superiority.

## Correlations and plotting

Spearman coefficients use average ranks for ties, separately across 12 participant averages in each condition. No correlation p-values are calculated, and no causal claim is made. Frustration contributes to overall workload, creating a part-whole relationship. Gray paired lines join the same person; diamonds show means. Graph PDF/PNG exports are generated together. Tiny horizontal jitter separates overlapping dots without changing outcomes.

## Task-profile survey

The CSV contains 24 unique username rows; usernames are not reproduced in analysis outputs or manuscript. There are 15 reported complete, eight partial and one unsolved attempts. Time is categorical self-report and is not restricted to successful completers. Expected-helpfulness options are independently rated 1–5, lower better, not forced rankings. The unspecified robot-versus-digital item's anchors are unverified, so that item is not reported. The assistance checkbox permits contradictory combinations and is not treated as mutually exclusive. Survey figures show means with SD, not confidence intervals.

The author confirmed the linked task is a square tangram. The author confirms a digital task with a timer linked through a Google Form, college mailing-group recruitment, and overlap with some experimental participants. This does not establish prospective design chronology, exact overlap or independent samples. Time values remain self-reported categories, not extracted game timer logs.

## Comments and remaining analysis

Six final forms have nonempty comments. The paper uses verbatim excerpts from P101 and P103 and describes the two fun comments; this is illustrative quotation selection, not formal thematic coding or a prevalence estimate. P104's critical robot comment and P118's questionnaire feedback remain available in the source, rather than being converted into invented themes. Further qualitative analysis should retain mixed experiences.

Correct-piece scoring is pending. The author specifies taking the orientation with more correct pieces when there are two possible orientations for a partial solution. Final photographs, placement tolerance, symmetry/occlusion/missingness rules and annotator review are still required; no score was inferred from binary completion. The final statistical model should consider repeated participants, puzzle/block effects and coding sensitivity. The final export must replace provisional records without duplication. This audit is kept separate from the manuscript's concise narrative.

## Sources

[Results summary](../analysis/results-summary-2026-10-07.json) and [revision analysis](../analysis/revision-analysis.json) record source hashes and outputs. [README](../README.md) gives untouched archive locations, scripts and writing flow. [Author notes](../author-notes.md) track missing protocol facts. No raw usernames or source files are pushed with the paper.

## Protocol clarification and timing audit

The author specifies stopping unsolved trials at 5 minutes, five-minute inter-sitting breaks, preset hints and researcher choice of hint-only versus robot-plus-hint, with every movement paired with a hint. Rapid/sustained arousal flags are handled with a 15-second wait; these operational choices do not change the detector algorithm. Existing exported durations above 300 seconds remain untouched pending an agreed timing rule. The temporary three-minute preparation/baseline description must be reconciled with the collector’s 60-second baseline computation. No results, tests or plots changed in this protocol revision.
