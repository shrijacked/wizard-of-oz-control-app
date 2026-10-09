"""Verify and publish the exact submitted manuscript to the writing checkout.

Only explicitly allowlisted compilation files are packaged. This script does
not edit the manuscript, commit, push, or include private participant data.
"""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
PAPER = HERE / 'paper'
REPO = HERE.parent.parent / 'writing-paper-refresh'
TARGET = REPO / 'paper/aamas2027'
REV = TARGET / 'revisions/2026-10-10-submitted'
EXPECTED = '085ad7eaee1149eaf94f717906f206abe3f4294cea2dddc134bbafa235293a23'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    assert sha(source) == sha(target)

assert sha(PAPER / 'main.tex') == EXPECTED
source = (PAPER / 'main.tex').read_text()
log = (PAPER / 'main.log').read_text()
assert 'Overfull' not in log
assert not re.search(r'(undefined references|Citation .* undefined|Reference .* undefined)', log)
pages = PdfReader(PAPER / 'main.pdf').pages
assert len(pages) == 9
assert len(re.findall(r'\\begin\{figure\*?\}', source)) == 6
assert len(re.findall(r'\\begin\{table\}', source)) == 3
assert len(re.findall(r'\\bibitem', (PAPER / 'main.bbl').read_text())) == 34
assert len(list((HERE / 'qa').glob('page-*.png'))) == 9

core = ['main.tex', 'main.pdf', 'references.bib', 'aamas.cls',
        'ACM-Reference-Format.bst', 'by.pdf', 'README.md', 'BUILD.txt']
figures = sorted('figures/' + path.name for path in (PAPER / 'figures').iterdir())
assert len(figures) == 9
supplement = sorted('supplement/' + path.name for path in (PAPER / 'supplement').iterdir())
assert len(supplement) == 9
members = core + figures + supplement
for member in members:
    assert (PAPER / member).is_file()

bundle = HERE / 'aamas2027-final-submitted-2026-10-10.zip'
with zipfile.ZipFile(bundle, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for member in members:
        archive.write(PAPER / member, member)
with zipfile.ZipFile(bundle) as archive:
    assert archive.testzip() is None
    assert archive.read('main.tex') == (PAPER / 'main.tex').read_bytes()

figurebundle = HERE / 'aamas2027-figures.zip'
with zipfile.ZipFile(figurebundle, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for member in figures:
        archive.write(PAPER / member, member)
with zipfile.ZipFile(figurebundle) as archive:
    assert archive.testzip() is None

verification = {
    'date': '2026-10-10',
    'sourceByteIdenticalToAuthorUpload': True,
    'submittedSourceSha256': EXPECTED,
    'mainPages': len(pages),
    'figures': 6,
    'tables': 3,
    'bibliographyEntries': 34,
    'overfullBoxes': 0,
    'unresolvedReferencesOrCitations': 0,
    'visualReview': 'Completed: all nine rendered pages inspected; no clipped or overlapping content. References continue onto a mostly empty ninth page; submitted layout preserved.',
    'nativeCompiler': 'Failed: isolated compiler could not resolve aamas.cls.',
    'projectCompiler': 'Successful: existing Tectonic with project-local dependencies.',
    'remainingWarnings': 'Underfull lines, font requests, missing CCS and optional BibTeX metadata warnings retained; not a warning-free build.',
    'supplement': 'Unchanged existing aggregate supplement, copied byte-for-byte; not rebuilt in this archive task.',
    'contentIssue': 'Submitted ethics-committee approval claim conflicts with author prior statement that no review occurred. Preserved as submitted, not endorsed.',
    'freshCitationFullTextAudit': False,
    'files': {member: sha(PAPER / member) for member in members},
    'bundle': {'name': bundle.name, 'sha256': sha(bundle), 'bytes': bundle.stat().st_size, 'members': members},
}
(HERE / 'qa/VERIFICATION.json').write_text(json.dumps(verification, indent=2) + '\n')

for member in members:
    copy(PAPER / member, TARGET / member)
copy(PAPER / 'main.pdf', REPO / 'output/pdf/aamas2027-current.pdf')
for name in [bundle.name, 'aamas2027-rewritten-source.zip', 'aamas2027-refreshed-source.zip']:
    copy(bundle, REPO / 'output/packages' / name)
copy(figurebundle, REPO / 'output/packages/aamas2027-figures.zip')
copy(HERE / 'README.md', REV / 'README.md')
copy(HERE / 'archive-submission.py', REV / 'archive-submission.py')
copy(HERE / 'qa/VERIFICATION.json', REV / 'qa/VERIFICATION.json')
copy(PAPER / 'build-console.log', REV / 'qa/build-console.log')
copy(PAPER / 'main.log', REV / 'qa/main.log')
copy(PAPER / 'main.blg', REV / 'qa/main.blg')
copy(PAPER / 'main.tex', REV / 'submitted-main.tex')
copy(HERE / 'before/main.tex', REV / 'before/main.tex')
copy(HERE / 'before/main.pdf', REV / 'before/main.pdf')
assert sha(TARGET / 'main.tex') == EXPECTED
print(json.dumps({'pages': len(pages), 'bundle': str(bundle), 'sha256': sha(bundle),
                  'bytes': bundle.stat().st_size, 'publishedTo': str(TARGET)}, indent=2))
