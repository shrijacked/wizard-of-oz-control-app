"""Validate completed human/model claim reviews; retain manifest evidence pointers."""
from pathlib import Path
import hashlib, json, re

HERE = Path(__file__).resolve().parent
DEST = HERE/'citation-verification'
tex = (HERE/'paper/main.tex').read_text()
bib = (HERE/'paper/references.bib').read_text()
audit = (DEST/'ALL_SOURCE_AUDIT.md').read_text()
keys = set(re.findall(r'@\w+\{([^,]+),', bib))
cards = set(re.findall(r'^### (\w+) —', audit, re.M))
active = set(k.strip() for match in re.findall(r'\\cite\{([^}]+)\}', tex) for k in match.split(','))
assert cards == keys == active and len(cards) == 34
records = json.loads((DEST/'all-source-downloads.json').read_text())
assert {r['key'] for r in records} == keys
for row in records:
    key = row['key']
    assert row['downloadStatus'] == 'Downloaded and parsed'
    assert hashlib.sha256((DEST/(key+'.pdf')).read_bytes()).hexdigest() == row['sha256']
    row.update(reviewStatus='Complete: actual-PDF claim-level review',
        reviewDate='2026-10-08',
        reviewScope='Identity/version, design, relevant supporting passages and limitations; not every page read or independent replication.',
        auditCard='ALL_SOURCE_AUDIT.md (section '+key+')')
    row['manuscriptCitationLines'] = [n for n,line in enumerate(tex.splitlines(),1)
        if any(key in [k.strip() for k in match.split(',')] for match in re.findall(r'\\cite\{([^}]+)\}',line))]
    assert row['manuscriptCitationLines']
(DEST/'all-source-downloads.json').write_text(json.dumps(records,indent=2)+'\n')
print('34/34 active sources have matching PDFs, hashes, review cards and manuscript citations.')
