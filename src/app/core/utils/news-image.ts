const MAX_EDGE = 1000;
const MAX_BYTES = 90_000;

export async function compressNewsImage(file: File): Promise<Uint8Array> {
  const source = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('image-too-large');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  let quality = 0.68;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob.size > MAX_BYTES && quality > 0.38) {
    quality -= 0.08;
    blob = await canvasToJpeg(canvas, quality);
  }
  if (blob.size > MAX_BYTES) throw new Error('image-too-large');
  return new Uint8Array(await blob.arrayBuffer());
}

export function jpegToDataUrl(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image-too-large'));
    };
    image.src = url;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('image-too-large'))), 'image/jpeg', quality);
  });
}
