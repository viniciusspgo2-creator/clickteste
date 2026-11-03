#!/usr/bin/env python3
"""Install only one optimized web-ready representation per user-supplied font face.
Usage: python scripts/install-font-collection.py /path/to/FONTES.rar
Requires rarfile, fontTools; never embeds the source RAR or optional license text in client bundles.
The publisher must independently verify licenses permit public web embedding.
"""
from __future__ import annotations
import collections, csv, hashlib, io, json, os, re, sys, struct, zlib, zipfile
from pathlib import Path
import rarfile
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'fonts' / 'clickgruda-collection'
MANIFEST = ROOT / 'src' / 'lib' / 'creative' / 'installed-fonts.ts'
REPORT = ROOT / 'docs' / 'FONTES-COLECAO-INSTALADA.csv'
EXTS = {'.woff2': 0, '.woff': 1, '.otf': 2, '.ttf': 3}
CHARS = set(map(ord, 'ÁÀÂÃÉÊÍÓÔÕÚÜÇáàâãéêíóôõúüç'))
MAX_FACE_BYTES = 8 * 1024 * 1024
MAX_ZIP_BYTES = 80 * 1024 * 1024
MAX_FACES = 2000


def font_name(font, *ids):
    table = font['name']
    for ident in ids:
        choices = [r for r in table.names if r.nameID == ident]
        choices.sort(key=lambda r: (r.platformID != 3, r.langID != 1033))
        for rec in choices:
            try:
                val = rec.toUnicode().replace('\x00', '').strip()
                if val: return re.sub(r'\s+', ' ', val)
            except Exception: pass
    return ''


def describe(payload):
    font = TTFont(io.BytesIO(payload), lazy=False)
    try:
        family = font_name(font, 16, 1) or 'Sem família'
        subfamily = font_name(font, 17, 2) or 'Regular'
        full = font_name(font, 4) or f'{family} {subfamily}'
        weight = int(font['OS/2'].usWeightClass) if 'OS/2' in font else 400
        cmap = font.getBestCmap() or {}
        missing = CHARS - set(cmap)
        status = 'complete' if not missing else 'partial' if len(missing) < len(CHARS) else 'none'
        return family, subfamily, full, weight, status
    finally: font.close()


class SalvagedZip:
    """Read complete local file entries when a supplied ZIP has no central index.
    Supports only safely bounded stored/deflated entries with explicit sizes.
    """
    def __init__(self, raw):
        self._items = []
        self._data = {}
        offset = 0
        while offset + 30 <= len(raw) and raw[offset:offset+4] == b'PK\x03\x04':
            sig,version,flags,method,mt,md,crc,compressed,size,nlen,xlen = struct.unpack_from('<IHHHHHIIIHH', raw, offset)
            if flags & 0x09 or method not in (0,8): break
            start=offset+30+nlen+xlen
            if compressed>MAX_FACE_BYTES*2 or size>MAX_FACE_BYTES or start+compressed>len(raw): break
            name=raw[offset+30:offset+30+nlen].decode('utf8','replace')
            data=raw[start:start+compressed]
            try:
                data=zlib.decompress(data,-15) if method==8 else data
                if len(data)!=size or zlib.crc32(data)&0xffffffff != crc: break
                class Item:
                    def __init__(self,n,s):self.filename=n;self.file_size=s
                    def is_dir(self):return self.filename.endswith('/')
                entry=Item(name,size)
                self._items.append(entry);self._data[name]=data
            except Exception: break
            offset=start+compressed
        if not self._items: raise ValueError('Nenhum arquivo ZIP recuperável')
    def infolist(self): return self._items
    def read(self,item): return self._data[item.filename if hasattr(item,'filename') else item]

