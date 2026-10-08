"""Generate compact vector comparison plots directly from aggregate/test JSON."""
from pathlib import Path
import json, numpy as np
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

HERE=Path(__file__).resolve().parent
s=json.loads((HERE/'analysis/statistics.json').read_text())
fig=HERE/'paper/figures'

def pf(p):return '<.001' if p<.001 else f'{p:.3f}'.lstrip('0')

def panel(c,x,y,w,h,rows,title,limit,unit,ticks):
 c.setFillColor(HexColor('#24282D'));c.setFont('Helvetica-Bold',9);c.drawString(x,y+h-11,title)
 left,right=x+47,x+w-8;bottom=y+48;top=y+h-35
 def xp(v):return left+(v-limit[0])/(limit[1]-limit[0])*(right-left)
 c.setFont('Helvetica',7)
 for t in ticks:
  xx=xp(t);c.setStrokeColor(HexColor('#d8dde3'));c.setLineWidth(.4);c.line(xx,bottom,xx,top+3)
  c.setFillColor(HexColor('#333333'));c.drawCentredString(xx,bottom-12,f'{round(t,8):g}')
 c.setStrokeColor(HexColor('#5b6777'));c.setDash(2,2);c.line(xp(0),bottom,xp(0),top+3);c.setDash()
 for j,r in enumerate(rows):
  yy=top-j*38;lo,hi=r['ci95'];m=r['mean_difference']
  col='#24678B' if r['holm_p']<.05 else '#686C73'
  c.setStrokeColor(HexColor(col));c.setFillColor(HexColor(col));c.setLineWidth(1.3)
  c.line(xp(lo),yy,xp(hi),yy);c.line(xp(lo),yy-3,xp(lo),yy+3);c.line(xp(hi),yy-3,xp(hi),yy+3);c.circle(xp(m),yy,2.5,fill=1,stroke=0)
  label={'constant minus control':'K - C','adaptive minus control':'A - C','adaptive minus constant':'A - K'}[r['contrast']]
  c.setFillColor(HexColor('#24282D'));c.setFont('Helvetica',7);c.drawRightString(left-6,yy-2,label)
  c.setFont('Helvetica',6.5);c.drawString(left,yy-15,f"t({r['df']})={r['t']:.2f}; p(Holm){'=' if r['holm_p']>=.001 else ''}{pf(r['holm_p'])}")
 c.setFont('Helvetica',7);c.drawCentredString((left+right)/2,y+20,unit)

c=canvas.Canvas(str(fig/'performance-tests.pdf'),pagesize=(510,188))
panel(c,0,3,165,180,s['piece_tests'],'Correct pieces (n=24)',(-1,3),'Difference in pieces / 7',[-1,0,1,2,3])
panel(c,170,3,165,180,s['core_tests'][:3],'Completion (n=24)',(-30,70),'Difference in percentage points',[-20,0,20,40,60])
panel(c,340,3,165,180,s['core_tests'][3:],'Adapted TLX (n=24)',(-26,10),'Difference on rescaled 0-100',[-20,-10,0,10])
c.setFont('Helvetica',6.5);c.drawString(8,4,'K: constant; C: control; A: adaptive. Dots: paired differences; bars: pointwise 95% CIs.');c.save()
COLORS={'constant':'#24678B','adaptive':'#C57B24'}

def rating_axes(c,left,right,bottom,top):
 def yp(value):return bottom+(top-bottom)*value/7
 c.setFont('Helvetica',7)
 for tick in range(8):
  yy=yp(tick);c.setStrokeColor(HexColor('#d8dde3'));c.setLineWidth(.4);c.line(left,yy,right,yy)
  c.setFillColor(HexColor('#333333'));c.drawRightString(left-5,yy-2,str(tick))
 c.setStrokeColor(HexColor('#5b6777'));c.line(left,bottom,right,bottom)
 return yp

