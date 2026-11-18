// Sirve como imagen la foto de un candidato guardada en Firestore (contenido/foto__<encuesta>__<opción>).
// Así las encuestas no cargan las fotos dentro del documento, y la CDN de Vercel las guarda en caché.
const { getDoc, val } = require('./_firestore');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  const f = id.startsWith('foto__') ? await getDoc('contenido', id) : null;
  const match = String((f && val(f.imageUrl)) || '').match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
  if (!match) {
    res.statusCode = 302;
    res.setHeader('Location', '/favicon.svg');
    return res.end();
  }
  res.setHeader('Content-Type', match[1]);
  // La URL lleva ?v=… y cambia cuando cambia la foto, por eso se puede guardar en caché mucho tiempo.
  res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = 200;
  res.end(Buffer.from(match[2], 'base64'));
};
