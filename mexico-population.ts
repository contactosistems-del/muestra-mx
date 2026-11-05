/**
 * Datos de población para el reloj de la página principal.
 *
 * Nacional: Proyecciones de la Población de México (CONAPO), cifras para mediados de 2026.
 *   - 134,407,258 habitantes (65,757,028 hombres y 68,650,230 mujeres)
 *   - 1,996,102 nacimientos, 851,890 defunciones,
 *     331,104 personas que emigran y 199,335 que llegan en el año.
 * Por estado: Censo de Población y Vivienda 2020 (INEGI). Se usa solo para repartir
 *   las cifras nacionales entre los estados (proporción de cada uno).
 *
 * Para actualizar el próximo año basta con cambiar MX_POPULATION.
 */
export const MX_POPULATION = {
  /** 1 de julio de 2026, 00:00 hora del centro (UTC-6). */
  baseDate: Date.UTC(2026, 6, 1, 6),
  total: 134_407_258,
  men: 65_757_028,
  women: 68_650_230,
  birthsPerYear: 1_996_102,
  deathsPerYear: 851_890,
  emigrantsPerYear: 331_104,
  immigrantsPerYear: 199_335,
  /** Relación al nacer de 105 niños por cada 100 niñas. */
  boyShare: 105 / 205,
} as const;

/** Hora del centro de México (UTC-6, sin horario de verano desde 2022). */
export const MX_UTC_OFFSET_MS = 6 * 3_600_000;
export const YEAR_MS = 365.25 * 86_400_000;

export interface MxState {
  name: string;
  /** Ubicación de la capital, para el mapa. */
  lat: number;
  lng: number;
  census2020: number;
}

export const MX_STATES: readonly MxState[] = [
  { name: 'Aguascalientes', lat: 21.88, lng: -102.29, census2020: 1_425_607 },
  { name: 'Baja California', lat: 32.62, lng: -115.45, census2020: 3_769_020 },
  { name: 'Baja California Sur', lat: 24.14, lng: -110.31, census2020: 798_447 },
  { name: 'Campeche', lat: 19.85, lng: -90.53, census2020: 928_363 },
  { name: 'Coahuila', lat: 25.42, lng: -100.99, census2020: 3_146_771 },
  { name: 'Colima', lat: 19.24, lng: -103.72, census2020: 731_391 },
  { name: 'Chiapas', lat: 16.75, lng: -93.12, census2020: 5_543_828 },
  { name: 'Chihuahua', lat: 28.63, lng: -106.07, census2020: 3_741_869 },
  { name: 'Ciudad de México', lat: 19.43, lng: -99.13, census2020: 9_209_944 },
  { name: 'Durango', lat: 24.02, lng: -104.65, census2020: 1_832_650 },
  { name: 'Guanajuato', lat: 21.02, lng: -101.26, census2020: 6_166_934 },
  { name: 'Guerrero', lat: 17.55, lng: -99.5, census2020: 3_540_685 },
  { name: 'Hidalgo', lat: 20.1, lng: -98.76, census2020: 3_082_841 },
  { name: 'Jalisco', lat: 20.67, lng: -103.35, census2020: 8_348_151 },
  { name: 'Estado de México', lat: 19.29, lng: -99.66, census2020: 16_992_418 },
  { name: 'Michoacán', lat: 19.7, lng: -101.19, census2020: 4_748_846 },
  { name: 'Morelos', lat: 18.92, lng: -99.23, census2020: 1_971_520 },
  { name: 'Nayarit', lat: 21.5, lng: -104.89, census2020: 1_235_456 },
  { name: 'Nuevo León', lat: 25.69, lng: -100.32, census2020: 5_784_442 },
  { name: 'Oaxaca', lat: 17.07, lng: -96.73, census2020: 4_132_148 },
  { name: 'Puebla', lat: 19.04, lng: -98.21, census2020: 6_583_278 },
  { name: 'Querétaro', lat: 20.59, lng: -100.39, census2020: 2_368_467 },
  { name: 'Quintana Roo', lat: 18.5, lng: -88.3, census2020: 1_857_985 },
  { name: 'San Luis Potosí', lat: 22.15, lng: -100.98, census2020: 2_822_255 },
  { name: 'Sinaloa', lat: 24.81, lng: -107.39, census2020: 3_026_943 },
  { name: 'Sonora', lat: 29.07, lng: -110.96, census2020: 2_944_840 },
  { name: 'Tabasco', lat: 17.99, lng: -92.93, census2020: 2_402_598 },
  { name: 'Tamaulipas', lat: 23.74, lng: -99.15, census2020: 3_527_735 },
  { name: 'Tlaxcala', lat: 19.32, lng: -98.24, census2020: 1_342_977 },
  { name: 'Veracruz', lat: 19.54, lng: -96.91, census2020: 8_062_579 },
  { name: 'Yucatán', lat: 20.97, lng: -89.62, census2020: 2_320_898 },
  { name: 'Zacatecas', lat: 22.77, lng: -102.58, census2020: 1_622_138 },
];

export const MX_CENSUS_2020_TOTAL = MX_STATES.reduce((sum, s) => sum + s.census2020, 0);

/** Población estimada en un instante dado. */
export function populationAt(now: number): number {
  const p = MX_POPULATION;
  const netPerYear = p.birthsPerYear - p.deathsPerYear - p.emigrantsPerYear + p.immigrantsPerYear;
  return p.total + (netPerYear * (now - p.baseDate)) / YEAR_MS;
}

/** Inicio del día de hoy (00:00 hora del centro) en milisegundos UTC. */
export function startOfMxDay(now: number): number {
  return Math.floor((now - MX_UTC_OFFSET_MS) / 86_400_000) * 86_400_000 + MX_UTC_OFFSET_MS;
}

/** Inicio del año en curso (1 de enero, 00:00 hora del centro). */
export function startOfMxYear(now: number): number {
  const year = new Date(now - MX_UTC_OFFSET_MS).getUTCFullYear();
  return Date.UTC(year, 0, 1) + MX_UTC_OFFSET_MS;
}
