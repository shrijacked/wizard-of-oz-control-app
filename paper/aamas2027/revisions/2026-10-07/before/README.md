# Writing handoff — AAMAS 2027

Updated 5 October 2026 on branch `writing`. Start here when continuing the paper.

## Current state and author decisions

The manuscript is a complete paper draft, from abstract through conclusion, with three descriptive results tables, following the agreed 5 October outline. The author supplied the current working abstract and requested a consistent research-author voice. Its N=24 framing describes the intended full study; the tables and methods still identify the actual **nine complete participants / 81 rounds**. The partial-session sensitivity is in the supplementary analysis notes. Replace the findings and reconcile the abstract as collection finishes; no extra participant outcomes or significance results have been invented.

The author-confirmed policy is **scheduled assistance every 30 seconds and adaptive assistance whenever the existing arousal flag is raised**. Task state guides the content. The flag is based on heart-rate change; references to “HRV” in the clarification do not establish a separate HRV threshold. Audit/provenance details stay outside the main paper, in author and supplementary notes.

The separate tangram survey still needs responses. Correct-piece scoring from final photographs still needs a rule and calculation. Section 3 therefore remains **Task and Design Rationale**; it becomes **Tangram Task Profiling and Assistance Expectations** when that evidence exists. A survey collected later can contextualize the experiment, but cannot retrospectively have determined its design.

## Files and ownership

| File | Purpose / next editor's responsibility |
|---|---|
| [main.tex](main.tex) | Canonical submission source; revise the paper here. |
| [manuscript.md](manuscript.md) | Readable counterpart; keep prose, numbers and references synchronized with TeX. |
| [references.bib](references.bib) | Only the 15 sources currently cited in the paper. |
| [literature/REFERENCE_TEXT_MAP.md](literature/REFERENCE_TEXT_MAP.md) | Every citation occurrence mapped to the exact manuscript wording, source PDF page, brief verbatim anchor, supporting explanation and limits. |
| [literature/reference-text-map.json](literature/reference-text-map.json) | Citation locations and source-passage offsets/hashes for checking the text map against the same PDF versions. |
| [literature/MANUSCRIPT_REFERENCE_AUDIT.md](literature/MANUSCRIPT_REFERENCE_AUDIT.md) | Active citation-to-PDF-to-page audit; consult before changing a literature claim. |
| [literature/manuscript-reference-audit.json](literature/manuscript-reference-audit.json) | Download URLs, local paths, hashes, publication dates and claim evidence. |
| [structure-review.md](structure-review.md) | Agreed outline, interpretation of mentor notes, and differences from the earlier outline. |
| [author-notes.md](author-notes.md) | Outstanding factual checks and author decisions; these do not belong as TODOs in the paper. |
| [evidence-map.md](evidence-map.md) | Where the study's methods and findings come from. |
| [questionnaire-inventory.md](questionnaire-inventory.md) | Exact administered interface wording and scale anchors. |
| [analysis/interim-summary.json](analysis/interim-summary.json) | Reproducible numerical source for the current tables and descriptive statements. |
| [scripts/summarize-writing-results.py](../../scripts/summarize-writing-results.py) | Reproduces descriptive results without altering source records. |
| [submitted-abstract.txt](submitted-abstract.txt) | Historical submitted text, preserved unchanged; current paper abstract has been revised. |
| [BUILD.txt](BUILD.txt) | Full-project TeX build and layout checks. |
| [supplementary/ai-use-statement.md](supplementary/ai-use-statement.md) | Detailed AI-use record supporting the brief main-paper disclosure. |
| [supplementary/analysis-notes.md](supplementary/analysis-notes.md) | Scoring, outcome sensitivities, timing and analysis details omitted from the main narrative. |

Contributors should claim the manuscript, analysis, survey, photograph scoring, or reference task with the team before overlapping edits; no individual ownership is assigned by this document.

## Reading flow

1. Introduction: assistance timing problem, research questions and three contributions; no findings.
2. Related work: proactive timing; physiological measurement versus control; tangrams/assembly and experience; human operator role.
3. Task rationale now; separate survey methods and findings later, with accurate collection chronology.
4. System: interfaces and apparatus, physiological processing, and the three assistance conditions.
5. Study: methods → objective performance → workload → intervention experience → overall responses. The current tables occupy these outcome slots; photo scores and coded comments are not yet present.
6. Discussion: performance/experience differences, assistance timing and physiological feedback, confounds and limits.
7. Ethics: evidence-supported statements now; actual approval and procedure details still require the team.
8. Conclusion and accurate AI-use disclosure.

## Local results and reference cache

All paths below are relative to the repository root. Raw results, PDFs and extracted full texts are local, under gitignored `data/`; collaborators do not receive these merely by pulling this branch.

