# Replace comparison figures with grouped bars

7 October 2026. Prepared for publishing on the writing branch. The baseline includes the preceding local terminology and photo/table/comment revisions.

- Removed former Figure 5 (matched constant/adaptive scatterplots) and Figure 6 (paired assistance-rating differences) from the current paper and figures folder. Their source assets, analysis and generator are preserved in before/ and before-tools/.
- Added one grouped bar chart as Figure 5 comparing helpfulness, timing, seamlessness and frustration relief. These four measures share a seven-point rating scale. Blue represents constant assistance, orange adaptive assistance. Bars start at zero; labels show exact rounded means and error bars show sample standard deviations across participant-condition averages.
- Removed the cross-condition correlation paragraph in Section 5.4 and the corresponding methods sentence. Retained existing paired tests, adjusted p-values, numerical tables and the statement that assisted-condition differences were not statistically significant.
- Updated the figure caption/accessibility text, Markdown manuscript, current structure/handoff notes, figure generator and clean LaTeX ZIP. The paper now has five figures; objective performance remains in Table 1 and workload in Table 2/Figure 4.
- Added analysis/assistance-bars.json so the plotted means and SDs can be checked directly. Existing analysis records, abstract, baseline confirmation, photo, quotations, table emphasis and bibliography are unchanged.

Review highlighted-review.html and main.tex.diff. validation.json records data, build, reference and packaging checks. Older review packages remain historical and are not regenerated.
