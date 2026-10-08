"""Generate a claim-to-PDF navigation map from human-reviewed evidence.

Literal anchor matching, coverage and hashes are mechanical checks; the supporting
paraphrases and scope judgments below are human-reviewed, not inferred by a regex.
No manuscript, source PDF, raw data or bibliography is changed.
"""
from pathlib import Path
import hashlib
import json
import re
import unicodedata
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = HERE.parent / 'paper-refresh-2026-10-08/citation-verification'
TEX = HERE / 'paper/main.tex'

# key: supporting PDF pages, anchor page, short literal locator, evidence, boundary.
SPEC = {
 'andriella2025': ([9,10],10,'Assistance Decision Network',
  'Sections 4 and 4.2 separate selection of the assistance action, intervention timing, and confidence through connected decision networks.',
  'Supports the architecture description, not universal superiority of proactive support.'),
 'delazzari2025': ([3,8],8,'longest waiting times',
  'The abstract describes hand-motion/action-completion estimation and proactive coordination. The results report the greatest waiting under explicit querying; the phase-free variant leads several subjective measures.',
  'The discussion uses its waiting result as a design consideration, not proof that every proactive system is better.'),
 'karbouj2026': ([2],2,'124 publications met',
  'The review includes 124 eligible publications. Its taxonomy covers task-level timing/synchronization and role allocation in addition to motion and control adaptation.',
  'This is a systematic review, not an implemented adaptive-assistance trial.'),
 'ramnauth2026': ([8,13],8,'utility is higher than the cost',
  'The framework relates appropriateness to recipient utility and cost. Its evaluation uses 215 participants rating assistance vignettes.',
  'Supports appropriateness judgments and conceptual trade-offs, not observed benefits of delivered help.'),
 'vitry2026': ([1,4],4,'there are no significant differences',
  'Section IV reports more interactions with the proactive model (p<.001), but no significant overall objective-performance difference; the success-rate trend is p=.077.',
  'Nonsignificance is not equivalence or evidence that proactivity has no effect.'),
 'pereira2025': ([18,19,20],20,'inconsistent workload assessments',
  'The discussion describes diverse measures and difficulties comparing studies. Cardiac measures are discussed on p19; p20 explains interindividual HRV and other physiological variability and inconsistent workload assessment.',
  'The manuscript summarizes heterogeneous/mixed measurement evidence, not a pooled cardiac effect or validation of the present HR threshold.'),
 'quigley2024': ([1,8,9],9,'poor electrode contact',
  'The guidelines separately address HR and HRV. The PPG discussion says movement/physical activity worsens signal-to-noise, and the artifact section lists contact and movement problems.',
  'Poor electrode contact is an ECG example; p8 supplies wearable PPG movement context. The guidelines do not validate our detector or show that HR rise means frustration.'),
 'tabatabaei2025': ([1,4,5],1,'27 participants',
  'A 27-person human-robot tangram study manipulates robot failures and examines gaze and robot perception during collaborative solving.',
  'Supports physical tangrams as an HRI task and gaze around failures; not benefits of our assistance policy.'),
 'melo2026': ([8,9],8,'experiment application was presented on a computer',
  'Section 4.2 describes seven-piece manual tangram assembly, computer-presented references, HoloLens movement recording and Empatica physiological recording; Figure 2 shows the physical setup.',
  'No robot delivers assistance. The manuscript explicitly distinguishes cognitive-load measurement from robotic help.'),
 'lavitnicora2024': ([1,6,10],1,'37 participants',
  'The assembly study relates looking toward the cobot to joint-action initiation and pilots gaze-triggered coordination. The gaze signal is interpreted as readiness for joint action.',
  'Readiness to coordinate is not equivalent to needing a puzzle hint.'),
 'tanneberg2024': ([1,2,5,6],1,'remain silent',
  'Attentive Support combines perception, dialogue and LLM reasoning to choose help or nonintervention. The paper describes scenario-based simulation tests and a real-robot demonstration.',
  'Not a controlled human-participant efficacy comparison or evidence of reduced workload.'),
 'andriella2025mentalising': ([1,13,14,15],14,'Regarding the timing',
  'The two-layer Q-learning/mentalising architecture reports better performance and assistance acceptance. The discussion acknowledges explanation-detail confounding and fixed assistance timing.',
  'Trust was not directly measured; benefits do not isolate timing or mentalising from explanation detail.'),
 'candon2023': ([6,7],6,'ten seconds after the reminder',
  'Whole-game timing tests are nonsignificant, whereas reminder timing affects feedback within the immediate ten-second window (p=.02) and latency after the reminder (p=.04).',
  'A feedback-solicitation result, not a whole-game performance or physiological-assistance advantage.'),
 'cao2025': ([7],7,'Pearson correlation coefficient',
  'Section E reports exploratory negative correlations between unsuccessfully handled interruptions and perceived inclusion (p=.005) and discussion satisfaction (p=.021).',
  'Associations, not causal treatment effects. The official RSS PDF is image-based; searchable author text supplies the locator, with the official results page visually cross-checked.'),
 'yang2024': ([4,5,8,9,10],9,'suction was activated every 150 seconds',
  'The experiments use EEG/eye-tracking workload features and compare workload-adaptive versus periodic suction in surgical simulation. The periodic interval is 150 seconds, estimated using earlier adaptive suction counts.',
  'Supports the abstract motivation and timing comparison. It is not an HR-only detector, clinical validation, or evidence that dose is matched in our study.'),
 'teo2018': ([3,5,6],6,'aid would be',
  'Individual low/high-workload responses determine sensitive physiological markers. The aid model uses a rolling/debounced index; if aid does not trigger during the first ten minutes, it is imposed in the last five.',
  'Adaptive versus later-imposed aid in simulated robot supervision, not fixed-interval periodic aid.'),
 'hostettler2025': ([1,12],1,'spatial distance',
  'The implemented robot adapts movement to operator distance while recording pupil dilation. Using pupil dilation to trigger behavior is proposed as future work.',
  'Physiological outcome measurement is not the deployed adaptation trigger.'),
 'ojstersek2024': ([3,4],4,'At the end of the experiment',
  'A preliminary skills test sets robot movement/utilization parameters. ECG records are transferred to analysis software at the end of the experiment.',
  'Supports pre-task personalization and offline cardiac analysis, not online physiological control.'),
 'korivand2024': ([18],18,'after recording is complete',
  'The limitations state that available wristbands cannot transmit data in real time and therefore the collected data cannot be integrated directly into the model online.',
  'A framework with an explicit deployment limitation, not a completed online trigger evaluation.'),
 'prajod2024': ([1,6,8],8,'two-class model',
  'The paper analyzes facial emotion separately and evaluates HRV classification of challenge. Its adaptive assembly condition is triggered by a wizard watching progress toward subassembly completion.',
  'Neither the facial estimates nor the HRV classifier directly drives assistance in that experiment.'),
 'shukla2026': ([8,9,15],15,'dynamically adapts',
  'GuideAI integrates gaze, HRV, posture and note-taking feedback to vary learning content, pacing and intervention types. The reported study is preliminary (25 participants).',
  'Educational adaptation, not a replication of robotic assistance or our physiology-trigger policy.'),
 'wei2025': ([1],1,'A single expert surgeon',
  'One expert surgeon performs simulated tasks. Model interpretation identifies subjective workload, mean HR and muscle activation as influential predictive features.',
  'Single-person predictive associations, not causal effects or general validation of a cardiac trigger.'),
 'bhagatsmith2026': ([5,6],6,'portability, model complexity, and adaptability',
  'The review evaluates machine-learning methods for unknown-task workload estimation against portability, model-complexity and adaptability criteria.',
  'A generalization review, not direct evidence for the present threshold or task.'),
 'capponi2024': ([13],13,'did not show any particular trend',
  'The concluding summary reports no particular RMSSD/SDNN trend across the tested assembly complexity and collaboration configurations.',
  'A bounded null-pattern result, not a claim that HRV is universally uninformative.'),
 'zhao2025': ([1,6],1,'only silhouette prompts',
  'MRChaos learns autonomous tangram assembly from silhouettes and evaluates real-world manipulation and transfer examples. Piece placement and orientation are central task demands.',
  'Its assembly demands motivate an analogy in our discussion; transfer of human-assistance benefits is not established.'),
 'caiazzo2024': ([2,4],2,'analysis was conducted for three participants',
  'The preliminary study compares standard manual, collaborative and guided collaborative assembly for three participants, using EEG for workload analysis.',
  'Small preliminary evidence, not a large efficacy trial.'),
 'cavicchi2025': ([12],12,'collaboration comes at a cost',
  'The review conclusion discusses possible load/performance costs of shared tasks and help from appropriate social signals, including task-relevant cues.',
  'No unsupported recommendation to delegate difficult task segments is attributed to the review.'),
 'vandijk2023': ([7,8],7,'timing of the onset',
  'The discussion reports five lower workload factors with human-led autonomy, and lower cognitive/temporal demand with slower pacing. Pacing changes action onset while robot movement speed stays constant.',
  'Keep autonomy and pacing effects separate; not a claim that slowing motor movement improves workload.'),
 'varrasi2026': ([11],11,'No significant difference was observed',
  'Older adults have greater NASA-TLX with robot than human guidance (p=.005); the younger-adult contrast is nonsignificant (p=.83).',
  'Age-specific evidence, not a general robot disadvantage or proof of equivalence for younger adults.'),
 'smit2024': ([1,5,6],6,'total mass of the lifted products',
  'Discrete-event order-picking simulation models picker workload as total lifted mass and fairness as its dispersion across pickers; AMRs and humans divide transport/picking tasks.',
  'Physical workload, not subjective cognitive workload. Retrieval/material provision is a discussion analogy, not a measured cross-domain benefit.'),
 'tanjim2025': ([3,5],5,'workload was significantly lower in C2',
  'The medical-training simulation compares cue combinations and a conventional crash cart. Verbal object search with visual reminders gives lower reported workload and higher usefulness/ease of use.',
  'Simulation with a Wizard-of-Oz crash cart, not clinical effectiveness or equal-dose timing isolation.'),
 'thunberg2026': ([1,2,3],1,'goal of this workshop',
  'The document proposes a workshop to surface ethical, practical, methodological and personal tensions in being a wizard.',
  'A workshop proposal, not completed workshop findings or a participant experiment.'),
 'bejarano2024': ([1,2,5],2,'We recruited six HRI researchers',
  'Six researcher interviews identify response demands, participant unpredictability, robot delays/malfunctions and precision/control needs.',
  'Qualitative researcher accounts of operation challenges, not a controlled comparison of interfaces.'),
 'hart2006': ([1,3],3,'ratings are simply averaged or added',
  'The paper specifies the six NASA-TLX dimensions and describes raw/unweighted variants that average or sum ratings without the weighting procedure.',
  'Supports the dimensions and unweighted precedent, not psychometric validation of our seven-point items, reversal or rescaling formula; those are stated study-specific choices.'),
}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def norm(text):
    text = unicodedata.normalize('NFKC', text)
    text = re.sub(r'-\s*\n\s*', '', text)
    return re.sub(r'\s+', ' ', text).strip()

