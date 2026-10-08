"""Copy the verified publication artifacts, excluding private/raw/full-text inputs."""
from pathlib import Path
import argparse, copy, hashlib, json, shutil, subprocess, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('checkout',type=Path)
parser.add_argument('--revision-name', default='2026-10-08-refresh')
parser.add_argument('--refresh-unpublished', action='store_true', help='Refresh this task\'s untracked preparation only; never overwrite a tracked revision')
args=parser.parse_args()
source=Path(__file__).resolve().parent
checkout=args.checkout.resolve()
assert (checkout/'.git').is_file(), 'Expected separate Git worktree'
paper=checkout/'paper/aamas2027'
assert args.revision_name and all(c.isalnum() or c in '-_' for c in args.revision_name), 'Unsafe revision name'
revision=paper/'revisions'/args.revision_name
if revision.exists():
    assert args.refresh_unpublished, 'Use --refresh-unpublished only for this task\'s untracked preparation'
    tracked = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', 'HEAD', '--', str(revision.relative_to(checkout))], cwd=checkout, text=True)
    assert not tracked.strip(), 'Do not overwrite an existing tracked revision'
revision.mkdir(parents=True, exist_ok=True)
copied=[]
def transfer(src,dst):
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
    assert hashlib.sha256(src.read_bytes()).digest()==hashlib.sha256(dst.read_bytes()).digest()
    copied.append(str(dst.relative_to(checkout)))

inventory=json.loads((source/'package-inventory.json').read_text())
for row in inventory['files']:
    name=row['file']
    if not name.startswith('review/'):
        transfer(source/'publication-README.md' if name=='README.md' else source/'paper'/name,paper/name)
transfer(source/'paper/main.pdf',paper/'main.pdf')
transfer(source/'paper/main.pdf',checkout/'output/pdf/aamas2027-current.pdf')
transfer(source/'aamas2027-refreshed-source.zip',checkout/'output/packages/aamas2027-refreshed-source.zip')
for name in ['CHANGELOG.md','FINAL_DRAFT_REVIEW.md','publication-README.md','changes.diff','package-inventory.json','output-hashes.json']:
    transfer(source/name,revision/name)
local_revision = source/'revisions'/args.revision_name
if local_revision.exists():
    for name in ['README.md','changes-since-ab96ee4.diff','before-hashes.json']:
        if (local_revision/name).is_file():
            transfer(local_revision/name,revision/name)
    for name in ['main.tex','main.pdf']:
        if (local_revision/'before/paper'/name).is_file():
            transfer(local_revision/'before/paper'/name,revision/'before'/name)
for name in ['ANALYSIS.md','HOLM_EXPLAINED.md','paired-tests.csv','formative-summary.json','input-hashes.json','formative-helpfulness.pdf']:
    transfer(source/'analysis'/name,revision/'analysis'/name)
for name in ['analyse-refresh.py','paired-stats.py','render-results.py','verify-duration-and-results.py','verify-publication.py','package-refresh.py','finalize-source-audit.py','audit-all-sources.py','download-sources.py','publish-paper-refresh.py','record-setup-layout.py']:
    transfer(source/name,revision/name)
for name in ['ALL_SOURCE_AUDIT.md','CLAIM_AUDIT.md','REFERENCE_AND_POLICY_STATUS.md','all-source-downloads.json','download-manifest.json']:
    transfer(source/'citation-verification'/name,revision/'citation-verification'/name)
transfer(source/'qa/VERIFICATION.json',revision/'qa/VERIFICATION.json')
if (source/'qa/setup-layout/page-5.png').is_file():
    transfer(source/'qa/setup-layout/page-5.png',revision/'qa/setup-figure-page.png')

# Aggregate publication view: do not publish per-person means or row corrections.
stats=copy.deepcopy(json.loads((source/'analysis/statistics.json').read_text()))
stats.pop('participantMeans')
stats['cohortSizes']={key:len(value) for key,value in stats.pop('cohorts').items()}
stats['countCorrectionCount']=len(stats.pop('countCorrections'))
stats['originalCountConflictCount']=len(stats.pop('originalConflicts'))
stats.pop('durationConfirmation', None)
def aggregate_only(value):
    if isinstance(value, dict):
        return {key:aggregate_only(item) for key,item in value.items()
                if key not in ('participantMeans', 'differences')
                and not (key=='participants' and isinstance(item, list))}
    if isinstance(value, list):
        return [aggregate_only(item) for item in value]
    return value
stats=aggregate_only(stats)
stats['publicExportPolicy']='Aggregate statistics only; participant means, individual difference vectors, count corrections, duration overlays and raw inputs withheld from the public dataset. Source-method provenance is documented separately.'
target=revision/'analysis/statistics-public.json'
target.write_text(json.dumps(stats,indent=2,allow_nan=False)+'\n')
copied.append(str(target.relative_to(checkout)))
with zipfile.ZipFile(source/'aamas2027-refreshed-source.zip') as archive:
    assert archive.testzip() is None
    assert not any(name.startswith('inputs/') or name.endswith('rounds-with-counts.json') for name in archive.namelist())

manifest=dict(source='Local verified paper-refresh-2026-10-08 artifacts',
    destinationBranch='writing',copiedFiles=copied,
    excluded=['Raw participant exports and participant-level datasets','Filled workbook and pre-study forms','Recordings and puzzle/solution PDFs','Full third-party PDFs and extracted full texts','Local compiler intermediates and iterative renderings','Duplicate local/fetched backups already represented by Git history'],
    fileHashes={name:hashlib.sha256((checkout/name).read_bytes()).hexdigest() for name in copied})
(revision/'publication-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(dict(files=len(copied),canonicalTex=str(paper/'main.tex'),revision=str(revision),excluded=manifest['excluded']),indent=2))
