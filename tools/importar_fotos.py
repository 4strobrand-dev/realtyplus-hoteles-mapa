"""Importa y optimiza las fotos de todos los países para el mapa interactivo global.

Uso (desde la carpeta 'Mapa interactivo global'):   python tools/importar_fotos.py

Lee:
  ..\\<País>\\02 Fotos\\Hoteles\\<Referencia>\\*.jpg|png|webp...   (fotos propias del activo)
  ..\\<País>\\02 Fotos\\Destinos\\<zona>\\*                         (fotos del destino)
  ..\\<País>\\02 Fotos\\fotos.json                                  (opcional: orden 'recomendadas', 'confianza')
Escribe:
  assets/img/activos/<ref-slug>-NN.jpg     (máx. 1280 px, JPG q78)
  assets/img/destinos/<pais>--<zona>-N.jpg
  assets/data/fotos.js                     (índice que usa la web)

Regla en la web: foto propia -> foto del destino -> placeholder de marca con el nombre de la zona.
El destino de cada activo se busca con las 'claves_destino' de datos/coordenadas.json.
Se puede volver a ejecutar cuantas veces se quiera: solo recodifica lo que ha cambiado.
"""
import json, re, sys, unicodedata
from pathlib import Path
from PIL import Image, ImageOps

BASE = Path(__file__).resolve().parent.parent
HOTELES = BASE.parent
OUT_A = BASE / 'assets/img/activos'
OUT_D = BASE / 'assets/img/destinos'
EXT = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.bmp', '.jfif'}
MAX_PX, QUALITY = 1280, 78
MAX_ACTIVO, MAX_DESTINO = 6, 2
MIN_LADO = 320                      # descarta iconos / miniaturas
NO_PAISES = {'mapa interactivo global', 'informacion'}
CONFIANZA_NO = {'baja', 'nula', 'ninguna', 'descartada', 'no'}


