# When to Intervene: Trade-offs Between Scheduled and Physiology-Triggered Robotic Assistance

Anonymous Author(s)

Submission number: 2613

**WORKING DRAFT: N = 24 IS THE PLANNED SAMPLE. RESULTS AND DEMOGRAPHICS AWAIT FINAL UPDATE.**

## Abstract

In human–robot interaction (HRI), deciding when to provide assistance requires understanding how different intervention strategies affect both task performance and the user experience. Previous work has compared physiology-triggered robotic assistance with periodic support in surgical training. We extend this work to physical spatial problem solving by conducting an experiment to compare three conditions: no assistance, scheduled assistance, and adaptive assistance based on physiological signals. Twenty-four participants (N = 24) solve nine physical tangram puzzles across three sessions. The order of the conditions is varied across participants, and puzzles are randomly assigned to the sessions. Tangrams combine spatial reasoning with physical manipulation, providing a simple task for studying informational and physical assistance. Participants receive on-screen hints and robotic-arm interventions through a Wizard-of-Oz setup, with assistance either scheduled or adapted using heart-rate signals and task progress. We evaluate puzzle completion, completion time, workload, helpfulness, intervention timing, frustration, and trust. Both assistance conditions improve completion rates compared with no assistance; scheduled assistance achieves the highest completion and shortest duration, while adaptive assistance receives higher helpfulness and timing ratings and lower frustration. Together, these findings highlight distinct trade-offs between assistance strategies in task performance and user experience, providing insights for designing HRI systems that adapt assistance to the needs of the user.

## 1. Introduction

A person solving a physical puzzle may pause to mentally rotate a piece, reconsider an arrangement, or decide what to try next. These moments can look similar to an observer but call for different responses. A hint may help someone resume work; the same hint during a productive pause may interrupt a solution they were about to reach. For an assistive robot, deciding when to act is therefore part of deciding how to help.

Recent human-robot collaboration research makes assistance contingent on the person's activity. Andriella et al. model assistance type, timing, and confidence [1], while PACE uses action-completion estimates to coordinate proactive assistance [4]. A recent review distinguishes adaptation of robot motion from task-level decisions about timing, sequencing, and role allocation [7]. These approaches raise an evaluation question: does a strategy that supports task execution also provide help that people experience as appropriate?

Physiological signals offer another basis for assistance timing. Yang et al. compared workload-adaptive robotic suction with periodic support during surgical training [15]. We extend this comparison to physical spatial problem solving, where a hint can change a person's understanding of an arrangement and robotic assistance can change the availability of a piece. Our focus is the relationship between task performance and the experience of receiving these interventions.

We use seven-piece tangram puzzles to study this relationship. Recent work uses tangrams for collaborative HRI and as a simplified assembly task [12, 9]. They support repeated attempts with common materials, observable completion outcomes, and both informational and physical assistance. We compare assistance offered at regular intervals with assistance offered when physiological monitoring flags arousal, allowing the timing policy to respond to changes during the task.

Each participant experiences no assistance, scheduled assistance, and adaptive assistance, with three different puzzles per condition. Scheduled assistance is offered every 30 seconds; adaptive assistance is offered whenever arousal is flagged. A Wizard-of-Oz setup delivers the corresponding hints and robot actions. We assess both puzzle performance and participant experience to understand how the two assistance policies support progress and how their interventions are received.

We address two research questions. **RQ1:** How do the three assistance conditions differ in puzzle completion and round duration? **RQ2:** How do they differ in perceived workload and frustration, and how do the assisted conditions compare in helpfulness and intervention timing?

Our contributions are:

1. A comparison of unassisted, scheduled, and physiology-informed assistance in physical spatial problem solving.
2. A Wizard-of-Oz platform coordinating text hints, robotic-arm assistance, physiological monitoring, and study measures.
3. An evaluation connecting objective task performance with workload and the experience of receiving assistance.

## 2. Related Work

**FIND AND INSERT MORE REFERENCES**

### 2.1. Assistance timing and proactive coordination

