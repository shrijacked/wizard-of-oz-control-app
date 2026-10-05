# AAMAS literature register and verified derivations

Prepared 5 October 2026 for the paper on scheduled and physiology-informed assistance during physical tangram solving.

This folder documents which literature was explored, how far each paper was examined, and what the downloaded and reviewed papers contribute to the research rationale. It is a targeted literature audit, not a systematic review or a reanalysis of participant results.

## Start here

- [Citation-to-PDF text map](REFERENCE_TEXT_MAP.md): all 15 references, 21 citation occurrences and 35 supporting passages, refreshed for the author-voice revision. Includes the exact manuscript wording, brief verbatim search anchors, PDF pages, explanations and boundaries. Its [JSON companion](reference-text-map.json) records manuscript locations and normalized passage offsets/hashes.
- [Active manuscript reference audit](MANUSCRIPT_REFERENCE_AUDIT.md): the current 15 cited sources, all checked against downloaded PDFs, with claim-specific pages and interpretation limits. Twelve first appeared in 2024–2026. This supersedes the older register for determining which citations support the current manuscript.
- [Active audit JSON](manuscript-reference-audit.json): source URLs, local PDF/text paths, hashes, versions and evidence pages for those 15. PDFs are available locally under gitignored `data/writing-reference/literature-pdfs/`; they do not travel with a Git checkout.
- [Reading register](READING_REGISTER.md): 18 actively examined papers with publication dates, access/review status and source links, followed by 22 discovery-only leads. Two discovery records have incomplete titles and are not citation-ready.
- [Findings derived from downloaded and reviewed papers](DERIVED_FINDINGS.md): 14 paper-specific evidence summaries, exact section/PDF-page locations, implications for this paper, and limits on those implications. Only papers that were both downloaded and reviewed appear here.
- [Printable register](READING_REGISTER.html): standalone HTML for sharing or printing; download/open it in a browser.
- [Machine-readable register](reading_register.json): the same records for later updates.
- [Download provenance](download_provenance.json): original filenames, public download URLs, versions, page counts, download dates and SHA-256 hashes for the 14 locally reviewed PDFs. The PDFs and extracted full texts are not bundled; public source links identify the reviewed versions.
- [Publication metadata](publication_metadata.json): retained bibliographic and publication-date fields from the earlier metadata checks.
- [Literature-audit bibliography](reviewed-literature.bib): the 15 previously entered citations, including the HTML-read Javernik paper. This is a separate audit collection, not the manuscript bibliography or a list of all 40 explored/discovery records.
- [Gap-search record](gap_search_log.json): the earlier targeted query log and unresolved candidates; not a complete systematic search protocol.

## Historical exploration register: how to interpret the labels

The counts below describe the earlier exploration register, before the current manuscript audit and the new PACE, Hart and Thunberg PDF downloads. They are not the active bibliography count. Keep this history separate from manuscript citation eligibility.

| Status | Number | Meaning |
| --- | ---: | --- |
| Downloaded PDF and targeted text review | 14 | Relevant methods, results, discussion and limitations were checked. This does not imply exhaustive appraisal of every page. Eligible for `DERIVED_FINDINGS.md`. |
| Publisher HTML text read | 1 | Javernik: relevant full-text sections read online; PDF retrieval failed. Recorded for access history, excluded from derived findings under the downloaded-and-reviewed rule. |
| Selective online reading/reference tracing | 1 | Morandini: used for discovery, without a comprehensive section audit or saved PDF. |
| Abstract/metadata only | 2 | Knežević and the SSRN record: full texts remain unverified. |
| Discovery-only leads | 22 | Search/reference leads without structured full-text review; some metadata remains unresolved. |

First-online publication, issue dates, and preprint posting dates are distinguished. Unknown dates are marked rather than inferred from DOI strings. PDF page numbers count from the first page of the reviewed file, including covers; author-manuscript and journal pagination can differ.

## Current interpretation

Yang et al. already compare physiology-triggered robot assistance with periodic support in surgical training. The earlier broad claim that this comparison was missing or scarce was withdrawn. The defensible positioning is an empirical extension to physical spatial problem solving, with informational and physical assistance and participant-experience measures. The search does not establish first-ever novelty.

Tangram rationale is grounded in Tabatabaei and Melo/SensCogAR. Physiological sensing and adaptation are established areas; none of these sources validates our particular heart-rate cue or establishes our participant outcomes. See the evidence and limitations in the derived-findings document before incorporating claims into the manuscript.

## Scope of the earlier exploration update

The original register preserved literature exploration without revising the manuscript. The later writing pass now revises the paper and bibliography and adds the active audit linked above. The submitted abstract remains unchanged. Findings in this folder are paraphrases with explicit study-specific limits. Unreviewed records are reading leads, not support for empirical claims.

To extend the audit, retrieve a paper, record the exact version and access date, inspect the relevant text, and add page/section evidence before adding a derived finding. Keep online-only and abstract-only records separate until the required review has been completed.
