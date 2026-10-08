"""Deterministic publication derivatives and plots; original assets stay private."""
from pathlib import Path
import hashlib
import json
import shutil
import argparse
import sys
import numpy as np
from PIL import Image, ImageDraw
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
AUDIT = HERE.parent / 'paper-review-2026-10-09'
BASE = AUDIT / 'baseline'
FIG = HERE / 'paper/figures'
PRIVATE = HERE / 'private-original-images'
PRIVATE.mkdir(exist_ok=True)
original = json.loads((BASE / 'analysis/statistics.json').read_text())
agreed = json.loads((AUDIT / 'audit/agreed-hierarchy-results.json').read_text())
tests = {(r['metric'], r['a'], r['b']):r for r in agreed['paired']}
manifest = []
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--dashboard-only', action='store_true',
                    help='Update only the interface derivative; leave other images and plots unchanged.')
args = parser.parse_args()
if args.dashboard_only:
    manifest = [r for r in json.loads((HERE/'qa/image-derivatives.json').read_text())
                if r['source'] != 'operator-dashboard.png']

def image_derivative(name, target, crop, masks, width):
    source = BASE / 'paper/figures' / name
    original_copy = PRIVATE / name
    if not original_copy.exists():
        shutil.copy2(source, original_copy)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert hashlib.sha256(original_copy.read_bytes()).hexdigest() == digest
    im = Image.open(source).convert('RGB')
    draw = ImageDraw.Draw(im)
    for shape, box in masks:
        if shape == 'ellipse':
            draw.ellipse(box, fill=(210,210,210))
        else:
            draw.rectangle(box, fill=(210,210,210))
    im = im.crop(crop)
    im.thumbnail((width, 1800), Image.Resampling.LANCZOS)
    # Build a new pixel-only image: no EXIF, ICC or source text chunks retained.
    clean = Image.new('RGB', im.size)
    clean.paste(im)
    if target.endswith('.jpg'):
        clean.save(FIG / target, quality=90, optimize=True)
    else:
        clean.save(FIG / target, optimize=True)
    check = Image.open(FIG / target)
    assert not check.getexif()
    assert not any(k in check.info for k in ['exif', 'XML:com.adobe.xmp', 'icc_profile'])
    manifest.append(dict(source=name, sourceSha256=digest, original=str(original_copy),
                         derivative=target, crop=crop, redactions=masks,
                         size=check.size, bytes=(FIG/target).stat().st_size,
                         method='pixel crop, opaque masks, Lanczos resize; no generative editing'))

# Coordinates refer to unscaled original images. No raw image enters compile ZIP.
if not args.dashboard_only:
    image_derivative('setup-wide-photo.jpg', 'setup-wide-anonymous.jpg',
                     (250,650,3110,2840), [('ellipse',(2340,1530,2900,1960))], 850)
image_derivative('operator-dashboard.png', 'operator-dashboard-anonymous.png',
                 # Include the solution and robot controls; stop at the gap after the first hint row.
                 # Exclude the lower input area rather than leaving partly clipped controls.
                 (295,280,2730,1645), [('rectangle',(487,865,825,1090)),
                                      # Opaque value-only masks preserve the field labels.
                                      ('rectangle',(325,1440,454,1496)),
                                      ('rectangle',(583,1440,745,1496)),
                                      ('rectangle',(900,1700,1080,1755)),
                                      ('rectangle',(295,1860,980,1920))], 1300)
if not args.dashboard_only:
    image_derivative('setup-topdown-photo.png', 'setup-topdown-anonymous.png',
                     (0,0,980,552), [('rectangle',(151,187,261,279)),
                                     ('rectangle',(0,272,72,353))], 850)
manifest.sort(key=lambda r: ['setup-wide-photo.jpg','operator-dashboard.png',
                             'setup-topdown-photo.png'].index(r['source']))
(HERE/'qa/image-derivatives.json').write_text(json.dumps(manifest, indent=2)+'\n')
if args.dashboard_only:
    print('Updated cropped, censored dashboard; original preserved; other assets unchanged.')
    sys.exit(0)

plt.rcParams.update({'font.family':'DejaVu Sans','font.size':8,
                     'axes.spines.top':False,'axes.spines.right':False,
                     'pdf.fonttype':42,'savefig.pad_inches':.04})
meta = {'Creator':'Scientific figure generator','CreationDate':None,'ModDate':None}
BLUE = '#226B91'; GRAY = '#777777'; ORANGE = '#CE7635'

