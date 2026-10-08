#!/usr/bin/env python3
"""Validate and package this refresh; preserve copied historical support files."""
from pathlib import Path
import csv, difflib, hashlib, json, re, shutil, zipfile
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
PAPER = HERE/'paper'
BASELINE = HERE/'fetched-writing/paper/aamas2027'
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def dump(path, value): path.write_text(json.dumps(value,indent=2)+'\n')

sources = ['main.tex','references.bib','aamas.cls','ACM-Reference-Format.bst','by.pdf',
    'README.md','BUILD.txt','author-notes.md',
    'figures/study-system-diagram.tikz.tex','figures/physical-setup-topdown.tikz.tex',
    'figures/condition-order-tree.tikz.tex','figures/setup-topdown-photo.png','figures/operator-dashboard.png',
    'figures/setup-wide-photo.jpg',
    'figures/formative-helpfulness.pdf','figures/performance-tests.pdf',
    'figures/frustration-tests.pdf','figures/assistance-tests.pdf']
assert all((PAPER/rel).is_file() for rel in sources)
builds = {'main.pdf','main.aux','main.bbl','main.blg','main.log','main.out','main.synctex.gz'}
legacy = HERE/'legacy-writing-support'
for path in sorted(PAPER.rglob('*')):
    if path.is_file():
        rel = path.relative_to(PAPER)
        if str(rel) not in sources and str(rel) not in builds:
            target = legacy/rel
            assert not target.exists(), target
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.move(str(path),str(target))

for rel in ['aamas.cls','ACM-Reference-Format.bst']:
    assert sha(PAPER/rel) == sha(BASELINE/rel) == sha(HERE/'backup-current-paper'/rel)
assert sha(HERE/'inputs/HTI-piece-count-entry.xlsx') == 'c51d65263bde7cc3a1530342891444862205c7ce45f4c3c940c67d87d7c97a89'
assert sha(HERE/'inputs/consolidated-data.json') == 'b794ae6ff055aed555dc831ab1f9389dc6b39bc9ae27a1b1fa9cc0c3101d493a'

tex = (PAPER/'main.tex').read_text()
bib = (PAPER/'references.bib').read_text()
active = set(k.strip() for match in re.findall(r'\\cite\{([^}]+)\}',tex) for k in match.split(','))
available = re.findall(r'@\w+\{([^,]+),',bib)
assert len(available) == len(set(available)) == 34 and active == set(available)
assert len(re.findall(r'\\label\{fig:',tex)) == 7
assert len(re.findall(r'\\label\{tab:',tex)) == 3
log = (PAPER/'main.log').read_text()
bad = [line for line in log.splitlines() if re.search(r'Overfull \\hbox|undefined|Missing character|Emergency stop|Fatal',line,re.I)]
assert not bad, bad
vertical_warnings = re.findall(r'Overfull \\vbox \(([\d.]+)pt too high\)', log)
assert len(vertical_warnings) <= 1 and all(float(v) < 1.2 for v in vertical_warnings), vertical_warnings
assert not re.search(r'P1\d\d|remain to be documented|not separately documented|role counts|Bold marks|bold marks|retrospect|participant confirmation|n=23', tex)
pdf = PdfReader(PAPER/'main.pdf')
assert 8 <= len(pdf.pages) <= 9
captions = []
for n,page in enumerate(pdf.pages,1):
    for match in re.finditer(r'Figure\s+([1-7]):',page.extract_text()):
        captions.append(dict(figure=int(match.group(1)),page=n))
assert [r['figure'] for r in captions] == list(range(1,8)),captions
assert (PAPER/'main.bbl').read_text().count('\\bibitem') == 34

manifest = json.loads((HERE/'citation-verification/all-source-downloads.json').read_text())
assert len(manifest) == 34 and {r['key'] for r in manifest} == active
for row in manifest:
    assert sha(HERE/'citation-verification'/f"{row['key']}.pdf") == row['sha256']
    assert row['reviewStatus'] == 'Complete: actual-PDF claim-level review'
    assert row['manuscriptCitationLines']
assert sha(HERE/'citation-verification/cao2025-author.pdf') == next(r['sha256'] for r in json.loads((HERE/'citation-verification/download-manifest.json').read_text()) if r['key']=='cao2025-author')
with (HERE/'inputs/formative-responses-sanitized.csv').open(newline='') as f:
    formative = list(csv.reader(f))
assert len(formative)==51 and 'Username' not in formative[0]
assert not re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',str(formative))
stats = json.loads((HERE/'analysis/statistics.json').read_text())
assert stats['participants']==24 and stats['rounds']==216 and len(stats['countCorrections'])==9
assert len(stats['cohorts']['primaryConfirmedCompletion'])==24
assert len(stats['cohorts']['duration'])==24 and len(stats['cohorts']['availableRatings'])==24
assert len(stats['cohorts']['previousImmediateRatingsSensitivity'])==23

