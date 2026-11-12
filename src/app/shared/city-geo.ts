/** Coordenadas de ciudades conocidas para dibujar el mapa de cada encuesta. */
const CITIES: Array<{ keys: string[]; lat: number; lng: number; zoom: number }> = [
  { keys: ['playa del carmen', 'solidaridad'], lat: 20.6296, lng: -87.0739, zoom: 13 },
  { keys: ['tulum'], lat: 20.2114, lng: -87.4654, zoom: 13 },
  { keys: ['cancun', 'benito juarez'], lat: 21.1619, lng: -86.8515, zoom: 12 },
  { keys: ['cozumel'], lat: 20.5083, lng: -86.9458, zoom: 13 },
  { keys: ['isla mujeres'], lat: 21.2321, lng: -86.7310, zoom: 13 },
  { keys: ['puerto morelos'], lat: 20.8478, lng: -86.8755, zoom: 13 },
  { keys: ['chetumal', 'othon p. blanco', 'othon p blanco'], lat: 18.5001, lng: -88.2961, zoom: 13 },
  { keys: ['bacalar'], lat: 18.6777, lng: -88.3954, zoom: 13 },
  { keys: ['felipe carrillo puerto'], lat: 19.5786, lng: -88.0456, zoom: 13 },
  { keys: ['merida'], lat: 20.9674, lng: -89.5926, zoom: 12 },
  { keys: ['villahermosa', 'tabasco', 'centro'], lat: 17.9895, lng: -92.9475, zoom: 12 },
  { keys: ['quintana roo'], lat: 19.6, lng: -88.0, zoom: 7 },
];

export interface CityGeo { lat: number; lng: number; zoom: number; }

function norm(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function cityGeo(...texts: string[]): CityGeo | null {
  const all = norm(texts.filter(Boolean).join(' '));
  const hit = CITIES.find((c) => c.keys.some((k) => all.includes(k)));
  return hit ? { lat: hit.lat, lng: hit.lng, zoom: hit.zoom } : null;
}

/** Posición de un punto en píxeles del mundo para un zoom (teselas de 256 px). */
export function worldPx(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = 256 * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  };
}

export function tileUrl(x: number, y: number, z: number, style: 'dark_all' | 'light_all' | 'rastertiles/voyager' = 'dark_all'): string {
  const s = 'abcd'[(x + y) % 4];
  return `https://${s}.basemaps.cartocdn.com/${style}/${z}/${x}/${y}.png`;
}