def ptext(p):
    return '< .001' if p<.001 else '= '+f'{p:.3f}'

fig, axes = plt.subplots(1,3,figsize=(7,2.3))
for ax, metric, title in zip(axes,['correctPieces','success','tlx100'],
                            ['Correct pieces (0–7)','Completion (percentage points)',
                             'Adapted workload (0–100)']):
    for y, (a,b), label in zip([2.6,1.3,0],[('constant','control'),('adaptive','control'),
                                      ('adaptive','constant')],['K − C','A − C','A − K']):
        r=tests[(metric,a,b)]
        color=BLUE if r['holmP']<.05 else GRAY
        ax.errorbar(r['mean_difference'],y,
                    xerr=[[r['mean_difference']-r['ci95'][0]],
                          [r['ci95'][1]-r['mean_difference']]],
                    fmt='o',color=color,capsize=2,markersize=4,lw=1.3)
        ax.text(.02,y-.48,f"t = {r['t']:.2f}; "+r'$p_{\mathrm{H}}$ '+ptext(r['holmP']),
                transform=ax.get_yaxis_transform(),fontsize=6.6,color=color)
    ax.axvline(0,color='#BBBBBB',lw=.7,ls='--')
    ax.set_yticks([2.6,1.3,0],['K − C','A − C','A − K'])
    ax.set_ylim(-.9,3.1)
    ax.set_title(title,fontsize=8.2)
    ax.set_xlabel('Paired mean difference',fontsize=7)
fig.tight_layout(w_pad=1.5)
fig.savefig(FIG/'performance-tests.pdf',metadata=meta)
fig.savefig(HERE/'qa/performance-tests.png',dpi=180)
plt.close(fig)

# Retain compact bars, but combine formerly separate frustration/experience figures.
fig,(axf,axe)=plt.subplots(2,1,figsize=(3.35,3.7),
                           gridspec_kw={'height_ratios':[1,1.25]})
desc=original['descriptive']['frustration']
for i,(condition,color) in enumerate([('constant',BLUE),('adaptive',ORANGE)]):
    r=desc[condition]
    axf.bar(i,r['mean'],yerr=r['sd'],capsize=3,color=color,width=.48)
axf.set_xticks([0,1],['Constant','Adaptive'])
axf.set_ylim(0,7)
axf.set_yticks([0,1,3,5,7])
axf.set_ylabel('Frustration (1–7)')
axf.set_title('(a) Frustration (lower is better)',loc='left',fontsize=8)
axf.text(.5,.94,r'$p_{\mathrm{H}}$ '+ptext(tests[('frustration','adaptive','constant')]['holmP']),
         transform=axf.transAxes,ha='center',va='top',fontsize=8)
keys=['helpfulness','timingEffectiveness','clarityAndDistraction','stressReduction']
x=np.arange(4)
for dx,condition,color in [(-.18,'constant',BLUE),(.18,'adaptive',ORANGE)]:
    data=original['assistanceDescriptive']
    vals=[data[k][condition]['mean'] for k in keys]
    errs=[data[k][condition]['sd'] for k in keys]
    axe.bar(x+dx,vals,yerr=errs,width=.32,color=color,capsize=2,label=condition.title())
for i,k in enumerate(keys):
    axe.text(i,7.27,r'$p_{\mathrm{H}}$ '+ptext(tests[(k,'adaptive','constant')]['holmP']),
             ha='center',fontsize=6.5)
axe.set_xticks(x,['Helpful-\nness','Timing','Seam-\nlessness','Frustration\nrelief'],fontsize=7)
axe.set_ylim(0,7.8)
axe.set_yticks([0,1,3,5,7])
axe.set_ylabel('Rating (1–7)')
axe.set_title('(b) Assistance experience (higher is better)',loc='left',fontsize=8,pad=16)
axe.legend(ncol=2,loc='lower center',bbox_to_anchor=(.5,-.52),frameon=False,fontsize=7)
fig.subplots_adjust(left=.18,right=.99,top=.94,bottom=.15,hspace=.68)
fig.savefig(FIG/'experience-comparison.pdf',metadata=meta)
fig.savefig(HERE/'qa/experience-comparison.png',dpi=200)
plt.close(fig)
print('Preserved 3 originals; built 3 pixel-only derivatives and 2 agreed-hierarchy figures.')
