#!/usr/bin/env python3
"""Plot constant/adaptive assistance ratings from existing participant averages.

Means and sample SDs match Table 3. Plotting does not alter data or paired tests.
Earlier correlation/difference plots and their generator are archived in revisions.
"""
from pathlib import Path
import hashlib,json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'paper/aamas2027/analysis/revision-analysis.json'
FIG=ROOT/'paper/aamas2027/figures'
data=json.loads(SOURCE.read_text())
values=data['participant_condition_averages']
keys=['helpfulness','timingEffectiveness','clarityAndDistraction','stressReduction']
labels=['Helpfulness','Timing','Seamlessness','Frustration relief']
plt.rcParams.update({'font.size':9,'font.family':'DejaVu Sans','axes.spines.top':False,'axes.spines.right':False,'pdf.fonttype':42})
fig,ax=plt.subplots(figsize=(6.9,2.40),layout='constrained')
x=np.arange(len(keys));width=.32
summary={'source_analysis_sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'actual_matched_participants':data['experiment_n'],'error_bars':'Sample standard deviation across participant-condition averages (ddof=1).','measures':{}}
for condition,label,color,offset in [('constant','Constant assistance','#397797',-width/2),('adaptive','Adaptive assistance','#AE6B32',width/2)]:
 arrays=[np.array(values[condition][key]) for key in keys]
 assert all(len(a)==data['experiment_n'] for a in arrays)
 means=np.array([a.mean() for a in arrays]);sds=np.array([a.std(ddof=1) for a in arrays])
 ax.bar(x+offset,means,width,label=label,color=color,yerr=sds,capsize=3,error_kw={'elinewidth':.9,'capthick':.9,'ecolor':'#343434'},zorder=3)
 for xpos,mean,sd in zip(x+offset,means,sds):
  ax.text(xpos,mean+sd+.12,f'{mean:.2f}',ha='center',va='bottom',color=color,weight='bold',fontsize=8,zorder=4)
 for key,mean,sd in zip(keys,means,sds):summary['measures'].setdefault(key,{})[condition]={'mean':float(mean),'sd':float(sd)}
ax.set_xticks(x,labels);ax.set_ylim(0,7.2);ax.set_yticks(range(8));ax.set_ylabel('Mean rating (1–7)')
ax.grid(axis='y',alpha=.18,zorder=0);ax.set_axisbelow(True)
ax.legend(loc='lower center',bbox_to_anchor=(.5,1.01),ncol=2,frameon=False,fontsize=9)
fig.savefig(FIG/'assistance-comparison-bars.pdf',bbox_inches='tight')
fig.savefig(FIG/'assistance-comparison-bars.png',bbox_inches='tight',dpi=220)
plt.close(fig)
(ROOT/'paper/aamas2027/analysis/assistance-bars.json').write_text(json.dumps(summary,indent=2)+'\n')
print('Wrote grouped mean/SD bar chart and numeric audit. Source analysis and tests unchanged.')
