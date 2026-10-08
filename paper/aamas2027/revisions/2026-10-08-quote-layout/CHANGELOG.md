# Paper and data refresh — 8 October 2026

## Publication authorization for setup/quote-layout changes

The author requested pushing the current version to `writing` on8October2026. Scope: current TeX, eight-page PDF, metadata-cleaned setup photograph, source ZIP, revision snapshots, change logs, aggregate analysis and citation/build audits. Raw participant files, filled workbook, recordings, full reference PDFs and extracted full-paper passage packets remain local. Git history records the publication commit; earlier statements that no new commit/push had occurred describe the preparation stage.

## Quote punctuation, smaller setup photo and citation alignment

- Saved the preceding eight-page project/PDF and ZIP in `revisions/2026-10-08-quote-layout/before/` before editing.
- Initially removed the first §5.4 quote at the user's request and suggested an actual hint-quality final-survey comment. The user then explicitly chose to retain the original quote. Final draft keeps both original comments, with sentence punctuation inside quotation marks and initial capitalization corrected. `[was]` replaces `were` in the first quote, and `[than]` corrects `then` in the second; brackets transparently mark grammar/spelling edits. No fabricated replacement or participant IDs.
- Figure3's rear-view setup photograph is now76% of its previous width (24% narrower), centered within the right column. The 70%-width schematic is unchanged. Right-hand order is setup photograph, operator interface, overhead workspace photograph. Caption and accessible description match.
- Rechecked all34 citation keys against the unchanged bibliography, retained actual-PDF hashes, claim-review cards and bounded actual-paper passage packets. Offline/online measurement, simulated/live assistance, review/trial and single-person/preliminary-study distinctions remain intact. No bibliography entries or literature claims were added or dropped. See `revisions/2026-10-08-quote-layout/CITATION_ALIGNMENT_RECHECK.md`.
- Figure7 numbers are unchanged: Holm-adjusted adaptive-minus-constant p values1.000 (helpfulness),.119 (timing),1.000 (seamlessness),.748 (frustration relief). Explained that none passes.05; the timing raw p=.007925 becomes.118873 in the25-test secondary family. Adjusted1 is not proof of identical policies.
- Statistics, analysis inputs, abstract, template, body font and margins are unchanged. Rebuilt and rendered the manuscript using the PDF-review workflow; refreshed source ZIP and local writing worktree. No new commit or push.

## Setup photographs and layout — after writing commit ab96ee4

- Saved the complete pre-edit project/PDF and source ZIP in `revisions/2026-10-08-setup-layout/before/`, before editing. The previous pushed revision is unchanged.
- Chose IMG_3103 for the rear-view photograph of the participant, OWL63 arm, laptop, partition and mounted camera. Original HEIC files are unchanged. JPEG conversion and lossless EXIF removal retain genuine scene pixels and ICC profile; the LaTeX crop trims peripheral room/table edges. No generative image changes.
- Figure3 retains the 70%-width schematic and uses a vertically centered 28%-width stack: rear-view setup photograph, overhead workspace photo, operator dashboard. Updated caption and accessible description.
- Moved assistance-cost and task-specific physiological-evaluation context into the Introduction. Shortened Related Work, removed repeated setup descriptions, and moved Hart's TLX citation to Measures. All34 references remain cited; retained source-design caveats and existing claim-level evidence.
- Shortened repetitive figure/table captions and slightly reduced the frustration plot to improve flow. Page3 no longer has the former large gap. Final preview has eight pages: body and beginning of references on page7, remaining references on page8; no overfull boxes. Figure5 remains unchanged in content.
- Numerical results, participant data, analysis families, abstract, template, margins and body font are unchanged. PDF skill guided rendered layout checks.
- Updated source ZIP, citation locations, manifests and writing-worktree handoff under a new revision name. No new commit or push in this revision.
- Separate review notes flag participant-photo consent/indirect identifiability for external publication; no consent or ethical approval is fabricated.

## Current final-draft cleanup and all-available analysis

- Author authorized pushing the current refresh to `writing` on8October2026. Public export excludes raw inputs, per-participant means/difference vectors, count/duration overlays, recordings and full third-party papers. Added a repository-specific README and marked old12-person handoff documents historical; current source/ZIP/aggregate-audit links point to the October8 refresh. Earlier pause descriptions below are historical.

