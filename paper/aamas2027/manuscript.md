# When to Help: Scheduled and Physiology-Informed Assistance in Physical Tangram Solving

## Abstract

Assistive robots must decide when to intervene as well as what help to provide. We examine scheduled and physiology-informed assistance in physical tangram solving, where support can address both spatial reasoning and manipulation. A within-participant study compares no assistance, scheduled assistance, and researcher-mediated adaptive assistance informed by heart-rate cues and observed task progress. Each participant attempts nine puzzles, with three puzzles per condition, through a Wizard-of-Oz system that coordinates text hints, robotic-arm cues, physiological information, and questionnaires. The available analysis includes nine complete participants and a separate partial session from a tenth participant; recruitment toward a target of 24 is ongoing. In the complete-participant sample, observed completion was 14.8% without assistance, 70.4% with scheduled assistance, and 48.1% with adaptive assistance. Scheduled assistance also had the shortest mean round duration. Adaptive assistance received higher mean helpfulness and timing ratings and lower frustration ratings than scheduled assistance. These descriptive differences coexist with unequal puzzle allocation, different assistance amounts, and uncertainty in one participant's completion coding. The findings motivate evaluating assistance strategies through both task outcomes and participant experience, while distinguishing physiological decision support from autonomous inference of assistance need.

## 1. Introduction

A person solving a physical puzzle may pause to mentally rotate a piece, reconsider an arrangement, or decide what to try next. These moments can look similar to an observer but call for different responses. A hint may help someone resume work; the same hint during a productive pause may interrupt a solution they were about to reach. For an assistive robot, deciding when to act is therefore part of deciding how to help.

Recent human-robot collaboration research makes assistance contingent on the person's activity. Andriella et al. model assistance type, timing, and confidence [1], while PACE uses action-completion estimates to coordinate proactive assistance [4]. A recent review distinguishes adaptation of robot motion from task-level decisions about timing, sequencing, and role allocation [7]. These approaches raise an evaluation question: does a strategy that supports task execution also provide help that people experience as appropriate?

Physiological signals offer another input to this decision. Yang et al. compared workload-adaptive robotic suction with periodic support during surgical training [15]. Their work establishes a direct precedent for comparing physiological and time-based assistance. We extend this comparison to physical spatial problem solving, where a hint can change a person's understanding of an arrangement and robotic assistance can change the availability of a piece. Our focus is the relationship between task performance and the experience of receiving these interventions.

We use seven-piece tangram puzzles to study this relationship. Recent work uses tangrams for collaborative HRI and as a simplified assembly task [12, 9]. They allow repeated attempts with common materials, observable completion outcomes, and both informational and physical assistance. A pause remains ambiguous, however: it can reflect productive reasoning as well as difficulty. We therefore distinguish the physiological cue from the decision to intervene. A researcher interprets heart-rate information alongside the participant's progress and retains control over assistance.

The study compares no assistance, scheduled assistance, and physiology-informed adaptive assistance within participants. Each participant encounters all three conditions, with three different puzzles per condition. The comparison includes an unassisted baseline because receiving help and selecting when to provide it are separate questions. It also pairs objective outcomes with participant ratings because completing a puzzle does not establish that the assistance felt useful or appropriately timed.

We address two research questions. **RQ1:** How do the three assistance conditions differ in puzzle completion and round duration? **RQ2:** How do they differ in perceived workload and frustration, and how do the assisted conditions compare in helpfulness and intervention timing? The questions concern performance and experience during the task; no retention or transfer test is included.

Our contributions are:

1. A comparison of unassisted, scheduled, and physiology-informed assistance in physical spatial problem solving.
2. A Wizard-of-Oz platform coordinating text hints, fixed robot-action cues, physiological decision support, and linked study records.
3. A joint assessment of task outcomes, workload, and assistance experience that distinguishes repeated per-puzzle responses from overall impressions of the system.

## 2. Related Work

### 2.1. Assistance timing and proactive coordination

Karbouj et al.'s review of adaptive industrial HRC distinguishes motion, task, and control adaptations and identifies task-level timing and coordination as areas warranting further attention [7]. This distinction places assistance timing within a broader design space: a robot may change how it moves, which task it performs, or when it contributes. The review provides context for that distinction, rather than establishing an absence of prior work on our specific comparison.

