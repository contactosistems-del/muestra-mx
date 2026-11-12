import { type CityGeo, tileUrl, worldPx } from '../city-geo';
import { partyColor, partyTint } from '../party';

export interface ResultImageRow {
  label: string;
  party?: string;
  image?: string;
  percent: number;
  count: number;
}

export interface ResultImageData {
  surveyId: string;
  city: string;
  question: string;
  rows: ResultImageRow[];
  geo?: CityGeo | null;
}

const W = 1080;
const H = 1350;
const PAD = 80;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Dibuja la tarjeta de resultados en un PNG 1080×1350 (formato vertical para redes) y lo descarga. */
export async function downloadResultImage(data: ResultImageData): Promise<void> {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const display = "'Sora', 'Plus Jakarta Sans', sans-serif";
  const sans = "'Plus Jakarta Sans', sans-serif";
  const mono = "'JetBrains Mono', ui-monospace, monospace";

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#FFFFFF');
  bg.addColorStop(1, '#F6F7F9');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(190, 52, 85, 0.06)';
  ctx.beginPath();
  ctx.arc(W - 40, 60, 260, 0, Math.PI * 2);
  ctx.fill();

  // Barra superior de marca
  const top = ctx.createLinearGradient(0, 0, W, 0);
  top.addColorStop(0, '#0A0A0A');
  top.addColorStop(0.55, '#2A0A15');
  top.addColorStop(1, '#BE3455');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 150);

  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 54px 'Montserrat', sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('mu', PAD, 98);
  const muW = ctx.measureText('mu').width;
  ctx.fillStyle = '#FF8FAB';
  ctx.fillText('es', PAD + muW, 98);
  const esW = ctx.measureText('es').width;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('tra.mx', PAD + muW + esW, 98);

  ctx.textAlign = 'right';
  ctx.font = `700 22px ${mono}`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('RESULTADOS AL MOMENTO', W - PAD, 78);
  const now = new Date();
  const stamp = now.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  ctx.font = `600 22px ${sans}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`Corte: ${stamp}`, W - PAD, 112);
  ctx.textAlign = 'left';

  // Mapa de la ciudad (o ciudad simulada si no hay mapa)
  const mapTop = 150;
  const mapH = 260;
  await drawCityBanner(ctx, data, mapTop, mapH, mono);

  // Pregunta
  let y = mapTop + mapH + 40;
  let size = 52;
  let lines: string[];
  do {
    ctx.font = `800 ${size}px ${display}`;
    lines = wrap(ctx, data.question, W - PAD * 2);
    size -= 4;
  } while (lines.length > 3 && size > 34);
  const lh = (size + 4) * 1.18;
  ctx.fillStyle = '#0B0B0F';
  for (const line of lines) {
    y += lh;
    ctx.fillText(line, PAD, y);
  }

  // Dona a la izquierda
  const rows = data.rows.slice(0, 5);
  const blockTop = y + 50;
  const blockBottom = H - 175;
  const donutR = 135;
  const dcx = PAD + donutR + 10;
  const dcy = blockTop + Math.min(donutR + 20, (blockBottom - blockTop) / 2);
  drawDonut(ctx, rows, dcx, dcy, donutR, display, mono);

  // Filas a la derecha
  const rx = dcx + donutR + 60;
  const right = W - PAD;
  const rowH = Math.min(118, Math.floor((blockBottom - blockTop) / Math.max(rows.length, 1)));
  const avatar = Math.min(76, rowH - 30);
  const images = await Promise.all(rows.map((r) => loadImage(r.image ?? '')));
  let ry = blockTop;
  rows.forEach((row, i) => {
    const color = partyColor(row.party);
    const cy = ry + rowH / 2;
    const ax = rx + avatar / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, cy, avatar / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#EEF0F2';
    ctx.fill();
    ctx.clip();
    const img = images[i];
    if (img) {
      const sc = Math.max(avatar / img.width, avatar / img.height);
      ctx.drawImage(img, ax - (img.width * sc) / 2, cy - avatar / 2, img.width * sc, img.height * sc);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(ax - avatar / 2, cy - avatar / 2, avatar, avatar);
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${avatar * 0.45}px ${display}`;
      ctx.textAlign = 'center';
      ctx.fillText(row.label.charAt(0), ax, cy + avatar * 0.16);
      ctx.textAlign = 'left';
    }
    ctx.restore();
    if (i === 0) {
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(ax, cy, avatar / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    const tx = rx + avatar + 22;
    // Porcentaje
    ctx.textAlign = 'right';
    ctx.font = `700 36px ${mono}`;
    ctx.fillStyle = '#0B0B0F';
    ctx.fillText(`${row.percent.toFixed(1)}%`, right, cy - 8);
    const pctW = ctx.measureText(`${row.percent.toFixed(1)}%`).width;
    ctx.textAlign = 'left';
    // Nombre (se reduce si no cabe)
    let fs = 28;
    ctx.font = `800 ${fs}px ${display}`;
    while (ctx.measureText(row.label).width > right - tx - pctW - 20 && fs > 18) {
      fs -= 1;
      ctx.font = `800 ${fs}px ${display}`;
    }
    ctx.fillStyle = '#0B0B0F';
    ctx.fillText(row.label, tx, cy - 10);
    // Partido + barra
    let bx = tx;
    if (row.party) {
      ctx.font = `700 17px ${mono}`;
      const pw = ctx.measureText(row.party).width + 18;
      ctx.fillStyle = partyTint(row.party, 0.14);
      roundRect(ctx, tx, cy + 6, pw, 28, 7);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(row.party, tx + 9, cy + 26);
      bx = tx + pw + 12;
    }
    const bw = right - bx;
    ctx.fillStyle = '#EEF0F2';
    roundRect(ctx, bx, cy + 12, bw, 16, 8);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, bx, cy + 12, Math.max(16, (bw * row.percent) / 100), 16, 8);
    ctx.fill();
    ry += rowH;
  });

  // Pie
  const fy = H - 140;
  ctx.strokeStyle = '#D9DCE1';
  ctx.setLineDash([10, 10]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD, fy);
  ctx.lineTo(W - PAD, fy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `600 26px ${mono}`;
  ctx.fillStyle = '#374151';
  ctx.fillText('Sondeo en línea', PAD, fy + 52);
  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.arc(PAD + 8, fy + 90, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('En vivo', PAD + 26, fy + 99);
  ctx.textAlign = 'right';
  ctx.font = `800 26px ${sans}`;
  ctx.fillStyle = '#BE3455';
  ctx.fillText(`muestra.mx/encuesta/${data.surveyId}`, W - PAD, fy + 99);
  ctx.textAlign = 'left';

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo generar la imagen');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = now.toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `resultados-${data.surveyId}-${date}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function drawDonut(ctx: CanvasRenderingContext2D, rows: ResultImageRow[], cx: number, cy: number, r: number, display: string, mono: string): void {
  const sum = rows.reduce((a, x) => a + Math.max(0, x.percent), 0) || 1;
  const thick = r * 0.34;
  ctx.lineWidth = thick;
  ctx.strokeStyle = '#EEF0F2';
  ctx.beginPath();
  ctx.arc(cx, cy, r - thick / 2, 0, Math.PI * 2);
  ctx.stroke();
  let a = -Math.PI / 2;
  const gap = rows.length > 1 ? 0.025 : 0;
  for (const row of rows) {
    const sweep = (Math.max(0, row.percent) / sum) * Math.PI * 2;
    if (sweep <= 0) continue;
    ctx.strokeStyle = partyColor(row.party);
    ctx.beginPath();
    ctx.arc(cx, cy, r - thick / 2, a + gap / 2, a + Math.max(gap, sweep - gap / 2));
    ctx.stroke();
    a += sweep;
  }
  const lead = [...rows].sort((x, y) => y.percent - x.percent)[0];
  if (!lead) return;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0B0B0F';
  ctx.font = `700 48px ${mono}`;
  ctx.fillText(`${lead.percent.toFixed(1)}%`, cx, cy + 10);
  ctx.font = `800 20px ${display}`;
  ctx.fillStyle = partyColor(lead.party);
  const first = lead.label.split(/\s+/)[0] ?? '';
  ctx.fillText(first.toUpperCase(), cx, cy + 42);
  ctx.textAlign = 'left';
}

/** Banner con el mapa real de la ciudad (teselas CARTO). Si no se pueden cargar, dibuja una ciudad simulada. */
async function drawCityBanner(ctx: CanvasRenderingContext2D, data: ResultImageData, top: number, h: number, mono: string): Promise<void> {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, W, h);
  ctx.clip();
  ctx.fillStyle = '#11141B';
  ctx.fillRect(0, top, W, h);

  let drewTiles = false;
  if (data.geo) {
    const z = data.geo.zoom;
    const c = worldPx(data.geo.lat, data.geo.lng, z);
    const originX = c.x - W / 2;
    const originY = c.y - h / 2;
    const tx0 = Math.floor(originX / 256);
    const ty0 = Math.floor(originY / 256);
    const tx1 = Math.floor((originX + W) / 256);
    const ty1 = Math.floor((originY + h) / 256);
    const jobs: Array<Promise<void>> = [];
    let ok = 0;
    for (let tx = tx0; tx <= tx1; tx++) {
      for (let ty = ty0; ty <= ty1; ty++) {
        jobs.push(
          loadImage(tileUrl(tx, ty, z)).then((img) => {
            if (!img) return;
            ctx.filter = 'brightness(1.9) contrast(1.15)';
            ctx.drawImage(img, tx * 256 - originX, top + ty * 256 - originY, 256, 256);
            ctx.filter = 'none';
            ok++;
          }),
        );
      }
    }
    await Promise.all(jobs);
    drewTiles = ok > 0;
  }
  if (!drewTiles) drawSimulatedCity(ctx, top, h);

  // Velo con colores de marca
  const veil = ctx.createLinearGradient(0, top, 0, top + h);
  veil.addColorStop(0, 'rgba(190,52,85,0.30)');
  veil.addColorStop(0.5, 'rgba(10,10,15,0.10)');
  veil.addColorStop(1, 'rgba(10,10,15,0.80)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, top, W, h);

  // Pin al centro
  const px = W / 2;
  const py = top + h / 2;
  for (const [rr, al] of [[46, 0.12], [30, 0.22], [16, 0.35]] as Array<[number, number]>) {
    ctx.fillStyle = `rgba(255,77,122,${al})`;
    ctx.beginPath();
    ctx.ellipse(px, py + 6, rr, rr * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#FF4D7A';
  ctx.beginPath();
  ctx.arc(px, py - 26, 18, Math.PI, 0);
  ctx.lineTo(px, py + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px, py - 26, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Etiqueta de ciudad
  const label = `MUESTRA.MX  /  ${data.city.toUpperCase()}`;
  ctx.font = `700 22px ${mono}`;
  const lw = ctx.measureText(label).width + 36;
  ctx.fillStyle = 'rgba(10,10,15,0.7)';
  roundRect(ctx, PAD, top + h - 66, lw, 44, 22);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(label, PAD + 18, top + h - 37);
}

/** Cuadrícula de calles estilo plano de ciudad, con costa, por si el mapa real no carga. */
function drawSimulatedCity(ctx: CanvasRenderingContext2D, top: number, h: number): void {
  ctx.fillStyle = '#151A24';
  ctx.fillRect(0, top, W, h);
  ctx.fillStyle = '#0E3B57';
  ctx.beginPath();
  ctx.moveTo(W * 0.72, top);
  ctx.bezierCurveTo(W * 0.78, top + h * 0.4, W * 0.7, top + h * 0.7, W * 0.8, top + h);
  ctx.lineTo(W, top + h);
  ctx.lineTo(W, top);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  for (let x = -40; x < W * 0.78; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + 30, top + h);
    ctx.stroke();
  }
  for (let yy = top + 20; yy < top + h; yy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(W * 0.76, yy - 12);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,200,120,0.22)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, top + h * 0.65);
  ctx.lineTo(W * 0.74, top + h * 0.3);
  ctx.stroke();
}
