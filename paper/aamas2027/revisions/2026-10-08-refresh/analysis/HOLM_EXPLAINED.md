# Why Holm correction is used here

Each individual test has a false-positive risk. Testing many outcomes/comparisons makes at least one false positive more likely. Holm's step-down procedure controls the chance of one or more false rejections **within a specified family of tests** at the chosen level (here .05), assuming the underlying tests/p-values are valid. It is less conservative than ordinary Bonferroni and remains valid when tests are correlated—important because the same participants contribute multiple ratings and frustration is part of the workload composite. See the [official R stats documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/p.adjust.html), which cites Holm's original 1979 paper.

It orders raw p values from smallest to largest. With m tests, the first is compared with .05/m, the next with .05/(m−1), and so on, stopping at a failed comparison. Adjusted p values provide the equivalent decision against .05. Effects, sample sizes, means and t statistics do not change.

## Families in this analysis

- Six core tests: three condition contrasts for completion and three for overall adapted workload (all n=24).
- Three correct-piece contrasts (n=24), analyzed as a separate family.
- Twenty-five secondary tests: three duration contrasts, 18 workload-dimension contrasts and four adaptive–constant assistance-rating contrasts (all n=24).
- Stricter joint nine-test and all-34-test adjustments are sensitivity checks. Family-wise protection for one family is not a global 5% guarantee across several separate families.

These families were chosen during exploratory analysis, not preregistered. Correction does not remove selection bias, measurement error, puzzle/order/device confounding, or assumptions of the paired tests. Nor is a nonsignificant result proof of no effect/equivalence. FDR methods answer a different, less stringent false-discovery question; they should not replace Holm merely because they produce more significant results.

## What it changes in these results

| Comparison | Raw p | Family-adjusted p | Passes .05? |
|---|---:|---:|---|
| Adaptive–constant: timing rating | .007925 | .118873 | No |
| Constant–control: frustration | .005379 | .086064 | No |
| Adaptive–control: frustration | .000092 | .001934 | Yes |
| Adaptive–control: effort | .004595 | .078109 | No |
| Constant–control: effort | .000199 | .003979 | Yes |

Both assisted policies still improve correct pieces, confirmed completion and overall adapted workload relative to control (adjusted p<.001). Both also shorten mean attempt duration (secondary-adjusted p=.006375). Adaptive–constant differences in pieces, completion and overall workload were already nonsignificant before correction; Holm is **not** the reason all of those fail. The earlier n23-duration 25-test family is retained as a sensitivity and gives the same duration conclusions.

Graph intervals are pointwise 95% confidence intervals, not simultaneous multiplicity-adjusted intervals. Thus a timing interval can exclude zero while its family-adjusted p fails .05; the plot/caption labels this distinction. Exact values and all comparisons are in `paired-tests.csv` and `statistics.json`.