Andriella et al. learn proactive assistance from user profiles and task state in a sequential memory game, jointly addressing assistance type, timing, and confidence [1]. PACE estimates action completion from hand movements and uses a learned policy to coordinate assistance during collaborative assembly [4]. Both connect robot behavior to unfolding human activity. Our comparison concerns fixed scheduling and researcher-mediated use of physiological cues in a physical reasoning task. It evaluates the strategies as enacted, including their content and frequency, rather than assuming timing is their only difference.

### 2.2. Physiological information in assistance

Yang et al.'s surgical system uses EEG and eye tracking to inform adaptive suction, with a periodic comparator selected to approximate earlier observed assistance frequency [15]. Although published in a 2024 journal issue, that work first appeared online in 2022 and remains the closest direct precedent for our comparison. Earlier work by Teo et al. uses individualized physiological workload markers to trigger aid during robot supervision, imposing aid later when it has not been triggered [13]. These studies motivate state-responsive support, but their sensors, task demands, and assistance mechanisms differ from wrist-derived heart-rate cues interpreted by a researcher.

Recent studies also show why physiological measurement should be distinguished from physiological control. Hostettler et al. adapt robot behavior to user distance while measuring pupil responses; direct pupil-driven adaptation is a future direction [6]. Ojsteršek et al. personalize robot parameters using a preliminary skills test and analyze ECG recordings after the experiment [10]. Korivand et al. develop physiological task-load prediction and Q-learning-based adjustment, while explicitly reporting that their recorded wristband data could not be integrated directly for real-time use [8]. These are relevant adaptation approaches, but they are not interchangeable demonstrations of online physiological triggering.

Pereira et al.'s review documents heterogeneous workload measures and mixed cardiac findings across HRC studies [11]. Capponi et al. similarly find no clear RMSSD pattern across their assembly configurations and distinguish cognitive effort from stress [3]. These findings support caution in interpreting cardiac activity. We use heart-rate rise as a possible-arousal cue, not a validated classification of stress, frustration, or need for help; none of these sources validates our particular threshold.

### 2.3. Physical tasks and participant experience

Tabatabaei et al. study gaze around robot failures during collaborative tangram solving [12]. SensCogAR uses tangrams as a proxy for small-object assembly, manipulating the visibility of piece contours to vary task demand [9]. These precedents support the task's combination of spatial interpretation and manipulation, while leaving transfer to more complex workplaces an empirical question. Adjacent assembly work by Caiazzo et al. compares manual, collaborative, and guided collaborative conditions, with EEG used for workload assessment [2]. Its three-participant study illustrates the combination of guidance and physical collaboration; it does not establish a physiological assistance-timing policy.

Workload and task performance can diverge. Hart's account of NASA-TLX describes its six dimensions, discusses unweighted scoring, and cautions that modified instruments require their own validation [5]. We accordingly report our seven-point items as an adaptation and retain the individual dimensions alongside a composite. Helpfulness and timing ratings address the intervention experience itself, while the single final trust item characterizes the combined study experience rather than a condition-specific difference.

### 2.4. Wizard-of-Oz evaluation

Wizard-of-Oz methods allow an interaction to be evaluated before all decisions are automated. A recent HRI workshop proposal by Thunberg et al. emphasizes the practical, ethical, and methodological tensions of the wizard's role [14]. That agenda motivates attention to the human work behind the interaction; it is not evidence validating a particular operator protocol. Here, a researcher observes the workspace and physiological feedback, selects hints, and issues robot cues; a robot operator executes the corresponding fixed program. We make these roles explicit because the study evaluates assistance delivered through this arrangement, not the accuracy of an autonomous need detector.

## 3. Task and Design Rationale

Each tangram requires all seven pieces to reproduce a target shape: two large triangles, one medium triangle, two small triangles, a square, and a parallelogram. Piece colors provide consistent references for hints and robot cues. Nine targets are used, each with a solution available to the researcher.

