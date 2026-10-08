#!/usr/bin/env python3
"""Refresh using immutable input snapshots; never edit original exports/workbook.

Run with bundled Python (NumPy, SciPy, openpyxl, reportlab). The formative
source is sanitized on initial import; subsequent runs use the sanitized CSV.
"""
from pathlib import Path
import copy, csv, hashlib, importlib.util, json, re, shutil
from collections import Counter
import numpy as np
from scipy import stats
import openpyxl
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
INPUT = HERE / 'inputs'
OUT = HERE / 'analysis'
OUT.mkdir(exist_ok=True)
HELPER = ROOT / 'outputs/hti-results-2026-10-08/relevant-files/analysis/paired-stats.py'
local_helper = HERE / 'paired-stats.py'
if not local_helper.exists(): shutil.copy2(HELPER, local_helper)
spec = importlib.util.spec_from_file_location('paired', local_helper)
paired = importlib.util.module_from_spec(spec)
spec.loader.exec_module(paired)

def dump(name, obj):
    (OUT / name).write_text(json.dumps(obj, indent=2, allow_nan=False) + '\n')

def write_csv(name, rows):
    with (OUT / name).open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader(); writer.writerows(rows)

data = json.loads((INPUT / 'consolidated-data.json').read_text())
demographics = json.loads((INPUT / 'experimental-demographics-audit.json').read_text())
assert len(demographics['records']) == len(data['participants']) == 24
for p in data['participants']:
    audited = next(r for r in demographics['records'] if r['participant'] == p['id'])
    assert all(audited['subject'][k] == p['profile'][k] for k in ('age', 'gender'))
supp = json.loads((INPUT / 'P111-retrospective-confirmation.json').read_text())
lookup = {(r['participant'], r['sessionId'], r['round']): r for r in data['rounds']}
assert len(lookup) == len(data['rounds']) == 216
p101_confirmation = json.loads((INPUT/'P101-researcher-confirmation.json').read_text())
for confirmed in p101_confirmation['rounds']:
    r = next(r for r in data['rounds'] if r['participant']=='P101' and r['round']==confirmed['round'])
    assert r['condition']==confirmed['condition'] and str(r['puzzle'])==confirmed['puzzle']
    assert r['analysisSolved']==int(confirmed['solved'])
    r['outcomeBasis']='researcher-confirmed-with-participant'
    r['outcomeConfirmationSource']='P101-researcher-confirmation.json'
wb = openpyxl.load_workbook(INPUT / 'HTI-piece-count-entry.xlsx', data_only=True)
entries, corrections, conflicts = [], [], []
for v in wb['Piece counts'].iter_rows(min_row=10, max_row=225, values_only=True):
    key = (v[0], v[32], v[1])
    r = lookup[key]
    assert v[2] == r['condition'] and str(v[3]) == str(r['puzzle']), key
    count = v[8]
    assert isinstance(count, (int, float)) and 0 <= count <= 7 and count == int(count), key
    revised = 7 if v[4] == 'Solved' else int(count)
    reason = 'Researcher instruction: previously solved rounds default to seven correct pieces.'
    if (v[0], v[1]) in (('P106', 5), ('P106', 7)):
        revised = 3 if v[1] == 5 else 5
        reason = 'Researcher correction in chat, 8 October 2026.'
    if (v[4] == 'Solved' and count < 7) or (v[4] == 'Unsolved' and count == 7):
        conflicts.append(dict(participant=v[0], round=v[1], priorOutcome=v[4], enteredCount=count, correctedCount=revised))
    if count != revised:
        corrections.append(dict(participant=v[0], round=v[1], enteredCount=count, correctedCount=revised, reason=reason))
    r['enteredCorrectPieces'] = int(count)
    r['correctPieces'] = revised
    r['countDerivedCompletion'] = int(revised == 7)
    r['countProvenance'] = 'Researcher-entered agreed count; chat adjudication overlay where specified.'
    r['countEvidenceSource'] = v[9]
    r['countEvidenceReference'] = v[10]
    entries.append(dict(participant=v[0], sessionId=v[32], round=v[1], condition=v[2], puzzle=v[3], priorOutcome=v[4], enteredCount=count, correctPieces=revised, evidenceSource=v[9], evidenceReference=v[10]))
