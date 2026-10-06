# Scheduled/adaptive figure comparison

7 October 2026. Complete pre-change manuscript, all figure assets and PDF preserved in before/ with baseline hashes. Earlier review packages are unchanged.

| Location | Change |
|---|---|
| §5.1 Analysis | Define the displayed correlations as scheduled versus adaptive scores for the same participant/measure. |
| §5.2 | Remove the former Figure 4 performance plot and its prose cross-reference; retain the objective-results table and all numeric findings. |
| §5.3 | Retain the workload/frustration plot, now Figure 4. Remove the within-condition correlation paragraph and all three heatmaps. |
| §5.4 | Add scheduled/adaptive Spearman coefficients and Figure 5: eight matched scatterplots for task outcomes and assistance ratings, with equality diagonals. Larger dots represent coincident pairs. |
| §5.4 | Replace former Figure 7 with Figure 6: horizontal adaptive-minus-scheduled rating differences, individual values, means and unadjusted 95% bootstrap intervals. |
| Readable manuscript | Synchronize changed prose, images and numbering. |
| Figures | Add scheduled-adaptive-correlations and assistance-differences as vector PDF/PNG. Remove performance, correlations and intervention-experience PDF/PNG from current assets; all are preserved in before/figures/. |
| Analysis | Add assisted-comparison.json with input hash, actual paired sample, exact Spearman coefficients and existing difference estimates. Do not alter source data or primary revision-analysis.json. |
| Scripts | Add plot-assisted-comparison.py; update the full analysis script to invoke it and stop generating retired figures; include the new helper in the review inventory. |
| Handoff | Update README, BUILD, author notes, evidence map, structure review and supplementary notes for the new six-figure set and reproduction. |
| References | Refresh source locations/hashes; verify the same 15 source PDFs and 35 text anchors. No literature claim changes. |
| PDF | Rebuild and check every page. |

The exact restored abstract, planned N=24, anonymous author block/ID 2613, draft notice, existing results/tables/paired tests, approved section order and bibliography remain unchanged. New correlations use existing matched participant averages and do not claim condition effects or statistical significance. Bootstrap intervals in the difference figure are unadjusted; manuscript p-values retain their existing Holm correction.

Exact source changes: main.tex.diff, manuscript.md.diff and file-diffs/. Word-highlighted review: highlighted-review.html. File hashes: change-inventory.json. Checks: validation.json. Changes remain local, not pushed.
