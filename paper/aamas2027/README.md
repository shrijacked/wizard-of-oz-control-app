# AAMAS 2027 writing handoff

Updated 7 October 2026. Canonical source: [main.tex](main.tex). Readable counterpart: [manuscript.md](manuscript.md). Current checked PDF: [aamas2027-current.pdf](../../output/pdf/aamas2027-current.pdf). Branch: writing.

## Current revision

Start with the [change log](revisions/2026-10-07-methods-findings/CHANGELOG.md), [highlighted HTML](revisions/2026-10-07-methods-findings/highlighted-review.html), [highlighted TeX](revisions/2026-10-07-methods-findings/tex-review/main-highlighted.tex), [highlighted PDF](revisions/2026-10-07-methods-findings/tex-review/main-highlighted.pdf), and [frozen pre-change source/PDF](revisions/2026-10-07-methods-findings/before/). Do not edit any baseline. Exact diffs and the hash inventory document every changed file.

The [current structure](structure-review.md) separates §4 Study Method: Assistance System and Experimental Protocol from §5 Findings. §3 is Formative Assessment of Tangram Solving. Findings retain objective-before-subjective order. Contributions now cover spatial-task novelty, performance/workload outcomes, intervention experience and the physical-assistance feedback. Five figures and three tables remain; Table 2 includes all workload p values.

## Data status and interpretation

Planned experiment target: N=24. Current calculations: 12 complete participants, 108 rounds, identified in author-notes.md. The formative assessment contains 24 responses; some overlap with the experiment is author-confirmed. Numerical results are provisional and must be replaced from the final accepted export. No unobserved participants or scores have been manufactured. The original abstract, anonymous authors and submission ID 2613 are retained; the visible draft reminder remains pending final reconciliation.

Both assisted conditions improve completion and overall workload relative to control under the stated exploratory correction families. Constant assistance has the highest observed completion and shortest mean duration. Adaptive assistance has higher mean intervention ratings and lower mean frustration, but no constant-adaptive comparison is significant. Frustration rises for some participants. Waiting is a researcher observation, not coded evidence or a participant quotation; its cause and condition distribution are unverified.

Constant assistance is offered every 30 seconds. Adaptive assistance follows the existing HR-rise arousal flag, with a 15-second wait for rapid/sustained recurrence. Task context guides preset hint or robot-plus-hint selection. HR rise is distinct from HRV. The three-minute pre-task baseline procedure is author-confirmed. Preserve concise research-author prose; keep provenance, coding sensitivities, provisional coverage and implementation audits in internal documentation. Do not introduce intervention totals or invent missing facts.

## Files and reproduction

| File | Purpose |
|---|---|
| [main.tex](main.tex), [manuscript.md](manuscript.md) | Synchronized manuscript and readable text. |
| [references.bib](references.bib) | 20 cited, downloaded-PDF-verified sources; 17 first appeared in 2024–2026. |
| [REFERENCE_TEXT_MAP.md](literature/REFERENCE_TEXT_MAP.md) | Every current citation claim mapped to PDF text; 31 mentions, 49 verified anchors. |
| [CITATION_COUNTS.md](literature/CITATION_COUNTS.md) | Citation count for each source, excluding the bibliography. |
| [new-source reading record](literature/NEW_SOURCE_REVIEW_2026-10-07.md) | New-source reading scope, limits and excluded leads. |
| [ALL_OUTCOMES.md](analysis/ALL_OUTCOMES.md), [JSON](analysis/all-outcomes.json), [CSV](analysis/all-outcomes.csv) | 31 experiment contrasts and six formative pairs; raw/adjusted p values and global sensitivity. |
| [author-notes.md](author-notes.md), [evidence-map.md](evidence-map.md) | Actual sample, coding decisions, author-confirmed protocol and remaining facts. |
| [AAMAS figure-policy note](method-checks/AAMAS_AI_FIGURE_POLICY.md) | Official 2027 policy; no explicit TikZ exemption, interpretation unresolved. |
| [BUILD.txt](BUILD.txt) | Build dependencies and current QA status. |
| [VERSIONS.md](VERSIONS.md) | Historical snapshots and downloadable projects. |

Run scripts/update-paper-analysis.py for the source-export summaries/plots, scripts/analyze-all-paper-outcomes.py for all paired tests, and scripts/plot-assisted-comparison.py for the assistance bar chart. These require NumPy/Matplotlib; source paths are in the scripts. Run scripts/validate-paper-reference-map.py after refreshing the citation map to check manuscript hashes, every citation location and every exact PDF anchor. The observed matched data and literature PDFs remain in gitignored data/writing-reference; teammates need authorized local input copies. Tracked numerical JSONs support plot/review reproduction without personal form fields.

Tests are two-sided exact paired sign flips on participant-condition averages; Holm is applied to the three comparisons for each endpoint, the four assistance-rating comparisons, and the six formative rating pairs. Tests were chosen during revision, not preregistered. The audit also reports Holm over all 31 experiment tests as a sensitivity check. Final overall ratings are once-per-study and have no valid condition contrast; correct-piece scores are still absent. Do not add arbitrary p values for these outcomes.

The editable diagram sources are output/figures/assistance-architecture.tex and physical-setup-topdown.tex. Their current TikZ bodies are copied into paper/aamas2027/figures/*.tikz.tex. Both standalone sources pass the desktop compiler. Main-paper figures are rendered directly from those bodies; exported diagram PDF/PNG previews in this revision are cropped from the checked main PDF so they show the same labels/layout without a separate document build.

## Next steps

1. Review the changed manuscript and all source-supported claims. Keep statistical interpretation consistent with its exploratory families.
2. Resolve eligibility/practice, robot/material/safety particulars, formative timing/link/overlap, enacted participant instructions and institutional review/exemption. See author notes.
3. Score final photographs, confirming tolerance/scorers and the maximum-correct-orientation rule. Add correct-piece outcomes in §5.1.
4. Reconcile the final sample and source coding, rerun all statistics, then refresh abstract/results/contributions/tables/plots/demographics and remove working reminders only when supported.
5. Clarify the conference interpretation of AI-assisted TikZ figures and prepare any required methodology disclosure. No inquiry has been sent on the authors’ behalf.
6. Before the next edit, freeze a new baseline. Update citation locations/hashes and review files after every manuscript change. Compile and inspect the PDF, then repackage the clean project.

The current clean PDF is nine pages with main text ending on page eight. It uses the supplied unchanged AAMAS class/style. The complete project ZIP contains compile dependencies and checked PDF, excluding internal notes/reviews and raw participant data. Earlier cumulative reviews remain historical and must not be regenerated against the current paper.