assert len({(e['participant'], e['sessionId'], e['round']) for e in entries}) == 216

for sr in supp['rounds']:
    r = lookup[('P111', supp['sessionId'], sr['round'])]
    assert r['condition'] == sr['condition'] and r['puzzle'] == sr['puzzle']
    r['analysisSolved'] = int(sr['solved'])
    if sr['round'] >= 6:
        r['outcomeBasis'] = 'researcher-confirmed'
        r['survey'] = sr['retrospectiveRatings']
        r['tlx100'] = sr['derivedTlx100']
        r['ratingProvenance'] = 'retrospective'
    else:
        r['ratingProvenance'] = 'immediate'

duration_confirmation = json.loads((INPUT/'P111-duration-confirmation.json').read_text())
for confirmed in duration_confirmation['rounds']:
    r = lookup[('P111', duration_confirmation['sessionId'], confirmed['round'])]
    assert r['condition'] == confirmed['condition'] and r['puzzle'] == confirmed['puzzle']
    assert r['durationSeconds'] is None
    r['originalDurationSeconds'] = r['durationSeconds']
    r['durationSeconds'] = confirmed['durationSeconds']
    r['durationProvenance'] = 'researcher-confirmed elapsed duration; pause adjustment not separately documented'
    r['durationConfirmationSource'] = 'P111-duration-confirmation.json'

people = sorted((p['id'] for p in data['participants']), key=lambda p:int(p[1:]))
original_ratings = [p for p in people if p != 'P111']
rating_cohort = people  # User requests all completed ratings in the main analysis.
confirmed_outcomes = [p for p in people if p != 'P101']
means = {}
for p in people:
    means[p] = {}
    for c in paired.CONDITIONS:
        rounds = [r for r in data['rounds'] if r['participant'] == p and r['condition'] == c]
        assert len(rounds) == 3
        vals = dict(correctPieces=float(np.mean([r['correctPieces'] for r in rounds])),
                    enteredCorrectPieces=float(np.mean([r['enteredCorrectPieces'] for r in rounds])),
                    countDerivedSuccess=float(np.mean([r['correctPieces'] == 7 for r in rounds])),
                    tlx100=float(np.mean([r['tlx100'] for r in rounds])),
                    success_working=float(np.mean([r['analysisSolved'] for r in rounds])))
        vals['success'] = vals['success_working']
        if p in confirmed_outcomes:
            assert all(r['analysisSolved'] in (0,1) for r in rounds)
            vals['recordedSuccess'] = vals['success_working']
        if all(r['durationSeconds'] is not None for r in rounds):
            vals['durationSeconds'] = float(np.mean([r['durationSeconds'] for r in rounds]))
        for k in paired.RATING_KEYS + paired.HELP_KEYS:
            ratings = [r['survey'].get(k) for r in rounds]
            if all(isinstance(v,(float,int)) and 1 <= v <= 7 for v in ratings):
                vals[k] = float(np.mean(ratings))
        computed = [((sum(r['survey'][k] if k != 'performance' else 8-r['survey'][k] for k in paired.RATING_KEYS)/6)-1)*100/6 for r in rounds]
        np.testing.assert_allclose(np.mean(computed), vals['tlx100'], atol=1e-8)
        means[p][c] = vals

def tests(metric, cohort, scale=1, unit='points', pairs=None):
    return [paired.paired_result(metric, a, b, cohort, means, scale=scale, unit=unit)
            for a,b in (pairs or paired.PAIRS)]

core = tests('success', people, 100, 'percentage points') + tests('tlx100', rating_cohort, unit='adapted TLX points')
pieces = tests('correctPieces', people, unit='pieces out of seven')
secondary = tests('durationSeconds', people, unit='seconds')
for k in paired.HELP_KEYS:
    secondary += tests(k, rating_cohort, pairs=[('adaptive','constant')])
for k in paired.RATING_KEYS:
    secondary += tests(k, rating_cohort)
assert len(secondary) == 25
for rows in (core, pieces, secondary):
    for k,outkey in [('p','holm_p'),('signflip_p','holm_signflip_p'),('wilcoxon_p','holm_wilcoxon_p')]:
        paired.adjust_family(rows, k, outkey)
