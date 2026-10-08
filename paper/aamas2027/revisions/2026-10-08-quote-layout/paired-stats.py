#!/usr/bin/env python3
"""Participant-level exploratory tests and fixed-horizon sensitivity scenarios.

Requires Python 3, NumPy and SciPy. Does not modify original study exports.
Run: python3 analyse.py [--input consolidated-data.json] [--out output-directory]
The generated analysis-input.json is a profile-free, sufficient reproduction input.
"""
import argparse
import hashlib
import itertools
import json
import math
from collections import Counter
from pathlib import Path

import numpy as np
import scipy
from scipy import integrate, optimize, stats

HERE = Path(__file__).resolve().parent
CONDITIONS = ("control", "constant", "adaptive")
PAIRS = (("constant", "control"), ("adaptive", "control"), ("adaptive", "constant"))
CORE_SIZE = 6
ALPHA = .05
PLANNED = 24
RATING_KEYS = ("mentalDemand", "physicalDemand", "temporalDemand", "performance", "effort", "frustration")
HELP_KEYS = ("helpfulness", "timingEffectiveness", "clarityAndDistraction", "stressReduction")


def holm(pvalues):
    p = np.asarray(pvalues, dtype=float)
    order = np.argsort(p, kind="stable")
    adjusted = np.empty(len(p))
    adjusted[order] = np.minimum(1, np.maximum.accumulate(p[order] * np.arange(len(p), 0, -1)))
    return adjusted.tolist()


def exact_checks(differences):
    # Round only for zero/tie detection. Means, t-tests and CIs use unrounded data.
    d = np.round(np.asarray(differences, dtype=float), 10)
    d = d[d != 0]
    m = len(d)
    if not m:
        return dict(nonzero_pairs=0, positive_pairs=0, negative_pairs=0,
                    sign_p=1., signflip_p=1., wilcoxon_p=1., wilcoxon_statistic=0.)
    assert m <= 30, "Meet-in-the-middle exact enumeration supports up to 30 nonzero pairs."
    ranks = stats.rankdata(np.abs(d), method="average")
    def signed_sums(values):
        sums = np.array([0.])
        for value in values:
            sums = np.concatenate((sums-value, sums+value))
        return sums
    def exact_two_sided(values, observed):
        threshold = abs(observed)
        if threshold < 1e-8:
            return 1.
        midpoint = len(values)//2
        left = signed_sums(values[:midpoint])
        right = np.sort(signed_sums(values[midpoint:]))
        lower = np.searchsorted(right, -threshold-left+1e-8, side='right')
        upper = len(right)-np.searchsorted(right, threshold-left-1e-8, side='left')
        return float(np.sum(lower+upper)/(2**len(values)))
    # All 2**m sign assignments counted exactly, without a large 2**m × m matrix.
    signflip = exact_two_sided(np.abs(d), d.sum())
    wilcoxon = exact_two_sided(ranks, np.dot(np.sign(d), ranks))
    positives = int(np.sum(d > 0))
    return dict(nonzero_pairs=m, positive_pairs=positives, negative_pairs=m-positives,
                sign_p=float(stats.binomtest(positives, m, .5).pvalue),
                signflip_p=float(signflip), wilcoxon_p=float(wilcoxon),
                wilcoxon_statistic=float(min(ranks[d > 0].sum(), ranks[d < 0].sum())))