- Replaced Figures6 and7's paired-difference plots with constant–adaptive bar comparisons: frustration and the four intervention-experience items. Bars show participant-condition means and SD whiskers; annotations retain the same paired-test Holm-adjusted p values, labelled “adjusted” for readability. Descriptive errors and inferential comparisons remain distinguished in captions. Data/test outputs unchanged. PDF skill used for chart and manuscript layout checks.

- Simplified Section4.5 to paired participant-level t tests, confidence intervals, effect sizes and the actual Holm groups/significance threshold. Removed manuscript references to sign-flip, signed-rank, Friedman, sensitivity analyses and stricter joint corrections; retained calculations in internal analysis outputs. Renamed Section5.4 “Overall experience” and simplified the plot-color caption. Removed the requested researcher-scoring measurement-error/shared-source sentence. Statistical outputs unchanged; rebuilt and visually checked the PDF with the PDF skill.

- Removed the requested limitations paragraph covering psychometric interchangeability, combined assistance modalities, end-of-study trust, and formative expectations/sample overlap. The seven-point scale definition and factual descriptions of the measures remain in Methods; data and statistical results are unchanged. Rebuilt the PDF and source package, with PDF-skill layout checks.

This section supersedes the earlier primary-rating n23 and original-final-survey n14 descriptions below. Historical entries remain as a revision record.

- Preserved the pre-cleanup manuscript/PDF/source ZIP in `revisions/2026-10-08-manuscript-cleanup/before/`; no original participant export or count workbook changed.
- Primary round-level task, duration, workload and intervention-experience analyses now include all24. Earlier immediate-rating and outcome-exclusion analyses remain internal sensitivities. Included all15 available final surveys, with recalculated means/SDs.
- Reran34 paired comparisons, confidence intervals, effect sizes, correction families and nonparametric checks; independently verified all34 paired statistics/intervals and secondary Holm values from216 per-round records.
- Removed author-note wording, participant IDs, confirmation/retrospective narratives, unavailable-role statements, and printed bibliography-verification notes from the manuscript. Source provenance remains in internal data and audits.
- Simplified Task Performance. Converted the workload table to one column and kept all findings tables with their introducing text. Removed all “bold marks” caption explanations while retaining requested bold condition means.
- Replaced “Trade-offs Between” in the title with “Comparing” and narrowed the abstract conclusion; corrected tests do not establish assisted-policy superiority.
- Added `FINAL_DRAFT_REVIEW.md` separating completed editorial repairs, actual statistical findings, and substantive interpretation/ethics/submission concerns.
- Push paused; no commit or remote push made. PDF skill guided layout QA; spreadsheet-analysis skill guided preserving raw measurements, recomputation and cross-checks.

## Current duration / scoring / ethics confirmation

This section supersedes historical missing-P111-duration and pending-approval descriptions below.

- Preserved the pre-edit paper, analysis, scripts, notes and ZIP in `revisions/2026-10-08-duration-confirmation/before/`.
- Added immutable `inputs/P111-duration-confirmation.json`: researcher-supplied seconds215/200/280/300 interpreted asR6/R7/R8/R9. Matched session, puzzle and condition; retained original missing values and confirmation provenance. No timestamps invented. Pause adjustment for these values is not separately confirmed.
- Duration now uses all24; immediate workload/experience still uses23, excluding retrospective P111. Reran34 paired tests, all correction families and exact/nonparametric checks; added the old n23-duration 25-test family as a sensitivity. Means: control292.40s,constant248.19s,adaptive265.36s. Constant-control t(23)=-4.21 and adaptive-control t(23)=-4.20 both Holm p=.006375; adaptive-constant t(23)=1.37,raw p=.184329,Holm p=1. No new assisted-policy superiority finding. Other endpoint-family conclusions unchanged.
- Recorded scoring rule: maximize correct-piece count across admissible orientations. Researcher confirms counts were noted and photographed; per-round photo references and independent scorer reliability remain unavailable. No independent photo audit is claimed.
- Recruitment via volunteer forms and coupon compensation confirmed. Did not invent other recruitment channels or coupon value.
- Researcher confirms no ethics-committee review occurred. Removed the misleading pending-approval manuscript placeholder without asserting approval or exemption. Kept factual consent/privacy/Wizard-of-Oz description. Official AAMAS2027 instructions do not explicitly prescribe an approval-status sentence; reviewer ethics reporting remains. Institutional/venue requirements remain an author check, not presumed satisfied.
- Rechecked bibliographic recency:30/34 entries from2024–2026,including8 from2026;32/34 from2023–2026. Added Hart's publisher-confirmed pages904–908. Rechecked current Vitry arXiv v2 author name and Smit preprint status. All34 existing actual-PDF claim cards remain; not an exhaustive new literature search or independent replication. See `citation-verification/REFERENCE_AND_POLICY_STATUS.md`.
- Spreadsheet skill guided preserving source measurements and distinguishing manually confirmed durations from missing timestamps; PDF skill guided rendering the rebuilt manuscript. Raw workbook and consolidated exports remain unchanged. Full change record and lean ZIP refreshed.