def slug(s):
    s = unicodedata.normalize('NFKD', str(s)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def palabras(clave, texto):
    """True si 'clave' aparece como palabra(s) completas dentro de 'texto' (ambos slug)."""
    return re.search(r'(^|-)' + re.escape(clave) + r'(-|$)', texto) is not None


def imgs(folder):
    if not folder.is_dir():
        return []
    return sorted(p for p in folder.iterdir()
                  if p.is_file() and p.suffix.lower() in EXT and not p.name.startswith(('_', '.')))


def save(src, dst):
    """Optimiza src -> dst. Devuelve True si se guardó (o ya estaba al día)."""
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return True
    try:
        im = Image.open(src)
        im = ImageOps.exif_transpose(im)
        if min(im.size) < MIN_LADO and max(im.size) < 600:
            return False
        if im.mode in ('RGBA', 'LA', 'P'):
            im = im.convert('RGBA')
            bg = Image.new('RGB', im.size, (255, 255, 255))
            bg.paste(im, mask=im.split()[-1])
            im = bg
        else:
            im = im.convert('RGB')
        im.thumbnail((MAX_PX, MAX_PX), Image.LANCZOS)
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        return True
    except Exception as e:  # imagen corrupta o formato no soportado
        print('  ! no se pudo leer', src, '-', e)
        return False


def leer_json(p):
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return {}


CAMPOS_WEB = ['Referencia Consultoría', 'País', 'Ciudad / Zona genérica', 'Tipo de activo', 'Categoría / Estrellas',
              'Habitaciones (rango orientativo)', 'Precio', 'Moneda', 'Tipo de operación', 'Estado comercial',
              'Observaciones']


def exportar_datos(activos, coords):
    """Copia a assets/data/activos.js solo los campos que muestra la web, con los valores tal cual."""
    out = []
    for a in activos:
        r = {k: a.get(k) for k in CAMPOS_WEB}
        g = coords.get(a['Referencia Consultoría'], {})
        r['_geo'] = {k: g.get(k) for k in ('lat', 'lng', 'zona', 'region')}
        out.append(r)
    (BASE / 'assets/data/activos.js').write_text(
        '// Generado por tools/importar_fotos.py desde datos/activos_todos.json + datos/coordenadas.json\n'
        '// Valores del cliente sin modificar (solo los campos que se muestran).\nwindow.ACTIVOS = '
        + json.dumps(out, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    print('activos.js:', len(out), 'activos')


def main():
    activos = json.loads((BASE / 'datos/activos_todos.json').read_text(encoding='utf-8'))
    coords = json.loads((BASE / 'datos/coordenadas.json').read_text(encoding='utf-8'))['activos']
    exportar_datos(activos, coords)

    # Carpetas de país con '02 Fotos'
    paises = {}
    for d in sorted(HOTELES.iterdir()):
        if d.is_dir() and slug(d.name).replace('-', ' ') not in NO_PAISES and (d / '02 Fotos').is_dir():
            paises[slug(d.name)] = d / '02 Fotos'
    print('Carpetas de fotos:', ', '.join(p.parent.name for p in paises.values()) or '(ninguna)')

    # Índices: carpetas de hotel por slug de referencia, destinos por país, metadatos fotos.json
    hotel_dirs, meta = {}, {}
    dest_dirs = {}
    for ps, fd in paises.items():
        j = leer_json(fd / 'fotos.json')
        for ref, info in (j.get('activos') or {}).items():
            if isinstance(info, dict):
                meta[slug(ref)] = info
        for h in sorted((fd / 'Hoteles').glob('*')):
            if h.is_dir() and imgs(h):
                hotel_dirs[slug(h.name)] = h
        dest_dirs[ps] = [x for x in sorted((fd / 'Destinos').glob('*')) if x.is_dir() and imgs(x)]

    man = {'activos': {}, 'destinos': {}, 'generado': None}
    usados = set()
    stats = {'propia': [], 'destino': [], 'placeholder': []}

    def pais_slug(nombre):
        s = slug(nombre)
        alias = {'united-states': 'usa', 'estados-unidos': 'usa', 'eeuu': 'usa'}
        return alias.get(s, s)

    for a in activos:
        ref = a['Referencia Consultoría']
        rs = slug(ref)
        info = meta.get(rs, {})
        conf = slug(info.get('confianza', '')).replace('-', ' ')
        lst = []
        h = hotel_dirs.get(rs)
        if h and conf not in CONFIANZA_NO and info.get('usar', True) is not False:
            files = imgs(h)
            rec = [re.split(r'\s|\(', str(x).strip())[0] for x in (info.get('recomendadas') or [])]
            by_name = {f.name.lower(): f for f in files}
            orden = [by_name[r.lower()] for r in rec if r.lower() in by_name]
            orden += [f for f in files if f not in orden]
            for f in orden:
                if len(lst) >= MAX_ACTIVO:
                    break
                dst = OUT_A / f'{rs}-{len(lst) + 1:02d}.jpg'
                if save(f, dst):
                    lst.append('assets/img/activos/' + dst.name)
                    usados.add(dst.resolve())
        if lst:
            man['activos'][ref] = lst

        # Destino: país del activo y país de la referencia (p. ej. "Argentina 18" está en Chile)
        claves = [slug(k) for k in coords.get(ref, {}).get('claves_destino', [])]
        zona = slug(coords.get(ref, {}).get('zona', a.get('Ciudad / Zona genérica') or ''))
        cand_paises = []
        for p in (pais_slug(a.get('País') or ''), pais_slug(re.sub(r'\s*\d+$', '', ref))):
            if p in dest_dirs and p not in cand_paises:
                cand_paises.append(p)
        elegido = None
        for k in claves:
            for p in cand_paises:
                for dd in dest_dirs[p]:
                    if palabras(k, slug(dd.name)):
                        elegido = (p, dd); break
                if elegido: break
            if elegido: break
        if not elegido:
            for p in cand_paises:
                for dd in dest_dirs[p]:
                    if palabras(slug(dd.name), zona):
                        elegido = (p, dd); break
                if elegido: break
        if elegido:
            p, dd = elegido
            key = f'{p}--{slug(dd.name)}'
            if key not in man['destinos']:
                fl = []
                for f in imgs(dd):
                    if len(fl) >= MAX_DESTINO:
                        break
                    dst = OUT_D / f'{key}-{len(fl) + 1}.jpg'
                    if save(f, dst):
                        fl.append('assets/img/destinos/' + dst.name)
                        usados.add(dst.resolve())
                man['destinos'][key] = {'nombre': dd.name, 'fotos': fl}
            if man['destinos'][key]['fotos']:
                man.setdefault('destino_de', {})[ref] = key
        if lst:
            stats['propia'].append(ref)
        elif ref in man.get('destino_de', {}):
            stats['destino'].append(ref)
        else:
            stats['placeholder'].append(ref)

    # Limpia salidas que ya no se usan
    for folder in (OUT_A, OUT_D):
        for f in folder.glob('*.jpg'):
            if f.resolve() not in usados:
                f.unlink()

    from datetime import datetime
    man['generado'] = datetime.now().strftime('%Y-%m-%d %H:%M')
    man.setdefault('destino_de', {})
    (BASE / 'assets/data/fotos.js').write_text(
        '// Generado por tools/importar_fotos.py - no editar a mano\nwindow.FOTOS = '
        + json.dumps(man, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')

    # Fuerza al navegador a recargar los datos nuevos
    idx = BASE / 'index.html'
    if idx.exists():
        stamp = datetime.now().strftime('%Y%m%d%H%M')
        h = re.sub(r'(assets/data/(?:fotos|activos)\.js)\?v=[\w]+', lambda m: m.group(1) + '?v=' + stamp, idx.read_text(encoding='utf-8'))
        idx.write_text(h, encoding='utf-8')

    peso = sum(f.stat().st_size for f in (BASE / 'assets').rglob('*') if f.is_file())
    print(f"Activos con foto propia: {len(stats['propia'])}")
    print(f"Activos con foto de destino: {len(stats['destino'])}  {stats['destino']}")
    print(f"Activos con placeholder: {len(stats['placeholder'])}  {stats['placeholder']}")
    print(f"Destinos importados: {len(man['destinos'])}")
    print(f"Peso total de assets: {peso / 1048576:.1f} MB")


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