all_tests = core + pieces + secondary
paired.adjust_family(all_tests, outkey='holm_all_34_p')
paired.adjust_family(core + pieces, outkey='holm_nine_p')
old_secondary = tests('durationSeconds', people, unit='seconds')
for k in paired.HELP_KEYS:
    old_secondary += tests(k, original_ratings, pairs=[('adaptive','constant')])
for k in paired.RATING_KEYS:
    old_secondary += tests(k, original_ratings)
sensitivities = {
    'unadjudicated_entered_counts': tests('enteredCorrectPieces',people,unit='pieces out of seven'),
    'original_immediate_rating_cohort_core_family': tests('success',people,100,'percentage points') + tests('tlx100',original_ratings,unit='adapted TLX points'),
    'original_immediate_rating_cohort_secondary_family': old_secondary,
    'confirmed_recorded_completion_P101_excluded': tests('recordedSuccess',confirmed_outcomes,100,'percentage points'),
    'count_derived_completion_all24': tests('countDerivedSuccess',people,100,'percentage points'),
    'P101_previous_working_completion_included': tests('success_working',people,100,'percentage points'),
    'third_laptop_excluded': tests('correctPieces',[p['id'] for p in data['participants'] if p['deviceGroup'] != 'third-laptop'],unit='pieces out of seven'),
    'P111_duration_confirmation_excluded_25_test_family': tests('durationSeconds',original_ratings,unit='seconds') + copy.deepcopy(secondary[3:])
}
for rows in sensitivities.values(): paired.adjust_family(rows)
omnibus = {}
for metric, cohort in [('correctPieces',people),('success',people),('tlx100',rating_cohort),('frustration',rating_cohort)]:
    fr = stats.friedmanchisquare(*[[means[p][c][metric] for p in cohort] for c in paired.CONDITIONS])
    omnibus[metric] = dict(n=len(cohort),statistic=float(fr.statistic),p=float(fr.pvalue),method='Friedman chi-square approximation; exploratory, unadjusted')

def descriptive(metric, cohort):
    result = {}
    for c in paired.CONDITIONS:
        values = np.array([means[p][c][metric] for p in cohort])
        result[c] = dict(n=len(cohort),mean=float(values.mean()),sd=float(values.std(ddof=1)),median=float(np.median(values)))
    return result

final_surveys = [p['final'] for p in data['participants'] if p.get('final')]
assert len(final_surveys) == 14
final_surveys.append(supp['retrospectiveFinalRatings'])
final_descriptive = {}
for key in ['overallHelpfulness', 'overallEfficacy', 'trust', 'automationBias']:
    values = np.array([float(s[key]) for s in final_surveys])
    assert len(values) == 15 and np.all((values >= 1) & (values <= 7))
    final_descriptive[key] = dict(n=len(values), mean=float(values.mean()), sd=float(values.std(ddof=1)))