## Preserved baselines / Git scope

- Duplicated the local current LaTeX package to `backup-current-paper/` before fetching.
- Fetched `origin/writing` from GitHub, advancing its remote-tracking ref from `7862cbb` to `5fe730d`; did not switch, merge, commit, or push the user's `modi5` checkout.
- Extracted the writing-branch paper verbatim to `fetched-writing/paper/aamas2027/`. Editable revision is `paper/main.tex`; the fetched copy remains unchanged.
- Preserved the supplied PDF and diagram sources and copied the filled Excel to `inputs/`. Original workbook and original study exports remain unchanged.

## Counts and analysis

- Validated 216/216 agreed counts as integers 0–7 and joined to participant/session/round, verifying puzzle and condition rather than relying on row order.
- Applied the user's explicit adjudication: known solved rounds default to 7; P106 R5 = 3 and R7 = 5. Nine counts changed. `analysis/count-adjudication.json` and `piece-counts-adjudicated.csv` retain both entered and corrected values.
- Blank per-row evidence references are retained as unavailable, not silently filled. Counts partly adjudicated using binary success are not treated as independent replication of that outcome.
- Added correct-piece means, paired t tests, raw and Holm p values, pointwise CIs and dz; exact sign-flip/signed-rank and Friedman checks; unadjudicated-count, device, P101 and P111 sensitivities.
- Completion cohort: 23 excluding inferred P101, including P111's researcher-confirmed last four outcomes. Workload/duration/assistance cohort: 23 excluding retrospective P111. Counts: all 24. Four missing P111 timings not imputed.
- Transparent exploratory families: six core, three count, 25 secondary tests. Joint-nine and all-34 Holm sensitivities also retained. No preregistration or post-hoc significance-engineering claim.
- Main new count findings: control 3.43, constant 5.68, adaptive 5.43 out of seven; both assistance-control comparisons significant, adaptive-constant p=.273. No assisted-policy comparison survives its correction. Duration improvements for both policies and adaptive-control frustration are significant in the secondary family.

## Formative assessment / privacy

- Replaced the old 24-response formative description with the supplied 50 substantive responses. Placeholder/empty usernames are not an exclusion rule.
- Removed the entire Username/email field; assigned F001–F050. Email-like tokens in retained free text are redacted. Original email-containing CSV is not copied to outputs or packages; its source hash is retained.
- Recomputed demographics, categorical outcomes, uncertainty and independently rated expected assistance. 28 complete, 18 partial, four not solved; 37 reported being stuck at least once.
- Removed the outcome graph panel; outcomes are in prose. One compact single-column expected-helpfulness graph remains. Its bars are SD, not inferential CIs. Removed stale old formative p-value claims instead of inheriting a test from a different dataset.

## Manuscript content

