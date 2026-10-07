#!/usr/bin/env python3
"""Check current citation coverage and exact PDF anchors against the reviewed map.

Requires the authorized local ignored PDF cache and pypdf. Mechanical matching
checks traceability; semantic claim verification still requires reading the text.
"""
from pathlib import Path
import hashlib,json,re,unicodedata
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];PAPER=ROOT/'paper/aamas2027'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
hashtext=lambda s:hashlib.sha256(s.encode()).hexdigest()
m=json.loads((PAPER/'literature/reference-text-map.json').read_text())
assert sha(PAPER/'main.tex')==m['latex_sha256'],'Manuscript changed; refresh map.'
assert sha(PAPER/'manuscript.md')==m['manuscript_sha256'],'Readable manuscript changed; refresh map.'
t=(PAPER/'main.tex').read_text();md=(PAPER/'manuscript.md').read_text().splitlines();anchors=0;mentions=0
for ref in m['references']:
 p=ROOT/ref['pdf_path'];assert sha(p)==ref['pdf_sha256'],ref['key'];r=PdfReader(p)
 pages={}
 for e in ref['evidence']:
  n=e['pdf_page']
  if n not in pages:pages[n]=' '.join(unicodedata.normalize('NFKC',r.pages[n-1].extract_text()).split())
  s=pages[n];assert hashtext(s)==e['normalized_page_sha256'],(ref['key'],n)
  assert hashtext(s[e['anchor_start']:e['anchor_end']])==e['anchor_sha256'],(ref['key'],e['id']);anchors+=1
 for o in ref['occurrences']:
  assert o['manuscript_excerpt'] in md[o['markdown_line']-1],(ref['key'],o['markdown_line'])
  line=t.splitlines()[o['latex_line']-1]
  assert any(ref['key'] in match[1].split(',') for match in re.finditer(r'\\cite\{([^}]+)\}',line)),(ref['key'],o['latex_line'])
 expected=sum(ref['key'] in match[1].split(',') for match in re.finditer(r'\\cite\{([^}]+)\}',t))
 assert expected==len(ref['occurrences']),ref['key'];mentions+=expected
cited={k for match in re.finditer(r'\\cite\{([^}]+)\}',t) for k in match[1].split(',')}
assert cited=={r['key'] for r in m['references']}
assert mentions==m['citation_occurrence_count']
print(f'Checked {len(cited)} PDFs, {mentions} current source mentions and {anchors} exact text anchors.')
