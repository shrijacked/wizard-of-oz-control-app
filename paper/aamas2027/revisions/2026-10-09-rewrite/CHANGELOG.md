# Rewrite after detailed review

9 October 2026. Work is in this separate revision directory. The pre-review source, PDF, inputs and analyses remain preserved in `../paper-review-2026-10-09/baseline/`. The existing canonical refresh and writing checkout were not replaced or pushed.

## Content and methods

- Retained the original abstract's motivation/comparison framing, updated the confirmed results, and removed duration-based speed claims.
- Kept three contributions, including users' subjective feedback; added reduced frustration to the empirical contribution.
- RQ1 now concerns completion and correct-piece progress. RQ2 retains workload, frustration and intervention experience. Duration and study-wide final ratings are descriptive.
- Corrected participant targets to black silhouettes on light gray, distinguishing researchers' colored solutions.
- Defined the preset-hint selection and retrieval rule: one appropriate hint per cue, retrieval when its piece is at the marked pickup spot, otherwise hint only. Added visual/audible reminders and the distinction between receiving and following help.
- Distinguished resting from the separate 60-second sensor-calibration recording and stated stopping at the five-minute beep.
- Added operator/participant kill-switch access, human placement/orientation judgment, and the highest-count admissible-orientation scoring rule.
- Retained the 24-person demographics and college volunteer/coupon recruitment; teaching/research fellows rather than faculty in the experimental sample.
- Corrected the false no-debriefing sentence. Retained consent, withdrawal, and photograph publication consent without inventing committee approval.
- Made the AI disclosure accurate about manuscript and analysis-code assistance; did not claim AI formulated hypotheses or designed/conducted the experiment.
- Kept both final-survey quotes, bracketed grammar corrections and all 24 final-survey summaries. No participant IDs or confirmation histories appear in manuscript prose.

## Statistical reporting

- Adopted the agreed twelve-comparison main group: three contrasts each for completion, correct pieces, workload and frustration. Nineteen other rating comparisons form a secondary group. No participant, score, raw effect or unadjusted p-value changed.
- Constant--control frustration now passes the main-family threshold (paired Holm p=.026895); adaptive--control also passes. Adaptive--constant frustration remains nonsignificant (p=.362558). Both assisted policies retain completion/progress/workload improvements versus control; no assisted-policy comparison establishes superiority.
- Updated every main-text/figure p-value to the agreed paired results, consistently defining p_H as Holm-adjusted. Kept pointwise confidence intervals distinct from corrected testing decisions.
- Duration is reported as recorded round duration, not active solving time. Removed inferential duration/speed comparisons without clipping observed durations.
- Added a separate supplementary puzzle/block-adjusted robustness analysis using all 24 participants, with model specification, diagnostics, aggregate contrasts and allocation counts. Its main decisions agree with the paired results; model p-values are not substituted into paired plots.
- Frustration's original RQ2 role is retained; the exact correction grouping is not misrepresented as preregistered. Workload/frustration and completion/count overlap is acknowledged concisely.

## References

- Corrected Karbouj's review-versus-system attribution, Prajod's HRV classifier versus separate facial-expression analysis, and Cavicchi's unsupported delegation recommendation.
- Clarified Melo's physical tangram/screen-target setup without attributing robotic assistance to it.
- Retained all 34 citation keys. Added verified PACE pagination, MRChaos DOI, and Vitry's arXiv DOI for the version consulted. Relevant claims remain scoped as reviews, simulations, associations or live evaluations as appropriate.
- MRChaos pagination is omitted because a proceedings table of contents and an author/institution record give conflicting values; no page range was guessed. Vitry's IEEE DOI/pagination is not asserted; the retained author-version DOI is identified. See `CITATION-ALIGNMENT.md` for the claim-level checks and remaining metadata boundaries.

## Figures, layout and packages