- Four contributions reduced to three: retained study comparison; consolidated objective/subjective evidence; merged intervention experience and participant-feedback implications. Removed claims of an established adaptive advantage.
- Refreshed abstract, methods, Findings, Discussion and Conclusion; removed the obsolete planned-N/interim-result banner and old 12-person statistics. Reduced repeated rationale and policy descriptions, especially in Introduction/Related Work/Discussion.
- Added experimental demographics: ages20–27, mean21.96 SD2.01. User confirmed mostly undergraduates, plus faculty and graduate students/researchers; exact role counts unavailable. Raw forms initially yielded18 men/six women. All24 imports and original form hashes matched; no importer bug found. User subsequently confirmed the correct aggregate as14 men/10 women (58.3%/41.7%,7:5), explicitly without mapping individual IDs. Manuscript uses that confirmed aggregate; raw gender fields remain unchanged in provenance, and no gender-subgroup analysis is attempted. Limitations emphasize age range, recruitment context and transfer to older/workplace populations, not an unsupported predominantly-male imbalance.
- Explicitly stated adapted NASA-TLX **1–7**, reversed performance, unweighted formula and rescaling to 0–100; retained scale-validity limitation.
- Included two italicized direct final-survey quotes: P103 on hints versus retrieval; P111 on frequent hints. P111 is labelled retrospective. User confirmed comments were only in final surveys, not between blocks.
- Final-survey descriptive statistics use the 14 original available surveys; missing final surveys not treated as completed responses. P111's retrospective final ratings remain separate.
- Preserved unresolved author checks (eligibility/practice, scoring tolerance/reliability, ethics approval or exemption). No institutional approval, occupation distribution or robot safety procedure invented.

## Figures, layout, apparatus

- Updated Figure2 from the supplied system-diagram TikZ, using smaller width (.86 textwidth), compact vertical spacing, readable local label fonts, OWL63 model, 15-s repeat wait and optional robot delivery. Original source is retained.
- Added supplied ordering tree. Replaced misleading literal P1–24/P1–8 group IDs with actual group sizes, changed constant I to K for consistency, and corrected “middle letter is the start” to left-to-right reading. All six orders contain four participants.
- Added the supplied overhead photo beside the setup schematic and existing apparatus photo; original pixels retained, no synthetic/editing step.
- Added vector paired-difference plots with t statistics and Holm p values for counts/completion/workload, frustration and assistance ratings. Replaced outdated graphs in the active manuscript, not the backups.
- Used ragged-bottom layout to prevent intermittent flush-bottom stretching around headings; preserved class, margins and body font. Adjusted float barriers to preserve numerical figure order and reduce a large results-page gap. All final pages rendered and visually inspected; figures/tables checked at enlarged size. A cached-font experiment at larger ordering-tree text sizes crashed before PDF generation; text separators and supported font sizes resolved it. Only the successful final build is packaged.

## Citation audit

- 19 new entries compared with the preserved 15-entry local bibliography; all 19 downloaded, with an additional searchable Cao author PDF.
- See `citation-verification/CLAIM_AUDIT.md` for checked passages, qualifications, access fallbacks and the corrected Vitry author name; Smit's workload metric clarified as lifted mass.
- Full downloaded PDFs kept separate from the lean LaTeX package. No full-text reference PDFs or old revision archives included in the Overleaf ZIP.

## Verification / outstanding

- Analysis reproduces using the immutable Excel plus explicit adjudication overlay, consolidated input and P111 supplement. Spreadsheet skill guided source preservation and the no-imputation/participant-level scientific-analysis approach; PDF skill guided actual-source and rendered-layout checks.
- Existing Tectonic 0.17 compiler used for the multi-file manuscript; standard missing TikZ and placeins resources were fetched. No class edits or new system TeX installation.
- Successful multi-file build: ten pages, seven figures, three tables,34 active references. No undefined references/citations, missing characters or overfull boxes; underfull lines, optional bibliography fields, font requests and missing CCS-concepts warnings remain documented.
- Added refreshed handoff/build/author notes; moved copied obsolete support notes/plots to `legacy-writing-support/`, preserving them. Active manuscript and lean ZIP contain no old12-person/24-formative-result claims.
- Final input/output hashes, exact TeX/BibTeX diff and lean ZIP inventory generated. Source ZIP excludes compiled-preview duplication, raw participant files, literature PDFs, recordings, puzzle/solution PDFs, historical notes and compiler intermediates. Compiled PDF is provided separately.
- Pending factual author checks: institutional ethics approval/exemption, scoring tolerance/scorer reliability and protocol particulars. Draft is not certified submission-ready or page-limit compliant. No commit, push, merge or checkout switch.

## Subsequent full-source / P101 / layout revision — 8 October 2026

This section supersedes earlier n=23 completion and 19-source audit descriptions; those entries document the preceding revision.