result = dict(analysisDate='2026-10-08',participants=24,rounds=216,
    experimentalDemographics={k:demographics[k] for k in ['exportedAge','exportedGender','exportedGenderByDevice','researcherConfirmedGender','participantTypes','genderStatus','conclusion']},
    countCorrections=corrections,originalConflicts=conflicts,conditionOrders=dict(Counter(p['order'] for p in data['participants'])),
    completionDefinition='All24 confirmed binary outcomes: recorded exports plus researcher-confirmed P111 missing outcomes and all P101 previously inferred outcomes confirmed with P101 on8October. Raw exports unchanged. Count-derived and earlier23-person analyses retained as sensitivities.',
    scoringMethod='Researcher-confirmed: correct pieces noted and photographed; retain highest correct-piece count across admissible orientations. Per-round photo references and independent reliability unavailable.',
    durationConfirmation=duration_confirmation,
    descriptive={k:descriptive(k,cohort) for k,cohort in [('correctPieces',people),('success',people),('tlx100',rating_cohort),('durationSeconds',people),('frustration',rating_cohort)]+[(k,rating_cohort) for k in paired.RATING_KEYS]},
    assistanceDescriptive={k:{c:dict(n=len(rating_cohort),mean=float(np.mean([means[p][c][k] for p in rating_cohort])),sd=float(np.std([means[p][c][k] for p in rating_cohort],ddof=1))) for c in ['constant','adaptive']} for k in paired.HELP_KEYS},
    finalDescriptive=final_descriptive,
    core_tests=core,piece_tests=pieces,secondary_tests=secondary,sensitivities=sensitivities,friedman=omnibus,
    participantMeans=means,cohorts=dict(pieceCounts=people,primaryConfirmedCompletion=people,previousRecordedCompletionSensitivity=confirmed_outcomes,availableRatings=rating_cohort,previousImmediateRatingsSensitivity=original_ratings,duration=people),
    limitations=['All tests exploratory; endpoint families selected after viewing prior results, not preregistered.',
        'Each participant contributes one three-round mean per condition; 216 rows are not 216 independent people.',
        'Participant paired comparisons do not adjust for puzzle, order, device, or period effects.',
        'Researcher confirms correct pieces were noted and photographed, taking the maximum across admissible orientations. Per-row source/reference fields remain blank; photographs have not been independently audited and scorer reliability is unavailable.',
        'Primary completion includes all24: P101 previously inferred outcomes confirmed by researcher with P101; P111 missing outcomes researcher-confirmed. Raw binary export fields retained, confirmation is an overlay. Earlier n23 analysis is a sensitivity.',
        'Completion and piece counts share the scoring source; some solved rounds received seven by instruction, so they are not independent evidence.',
        'Primary ratings now include all24 at researcher request. P111 R6–9 remain retrospective in source provenance; main analysis is all-available ratings, not an all-immediate cohort. Original23-person immediate-rating core/secondary families remain sensitivities. R6–9 durations 215/200/280/300 seconds are researcher-confirmed overlays, not imputed timestamps; pause adjustment not separately documented. Duration n24, sensitivity excludes P111 (n23).',
        'Third-laptop future-dated timestamps remain uncorrected; sessions confirmed actual by researcher.',
        'Adapted unweighted 1–7 TLX is not the original weighted NASA-TLX; confidence intervals are pointwise, not simultaneous.',
        'College-recruited sample, exported ages 20–27: mostly undergraduates, also faculty and graduate students/researchers; exact role counts unavailable.',
        'Experimental gender totals researcher-confirmed as 14 men/10 women, superseding export-coded 18/six only in aggregate reporting. Individual fields not recoded; no gender-subgroup conclusions.'])
dump('statistics.json',result)
dump('count-adjudication.json',dict(instruction='Solved should default to 7; P106 R5 was 3, R7 was 5.',corrections=corrections,originalConflicts=conflicts))
write_csv('piece-counts-adjudicated.csv',entries)
flat = []
for p in people:
    for c in paired.CONDITIONS: flat.append(dict(participant=p,condition=c,**means[p][c]))
keys = list(dict.fromkeys(k for row in flat for k in row))
write_csv('participant-condition-means.csv',[{k:row.get(k) for k in keys} for row in flat])
write_csv('paired-tests.csv',[{k:r.get(k) for k in ['metric','contrast','n','df','mean_a','mean_b','mean_difference','t','p','holm_p','holm_nine_p','holm_all_34_p','ci95','cohens_dz','signflip_p','holm_signflip_p','wilcoxon_p','holm_wilcoxon_p']} for r in all_tests])
# Profile-free reproduction input (no optional final free text or age/gender).
dump('rounds-with-counts.json',{'rounds':[{k:r.get(k) for k in ['participant','sessionId','round','condition','puzzle','status','rawSolved','analysisSolved','outcomeBasis','outcomeConfirmationSource','countDerivedCompletion','durationSeconds','originalDurationSeconds','durationProvenance','durationConfirmationSource','survey','tlx100','enteredCorrectPieces','correctPieces','countProvenance','countEvidenceSource','countEvidenceReference','ratingProvenance','deviceGroup']} for r in data['rounds']]})

