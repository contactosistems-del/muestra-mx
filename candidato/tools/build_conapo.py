"""Resumen de población por municipio (CONAPO, Reconstrucción y proyecciones 1990-2040) para el mapa del candidato."""
import json, sys, glob, openpyxl

SRC = sys.argv[1]   # carpeta con los zips descomprimidos de CONAPO
OUT = sys.argv[2]   # candidato/data
CIUDADES = {'playa': (23, 'Solidaridad'), 'tulum': (23, 'Tulum'), 'tabasco': (27, 'Centro')}

def rows(pattern):
    f = glob.glob(f'{SRC}/**/{pattern}', recursive=True)[0]
    ws = openpyxl.load_workbook(f, read_only=True).worksheets[0]
    ws.reset_dimensions()
    it = ws.iter_rows(values_only=True)
    head = next(it)
    return [dict(zip(head, r)) for r in it if r and r[0]]

for slug, (ent, mun) in CIUDADES.items():
    code = '23_QR' if ent == 23 else '27_TB'
    gg = [r for r in rows(f'2_Gran_Gedad_{code}.xlsx') if r['NOM_MUN'] == mun]
    q = [r for r in rows(f'1_Grupo_Quinq_{code}.xlsx') if r['NOM_MUN'] == mun]
    ind = {r['AÑO']: r for r in rows(f'3_Indicadores_Dem_{code}.xlsx') if r['NOM_MUN'] == mun}
    if not gg: raise SystemExit(f'no encontré {mun}')
    serie = {}
    for r in gg:
        serie[r['AÑO']] = serie.get(r['AÑO'], 0) + r['POB_TOTAL']
    def year(y):
        g = [r for r in gg if r['AÑO'] == y]
        qq = [r for r in q if r['AÑO'] == y]
        tot = sum(r['POB_TOTAL'] for r in g)
        # Mayores de edad (posibles votantes): 20+ completos y 2/5 del grupo 15-19.
        cols = [c for c in qq[0] if c.startswith('POB_') and c not in ('POB_TOTAL',)]
        adult = sum(sum(r[c] for c in cols if c >= 'POB_20') + 0.4 * r['POB_15_19'] for r in qq)
        i = ind[y]
        return {'anio': y, 'total': tot,
                'hombres': sum(r['POB_TOTAL'] for r in g if r['SEXO'] == 'HOMBRES'),
                'mujeres': sum(r['POB_TOTAL'] for r in g if r['SEXO'] == 'MUJERES'),
                'ninos': sum(r['POB_00_11'] for r in g), 'jovenes': sum(r['POB_12_29'] for r in g),
                'adultos': sum(r['POB_30_59'] for r in g), 'mayores': sum(r['POB_60_mm'] for r in g),
                'mayores_edad': round(adult), 'edad_mediana': i['EDAD_MED'], 'dependencia': i['RAZ_DEP'],
                'envejecimiento': i['IND_ENV_60']}
    out = {'fuente': 'CONAPO, Reconstrucción y proyecciones de la población de los municipios de México 1990-2040',
           'municipio': mun, 'serie': {str(k): v for k, v in sorted(serie.items()) if 2000 <= k <= 2040},
           'y2020': year(2020), 'y2027': year(2027), 'y2030': year(2030)}
    with open(f'{OUT}/{slug}-poblacion.json', 'w') as f: json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    print(slug, mun, out['y2027'])
