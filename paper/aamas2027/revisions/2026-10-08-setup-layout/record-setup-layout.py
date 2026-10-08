"""Record the immutable pre-edit snapshot and scope of this layout revision."""
from pathlib import Path
import difflib, hashlib, json, re, zipfile

root = Path(__file__).resolve().parent
revision = root/'revisions/2026-10-08-setup-layout'
before = revision/'before/paper'
paper = root/'paper'
old = (before/'main.tex').read_text()
new = (paper/'main.tex').read_text()
assert re.search(r'\\begin\{abstract\}(.*?)\\end\{abstract\}', old, re.S).group(1) == re.search(r'\\begin\{abstract\}(.*?)\\end\{abstract\}', new, re.S).group(1)
assert (before/'references.bib').read_bytes() == (paper/'references.bib').read_bytes()
with zipfile.ZipFile(revision/'before/aamas2027-refreshed-source.zip') as archive:
    assert archive.read('review/paired-tests.csv') == (root/'analysis/paired-tests.csv').read_bytes()
    for name in ['main.tex','figures/performance-tests.pdf','figures/frustration-tests.pdf','figures/assistance-tests.pdf']:
        assert archive.read(name) == (before/name).read_bytes()
    for name in ['figures/performance-tests.pdf','figures/frustration-tests.pdf','figures/assistance-tests.pdf']:
        assert archive.read(name) == (paper/name).read_bytes()
hashes = {str(p.relative_to(revision/'before')):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((revision/'before').rglob('*')) if p.is_file()}
target = revision/'before-hashes.json'
if target.exists():
    assert json.loads(target.read_text()) == hashes, 'The saved baseline must not change'
else:
    target.write_text(json.dumps(hashes,indent=2)+'\n')
(revision/'changes-since-ab96ee4.diff').write_text(''.join(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='writing-ab96ee4/main.tex',tofile='setup-layout/main.tex')))
def counts(tex):
    sections = tex.split('\\section{Introduction}',1)[1]
    intro, remaining = sections.split('\\section{Related Work}',1)
    related = remaining.split('\\section{Formative Assessment',1)[0]
    def words(value):
        value = re.sub(r'\\cite\{[^}]+\}', '', value)
        value = re.sub(r'\\\w+\{([^}]*)\}',r'\1',value)
        return len(re.findall(r"[A-Za-z]+(?:[-'][A-Za-z]+)*", value))
    return {'introduction':words(intro),'relatedWork':words(related)}
print(json.dumps({'snapshotFiles':len(hashes),'approximateSectionWordsBefore':counts(old),'approximateSectionWordsAfter':counts(new),'abstractUnchanged':True,'bibliographyUnchanged':True,'pairedStatisticsAndPlotsUnchanged':True},indent=2))