sanitized = INPUT / 'formative-responses-sanitized.csv'
formative_source = Path('/Users/rishit/Downloads/formative-assessment-50/responses/completed-responses.csv')
if not sanitized.exists():
    with formative_source.open(newline='') as f: source_rows = list(csv.reader(f))
    assert len(source_rows) == 51 and source_rows[0][1] == 'Username'
    headers = ['Respondent ID'] + [h.strip() for i,h in enumerate(source_rows[0]) if i != 1]
    with sanitized.open('w',newline='') as f:
        writer = csv.writer(f); writer.writerow(headers)
        for n,row in enumerate(source_rows[1:],1):
            writer.writerow([f'F{n:03d}']+[re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[email removed]',v) for i,v in enumerate(row) if i != 1])
    dump('formative-import.json',dict(originalSource=str(formative_source),originalSha256=hashlib.sha256(formative_source.read_bytes()).hexdigest(),n=50,removedField='Username',filtering='No respondent excluded due to blank or placeholder username/email. Free-text email-like tokens redacted.'))
with sanitized.open(newline='') as f: formative_rows = list(csv.reader(f))
headers, rows = formative_rows[0], formative_rows[1:]
# Respondent ID replaces Username, so other original indices remain unchanged.
assert len(rows) == 50 and all(len(r)==17 and all(r[i].strip() for i in range(2,16)) for r in rows)
formative = dict(n=50,demographics={},categories={},numeric={})
for i,name in [(2,'role'),(4,'gender'),(5,'familiarity'),(6,'outcome'),(8,'time'),(9,'stuck')]:
    formative['categories'][name] = dict(Counter(r[i] for r in rows))
for i,name in [(3,'age'),(7,'difficulty'),(11,'robot'),(12,'video'),(13,'text'),(14,'simplerPuzzle'),(15,'robotComparedWithVideo')]:
    vals = [int(re.match(r'\d+',r[i]).group()) for r in rows]
    formative['numeric'][name] = dict(n=50,mean=float(np.mean(vals)),sd=float(np.std(vals,ddof=1)),median=float(np.median(vals)),counts=dict(Counter(vals)))
formative['assistanceMultiSelect'] = dict(Counter(s.strip() for r in rows for s in r[10].split(';')))
formative['anyStuck'] = sum(r[9] != 'Never' for r in rows)
formative['commentsAvailable'] = sum(bool(r[16].strip()) for r in rows)
formative['ratingInterpretation'] = 'Independent 1–5 expected-helpfulness ratings, not forced ranks; lower is more helpful. Descriptive only.'
dump('formative-summary.json',formative)

# Compact one-column vector plot. Remove former completion/outcomes graph;
# retain expected-helpfulness only. Error bars show SD, not inferential CIs.
chart = canvas.Canvas(str(OUT/'formative-helpfulness.pdf'),pagesize=(250,145))
chart.setFont('Helvetica',8)
chart.drawString(7,133,'Expected helpfulness (n = 50; lower = better)')
x0,x1,y0=86,214,31
for value in range(1,6):
    x=x0+(value-1)*(x1-x0)/4
    chart.setStrokeColor(HexColor('#dddddd')); chart.line(x,y0,x,120)
    chart.setFillColor(HexColor('#333333')); chart.drawCentredString(x,18,str(value))
for j,(key,label) in enumerate([('simplerPuzzle','Simpler puzzle'),('text','Text hint'),('video','Video tutorial'),('robot','Robot demonstration')]):
    y=113-j*24; v=formative['numeric'][key]; x=x0+(v['mean']-1)*(x1-x0)/4; sd=v['sd']*(x1-x0)/4
    chart.setFillColor(HexColor('#333333')); chart.drawRightString(80,y-3,label)
    chart.setStrokeColor(HexColor('#576477')); chart.line(x-sd,y,x+sd,y); chart.line(x-sd,y-3,x-sd,y+3); chart.line(x+sd,y-3,x+sd,y+3)
    chart.setFillColor(HexColor('#266B89')); chart.circle(x,y,3,fill=1,stroke=0)
    chart.setFillColor(HexColor('#333333')); chart.drawRightString(245,y-3,f"{v['mean']:.2f}")
chart.setFont('Helvetica',7); chart.drawString(7,5,'Dots: means; error bars: between-respondent SD.')
chart.save()

lines = ['# Updated analysis — 8 October 2026','',
    '24 participants (P101, P103–P125); 216 agreed counts. Original workbook preserved. Nine entered-count conflicts adjudicated using the researcher instruction: solved → 7, P106 R5 → 3, R7 → 5. Original binary outcomes not silently replaced by count-derived completion.','',
    '## Experimental demographics — researcher-confirmed aggregate','','Researcher-confirmed mix: mostly undergraduates, with faculty and graduate students/researchers; exact role counts unavailable. Exported ages20–27, mean21.96 SD2.01. Researcher confirmed14 men/10 women (58.3%/41.7%, ratio7:5) for descriptive reporting. Raw fields code18/six and match source forms; those fields are retained unchanged, without guessing corrected participant IDs. See DEMOGRAPHICS_AUDIT.md. Neither gender nor role is used in condition comparisons; no individual gender-subgroup analysis.','',
    '## Correct pieces (all 24 participants)','','Mean correct pieces per puzzle, out of seven: '+', '.join(f"{c} {result['descriptive']['correctPieces'][c]['mean']:.3f} (SD {result['descriptive']['correctPieces'][c]['sd']:.3f})" for c in paired.CONDITIONS)+'.','',paired.table(pieces),'',
    '## Completion and adapted workload','','Primary completion and workload now use all24 participants. P101/P111 confirmations are overlays, not fabricated original events. Totals: control11/72, constant43/72, adaptive36/72 (90/216 overall). Workload includes retrospective P111 at researcher request; source collection timing remains recorded. The previous23-person immediate-rating core/secondary families and count-based completion remain sensitivities.','',paired.table(core),'',
    '## Secondary tests','','Holm correction across25 tests; duration and primary ratings now use all24. Researcher-confirmed P111 R6/R7/R8/R9 durations=215/200/280/300 seconds are overlays; retrospective ratings preserve their source provenance. Earlier immediate-rating and duration-excluding-P111 families remain sensitivities.','',paired.table(secondary),'',
    '## Interpretation','','Compare raw and Holm-adjusted p values, 95% pointwise paired-difference CIs, and dz. Negative adaptive-minus-constant workload/frustration means less reported burden with adaptive; positive count/completion means better adaptive task performance. Nonsignificance does not establish equivalence. These exploratory tests are not evidence that a heart-rate trigger measures stress accurately. The statistics JSON also contains stricter nine-test and all-34-test corrections and exact sign-flip/Wilcoxon sensitivity checks.','',
    '## Formative assessment (50 substantive responses)','','All 50 retained regardless of placeholder usernames/emails; Username removed from analysis copy. Outcome: 28 complete, 18 partial, four not solved. 37/50 reported getting stuck at least once. '+f"Age M={formative['numeric']['age']['mean']:.2f}, SD={formative['numeric']['age']['sd']:.2f}."+' Expected helpfulness (1 most helpful, 5 least helpful): '+', '.join(f"{k} M={formative['numeric'][k]['mean']:.2f}, SD={formative['numeric'][k]['sd']:.2f}" for k in ['simplerPuzzle','text','video','robot'])+'. These are descriptive expectations, not demonstrated robot efficacy. One compact graph retained; completion is reported in prose instead of a second graph.','',
    '## Sensitivity analyses','']
for name,tests_ in sensitivities.items(): lines += ['### '+name,'',paired.table(tests_),'']
lines += ['## How calculated','','For each participant and condition, average the three round values. Pair condition means within people; two-sided paired t tests. Holm correction is applied separately to six core, three new piece-count, and 25 secondary tests, plus stricter combined adjustments. Exact sign-flip and signed-rank checks enumerate all sign assignments (ties retained, zero differences excluded). Friedman is an exploratory omnibus check.','',
    'Adapted unweighted TLX: reverse performance as 8 − performance, then ((mean of six burden ratings) − 1) × 100 / 6. The six items are mental, physical, temporal demand, reversed performance, effort, frustration. All are 1–7; no weighting interview was administered. Do not call this original weighted NASA-TLX.','',
    '## Limitations','']+['- '+s for s in result['limitations']]
(OUT/'ANALYSIS.md').write_text('\n'.join(lines)+'\n')
dump('input-hashes.json',{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in INPUT.iterdir() if p.is_file()})
print(json.dumps(dict(countRows=len(entries),corrections=len(corrections),pieceMeans=result['descriptive']['correctPieces'],pieceTests=[{k:r[k] for k in ['contrast','mean_difference','p','holm_p','holm_nine_p','holm_all_34_p']} for r in pieces],formativeN=50),indent=2))