The task supports the comparison in three ways. First, it combines a reasoning problem with physical actions, allowing help to address either interpretation or piece handling. Second, different targets use the same materials and instructions. Third, the final arrangement provides an observable completion outcome. These properties make repeated comparisons practical without requiring a specialized work environment.

The task does not enforce a single assembly sequence. Participants may rotate pieces, revisit earlier placements, and work on different regions of the target. The researcher must interpret pauses in relation to the arrangement rather than treating inactivity alone as failure. Accordingly, the system separates information available to the researcher from information delivered to the participant and links each intervention to its condition, puzzle, and questionnaire.

## 4. System and Assistance Design

### 4.1. Architecture and apparatus

A local server coordinates three browser interfaces. The researcher dashboard shows the puzzle solution, workspace camera view, timing controls, physiological information, and assistance controls. The participant display provides instructions, the timer, text hints, breaks, and questionnaires. A robot-operator display identifies the fixed program associated with a selected piece. WebSocket updates maintain a shared study state, and the server links outcomes, interventions, and questionnaires within participant records (Figure 1).

![Architecture of the Wizard-of-Oz study system](architecture.png)

*Figure 1. The researcher selects assistance; the robot operator runs a fixed action. The server coordinates displays and records events.*

The setup combines an Orangewood robotic arm, a Maxim H Band wrist sensor, and a Logitech C270 workspace camera. The camera supports researcher observation rather than automated progress estimation. Text hints describe piece location, orientation, or adjacency and are accompanied by an audible notification. Physical assistance is requested through one of seven piece-specific program cues. The operator runs the corresponding program to bring the selected piece; the participant assembles the target. Unused pieces are returned to marked pickup positions. A logged robot cue records a command, not independently verified movement completion.

### 4.2. Physiological capture and interpretation

A Python collector receives wrist-sensor measurements over Bluetooth Low Energy and exposes physiological information and signal-quality indicators to the researcher. The implemented arousal cue compares median heart rate in a recent window with a preceding reference window. The inspected implementation defaults to a 15-second current window, a preceding 60-second reference, and a 5-beats-per-minute rise threshold. These are implementation defaults, rather than verified settings for every recorded session.

The implementation filters out-of-range values and poor-contact samples and supports a calibrated baseline when the preceding reference has insufficient data. Heart-rate variability is displayed separately from the heart-rate-rise cue. Signal checks help identify unreliable input; they do not validate an inference about a participant's psychological state. The researcher retains responsibility for interpreting the cue together with observed task progress.

### 4.3. Assistance conditions

**No assistance.** Participants solve the puzzle without task hints or robot movements. The application disables assistance controls while retaining timing, outcome recording, and the workload questionnaire.

**Scheduled assistance.** The researcher receives recurring time-based reminders and delivers text hints and/or robot cues. The inspected interface defaults to a 30-second reminder interval. A reminder does not itself deliver assistance, so actual intervention times depend on researcher action. We call this condition scheduled assistance; the software stores it as `constant`.

**Physiology-informed adaptive assistance.** The researcher considers physiological cues alongside the current arrangement and observed progress to decide whether and how to help. A cue does not mandate an intervention, and its absence does not prevent one. The researcher chooses the hint and/or robot cue. This condition therefore combines physiological decision support with human judgment.

## 5. Study Design and Findings

### 5.1. Participants, procedure, and analysis

The study uses a within-participant design with a target sample of 24; collection is ongoing. The records available on 5 October 2026 contain nine complete participants, each with nine finished rounds, and a tenth participant with five finished rounds. The balanced comparison uses the nine complete participants: 27 rounds per condition and 81 rounds overall. The partial session is examined separately. Three complete-session exports are provisional downloads awaiting definitive replacements.

Each participant attempts three consecutive blocks of three different puzzles, with one condition per block. The software cycles through the six condition-order permutations and permits manual overrides. All six orders occur in the complete-participant sample, with unequal counts. A participant-specific shuffle assigns puzzles to blocks. The realized puzzle mix is also unequal: puzzles 2 and 3 do not occur in adaptive rounds in this sample. The design provides repeated observations within people but does not establish equal difficulty across conditions.

