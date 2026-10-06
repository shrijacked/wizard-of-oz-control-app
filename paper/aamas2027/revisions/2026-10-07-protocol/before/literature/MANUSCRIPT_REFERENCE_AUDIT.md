# Active manuscript reference audit

For the exact manuscript sentences and short supporting excerpts from each PDF, use the [citation-to-text map](REFERENCE_TEXT_MAP.md). It covers all 15 references and 21 in-text citation occurrences; this document retains the broader verification and access history.

Checked 7 October 2026. All **15 retained citations have downloaded PDFs**, and their identifying metadata and relevant methods, results or limitations passages were checked against the paper text. This is claim-focused verification, not a systematic review or a claim that every page was read exhaustively. No source is treated as verified solely from a search snippet.

**Recency:** 12/15 (80%) first appeared in calendar years 2024–2026. The three older exceptions are Hart (NASA-TLX measurement), Teo (physiologically triggered aid), and Yang (closest adaptive/periodic comparator). Yang first appeared online in 2022 despite its 2024 issue; Teo appeared online in 2017 despite its 2018 issue. Andriella appeared online in late 2024 and Karbouj in late 2025. The bibliography remains below the mentor's 40-reference target.

**Local cache:** PDFs and page-labelled extracted text are under gitignored `data/writing-reference/literature-pdfs/` and `data/writing-reference/literature-text/` at the repository root. Twelve cited PDFs were copied from the earlier downloaded reference set and their hashes rechecked; PACE, Hart and Thunberg were newly downloaded on 5 October. The [JSON audit](manuscript-reference-audit.json) records exact paths, URLs, download dates, hashes, versions and page counts. Page numbers below are **PDF pages**, including cover pages, not necessarily printed pagination.

Current revision check (7 October): all 15 PDF file hashes and 35 normalized-page anchors match. No cited claim or bibliography entry changed; updated locations are in REFERENCE_TEXT_MAP.md.


## Citation-to-claim checks

### andriella2025 — 2025