Karbouj et al.'s review of adaptive industrial HRC distinguishes motion, task, and control adaptations and identifies task-level timing and coordination as areas warranting further attention [7]. Assistance timing is thus part of a broader design space in which robots adapt their motion, task contributions, and coordination with people.

Andriella et al. learn proactive assistance from user profiles and task state in a sequential memory game, jointly addressing assistance type, timing, and confidence [1]. PACE estimates action completion from hand movements and uses a learned policy to coordinate assistance during collaborative assembly [4]. These approaches connect robot behavior to unfolding human activity. Our study examines fixed-interval and arousal-triggered assistance in a physical reasoning task, considering both task outcomes and the experience of the intervention.

### 2.2. Physiological information in assistance

Yang et al.'s surgical system uses EEG and eye tracking to inform adaptive suction, with a periodic comparator selected to approximate earlier observed assistance frequency [15]. Earlier work by Teo et al. uses individualized physiological workload markers to trigger aid during robot supervision, imposing aid later when it has not been triggered [13]. These studies establish approaches to physiological assistance timing across tasks with different demands, sensors, and forms of support.

Other work integrates physiological measurement with broader adaptation strategies. Hostettler et al. adapt robot behavior to user distance while measuring pupil responses; direct pupil-driven adaptation is a future direction [6]. Ojsteršek et al. personalize robot parameters using a preliminary skills test and analyze ECG recordings after the experiment [10]. Korivand et al. develop physiological task-load prediction and Q-learning-based adjustment, while explicitly reporting that their recorded wristband data could not be integrated directly for real-time use [8]. Together, these studies illustrate how physiological measurements can support evaluation, personalization, and intervention timing.

Pereira et al.'s review documents heterogeneous workload measures and mixed cardiac findings across HRC studies [11]. Capponi et al. similarly find no clear RMSSD pattern across their assembly configurations and distinguish cognitive effort from stress [3]. We therefore evaluate arousal-triggered assistance through its effects on task performance and participant experience, alongside the physiological signal used to initiate it.

### 2.3. Physical tasks and participant experience

Tabatabaei et al. study gaze around robot failures during collaborative tangram solving [12]. SensCogAR uses tangrams as a proxy for small-object assembly, manipulating the visibility of piece contours to vary task demand [9]. Adjacent assembly work by Caiazzo et al. compares manual, collaborative, and guided collaborative conditions, with EEG used for workload assessment [2]. These task settings combine spatial interpretation, manipulation, and interaction with robot assistance.

Hart describes the six NASA-TLX workload dimensions and the use of an unweighted overall score [5]. We assess these dimensions alongside helpfulness, timing, seamlessness, and frustration relief. This combination connects the demands of solving a puzzle with the participant's experience of the assistance itself.

### 2.4. Wizard-of-Oz evaluation

Wizard-of-Oz methods support the study of robot interactions through human-operated delivery. A recent HRI workshop proposal by Thunberg et al. emphasizes the practical, ethical, and methodological tensions of the wizard's role [14]. In our setup, the condition determines when assistance is offered: every 30 seconds or when arousal is flagged. The researcher delivers a task-relevant hint or robot cue, and the robot operator executes the corresponding program. This arrangement supports the comparison of timing policies using a common assistance interface.

## 3. Tangram Task Profiling and Assistance Expectations

### 3.1. Survey and task experience

A task-profile survey collected responses from 24 people: 22 undergraduate students, one graduate student, and one faculty member. Respondents were aged 18–30 years (M=20.17, SD=2.24); 14 identified as men, nine as women, and one preferred not to disclose gender. Respondents were recruited through forms shared on college mailing groups. A Google Form linked to an online square tangram with a timer; respondents attempted the puzzle and reported their familiarity, completion, solving time, and moments of uncertainty. They also rated the assistance they would find helpful if stuck. Some survey respondents also participated in the robot experiment.

Twelve respondents had previously solved tangrams, including two who solved them regularly. Seven had heard of tangrams without solving them, and five were unfamiliar with them. Fifteen respondents reported completing the puzzle (62.5%), eight reported partial completion (33.3%), and one did not solve it (4.2%). Seventeen respondents (70.8%) reported feeling stuck at least once. Twelve selected a solving time below one minute, eight selected one to five minutes, and two selected five to ten minutes; two selected the option for not attempting or solving the puzzle.

