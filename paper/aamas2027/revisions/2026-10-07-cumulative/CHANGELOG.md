# Cumulative changes from the recent editing rounds

7 October 2026. This review combines the protocol/anonymity changes, the restored abstract and planned sample, and the graph revision. It compares the current manuscript with the complete draft immediately before those three rounds. The pre-change paper/PDF is copied without alteration from the protocol revision’s frozen baseline. This request changes review documentation only, not the manuscript or PDF.

## Changes visible in the current paper

| Location | Cumulative change |
|---|---|
| Title and authors | Switch from the five named authors to the template’s anonymous author block; retain submission ID 2613. Remove named-author spacing and the custom ID hook. |
| Abstract | Restore the earlier author-approved abstract word for word, including N = 24, after the temporary N=12 rewrite. |
| Draft notice and §5.1 sample | Identify N=24 as planned in a working-draft notice and the procedure. Remove experimental demographics pending the final update. Calculations and available source records are not inflated. |
| §3 Survey | Add the digital timed square tangram linked through Google Form, college mailing-group recruitment and overlap with some experimental participants. Remove the resolved survey-method reminder. |
| §3 Materials | Add the 10×10-inch square size of the seven colored pieces. |
| §4.1 Assistance | State preset hints, hint-only versus robot-plus-hint selection, and a parallel hint with every robot action. Condense prose and focus the setup reminder on photo, robot and material details. |
| §4.2 Physiology | Add the provisional three-minute pre-task baseline window and a short procedure-confirmation note. Preserve the existing heart-rate arousal algorithm. |
| §4.3 Adaptive protocol | Repeated flags prompt another intervention; rapid or sustained flags incur a 15-second wait. Preserve scheduled help every 30 seconds. |
| §5.1 Procedure | Add volunteer recruitment through college groups, coupon compensation, five-minute breaks, target resemblance using all seven pieces as success and a five-minute stop otherwise. Keep eligibility/practice and final-demographics reminders. |
| §5.2 Scoring | Add the rule selecting the orientation with more correct pieces when two partial-solution orientations are possible. Scores, tolerance and scorers remain pending. |
| §5.2 Objective graph | Remove the former Figure 4 performance plot and its cross-reference; keep Table 1 and all objective findings. |
| §5.3 Workload | Retain the workload/frustration plot, now Figure 4. Remove the within-condition correlation paragraph and the three heatmaps. |
| §5.4 Correlations | Add Figure 5: scheduled versus adaptive participant averages for the same measure, across eight scatterplots. Add the corresponding Spearman coefficients and concise interpretation. |
| §5.4 Assistance experience | Replace the former Figure 7 with Figure 6: adaptive-minus-scheduled participant differences, means and unadjusted 95% bootstrap intervals. |
| §7 Ethics | Summarize consent in the form and before participation, instruction acknowledgement, voluntary stopping, and camera recording/live viewing of table and hands only. Add the author’s confirmation that concealed operation was not disclosed during or after the task. Approval/exemption remains unconfirmed. No form questions reproduced. |
| Readable manuscript | Mirror all source edits, new figure references and numbering. |

The paper now contains six figures and three tables. Its section order, primary numerical findings, existing paired tests, bibliography, discussion and conclusion remain unchanged across these three rounds, apart from the new cross-condition correlation paragraph. The restored abstract retains the author’s earlier wording. The draft notice identifies the pending final analysis.

## Supporting changes included

- README, BUILD, author-notes, evidence-map, structure-review and supplementary analysis notes reflect the clarified methods, anonymous format, planned sample and new figures.
- A PDF-based baseline guidance check is documented in method-checks/baseline-recording.md. The three-minute account is provisional; the collector currently computes a 60-second reference. This source is an internal check, not an added manuscript citation.
- The reference map has current source locations and hashes; all 15 cited PDF hashes and 35 supporting text anchors were checked. There are still 21 citation occurrences.
- New plots and assisted-comparison.json record scheduled/adaptive correlations and existing difference estimates. Retired figure files are preserved in before/figures/.
- plot-assisted-comparison.py generates the new plots; the full analysis script invokes it. The review tool accepts separate revision packages and records all changed helper files.
- The current PDF is rebuilt and all eight pages checked. Each earlier manuscript/PDF is preserved in its own baseline.

## Individual rounds

1. [Protocol and anonymity changes](../2026-10-07-protocol/CHANGELOG.md).
2. [Previous abstract and planned N=24 restoration](../2026-10-07-working-sample/CHANGELOG.md).
3. [Latest figure comparison changes](../2026-10-07-figures/CHANGELOG.md).

The individual reviews show changes within each round. This cumulative highlighted review shows their combined effect against the earlier manuscript; additions later removed do not appear as surviving changes. Exact TeX/Markdown diffs and all supporting textual diffs are included. Earlier reviews are untouched. The paper remains local and has not been pushed.
