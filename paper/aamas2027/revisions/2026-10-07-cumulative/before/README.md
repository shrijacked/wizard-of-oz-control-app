# Writing handoff: AAMAS 2027

Updated 7 October 2026 on branch `writing`. Start here when continuing the paper.

## Current draft and review trail

[main.tex](main.tex) is the canonical source; [manuscript.md](manuscript.md) is its readable counterpart. The draft follows the approved 5 October outline. It now contains the 24-response task-profile survey in §3, the updated apparatus and physiological pipeline in §4, and results for 12 complete participants / 108 rounds in §5. This is the actual analyzed sample, distinct from the planned target of 24. The historical [submitted abstract](submitted-abstract.txt) remains unchanged.

The updated paper includes three results tables and seven figures: survey, architecture, physical setup, performance, workload, correlations, and intervention experience. Comments are illustrated by verbatim excerpts, without claiming a formal thematic analysis. Pairwise tests are exploratory; do not convert higher average adaptive ratings into a significant advantage over scheduled assistance.

Every revision is reviewable in [the change log](revisions/2026-10-07/CHANGELOG.md), [highlighted review](revisions/2026-10-07/highlighted-review.html), and [exact TeX diff](revisions/2026-10-07/main.tex.diff). The complete pre-change paper and PDF are frozen in [before/](revisions/2026-10-07/before/); the baseline manifest records hashes. Do not edit this snapshot.

The architecture TeX was pushed separately in commit `3c4ddb9`. The paper revision is local until reviewed and pushed. Do not include raw participant records or survey usernames in commits.

## Author decisions and writing voice

Scheduled help is offered every 30 seconds; adaptive help is offered whenever the existing arousal flag is raised. Task state guides content. The flag uses a heart-rate rise, not an HRV-increase threshold. The researcher chooses the hint or robot action and the operator executes the arm program. The paper states the protocol directly; provenance, coding sensitivities, and configuration checks remain in author documentation.

Keep the research-author voice concise. Avoid software-default-versus-deployed-settings narration, snapshot dates, interim/subset commentary, intervention totals, and the phrase removed by the author for describing the repeated-person design. Preserve brief uppercase drafting reminders where facts remain missing. Do not invent recruitment, ethics approval, correct-piece scores, or study chronology.

## Files and flow

| File | Responsibility |
|---|---|
| [main.tex](main.tex), [manuscript.md](manuscript.md) | Keep all prose, numbers, references and reminders synchronized. |
| [references.bib](references.bib) | The 15 verified cited sources; add only after checking the actual PDF. |
| [figures/](figures/) | Vector graphs, PNG previews, and embedded TikZ copies. |
| [analysis/results-summary-2026-10-07.json](analysis/results-summary-2026-10-07.json) | Means, SDs, completion counts, coding sensitivity and record audit. |
| [analysis/revision-analysis.json](analysis/revision-analysis.json) | Survey summaries, participant averages, paired tests and correlations. |
| [author-notes.md](author-notes.md) | Unresolved factual and editorial decisions. |
| [supplementary/analysis-notes.md](supplementary/analysis-notes.md) | Exact scoring, exploratory analysis, outcome sensitivity and missingness. |
| [evidence-map.md](evidence-map.md) | Where each claim comes from. |
| [structure-review.md](structure-review.md) | Current outline comparison and original agreed plan. |
| [literature/REFERENCE_TEXT_MAP.md](literature/REFERENCE_TEXT_MAP.md) | Every citation connected to verified PDF text. |
| [BUILD.txt](BUILD.txt) | Build method, QA and remaining submission checks. |

Reading order: introduction and RQs → related work → task-profile survey and rationale → system and conditions → study methods, objective results, workload, assistance ratings and final comments → discussion → ethics → conclusion and disclosure.

## Inputs and reproducibility

Original inputs remain untouched. Current results were extracted from `/Users/rishit/Desktop/hti3/outputs/hti-results-2026-10-06-no-media.zip` to `data/writing-reference/hti-results-2026-10-06/`. The survey was extracted from `/Users/rishit/Downloads/Puzzle Solving and Tangram Research Survey.csv.zip` to `data/writing-reference/task-profile-survey-2026-10-05/`. These files were the local candidates identified for this request; replacement attachments should be reconciled before a further refresh. Source hashes are recorded in the revision input manifest and analysis outputs. The older through-P111 export is preserved separately.

Run from the repository root:

```sh
python3 scripts/summarize-writing-results.py --source data/writing-reference/hti-results-2026-10-06/relevant-files/consolidated-data.json --output paper/aamas2027/analysis/results-summary-2026-10-07.json
python3 scripts/update-paper-analysis.py
python3 scripts/review-paper-revision.py
```

The first script uses the standard library. The graph/test script requires NumPy and Matplotlib. It uses the source's complete-cohort classification and existing `analysisSolved` labels; it does not adjudicate missing outcomes or merge new exports. Paths are at the top of the script. Retain source hashes, freeze a new pre-change snapshot, review participants/outcomes, regenerate analyses, update both manuscripts and evidence notes, build and inspect every PDF page, then regenerate the review package. Keep previous snapshots unchanged.

Original diagrams are `output/figures/assistance-architecture.tex` and `output/figures/physical-setup-topdown.tex`. Their current color/macro definitions and TikZ drawing code are copied into `figures/*.tikz.tex` for the manuscript. If a diagram changes, refresh those copies and PNG previews; do not use stale exported diagrams. The standalone originals remain editable.

## Remaining work

The author confirmed the linked square tangram. Confirm the survey interface, recruitment, overlap with experimental participants and collection chronology. Add the setup photograph, exact robot/piece details, baseline procedure, repeated-flag handling, recruitment/practice/ethics facts, and scored final photographs. Review the exploratory statistical model with the team before final submission, including coding adjudication and source checks. Add further relevant PDF-verified references. Supply affiliations and resolve anonymity/CCS/bibliography/build checks. See [author notes](author-notes.md) for specifics.

The bibliography and 21 citation occurrences remain unchanged in content. All 15 PDF hashes and 35 source anchors are rechecked for this revision; the map's locations and manuscript hashes identify the updated text. Twelve sources first appeared in 2024–2026; older exceptions are retained for the measure or closest comparison. Downloaded PDFs and full extracted text stay in gitignored `data/`, and are not redistributed by pushing the branch.