- Results: `data/writing-reference/hti-results-2026-10-05/`, extracted from `/Users/rishit/Desktop/hti3/outputs/hti-results-through-P111-no-media.zip`.
- Archive SHA-256: `27b259048f1e0dd0dd30e760c77e5ce2a3cc0efa282def46eda257ef3d45468e`.
- The 50-file extraction contains the workbook, consolidated records, raw participant files, source manifest, study snapshots and independent analysis script. The 43 manifest source copies matched their listed hashes and sizes. Media is absent by design.
- Literature PDFs: `data/writing-reference/literature-pdfs/`; extracted page-labelled text: `data/writing-reference/literature-text/`.
- The active bibliography has 15 PDF-checked sources. Twelve (80%) first appeared in 2024–2026. Hart (2006), Teo (online 2017 / issue 2018), and Yang (online 2022 / issue 2024) are retained for measurement or direct comparison. Do not count Yang as newly published in 2024. This is below the mentor's 40-reference target; extend only with directly relevant, text-verified sources.
- Restore results from the team's original archive and verify its hash. Restore each cited PDF from the audit's source URL and check its hash, or document a new version and update its page evidence. Do not commit participant records or redistribute publisher PDFs without checking the applicable permissions.

## Refreshing findings as collection progresses

1. Keep the through-P111 snapshot unchanged. Put the next export in a new dated directory, record source hashes, and reconcile participant aliases, provisional replacements, exclusions and duplicate sessions before combining anything.
2. Review outcome provenance: P101 binary outcomes are inferred in the current working coding; P111 is partial, and unfinished rounds are missing outcomes, not failures. Resolve evidence before changing those labels. Preserve a recorded-only sensitivity.
3. Reconcile round status, actual duration, questionnaire direction, puzzle allocation and intervention counts. Do not interpret robot commands as confirmed physical execution or all-round duration as successful completion time.
4. Generate the same consolidated schema, with explicit cohort and outcome coding. The summary script reproduces that coding; it does not discover sessions, merge exports or adjudicate missing outcomes.
5. Run from the repository root:

   ```sh
   python3 scripts/summarize-writing-results.py \
     --source data/writing-reference/hti-results-2026-10-05/relevant-files/consolidated-data.json \
     --output paper/aamas2027/analysis/interim-summary.json
   ```

   For a new snapshot, change the source path and review the resulting diff. The script uses the Python standard library.

6. Decide the final repeated-measures analysis with the team, including puzzle identity, block position, exclusions, missingness and uncertainty. The current draft reports descriptive means and participant-level SDs only; it makes no significance claim.
7. Replace findings in **both formats**: abstract, §5.1 sample/analysis, Tables 1–3, §5.2 sensitivities/dose, §5.5 overall ratings, discussion and conclusion. Check every numerical claim against the new summary. Update this guide's snapshot/cohort state and the evidence map.
8. Add the independent survey and photograph scores only after their instruments, scoring rules, denominators and chronology are documented. Document a qualitative method before claiming themes or selecting quotations.
9. Build the complete TeX project and inspect the PDF: numeric references, float order, overflow, anonymity, eight-page main-text limit and reference pages. Do not declare submission readiness from source checks alone.

## References and final review

For each new citation, obtain the actual PDF, confirm its title/authors/version/date, read the relevant methods/results/limitations, and record exact PDF pages and a bounded paraphrase in the audit. Update the citation-to-text map whenever a cited claim changes; its locations and manuscript hashes now identify the draft-note revision after base commit `9840396`. Search snippets and review summaries are discovery aids, not paper-text verification. Prefer relevant 2024–2026 work, retaining older sources when they supply the method or closest comparison. The historical literature register includes unread leads and sources not cited here; its size is not the count of verified manuscript references.

The official [submission instructions](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/instructions/) and [Q&A](https://warwick.ac.uk/fac/sci/dcs/aamas2027/guidelines-and-policies/qa/) require the unmodified LaTeX template and eight main-text pages plus references. Preserve the supplied class/style, resolve the author checks, and review the AI-use record before submission. Editing the local abstract does not change registered submission metadata.

The [current PDF preview](../../output/pdf/aamas2027-current.pdf) was built on 5 October with Tectonic 0.17.0 using the supplied template. It has five pages including references, all visually inspected. Text overflow was resolved without changing the class, margins or body font size; Table 2 uses a locally smaller font and tighter column spacing. See [BUILD.txt](BUILD.txt) for reproduction and remaining submission-metadata/bibliography/balancing warnings; the final pdfLaTeX build still needs checking.

The current working PDF displays the title, five author names and submission ID 2613 from the author-provided OpenReview screenshot. Affiliations remain to be supplied. Restore the `anonymous` class option before an anonymous review submission.

See [per-reference citation counts](literature/CITATION_COUNTS.md) alongside the [reference-to-PDF text map](literature/REFERENCE_TEXT_MAP.md).
