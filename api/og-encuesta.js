const PROJECT_ID = 'muestramx-61d39';
const DEFAULT_IMAGE = '/assets/images/editorial/mapa-ine.jpg';

const FALLBACKS = {
  'tulum-2027': {
    title: 'Encuesta Tulum 2027',
    description:
      '¿A quién prefieres como candidato(a) de Morena en 2027 a la Presidencia Municipal de Tulum, Quintana Roo?',
    image: '/assets/images/surveys/tulum-2027/romualda-dzul.jpg',
  },
  'playa-2027': {
    title: 'Playa del Carmen 2027',
    description:
      '¿Quién crees que deba ser la candidata o el candidato de MORENA VERDE PT para la Presidencia Municipal en 2027?',
    image: DEFAULT_IMAGE,
  },
};

function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function str(field) {
  return field?.stringValue?.trim() || '';
}

function localized(field) {
  const fields = field?.mapValue?.fields;
  return str(fields?.es) || str(fields?.en) || '';
}

function absolute(origin, path) {
  if (!path) return `${origin}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

async function loadSurvey(id) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/encuestas/${encodeURIComponent(id)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const fields = data.fields;
    if (!fields || fields.active?.booleanValue === false) return null;

    const title = localized(fields.title) || localized(fields.shortLabel) || `Encuesta ${id}`;
    const description =
      localized(fields.question) || localized(fields.city) || 'Participa en la encuesta de muestra.mx';

    let image = '';
    for (const option of fields.options?.arrayValue?.values || []) {
      const img = str(option.mapValue?.fields?.imageUrl);
      if (img) {
        image = img;
        break;
      }
    }
    return { title, description, image };
  } catch {
    return null;
  }
}

function ogHtml({ url, title, description, image }) {
  const t = esc(title);
  const d = esc(description);
  const i = esc(image);
  const u = esc(url);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${t} | muestra.mx</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="muestra.mx">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${i}">
<meta property="og:image:secure_url" content="${i}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_MX">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<link rel="canonical" href="${u}">
</head>
<body>
<h1>${t}</h1>
<p>${d}</p>
<p><a href="${u}">Abrir encuesta</a></p>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  try {
    const id = String(req.query.id || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '');
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'muestra.mx';
    const origin = `${proto}://${host}`;
    const pageUrl = `${origin}/encuesta/${encodeURIComponent(id || 'encuesta')}`;

    const survey = (id && (await loadSurvey(id))) || FALLBACKS[id] || {
      title: 'Encuesta | muestra.mx',
      description: 'Participa en las encuestas de opinión pública de muestra.mx',
      image: DEFAULT_IMAGE,
    };

    const html = ogHtml({
      url: pageUrl,
      title: survey.title,
      description: survey.description,
      image: absolute(origin, survey.image || DEFAULT_IMAGE),
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
    res.end(html);
  } catch (err) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      ogHtml({
        url: 'https://muestra.mx/',
        title: 'muestra.mx',
        description: 'Encuestas y opinión pública',
        image: 'https://muestra.mx/assets/images/editorial/mapa-ine.jpg',
      }),
    );
  }
};
