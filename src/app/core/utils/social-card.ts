/**
 * Arma las imágenes para redes de una noticia, con la marca de muestra.mx:
 *  - wide: 1200×630 (Facebook, X, WhatsApp y la miniatura del enlace)
 *  - ig:   1080×1350 (Instagram, vertical)
 * Todo se dibuja en el navegador con <canvas>; no hace falta ningún servidor.
 */
export interface SocialCardInput {
  imageUrl: string;
  title: string;
  category: string;
  credit?: string;
}

export interface SocialCards {
  wide: string;
  ig: string;
}

const PINK = '#BE3455';
const GLOW = '#ff4f7b';
const INK = '#07090f';
const MUTED = '#8b95a7';
const LIGHT = '#f1f5f9';

export async function renderSocialCards(input: SocialCardInput): Promise<SocialCards> {
  if (typeof document !== 'undefined' && document.fonts?.ready) await document.fonts.ready;
  const font = getComputedStyle(document.body).fontFamily || 'sans-serif';
  const photo = await loadImage(input.imageUrl);
  try {
    return { wide: drawWide(photo, input, font), ig: drawIg(photo, input, font) };
  } catch {
    // Si la foto viene de un sitio que no permite usarla en canvas, se hace la tarjeta sin foto.
    return { wide: drawWide(null, input, font), ig: drawIg(null, input, font) };
  }
}

/** Saca el crédito de la foto ("Foto: …") del final del texto de la nota, si lo tiene. */
export function photoCredit(body: string): string {
  const m = String(body || '').match(/(?:^|\n)\s*Foto:\s*(.+)\s*$/i);
  if (!m) return '';
  let credit = m[1].trim();
  // "Descripción. Autor / Fuente (licencia)" → solo "Autor / Fuente (licencia)", para que quepa.
  if (credit.length > 55 && credit.includes('. ')) credit = credit.slice(credit.lastIndexOf('. ') + 2);
  return `Foto: ${credit}`.slice(0, 64);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    if (/^https?:\/\//.test(src) && !src.startsWith(location.origin)) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  if (!x) throw new Error('canvas');
  return [c, x];
}

function cover(x: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, zoom = 1, dx = 0, dy = 0) {
  const s = Math.max(w / img.width, h / img.height) * zoom;
  const iw = img.width * s;
  const ih = img.height * s;
  x.drawImage(img, (w - iw) / 2 + dx, (h - ih) / 2 + dy, iw, ih);
}

function grid(x: CanvasRenderingContext2D, w: number, h: number) {
  x.strokeStyle = 'rgba(255,255,255,.06)';
  x.lineWidth = 1;
  for (let i = 0; i <= w; i += 60) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, h);
    x.stroke();
  }
  for (let j = 0; j <= h; j += 60) {
    x.beginPath();
    x.moveTo(0, j);
    x.lineTo(w, j);
    x.stroke();
  }
}

/** Anillos tipo radar y puntos conectados: el sello visual de muestra.mx. */
function radar(x: CanvasRenderingContext2D, cx: number, cy: number, k: number) {
  const glow = x.createRadialGradient(cx, cy, 10, cx, cy, 300 * k);
  glow.addColorStop(0, 'rgba(190,52,85,.38)');
  glow.addColorStop(1, 'rgba(190,52,85,0)');
  x.fillStyle = glow;
  x.fillRect(cx - 400 * k, cy - 400 * k, 800 * k, 800 * k);
  x.strokeStyle = 'rgba(255,120,150,.35)';
  x.lineWidth = 1;
  for (const r of [60, 120, 190]) {
    x.beginPath();
    x.arc(cx, cy, r * k, 0, Math.PI * 2);
    x.stroke();
  }
  const pts: [number, number][] = [
    [0, 0], [-140, 60], [90, -110], [-60, -150], [150, 90], [-200, -40], [40, 160],
  ].map(([a, b]) => [cx + a * k, cy + b * k]);
  x.strokeStyle = 'rgba(255,79,123,.5)';
  x.setLineDash([4 * k, 6 * k]);
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  x.stroke();
  x.setLineDash([]);
  pts.forEach(([a, b], i) => {
    x.shadowColor = GLOW;
    x.shadowBlur = 18 * k;
    x.fillStyle = i ? GLOW : '#fff';
    x.beginPath();
    x.arc(a, b, (i ? 6 : 9) * k, 0, Math.PI * 2);
    x.fill();
    x.shadowBlur = 0;
    x.strokeStyle = 'rgba(255,255,255,.8)';
    x.lineWidth = 2 * k;
    x.stroke();
  });
  x.lineWidth = 1;
}

function logo(x: CanvasRenderingContext2D, font: string, left: number, base: number, size: number) {
  x.font = `900 ${size}px ${font}`;
  let lx = left;
  for (const [t, col] of [['mu', LIGHT], ['es', PINK], ['tra.mx', LIGHT]] as const) {
    x.fillStyle = col;
    if (col === PINK) {
      x.shadowColor = 'rgba(255,79,123,.8)';
      x.shadowBlur = size * 0.45;
    }
    x.fillText(t, lx, base);
    x.shadowBlur = 0;
    lx += x.measureText(t).width;
  }
  x.font = `700 ${Math.round(size * 0.29)}px ${font}`;
  x.fillStyle = MUTED;
  x.fillText('OPINIONES + DATOS', left + 2, base + size * 0.55);
}