def paired_result(metric, a, b, people, means, scale=1, unit="points", checks=True):
    av = np.array([means[p][a][metric] for p in people], float) * scale
    bv = np.array([means[p][b][metric] for p in people], float) * scale
    d = av - bv
    n = len(d)
    res = stats.ttest_rel(av, bv)
    direct = stats.ttest_1samp(d, 0)
    np.testing.assert_allclose([res.statistic, res.pvalue], [direct.statistic, direct.pvalue], rtol=1e-10)
    sd = float(d.std(ddof=1))
    se = sd / math.sqrt(n)
    ci = float(stats.t.ppf(.975, n-1)) * se
    family_ci = float(stats.t.ppf(1-ALPHA/(2*CORE_SIZE), n-1)) * se
    output = dict(metric=metric, a=a, b=b, contrast=f"{a} minus {b}", unit=unit, n=n, df=n-1,
                  mean_a=float(av.mean()), mean_b=float(bv.mean()), mean_difference=float(d.mean()),
                  paired_sd=sd, t=float(res.statistic), p=float(res.pvalue),
                  ci95=[float(d.mean()-ci), float(d.mean()+ci)],
                  bonferroni_six_ci=[float(d.mean()-family_ci), float(d.mean()+family_ci)],
                  cohens_dz=float(d.mean()/sd), participants=people,
                  differences=dict(zip(people, d.tolist())))
    if checks:
        output.update(exact_checks(d))
    return output


def adjust_family(rows, key="p", outkey="holm_p"):
    for row, adj in zip(rows, holm([r[key] for r in rows])):
        row[outkey] = adj


def aggregate(data):
    complete = [p['id'] for p in data['participants'] if p['cohort'] == 'complete']
    means = {}
    for person in complete:
        means[person] = {}
        for condition in CONDITIONS:
            rounds = [r for r in data['rounds'] if r['participant'] == person and r['condition'] == condition and r['status'] == 'completed']
            assert len(rounds) == 3, (person, condition, len(rounds))
            workloads = []
            for r in rounds:
                q = r['survey']
                assert all(isinstance(q.get(k), (int, float)) and 1 <= q[k] <= 7 for k in RATING_KEYS)
                tlx = (sum(q[k] if k != 'performance' else 8-q[k] for k in RATING_KEYS)/6-1)*100/6
                np.testing.assert_allclose(tlx, r['tlx100'], atol=1e-9)
                workloads.append(tlx)
            values = dict(tlx100=float(np.mean(workloads)),
                          durationSeconds=float(np.mean([r['durationSeconds'] for r in rounds])),
                          success_working=float(np.mean([r['analysisSolved'] for r in rounds])))
            if all(r['rawSolved'] in (0, 1) and r['outcomeBasis'] == 'recorded' for r in rounds):
                values['success'] = float(np.mean([r['rawSolved'] for r in rounds]))
            for key in RATING_KEYS + HELP_KEYS:
                observed = [r['survey'].get(key) for r in rounds]
                if all(isinstance(v, (int, float)) for v in observed):
                    values[key] = float(np.mean(observed))
            means[person][condition] = values
    recorded = [p for p in complete if all('success' in means[p][c] for c in CONDITIONS)]
    assert recorded == [p for p in complete if p != 'P101']
    assert len(complete) >= 3 and len(recorded) == len(complete)-1
    return complete, recorded, means


def combined(old, k, future_mean, future_sd):
    old = np.asarray(old, float)
    n = len(old)+k
    S = float(old.sum()) + k*future_mean
    Q = float(old @ old) + (k-1)*future_sd**2 + k*future_mean**2
    sd = math.sqrt(max(0, (Q-S*S/n)/(n-1)))
    t = S/n/(sd/math.sqrt(n))
    return dict(n=n, future_n=k, future_mean_difference=future_mean, future_sd=future_sd,
                combined_mean_difference=S/n, combined_sd=sd, t=t,
                p=float(2*stats.t.sf(abs(t), n-1)))


def compositions(total, bins):
    if bins == 1:
        yield (total,)
        return
    for i in range(total+1):
        for tail in compositions(total-i, bins-1):
            yield (i,)+tail


