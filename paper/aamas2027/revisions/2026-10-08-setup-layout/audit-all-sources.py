"""Retrieve all active sources, retain exact PDFs, and extract page-indexed text."""
from pathlib import Path
import concurrent.futures, hashlib, json, re, urllib.request
import shutil
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
DEST = HERE/'citation-verification'
PAGES = DEST/'pages'
PAGES.mkdir(exist_ok=True)
old = {
 'andriella2025':'https://link.springer.com/content/pdf/10.1007/s11257-024-09421-1.pdf',
 'caiazzo2024':'https://scidar.kg.ac.rs/bitstream/123456789/21811/1/comparative-analysis-of-mental-workload-in-adaptive-human-robot-collaboration-during-assembly-tasks.pdf',
 'capponi2024':'https://www.qualityengineering.polito.it/content/download/1126/6184/file/Assembly%20complexity%20and%20physiological%20response%20in%20human-robot%20collaboration%20_%20Insights%20from%20a%20preliminary%20experimental%20analysis.pdf',
 'delazzari2025':'https://www.merl.com/publications/docs/TR2025-064.pdf',
 'hart2006':'https://www.nasa.gov/wp-content/uploads/2026/01/hfes-2006-paper.pdf',
 'hostettler2025':'https://alexandria.unisg.ch/bitstreams/b9548afd-a853-40ed-9141-7bb837ce1f77/download',
 'karbouj2026':'https://publica-rest.fraunhofer.de/server/api/core/bitstreams/e60c03db-8192-404a-a885-43c61307f554/content',
 'korivand2024':'https://mdpi-res.com/d_attachment/sensors/sensors-24-02817/article_deploy/sensors-24-02817.pdf',
 'melo2026':'https://www.jstage.jst.go.jp/article/ijabc/2026/1/2026_147/_pdf',
 'ojstersek2024':'https://mdpi-res.com/d_attachment/machines/machines-12-00546/article_deploy/machines-12-00546.pdf',
 'pereira2025':'https://mdpi-res.com/d_attachment/applsci/applsci-15-03317/article_deploy/applsci-15-03317.pdf',
 'tabatabaei2025':'https://arxiv.org/pdf/2502.16899v1',
 'teo2018':'https://sciences.ucf.edu/psychology/perl/wp-content/uploads/sites/29/2019/08/Enhancing-the-effectiveness-of-human-robot-teaming-with-a-closed-loop-system..pdf',
 'thunberg2026':'https://repositum.tuwien.at/bitstream/20.500.12708/227993/1/Thunberg-2026-Unpacking%20Lived%20Experiences%20of%20Wizards%20of%20Oz-vor.pdf',
 'yang2024':'https://scholarworks.indianapolis.iu.edu/bitstreams/5eb42ad8-e6eb-4495-9c1d-f520e3877a06/download',
}
previous = {r['key']:r for r in json.loads((DEST/'download-manifest.json').read_text())}
cache_provenance = json.loads((HERE/'legacy-writing-support/literature/download_provenance.json').read_text())
recovery = {'karbouj2026':'Karbouj_2026_Adaptive_HRC_Review.pdf', 'yang2024':'Yang_2024_Adaptive_Surgical_Assistance.pdf'}
for key,filename in recovery.items():
    path=DEST/(key+'.pdf')
    if not path.exists():
        cache=HERE.parents[1]/'wizard-of-oz-control-app/data/writing-reference/literature-pdfs'/filename
        provenance=next(r for r in cache_provenance if r['original_filename']==filename)
        assert hashlib.sha256(cache.read_bytes()).hexdigest()==provenance['sha256']
        shutil.copy2(cache,path)
queue = {**old, **{k:r['url'] for k,r in previous.items() if k!='cao2025-author'}}
keys = set(re.findall(r'@\w+\{([^,]+),',(HERE/'paper/references.bib').read_text()))
assert keys == set(queue) and len(keys)==34

def fetch(item):
 key,url = item;path=DEST/(key+'.pdf');record=dict(key=key,url=url,reviewStatus='Awaiting full-source audit')
 try:
  if path.exists():
   if key in previous: assert hashlib.sha256(path.read_bytes()).hexdigest()==previous[key]['sha256']
   record['retrieval']=('Previously downloaded original-source cache, recovered with SHA256 matched to old public-download provenance; fresh URL fetch failed (TLS certificate for Karbouj, non-PDF response for Yang).' if key in recovery else 'Existing exact downloaded PDF re-opened and re-extracted in full-source audit')
  else:
   req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (academic source verification)'})
   with urllib.request.urlopen(req,timeout=40) as response:
    content=response.read();record['resolvedUrl']=response.url
   assert content.startswith(b'%PDF'), 'Not a PDF; no paper saved'
   path.write_bytes(content)
   record['retrieval']='Fresh public PDF download, 8 October 2026'
  reader=PdfReader(path)
  pages=[{'page':n,'text':page.extract_text() or ''} for n,page in enumerate(reader.pages,1)]
  (PAGES/(key+'.json')).write_text(json.dumps(pages,ensure_ascii=True,indent=2)+'\n')
  (DEST/(key+'.txt')).write_text('\n\f\n'.join(p['text'] for p in pages),errors='replace')
  record.update(downloadStatus='Downloaded and parsed',bytes=path.stat().st_size,pages=len(pages),sha256=hashlib.sha256(path.read_bytes()).hexdigest())
 except Exception as e:record.update(downloadStatus='Unavailable',error=str(e))
 print(key,record['downloadStatus'],flush=True)
 return record

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
 records=list(pool.map(fetch,queue.items()))
(DEST/'all-source-downloads.json').write_text(json.dumps(records,indent=2)+'\n')
print('Successful PDFs:',sum(r['downloadStatus']=='Downloaded and parsed' for r in records),'of',len(records))
