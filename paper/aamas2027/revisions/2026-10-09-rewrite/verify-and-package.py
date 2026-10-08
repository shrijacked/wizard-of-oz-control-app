"""Check the rewrite and create explicit compile/aggregate-only archives."""
from pathlib import Path
import csv
import difflib
import hashlib
import json
import re
import zipfile
from pypdf import PdfReader
from PIL import Image

HERE=Path(__file__).resolve().parent
AUDIT=HERE.parent/'paper-review-2026-10-09'
BASE=AUDIT/'baseline'
PAPER=HERE/'paper'
SUP=HERE/'supplement'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
tex=(PAPER/'main.tex').read_text()
bib=(PAPER/'references.bib').read_text()
keys=set(k.strip() for group in re.findall(r'\\cite\{([^}]+)\}',tex) for k in group.split(','))
bibkeys=set(re.findall(r'@\w+\{([^,]+),',bib))
assert keys==bibkeys and len(keys)==34
assert (PAPER/'main.bbl').read_text().count('\\bibitem')==34
assert len(re.findall(r'\\label\{fig:',tex))==5
assert len(re.findall(r'\\label\{tab:',tex))==3
assert not re.search(r'P1\d\d|n\s*=\s*23|remain to be documented|not separately documented|role counts|participant confirmation|retrospect|bold marks',tex,re.I)
assert not re.search(r'25 secondary|six comparisons|three-test piece|p=\.997|p=\.119|p=\.296|p=\.273|p=\.086',tex)
assert 'twelve tests' in tex and 'nineteen-test' in tex and 'frustration' in tex
assert not re.search(r'not disclosed during or after|colored-piece targets|three-minute pre-task baseline',tex)
for rel in ['aamas.cls','ACM-Reference-Format.bst']:
    assert sha(PAPER/rel)==sha(BASE/'paper'/rel)
for directory,name in [(PAPER,'main'),(SUP,'supplement')]:
    log=(directory/(name+'.log')).read_text()
    errors=[s for s in log.splitlines() if re.search(r'Overfull|undefined|Missing character|Emergency stop|Fatal',s,re.I)]
    assert not errors,(name,errors)
main=PdfReader(PAPER/'main.pdf')
supp=PdfReader(SUP/'supplement.pdf')
assert len(main.pages)==8
assert supp.pages
maintext='\n'.join(p.extract_text() or '' for p in main.pages)
supptext='\n'.join(p.extract_text() or '' for p in supp.pages)
assert 'Conference’17' not in supptext and 'xxxx' not in supptext
captions=[]
for page,p in enumerate(main.pages,1):
    for match in re.finditer(r'Figure\s+([1-5]):',p.extract_text() or ''):
        captions.append(dict(figure=int(match.group(1)),page=page))
assert [r['figure'] for r in captions]==list(range(1,6)),captions
assert not main.metadata.get('/Author') and not supp.metadata.get('/Author')

sources=json.loads((AUDIT/'audit/reference-source-checks.json').read_text())
lookup={r['key']:r for r in sources}
for key in keys:
    r=lookup[key]; p=Path(r['path'])
    assert sha(p)==r['sha256']
    assert len(PdfReader(p).pages)==r['pages']

manifest=json.loads((HERE/'qa/image-derivatives.json').read_text())
assert len(manifest)==3
for r in manifest:
    assert sha(Path(r['original']))==r['sourceSha256']==sha(BASE/'paper/figures'/r['source'])
    im=Image.open(PAPER/'figures'/r['derivative'])
    assert not im.getexif() and not any(k in im.info for k in ['exif','icc_profile','XML:com.adobe.xmp'])

stats=json.loads((AUDIT/'audit/agreed-hierarchy-results.json').read_text())
assert (stats['participants'],stats['rounds'])==(24,216)
for kind in ['paired','adjusted']:
    with (HERE/'analysis'/f'{kind}-comparisons.csv').open(newline='') as f:
        rows=list(csv.DictReader(f))
    assert len(rows)==31
    assert sum(r['family']=='core' for r in rows)==12
    assert sum(r['family']=='secondary' for r in rows)==19
    for row,r in zip(rows,stats[kind]):
        assert row['outcome']==r['metric'] and row['a']==r['a'] and row['b']==r['b']
        assert abs(float(row['holm_p'])-r['holmP'])<1e-14
        assert abs(float(row['raw_p'])-r['p'])<1e-14
    text=(HERE/'analysis'/f'{kind}-comparisons.csv').read_text()
    assert not re.search(r'P1\d\d|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',text)

