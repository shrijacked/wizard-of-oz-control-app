"""Download publicly available original/author PDFs for the 19 added citations."""
import concurrent.futures, hashlib, json, re, subprocess, urllib.request
from pathlib import Path
from pypdf import PdfReader

HERE=Path(__file__).resolve().parent
PAPER=HERE/'fetched-writing/paper/aamas2027'
DEST=HERE/'citation-verification'
DEST.mkdir(exist_ok=True)
queue={
 'quigley2024':'https://knowledge.uchicago.edu/records/fnp5p-m0q24/files/Publication-guidelines-for-human-heart-rate-and-heart-rate-variability-studies-in-psychophysiology.pdf?download=1',
 'shukla2026':'https://arxiv.org/pdf/2601.20402v1',
 'smit2024':'https://arxiv.org/pdf/2404.08006v1',
 'wei2025':'https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2025.1611524/pdf',
 'zhao2025':'https://arxiv.org/pdf/2505.11818v1',
 'ramnauth2026':'https://scazlab.yale.edu/sites/default/files/files/ramnauth-thri3797264.pdf',
 'lavitnicora2024':'https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2024.1394379/pdf',
 'tanneberg2024':'https://arxiv.org/pdf/2403.12533',
 'andriella2025mentalising':'https://link.springer.com/content/pdf/10.1007/s12369-025-01280-z.pdf',
 'vitry2026':'https://arxiv.org/pdf/2606.28469v2',
 'prajod2024':'https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2024.1393795/pdf',
 'cavicchi2025':'https://link.springer.com/content/pdf/10.1186/s41235-025-00616-7.pdf',
 'vandijk2023':'https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2023.1244656/pdf',
 'varrasi2026':'https://shura.shu.ac.uk/37555/1/Human%20and%20Robot%20Assistance%20for%20Cognitive%20Load%20in%20Younger%20and%20Older%20Adults%20Multimodal%20Within-Subject%20Experimental%20Study.pdf',
 'bejarano2024':'https://mirrorlab.mines.edu/publications/bejarano2024roman/bejarano2024roman___wozinterface/',
 'candon2023':'https://interactive-machines.com/assets/papers/candon2023soliciting.pdf',
 'cao2025':'https://www.roboticsproceedings.org/rss21/p089.pdf',
 'bhagatsmith2026':'https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2026.1872363/pdf',
 'tanjim2025':'https://arxiv.org/pdf/2506.08892v3',
 'cao2025-author':'https://arxiv.org/pdf/2501.01568v2',
}
oldkeys=set(re.findall(r'@\w+\{([^,]+),',(HERE/'backup-current-paper/references.bib').read_text()))
newkeys=set(re.findall(r'@\w+\{([^,]+),',(PAPER/'references.bib').read_text()))-oldkeys
assert newkeys==set(queue)-{'cao2025-author'},(newkeys,set(queue))

def fetch(item):
 key,url=item; path=DEST/(key+'.pdf'); record=dict(key=key,url=url)
 try:
  if not path.exists():
   req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (academic manuscript verification)'})
   with urllib.request.urlopen(req,timeout=45) as response: content=response.read(); record['resolvedUrl']=response.url
   if not content.startswith(b'%PDF'): raise ValueError('Server response is not a PDF; not saved as paper.')
   path.write_bytes(content)
  reader=PdfReader(path)
  text='\n\f\n'.join(p.extract_text() or '' for p in reader.pages)
  (DEST/(key+'.txt')).write_text(text, errors='replace')
  record.update(status='downloaded; awaiting claim-level check',bytes=path.stat().st_size,pages=len(reader.pages),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),textCharacters=len(text))
 except Exception as e: record.update(status='unavailable',error=str(e))
 print(key,record['status'],flush=True)
 return record

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool: records=list(pool.map(fetch,queue.items()))
(DEST/'download-manifest.json').write_text(json.dumps(records,indent=2)+'\n')