### 3.2. Assistance expectations and task rationale

Respondents independently rated four hypothetical forms of assistance on scales from 1 (most helpful) to 5 (least helpful). A simpler puzzle received a mean rating of 2.04 (SD=1.16), a step-by-step video tutorial 2.58 (SD=1.28), a text hint 2.71 (SD=1.23), and a robot physically showing where to place a piece 3.04 (SD=1.43; Figure 1). Written responses requested help with the first piece, visual guidance about piece placement, and hints at moments of difficulty. These expectations contextualize the main experiment's comparison of informational and physical assistance.


![Figure 1](figures/task-profile-survey.png)

*Figure 1. Task-profile survey (N=24). Left: self-reported puzzle outcomes. Right: expected helpfulness of four independently rated assistance options; diamonds show means, bars show SD, and gray dots show individual ratings. Lower ratings indicate greater expected helpfulness.*


Each experimental tangram requires all seven pieces to reproduce a target shape: two large triangles, one medium triangle, two small triangles, a square, and a parallelogram. The seven colored pieces together form a 10×10-inch square. Their colors provide consistent references for hints and robot actions. We use nine targets, each with a solution available to the researcher.

Tangrams combine spatial reasoning with physical manipulation. Participants interpret the target, identify useful piece relationships, and test arrangements by moving and rotating the pieces. Informational assistance can address orientation or adjacency, while the arm can bring a relevant piece into the workspace. Different targets retain common materials and instructions, supporting repeated comparisons across conditions. Participants can revisit placements and work on different regions of the target rather than following a single prescribed sequence. The current arrangement guides assistance content, while the assigned condition determines its timing.

## 4. System and Assistance Design

### 4.1. Architecture and apparatus

Our system coordinates three browser interfaces through a local server (Figure 2). The researcher dashboard displays the puzzle solution, workspace camera view, timer, physiological feedback, and assistance controls. The participant laptop presents instructions, text hints, the timer, and questionnaires. The robot-operator display identifies the piece-specific program to execute. The server synchronizes the interfaces and records task outcomes, interventions, and questionnaire responses.


![Figure 2](figures/assistance-architecture.png)

*Figure 2. Assistance architecture. Cardiac measurements pass through signal-quality checks and a heart-rate-rise detector. The assigned condition determines assistance timing; task context guides the researcher’s selection of hints and robot actions. The local server synchronizes interfaces and records study measures.*


The setup combines an Orangewood robotic arm, a Maxim H Band wrist sensor, and a Logitech C270 workspace camera. An opaque partition separates the participant from two researchers, who administer the task and operate the arm (Figure 3). The camera is mounted on top of the partition and covers the participant table. The participant faces a workspace with a puzzle assembly area in front of and to their left, a drop spot to their right, and a laptop for hints and questionnaires. Unused pieces occupy fixed, labeled pickup positions. The arm retrieves a selected piece using one of seven piece-specific programs and delivers it to the drop spot; the participant places it in the target arrangement. Preset text hints describe piece location, orientation, or adjacency, providing consistent assistance content across participants. Hints are accompanied by an audible notification. The researcher selects either a hint alone or a robot action paired with a hint, based on the current arrangement.


![Figure 3](figures/physical-setup-topdown.png)

*Figure 3. Top-down view of the Wizard-of-Oz setup. An opaque partition separates the researchers from the participant; a camera mounted on the partition observes the participant table. The table contains fixed piece pickup positions, the robot drop spot, the assembly area, and the participant laptop. Schematic not to scale.*


**NEED TO ADD SETUP PHOTO HERE / ROBOT AND PIECE MATERIAL DETAILS**

### 4.2. Physiological monitoring

After receiving the study information, participants wore the wrist sensor during a three-minute pre-task baseline window. The sensor streams cardiac measurements over Bluetooth to a Python collector. To detect a short-term rise in heart rate, the collector compares median heart rate over the latest 15 seconds with median heart rate over the preceding 60 seconds. The arousal flag is raised when the difference is at least 5 beats per minute. A calibrated baseline provides the reference while the rolling reference is being established. Signal-quality checks exclude out-of-range readings and readings with poor sensor contact, and the detector requires sufficient usable samples before raising a flag.