def success_scenarios(old_rates, k):
    old_counts = np.asarray(old_rates)*3
    records = []
    for hist in compositions(k, 7):
        values = np.repeat(np.arange(-3, 4), hist)
        S = int(values.sum())
        result = combined(old_counts, k, float(values.mean()), float(values.std(ddof=1)))
        records.append(dict(future_histogram=dict(zip(map(str, range(-3, 4)), hist)),
                            future_total_count_difference=S,
                            future_mean_count_difference=S/k, **result))
    cutoffs = []
    for direction in ('adaptive', 'constant'):
        for alpha in (.05, .025, .05/6):
            passed = [r for r in records if r['p'] < alpha and
                      (r['combined_mean_difference'] > 0 if direction == 'adaptive' else r['combined_mean_difference'] < 0)]
            # Smallest directional aggregate difference that can pass, not a sufficient rule for all variances.
            best = min(passed, key=lambda r: (r['future_total_count_difference'] if direction == 'adaptive'
                                              else -r['future_total_count_difference'], r['p'])) if passed else None
            cutoffs.append(dict(direction=direction, alpha=alpha, minimum_aggregate_example=best))
    illustrative = []
    for count_difference in (-1, 0, 1, 2, 3):
        illustrative.append(dict(description=f'Each new participant has adaptive minus constant = {count_difference} solved puzzles',
                                 **combined(old_counts, k, count_difference, 0)))
    return dict(difference_unit='solved puzzles out of three',
                interpretation='Hypothetical sufficient statistics, not desired outcomes or instructions to operators. Outcomes with the same mean can have different p-values.',
                all_possible_histograms=len(records), cutoffs=cutoffs, illustrative=illustrative,
                all_histograms=records)


def workload_scenarios(old, k):
    old = np.asarray(old, float)
    sd = float(old.std(ddof=1))
    examples = [combined(old, k, m, sd) for m in (-5, -10, -15, -20, -25, -30)]
    thresholds = []
    for future_sd in (sd, sd/2):
        for alpha in (.05, .025, .05/6):
            def objective(magnitude):
                return combined(old, k, -magnitude, future_sd)['p']-alpha
            if objective(100) < 0:
                root = optimize.brentq(objective, 0, 100)
                thresholds.append(dict(alpha=alpha, assumed_future_sd=future_sd,
                                       required_future_mean_adaptive_minus_constant=-root,
                                       **combined(old, k, -root, future_sd)))
    return dict(unit='adapted rescaled TLX points', illustrative=examples, thresholds=thresholds,
                interpretation='Assumes the future sample SD stated. Thresholds are conditional t-test scenarios, not forecasts or outcomes to engineer.')


def t_power(n, dz, alpha):
    critical = stats.t.ppf(1-alpha/2, n-1)
    nc = abs(dz)*math.sqrt(n)
    value = stats.nct.sf(critical, n-1, nc)+stats.nct.cdf(-critical, n-1, nc)
    if not np.isfinite(value):
        # Some SciPy versions return NaN for extremely small noncentral-t tails.
        # Independent representation: T=(Z+nc)/sqrt(V/df), V~chi-square(df).
        df = n-1
        def integrand(v):
            threshold = critical*math.sqrt(v/df)
            return (stats.norm.cdf(nc-threshold)+stats.norm.cdf(-nc-threshold))*stats.chi2.pdf(v, df)
        value = integrate.quad(integrand, 0, np.inf, epsabs=1e-9)[0]
    return float(value)


