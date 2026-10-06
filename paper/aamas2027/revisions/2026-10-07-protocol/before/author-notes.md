# Author checks and decisions

Updated 7 October 2026. Internal material, excluded from the paper. The earlier version is frozen in the revision baseline.

## Confirmed scope and metadata

Use the 5 October approved outline. Title, author order and submission ID 2613 remain as supplied from OpenReview. Affiliations and emails have not been inferred. Restore anonymous mode for review if required. The historical submitted abstract is unchanged.

Scheduled assistance is offered every 30 seconds; adaptive assistance is offered when the existing heart-rate-rise arousal flag is raised. The author confirmed this policy and the physical layout: opaque partition, camera mounted on it covering the table, fixed labeled pickup positions, participant laptop for forms, assembly area in front of/left of the participant and drop spot to their right. These details are now in §4 with both current diagrams.

The planned experimental sample is 24. The new export supports 12 complete participants / 108 rounds. The working abstract and methods now consistently report N=12; no unobserved outcomes were manufactured. The survey has 24 responses and is written as the supplied survey result, without interim wording. The files used are the local candidates described in README; source confirmation is still pending.

## What is filled

§3 now reports survey demographics, familiarity, completion, self-reported solving time, stuckness and independently rated assistance expectations. The robot-versus-digital comparison item is omitted because its scale endpoints were not supplied. The assistance checkbox is not treated as exclusive: some respondents selected “no assistance” together with assistance options. No causal or prospective design claim is made from the survey.

§4 now contains the submitted architecture and current setup schematic, operator roles, pickup/drop/assembly arrangement, and concise 15-second/60-second/5-bpm processing. Exact deployed overrides, baseline practice and repeated-flag rules remain internal checks. The detector identifies an HR-rise cue, not a validated psychological stress label.

§5 now has new participant demographics, all updated tables/ratings, paired-condition graphs, Spearman heatmaps and exploratory paired sign-flip tests with specified Holm families. Higher adaptive ratings do not establish a statistically significant adaptive-scheduled difference. Six participants left comments; the paper quotes three excerpts from two people and paraphrases the two “fun” responses. No formal coding or claimed qualitative themes were invented.

§6 and the conclusion match the numerical findings, include a verbatim robot-motion comment, and retain direct placement as future work. The AI disclosure remains brief. Literature claims and references are unchanged; the source map has refreshed locations/hashes and verified anchors.

## Method details the team still needs to supply

1. **Deployed settings:** record the commit/configuration for each session, threshold/window overrides, watch placement, baseline procedure, and signal-failure handling. The scheduled interval and flag-triggered adaptive policy are now author-confirmed. The inspected detector uses 15/60-second windows and a 5-bpm rise; exact historical overrides remain an internal check. Four bundled study-definition files match this checkout without proving every historical setting.
2. **Operator delivery:** document first scheduled intervention, handling of a sustained/repeated flag, any refractory interval, signal failures, participant requests, preset versus free-text hints, text/movement pairing, training, operator count and deviations. The confirmed policy fixes when help is offered; remaining checks concern operational details and assistance content.
3. **Apparatus and physical behavior:** exact Orangewood model/end effector; piece dimensions/material; pickup/delivery positions; whether the arm also orients or places pieces; action duration; participant/operator visibility; actual sensor and camera use; consent-cleared setup photo. The code establishes program cues, not the arm's executed trajectory.
4. **Recruitment and participants:** eligibility, recruitment, compensation, demographics, prior experience, target-sample rationale, exclusions and missing participants. The analyzed complete records are P101, P103–P110, P115, P116 and P118. Resolve missing IDs/exclusions from source records rather than guessing. Realized allocation counts are in the summary; six available orders do not imply equal realized groups.
5. **Procedure and outcome rules:** familiarization/practice, calibration, break lengths, total visit duration, interpretation of the three blocks/sittings, five-minute limit enforcement, late-success handling, success tolerance and early-stop paths. Exported durations exceed 300 seconds for some rounds; do not truncate or recode these without a documented decision.
6. **Ethics and data:** actual approval/exemption and identifier, consent coverage, withdrawal/debriefing, disclosure of human control, camera/physiology retention and access, robot safety procedures, external data transfers and whether the optional LLM advisor was enabled. The current ethics section describes supported interface/data facts; it cannot substitute for actual institutional and procedural details.


## Survey facts still needed

The author confirmed a linked square tangram task. Confirm its material/interface, recruitment, eligibility, response procedure, chronology, and overlap with experiment participants. The CSV headers provide the questionnaire text, but not a screenshot or complete external task instructions. Do not call the survey an independent cohort, a digital task, or a prospective pre-study without confirmation. Completion and time are self-reported categories. Expected-helpfulness scores are independent ratings, not forced rankings; 1 means most helpful and 5 least helpful.

## Results audit and pending adjudication

The primary cohort is P101, P103–P110, P115, P116 and P118. P111 has five finished rounds; R6 is unfinished and later rounds unstarted. P119 is setup-only. P118 reuses an older setup session ID; count its final metadata and October rounds once. P108–P110 retain provisional-source status. These checks belong here, rather than in the paper's voice.

P101 completion labels are reconstructed in the supplied coding: two scheduled successes; adaptive R9 remains ambiguous and is coded unsolved. Primary counts are 5/36, 24/36 and 18/36 (control, scheduled, adaptive). Recorded-only counts excluding P101 are 5/33, 22/33 and 18/33. Counting R9 solved gives 19/36 adaptive. Resolve these labels against original evidence before the final analysis. The paper does not narrate this audit; the exact sensitivity is in supplementary analysis notes.

Round duration includes failures and some records exceed the intended 300 seconds. Do not truncate without an agreed rule. Commands do not prove movement execution. Final trust/reliance are once per participant and cannot be separated by condition. Frustration is part of the workload composite, so workload-frustration correlations share measurement content. Tests were chosen during revision, not preregistered, and use sign-flip symmetry assumptions; review a final model with the team. Preserve allocation/exposure audits internally as requested.

## Correct-piece scoring

Photographs and a scoring rule are still needed. Define valid alternative arrangements, symmetries, placement tolerance, occlusion and missing/unscorable images. Record annotators and review/adjudication. Do not infer 0–7 correct-piece counts from binary completion alone. Add the outcome and graph to §5.2 after scoring; revisit §6's partial-progress paragraph.

## Writing and submission constraints

Keep audit provenance out of the research-author prose. Do not add interim dates, intervention totals, or removed allocation/frequency caveats to the limitations. Keep brief uppercase notes without em dashes; remove them when resolved. More references are still needed, and every addition must be checked against its downloaded PDF. No additional sources were added in this revision.

The current paper is a named working draft. Complete author affiliations, ethics/recruitment/operator facts, CCS concepts, bibliography fields and the final submission build checks. Retain the full AI-use record in the existing supplementary statement and conversation. Human authors remain responsible for scientific claims and disclosure compliance.