# The freeze is verified against recorded hashes, not regenerated to hide changes.
snapshot=json.loads((AUDIT/'SNAPSHOT-MANIFEST.json').read_text())
for relative,record in snapshot['files'].items():
    assert sha(AUDIT/relative)==record['sha256']
for relative in ['paper/main.tex','paper/main.pdf','paper/references.bib',
                 'analysis/statistics.json','aamas2027-refreshed-source.zip']:
    assert sha(BASE/relative)==sha(HERE.parent/'paper-refresh-2026-10-08'/relative)

mainfiles=['main.tex','references.bib','aamas.cls','ACM-Reference-Format.bst','by.pdf',
 'figures/study-system-diagram.tikz.tex','figures/physical-setup-topdown.tikz.tex',
 'figures/setup-wide-anonymous.jpg','figures/operator-dashboard-anonymous.png',
 'figures/setup-topdown-anonymous.png','figures/formative-helpfulness.pdf',
 'figures/performance-tests.pdf','figures/experience-comparison.pdf']
supfiles=['supplement.tex','aamas.cls','condition-order-tree.tikz.tex',
 'paired-results.tex','adjusted-results.tex','position-results.tex',
 'secondary-results.tex','allocation.tex']
inventory={'README.md':HERE/'SOURCE-README.md'}
inventory.update({rel:PAPER/rel for rel in mainfiles})
inventory.update({'supplement/'+rel:SUP/rel for rel in supfiles})
def archive(target,members):
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,path in sorted(members.items()):
            assert path.is_file(),path
            z.write(path,name)
    with zipfile.ZipFile(target) as z:
        assert z.testzip() is None and set(z.namelist())==set(members)
    return dict(file=target.name,bytes=target.stat().st_size,sha256=sha(target),members=sorted(members))
sourcezip=archive(HERE/'aamas2027-rewritten-source.zip',inventory)
suppzip=archive(HERE/'aamas2027-aggregate-supplement.zip',{
    'supplement.pdf':SUP/'supplement.pdf',
    'paired-comparisons.csv':HERE/'analysis/paired-comparisons.csv',
    'adjusted-comparisons.csv':HERE/'analysis/adjusted-comparisons.csv'})
diff=[]
for rel in ['main.tex','references.bib','figures/study-system-diagram.tikz.tex']:
    diff.extend(difflib.unified_diff((BASE/'paper'/rel).read_text().splitlines(keepends=True),
                (PAPER/rel).read_text().splitlines(keepends=True),
                fromfile='preserved/'+rel,tofile='rewritten/'+rel))
(HERE/'changes.diff').write_text(''.join(diff))
verification=dict(date='2026-10-09',mainPages=len(main.pages),supplementPages=len(supp.pages),
    mainFigures=5,mainTables=3,citations=34,participants=24,rounds=216,finalSurveys=24,
    figureCaptionOrder=captions,overfullBoxes=0,undefinedReferences=0,missingCharacters=0,
    classAndBibliographyStyleUnchanged=True,originalImagesPreserved=3,imageMetadataRemoved=True,
    referencePDFIntegrityChecks=34,sourceZip=sourcezip,supplementZip=suppzip,
    previousSnapshotHashesVerified=len(snapshot['files']),canonicalPaperUnchanged=True,
    visualReview='Pending latest page inspection; numerical/build/package checks passed.',
    boundaries=['Not every source page read or external study replicated.',
                'MRChaos page ranges conflict across records; omitted, not guessed.',
                'Vitry uses verified author-version DOI, not an asserted IEEE DOI.',
                'Raw-data release and institutional/submission requirements remain author decisions.',
                'No commit, push or submission.'])
(HERE/'qa/VERIFICATION.json').write_text(json.dumps(verification,indent=2)+'\n')
print(json.dumps({k:verification[k] for k in ['mainPages','supplementPages','mainFigures',
                  'mainTables','citations','participants','sourceZip','supplementZip']},indent=2))