def planning(sd_success, sd_tlx, n_success, n_tlx):
    examples = []
    for name, sd, unit, effects, n_final in (
        ('success', sd_success, 'percentage points', (10, 20), n_success),
        ('tlx100', sd_tlx, 'adapted workload points', (5, 10), n_tlx)):
        for effect, multiplier, alpha in itertools.product(effects, (1, 1.5), (.05, .05/6)):
            scaled_sd = sd*multiplier
            dz = effect/scaled_sd
            needed = next(n for n in range(3, 5001) if t_power(n, dz, alpha) >= .8)
            examples.append(dict(metric=name, meaningful_difference=effect, unit=unit,
                                 assumed_paired_sd=scaled_sd, pilot_sd_multiplier=multiplier,
                                 alpha=alpha, cohens_dz=dz, n_for_80_percent_power=needed,
                                 planned_analyzable_n=n_final,
                                 power_at_planned_n=t_power(n_final, dz, alpha)))
    detectable = []
    for name, sd, n in [('success', sd_success, n_success), ('tlx100', sd_tlx, n_tlx)]:
        for alpha in (.05, .05/6):
            dz = optimize.brentq(lambda d: t_power(n, d, alpha)-.8, .001, 5)
            detectable.append(dict(metric=name, n=n, alpha=alpha, detectable_dz=dz,
                                   minimum_difference_for_80_percent_power=dz*sd))
    return dict(note='Prospective normal paired-difference approximation with pilot SDs, not post-hoc observed power. Example meaningful effects are not prespecified study endpoints. Bounded discrete success especially needs simulation at design stage.',
                examples=examples, detectable=detectable)


def pformat(p):
    return f'{p:.6f}' if p >= .0001 else f'{p:.3g}'


def table(rows, secondary=False):
    lines = ['| Measure | Contrast | n | Difference | 95% CI (unadjusted) | t (df) | Raw p | Holm p | dz |',
             '|---|---|---:|---:|---|---|---:|---:|---:|']
    for r in rows:
        lo, hi = r['ci95']
        lines.append(f"| {r['metric']} ({r['unit']}) | {r['contrast']} | {r['n']} | {r['mean_difference']:.3f} | [{lo:.3f}, {hi:.3f}] | {r['t']:.3f} ({r['df']}) | {pformat(r['p'])} | {pformat(r['holm_p'])} | {r['cohens_dz']:.3f} |")
    return '\n'.join(lines)