[Downloaded PDF source](https://link.springer.com/content/pdf/10.1007/s11257-024-09421-1.pdf). Local file: `Andriella_2025_Bayesian_Proactive_Assistance.pdf`. 43 PDF pages; evidence checked on pp. 1, 16, 17, 23, 24.

**Used in Introduction; §2.1:** Models proactive assistance type, timing and confidence in a sequential memory game using user and task information.

**Boundary:** Different task and policy; does not validate wrist-HR inference. Online 26 December 2024, journal issue 2025.

### caiazzo2024 — 2024

[Downloaded PDF source](https://scidar.kg.ac.rs/bitstream/123456789/21811/1/comparative-analysis-of-mental-workload-in-adaptive-human-robot-collaboration-during-assembly-tasks.pdf). Local file: `Caiazzo_2024_Comparative_Assembly_Workload.pdf`. 11 PDF pages; evidence checked on pp. 2, 4, 6, 9.

**Used in §2.3:** Three-participant comparison of manual, collaborative and guided collaborative assembly; EEG measures workload.

**Boundary:** Small exploratory study; physiology is assessment, not demonstrated online intervention triggering. DOI/pagination not verified and omitted.

### capponi2024 — 2024

[Downloaded PDF source](https://www.qualityengineering.polito.it/content/download/1126/6184/file/Assembly%20complexity%20and%20physiological%20response%20in%20human-robot%20collaboration%20_%20Insights%20from%20a%20preliminary%20experimental%20analysis.pdf). Local file: `Capponi_2024_Assembly_Complexity.pdf`. 16 PDF pages; evidence checked on pp. 1, 3, 8, 13.

**Used in §2.2:** Assembly configurations did not yield a clear significant RMSSD pattern; paper distinguishes cognitive effort and stress.

**Boundary:** Does not validate the present HR-rise threshold or establish that HRV never reflects workload.

### delazzari2025 — 2025

[Downloaded PDF source](https://www.merl.com/publications/docs/TR2025-064.pdf). Local file: `PACE_2025.pdf`. 9 PDF pages; evidence checked on pp. 1, 3, 4, 5, 7, 8.

**Used in Introduction; §2.1:** PACE estimates action completion from hand motion and learns a proactive assistance policy; evaluated in collaborative assembly.

**Boundary:** Different sensing and assistance mechanism. Manuscript imports no numerical benefit or universal superiority claim. MERL cover and blank page precede paper.

### hart2006 — 2006

[Downloaded PDF source](https://www.nasa.gov/wp-content/uploads/2026/01/hfes-2006-paper.pdf). Local file: `Hart_2006_NASA_TLX.pdf`. 5 PDF pages; evidence checked on pp. 1, 3.

**Used in §2.3:** NASA-TLX has six dimensions; unweighted scoring is discussed; modifications require validation; workload and performance need not covary.

**Boundary:** Does not validate this study's seven-point adaptation. NASA web upload in 2026 is not the publication year.

### hostettler2025 — 2025

[Downloaded PDF source](https://alexandria.unisg.ch/bitstreams/b9548afd-a853-40ed-9141-7bb837ce1f77/download). Local file: `Hostettler_2025_Real_Time_Adaptive_Industrial_Robots.pdf`. 16 PDF pages; evidence checked on pp. 1, 5, 6, 12.

**Used in §2.2:** Robot behavior is adapted using user distance, while pupil responses are evaluated.

**Boundary:** Pupil-driven adaptation is a future direction, not the implemented trigger.

### karbouj2026 — 2026

[Downloaded PDF source](https://publica-rest.fraunhofer.de/server/api/core/bitstreams/e60c03db-8192-404a-a885-43c61307f554/content). Local file: `Karbouj_2026_Adaptive_HRC_Review.pdf`. 25 PDF pages; evidence checked on pp. 1, 13, 15, 21.

**Used in Introduction; §2.1:** Systematic review distinguishes motion/task/control adaptation and discusses timing, sequencing and role coordination.

**Boundary:** Taxonomy supplies context, not proof that the exact research comparison is absent. Published 30 December 2025; 2026 volume.

### korivand2024 — 2024

[Downloaded PDF source](https://mdpi-res.com/d_attachment/sensors/sensors-24-02817/article_deploy/sensors-24-02817.pdf). Local file: `Korivand_2024_Physiological_Task_Load_Adjustment.pdf`. 21 PDF pages; evidence checked on pp. 1, 8, 15, 18.

**Used in §2.2:** Physiological task-load analysis and Q-learning-based adjustment; the authors state that recorded wristband data could not be integrated directly in real time.

**Boundary:** Do not describe it as an end-to-end real-time wrist-triggered robot policy. PDF p18 was also visually inspected.

### melo2026 — 2026

[Downloaded PDF source](https://www.jstage.jst.go.jp/article/ijabc/2026/1/2026_147/_pdf). Local file: `SensCogAR_2026_Tangram_Assembly.pdf`. 20 PDF pages; evidence checked on pp. 1, 8, 15.

**Used in Introduction; §2.3:** Tangrams serve as a proxy for small-object assembly; visibility of piece contours varies task demand.

**Boundary:** Seated/simplified task; transfer to industrial work remains limited. No performance values imported.

### ojstersek2024 — 2024

[Downloaded PDF source](https://mdpi-res.com/d_attachment/machines/machines-12-00546/article_deploy/machines-12-00546.pdf). Local file: `Ojstersek_2024_Personalizing_Workplace.pdf`. 16 PDF pages; evidence checked on pp. 1, 3, 4, 6, 8.

**Used in §2.2:** Workplace parameters personalized using a preliminary skills test; ECG transferred and analyzed after experiments.

**Boundary:** Do not present ECG as the real-time adaptation trigger.

### pereira2025 — 2025

[Downloaded PDF source](https://mdpi-res.com/d_attachment/applsci/applsci-15-03317/article_deploy/applsci-15-03317.pdf). Local file: `Pereira_2025_Workload_Sensors_Review.pdf`. 26 PDF pages; evidence checked on pp. 1, 13, 14, 15, 18.

**Used in §2.2:** Review describes heterogeneous physiological workload measures and mixed cardiac findings in HRC.

**Boundary:** Different sensors/tasks and mixed evidence; no validation of a universal HR threshold.

### tabatabaei2025 — 2025

[Downloaded PDF source](https://arxiv.org/pdf/2502.16899). Local file: `Tabatabaei_2025_Gazing_at_Failure.pdf`. 11 PDF pages; evidence checked on pp. 1, 3, 8.

**Used in Introduction; §2.3:** Studies gaze around robot failures in collaborative physical tangram solving.

**Boundary:** Robot-failure/gaze study, not a scheduled-versus-physiological assistance experiment. Downloaded arXiv v1 of accepted HRI paper.

### teo2018 — 2018

[Downloaded PDF source](https://sciences.ucf.edu/psychology/perl/wp-content/uploads/sites/29/2019/08/Enhancing-the-effectiveness-of-human-robot-teaming-with-a-closed-loop-system..pdf). Local file: `Teo_2018_Closed_Loop_Teaming.pdf`. 13 PDF pages; evidence checked on pp. 1, 4, 6, 11.

**Used in §2.2:** Individualized physiological workload markers can trigger aid during robot supervision; aid imposed later if not triggered.

**Boundary:** Online 3 October 2017; 2018 issue. Different task and physiological indices; not evidence for the present threshold.

### thunberg2026 — 2026

[Downloaded PDF source](https://repositum.tuwien.at/bitstream/20.500.12708/227993/1/Thunberg-2026-Unpacking%20Lived%20Experiences%20of%20Wizards%20of%20Oz-vor.pdf). Local file: `Thunberg_2026_Wizards.pdf`. 3 PDF pages; evidence checked on pp. 1, 2, 3.

**Used in §2.4:** Workshop proposal foregrounds practical, ethical and methodological tensions in the wizard's role.

**Boundary:** Three-page workshop agenda, not a completed empirical evaluation or validated protocol. Explicitly called a proposal in the manuscript.

### yang2024 — 2024

[Downloaded PDF source](https://scholarworks.indianapolis.iu.edu/bitstreams/5eb42ad8-e6eb-4495-9c1d-f520e3877a06/download). Local file: `Yang_2024_Adaptive_Surgical_Assistance.pdf`. 32 PDF pages; evidence checked on pp. 1, 8, 9, 10, 12.

**Used in Introduction; §2.2:** EEG and gaze inform adaptive suction; periodic comparator uses 150-second intervals selected to approximate earlier assistance frequency.

**Boundary:** First online 11 November 2022, 2024 issue. Author manuscript version. Direct precedent, but different task/sensors; not evidence validating 5 bpm.

## Removed sources and unresolved access

Older or redundant sources from the first draft were removed to focus this paper on directly relevant recent work. Their removal does not imply that the papers are fabricated. The historical literature register remains available for discovery and context; it is not the active citation audit.

Riek (2012) and Yang et al.'s 2026 Wizard-of-Oz review had publisher PDF access blocked (HTTP 403); neither remains in this manuscript. Pelikan et al.'s 2025 public-deployment paper could not be downloaded within the attempts made and is also not retained. Thunberg is used narrowly as a workshop proposal, with that status explicit, rather than represented as an empirical substitute.

## Adding or revising a citation

Obtain and read the actual PDF; confirm authors, title, version and publication chronology; identify the passage supporting the precise manuscript claim; record the URL, hash and pages here and in the JSON; then update both manuscript copies and `references.bib`. If the claim exceeds what the paper establishes, narrow it. Do not infer live physiological control from a study that only records physiological outcomes. Do not import study statistics or claims from abstracts, reviews, or earlier notes without reading the supporting paper text.
