# Methods, findings, literature and diagram revision

7 October 2026. Baseline commit e99b8bb, branch writing. The complete pre-change paper and PDF are frozen in before/ with SHA-256 manifest; scripts and standalone diagram sources are preserved in before-tools/ and before-diagrams/. No frozen baseline was edited. This log covers this request and its follow-up clarifications about PACE, researcher observations and downloading/reading every cited paper.

## Exact manuscript changes

| Location | Change |
|---|---|
| §1 Contributions | Replaced three broad items with four specific contributions: spatial-task extension; completion/workload findings; intervention experience plus frustration variation; hint/retrieval feedback and placement future work. |
| §2.1 | Added PACE explicit-query comparator and its task-specific waiting result, checked on downloaded PDF pp.7–8. Surgical study has no requested-help condition. |
| §2.2 | Added GuideAI multimodal adaptation, Wei single-surgeon mean-HR/workload model and Quigley HR/HRV/artifact guidance, with bounded claims. |
| §2.3 | Added MRChaos robotic tangram/other-object assembly and Smit efficiency/workload-fairness logistics simulation. |
| §3 | Renamed task-profile survey/presurvey to formative assessment, including caption/discussion; added nonsignificant corrected expected-helpfulness comparisons. |
| §4 | New title Study Method: Assistance System and Experimental Protocol. Added 4.4 Participants and procedure and 4.5 Measures and analysis from old §5.1. Moved photograph-scoring rule from findings into measures. Added alpha and separate formative correction family. |
| §5 | New findings-only section. Subsections: task performance, subjective workload, intervention experience, overall experience. Existing numerical results retained. |
| Table 2 | Expanded to two columns; added all three adjusted p values per workload row. Favorable bold cells remain independent of statistical significance. |
| §5.2 | Added mental-demand, effort and performance comparison interpretation, nonsignificant physical/temporal comparisons, and paired individual frustration increases despite the lower adaptive mean. |
| §6.2 | Added author-confirmed researcher observation of waiting, unknown adaptive rules and mismatch hypothesis; no causal or adaptive-only waiting claim. Added need to validate HR-rise cue against task/independent physiology. |
| §6.3 | Added uncoded-observation limitation, transparent rules/user-requested-help future condition, bounded PACE comparison, and assembly/logistics discussion replacing TANGRAM TO ASSEMBLY LINE? note. |
| References | Added five PDF-read sources, bringing total to 20; 17 first appeared in 2024–2026. All 31 citation occurrences mapped to current text with 49 checked PDF anchors. |

## Diagram changes

Physical setup: Researchers' side and Participants' side replace the former labels; participant laptop is For hints and questionnaires. Architecture: participant laptop gains For; orange delivery boundary moves from x=12.6 to 12.85 and internal operator route from 12.45 to 12.60. Both standalone sources and embedded copies were updated and passed native compilation. Exported previews are cropped from the checked main paper; no replacement document or new editor tab was created.

## Statistical calculation and limits

scripts/analyze-all-paper-outcomes.py computes 31 exact paired experiment contrasts and six formative rating comparisons. Participant-condition averaging, coding and original endpoint/four-item Holm families are preserved. Existing tests match their previous raw and adjusted p values to numerical precision. A global 31-comparison Holm sensitivity is recorded separately; it retains constant-control completion, both assistance-control overall workload differences and both assistance-control perceived-performance differences. No once-per-study final-rating or missing correct-piece p value is fabricated.

Actual observed experiment data remain 12 complete participants/108 rounds; planned N=24 and the prior abstract are unchanged. All reported numerical findings, tests and result-based contributions remain provisional in internal documentation and must be refreshed with the final export. Frustration increases adaptive versus constant in four participants and decreases in eight; against control, two increase and ten decrease. The manuscript reports variation without inventing a prevalence for the planned final sample.

## Literature and policy verification

The new-source reading record identifies exact versions/pages, derived use and boundaries. AdaptAI was downloaded/read for contribution/architecture presentation only, not cited as experimental support. Ramnauth and telecare leads are excluded because no PDF was downloaded/read. The user’s latest instruction to use downloaded/read text was followed for every added manuscript claim.

Official AAMAS 2027 policy checked and documented in method-checks/AAMAS_AI_FIGURE_POLICY.md. No explicit exemption for AI-assisted TikZ was found; code rendering alone is not claimed to establish compliance. No external inquiry was sent. The original brief disclosure is unchanged; submission disclosure needs human-author review against actual methodology provenance.

## Review and validation

The clean PDF has nine pages, main text ending on page eight. All pages were rendered/read visually; Table 2 and the revised figures fit without horizontal clipping. One small bibliography vertical-box warning remains; the page is visibly unclipped. Class/style hashes and the abstract match the baseline. Anonymous authors and ID2613 are retained. Highlighted HTML and exact source/file diffs compare this revision with the frozen pre-change paper. The compiled highlighted TeX uses review-only colored additions/deletions and disables final-column balancing; it is not the submission copy. Current diagram changes are listed here because input-TikZ internals are not word-diffed by latexdiff.

Clean project, figure ZIP and highlighted-review ZIP are refreshed from the current files. Raw participant inputs and downloaded literature full text stay ignored. Earlier revision packages and unrelated user-extracted output/packages/aamas2027-complete-latex-project/ are untouched.