def main():
    if len(sys.argv) != 2: raise SystemExit('Pass path to user-supplied RAR')
    DEST.mkdir(parents=True, exist_ok=True)
    for old in DEST.glob('*'): old.unlink() # generation always reproducible and atomic at source level
    rar = rarfile.RarFile(sys.argv[1])
    candidates = []
    rejected = []
    licenses = set()
    for outer in rar.infolist():
        if not outer.filename.lower().endswith('.zip'): continue
        try:
            if outer.file_size > MAX_ZIP_BYTES: raise ValueError('Pacote ZIP muito grande')
            raw_zip = rar.read(outer)
            try: nested = zipfile.ZipFile(io.BytesIO(raw_zip))
            except zipfile.BadZipFile: nested = SalvagedZip(raw_zip)
            by_stem = collections.defaultdict(list)
            for item in nested.infolist():
                name = item.filename.replace('\\', '/')
                if item.is_dir() or '__MACOSX' in name or name.split('/')[-1].startswith('._'): continue
                ext = os.path.splitext(name)[1].lower()
                if ext in ('.txt','.pdf','.rtf') and any(s in name.lower() for s in ('license','licence','readme','read me','eula')):
                    licenses.add(outer.filename)
                if ext not in EXTS: continue
                if item.file_size <= 0 or item.file_size > MAX_FACE_BYTES:
                    rejected.append((outer.filename,name,'Tamanho inválido')); continue
                base = os.path.splitext(name.split('/')[-1])[0].casefold().replace(' ', '')
                by_stem[base].append((EXTS[ext],item,ext))
            # Prefer .woff2, .woff and retain OTF/TTF only when no web version exists.
            for _, items in by_stem.items():
                # Broken WOFF2 inside a supplier package must not suppress valid OTF/TTF.
                for _,item,ext in sorted(items, key=lambda x:(x[0],x[1].file_size)):
                    try:
                        raw = nested.read(item)
                        family,subfamily,full,weight,status=describe(raw)
                        candidates.append({'outer':outer.filename,'member':item.filename,'family':family,'style':subfamily,'full':full,'weight':weight,'status':status,'raw':raw,'ext':ext})
                        break
                    except Exception as error:
                        rejected.append((outer.filename,item.filename,f'Fonte inválida: {str(error)[:90]}'))
        except Exception as error:
            rejected.append((outer.filename,'',f'ZIP inválido: {str(error)[:90]}'))
    # Do NOT merge different faces sharing incomplete internal name records.
    # E.g. Extrude, Shadow and Alt files sometimes all advertise "Regular".
    # ZIP-format duplicates were already normalized by exact filename stem.
    faces=sorted(candidates,key=lambda f:(f['family'].casefold(),f['style'].casefold(),f['outer'],f['member']))
    if len(faces)>MAX_FACES: raise RuntimeError('Limite de fontes excedido')
    seen = collections.Counter()
    manifest = []
    for face in faces:
        # Distinct faces are distinct options; other catalog fonts cannot collide.
        title = face['full'].strip() or face['family']
        key=title.casefold(); seen[key]+=1
        if seen[key]>1:
            variant=os.path.splitext(os.path.basename(face['member']))[0].replace('_',' ').strip()
            title=f'{title} · {variant}'
            # A repeated style in a second package also needs a unique CSS ID.
            if any(entry['name']=='Coleção · '+title for entry in manifest):
                title=f'{title} ({seen[key]})'
        name='Coleção · '+title
        raw=face['raw']
        keyhash=hashlib.sha256(raw).hexdigest()[:18]
        filename=f'{keyhash}{face["ext"]}'
        path=DEST/filename
        if not path.exists(): path.write_bytes(raw)
        manifest.append({'name':name,'family':face['family'],'style':face['style'],'category':face['status'],'url':f'/fonts/clickgruda-collection/{filename}'})
    MANIFEST.write_text('''/** Gerado por scripts/install-font-collection.py com arquivos fornecidos pelo proprietário.
 * Distribuição pública depende de licença apropriada de cada família. Não edite manualmente.
 */
export type InstalledTypeface={name:string;family:string;style:string;category:'complete'|'partial'|'none';url:string};
export const installedTypefaces:InstalledTypeface[]='''+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    with REPORT.open('w',newline='',encoding='utf-8-sig') as file:
        writer=csv.writer(file);writer.writerow(['Nome no editor','Família','Estilo','Acentos PT-BR','Arquivo','Pacote original','Licença no ZIP'])
        for face,record in zip(faces,manifest):writer.writerow([record['name'],face['family'],face['style'],face['status'],record['url'],face['outer'],'Há texto possivelmente relevante' if face['outer'] in licenses else 'Não identificada'])
    info={'rar_zip_entries':sum(i.filename.lower().endswith('.zip') for i in rar.infolist()),'face_candidates':len(candidates),'faces_installed':len(manifest),'files_saved':len(list(DEST.iterdir())),'installed_bytes':sum(p.stat().st_size for p in DEST.iterdir()),'with_license_text':len(licenses),'rejected':rejected}
    (ROOT/'docs'/'FONTES-COLECAO-RESULTADO.json').write_text(json.dumps(info,indent=2,ensure_ascii=False),encoding='utf8')
    print(json.dumps({k:v for k,v in info.items() if k!='rejected'},ensure_ascii=False))
    print('rejected',rejected[:20])

if __name__=='__main__':main()
