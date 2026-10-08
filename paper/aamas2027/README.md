# Current AAMAS manuscript — 9 October 2026

Use [main.tex](main.tex), [main.pdf](main.pdf) and the [final source ZIP](../../output/packages/aamas2027-rewritten-source.zip). The compatibility filename `aamas2027-refreshed-source.zip` contains the same final compile bundle. The source ZIP, not every historical file in this directory, is the authoritative compilation inventory.

The final abstract uses the author's approved wording. The eight-page manuscript contains five figures, three findings tables and 34 references. All primary outcomes, round ratings and final-survey summaries use 24 participants (216 rounds); the formative assessment uses 50 responses. The two assisted conditions improve completion, correct-piece progress and workload versus control and both reduce frustration. Descriptive constant/adaptive differences do not establish corrected statistical superiority. Recorded round duration is descriptive, not verified active solving time.

Figure 3 keeps a 70% schematic and a centered three-image stack: smaller rear-view setup, operator interface, then overhead view. The dashboard crop includes the full solution preview and all seven robot buttons, excludes the lower input area, and censors HR/RMSSD readouts. Original unredacted photos remain local and are not included in the new handoff.

Keep `main.tex`, `references.bib`, `aamas.cls`, `ACM-Reference-Format.bst`, `by.pdf` and the eight allowlisted `figures/` assets together. The supplied class, bibliography style and margins are unchanged. Compile with Tectonic or XeLaTeX and BibTeX; [BUILD.txt](BUILD.txt) records the checked route. Native single-file preview cannot currently resolve this multi-file class; the saved full-project PDF compiles successfully. Keep `supplement/` together and compile its `supplement.tex` separately.

- [Aggregate supplement PDF](supplement/supplement.pdf) and [aggregate results ZIP](../../output/packages/aamas2027-aggregate-supplement.zip)
- [Current changes](revisions/2026-10-09-rewrite/CHANGELOG.md)
- [Reference-to-source text map](revisions/2026-10-09-rewrite/REFERENCE-TEXT-MAP.md) and [citation alignment](revisions/2026-10-09-rewrite/CITATION-ALIGNMENT.md)
- [Build/package checks](revisions/2026-10-09-rewrite/qa/VERIFICATION.json)
- [Revision/reproduction notes](revisions/2026-10-09-rewrite/README.md)

The main analysis uses a twelve-test core Holm family and a separate nineteen-test secondary family. The supplement reports puzzle/block-adjusted robustness checks. All eight final pages were freshly rendered and visually reviewed after the final abstract, with no overfull boxes or undefined references. Individual records, private workbooks, raw physiology, original photos and full third-party papers are excluded from the new distributed bundles. Historical files below or elsewhere in this repository do not supersede this current version.

## Historical handoff notes — 8 October 2026 (superseded)

Editable source: [main.tex](main.tex). Checked preview: [main.pdf](main.pdf). Download the [complete source ZIP](../../output/packages/aamas2027-refreshed-source.zip) for manual transfer or recompilation.

## Recompile

Keep `main.tex`, `references.bib`, `aamas.cls`, `ACM-Reference-Format.bst`, `by.pdf`, and the complete `figures/` folder together. On Overleaf select `main.tex` and XeLaTeX with BibTeX. The checked preview was compiled with Tectonic's XeTeX/BibTeX workflow. See [BUILD.txt](BUILD.txt).

Raw participant inputs, Python, recordings and full reference papers are not required to compile the manuscript. The source ZIP is a working handoff bundle; its `review/` documents are not compilation dependencies or anonymous submission material.

## Current results and figures

Primary round-level analyses use24 participants and216 rounds; final-survey summaries also include24 responses. The formative assessment includes50 responses. Both assisted policies improve progress, completion, workload and attempt duration relative to control. Adaptive reduces frustration versus control, but no corrected adaptive–constant contrast is significant. Study-wide final means on1-7 scales: helpfulness5.00, efficacy4.83, trust4.79, following uncertain guidance4.88.

The manuscript has seven figures and three findings tables. Figures6 and7 are constant–adaptive bar plots with SD whiskers and adjusted paired-test p values. Figure5 remains the paired-difference display. Figure3 gives70% of the width to the schematic, with a vertically centered stack of a smaller rear-view setup photo, operator dashboard and overhead view on the right. The setup photo is76% of the right column's width. The Orangewood model is OWL63. Introduction and Related Work are rebalanced with all34 references retained. Both original final-survey quotes remain in§5.4, with punctuation normalized and bracketed grammar corrections. The preview is eight pages: body ends on page7, references extend to page8. Photo EXIF/location metadata is removed; check participant image-release consent before external publication.

## Analysis, citations and change record

- [Current change log](revisions/2026-10-08-final-surveys/CHANGELOG.md)
- [Analysis and seven-point adapted TLX calculation](revisions/2026-10-08-final-surveys/analysis/ANALYSIS.md)
- [Paired statistics CSV](revisions/2026-10-08-final-surveys/analysis/paired-tests.csv) and [aggregate statistics JSON](revisions/2026-10-08-final-surveys/analysis/statistics-public.json)
- [Holm explanation](revisions/2026-10-08-quote-layout/analysis/HOLM_EXPLAINED.md)
- [All34 source reviews](revisions/2026-10-08-quote-layout/citation-verification/ALL_SOURCE_AUDIT.md), [download/hash manifest](revisions/2026-10-08-quote-layout/citation-verification/all-source-downloads.json) and [current alignment recheck](revisions/2026-10-08-quote-layout/CITATION_ALIGNMENT_RECHECK.md)
- [Separate substantive review](revisions/2026-10-08-final-surveys/FINAL_DRAFT_REVIEW.md) and [build/visual verification](revisions/2026-10-08-final-surveys/qa/VERIFICATION.json)
- [Current artifact manifest](revisions/2026-10-08-final-surveys/publication-manifest.json)
- [Pre-edit PDF](revisions/2026-10-08-quote-layout/before/main.pdf) and [revision notes](revisions/2026-10-08-quote-layout/README.md); complete pre-edit compile projects are retained locally. The preceding pushed version is recoverable at Git commit ab96ee4.

All34 references were checked against downloaded actual PDFs at claim level: identity/version, design, relevant passages and caveats, not every page or independent replication. Full third-party PDFs remain local. The public dataset omits individual condition means, paired-difference vectors and raw records. Complete numerical reruns require the private input snapshots; the tracked scripts alone do not contain these inputs. Plot generation can use `statistics-public.json` renamed to `statistics.json` in the revision's `analysis/` folder, with the repository paper figure output path adjusted.

Latest local changes after pushed commit eea2806: contribution3 says “users' subjective feedback”; the experimental participant mix is corrected to mostly undergraduates with graduate students, TFs and research fellows, not faculty. Both methods and limitations are updated. Nine final-survey records are imported from the returned workbook, completing24/24 final surveys and updating§5.4. Round-level numerical results and test families are unchanged. See [revision notes](revisions/2026-10-08-final-surveys/README.md). These new edits are not yet committed or pushed.

Older `manuscript.md`, analysis folders, structure reviews and earlier revision files are historical. Use this README, current `main.tex`, current PDF and October8 final-surveys revision for the latest state. Setup/quote-layout changes were pushed as eea2806. Earlier local-only status notes refer to their preparation stage. Institutional/venue obligations, AI disclosure and anonymous-submission checks are detailed separately; approval or exemption is not invented.
