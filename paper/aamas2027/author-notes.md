# Author checks and decisions

Updated 7 October 2026. Internal material, excluded from the paper. The earlier version is frozen in the revision baseline.

## Confirmed scope and metadata

Use the 5 October approved outline. Title, author order and submission ID 2613 remain as supplied from OpenReview. Affiliations and emails have not been inferred. The current source and PDF use the template’s anonymous mode and retain submission ID 2613. The previous named source is preserved in the revision archive. The historical submitted abstract is unchanged.

Scheduled assistance is offered every 30 seconds; adaptive assistance is offered when the existing heart-rate-rise arousal flag is raised. The author confirmed this policy and the physical layout: opaque partition, camera mounted on it covering the table, fixed labeled pickup positions, participant laptop for forms, assembly area in front of/left of the participant and drop spot to their right. These details are now in §4 with both current diagrams.

The planned experimental sample is 24. The new export supports 12 complete participants / 108 rounds. At the author’s request, the exact earlier abstract is restored, using N=24. The procedure describes 24 as planned and the document has a visible working-draft notice. Numerical results, tests and graphs remain based on the existing 12 complete participants; no unobserved outcomes were manufactured. Experimental demographics are removed pending the final sample. The survey has 24 responses and is written as the supplied survey result, without interim wording. The author confirmed both input archives identified in README.

## What is filled

§3 now reports survey demographics, familiarity, completion, self-reported solving time, stuckness and independently rated assistance expectations. The robot-versus-digital comparison item is omitted because its scale endpoints were not supplied. The assistance checkbox is not treated as exclusive: some respondents selected “no assistance” together with assistance options. No causal or prospective design claim is made from the survey.

§4 now contains the submitted architecture and current setup schematic, operator roles, pickup/drop/assembly arrangement, and concise 15-second/60-second/5-bpm processing. The author confirmed use of this arousal method throughout, repeated assistance and a 15-second wait for rapid/sustained flags. The three-minute baseline window is provisional pending an actual-procedure check. The detector identifies an HR-rise cue, not a validated psychological stress label.

§5 now has new participant demographics, all updated tables/ratings, paired-condition workload graphs, scheduled/adaptive Spearman scatterplots and exploratory paired sign-flip tests with specified Holm families. Higher adaptive ratings do not establish a statistically significant adaptive-scheduled difference. Six participants left comments; the paper quotes three excerpts from two people and paraphrases the two “fun” responses. No formal coding or claimed qualitative themes were invented.

§6 and the conclusion match the numerical findings, include a verbatim robot-motion comment, and retain direct placement as future work. The AI disclosure remains brief. Literature claims and references are unchanged; the source map has refreshed locations/hashes and verified anchors.

## Confirmed protocol and remaining factual checks

- Survey: an online square tangram with a timer, linked through a Google Form, circulated in college mailing groups. Some respondents also joined the robot experiment. Do not call the samples independent. Exact overlap counts, survey dates, task link and timing instructions remain unprovided.
- Recruitment/procedure: volunteer forms shared through college groups, coupon compensation, five-minute breaks after each sitting, success when all seven pieces form an arrangement resembling the target, otherwise stopping at five minutes. Eligibility, compensation value, practice and total visit duration still need confirmation.
- Physiology: wrist sensor worn as advised; the author temporarily specifies a three-minute pre-task baseline after study information. The author confirmed the same arousal method throughout. The current collector sets BASELINE_DURATION=60.0 and computes its baseline HR from that duration. A three-minute preparation/recording window does not prove a three-minute software analysis window. Confirm what was actually recorded, which interval supplied the baseline, settling posture and wrist placement. No claim of a validated HRV/resting-stress baseline is made. See method-checks/baseline-recording.md for PDF-based guidance.
- Adaptive timing: another intervention follows a repeated flag; when flags recur rapidly or remain raised, wait 15 seconds before the next intervention. The definition of rapid recurrence and signal-loss behavior remain unprovided. Do not invent automatic gating or change the implementation to make it match the described manual protocol.
- Assistance: preset hints standardize content; researchers choose hint-only versus robot-plus-hint; every robot action is accompanied by a hint. No robot-only delivered condition is described. The physical piece set forms a 10×10-inch square, with the existing colors. Robot model/end effector, piece material/thickness and actual action durations remain missing.
- Consent: author-confirmed consent in volunteer form and before experiment. The supplied screenshot contains participation and workspace-video consent; no face recording. The app requires consent and instruction acknowledgement, and its instructions describe voluntary participation and stopping without penalty. The paper summarizes these facts without listing questionnaire questions.
- Concealed operation: the author states human operation was not disclosed during or after the experiment, to avoid advance knowledge among later participants. However, src/surveys.js:13 and docs/participant-script.md:13 mention researcher-controlled numbered programs. public/subject.js renders supplied instructions, and create-app.js allows custom/persisted script text. Confirm the exact enacted version; do not infer what participants understood from current source text alone. No institutional approval/exemption or approved nondisclosure arrangement has been established by the form screenshot.
- Ethics/safety/data: approval or exemption and identifier, camera/physiology retention/access, robot safety practice, and optional LLM-advisor use remain to be supplied. Consent is not treated as proof of institutional review. The author confirmed no disclosure afterward; do not invent a debriefing or claim compliance with an unverified approval.

