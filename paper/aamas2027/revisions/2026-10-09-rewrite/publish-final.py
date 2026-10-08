"""Copy the allowlisted final paper handoff to the existing writing checkout.

No participant inputs, original photos or reference PDFs are published.
Run verification first; this script does not commit or push.
"""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent / 'writing-paper-refresh'
PAPER = REPO / 'paper/aamas2027'
REV = PAPER / 'revisions/2026-10-09-rewrite'

def copy(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    assert source.read_bytes() == target.read_bytes()

checks = json.loads((HERE / 'qa/VERIFICATION.json').read_text())
assert checks['mainPages'] == 8 and checks['overfullBoxes'] == 0
assert checks['visualReview'].startswith('Completed:')
assert checks['referenceTextMap']['abstractSentences'] == 11
source = HERE / 'aamas2027-rewritten-source.zip'
assert hashlib.sha256(source.read_bytes()).hexdigest() == checks['sourceZip']['sha256']
with zipfile.ZipFile(source) as bundle:
    assert bundle.testzip() is None
    for member in bundle.namelist():
        if member == 'README.md':
            continue  # Repository README has repository-relative links.
        assert not Path(member).is_absolute() and '..' not in Path(member).parts
        local = HERE / ('paper' if not member.startswith('supplement/') else '') / member
        assert local.is_file() and local.read_bytes() == bundle.read(member)
        copy(local, PAPER / member)
    figures = [name for name in bundle.namelist() if name.startswith('figures/')]
copy(HERE / 'paper/main.pdf', PAPER / 'main.pdf')
copy(HERE / 'paper/main.pdf', REPO / 'output/pdf/aamas2027-current.pdf')
copy(HERE / 'supplement/supplement.pdf', PAPER / 'supplement/supplement.pdf')
copy(HERE / 'supplement/supplement.pdf', REPO / 'output/pdf/aamas2027-supplement.pdf')
for name in ['aamas2027-rewritten-source.zip', 'aamas2027-aggregate-supplement.zip']:
    copy(HERE / name, REPO / 'output/packages' / name)
# Refresh the previously advertised current-source filename too.
copy(source, REPO / 'output/packages/aamas2027-refreshed-source.zip')
figurezip = REPO / 'output/packages/aamas2027-figures.zip'
with zipfile.ZipFile(figurezip, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
    for member in sorted(figures):
        bundle.write(HERE / 'paper' / member, member)
with zipfile.ZipFile(figurezip) as bundle:
    assert bundle.testzip() is None and sorted(bundle.namelist()) == sorted(figures)
for name in ['CHANGELOG.md', 'CITATION-ALIGNMENT.md', 'REFERENCE-TEXT-MAP.md',
             'REFERENCE-TEXT-MAP.json', 'SOURCE-README.md', 'changes.diff',
             'build-assets.py', 'build-reference-map.py', 'verify-and-package.py',
             'publish-final.py', 'qa/VERIFICATION.json', 'qa/image-derivatives.json',
             'analysis/paired-comparisons.csv', 'analysis/adjusted-comparisons.csv']:
    copy(HERE / name, REV / name)
print('Published current TeX, eight figure assets, PDFs, supplement, ZIPs and revision records.')
print('Private inputs, original images and full source PDFs excluded; no Git mutation performed.')