tex = TEX.read_text()
manifest = {r['key']: r for r in json.loads((SOURCE/'all-source-downloads.json').read_text())}
bib = (HERE/'paper/references.bib').read_text()
bibrecords = {m.group(1): m.group(2) for m in re.finditer(r'@\w+\{([^,]+),\s*(.*?)(?=\n@|\Z)', bib, re.S)}
bbl = (HERE/'paper/main.bbl').read_text()
bblkeys = re.findall(r'\\bibitem\[.*?\]%\s*\{([^}]+)\}', bbl, re.S)
assert len(bblkeys)==34 and set(bblkeys)==set(SPEC)==set(manifest)
numbers = {key:i+1 for i,key in enumerate(bblkeys)}

occurrences = []
section = 'Preamble'
subsection = None
in_abstract = False
for linenum,line in enumerate(tex.splitlines(),1):
    if '\\begin{abstract}' in line: in_abstract = True
    if '\\end{abstract}' in line: in_abstract = False
    sm = re.search(r'\\section\*?\{([^}]+)\}', line)
    if sm: section,subsection=sm.group(1),None
    sub = re.search(r'\\subsection\{([^}]+)\}',line)
    if sub: subsection=sub.group(1)
    # Citation-bearing sentences, retaining the exact manuscript wording.
    for sentence in re.split(r'(?<=[.!?])\s+(?=[A-Z])',line):
        for match in re.finditer(r'\\cite\{([^}]+)\}',sentence):
            for key in match.group(1).split(','):
                occurrences.append(dict(key=key,section=section,subsection=subsection,
                                        line=linenum,exactTex=sentence.strip()))
