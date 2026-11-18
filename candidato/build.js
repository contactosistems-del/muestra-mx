// Genera una página por ciudad (cada una con su vista previa para WhatsApp/Facebook):
//   /         -> Playa del Carmen
//   /tulum    -> Tulum
//   /tabasco  -> Centro, Tabasco
// Para agregar otra ciudad: copia una entrada de CIUDADES, pon el id de la encuesta
// (el que sale en muestra.mx/encuesta/<id>), crea su imagen en og/<slug>.jpg (1200x630)
// y sus secciones del INE en data/<slug>-secciones.json (ver scripts de build_ine.py).
const fs = require('fs');
const path = require('path');

const CIUDADES = [
  { slug: '', og: 'playa', name: 'Playa del Carmen', survey: 'playa-del-carmen-2027', lat: 20.6296, lng: -87.0739, zoom: 13 },
  { slug: 'tulum', og: 'tulum', name: 'Tulum', survey: 'tulum-2027', lat: 20.2114, lng: -87.4654, zoom: 13 },
  { slug: 'tabasco', og: 'tabasco', name: 'Centro, Tabasco', survey: 'tabasco_centro2027', lat: 17.9895, lng: -92.9475, zoom: 12 },
];

// Dirección pública del sitio (Vercel la da al compilar); sirve para que las vistas previas tengan la URL completa.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.SITE_HOST || 'seguimiento-pdc.vercel.app';
const base = `https://${host.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

const here = __dirname;
const out = path.join(here, 'dist');
const template = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'og'), { recursive: true });
for (const dir of ['og', 'data']) {
  fs.mkdirSync(path.join(out, dir), { recursive: true });
  for (const f of fs.readdirSync(path.join(here, dir))) fs.copyFileSync(path.join(here, dir, f), path.join(out, dir, f));
}

for (const c of CIUDADES) {
  const title = `Monitoreo de votación en vivo · ${c.name}`;
  const html = template
    .replaceAll('__TITLE__', esc(title))
    .replaceAll('__DESC__', esc(`Mapa en vivo de la encuesta de ${c.name} · muestra.mx`))
    .replaceAll('__URL__', `${base}/${c.slug}`)
    .replaceAll('__OG_IMAGE__', `${base}/og/${c.og}.jpg`)
    .replaceAll('__CITY_NAME__', esc(c.name))
    .replace('__CITY_JSON__', JSON.stringify({ name: c.name, survey: c.survey, lat: c.lat, lng: c.lng, zoom: c.zoom, data: `/data/${c.og}-secciones.json` }));
  const dir = path.join(out, c.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`✓ /${c.slug} -> ${c.survey}`);
}
