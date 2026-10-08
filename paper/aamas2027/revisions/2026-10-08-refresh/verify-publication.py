"""Read-only check of the public writing-branch handoff before a push."""
from pathlib import Path
import hashlib, json, sys, zipfile

root = Path(sys.argv[1]).resolve()
revision = root/'paper/aamas2027/revisions/2026-10-08-refresh'
manifest = json.loads((revision/'publication-manifest.json').read_text())
for name, digest in manifest['fileHashes'].items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest() == digest, name

stats = json.loads((revision/'analysis/statistics-public.json').read_text())
stack = [stats]
while stack:
    value = stack.pop()
    if isinstance(value, dict):
        assert not {'participantMeans', 'differences', 'durationConfirmation'} & set(value)
        assert not isinstance(value.get('participants'), list)
        stack.extend(value.values())
    elif isinstance(value, list):
        stack.extend(value)
assert stats['participants'] == 24
assert all(row['n'] == 24 for row in stats['core_tests']+stats['piece_tests']+stats['secondary_tests'])
with zipfile.ZipFile(root/'output/packages/aamas2027-refreshed-source.zip') as archive:
    assert archive.testzip() is None
    assert not any(name.startswith('inputs/') for name in archive.namelist())
assert (root/'paper/aamas2027/main.pdf').read_bytes() == (root/'output/pdf/aamas2027-current.pdf').read_bytes()
assert all((root/name).stat().st_size < 10*1024*1024 for name in manifest['copiedFiles'])
print(f"Verified {len(manifest['fileHashes'])} publication hashes, aggregate-only JSON, primary n24, matching PDF copies and source ZIP.")