The participant interface collects instruction acknowledgement, consent, demographic information, and an initial expectation rating. The researcher starts each round, can pause and resume the timer, and records whether the puzzle was solved. The intended puzzle limit is five minutes. Participants answer a questionnaire after each puzzle; breaks separate blocks, and an overall questionnaire follows the ninth puzzle. Recorded round duration subtracts pauses in the ordinary completion path. Some exports exceed 300 seconds, including recorded successes; those outcomes and durations are retained rather than retrospectively imposing an unverified cutoff.

Six seven-point workload items assess mental, physical, and temporal demand, perceived performance, effort, and frustration. Performance runs from failure to perfect performance; higher values on the other five items indicate greater burden. We report the dimensions individually and an adapted unweighted composite. For the composite, performance is reversed as 8 minus the response, and all six items are averaged. This is a seven-point adaptation, not the original weighted NASA-TLX. Four further items assess helpfulness, timing, seamlessness, and frustration relief after assisted rounds only. The exact wording evaluates text hints and robot movements together.

For continuous measures and ratings, we first average the three rounds within each participant and condition, then summarize the nine participant means. Reported standard deviations describe variation between these participant means. Completion rates use coded outcomes among finished rounds. One participant has no recorded binary outcomes: working coding identifies two scheduled rounds as solved from converging questionnaire, timing, and hint evidence, while a final adaptive round remains ambiguous. We therefore report a recorded-outcomes-only sensitivity as well as the working comparison. No inferential tests are reported; these analyses describe the available sample and do not treat repeated rounds as independent participants.

### 5.2. Objective task performance

The working comparison contains 36 solved rounds out of 81. Completion was 4/27 without assistance, 19/27 with scheduled assistance, and 13/27 with adaptive assistance (Table 1). Scheduled assistance had both the highest observed completion rate and the shortest mean round duration. Duration includes unsuccessful attempts, so the averages describe time spent per round rather than successful time-to-solution.

| Condition | Solved / rounds | Solve rate | Round duration (s), mean (SD) |
| --- | --- | --- | --- |
| Control | 4/27 | 14.8% | 289.81 (26.64) |
| Scheduled | 19/27 | 70.4% | 234.11 (58.19) |
| Adaptive | 13/27 | 48.1% | 276.48 (28.37) |

*Table 1. Task outcomes for nine complete participants. Duration includes solved and unsolved rounds. Means and SDs summarize participant-condition means; working completion coding includes one participant with inferred outcomes.*

Excluding the participant whose outcomes were inferred leaves completion rates of 4/24 (16.7%), 17/24 (70.8%), and 13/24 (54.2%) for control, scheduled, and adaptive assistance, respectively. Coding the ambiguous adaptive round as solved instead changes the working adaptive estimate to 14/27 (51.9%). These checks preserve the ordering of the observed completion rates without resolving the missing outcome evidence.

The partial session adds three control rounds and two adaptive rounds, with one adaptive success. Including these observations yields 4/30, 19/27, and 14/29 solved rounds, respectively. Its remaining rounds are unfinished or unstarted and are not coded as failures. Because this supplement is unbalanced, it is kept separate from the complete-participant comparison.

Delivered assistance also differed. Scheduled rounds contained 270 text hints and 54 robot cues, averaging 10.00 hints and 2.00 cues per round; adaptive rounds contained 230 hints and 31 cues, averaging 8.52 and 1.15. Control rounds contained neither. The comparison therefore concerns strategies with different assistance amounts, as well as different timing rules.

### 5.3. Subjective workload

The adapted workload composite averaged 4.76 in control, 3.74 with scheduled assistance, and 3.85 with adaptive assistance on the seven-point scale (Table 2). Both assisted conditions had lower observed workload than control. The scheduled-adaptive difference in the composite was small, while the individual dimensions showed different patterns. Mental demand averaged 4.56 under scheduled assistance and 4.96 under adaptive assistance; frustration averaged 3.70 and 3.22, respectively. Perceived performance averaged 5.15 in both assisted conditions.

