# Paper revision, 7 October 2026

## Review and preservation

The full pre-change paper folder and compiled PDF are frozen in `before/`. `baseline-manifest.json` records 32 file hashes and base commit `3c4ddb9`. Do not edit the baseline. The original results and survey archives also remain untouched; `input-manifest.json` identifies their hashes and locations.

Review the [highlighted manuscript](highlighted-review.html), [exact TeX diff](main.tex.diff), and [exact Markdown diff](manuscript.md.diff). Green additions and red deletions show every wording/number change. [change-inventory.json](change-inventory.json) lists all changed/new paper files and hashes; `file-diffs/` contains exact diffs for every changed/new text file, including analysis and handoff documents. New figure sources/outputs are listed below; the preserved/current PDFs show layout changes.

## Architecture push

`output/figures/assistance-architecture.tex` was committed and pushed to `writing` as `3c4ddb9` (`docs(paper): add detailed TikZ assistance architecture`). Its exact committed patch is saved in `architecture-push.diff`. No diagram geometry was changed during the manuscript revision. Current architecture and physical-setup drawing code were imported into manuscript-local TikZ files. The setup PNG was regenerated from the current source, avoiding the older local exported preview. The paper revision itself is local, awaiting review/push.

## All manuscript changes

| Location | Before | After | Evidence/reason |
|---|---|---|---|
| Source header | Older snapshot/date pointers | Current revision/handoff pointers | Internal navigation only. |
| Abstract | Planned N24 alongside older findings; unqualified adaptive advantage | Actual N12; new rates 13.9/66.7/50.0%; explicit 30 s/flag timing; higher adaptive averages qualified; attempt rather than solve all nine | New complete-cohort records and exploratory comparisons; no invented remaining participants. |
| §3 heading/structure | Task and Design Rationale with survey placeholder | Tangram Task Profiling and Assistance Expectations, two subsections | Approved outline; observed survey now available. |
| §3.1 | No survey sample/results | N24, roles, age/gender, familiarity,15 complete/8 partial/1 unsolved,17 ever stuck and categorical time | CSV questions/responses; task shape confirmed by author as linked square tangram. |
| §3.1 reminder | Broad survey todo | Short interface/recruitment/timing confirmation note | These facts are not in the CSV or reply. |
| §3.2 | No assistance-expectation findings | Four independently rated hypothetical options, means/SD, placement-guidance comments and Figure1 | Explicit1-most/5-least anchors; not rankings or observed assistance effects. |
| §3 task rationale | Three task-rationale paragraphs | Retained seven-piece/nine-target rationale; merged repeated manipulation/sequence explanation | Concise author voice; no claim the survey prospectively determined the study. |
| §4.1 architecture | Small six-box inline diagram | Current four-module architecture in Figure2 | Pushed source; signal processing, condition timing, human delivery and participant interaction. |
| §4.1 apparatus | Short hardware/piece-retrieval paragraph | Opaque partition, two researchers, top-mounted camera, participant laptop, fixed pickup/drop/assembly layout and Figure3 | Author-confirmed layout and current setup TeX. |
| §4.1 reminder | Setup photo/details | Setup photo/robot and piece details | Diagram completes schematic, not missing photograph/dimensions. |
| §4.2 | General HR-rise description and broad elaboration note |15 s median versus preceding 60 s median,5-bpm threshold, baseline fallback, quality checks, task-context delivery | Collector implementation and confirmed existing flag; no defaults-versus-settings prose. |
| §4.2 reminder | General monitoring elaboration | Baseline procedure and repeated-flag handling | Operational facts remain unprovided. |
| §5.1 sample/procedure | Target24, generic procedure | Actual 12,7 men/5 women,20–27years, mean 21.50/SD 2.02, procedure in past tense | New export; recruitment/practice/ethics note remains. |
| §5.1 analysis | Aggregation and main-text reconstruction audit | Aggregation plus exploratory paired sign-flip/Holm and per-condition Spearman methods | Reproducible new script; reconstruction/sensitivity moved to internal analysis notes. |
| §5.1 reminder | Final results/pairwise/correlation todo | Final-results refresh note | Pairwise comparisons and correlation graphs now supplied; collection target remains an author decision. |
| §5.2 |36/81 solved,27 trials/condition, old duration/rate table and sensitivity paragraph |47/108 solved,36/condition, updated Table1, Figure4 and adjusted pairwise comparisons | Results summary and participant averages. Every table cell change appears in the exact/highlighted diff. |
| §5.2 sensitivity | Recorded-only sensitivity in prose | Preserved in author/supplementary notes | User requested concise paper voice; coding alternatives remain documented. |
| §5.2 reminder | Correct pieces/plots/tests | Correct-piece count only | No photo-derived score invented; plots/tests completed. |
| §5.3 | Old workload Table2 and averages; graph todo | All seven table rows updated, Figure5 paired workload/frustration, adjusted tests | Checked seven-item reporting including six-item composite. |
| §5.3 relationships | None | Figure6 per-condition Spearman heatmaps and interpretation | Participant averages; no significance/causal claims; shared frustration/composite acknowledged briefly. |
| §5.4 | Old Table3 and unqualified favorable adaptive prose; graph todo | All four rows updated, full-width Figure7 and no significant assisted-policy contrasts | Actual paired ratings; plot width/font chosen for legibility. |
| §5.5 | Old final ratings; qualitative todo | Updated helpfulness/efficacy/trust/reliance and illustrative P101/P103 quotations; two fun comments | Final forms; 6 nonempty comments, not formal thematic coding. |
| §6.1 | Older performance/experience narrative | Updated control comparisons; adaptive-scheduled differences qualified; survey connection | New calculations; interpretation remains tentative. |
| §6.2 | Timing paragraph and future work | Condensed combined timing/future-work paragraph | Removes repetition without changing confirmed policy. |
| §6.3 | User-supplied retrieval/hint limitation and quotation placeholder | Verbatim P103 movement-time quotation; direct placement retained; anticipated versus experienced-helpfulness distinction | Final form and author's future-study suggestion. |
| §6 pending scoring | Wording implied scores would arrive | Conditional partial-progress measure | Photographs/rule still needed. |
| Conclusion | Old pattern and “completing the study” wording | New control improvements and qualified assisted-policy comparison | Matches updated evidence without interim/subset narration. |
| Figure/table references | Architecture as Figure1 | Seven sequential figures, three tables, consistent cross-references/captions/accessible descriptions | Added evidence and current diagram sources. |

