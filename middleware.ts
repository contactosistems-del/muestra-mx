import { rewrite } from '@vercel/edge';

const BOT =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Pinterest|vkShare|Googlebot|bingbot|Applebot/i;

const PROJECT_ID = 'muestramx-61d39';
const DEFAULT_IMAGE = '/assets/images/editorial/mapa-ine.jpg';

export const config = {
  matcher: ['/encuesta/:path*'],
};

const FALLBACKS: Record<string, { title: string; description: string; image: string }> = {
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

type FsValue = {
  stringValue?: string;
  booleanValue?: boolean;
  mapValue?: { fields?: Record<string, FsValue> };
  arrayValue?: { values?: FsValue[] };
};

function esc(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function str(field?: FsValue): string {
  return field?.stringValue?.trim() || '';
}

function localized(field?: FsValue): string {
  const fields = field?.mapValue?.fields;
  return str(fields?.es) || str(fields?.en) || '';
}

function absolute(origin: string, path: string): string {
  if (!path) return `${origin}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function toApp(request: Request): Response {
  return rewrite(new URL('/index.html', request.url));
}

async function loadSurvey(id: string): Promise<{
  title: string;
  description: string;
  image: string;
} | null> {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/encuestas/${encodeURIComponent(id)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { fields?: Record<string, FsValue> };
    const fields = data.fields;
    if (!fields) return null;
    if (fields.active?.booleanValue === false) return null;

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

function ogHtml(opts: {
  url: string;
  title: string;
  description: string;
  image: string;
}): Response {
  const title = esc(opts.title);
  const description = esc(opts.description);
  const image = esc(opts.image);
  const url = esc(opts.url);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${title} | muestra.mx</title>
<meta name="description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="muestra.mx">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:locale" content="es_MX">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<link rel="canonical" href="${url}">
</head>
<body>
<h1>${title}</h1>
<p>${description}</p>
<p><a href="${url}">Abrir encuesta en muestra.mx</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=60, stale-while-revalidate=86400',
    },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  try {
    const ua = request.headers.get('user-agent') || '';
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/encuesta\/([^/]+)\/?$/);
    if (!match || !match[1]) return toApp(request);

    const id = decodeURIComponent(match[1]).trim().toLowerCase();
    if (!id || id.includes('..')) return toApp(request);

    if (!BOT.test(ua)) return toApp(request);

    const origin = url.origin;
    const pageUrl = `${origin}/encuesta/${encodeURIComponent(id)}`;
    const survey = (await loadSurvey(id)) || FALLBACKS[id] || {
      title: 'Encuesta | muestra.mx',
      description: 'Participa en las encuestas de opinión pública de muestra.mx',
      image: DEFAULT_IMAGE,
    };

    return ogHtml({
      url: pageUrl,
      title: survey.title,
      description: survey.description,
      image: absolute(origin, survey.image || DEFAULT_IMAGE),
    });
  } catch {
    return toApp(request);
  }
}
