"""Une la cartografía de secciones del INE (MGS) con la lista nominal por sexo y edad.
Genera un GeoJSON ligero por ciudad para el mapa del candidato."""
import json, sys, openpyxl, shapefile
from pyproj import Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

INE_DIR = '/home/claude/ine'
XLSX = '/mnt/user-data/uploads/Downloads/Copia-de-DatosAbiertos-derfe-pdln_edms_re_20261105.xlsx'
OUT = sys.argv[1]
CIUDADES = {  # slug: (entidad, municipio INE, EPSG UTM)
    'playa': (23, 8, 32616),
    'tulum': (23, 9, 32616),
    'tabasco': (27, 4, 32615),
}

# --- lista nominal por sección ---
wb = openpyxl.load_workbook(XLSX, read_only=True)
ws = wb.worksheets[0]
rows = ws.iter_rows(values_only=True)
head = [str(h).replace('\n', ' ') for h in next(rows)]
idx = {h: i for i, h in enumerate(head)}
def g(r, name): return int(r[idx[name]] or 0)
def lista(r, rango): return sum(g(r, f'LISTA_{rango}_{s}') for s in ('HOMBRES', 'MUJERES', 'NOBINARIO'))
stats = {}
for r in rows:
    ent = r[0]
    if ent not in (23, 27): continue
    sec = int(r[idx['SECCION']] or 0)
    if not sec: continue
    stats[(ent, sec)] = {
        'ln': g(r, 'LISTA NOMINAL'),
        'h': g(r, 'LISTA HOMBRES'),
        'm': g(r, 'LISTA MUJERES'),
        'e1': lista(r, '18') + lista(r, '19') + lista(r, '20_24') + lista(r, '25_29'),
        'e2': lista(r, '30_34') + lista(r, '35_39') + lista(r, '40_44'),
        'e3': lista(r, '45_49') + lista(r, '50_54') + lista(r, '55_59') + lista(r, '60_64'),
        'e4': lista(r, '65_Y_MAS'),
    }
print('secciones con datos:', len(stats))

for slug, (ent, mun, epsg) in CIUDADES.items():
    tr = Transformer.from_crs(epsg, 4326, always_xy=True).transform
    rd = shapefile.Reader(f'{INE_DIR}/{ent}/{ent}/SECCION', encoding='utf-8')
    names = [f[0] for f in rd.fields[1:]]
    feats, missing = [], 0
    for sr in rd.iterShapeRecords():
        rec = dict(zip(names, sr.record))
        if rec['municipio'] != mun: continue
        geom = shape(sr.shape.__geo_interface__).buffer(0).simplify(12, preserve_topology=True)
        geom = transform(tr, geom)
        def rnd(c):
            if isinstance(c[0], (int, float)): return [round(c[0], 5), round(c[1], 5)]
            return [rnd(x) for x in c]
        gj = mapping(geom)
        gj = {'type': gj['type'], 'coordinates': rnd(gj['coordinates'])}
        st = stats.get((ent, rec['seccion']))
        if not st: missing += 1
        props = {'s': rec['seccion'], 't': rec['tipo'], 'dl': rec['distrito_l'], **(st or {'ln': 0, 'h': 0, 'm': 0, 'e1': 0, 'e2': 0, 'e3': 0, 'e4': 0})}
        feats.append({'type': 'Feature', 'properties': props, 'geometry': gj})
    fc = {'type': 'FeatureCollection', 'fuente': 'INE: Marco Geográfico Seccional (corte 15 oct 2026) y Lista Nominal por sexo y edad (corte 5 nov 2026)', 'features': feats}
    path = f'{OUT}/{slug}-secciones.json'
    with open(path, 'w') as f: json.dump(fc, f, separators=(',', ':'))
    ln = sum(f['properties']['ln'] for f in feats)
    print(slug, len(feats), 'secciones', 'sin datos:', missing, 'lista nominal total:', ln, path)