| Measure | Control | Scheduled | Adaptive |
| --- | --- | --- | --- |
| Mental demand | 5.81 (0.99) | 4.56 (0.93) | 4.96 (1.41) |
| Physical demand | 3.93 (1.41) | 3.37 (1.17) | 3.52 (1.53) |
| Temporal demand | 4.22 (1.01) | 3.52 (0.67) | 3.85 (1.12) |
| Perceived performance | 3.56 (1.38) | 5.15 (1.09) | 5.15 (1.36) |
| Effort | 5.48 (0.69) | 4.44 (0.73) | 4.67 (0.75) |
| Frustration | 4.67 (1.27) | 3.70 (0.90) | 3.22 (0.73) |
| Adapted workload composite | 4.76 (0.61) | 3.74 (0.62) | 3.85 (0.81) |

*Table 2. Seven-point workload ratings, mean (SD) across nine participant-condition means. Higher perceived performance is favorable; higher values on the other five items indicate greater burden. The composite reverses performance before averaging.*

The composite should therefore be read alongside its dimensions. Lower mental demand and lower frustration need not characterize the same strategy. The inferred binary completion outcomes do not affect these workload calculations, which use the participants' actual questionnaire responses. The descriptive differences do not establish statistical significance or equivalence between conditions.

### 5.4. Intervention experience

Adaptive assistance received higher mean ratings on all four assistance-specific items (Table 3). Mean helpfulness was 5.07 for adaptive assistance and 4.67 for scheduled assistance; timing ratings were 5.33 and 4.96. Adaptive assistance was also rated as more seamless and provided slightly higher reported frustration relief. All four scales run toward a more favorable experience at higher values, including the item about disruption, whose upper anchor is completely seamless.

| Measure | Scheduled | Adaptive |
| --- | --- | --- |
| Helpfulness | 4.67 (0.58) | 5.07 (0.83) |
| Timing | 4.96 (1.07) | 5.33 (0.94) |
| Seamlessness | 4.11 (1.54) | 4.48 (0.77) |
| Frustration relief | 4.78 (0.67) | 4.96 (1.33) |

*Table 3. Assistance-specific ratings, mean (SD) across nine participant-condition means. Higher is more favorable for every item. Control has no corresponding ratings.*

These ratings concern assisted rounds only: the items were not administered after control rounds. They characterize the combined experience of text hints and robot movements and cannot isolate the contribution of the arm. The higher adaptive ratings occurred alongside fewer logged interventions and a lower completion rate than scheduled assistance; the present data do not establish which aspect of either strategy produced those differences.

### 5.5. Overall experience

All nine complete participants provided the end-of-study questionnaire. Overall helpfulness averaged 5.11 (SD 1.05), overall efficacy 4.89 (SD 1.45), and trust 4.33 (SD 1.58), on seven-point scales. Agreement with following the robot's guidance even when uncertain averaged 5.11 (SD 0.78). This last item is a report of perceived reliance, not an observed behavioral measure of automation bias. Because these responses were collected once after all conditions, they cannot establish a scheduled-adaptive difference in trust. Five participants supplied nonempty written comments; no qualitative coding or thematic claims are included in this analysis.

## 6. Discussion, Limitations, and Future Work

### 6.1. Task progress and the experience of assistance

The observed condition rankings differed across outcomes. Scheduled assistance had the highest completion rate and shortest round duration, whereas adaptive assistance had more favorable ratings of helpfulness and timing and lower reported frustration. This pattern illustrates why task outcomes and intervention experience should be assessed together. A strategy may support more completed puzzles while another is experienced as better aligned with the participant's activity.

One possible interpretation is that recurring assistance provides more opportunities to advance the puzzle, while selective assistance better matches perceived moments of need. The current data do not test that mechanism. Scheduled rounds contained more hints and robot cues, and puzzle allocation differed by condition. Content, modality, frequency, timing, and puzzle difficulty may all contribute to the observed pattern. Consequently, the findings cannot be attributed to timing or physiological input alone.

### 6.2. Human judgment and physiological cues

The system separates a change in a sensor signal from a decision to intervene. This distinction matters in a reasoning task, where visible inactivity can be productive and heart-rate variation has multiple possible causes. The adaptive condition combines the researcher's view of the workspace with physiological information; it does not evaluate physiology in isolation. Likewise, an arousal flag is not a diagnosis of stress, and a favorable intervention rating does not validate the detector.