def rating_bar(c,center,width,summary,condition,bottom,yp):
 mean,sd=summary['mean'],summary['sd']
 c.setFillColor(HexColor(COLORS[condition]));c.rect(center-width/2,bottom,width,yp(mean)-bottom,stroke=0,fill=1)
 c.setStrokeColor(HexColor('#25282D'));c.setLineWidth(.8)
 lo,hi=yp(mean-sd),yp(mean+sd)
 c.line(center,lo,center,hi);c.line(center-3,lo,center+3,lo);c.line(center-3,hi,center+3,hi)

def legend(c,y):
 for x,condition,label in [(56,'constant','Constant'),(136,'adaptive','Adaptive')]:
  c.setFillColor(HexColor(COLORS[condition]));c.rect(x,y-1,8,7,fill=1,stroke=0)
  c.setFillColor(HexColor('#24282D'));c.setFont('Helvetica',7);c.drawString(x+12,y,label)

# Descriptive mean bars; significance remains a paired test, not an error-bar overlap test.
c=canvas.Canvas(str(fig/'frustration-tests.pdf'),pagesize=(250,188))
c.setFillColor(HexColor('#24282D'));c.setFont('Helvetica-Bold',9);c.drawString(8,176,'Frustration (n=24; lower is better)')
left,right,bottom,top=30,240,33,145
yp=rating_axes(c,left,right,bottom,top)
for center,condition,label in [(88,'constant','Constant'),(180,'adaptive','Adaptive')]:
 summary=s['descriptive']['frustration'][condition]
 rating_bar(c,center,42,summary,condition,bottom,yp)
 c.setFillColor(HexColor('#FFFFFF'));c.setFont('Helvetica-Bold',8);c.drawCentredString(center,bottom+8,f"{summary['mean']:.2f}")
 c.setFillColor(HexColor('#24282D'))
 c.setFont('Helvetica',8);c.drawCentredString(center,20,label)
r=next(r for r in s['secondary_tests'] if r['metric']=='frustration' and r['contrast']=='adaptive minus constant')
c.setFont('Helvetica',7);c.drawCentredString(135,156,f"Adjusted p = {pf(r['holm_p'])}")
c.setFont('Helvetica',6.5);c.drawCentredString(125,5,'Bars: mean of participant averages; whiskers: SD.');c.save()

c=canvas.Canvas(str(fig/'assistance-tests.pdf'),pagesize=(250,215))
c.setFillColor(HexColor('#24282D'));c.setFont('Helvetica-Bold',9);c.drawString(8,203,'Assistance ratings (n=24; higher is better)')
legend(c,187)
left,right,bottom,top=26,244,40,162
yp=rating_axes(c,left,right,bottom,top)
metrics=[('helpfulness',['Helpfulness']),('timingEffectiveness',['Timing']),('clarityAndDistraction',['Seamlessness']),('stressReduction',['Frustration','relief'])]
for j,(metric,lines) in enumerate(metrics):
 center=53+j*54
 for offset,condition in [(-10,'constant'),(10,'adaptive')]:
  summary=s['assistanceDescriptive'][metric][condition]
  rating_bar(c,center+offset,16,summary,condition,bottom,yp)
  c.setFillColor(HexColor('#FFFFFF'));c.setFont('Helvetica-Bold',6.5);c.drawCentredString(center+offset,bottom+8,f"{summary['mean']:.2f}")
 c.setFillColor(HexColor('#24282D'));c.setFont('Helvetica',6.5)
 for index,line in enumerate(lines):c.drawCentredString(center,28-index*8,line)
 r=next(r for r in s['secondary_tests'] if r['metric']==metric and r['contrast']=='adaptive minus constant')
 c.drawCentredString(center,171,f"p = {pf(r['holm_p'])}")
c.setFont('Helvetica',6.5);c.drawCentredString(125,7,'Whiskers: SD; p values adjusted for multiple comparisons.');c.save()
import shutil
shutil.copy2(HERE/'analysis/formative-helpfulness.pdf',fig/'formative-helpfulness.pdf')
