/** Colores de partidos y coaliciones para etiquetas y barras de resultados. */
const PARTY_COLORS: Record<string, string> = {
  MORENA: '#9F2241',
  PVEM: '#2E9E44',
  VERDE: '#2E9E44',
  PT: '#D52B1E',
  PAN: '#0059A8',
  PRI: '#00843D',
  PRD: '#E5B800',
  MC: '#FF7A00',
  'MOVIMIENTO CIUDADANO': '#FF7A00',
  INDEPENDIENTE: '#6B7280',
};

export const PARTY_NAMES = ['MORENA', 'PVEM', 'PT', 'PAN', 'PRI', 'PRD', 'MC', 'INDEPENDIENTE'];

const BRAND = '#BE3455';

export function partyColor(party?: string | null): string {
  const key = String(party ?? '').trim().toUpperCase();
  if (!key) return BRAND;
  if (PARTY_COLORS[key]) return PARTY_COLORS[key];
  // Coaliciones tipo "MORENA-PT-PVEM": usa el primer partido conocido.
  const first = key.split(/[\s\-/,+]+/).find((k) => PARTY_COLORS[k]);
  return first ? PARTY_COLORS[first] : BRAND;
}

/** Color con transparencia (para el fondo de la etiqueta). */
export function partyTint(party?: string | null, alpha = 0.12): string {
  const hex = partyColor(party).replace('#', '');
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