Introduction, related-work claims, bibliography, title/author order, submission ID 2613, ethics prose and brief AI disclosure remain unchanged in substance. The historical submitted abstract, class and bibliography style remain unchanged. No intervention totals or removed allocation/frequency caveats were added to the paper. Uppercase notes remain brief and contain no em dashes.

## Numerical changes at a glance

| Outcome | Previous control/scheduled/adaptive | Revised control/scheduled/adaptive |
|---|---|---|
| Solved |4/27,19/27,13/27 |5/36,24/36,18/36 |
| Completion |14.8%,70.4%,48.1% |13.9%,66.7%,50.0% |
| Mean duration(s) |289.81,234.11,276.48 |289.58,239.03,268.78 |
| Mean workload |4.76,3.74,3.85 |4.72,3.69,3.74 |
| Mean frustration |4.67,3.70,3.22 |4.44,3.44,3.17 |

All dimension/item means and SDs are visible in the manuscript diff, not just these headline values. Scheduled duration SD is 51.42 after correct two-decimal rounding of 51.415019. The graph/test script uses the source records, not rounded manuscript cells.

## Added analyses and figures

`scripts/update-paper-analysis.py` produces the survey summary, participant-condition averages, 16 exploratory paired contrasts, Holm-adjusted p-values, bootstrap difference intervals retained internally, per-condition Spearman matrices and five vector PDF/PNG plots. It checks repeated-round completeness and workload scoring, derives survey counts from rows, and handles rank ties after rounding only floating-point noise. No new physiological, correct-piece or formal qualitative outcomes are manufactured.

Added manuscript figure files: `task-profile-survey.pdf/png`, `performance.pdf/png`, `workload.pdf/png`, `correlations.pdf/png`, `intervention-experience.pdf/png`, plus current `assistance-architecture.tikz.tex/png` and `physical-setup-topdown.tikz.tex/png`. The diagrams are embedded as TikZ; the plots as vector PDF. Pairwise graphs use participant lines/dots and mean diamonds; survey bars show SD; correlations have no significance marks.

## Supporting-file changes

- README: replaced stale state with current coverage, reproducible commands, file ownership, input locations, preservation and refresh flow.
- Author notes: updated metadata decisions, actual sample, source checks, survey unknowns, outcome reconstruction and remaining facts; older notes preserved in baseline.
- Supplementary analysis notes: updated denominators/sensitivities, exact exploratory analysis/correction assumptions, correlations, survey scoring and quotation-selection limits.
- Evidence map: every new survey/method/result/quote/figure claim linked to source or author clarification.
- Structure review: current coverage compared against the approved plan; original outline interpretation retained as historical context.
- Reference audit/map/counts: all 15 PDF hashes and 35 anchors rechecked, current manuscript hashes/locations updated;15 references and 21 mentions unchanged. No new citation claims.
- BUILD: current full-project build, page count, visual QA and remaining metadata/build caveats.
- Revision tools/manifests: immutable baseline, input hashes, change inventory, all text diffs and highlighted manuscript review. The review script does not edit the paper or baseline.
- PDF preview: rebuilt from the updated TeX, diagrams, plots and existing bibliography; all pages reviewed.

## Remaining work and open questions

Confirm the selected input archives; survey interface/recruitment/chronology/overlap; experimental recruitment/practice/compensation and outcome/timeout rules; baseline/watch placement and repeated-flag/signal-failure behavior; hint selection and exact robot/piece details; ethics/consent/debriefing and photo/scoring material; affiliations; further verified references and final statistical/source adjudication. These are requested from the author and not inferred.
