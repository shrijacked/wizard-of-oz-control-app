#!/usr/bin/env python3
"""Regenerate exact diffs, highlighted prose and a file inventory against a frozen paper.

Uses the Python standard library. Does not edit the manuscript or its baseline.
The inventory excludes this revision directory itself to avoid recursive hashing.
"""
from pathlib import Path
import argparse,difflib,hashlib,html,json,subprocess
ROOT=Path(__file__).resolve().parents[1]
PAPER=ROOT/'paper/aamas2027'
parser=argparse.ArgumentParser()
parser.add_argument('--revision',default='2026-10-07-protocol')
args=parser.parse_args()
REV=PAPER/'revisions'/args.revision
BEFORE=REV/'before'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((REV/'baseline-manifest.json').read_text())
# The manifest structure is deliberately checked, not silently rewritten.
entries=baseline.get('files',[])
if isinstance(entries,dict): items=list(entries.items())
else: items=[(x.get('path',x.get('file')),x['sha256']) for x in entries]
for path,digest in items:
 assert sha(BEFORE/path)==digest, f'Frozen baseline changed: {path}'
for name in ['main.tex','manuscript.md']:
 old=(BEFORE/name).read_text();new=(PAPER/name).read_text()
 diff=''.join(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='before/'+name,tofile='current/'+name))
 (REV/(name+'.diff')).write_text(diff)
old=(BEFORE/'manuscript.md').read_text();new=(PAPER/'manuscript.md').read_text()
# Whitespace tokens preserve paragraph/table formatting; exact spelling is retained.
a=__import__('re').findall(r'\S+|\s+',old);b=__import__('re').findall(r'\S+|\s+',new)
parts=[]
for tag,i,j,k,l in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
 if tag=='equal':parts.append(html.escape(''.join(b[k:l])))
 else:
  if tag in ('delete','replace'):parts.append('<del>'+html.escape(''.join(a[i:j]))+'</del>')
  if tag in ('insert','replace'):parts.append('<ins>'+html.escape(''.join(b[k:l]))+'</ins>')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Paper revision, highlighted changes</title><style>
body{font:16px/1.6 system-ui,sans-serif;background:#f5f6f8;color:#202936;margin:0}main{max-width:1050px;margin:40px auto;background:white;padding:36px;border:1px solid #ddd;border-radius:10px}h1{font-size:28px;line-height:1.2}a{color:#225d91}article{white-space:pre-wrap;overflow-wrap:anywhere}ins{background:#d4f4db;color:#174d24;text-decoration:none}del{background:#ffe0df;color:#8d2525;text-decoration:line-through}nav{padding:16px;background:#f4f6f8;margin-bottom:28px}.legend{padding:6px 10px;border-radius:4px}@media(max-width:700px){main{margin:0;padding:20px}}@media print{main{border:0;padding:0}}
</style><main><h1>Paper revision: highlighted changes</h1><p>7 October 2026. Compared with the frozen pre-change manuscript. Green marks additions; red strike-through marks deletions. Unchanged wording remains visible for context. This is a review document, not the submission manuscript.</p><nav><a href="CHANGELOG.md">Change log</a> · <a href="main.tex.diff">Exact TeX diff</a> · <a href="manuscript.md.diff">Exact Markdown diff</a> · <a href="before/manuscript.md">Pre-change manuscript</a> · <a href="before/aamas2027-current.pdf">Pre-change PDF</a> · <a href="../../main.tex">Current TeX</a> · <a href="../../../../output/pdf/aamas2027-current.pdf">Current PDF</a></nav><article>'''+''.join(parts)+'</article></main></html>'
(REV/'highlighted-review.html').write_text(page)
allpaths={x.relative_to(PAPER) for x in PAPER.rglob('*') if x.is_file() and 'revisions' not in x.relative_to(PAPER).parts}
allpaths|={x.relative_to(BEFORE) for x in BEFORE.rglob('*') if x.is_file() and x.name!='aamas2027-current.pdf'}
inventory=[]
for path in sorted(allpaths):
 before=BEFORE/path;current=PAPER/path
 oldsha=sha(before) if before.exists() else None;newsha=sha(current) if current.exists() else None
 if oldsha!=newsha: inventory.append({'path':str(Path('paper/aamas2027')/path),'status':'added' if oldsha is None else 'removed' if newsha is None else 'modified','before_sha256':oldsha,'after_sha256':newsha})
for path in [ROOT/'scripts/update-paper-analysis.py',ROOT/'scripts/plot-assisted-comparison.py',ROOT/'scripts/review-paper-revision.py',ROOT/'scripts/analyze-all-paper-outcomes.py',ROOT/'scripts/validate-paper-reference-map.py',ROOT/'output/pdf/aamas2027-current.pdf',ROOT/'output/figures/assistance-architecture.tex',ROOT/'output/figures/physical-setup-topdown.tex',*[ROOT/'output/figures'/f'{name}.{ext}' for name in ['assistance-architecture','physical-setup-topdown'] for ext in ['pdf','png']],ROOT/'output/packages/aamas2027-complete-latex-project.zip',ROOT/'output/packages/aamas2027-figures.zip']:
 original=REV/'before-packages'/path.name if path.parent.name=='packages' else REV/'before-diagrams'/path.name if path.parent.name=='figures' else BEFORE/'aamas2027-current.pdf' if path.suffix=='.pdf' else REV/'before-tools'/path.name
 if not original.exists():original=None
 if original and sha(original)==sha(path):continue
 inventory.append({'path':str(path.relative_to(ROOT)),'status':'modified' if original else 'added','before_sha256':sha(original) if original else None,'after_sha256':sha(path)})
diffdir=REV/'file-diffs';diffdir.mkdir(exist_ok=True)
for entry in inventory:
 path=ROOT/entry['path']
 if path.suffix.lower() in {'.md','.tex','.json','.py','.txt','.bib','.csv'}:
  previous=BEFORE/path.relative_to(PAPER) if path.is_relative_to(PAPER) else REV/('before-diagrams' if path.parent.name=='figures' else 'before-tools')/path.name
  old=previous.read_text() if previous and previous.exists() else ''
  new=path.read_text() if path.exists() else ''
  diff=''.join(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='before/'+entry['path'],tofile='current/'+entry['path']))
  name=entry['path'].replace('/','__')+'.diff';(diffdir/name).write_text(diff);entry['diff_path']='file-diffs/'+name
(REV/'change-inventory.json').write_text(json.dumps({'base_commit':baseline.get('base_commit','unknown'),'baseline_verified_files':len(items),'changes':inventory},indent=2)+'\n')
print(f'Baseline {len(items)} hashes verified. Wrote 2 exact diffs, highlighted review and {len(inventory)} file changes.')
