# Current AAMAS manuscript — 8 October 2026

Editable source: [main.tex](main.tex). Checked preview: [main.pdf](main.pdf). Download the [complete source ZIP](../../output/packages/aamas2027-refreshed-source.zip) for manual transfer or recompilation.

## Recompile

Keep `main.tex`, `references.bib`, `aamas.cls`, `ACM-Reference-Format.bst`, `by.pdf`, and the complete `figures/` folder together. On Overleaf select `main.tex` and XeLaTeX with BibTeX. The checked preview was compiled with Tectonic's XeTeX/BibTeX workflow. See [BUILD.txt](BUILD.txt).

Raw participant inputs, Python, recordings and full reference papers are not required to compile the manuscript. The source ZIP is a working handoff bundle; its `review/` documents are not compilation dependencies or anonymous submission material.

## Current results and figures

Primary round-level analyses use24 participants and216 rounds; final-survey summaries use15 available responses. The formative assessment includes50 responses. Both assisted policies improve progress, completion, workload and attempt duration relative to control. Adaptive reduces frustration versus control, but no corrected adaptive–constant contrast is significant.

The manuscript has seven figures and three findings tables. Figures6 and7 are constant–adaptive bar plots with SD whiskers and adjusted paired-test p values. Figure5 remains the paired-difference display. Figure3 gives70% of the width to the schematic, with the overhead photo and operator screenshot on the right. The Orangewood model is OWL63. Manuscript body ends on page8 and references extend to page9.

## Analysis, citations and change record

- [Current change log](revisions/2026-10-08-refresh/CHANGELOG.md)
- [Analysis and seven-point adapted TLX calculation](revisions/2026-10-08-refresh/analysis/ANALYSIS.md)
- [Paired statistics CSV](revisions/2026-10-08-refresh/analysis/paired-tests.csv) and [aggregate statistics JSON](revisions/2026-10-08-refresh/analysis/statistics-public.json)
- [Holm explanation](revisions/2026-10-08-refresh/analysis/HOLM_EXPLAINED.md)
- [All34 source reviews](revisions/2026-10-08-refresh/citation-verification/ALL_SOURCE_AUDIT.md) and [download/hash manifest](revisions/2026-10-08-refresh/citation-verification/all-source-downloads.json)
- [Separate substantive review](revisions/2026-10-08-refresh/FINAL_DRAFT_REVIEW.md) and [build/visual verification](revisions/2026-10-08-refresh/qa/VERIFICATION.json)
- [Publication file manifest](revisions/2026-10-08-refresh/publication-manifest.json)

All34 references were checked against downloaded actual PDFs at claim level: identity/version, design, relevant passages and caveats, not every page or independent replication. Full third-party PDFs remain local. The public dataset omits individual condition means, paired-difference vectors and raw records. Complete numerical reruns require the private input snapshots; the tracked scripts alone do not contain these inputs. Plot generation can use `statistics-public.json` renamed to `statistics.json` in the revision's `analysis/` folder, with the repository paper figure output path adjusted.

Older `manuscript.md`, analysis folders, structure reviews and October7 revision files are historical. Use this README, current `main.tex`, current PDF and October8 refresh record for the latest state. Institutional/venue obligations, AI disclosure and anonymous-submission checks are detailed separately; approval or exemption is not invented.