assert {r['key'] for r in occurrences}==set(SPEC)

records=[]
for key in bblkeys:
    pages,anchor_page,anchor,evidence,boundary=SPEC[key]
    path=SOURCE/(key+'.pdf')
    expected=manifest[key]
    assert digest(path)==expected['sha256'],key
    pdf=PdfReader(path)
    assert len(pdf.pages)==expected['pages'],key
    textpath=SOURCE/'cao2025-author.pdf' if key=='cao2025' else path
    textpdf=PdfReader(textpath)
    anchor_text=norm(textpdf.pages[anchor_page-1].extract_text() or '')
    assert norm(anchor).lower() in anchor_text.lower(),(key,anchor_page,anchor)
    # Keep verbatim material well below 25 words from each external source.
    assert len(anchor.split())<=12
    assert all(1<=p<=len(textpdf.pages) for p in pages),key
    title=re.search(r'title\s*=\s*\{(.*?)\},?\n',bibrecords[key],re.S).group(1)
    title=title.replace('{','').replace('}','')
    records.append(dict(number=numbers[key],key=key,title=title,pdf=str(path),
        downloadUrl=expected['url'],sha256=expected['sha256'],pdfPageCount=len(pdf.pages),
        supportingPages=pages,locatorPdf=str(textpath),locatorPage=anchor_page,
        locator=anchor,evidenceParaphrase=evidence,scopeBoundary=boundary,
        uses=[r for r in occurrences if r['key']==key],
        review='Supporting passages read and compared with cited manuscript wording.'))

