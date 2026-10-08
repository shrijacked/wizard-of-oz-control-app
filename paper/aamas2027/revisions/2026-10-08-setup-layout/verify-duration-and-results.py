"""Independent recomputation from processed per-round data, not stored means."""
from pathlib import Path
import json
import numpy as np
from scipy.stats import ttest_rel, t

here = Path(__file__).resolve().parent
records = json.loads((here/'analysis/rounds-with-counts.json').read_text())['rounds']
results = json.loads((here/'analysis/statistics.json').read_text())
assert len(records) == 216
assert len({(r['participant'],r['round']) for r in records}) == 216
overlay = [r for r in records if r.get('durationConfirmationSource')]
assert [(r['round'],r['durationSeconds']) for r in overlay] == [(6,215),(7,200),(8,280),(9,300)]
assert all(r['participant']=='P111' and r['originalDurationSeconds'] is None for r in overlay)
for test in results['core_tests'] + results['piece_tests'] + results['secondary_tests']:
    metric = test['metric']
    cohort = results['cohorts']['availableRatings'] if metric not in ('success','correctPieces','durationSeconds') else results['cohorts']['duration']
    condition_a, condition_b = test['contrast'].split(' minus ')
    field = 'analysisSolved' if metric == 'success' else metric
    def values(condition):
        out=[]
        for participant in cohort:
            rows=[r for r in records if r['participant']==participant and r['condition']==condition]
            assert len(rows)==3
            vals=[r[field] if field in r else r['survey'][field] for r in rows]
            assert all(v is not None for v in vals)
            out.append(np.mean(vals)*(100 if metric=='success' else 1))
        return np.array(out)
    a,b=values(condition_a),values(condition_b)
    check=ttest_rel(a,b)
    diff=a-b
    margin=t.ppf(.975,len(diff)-1)*np.std(diff,ddof=1)/np.sqrt(len(diff))
    np.testing.assert_allclose([check.statistic,check.pvalue,np.mean(diff)], [test['t'],test['p'],test['mean_difference']],rtol=1e-9,atol=1e-12)
    np.testing.assert_allclose([np.mean(diff)-margin,np.mean(diff)+margin],test['ci95'],atol=1e-9)
    assert len(cohort)==test['n']
secondary=results['secondary_tests']
ranked=sorted(secondary,key=lambda x:x['p'])
running=0
for index,test in enumerate(ranked):
    running=max(running,min(1,(len(ranked)-index)*test['p']))
    np.testing.assert_allclose(running,test['holm_p'],atol=1e-12)
print('Verified 216 round joins, four duration overlays, all34 paired statistics/CIs and25-test Holm adjustment independently from round records.')
