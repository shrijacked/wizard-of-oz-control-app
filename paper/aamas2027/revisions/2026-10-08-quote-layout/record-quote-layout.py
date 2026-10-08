"""Record this pre-edit snapshot and verify that numerical/source assets did not change."""
from pathlib import Path
import difflib, hashlib, json, re, zipfile

root = Path(__file__).resolve().parent
revision = root/'revisions/2026-10-08-quote-layout'
before = revision/'before/paper'
paper = root/'paper'
old=(before/'main.tex').read_text(); new=(paper/'main.tex').read_text()
pattern=r'\\begin\{abstract\}(.*?)\\end\{abstract\}'
assert re.search(pattern,old,re.S).group(1)==re.search(pattern,new,re.S).group(1)
assert (before/'references.bib').read_bytes()==(paper/'references.bib').read_bytes()
with zipfile.ZipFile(revision/'before/aamas2027-refreshed-source.zip') as archive:
    assert archive.read('review/paired-tests.csv')==(root/'analysis/paired-tests.csv').read_bytes()
    for name in ['figures/performance-tests.pdf','figures/frustration-tests.pdf','figures/assistance-tests.pdf','figures/setup-wide-photo.jpg']:
        assert archive.read(name)==(paper/name).read_bytes()
hashes={str(p.relative_to(revision/'before')):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((revision/'before').rglob('*')) if p.is_file()}
target=revision/'before-hashes.json'
if target.exists(): assert json.loads(target.read_text())==hashes
else: target.write_text(json.dumps(hashes,indent=2)+'\n')
(revision/'changes-since-previous-draft.diff').write_text(''.join(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='setup-layout/main.tex',tofile='quote-layout/main.tex')))
print('Snapshot hashes recorded; abstract, bibliography, paired tests, plots and photo bytes unchanged.')