Future comparisons could distinguish observation-only assistance from assistance informed by both observation and physiology. Recording the operator's reason for each intervention would also help explain how cues were interpreted and when help was withheld. Such comparisons would address the contribution of physiological information more directly than the present strategy-level evaluation.

### 6.3. Scope and unresolved measurement limits

The complete-participant analysis is small, collection is ongoing, and three exports remain provisional. Binary outcomes are missing for one participant, the partial session lacks a balanced set of conditions, and upstream inclusion decisions require documentation for the final sample. The sensitivity analyses expose some of these dependencies but do not remove them. Unequal puzzle and condition-order distributions further limit causal interpretation; a final analysis needs to account for repeated observations and consider puzzle identity and block position.

Timing and physical-action records have additional limits. Exported durations can exceed the intended time limit, and robot cues do not establish movement onset, successful delivery, or the time taken by the arm. Binary completion also omits partial progress. A further analysis of correctly placed pieces is planned from final photographs, using an explicit scoring rule and a review of ambiguous or unscorable images. No piece-level results are claimed here.

The experience measures are adapted workload items and individual ratings rather than validated multi-item measures of every construct. Overall trust cannot be allocated retrospectively to individual conditions, and neither subjective reliance nor task success demonstrates learning. Finally, tangrams provide a controlled spatial task; transfer to industrial assembly, daily assistance, or users with different abilities requires additional evidence.

## 7. Ethical Considerations

The study involves physiological measurements, task records, and participant feedback. The participant interface records consent and instruction acknowledgement and supports researcher-controlled pauses; the instructions explain that participants may stop. Physiological feedback is presented as decision support rather than a clinical or psychological assessment. Human operators retain intervention selection and robot execution. Participant codes link the records, but raw exports can also contain identifying profile information, so coded filenames alone do not make the dataset anonymous. Any release of records or workspace images requires attention to consent coverage and removal of identifying information.

## 8. Conclusion

We examined unassisted, scheduled, and physiology-informed adaptive support for physical tangram solving through a Wizard-of-Oz system. In the nine complete participant records currently available, scheduled assistance had the highest observed completion and shortest mean round duration, while adaptive assistance received more favorable intervention ratings and lower frustration ratings. These descriptive findings remain contingent on the available sample, outcome coding, puzzle allocation, and assistance amounts. They motivate an evaluation of assistive strategies that connects task progress with how help is experienced, while making the human role in interpreting physiological cues explicit.

## AI Assistance Disclosure

Codex was used to organize literature notes, draft and revise manuscript text, and prepare code for checking descriptive summaries. The reported values were computed from recorded study exports; inferred completion outcomes are identified separately from recorded outcomes. This assistance does not establish the accuracy of unverified study procedures or replace responsibility for the manuscript's claims.

## References