# The abstract is citation-free by design; map every sentence to literature,
# explicit study methods or aggregate analysis, rather than pretending it is uncited evidence.
abstract=re.search(r'\\begin\{abstract\}(.*?)\\end\{abstract\}',tex,re.S).group(1).strip()
abstract_sentences=re.split(r'(?<=[.!?])\s+(?=[A-Z])',abstract)
abstract_evidence=[
 ('Conceptual motivation', 'Introduction and the bounded assistance-timing/appropriateness sources [1], [10], [21], [31]. This is motivation, not a measured finding.'),
 ('Literature precedent', 'Yang [33], PDF pp8-10: adaptive-versus-periodic robotic suction in surgical training simulation.'),
 ('Study design', 'Sections 4.2-4.4: control, constant 30-second help, HR-rise triggering; physical tangram task.'),
 ('Sample and attempts', 'Section 4.4 and aggregate analysis: 24 participants, nine attempts each across three blocks, 216 attempts in total. Completed attempts does not mean all puzzles were solved.'),
 ('Condition order and puzzle allocation', 'Section 4.4 and supplementary allocation table: four participants per condition order; puzzles randomly assigned to blocks, with uneven realized puzzle allocation.'),
 ('Task rationale', 'Sections 3 and 4.1: physical tangrams require spatial reasoning and manipulation; hints convey placement information and the arm retrieves physical pieces.'),
 ('Delivery', 'Section 4.1 and apparatus: restricted preset hints and pickup-availability-controlled robot retrieval.'),
 ('Measures', 'Section 4.5: completion, correct pieces, descriptive recorded round duration, seven-point adapted NASA-TLX, frustration, assistance items and study-wide trust. Hart [11] supports the TLX dimensions, not our adaptation.'),
 ('Progress, completion, workload and frustration', 'Twelve-test main paired family: all six assisted-control comparisons for success, pieces and TLX have Holm p<.001. Frustration: constant-control Holm p=.0268948797 and adaptive-control p<.001.'),
 ('Descriptive objective/subjective pattern', 'Tables 1-3: constant exceeds adaptive in completion (59.7% vs 50.0%) and pieces (5.68 vs 5.43); adaptive has lower workload (46.06 vs 49.50) and frustration (3.51 vs 3.93), and higher means on all four assistance items. This is descriptive, not significant superiority; effort is an exception among workload dimensions.'),
 ('Conclusion', 'Synthesis bounded by the main/adjusted contrasts and package/dose/physiological-validity limitations in Section 6.'),
]
assert len(abstract_sentences)==len(abstract_evidence),(len(abstract_sentences),len(abstract_evidence))
stats_path=HERE.parent/'paper-review-2026-10-09/audit/agreed-hierarchy-results.json'
stats=json.loads(stats_path.read_text())
assert (stats['participants'],stats['rounds'])==(24,216)
for analysis in ['paired','adjusted']:
    core=[r for r in stats[analysis] if r['family']=='core']
    assert len(core)==12
    assert all(r['significant'] for r in core if r['b']=='control')
    assert not any(r['significant'] for r in core if r['b']=='constant')
assert not any(r['significant'] for r in stats['paired'] if r['b']=='constant')
abstract_records=[dict(sentence=s,claimType=t,evidence=e)
                  for s,(t,e) in zip(abstract_sentences,abstract_evidence)]