- Five main figures replace seven: the condition-order diagram moves to the supplement; frustration and assisted-experience bars are combined into one figure. This preserves the requested constant/adaptive bars while reducing duplication.
- Regenerated the paired-difference plots with the agreed p_H values and separated statistical labels from their confidence bars.
- Retained the compact formative figure and bold descriptive best means in tables. Removed the formative time-category paragraph rather than treating partial-solution times as completion times.
- Figure 3 retains a 70% schematic and centered right-hand stack: smaller wide setup, cropped interface, then overhead view.
- Made deterministic pixel crops, redactions and resizing; removed image metadata. The three original assets are preserved byte-for-byte in `private-original-images/`, excluded from distributed archives.
- Cropped the dashboard to remove browser/profile chrome and third-party solution artwork/QR. Redacted the visible face and identifying details; preserved the visible safety control.
- Template class/style and margins remain unchanged. Removed dependence on the main-paper order-tree and separate redundant bar assets.
- Separate allowlisted source and aggregate-result archives exclude personal records, raw physiology, workbooks, original images and private review history.

## Boundaries

This is a revised draft, not a claim of institutional clearance, equal-dose timing isolation, validated stuckness detection, robot-only efficacy, or policy equivalence. Raw-data release rights and submission-account actions remain author decisions. No commit, push or submission was performed.

## Follow-up: spacing and complete reference-text map

- Rechecked all eight rendered main-paper pages for section gaps, float order, table proximity, alignment and clipping. The current spacing needed no further source edits; the template, margins and existing ragged-bottom setting remain unchanged.
- Added `REFERENCE-TEXT-MAP.md` and its JSON companion: all 34 active references, all 41 citation occurrences and all 11 abstract sentences, with exact manuscript passages, source-PDF links, one-based pages, short actual-text locators, evidence paraphrases and boundaries.
- Freshly reopened all 34 canonical PDFs and verified their hashes and page counts. Matched every literal locator against fresh PDF text. Re-rendered Cao's image-based official results page and cross-checked its correlation findings against the searchable author copy.
- Refined the earlier broad supporting-page pointers, especially Pereira (pp18-20), Quigley (pp1/8/9) and Hart (pp1/3). These are audit-navigation changes, not new manuscript claims.
- Checked the abstract's literature precedent against Yang and its statistical claims against the agreed paired/adjusted aggregate results. Nothing is deferred or left as a placeholder in the abstract.
- This follow-up changed only audit documentation and added the reproducible map builder; it did not change the manuscript, bibliography, figures, numerical results or previously packaged source ZIP. No push was performed.

## Figure 3 physiological-value censorship

- Added opaque masks over the dashboard's heart-rate and RMSSD numeric readouts, retaining their field labels. This changes only the illustrative screenshot, not the study data or analyses.
- Preserved the original dashboard byte-for-byte. Added a dashboard-only asset-builder option so this edit does not regenerate other images or statistical plots.
- Kept the image dimensions, LaTeX inclusion widths, caption and figure layout unchanged. Added a source comment documenting the derivative; manuscript prose is unchanged.

## Requested caption and workload wording removals

- Removed “Dashboard values illustrate the interface, not aggregate results” and “Schematic not to scale” from the Figure 3 caption.
- Removed the sentence contrasting the adapted unweighted score with original weighted NASA-TLX. Retained the adapted-item wording, seven-point scales, performance reversal, unweighted averaging and 0-100 conversion formula.
- Recompiled the existing project successfully in place: eight pages, no overfull boxes or undefined references. Re-rendered and visually checked all eight pages, regenerated the reference-text map for the current source, and refreshed the source ZIP with the censored screenshot.
- The built-in isolated compiler could not load `aamas.cls`; the editor remains open. The existing project's local compiler and saved PDF passed verification.

## Requested limitations, ethics and AI wording removals