def report(result):
    core, secondary = result['core_tests'], result['secondary_tests']
    text = f'''# HTI interim statistical analysis — 7 October 2026

## Bottom line

Both constant and adaptive assistance show higher solve rates and lower reported workload than control in participant-level paired tests. All four comparisons pass Holm correction across the six core tests. **There is no established constant–adaptive difference** in success or workload. A nonsignificant comparison is not evidence of equivalence.

These are exploratory interim analyses chosen after viewing the data, not preregistered confirmatory tests. Significance depends on the model, the test family and the data-quality rules. It does not by itself establish practical importance or validate a physiological mechanism.

## Sample and calculations

- 14 complete nine-round sessions; P111 has five completed rounds. P102 is excluded. P125 is setup only; historical P119 is not another completed participant.
- Scheduling: count P111 as done, as requested. **15 of 24 slots used; 9 future participants remain.** Assuming those nine complete all conditions, workload will have 23 complete paired observations and recorded success will have 22. This is not 24 analyzable complete participants: P111 is incomplete, and P101 lacks recorded binary outcomes.
- Success main analysis: 13 complete participants with recorded outcomes. P101 is excluded only from success; its actual questionnaire/duration data remain in those analyses. P101 working inference and R9 sensitivity are reported separately below.
- Each participant contributes the mean of their three rounds per condition. Paired differences, not individual rounds, are the analysis units.
- Success differences are percentage points; success rates are 12.82% control, 56.41% constant, 48.72% adaptive in the 13-participant recorded cohort.
- Workload is the adapted unweighted 7-point NASA-TLX composite, linearly rescaled to 0–100. Reverse performance as `8 − performance`, average the six items, then transform `(mean − 1) × 100 / 6`. All 126 complete-session composites were independently recomputed and checked. Means: control 64.68, constant 49.87, adaptive 49.07. Lower means less subjective workload. It is not the original validated weighted NASA-TLX scale.
- All tests are two-sided. Positive differences mean more of the named outcome in the first condition. For success that is favorable; for workload/duration it is unfavorable.
- Six core tests: three condition comparisons for recorded success and three for workload. Holm controls this family at .05. These endpoints/families are explicitly analyst-defined now, not claimed as preregistered. The 95% CIs shown below are pointwise, **not multiplicity-adjusted**. JSON also contains conservative six-test Bonferroni simultaneous CIs.

## Core paired t-tests

{table(core)}

`dz` is mean paired difference divided by the sample SD of paired differences. With small samples it is uncertain; it is not an independent-groups effect size.

## Robustness checks

Success counts are bounded/discrete (0–3 per condition), and small samples contain ties and zeros. The t-test is therefore an approximation. Workload also derives from ordinal responses. The following exact conditional checks examine whether conclusions depend on using the t-test:

| Measure | Contrast | Exact paired sign-flip p | Holm sign-flip p | Exact Wilcoxon p | Holm Wilcoxon p | Sign-test p |
|---|---|---:|---:|---:|---:|---:|
'''
    for r in core:
        text += f"| {r['metric']} | {r['contrast']} | {pformat(r['signflip_p'])} | {pformat(r['signflip_holm_p'])} | {pformat(r['wilcoxon_p'])} | {pformat(r['wilcoxon_holm_p'])} | {pformat(r['sign_p'])} |\n"
    text += '''
The four assistance-versus-control conclusions also pass the exact sign-flip and Wilcoxon six-test corrections. Each robustness method has its own six-test Holm family; these are checks, not extra opportunities to select a significant method. Sign-flip and Wilcoxon calculations enumerate every sign assignment after removing exactly zero differences. Average ranks handle ties. They require a symmetric/exchangeable paired-difference null; “exact” is not “assumption-free.” Sign tests use only the direction of nonzero differences and do not require symmetry. They are lower-power and their p-values in this table are unadjusted; adjusted values are in JSON. Normality tests were not used to choose a favorable procedure.

### Omnibus comparisons

Friedman tests compare all three conditions within participants. Their chi-square p-values are asymptotic, not exact (particularly important with three conditions and a small sample):

'''
    for r in result['friedman']:
        text += f"- {r['metric']}: n={r['n']}, chi-square={r['statistic']:.3f}, df=2, p={pformat(r['p'])}, Kendall W={r['kendalls_w']:.3f}.\n"
    text += '''
## Secondary exploratory outcomes

Round duration is exported elapsed round time across successes and failures, **not time-to-solution**. Helpfulness, timing, clarity/seamlessness and stress reduction compare only the two assistance conditions. Higher ratings are favorable for these four items and for performance; higher demand/effort/frustration is unfavorable. Session-final ratings are not condition-specific and were not duplicated into condition tests. No HRV/stress-mechanism significance tests were fitted.

The 25 secondary comparisons (3 duration, 4 assistance ratings, 18 TLX subscale contrasts) form a separate Holm family. These are explicitly exploratory; the JSON additionally corrects all 31 core + secondary t-tests together as a stricter sensitivity check. The same four core assistance-versus-control t-test results also pass that stricter correction. Duration differences do not pass the secondary correction; none of the four assistance-rating adaptive–constant differences has raw p < .05.

'''+table(secondary)+'''

## P101 success sensitivity (do not replace recorded analysis selectively)

Each sensitivity has its own three-success-test Holm correction; it is not interchangeable with the six-test main family.

'''
    for name, rows in result['success_sensitivity'].items():
        text += f'### {name}\n\n'+table(rows)+'\n\n'
    text += '''P101 R4/R5 are inferred solved in the working coding; R9 is ambiguous. No recorded Boolean outcomes exist for P101. P124 recorded failures were kept even where its subjective performance rating is high. P108–P110 remain provisional downloads. P111's absent constant condition was not imputed; counting it as done affects scheduling only.

## Remaining nine sessions: sensitivity, not a prediction

There is no unique required future solve total or questionnaire average. A paired test depends on **both the mean difference and the variation in differences**, and multiplicity adjustment also depends on the other comparisons. Improvement in both assistance conditions equally does not demonstrate adaptive superiority.

### Solving: illustrative adaptive minus constant differences

The current recorded cohort has adaptive minus constant = −3 solved puzzles summed across 13 participants. The table adds nine hypothetical complete participants. Each has three puzzles per condition. Identical differences deliberately represent a favorable low-variability case; they are not targets to engineer or a forecast.

| Hypothetical difference for every future participant | Combined success-rate difference (recorded cohort) | Raw p: recorded cohort | Raw p: P101 working inference included | Raw p: P101 R9 solved included |
|---|---:|---:|---:|---:|
'''
    for i, r in enumerate(result['future']['success']['illustrative']):
        working = result['future']['success_sensitivity']['P101 working inferred outcomes'][i]
        r9 = result['future']['success_sensitivity']['P101 working with R9 solved'][i]
        text += f"| {r['future_mean_difference']:+.0f} puzzles (adaptive − constant) | {r['combined_mean_difference']/3*100:+.2f} pp | {pformat(r['p'])} | {pformat(working['p'])} | {pformat(r9['p'])} |\n"
    text += '''
These raw p-values are **not corrected**. The recorded cohort would have 22 paired participants after nine future runs; the P101 inference sensitivities would have 23. The hypothetical +2 puzzle scenario crosses raw .05 in the recorded cohort but not when P101's working inferred outcomes are included. This is an important reminder that an outcome-coding decision can affect future significance; it must be resolved using evidence, not whichever calculation is favorable.

For a conservative six-test Bonferroni rule, a comparison needs p < .008333. Under Holm it can pass at a less stringent raw threshold depending on the other five p-values. If the four assistance-versus-control comparisons remain the four smallest and significant, and the other direct assistance contrast is larger, this direct contrast needs p < .025. That ordering cannot be guaranteed for future data.

The JSON exhaustively enumerates all 5,005 feasible histograms of nine paired count differences (−3…+3). It records the smallest directional aggregate that **can** pass each cutoff. These examples are not sufficient rules for any dataset with that aggregate; a larger variance can prevent significance. Aggregate solve rates alone do not determine a paired p-value.

### Workload: future adaptive advantage with variability like the current sample

The existing adaptive−constant paired SD is 15.60 workload points. The following scenarios assume the nine new paired differences have that same sample SD, while their mean changes:

| Future mean (adaptive − constant) | Combined mean (23 participants) | Raw two-sided paired t p |
|---:|---:|---:|
'''
    for r in result['future']['workload']['illustrative']:
        text += f"| {r['future_mean_difference']:.1f} | {r['combined_mean_difference']:.2f} | {pformat(r['p'])} |\n"
    text += '\nConditional workload thresholds (values just beyond these, in the negative direction, pass the specified raw cutoff):\n\n'
    for r in result['future']['workload']['thresholds']:
        text += f"- With future paired SD {r['assumed_future_sd']:.2f}, raw p < {r['alpha']:.6f} requires future mean adaptive−constant below approximately {r['required_future_mean_adaptive_minus_constant']:.2f} points.\n"
    text += '''
The strong required future differences partly reflect the current near-zero adaptive–constant average. A sharp change between earlier and later cohorts should be investigated for order, puzzle, protocol or equipment changes—not celebrated solely for crossing a p threshold. These conditional calculations keep the existing observations unchanged; future participants may instead support no difference or favor constant assistance.

## Prospective power: what the remaining sample can reliably detect

The following examples use the current **adaptive−constant paired SD**, not the observed mean effect, with a normal paired-difference approximation. Effects of 10/20 percentage points success and 5/10 workload points are illustrative meaningful effects; the researcher has not prespecified these as study targets. Pilot SDs are uncertain; JSON includes a 1.5× SD sensitivity. The normal approximation is especially rough for bounded success counts, so these are planning estimates, not guarantees.

| Outcome | Assumed meaningful difference | Paired SD | Alpha | Total paired n for 80% power | Power at planned usable n |
|---|---:|---:|---:|---:|---:|
'''
    for r in result['power']['examples']:
        if r['pilot_sd_multiplier'] == 1:
            text += f"| {r['metric']} | {r['meaningful_difference']} {r['unit']} | {r['assumed_paired_sd']:.2f} | {r['alpha']:.6f} | {r['n_for_80_percent_power']} | {100*r['power_at_planned_n']:.1f}% at n={r['planned_analyzable_n']} |\n"
    text += '''
A .05 alpha is appropriate only for an independently fixed single primary test, not for choosing one favorable endpoint now and pretending it was specified before seeing the data. The .05/6 rows provide conservative planning for the six-comparison family. These prospective normal-model calculations do not repair interim peeking or make this dataset confirmatory.

## Recommended remaining condition orders

If the original goal remains 24 scheduled sessions with four per order, counting P111 as done gives:

| Order | Done (including P111) | Remaining |
|---|---:|---:|
'''
    for r in result['orders']:
        text += f"| {r['order']} | {r['done']} | {r['remaining']} |\n"
    text += '''
Keep the study procedure, difficulty assignment, assistance policy and outcome adjudication consistent. Record all future sessions and missingness. Resolve ambiguous existing outcomes from independent original evidence if available, documenting any change; do not recode to improve p-values. Complete the planned remaining sample and analyse at the fixed horizon. Do not stop, extend selectively, or exclude participants when a desirable p appears. If formal sequential monitoring is required, it needs an appropriate design/correction, not repeated ordinary .05 tests.

No result is guaranteed by collecting nine more people. For this dataset the current defensible claim is **assistance versus control**, not adaptive superiority, equivalence, or a validated physiological stress mechanism. Paired tests here do not adjust for puzzle or block/order effects. A final analysis should examine these design effects and retain all sensitivity/missing-data decisions transparently.

## Reproduction and files

Run `python3 analyse.py` in this directory with NumPy and SciPy available. The script reads `analysis-input.json` by default, recomputes every statistic and writes the report, JSON and participant means. The input excludes personal profiles and contains only the participant IDs, condition order, round outcomes and ratings needed here. `statistics.json` stores full precision results, exact-check results, conditional future scenarios and planning assumptions. `participant-condition-means.json` makes the analysis units auditable. Original exports and prior ZIPs were not altered.

Methods: [SciPy paired t-test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ttest_rel.html), [SciPy Wilcoxon notes](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.wilcoxon.html), [Holm correction documentation](https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html), [ASA p-value statement](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf).
'''
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, default=HERE/'analysis-input.json')
    parser.add_argument('--out', type=Path, default=HERE)
    args = parser.parse_args()
    data = json.loads(args.input.read_text())
    args.out.mkdir(parents=True, exist_ok=True)
    if 'source_provenance' in data:
        slim = data
    else:
        keep = ('participant', 'condition', 'round', 'status', 'rawSolved', 'analysisSolved', 'outcomeBasis',
                'durationSeconds', 'survey', 'tlx100', 'puzzle', 'block', 'notes')
        slim = dict(source_provenance=dict(path=str(args.input), sha256=hashlib.sha256(args.input.read_bytes()).hexdigest()),
                    participants=[{k: p[k] for k in ('id', 'order', 'cohort', 'provisional')} for p in data['participants']],
                    rounds=[{k: r[k] for k in keep} for r in data['rounds']])
    (args.out/'analysis-input.json').write_text(json.dumps(slim, indent=2)+'\n')
    complete, recorded, means = aggregate(slim)
    core = [paired_result('success', a, b, recorded, means, 100, 'percentage points') for a, b in PAIRS]
    core += [paired_result('tlx100', a, b, complete, means, 1, 'adapted workload points') for a, b in PAIRS]
    adjust_family(core)
    for method in ('signflip', 'wilcoxon', 'sign'):
        adjust_family(core, method+'_p', method+'_holm_p')
    secondary = [paired_result('durationSeconds', a, b, complete, means, 1, 'seconds', False) for a, b in PAIRS]
    secondary += [paired_result(key, 'adaptive', 'constant', complete, means, 1, '1–7 rating points', False) for key in HELP_KEYS]
    secondary += [paired_result(key, a, b, complete, means, 1, '1–7 rating points', False) for key in RATING_KEYS for a, b in PAIRS]
    assert len(secondary) == 25
    adjust_family(secondary)
    adjust_family(core+secondary, 'p', 'holm_all31_p')
    sensitivities = {}
    for label in ('P101 working inferred outcomes', 'P101 working with R9 solved'):
        changed = json.loads(json.dumps(means))
        if 'R9' in label:
            changed['P101']['adaptive']['success_working'] += 1/3
        rows = [paired_result('success_working', a, b, complete, changed, 100, 'percentage points') for a, b in PAIRS]
        adjust_family(rows)
        sensitivities[label] = rows
    omnibus = []
    for metric, people in [('success', recorded), ('tlx100', complete)]:
        values = [[means[p][c][metric] for p in people] for c in CONDITIONS]
        f = stats.friedmanchisquare(*values)
        omnibus.append(dict(metric=metric, n=len(people), statistic=float(f.statistic), p=float(f.pvalue),
                            kendalls_w=float(f.statistic/(len(people)*(len(CONDITIONS)-1)))))
    used = len(slim['participants'])
    remaining = PLANNED-used
    assert used == 15 and remaining == 9
    orders = Counter(p['order'] for p in slim['participants'])
    order_rows = [dict(order=order, done=count, remaining=4-count) for order, count in sorted(orders.items())]
    assert len(order_rows) == 6 and sum(r['remaining'] for r in order_rows) == remaining
    success_diff = np.array([means[p]['adaptive']['success']-means[p]['constant']['success'] for p in recorded])
    tlx_diff = np.array([means[p]['adaptive']['tlx100']-means[p]['constant']['tlx100'] for p in complete])
    future_success_sensitivity = {}
    for label in sensitivities:
        old = np.array([means[p]['adaptive']['success_working']-means[p]['constant']['success_working'] for p in complete])*3
        if 'R9' in label:
            old[complete.index('P101')] += 1
        future_success_sensitivity[label] = [combined(old, remaining, m, 0) for m in (-1, 0, 1, 2, 3)]
    result = dict(date='2026-10-07', scipy_version=scipy.__version__, numpy_version=np.__version__,
                  provenance=slim['source_provenance'], exploratory=True,
                  core_family_size=6, alpha=.05, complete_ids=complete, recorded_success_ids=recorded,
                  schedule_done_including_partial=used, schedule_target=PLANNED, schedule_remaining=remaining,
                  core_tests=core, secondary_tests=secondary, friedman=omnibus,
                  success_sensitivity=sensitivities, orders=order_rows,
                  future=dict(success=success_scenarios(success_diff, remaining),
                              success_sensitivity=future_success_sensitivity,
                              workload=workload_scenarios(tlx_diff, remaining)),
                  power=planning(float(success_diff.std(ddof=1))*100, float(tlx_diff.std(ddof=1)),
                                 len(recorded)+remaining, len(complete)+remaining))
    (args.out/'participant-condition-means.json').write_text(json.dumps(means, indent=2)+'\n')
    (args.out/'statistics.json').write_text(json.dumps(result, indent=2, allow_nan=False)+'\n')
    (args.out/'STATISTICAL-ANALYSIS.md').write_text(report(result))
    print(table(core))
    print('\nExact checks:', [(r['metric'], r['contrast'], r['signflip_holm_p'], r['wilcoxon_holm_p']) for r in core])
    print('\nWorkload thresholds:', result['future']['workload']['thresholds'])
    print('\nPower examples:', [r for r in result['power']['examples'] if r['pilot_sd_multiplier'] == 1])
    print('\nValidated source workloads, participant pairing, 6+25 test counts, order deficits, and t-statistic identity.')


if __name__ == '__main__':
    main()