report=[
 '# Complete manuscript-to-source-PDF map',
 '',
 '9 October 2026. Covers every active reference and every citation occurrence in the current manuscript, plus all abstract sentences. Page numbers are **one-based PDF pages**, including covers; they are not journal page numbers. The short quoted locator is actual source text. The explanation is a paraphrase of the supporting passage, not a copied abstract.',
 '',
 f'Coverage: **{len(records)} references, {len(occurrences)} citation occurrences, {len(abstract_records)} abstract sentences**. Every canonical PDF was freshly reopened and its hash/page count checked. Each locator was matched to freshly extracted PDF text. Human review of the supporting passages and scope is separate from these mechanical checks. This is not a claim that every page of every source was read, or that external results were replicated.',
 '',
 'The manuscript itself needs no extra citation block in its abstract: the map below connects its literature precedent to Yang and its methods/results to this study. No abstract sentence is left unmapped.',
 '',
 '## Reference index',
 '',
 '| Paper reference | Source | Supporting PDF pages | Manuscript lines |',
 '|---|---|---|---|',
]
for r in records:
    lines=', '.join(str(x['line']) for x in r['uses'])
    report.append(f"| [{r['number']}] {r['key']} | [{r['title']}]({r['pdf']}) | {', '.join(map(str,r['supportingPages']))} | {lines} |")
report += ['', '## Passage-by-passage evidence', '']
for r in records:
    report += [f"### [{r['number']}] {r['title']}", '',
        f"Source: [actual PDF]({r['pdf']}); [original download]({r['downloadUrl']}). Supporting PDF pages: {', '.join(map(str,r['supportingPages']))}.", '',
        f"Actual-text locator (PDF p{r['locatorPage']}): “{r['locator']}”.", '',
        '**Supporting passage, paraphrased:** '+r['evidenceParaphrase'], '',
        '**Evidence boundary:** '+r['scopeBoundary'], '',
        '**Exact manuscript uses:**', '']
    for use in r['uses']:
        label=use['section']+(' / '+use['subsection'] if use['subsection'] else '')
        passage=re.sub(r'\\cite\{([^}]+)\}', lambda m:'['+', '.join(str(numbers[k]) for k in m.group(1).split(','))+']',use['exactTex'])
        report += [f"- [{label}, line {use['line']}]({TEX}:{use['line']}): {passage}", '']
    if r['key']=='cao2025':
        report += [f"Searchable supporting version: [author PDF]({r['locatorPdf']}). The p7 correlation section was also visually compared with official p7.", '']
report += ['## Abstract: every sentence accounted for', '']
for i,r in enumerate(abstract_records,1):
    report += [f"### A{i}. {r['claimType']}", '', r['sentence'], '', '**Evidence:** '+r['evidence'], '']
report += [f"Aggregate numerical source: [agreed hierarchy]({stats_path}); SHA-256 `{digest(stats_path)}`.", '',
 '## Version and layout record', '',
 f"Mapped manuscript: [main.tex]({TEX}); SHA-256 `{digest(TEX)}`.",
 f"Mapped bibliography: [references.bib]({HERE/'paper/references.bib'}); SHA-256 `{digest(HERE/'paper/references.bib')}`.", '',
 'All 34 keys remain present. Page ranges were made more precise in this map (notably Pereira pp18-20 and Quigley pp1/8/9). MRChaos archival pagination remains omitted because available records conflict; Vitry uses the verified author-version DOI. A source-text match does not resolve that separate bibliographic metadata boundary.', '',
 'Rendered main pages 1-8 were inspected for section gaps, float order, table proximity, clipping and alignment. The class/style/margins are unchanged. Existing ragged-bottom layout avoids artificial vertical stretching; remaining lower-page whitespace is natural column/float flow. No spacing edit was needed in this follow-up.', '',
 'No manuscript text, abstract, numerical result, figure or original reference PDF was changed to create this map. The complete rewrite changes are listed in CHANGELOG.md. No push or submission was performed.', '',
]
(HERE/'REFERENCE-TEXT-MAP.md').write_text('\n'.join(report))
payload=dict(date='2026-10-09',manuscript=str(TEX),manuscriptSha256=digest(TEX),
 bibliographySha256=digest(HERE/'paper/references.bib'),
 coverage=dict(references=len(records),citationOccurrences=len(occurrences),abstractSentences=len(abstract_records)),
 references=records,abstract=abstract_records,numericalSource=str(stats_path),
 numericalSourceSha256=digest(stats_path),
 bounds='Supporting claim passages and identity checked; not every source page read or external replication.')
(HERE/'REFERENCE-TEXT-MAP.json').write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(payload['coverage']))
