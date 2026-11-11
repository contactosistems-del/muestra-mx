// Devuelve la página del sitio con etiquetas Open Graph de cada noticia o encuesta,
// para que Facebook, WhatsApp, X, etc. muestren título, resumen e imagen al compartir.
const { getDoc, val, es, SITE } = require('./_firestore');
const EDITORIAL = require('./_editorial.json');

const DEFAULT = {
  title: 'MUESTRA.MX | Datos, Encuestas y Opinión Pública',
  description: 'Encuestas ciudadanas, resultados al momento y noticias de México. Opina, vota y consulta los datos.',
  image: `${SITE}/assets/brand/og-default.jpg`,
};

let cachedIndex = null;
async function loadIndex(origin) {
  if (cachedIndex) return cachedIndex;
  const res = await fetch(`${origin}/index.html`);
  cachedIndex = await res.text();
  return cachedIndex;
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function summary(text, max = 200) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

const absolute = (url) => (/^https?:\/\//.test(url) ? url : `${SITE}${url.startsWith('/') ? '' : '/'}${url}`);

async function newsMeta(id) {
  if (EDITORIAL[id]) {
    const n = EDITORIAL[id];
    return { title: n.title, description: summary(n.summary), image: absolute(n.image), type: 'article' };
  }
  const f = await getDoc('noticias', id);
  if (!f) return null;
  const title = es(f.title);
  if (!title) return null;
  const rawImage = val(f.imageUrl) || '';
  let image = DEFAULT.image;
  if (f.imageBytes || String(rawImage).startsWith('data:')) image = `${SITE}/api/news-image?id=${encodeURIComponent(id)}`;
  else if (rawImage) image = absolute(String(rawImage));
  return { title, description: summary(es(f.body)), image, type: 'article' };
}

async function surveyMeta(id) {
  const f = await getDoc('encuestas', id);
  if (!f) return null;
  const title = es(f.title) || es(f.shortLabel);
  const question = es(f.question);
  if (!title && !question) return null;
  return {
    title: `${title || 'Encuesta'} | MUESTRA.MX`,
    description: summary(question ? `${question} Vota y mira los resultados al momento.` : 'Vota y mira los resultados al momento.'),
    image: DEFAULT.image,
    type: 'website',
  };
}

module.exports = async (req, res) => {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const origin = `${proto}://${req.headers.host}`;
  const { type, id } = req.query;
  const path = type === 'survey' ? `/encuesta/${id}` : `/noticias/${id}`;

  let html;
  try {
    html = await loadIndex(origin);
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    return res.end();
  }

  let meta = null;
  try {
    meta = type === 'survey' ? await surveyMeta(String(id)) : await newsMeta(String(id));
  } catch {
    meta = null;
  }
  const m = { ...DEFAULT, type: 'website', ...(meta || {}) };
  const url = `${SITE}${path}`;
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:site_name" content="MUESTRA.MX">`,
    `<meta property="og:locale" content="es_MX">`,
    `<meta property="og:type" content="${m.type}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:title" content="${esc(m.title)}">`,
    `<meta property="og:description" content="${esc(m.description)}">`,
    `<meta property="og:image" content="${esc(m.image)}">`,
    `<meta property="og:image:secure_url" content="${esc(m.image)}">`,
    `<meta property="og:image:alt" content="${esc(m.title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.title)}">`,
    `<meta name="twitter:description" content="${esc(m.description)}">`,
    `<meta name="twitter:image" content="${esc(m.image)}">`,
  ].join('\n  ');

  // Quita las etiquetas genéricas del index y pone las de esta página.
  const out = html
    .replace(/<!-- og:start -->[\s\S]*?<!-- og:end -->/, '')
    .replace(/<meta (?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>\s*/g, '')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<head>/, `<head>\n  ${tags}`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
  res.statusCode = 200;
  res.end(out);
};