function pill(x: CanvasRenderingContext2D, font: string, text: string, left: number, top: number, size: number) {
  x.font = `800 ${size}px ${font}`;
  const w = x.measureText(text).width + size * 2;
  const h = size * 2.3;
  x.fillStyle = PINK;
  x.beginPath();
  x.roundRect(left, top, w, h, h / 2);
  x.fill();
  x.fillStyle = '#fff';
  x.fillText(text, left + size, top + h * 0.68);
}

/** Parte el título en renglones; si no cabe, achica la letra. */
function fitTitle(x: CanvasRenderingContext2D, font: string, text: string, maxW: number, maxLines: number, size: number) {
  for (let s = size; s >= size * 0.55; s -= 2) {
    x.font = `900 ${s}px ${font}`;
    const lines = wrap(x, text, maxW);
    if (lines.length <= maxLines) return { lines, size: s };
  }
  x.font = `900 ${Math.round(size * 0.55)}px ${font}`;
  const lines = wrap(x, text, maxW).slice(0, maxLines);
  lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
  return { lines, size: Math.round(size * 0.55) };
}

function wrap(x: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (x.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function footer(x: CanvasRenderingContext2D, font: string, w: number, y: number, left: string, right: string, size: number) {
  x.fillStyle = 'rgba(255,255,255,.12)';
  x.fillRect(64, y - size * 2.2, w - 128, 1);
  x.font = `700 ${size}px ${font}`;
  x.fillStyle = LIGHT;
  x.textAlign = 'left';
  x.fillText(left, 64, y);
  if (right) {
    x.font = `500 ${Math.round(size * 0.78)}px ${font}`;
    x.fillStyle = MUTED;
    x.textAlign = 'right';
    x.fillText(right, w - 64, y);
    x.textAlign = 'left';
  }
}

function drawWide(photo: HTMLImageElement | null, input: SocialCardInput, font: string): string {
  const W = 1200;
  const H = 630;
  const [c, x] = canvas(W, H);
  x.fillStyle = INK;
  x.fillRect(0, 0, W, H);
  if (photo) cover(x, photo, W, H, 1.1, 140, 0);
  let g = x.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(7,9,15,.97)');
  g.addColorStop(0.55, 'rgba(7,9,15,.75)');
  g.addColorStop(1, 'rgba(7,9,15,.2)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  g = x.createLinearGradient(0, H, 0, H * 0.55);
  g.addColorStop(0, 'rgba(7,9,15,.95)');
  g.addColorStop(1, 'rgba(7,9,15,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  grid(x, W, H);
  radar(x, W * 0.82, H * 0.42, 1);
  x.fillStyle = PINK;
  x.fillRect(0, 0, W, 8);
  logo(x, font, 64, 104, 50);
  pill(x, font, input.category.toUpperCase(), 64, 176, 17);
  const t = fitTitle(x, font, input.title, 700, 4, 58);
  x.fillStyle = '#fff';
  x.shadowColor = 'rgba(0,0,0,.6)';
  x.shadowBlur = 12;
  t.lines.forEach((line, i) => x.fillText(line, 64, 222 + 32 + t.size * 1.12 * (i + 1) - t.size * 0.2));
  x.shadowBlur = 0;
  footer(x, font, W, 588, 'muestra.mx', input.credit ?? '', 18);
  return c.toDataURL('image/jpeg', 0.86);
}

function drawIg(photo: HTMLImageElement | null, input: SocialCardInput, font: string): string {
  const W = 1080;
  const H = 1350;
  const [c, x] = canvas(W, H);
  x.fillStyle = INK;
  x.fillRect(0, 0, W, H);
  if (photo) {
    x.save();
    x.beginPath();
    x.rect(0, 0, W, 860);
    x.clip();
    cover(x, photo, W, 860, 1.05, 0, 40);
    x.restore();
  }
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(7,9,15,.9)');
  g.addColorStop(0.18, 'rgba(7,9,15,.25)');
  g.addColorStop(0.5, 'rgba(7,9,15,.35)');
  g.addColorStop(0.64, 'rgba(7,9,15,.97)');
  g.addColorStop(1, 'rgba(7,9,15,1)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  grid(x, W, H);
  radar(x, W * 0.62, 450, 1.3);
  x.fillStyle = PINK;
  x.fillRect(0, 0, W, 10);
  logo(x, font, 70, 118, 60);
  pill(x, font, input.category.toUpperCase(), 70, 820, 22);
  const t = fitTitle(x, font, input.title, W - 140, 3, 80);
  x.fillStyle = '#fff';
  t.lines.forEach((line, i) => x.fillText(line, 70, 900 + t.size * 1.15 * (i + 1)));
  footer(x, font, W, 1300, 'Lee la nota en muestra.mx', input.credit ?? '', 22);
  return c.toDataURL('image/jpeg', 0.86);
}