- Removed the condition-order/puzzle-allocation sentence from the limitations paragraph, without altering the design or allocation records.
- Removed the mean age from that paragraph; retained age range and participant types. Mean age remains in the Participants section.
- Removed the setup-photograph publication-consent/redaction sentence from Ethical Considerations; actual photo redactions and original preservation are unchanged.
- Shortened the AI disclosure to manuscript preparation and analysis-code development, removing the numerical/citation-consistency phrase.
- Existing project compiled successfully to eight pages; affected pages 7-8 visually checked. Reference-text map and source ZIP refreshed. Built-in preview retains the known multi-file class-loading limitation; the source editor remains open.

## Descriptive objective/subjective comparison

- Added the requested descriptive contrast to the abstract, Findings overview and conclusion; aligned the discussion summary.
- Named the supported measures: constant has higher completion and correct-piece counts; adaptive has lower overall workload/frustration and higher assistance-item means. Did not claim adaptive leads every workload dimension (effort slightly favors constant) or infer solving-speed superiority.
- Retained the explicit nonsignificant corrected constant-adaptive comparisons in each summary; no statistical results or analysis groupings changed.
- Existing project compiled successfully to eight pages; all eight updated pages rendered and visually checked for spacing and overflow. All eight named descriptive directions checked against the agreed comparisons.
- Reference-text map refreshed for 34 references, 41 citation occurrences and 12 abstract sentences. Source ZIP refreshed; no commit or push performed. Native preview retains the known multi-file class-loading limitation.

## Figure 3 bottom crop

- Trimmed 130 original-image pixels from the bottom of the interface derivative to remove the free-text hint input area. Retained preset hint content, existing physiological-value censorship and the centered image stack.
- Left the “Robot: offline” status unchanged: the author clarified that the arm was manually operated rather than connected through this dashboard. No protocol prose, statistical results or references changed.
- Preserved the original screenshot byte-for-byte; rebuilt only the dashboard asset. The existing project compiled successfully to eight pages, and Figure 3's rendered page was visually checked for alignment and spacing. Refreshed the allowlisted source ZIP.
- Built-in compilation still cannot resolve the neighboring AAMAS class; the existing editor remains open. No commit or push performed.

## Figure 3 corrected full-width interface crop

- Superseded the narrow interface crop: restored the complete solution-preview panel (including its original source attribution) and all seven robot cue buttons. Cropped the bottom at the gap after the first preset-hint row, excluding the lower free-text input and partially shown lower controls.
- Retained the existing heart-rate/RMSSD masks, laptop-detail redaction and unaltered “Robot: offline” status. The private original remains unchanged.
- Expanded the screenshot to the full right-column width for readability while retaining the 70/28 schematic/image layout and centered three-image stack.
- Limited double-column top floats to one per page so the two apparatus figures retain surrounding text rather than producing an overflowing figures-only page. Figure 3 remains on page 5; template class, margins and scientific content are unchanged.
- Recompiled to eight pages without overfull boxes or undefined references; rendered and visually checked all eight pages. Refreshed the current-source reference map and allowlisted source ZIP. Built-in preview retains the known class-loading limitation. No commit or push performed.

## Final author-supplied abstract and publication handoff

- Replaced only the abstract with the author's final wording, preserving its text with LaTeX dash and mathematical-p formatting. Scientific content outside the abstract, figures and statistical inputs are unchanged in this step.
- Preserved the preceding TeX, PDF and source ZIP in `before-final-abstract.INUY1o/`. The pre-review writing version also remains preserved in the original review snapshot.
- Updated the abstract-to-evidence map for all eleven final sentences; the manuscript still has 34 references and 41 citation occurrences.
- Recompiled the existing project to eight pages, without overfull boxes or undefined references, and visually checked all eight pages. Native preview retains the known external-class limitation.
- Prepared an explicit final-publication handoff for the `writing` branch: current source/assets, PDFs, aggregate supplement, compile ZIPs and revision documentation. Private inputs, original unredacted images and full third-party PDFs are excluded. Historical preparation-stage no-push notes above describe those earlier checkpoints, not the final requested handoff.
