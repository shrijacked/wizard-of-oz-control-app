# Paper versions and collaborator handoff

7 October 2026. Branch: writing. This publishing commit keeps the current draft, old source/PDF snapshots and cumulative highlighted review together. Find the publishing commit with `git log -- paper/aamas2027/VERSIONS.md`. The manuscript itself is unchanged by packaging/documentation.

Latest local revision: [constant assistance terminology](revisions/2026-10-07-constant-assistance/CHANGELOG.md), with [highlighted changes](revisions/2026-10-07-constant-assistance/highlighted-review.html). The source, current PDF, plots and clean ZIP now use the new name. The earlier cumulative review remains a historical review of the preceding rounds.

## Pick the version you need

| Version | Source | PDF or review |
|---|---|---|
| Current clean working paper | [main.tex](main.tex), [readable manuscript](manuscript.md) | [Current eight-page PDF](../../output/pdf/aamas2027-current.pdf) |
| Earlier version before protocol/anonymity/abstract/graph edits | [Frozen source](revisions/2026-10-07-cumulative/before/main.tex) | [Frozen PDF](revisions/2026-10-07-cumulative/before/aamas2027-current.pdf) |
| Cumulative highlighted version covering all three recent rounds | [Marked-up TeX](revisions/2026-10-07-cumulative/tex-review/main-highlighted.tex) | [Nine-page marked-up PDF](revisions/2026-10-07-cumulative/tex-review/main-highlighted.pdf), [HTML review](revisions/2026-10-07-cumulative/highlighted-review.html), [combined change log](revisions/2026-10-07-cumulative/CHANGELOG.md) |
| Original draft before the newer survey/results revision | [Frozen source](revisions/2026-10-07/before/main.tex) | [Frozen PDF](revisions/2026-10-07/before/aamas2027-current.pdf), [original revision log](revisions/2026-10-07/CHANGELOG.md) |

Intermediate snapshots and their exact diffs remain in [protocol/anonymity](revisions/2026-10-07-protocol/), [abstract/sample restoration](revisions/2026-10-07-working-sample/) and [figure comparison](revisions/2026-10-07-figures/). They describe the state when that round was made. Do not edit baselines or regenerate an old review against a later paper.

## Downloadable projects

- [Current clean TeX project](../../output/packages/aamas2027-complete-latex-project.zip): main.tex, external references.bib, supplied class/style, figures and checked current PDF. Select main.tex in Overleaf.
- [Earlier TeX project](../../output/packages/aamas2027-before-protocol-latex-project.zip): the named source before the recent three rounds, matching figures/bibliography/template and its old PDF. Select main.tex.
- [Highlighted cumulative project](revisions/2026-10-07-cumulative/aamas2027-cumulative-highlighted-tex.zip): select main-highlighted.tex; all project dependencies and the checked review PDF are included.

These are writing/review packages. Internal notes, historical author identities and raw participant inputs are not needed in the clean project. The review source contains historical named-author diff comments, so use the clean source for anonymous submission.

## What the current draft contains

The earlier abstract is retained with the condition name updated to constant assistance. The working sample is planned N=24, and the visible draft notice identifies pending final results/demographics. Anonymous authors and submission ID 2613 are retained. The current data calculations have not been inflated to the planned sample. Survey and protocol details have been added; final photographs and correct-piece scores remain pending.

Six figures remain: task-profile survey, assistance architecture, physical setup, workload/frustration, matched constant/adaptive correlations, and adaptive-minus-constant assistance differences. The redundant performance plot and heatmaps are archived. The current PDF is eight pages; the cumulative review is nine pages with added/deleted text and replaced figures visible.

## Continue the work

1. Read [README](README.md), [author notes](author-notes.md), [structure review](structure-review.md) and the [cumulative change log](revisions/2026-10-07-cumulative/CHANGELOG.md).
2. Preserve a new pre-change source/PDF snapshot and hash manifest before the next manuscript revision. Keep older snapshots intact.
3. Resolve the remaining protocol facts: actual baseline procedure, enacted participant instructions, institutional review status, eligibility/practice, robot/material/safety/data details and exact survey overlap. Add a setup photograph and scored final photos.
4. Analyze the final export, reconcile inclusion/outcome/timing decisions, then replace all draft numerical claims, tables/graphs and demographics. Keep N=24 as a planned target until the observed sample is reconciled. Remove the draft notice only when the analysis is final.
5. Use scripts/update-paper-analysis.py for the full analysis and scripts/plot-assisted-comparison.py for the two comparison plots. Both require NumPy/Matplotlib; input paths are in the scripts. Existing raw input archives and literature PDFs are local, ignored data files; teammates need authorized copies to rerun source analysis. The plot-only helper can use the tracked analysis JSON.
6. Edit canonical main.tex and synchronize manuscript.md. Maintain [evidence-map](evidence-map.md) and the [reference text map](literature/REFERENCE_TEXT_MAP.md) when claims/citation locations change. Fifteen sources, 21 citation occurrences and 35 PDF-text anchors are documented; every new reference requires downloaded-PDF checks.
7. Follow [BUILD.txt](BUILD.txt), compile the whole project, and inspect each PDF page. Keep output/pdf/aamas2027-current.pdf synchronized with the source. The standalone diagrams are output/figures/*.tex; their manuscript copies are figures/*.tikz.tex.
8. Generate review files against the new frozen baseline with scripts/review-paper-revision.py --revision <new-folder>. Repackage downloadable projects after final source/PDF changes.

## Publication checks

Before this commit, all frozen baseline hashes, the cumulative review, the highlighted-package manifest and current source/PDF hashes were checked. ZIP entries were verified against their manifests. Both source and highlighted PDFs were already compiled and visually checked; no manuscript or result edits were introduced during publishing. See publication-validation.json for the exact hashes/package checks.