- Saved the entire pre-edit paper, analysis, principal scripts, notes and source ZIP in `revisions/2026-10-08-full-audit/before/`. Original workbook, consolidated exports and frozen writing/local baselines remain unchanged.
- User confirmed the originally inferred answers directly with P101. Added `inputs/P101-researcher-confirmation.json` as a provenance overlay, preserving missing original-event fields. Primary completion now includes all 24: control 11/72 (15.3%), constant 43/72 (59.7%), adaptive 36/72 (50.0%), total 90/216. This is researcher-confirmed binary completion, not silently substituting count-derived outcomes. Earlier n=23 and count-derived analyses remain sensitivities.
- Reran paired tests, confidence intervals, effect sizes, exact/signed-rank/omnibus checks and all correction sensitivities. Completion: constant-control t(23)=7.52, Holm p=7.25e-7; adaptive-control t(23)=5.62, Holm p=3.72e-5; adaptive-constant t(23)=-1.50, Holm p=.296. Immediate workload/experience and duration still exclude retrospective/incomplete P111 (n=23). With the six-test core family updated, workload adaptive-constant Holm p becomes .296 despite unchanged ratings. No corrected assisted-policy difference is established.
- Reopened and checked every active reference's actual PDF: 34/34 plus Cao's searchable author alternative. Thirteen older references freshly downloaded; Karbouj and Yang recovered from exact hash-verified public-download caches after fresh TLS/non-PDF failures. The 19 already-downloaded additions were directly rechecked. `ALL_SOURCE_AUDIT.md` records each source's design, supporting pages and limitations; `all-source-downloads.json` records hashes, public URLs and manuscript citation locations. This is claim-level review, not every-page reading or independent replication. Earlier 19-source audit remains explicitly historical.
- Added the preliminary N=3 qualification to Caiazzo. Retained the previously corrected Vitry author, Smit lifted-mass measure and offline/online, prediction/intervention, vignette/live, simulation/clinical distinctions. No reviewed source validates our HR-rise threshold or supplies our institutional ethics approval.
- Restored the original abstract's HRI timing and surgical-comparator framing, with refreshed completion rates and corrected inferential interpretation. Kept the verbatim original in the preserved baselines rather than restoring unsupported assisted-policy superiority.
- Figure 3 now gives 70% width to the top-down schematic and 28% to the stacked apparatus/overhead photos; original pixels unchanged. Figure 2 remains at .86 text width with readable local label fonts.
- Transposed performance Table 1 so each row compares one measure across conditions. Bolded the favorable condition mean/count per row in all three tables, using lower-is-better burden/duration and higher-is-better performance/assistance ratings. Table captions state that bold does not denote significance. Duration displayed to one decimal to fit the unchanged column width.
- Condensed the assistance conditions paragraph and removed forced float barriers. The actual rendered check shows the large gap after Assistance conditions is gone; Figures 1–7 stay in numerical order. Successful preview is now nine pages, with no overfull boxes, missing characters or undefined references. Template/class, margins and body font unchanged; page-limit compliance is still an author check.
- Shortened Ethical Considerations to one paragraph using the existing manuscript's consent/withdrawal, workspace-camera and WoZ-disclosure facts. No institutional approval, guaranteed immediate deletion, local-only retention, on-device-only processing or third-party-API safeguards borrowed from the example. Approval/exemption remains visibly pending and requested from the researcher.
- Updated handoff/author/build notes, current diff, hashes and package inventory. The lean source ZIP now includes small `review/` copies of the change log, all-source audit/manifest, analysis report and paired-test CSV; full literature PDFs, raw participant inputs, recordings, puzzle/solution PDFs, compiled-preview duplication and historical support remain excluded.

## Figure 3 dashboard revision — 8 October 2026

- User supplied a new operator-dashboard screenshot. Moved the existing overhead workspace photo to upper right; replaced the apparatus photo with the exact supplied screenshot at lower right. Kept the 70% schematic / 28% image-column layout, original pixels and aspect ratios.
- Caption/accessibility description identifies the dashboard as an illustrative interface state, not aggregate results or evidence validating the displayed physiological quantities. No screenshot values imported into analysis; assistance still uses the documented HR-rise trigger, not the screenshot's HRV heading.
- Preserved the preceding TeX and compiled PDF in `revisions/2026-10-08-figure3-dashboard/before/`. Old apparatus photo removed from compile dependencies and the current ZIP, retained recoverably in the frozen baselines and historical support.
- Added a short explanation of Holm correction and its consequences to `analysis/HOLM_EXPLAINED.md`. It does not alter effects or rescue significance; test families were chosen during exploratory analysis, not preregistered.
