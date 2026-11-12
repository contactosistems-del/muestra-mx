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

  // Ubicación
  let y = 230;
  ctx.font = `700 24px ${mono}`;
  ctx.fillStyle = '#BE3455';
  ctx.fillText(`MUESTRA.MX  /  ${data.city.toUpperCase()}`, PAD, y);

  // Pregunta
  y += 30;
  let size = 58;
  let lines: string[];
  do {
    ctx.font = `800 ${size}px ${display}`;
    lines = wrap(ctx, data.question, W - PAD * 2);
    size -= 4;
  } while (lines.length > 4 && size > 36);
  const lh = size * 1.2;
  ctx.fillStyle = '#0B0B0F';
  for (const line of lines) {
    y += lh;
    ctx.fillText(line, PAD, y);
  }

  // Filas
  y += 60;
  const rows = data.rows.slice(0, 6);
  const avail = H - 230 - y;
  const rowH = Math.min(150, Math.floor(avail / Math.max(rows.length, 1)));
  const avatar = Math.min(96, rowH - 34);
  const images = await Promise.all(rows.map((r) => loadImage(r.image ?? '')));

  rows.forEach((row, i) => {
    const cy = y + rowH / 2;
    const color = partyColor(row.party);
    const ax = PAD + avatar / 2;

    // Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, cy, avatar / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = '#EEF0F2';
    ctx.fill();
    ctx.clip();
    const img = images[i];
    if (img) {
      const s = Math.max(avatar / img.width, avatar / img.height);
      const iw = img.width * s;
      const ih = img.height * s;
      ctx.drawImage(img, ax - iw / 2, cy - avatar / 2, iw, ih);
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
      ctx.lineWidth = 6;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(ax, cy, avatar / 2 + 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    const tx = PAD + avatar + 32;
    const right = W - PAD;
    // Nombre
    ctx.font = `800 36px ${display}`;
    ctx.fillStyle = '#0B0B0F';
    const name = row.label;
    ctx.fillText(name, tx, cy - 8);
    let nx = tx + ctx.measureText(name).width + 16;
    // Partido
    if (row.party) {
      ctx.font = `700 20px ${mono}`;
      const pw = ctx.measureText(row.party).width + 24;
      ctx.fillStyle = partyTint(row.party, 0.14);
      roundRect(ctx, nx, cy - 40, pw, 34, 8);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillText(row.party, nx + 12, cy - 16);
      nx += pw;
    }
    // Porcentaje
    ctx.textAlign = 'right';
    ctx.font = `700 44px ${mono}`;
    ctx.fillStyle = '#0B0B0F';
    ctx.fillText(`${row.percent.toFixed(1)}%`, right, cy - 6);
    ctx.textAlign = 'left';
    // Barra
    const bw = right - tx;
    ctx.fillStyle = '#EEF0F2';
    roundRect(ctx, tx, cy + 14, bw, 18, 9);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, tx, cy + 14, Math.max(18, (bw * row.percent) / 100), 18, 9);
    ctx.fill();

    y += rowH;
  });

  // Pie
  const fy = H - 150;
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
