# Assistance architecture draft

Files: `assistance-architecture.tex` (editable TikZ), `assistance-architecture.pdf` (vector figure), and `assistance-architecture.png` (review preview).

The four modules show physiological processing, assistance timing, Wizard-of-Oz delivery, and participant interaction. Workspace camera observations and the puzzle solution provide task context through a separate route above the modules. The local study server supports the interfaces and records the study data. Solid arrows show signal processing and assistance delivery; dashed arrows show task context and questionnaire responses.

Scheduled assistance is offered every 30 seconds. Adaptive assistance uses the existing arousal flag from a heart-rate rise. The researcher chooses assistance content based on the puzzle context, and the robot operator executes the selected piece-specific program. No-assistance trials disable hints and robot actions.

## Arousal derivation

The figure follows `live_arousal_assessment` in `integrations/watch/watch_core.py` and the parameters passed by `integrations/watch/watch.py`.

1. Receive timestamped heart-rate readings from the wrist sensor over Bluetooth.
2. Keep readings in the 30 to 240 bpm range and exclude samples that explicitly report no sensor contact. Require at least five usable readings in the current window and no more than 20% poor-contact packets when contact information is supported.
3. Calculate median HR over the latest 15 seconds.
4. Calculate median HR over the immediately preceding, non-overlapping 60 seconds, from 75 to 15 seconds before the current time. Require at least ten usable reference readings. While this reference builds, use the participant's calibrated baseline HR when available.
5. Subtract reference HR from current HR. Raise the arousal flag when the increase is at least 5 bpm and the HR quality check passes. If the signal is unreliable or no reference is available, no flag is raised.

These numerical values are the checked-in collector parameters and can be configured at launch. The flag is derived from heart-rate rise; RR/HRV quality is calculated separately. It describes a physiological cue, not a validated classification of psychological stress. In the study protocol, the adaptive condition calls for assistance whenever this flag is raised; the researcher selects content and the operator delivers the robot action.

The grouped layout was developed after reviewing GuideAI Figure 4 (PDF page 5 of `2601.20402v1.pdf`) and AdaptAI Figure 1 (PDF page 2 of `2503.09150v1.pdf`). The actual component labels and flows follow this project's manuscript, `docs/architecture.md`, and the watch integration documentation. The figure represents the study workflow; server-mediated connections are summarized by the shared server band.

Suggested caption:

> Architecture of the assistance system. After signal-quality checks, median heart rate over the latest 15 seconds is compared with the preceding 60-second reference, using a calibrated baseline while the reference builds. A rise of at least 5 bpm raises the arousal flag. The assigned condition determines assistance timing: every 30 seconds for scheduled assistance or whenever arousal is flagged for adaptive assistance. Workspace observations and the puzzle solution inform assistance content. The researcher selects hints and/or robotic assistance, and the robot operator executes the selected piece-specific program. A local server synchronizes the interfaces and records study data.

Current placement: Section 4.1 as Figure 2. The manuscript imports the TikZ copy in paper/aamas2027/figures/assistance-architecture.tikz.tex. See paper/aamas2027/VERSIONS.md for version history.

The manuscript now records preset hints and a parallel hint with every robotic action. Rapid/sustained repeated adaptive flags use a 15-second wait. These are protocol details; the figure retains the common processing and delivery flow.
