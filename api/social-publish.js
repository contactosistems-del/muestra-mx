// Publica una noticia de muestra.mx en la página de Facebook y en Instagram (API de Meta, gratis).
// Solo lo puede usar admin@muestra.mx: el panel manda su token de sesión de Firebase.
//
// Variables de entorno en Vercel (proyecto web-muestra):
//   META_PAGE_ID      → ID de la página de Facebook de muestra.mx
//   META_PAGE_TOKEN   → token de la página (de larga duración)
//   META_IG_USER_ID   → ID de la cuenta profesional de Instagram ligada a la página
// Si faltan, el panel lo avisa y se puede seguir publicando a mano.
const { getDoc, val, SITE } = require('./_firestore');

const API_KEY = 'AIzaSyCTKcMeBVPK6WHqMQbEFjqt2ErvPPbAPBA';
const ADMIN_EMAILS = ['admin@muestra.mx'];
const GRAPH = 'https://graph.facebook.com/v24.0';

const config = () => ({
  page: process.env.META_PAGE_ID || '',
  token: process.env.META_PAGE_TOKEN || '',
  ig: process.env.META_IG_USER_ID || '',
});

async function adminEmail(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!m) return null;
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `${SITE}/` },
    body: JSON.stringify({ idToken: m[1] }),
  });
  if (!res.ok) return null;
  const email = (await res.json()).users?.[0]?.email || '';
  return ADMIN_EMAILS.includes(email) ? email : null;
}

async function graph(path, params) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error?.message || `HTTP ${res.status}`);
  return json;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

const abs = (u) => (/^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const send = (code, obj) => {
    res.statusCode = code;
    res.end(JSON.stringify(obj));
  };

  const cfg = config();
  if (!(await adminEmail(req))) return send(401, { error: 'Solo el administrador puede publicar en redes.' });
  if (req.method === 'GET') return send(200, { facebook: !!(cfg.page && cfg.token), instagram: !!(cfg.ig && cfg.token) });
  if (req.method !== 'POST') return send(405, { error: 'Método no permitido' });

  const body = await readBody(req);
  const id = String(body.id || '');
  const targets = Array.isArray(body.targets) ? body.targets : ['facebook', 'instagram'];
  const f = await getDoc('noticias', id);
  if (!f) return send(404, { error: 'No encontré la noticia.' });

  const social = val(f.social) || {};
  const link = `${SITE}/noticias/${id}`;
  const caption = String(body.caption || '').slice(0, 2000);
  const out = {};

  if (targets.includes('facebook')) {
    if (!cfg.page || !cfg.token) out.facebook = { ok: false, error: 'Falta conectar la página de Facebook.' };
    else {
      try {
        const params = { access_token: cfg.token, caption: caption.includes(link) ? caption : `${caption}\n\n${link}` };
        if (social.wide) params.url = abs(social.wide);
        const r = social.wide
          ? await graph(`${cfg.page}/photos`, params)
          : await graph(`${cfg.page}/feed`, { access_token: cfg.token, message: caption, link });
        out.facebook = { ok: true, id: r.post_id || r.id };
      } catch (e) {
        out.facebook = { ok: false, error: e.message };
      }
    }
  }

  if (targets.includes('instagram')) {
    if (!cfg.ig || !cfg.token) out.instagram = { ok: false, error: 'Falta conectar Instagram.' };
    else if (!social.ig) out.instagram = { ok: false, error: 'La noticia no tiene imagen para Instagram.' };
    else {
      try {
        const media = await graph(`${cfg.ig}/media`, {
          access_token: cfg.token,
          image_url: abs(social.ig),
          caption: caption.replace(link, '').trim(),
        });
        let published = null;
        for (let i = 0; i < 6 && !published; i += 1) {
          try {
            published = await graph(`${cfg.ig}/media_publish`, { access_token: cfg.token, creation_id: media.id });
          } catch (e) {
            if (i === 5) throw e;
            await wait(2500);
          }
        }
        out.instagram = { ok: true, id: published.id };
      } catch (e) {
        out.instagram = { ok: false, error: e.message };
      }
    }
  }

  return send(200, out);
};
