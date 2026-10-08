# New-citation audit — 8 October 2026

Historical scope: this records the first, 19-new-reference pass. The subsequent **all-34-source** review is in `ALL_SOURCE_AUDIT.md` with provenance in `all-source-downloads.json`; the earlier scope notes below are preserved, not current coverage limitations.

Baseline: the preserved local 15-reference package. Updated source: `origin/writing`, commit `5fe730d`. Its active bibliography contains 34 entries, hence 19 additions against this baseline. All 19 PDFs were downloaded and their title/author information and relevant claim passages checked directly. This is claim-level verification, not a claim that every page of every paper was read. `download-manifest.json` records URLs, versions where encoded in the URL, PDF page counts, bytes, and SHA-256 hashes. Local page numbers below are one-based and include repository covers.

| Key | Checked PDF pages | Claim supported / limits retained |
|---|---|---|
| quigley2024 | 1, 7–9 | Cardiac measurement guidelines distinguish HR/HRV and explain movement, PPG signal-quality and contact issues. They do not validate this study's +5-bpm trigger as stress detection. |
| shukla2026 | 1–2, 6, 9 | GuideAI combines HRV, gaze and behavior and adapts instructional content/pacing/feedback. It is an educational system, not a robotic timing-policy replication. Accepted-paper author PDF, IUI DOI shown in PDF. |
| smit2024 | 1, 6, 8 | Order-picking simulation jointly optimizes efficiency and workload fairness. Workload is lifted-product mass, not reported TLX; added that distinction to the manuscript. Retain preprint status. |
| wei2025 | 1–2, 5 | A single expert surgeon performs simulated tasks; subjective workload and mean HR contribute to performance prediction. Preserve the single-person, prediction-not-intervention qualification. |
| zhao2025 | 1–2, 4, 6 | MRChaos reasons/plans/manipulates tangrams and extends to cutlery/soda arrangements. This is robotic assembly, not a participant assistance evaluation. Author preprint. |
| ramnauth2026 | 8, 13, 22 | Utility/cost, relative skill and parallelizability framework; 215 online participants judge vignettes. No live assistance-effect experiment. |
| lavitnicora2024 | 6, 8–9 | Assembly gaze study with 37 volunteers and a 10-volunteer gaze-initiation pilot. Readiness for joint action is not evidence of needing a hint. |
| tanneberg2024 | 3–5, 7 | Scene/dialogue plus LLM reasoning decides whether/how to assist; constructed scenario tests and physical demonstration. Do not describe it as a controlled participant comparison. Author manuscript. |
| andriella2025mentalising | 5, 11–14 | Mentalising plus Q-learning; final analyzed sample 56; performance/assistance acceptance improve. Explanation detail is confounded and timing fixed. Distinct from the Bayesian paper already cited. |
| vitry2026 | 1–4 | 56 analyzed participant records, 28 pairs; more interactions under proactive behavior, no significant overall task-performance effect; scheduled hints in both conditions. Corrected **Kieran Edgeworth → Kieran von Valeburg** against downloaded v2 title page and arXiv record. Final IEEE archival DOI/pagination remain unverified. |
| prajod2024 | 6–8 | ECG-HRV and facial analysis; adaptive delivery is triggered by WoZ task-progress judgments, not physiology; classifier is evaluated offline using LOSO. Do not conflate this with live cardiac triggering. |
| cavicchi2025 | 1–4, 8 | Narrative review of cognitive-conflict tasks: social cues can distract; offloading part of the main task is recommended. Not a quantitative robot-assistance efficacy meta-analysis. |
| vandijk2023 | 2–3, 5, 7 | 20 participants; human-led autonomy lowers five workload dimensions; slower pacing lowers mental and temporal demand. Action onset changes while robot movement speed stays constant. |
| varrasi2026 | 2, 4, 6, 11 | 60 younger/older adults in modified Trail Making Test; older adults report higher workload under robot than human guidance, younger-group difference nonsignificant. Publisher PDF recovered through Sheffield Hallam repository after publisher robot-check and Kent timeout. |
| bejarano2024 | 1–5 | Six HRI researchers interviewed; operator expertise/responses, robot delays, unpredictable users, precise control. Not a new six-person sample of real-world teleoperators. |
| candon2023 | 3, 5–8 | 71 analyzed participants; before-change reminders yield faster feedback and more feedback in a ten-second window; no significant whole-game reminder-timing effect. Feedback solicitation, not physiological task assistance. PDF fonts produce imperfect extraction; identifiable surrounding methods/results retained. |
| cao2025 | 5, 7 | 21 participants; timed decision and contentious discussion; exploratory unsuccessful-handling associations with lower inclusion/satisfaction. Official RSS PDF's image-based pages visually checked; searchable author v2 also downloaded. No alternative handling condition establishes causality. |
| bhagatsmith2026 | 1–4, 6, 10–12 | Survey evaluates portability, complexity and adaptability under unknown tasks; domain generalization/few-shot learning proposed for future empirical work. Not a newly validated workload estimator or trigger. |
| tanjim2025 | 1, 3–5 | 84 people in 26 team sessions; WoZ crash cart, verbal object search plus visual reminders improves workload/usefulness/ease versus reversed cues and no feedback. Simulation, not clinical efficacy or physiological adaptation. Four-author arXiv v3 matches current citation. |

## Version and scope notes

- Original downloaded-PDF provenance in the fetched writing source was used to locate candidates, not treated as proof without inspecting the retrieved paper.
- Lavit Nicora/Prajod have overlapping authors and matching cohort descriptions. Separate papers are not claimed to be independent participant replications.
- Retained publication/author-preprint distinctions. Downloading an arXiv PDF does not itself verify a journal or conference publication.
- Vitry v2 is confirmed as RO-MAN 2026 by its [arXiv record](https://arxiv.org/abs/2606.28469); no unverified IEEE DOI was invented. Its PDF now names von Valeburg, unlike the fetched BibTeX.
- The [official RSS record](https://www.roboticsproceedings.org/rss21/p089.html) and conference PDF confirm Cao's title, seven authors, 21-person design and DOI.
- Varrasi's [university archive](https://shura.shu.ac.uk/37555/) identifies the recovered copy as the published version. `varrasi2026.pdf` includes its repository cover.
- The first 15 references retain their previous audit; they were not all freshly downloaded in this refresh. No claim is made that they were.
- Bibliographic punctuation, optional fields, conference-page metadata and version updates should still receive a final author check before submission.

## Changes resulting from verification

1. Corrected the Vitry author name in `paper/references.bib`.
2. Specified lifted mass when discussing Smit's workload-fairness measure.
3. Kept offline-versus-online, prediction-versus-intervention, vignette-versus-live, and review-versus-experiment qualifications while compressing Related Work.
4. Did not import numerical source-study effect sizes into this experiment's results.
