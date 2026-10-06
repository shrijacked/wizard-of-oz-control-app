# Protocol and anonymity revision

7 October 2026. Compared with the complete local survey/results draft frozen in before/. This is a second revision package; revisions/2026-10-07/ remains unchanged. All changes are local; the architecture TeX was previously pushed as 3c4ddb9.

## Manuscript changes

| Location | Change |
|---|---|
| Template and author block | Use sigconf,anonymous and Anonymous Author(s); remove all five named blocks, custom author spacing and the named submission-ID hook. Retain the original template’s submission ID 2613. |
| §3 Task profiling | State digital square tangram with timer, linked through Google Form, recruitment through college mailing groups and overlap with some robot-study participants. Remove the now-resolved method reminder. |
| §3 Task materials | State that the seven colored pieces form a 10×10-inch square. |
| §4.1 Setup and assistance | Describe preset hints and researcher selection of hint-only or robot-plus-hint assistance. State that every robot action is accompanied by a hint. Shorten prose and focus the reminder on setup photo, robot and material details. |
| §4.2 Physiology | Add the author’s temporary three-minute pre-task baseline window after study information. Retain the existing 15-second/60-second/5-bpm arousal rule and add CONFIRM ACTUAL BASELINE PROCEDURE. Condense prose. |
| §4.3 Conditions | Both assisted conditions use a preset hint alone or a robot action with a hint. Repeated adaptive flags prompt assistance; rapid or sustained flags incur a 15-second wait. Retain 30-second scheduled timing. |
| §5.1 Participants and procedure | Add volunteering through college groups, coupon compensation, five-minute breaks, target resemblance using all seven pieces as success and a five-minute stop otherwise. Narrow the reminder to eligibility and practice. |
| §5.2 Measures | Describe choosing the orientation with more correct pieces when two partial-solution orientations are possible. Keep the pending correct-piece score reminder and request tolerance/scorers. No scores invented. |
| §7 Ethics | Summarize consent in the volunteer form and before the experiment, software consent/instruction acknowledgement, voluntary stopping and camera recording/live viewing of table and hands only. State the author’s confirmation that concealed operation was not disclosed during or after the task. Keep institutional approval/exemption pending. Do not list form questions. |
| Readable manuscript | Synchronize manuscript.md with the revised TeX, including anonymous header and all the above wording. |

The abstract, participant count, results, statistical comparisons, plots, tables, discussion, conclusion, AI disclosure and bibliography are unchanged. The existing main section order and seven figures/three tables are retained. Protocol additions move the references within the layout; the final PDF is rebuilt and checked.

## Supporting files and review tools

- README, BUILD, author-notes, evidence-map, structure-review and supplementary/analysis-notes now identify the anonymous protocol draft and confirmed methods. Exact changes are retained in file-diffs/.
- The reference map’s manuscript locations and hashes are refreshed. All 15 existing source PDFs and 35 page/text anchors are rechecked; 21 citation occurrences remain. Literature claims and bibliography entries are unchanged.
- method-checks/baseline-recording.md documents a separate PDF-based baseline guidance check. Laborde et al. (2017), PDF pages 8–9, is an internal method-check source, not an added manuscript citation. The current collector computes a 60-second baseline; the author’s three-minute pre-task window is provisional.
- scripts/review-paper-revision.py gains a revision argument and compares existing scripts with before-tools/. It creates exact TeX/Markdown diffs, full word-highlighted prose and a hash inventory for this revision, without rewriting earlier review packages. The analysis script is unchanged.
- The consent screenshot is copied into the ignored input cache; its path/hash are recorded in input-evidence.json. No raw participant inputs are added to the public manuscript package.
- output/pdf/aamas2027-current.pdf is rebuilt from the revised source. The former PDF remains in before/.

## Still unresolved

The delivered participant instruction version is not established. Current src/surveys.js:13 mentions fixed researcher programs; docs/participant-script.md:13 mentions researcher control. Custom/persisted instructions are possible. The author confirms that concealed operation was not disclosed; current source wording alone cannot establish which instructions were used.

Institutional ethics approval or exemption is unconfirmed. No debriefing, review identifier or approval claim is invented. The source consent form is evidence of consent, not institutional review.

Confirm actual baseline recording and settling procedure, sensor placement, signal-loss handling, eligibility/practice, robot model/material and safety/data details. Obtain photographs and correct-piece scores using agreed placement tolerance and scorers. Exact survey overlap, link and chronology remain open. Existing over-300-second duration records and provisional outcome coding are preserved for later adjudication.

## Review and verification

- before/ plus baseline-manifest.json: immutable pre-change paper and PDF, 48 hashes.
- before-tools/: pre-change helper scripts.
- highlighted-review.html: complete readable manuscript with green additions and red struck-through deletions.
- main.tex.diff and manuscript.md.diff: exact source changes.
- change-inventory.json and file-diffs/: every changed paper/helper/output file, hashes and textual diffs.
- input-evidence.json and baseline-check.json: supporting evidence paths and hashes.
- validation.json: final compilation, baseline integrity, citation, anonymity and visual checks.