The dashboard displays the flag alongside the workspace view. In the adaptive condition, the flag initiates assistance, while the puzzle arrangement determines the content of the hint or robot action. The flag is a heart-rate-rise cue for assistance timing; participant workload and frustration are assessed through questionnaires.

**CONFIRM ACTUAL BASELINE PROCEDURE**

### 4.3. Assistance conditions

**No assistance.** Participants solve the puzzle without text hints or robotic-arm assistance.

**Scheduled assistance.** Assistance is offered every 30 seconds during the puzzle. At each interval, the researcher delivers a preset text hint or a robotic-arm intervention accompanied by a hint, relevant to the current arrangement.

**Physiology-informed adaptive assistance.** Assistance is offered whenever physiological monitoring flags arousal. The researcher delivers a preset text hint or a robotic-arm intervention accompanied by a hint, relevant to the current arrangement. Repeated flags prompt additional assistance. When a flag recurs rapidly or remains raised, the researcher waits 15 seconds before the next intervention. The arousal flag determines when help is offered; the task state guides the researcher’s choice of assistance content.

## 5. Study Design and Findings

### 5.1. Participants, procedure, and analysis

The study targets twenty-four participants (N=24). Participants volunteered through forms shared in college groups and received coupons as compensation. Each completed three sessions of three puzzles, with one assistance condition per session. Condition order varied across participants, and puzzles were randomly assigned to sessions. Participants provided consent and background information before beginning the task. A puzzle was judged solved when the arrangement resembled the target shape using all seven pieces. Unsolved attempts were stopped at five minutes. Each puzzle was followed by a questionnaire, with five-minute breaks between sessions and an overall questionnaire after the ninth puzzle.

**INSERT FINAL DEMOGRAPHICS / ADD ELIGIBILITY AND PRACTICE DETAILS**

We measure puzzle completion and pause-adjusted round duration, including both solved and unsolved attempts. After each puzzle, participants rate the six NASA-TLX dimensions on seven-point scales: mental demand, physical demand, temporal demand, performance, effort, and frustration. An overall workload score averages the six items after aligning their direction so that higher values indicate greater workload. After assisted puzzles, participants also rate helpfulness, timing, seamlessness, and frustration relief. The final questionnaire assesses overall helpfulness, efficacy, trust, and reliance on the robot's guidance.

We average ratings and durations across each participant's three trials per condition, then report means and standard deviations across participants. Completion is reported as the proportion of puzzles solved. Exploratory pairwise comparisons use two-sided paired sign-flip tests on participant-condition averages. Holm correction is applied to the three comparisons for each outcome and to the four assistance-rating comparisons; reported p values are adjusted. Spearman correlations summarize relationships between participant-level measures separately in each condition.

**UPDATE WITH FINAL RESULTS**

### 5.2. Objective task performance

For photograph-based partial-progress scoring, we count correctly placed pieces against the target arrangement. If a partial solution admits two possible orientations, we retain the orientation with more correctly placed pieces.

**INSERT CORRECT PIECE COUNT / CONFIRM PLACEMENT TOLERANCE AND SCORERS**

Participants solved 47 of 108 puzzles. Completion rates were 13.9% without assistance, 66.7% with scheduled assistance, and 50.0% with adaptive assistance (Table 1; Figure 4). Compared with control, completion was 52.8 percentage points higher with scheduled assistance (p=.0015) and 36.1 points higher with adaptive assistance (p=.016). The difference between the two assisted conditions was not statistically significant (p=.156).


| Condition | Solved | Rate | Duration (s) |
| –- | –- | –- | –- |
| Control | 5/36 | 13.9% | 289.58 (25.59) |
| Scheduled | 24/36 | 66.7% | 239.03 (51.42) |
| Adaptive | 18/36 | 50.0% | 268.78 (30.30) |

*Table 1. Puzzle completion and round duration. Duration includes all attempts; values are mean (SD) across participant-condition averages.*


