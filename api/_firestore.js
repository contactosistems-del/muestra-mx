// Utilidades compartidas por las funciones de /api (los archivos con "_" no se publican como rutas).
const PROJECT = 'muestramx-61d39';
const API_KEY = 'AIzaSyCTKcMeBVPK6WHqMQbEFjqt2ErvPPbAPBA';
const SITE = 'https://muestra.mx';

/** Lee un documento público de Firestore por REST. Devuelve null si no existe o falla. */
async function getDoc(collection, id) {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(id || '')) return null;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}?key=${API_KEY}`;
  try {
    const res = await fetch(url, { headers: { Referer: `${SITE}/` } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.fields || null;
  } catch {
    return null;
  }
}

/** Convierte un valor REST de Firestore a JS simple. */
function val(v) {
  if (!v || typeof v !== 'object') return undefined;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('bytesValue' in v) return { bytes: v.bytesValue };
  if ('mapValue' in v) {
    const out = {};
    for (const [k, x] of Object.entries(v.mapValue.fields || {})) out[k] = val(x);
    return out;
  }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  return undefined;
}

/** Texto en español de un campo que puede ser {es,en} o texto plano. */
function es(field) {
  const v = val(field);
  if (v && typeof v === 'object') return String(v.es || v.en || '');
  return v ? String(v) : '';
}

module.exports = { getDoc, val, es, SITE };