[1] Antonio Andriella, Ilenia Cucciniello, Antonio Origlia, Silvia Rossi. 2025. [A Bayesian framework for learning proactive robot behaviour in assistive tasks](https://doi.org/10.1007/s11257-024-09421-1). *User Modeling and User-Adapted Interaction 35(1), 1*.

[2] Carlo Caiazzo, Marija Savkovic, Milos Pusica, Nastasija Nikolic, Ivan Macuzic, Marko Djapan. 2024. [Comparative Analysis Of Mental Workload In Adaptive Human-Robot Collaboration During Assembly Tasks](https://scidar.kg.ac.rs/handle/123456789/21811). *Advances in Reliability, Safety and Security, Part 5 (ESREL 2024)*.

[3] Matteo Capponi, Riccardo Gervasi, Luca Mastrogiacomo, Fiorenzo Franceschini. 2024. [Assembly complexity and physiological response in human-robot collaboration: Insights from a preliminary experimental analysis](https://doi.org/10.1016/j.rcim.2024.102789). *Robotics and Computer-Integrated Manufacturing 89, 102789*.

[4] Davide De Lazzari, Matteo Terreran, Giulio Giacomuzzo, Siddarth Jain, Pietro Falco, Ruggero Carli, Diego Romeres. 2025. [PACE: Proactive Assistance in Human-Robot Collaboration through Action-Completion Estimation](https://doi.org/10.1109/ICRA55743.2025.11127399). *2025 IEEE International Conference on Robotics and Automation (ICRA)*.

[5] Sandra G. Hart. 2006. [NASA-Task Load Index (NASA-TLX); 20 Years Later](https://doi.org/10.1177/154193120605000909). *Proceedings of the Human Factors and Ergonomics Society Annual Meeting 50(9)*.

[6] Damian Hostettler, Simon Mayer, Jan Liam Albert, Kay Erik Jenss, Christian Hildebrand. 2025. [Real-Time Adaptive Industrial Robots: Improving Safety And Comfort In Human-Robot Collaboration](https://doi.org/10.1145/3706598.3713889). *Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems, 1–16*.

[7] Bsher Karbouj, Rajwinder Garha, Konstantin Keßler, Jörg Krüger. 2026. [Adaptive Robotic Behavior in Industrial Human–Robot Collaboration: A Systematic Review of Taxonomies, Enabling Mechanisms, and Research Frontiers](https://doi.org/10.1109/access.2025.3649702). *IEEE Access 14, 1398–1422*.

[8] Soroush Korivand, Gustavo Galvani, Arash Ajoudani, Jiaqi Gong, Nader Jalili. 2024. [Optimizing Human–Robot Teaming Performance through Q-Learning-Based Task Load Adjustment and Physiological Data Analysis](https://doi.org/10.3390/s24092817). *Sensors 24(9), 2817*.

[9] Javier Melo, Leyla Akinci, Ko Watanabe, Nicolas Großmann, Shoya Ishimaru, Andreas Dengel. 2026. [SensCogAR: Cognitive Load Estimation Via Movement Data in Assembly Tasks](https://doi.org/10.60401/ijabc.147). *International Journal of Activity and Behavior Computing 2026(1), 1–20*.

[10] Robert Ojsteršek, Borut Buchmeister, Aljaž Javernik. 2024. [Personalizing Human–Robot Workplace Parameters in Human-Centered Manufacturing](https://doi.org/10.3390/machines12080546). *Machines 12(8), 546*.

[11] Eduarda Pereira, Luis Sigcha, Emanuel Silva, Adriana Sampaio, Nuno Costa, Nélson Costa. 2025. [Capturing Mental Workload Through Physiological Sensors in Human–Robot Collaboration: A Systematic Literature Review](https://doi.org/10.3390/app15063317). *Applied Sciences 15(6), 3317*.

[12] Ramtin Tabatabaei, Vassilis Kostakos, Wafa Johal. 2025. [Gazing at Failure: Investigating Human Gaze in Response to Robot Failure in Collaborative Tasks](https://doi.org/10.1109/hri61500.2025.10973935). *2025 20th ACM/IEEE International Conference on Human-Robot Interaction (HRI), 939–948*.

[13] Grace Teo, Lauren Reinerman-Jones, Gerald Matthews, James Szalma, Florian Jentsch, Peter Hancock. 2018. [Enhancing the effectiveness of human-robot teaming with a closed-loop system](https://doi.org/10.1016/j.apergo.2017.07.007). *Applied Ergonomics 67, 91–103*. First published online 3 October 2017.

[14] Sofia Thunberg, Mafalda Gamboa, Meagan B. Loerakker, Patricia Alves-Oliveira, Hannah R. M. Pelikan. 2026. [Unpacking Lived Experiences of Wizards of Oz](https://doi.org/10.1145/3776734.3788834). *Companion Proceedings of the 21st ACM/IEEE International Conference on Human-Robot Interaction, 1399–1401*. Workshop proposal.

[15] Jing Yang, Juan Antonio Barragan, Jason Michael Farrow, Chandru P. Sundaram, Juan P. Wachs, Denny Yu. 2024. [An Adaptive Human-Robotic Interaction Architecture for Augmenting Surgery Performance Using Real-Time Workload Sensing—Demonstration of a Semi-autonomous Suction Tool](https://doi.org/10.1177/00187208221129940). *Human Factors: The Journal of the Human Factors and Ergonomics Society 66(4), 1081–1102*. First published online 11 November 2022; journal issue April 2024.