## Survey reporting decisions

Completion and time remain self-reported categories in the supplied CSV, even though the linked game included a timer. The timer's value is not automatically logged in these response rows. Expected-helpfulness options are independent ratings, not forced rankings; lower 1–5 scores mean greater helpfulness. The robot-versus-digital comparison item is still omitted because its endpoints are unconfirmed. The checkbox items are not treated as exclusive.

## Results audit and pending adjudication

The primary cohort is P101, P103–P110, P115, P116 and P118. P111 has five finished rounds; R6 is unfinished and later rounds unstarted. P119 is setup-only. P118 reuses an older setup session ID; count its final metadata and October rounds once. P108–P110 retain provisional-source status. These checks belong here, rather than in the paper's voice.

P101 completion labels are reconstructed in the supplied coding: two scheduled successes; adaptive R9 remains ambiguous and is coded unsolved. Primary counts are 5/36, 24/36 and 18/36 (control, scheduled, adaptive). Recorded-only counts excluding P101 are 5/33, 22/33 and 18/33. Counting R9 solved gives 19/36 adaptive. Resolve these labels against original evidence before the final analysis. The paper does not narrate this audit; the exact sensitivity is in supplementary analysis notes.

Round duration includes failures and some records exceed the intended 300 seconds. Do not truncate without an agreed rule. Commands do not prove movement execution. Final trust/reliance are once per participant and cannot be separated by condition. Frustration is part of the workload composite. The replacement correlations compare scheduled and adaptive scores for the same measure, not relationships between different measures. Tests were chosen during revision, not preregistered, and use sign-flip symmetry assumptions; review a final model with the team. Preserve allocation/exposure audits internally as requested.

## Correct-piece scoring

The author specifies selecting the orientation with more correctly placed pieces when a partial solution admits two possible orientations. This rule is now stated in §5.2; no scores have been calculated. Photographs, placement tolerance, treatment of symmetries/reflections and occlusion/missing images still need definition. Record annotators and review/adjudication. Do not infer 0–7 correct-piece counts from binary completion alone. Add the outcome and graph to §5.2 after scoring; revisit §6's partial-progress paragraph.

## Writing and submission constraints

Keep audit provenance out of the research-author prose. Do not add interim dates, intervention totals, or removed allocation/frequency caveats to the limitations. Keep brief uppercase notes without em dashes; remove them when resolved. More references are still needed, and every addition must be checked against its downloaded PDF. No additional sources were added in this revision.

The current paper is anonymous, using the original template behavior and submission ID 2613. Author identities remain in internal notes/baselines only. Exclude those internal materials from an anonymous submission. Complete remaining ethics/protocol facts, CCS concepts, bibliography fields and final build checks. Retain the full AI-use record in the existing supplementary statement and conversation. Human authors remain responsible for scientific claims and disclosure compliance.

## Figure comparison decisions

The former performance plot and within-condition heatmaps are removed; their data remain archived. Six figures remain. Matched cross-condition Spearman correlations use participant averages and average tied ranks; they do not estimate condition effects. Assistance differences use exact adaptive-minus-scheduled participant values and existing mean/bootstrap intervals. These intervals are unadjusted, unlike the Holm-adjusted p-values; do not use them to claim a corrected significant assisted-policy difference. Existing primary results and working abstract are unchanged.