diff = []
for rel in ['main.tex','references.bib','figures/study-system-diagram.tikz.tex','figures/condition-order-tree.tikz.tex']:
    old = (BASELINE/rel).read_text() if (BASELINE/rel).exists() else ''
    new = (PAPER/rel).read_text()
    diff += list(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),
        fromfile=f'writing-5fe730d/{rel}',tofile=f'refreshed/{rel}'))
(HERE/'changes.diff').write_text(''.join(diff))

archive = HERE/'aamas2027-refreshed-source.zip'
review = {'review/CHANGELOG.md':HERE/'CHANGELOG.md',
    'review/ALL_SOURCE_AUDIT.md':HERE/'citation-verification/ALL_SOURCE_AUDIT.md',
    'review/all-source-downloads.json':HERE/'citation-verification/all-source-downloads.json',
    'review/ANALYSIS.md':HERE/'analysis/ANALYSIS.md',
    'review/HOLM_EXPLAINED.md':HERE/'analysis/HOLM_EXPLAINED.md',
    'review/paired-tests.csv':HERE/'analysis/paired-tests.csv',
    'review/REFERENCE_AND_POLICY_STATUS.md':HERE/'citation-verification/REFERENCE_AND_POLICY_STATUS.md',
    'review/FINAL_DRAFT_REVIEW.md':HERE/'FINAL_DRAFT_REVIEW.md'}
alignment = HERE/'revisions/2026-10-08-quote-layout/CITATION_ALIGNMENT_RECHECK.md'
if alignment.exists():
    review['review/CITATION_ALIGNMENT_RECHECK.md'] = alignment
inventory = [dict(file=rel,bytes=(PAPER/rel).stat().st_size,sha256=sha(PAPER/rel)) for rel in sources]
inventory += [dict(file=rel,bytes=path.stat().st_size,sha256=sha(path)) for rel,path in review.items()]
dump(HERE/'package-inventory.json',dict(files=inventory,
    excludes=['Compiled preview (supplied separately)','Raw participant files','Full reference PDFs','Recordings','Puzzle/solution PDFs','Historical notes and plots','Compiler intermediates']))
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for rel in sources: z.write(PAPER/rel,rel)
    z.write(HERE/'package-inventory.json','package-inventory.json')
    for rel,path in review.items(): z.write(path,rel)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert set(z.namelist()) == set(sources+['package-inventory.json']) | set(review)

verification = dict(date='2026-10-08',pages=len(pdf.pages),figures=7,tables=3,bibliographyEntries=34,
    build='Successful Tectonic0.17 XeTeX/BibTeX build; pdfLaTeX route not independently run.',
    classAndStyleUnchanged=True,overfullHorizontalBoxes=0,overfullVerticalBoxes=len(vertical_warnings),verticalOverflowPoints=vertical_warnings,undefinedReferences=0,missingCharacters=0,
    figureCaptionOrder=captions,visualReview=f'All {len(pdf.pages)} setup-layout/page-*.png pages rendered and visually checked, with enlarged figure/table views; no clipping or overlap. Page3 flows without the former large gap. Figure3 centers three genuine views beside the schematic. Tables appear with findings, figures remain 1–7. Broader submission compliance is not certified.' + (' A sub-1.2pt final-reference column-balancing warning is retained; visually unclipped.' if vertical_warnings else ' No overfull boxes.'),
    citationAudit=dict(activeSources=34,downloadedPDFs=34,claimLevelReviewed=34,alternativeAuthorPDFs=1,everyPageRead=False,externalResultsReplicated=False),
    warningsRetained=['Underfull lines','Optional bibliography fields','Font requests','Missing CCS concepts'] + (['Sub-1.2pt final-reference column-balancing vertical warning'] if vertical_warnings else []),
    reviewFile='FINAL_DRAFT_REVIEW.md',
    primaryRoundLevelN=24,finalSurveyN=15,
    pending=['Applicable institutional/venue ethics requirements','AI-use disclosure and anonymous submission checks','Participant photograph publication consent and indirect identifiability'],
    sourceZip=dict(file=archive.name,bytes=archive.stat().st_size,sha256=sha(archive)))
dump(HERE/'qa/VERIFICATION.json',verification)
paths = [PAPER/rel for rel in sources]+[PAPER/'main.pdf',HERE/'changes.diff',HERE/'package-inventory.json',archive,
    HERE/'CHANGELOG.md',HERE/'README.md',HERE/'FINAL_DRAFT_REVIEW.md',HERE/'qa/VERIFICATION.json']
paths += sorted((HERE/'analysis').glob('*'))
paths += [HERE/'citation-verification/CLAIM_AUDIT.md',HERE/'citation-verification/download-manifest.json',
    HERE/'citation-verification/ALL_SOURCE_AUDIT.md',HERE/'citation-verification/all-source-downloads.json',
    HERE/'inputs/P101-researcher-confirmation.json',HERE/'inputs/P111-duration-confirmation.json',
    HERE/'citation-verification/REFERENCE_AND_POLICY_STATUS.md']
dump(HERE/'output-hashes.json',{str(p.relative_to(HERE)):sha(p) for p in paths if p.is_file()})
print(json.dumps(verification,indent=2))