Scheduled assistance also had the shortest mean round duration. Its mean was 50.56 seconds below control (p=.012). The adaptive-control and adaptive-scheduled duration differences were not statistically significant (both p=.132). These durations summarize time spent across all attempts, rather than time to successful completion alone.


![Figure 4](figures/performance.png)

*Figure 4. Puzzle completion and mean round duration. Gray lines connect the same participant across conditions; colored diamonds show condition means.*


### 5.3. Subjective workload

Overall workload averaged 4.72 in control, 3.69 with scheduled assistance, and 3.74 with adaptive assistance (Table 2; Figure 5). Both assisted conditions had lower workload than control: the mean reductions were 1.03 points for scheduled assistance (p=.0020) and 0.98 points for adaptive assistance (p=.0015). Their overall workload scores did not differ significantly (p=.882).


| Measure | Control | Scheduled | Adaptive |
| –- | –- | –- | –- |
| Mental demand | 5.83 (0.96) | 4.69 (0.90) | 4.81 (1.40) |
| Physical demand | 3.64 (1.63) | 3.11 (1.28) | 3.28 (1.50) |
| Temporal demand | 3.94 (1.27) | 3.33 (0.88) | 3.44 (1.34) |
| Perceived performance | 3.08 (1.51) | 5.03 (1.05) | 5.06 (1.25) |
| Effort | 5.56 (0.67) | 4.61 (0.91) | 4.81 (1.08) |
| Frustration | 4.44 (1.26) | 3.44 (0.91) | 3.17 (0.81) |
| Overall workload | 4.72 (0.62) | 3.69 (0.54) | 3.74 (0.81) |

*Table 2. NASA-TLX dimension ratings and overall workload on seven-point scales, mean (SD). Higher performance ratings indicate greater success; higher workload ratings indicate greater demand.*


Mental demand averaged 4.69 with scheduled assistance and 4.81 with adaptive assistance, while frustration averaged 3.44 and 3.17, respectively. Adaptive assistance reduced frustration relative to control (p=.031). The scheduled-control and adaptive-scheduled frustration differences were not statistically significant (p=.068 and p=.470). Perceived performance averaged 5.03 and 5.06 in the assisted conditions.


![Figure 5](figures/workload.png)

*Figure 5. Overall workload and frustration. Lines connect each participant's condition averages; diamonds show condition means. Higher values indicate greater burden.*


Figure 6 relates performance and experience across participants. Completion and duration were negatively correlated in control (ρ=-.80), scheduled assistance (ρ=-.89), and adaptive assistance (ρ=-.34). Completion and overall workload were also negatively correlated (ρ=-.43, -.36, and -.75, respectively). These associations describe co-occurring outcomes rather than causal relationships. Frustration contributes to the overall workload score, so their positive correlation partly reflects this shared measurement.


![Figure 6](figures/correlations.png)

*Figure 6. Spearman correlations between participant-condition averages. Cells show correlation coefficients from -1 to 1; no significance threshold is applied. Frustration is one component of overall workload.*


### 5.4. Intervention experience

Adaptive assistance received higher mean ratings on all four assistance-specific items (Table 3; Figure 7). Helpfulness averaged 5.06 with adaptive assistance and 4.83 with scheduled assistance; timing averaged 5.56 and 5.17, respectively. Mean seamlessness was 4.22 versus 4.11, and frustration relief was 5.14 versus 4.89. None of these paired differences was statistically significant after correction (timing p=.719; other items p=1.000).


| Measure | Scheduled | Adaptive |
| –- | –- | –- |
| Helpfulness | 4.83 (0.63) | 5.06 (0.87) |
| Timing | 5.17 (1.11) | 5.56 (0.95) |
| Seamlessness | 4.11 (1.37) | 4.22 (1.24) |
| Frustration relief | 4.89 (0.90) | 5.14 (1.28) |

*Table 3. Intervention experience in the two assisted conditions, mean (SD). Higher ratings indicate a more favorable experience.*


These ratings describe the combined experience of text hints and robotic-arm assistance. The higher adaptive averages alongside lower completion than scheduled assistance motivate examining both task progress and the experience of receiving help.


![Figure 7](figures/intervention-experience.png)

