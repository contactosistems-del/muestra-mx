// Sirve como archivo .jpg la imagen de una noticia guardada dentro de Firestore,
// para que las redes sociales la puedan mostrar como miniatura.
const { getDoc, val } = require('./_firestore');

module.exports = async (req, res) => {
  const id = String(req.query.id || '');
  const f = await getDoc('noticias', id);
  let buf = null;
  let mime = 'image/jpeg';
  if (f) {
    const bytes = val(f.imageBytes);
    const url = String(val(f.imageUrl) || '');
    if (bytes && bytes.bytes) {
      buf = Buffer.from(bytes.bytes, 'base64');
    } else {
      const match = url.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
      if (match) {
        mime = match[1];
        buf = Buffer.from(match[2], 'base64');
      } else if (/^https?:\/\//.test(url)) {
        res.statusCode = 302;
        res.setHeader('Location', url);
        return res.end();
      }
    }
  }
  if (!buf) {
    res.statusCode = 302;
    res.setHeader('Location', '/assets/brand/og-default.jpg');
    return res.end();
  }
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  res.statusCode = 200;
  res.end(buf);
};