*Figure 7. Assistance-specific ratings. Lines connect each participant's scheduled and adaptive averages; diamonds show condition means. Higher ratings indicate a more favorable experience.*


### 5.5. Overall experience

Overall helpfulness averaged 5.08 (SD=1.24), efficacy 4.92 (SD=1.51), and trust 4.75 (SD=1.60). Agreement with following the robot's guidance even when uncertain averaged 5.08 (SD=1.31). These end-of-study ratings summarize participants' experience across all three conditions.

Six participants left written comments. Their remarks illustrate variation in hint usefulness and the contribution of physical assistance. P101 wrote, “some of the hints were really nice, some were meh.” P103 described the hints as “helpful and overall well timed,” but felt the arm added little to solving the puzzle. Two participants described the puzzles as fun. These comments provide individual perspectives alongside the ratings.

## 6. Discussion, Limitations, and Future Work

### 6.1. Task progress and the experience of assistance

Both assistance conditions increased completion and reduced overall workload relative to control. Scheduled assistance had the highest completion rate and shortest mean round duration. Adaptive assistance received higher average helpfulness and timing ratings and lower average frustration, but these differences between the assisted conditions were not statistically significant. The findings support considering performance and participant experience together without establishing that either assisted policy is consistently preferable.

Regular assistance may provide opportunities to reconsider an arrangement and advance the puzzle. Arousal-triggered assistance may concentrate help at moments when participants are receptive to it. The task-profile survey similarly showed that respondents could feel stuck despite completing the puzzle and requested guidance about specific placements. These interpretations motivate testing how assistance matches the stage of a solution process.

### 6.2. Assistance timing and physiological feedback

The adaptive policy links intervention timing to arousal events, while scheduled assistance provides predictable assistance opportunities. In a spatial reasoning task, participants alternate between manipulation and reflection, so usefulness can depend on when help arrives. Future work could relate arousal events and intervention times to observed puzzle progress and evaluate which assistance content is most useful at different stages. Comparisons across tasks and sensors would help establish how broadly the timing policy applies.

### 6.3. Limitations and future work

Participant feedback suggested that hints were more important for solving the puzzle than robot retrieval. P103 noted that “the arm took time in moving the piece which cut into solving time.” Although retrieval makes a piece available, the participant still determines its placement. Future work could have the robot place pieces directly in the target arrangement and examine whether this increases the value of physical assistance.

Experience ratings combined text and robotic-arm assistance. Future comparisons should examine each modality separately. Correct-piece scoring from final photographs would provide a finer measure of partial progress alongside binary completion. The task-profile survey measured anticipated helpfulness, whereas the experiment measured experience after receiving assistance; these ratings address different questions.

The seven-point workload ratings and overall trust item capture participants' reported experience. Trust was measured after all conditions, so condition-specific changes require further study. Tangrams provide a controlled spatial task.

**TANGRAM TO ASSEMBLY LINE?**

## 7. Ethical Considerations

Participants consented through the volunteer form and again before the experiment. The interface required consent and acknowledgement of instructions before the task began. Participation was voluntary, with the option to pause or stop without penalty. Participants consented to workspace recording and live viewing; the camera showed only the table and hands, excluding faces. Cardiac measurements and questionnaire responses were also collected.

The concealed human operation in the Wizard-of-Oz setup was not disclosed during or after the task. Participant codes link the records; data release must respect consent coverage and protect identifying information.

**ADD ETHICS APPROVAL OR EXEMPTION DETAILS**

## 8. Conclusion

We compared unassisted, scheduled, and physiology-informed adaptive assistance for physical tangram solving. Both assisted conditions improved completion and reduced workload relative to control. Scheduled assistance had the highest observed completion rate and shortest mean round duration. Adaptive assistance received higher average intervention ratings and lower frustration, with no statistically significant differences between the assisted conditions. These findings motivate systems that consider both task progress and the experience of receiving help, alongside further study of the content and physical role of assistance.

## AI Assistance Disclosure

AI-assisted tools were used in preparing this manuscript. The authors are responsible for the accuracy, originality, and integrity of the work, including its citations.

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
