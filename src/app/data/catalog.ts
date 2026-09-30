import { ASSETS } from '../core/constants/assets';
import { loc } from '../core/i18n/localized';
import { Interview, LocalizedString, NewsDraft, Office, Survey } from '../domain/models';

export const HERO = {
  badge: loc('Mapa Electoral 2026-2027 // INE', '2026-2027 Electoral Map // INE'),
  title: loc(
    'Procesos Electorales Locales: 19,609 cargos en disputa',
    'Local Electoral Processes: 19,609 offices at stake',
  ),
  text: loc(
    'Consulta los detalles y la cartografía oficial de gubernaturas, diputaciones y presidencias municipales.',
    'See the official details and cartography for governorships, legislatures and municipal presidencies.',
  ),
};

export const NEWS_CATEGORIES = {
  NACIONAL: loc('NACIONAL', 'NATIONAL'),
  NOTICIAS: loc('NOTICIAS', 'NEWS'),
  'QUINTANA ROO': loc('QUINTANA ROO', 'QUINTANA ROO'),
  MOVILIDAD: loc('MOVILIDAD', 'MOBILITY'),
  NOSOTROS: loc('NOSOTROS', 'ABOUT US'),
} as const satisfies Record<string, LocalizedString>;

export const NEWS_SEEDS: NewsDraft[] = [
  {
    categoryId: 'NACIONAL',
    title: loc(
      'Procesos Electorales Locales 2026-2027: 19,609 cargos en disputa',
      '2026-2027 Local Electoral Processes: 19,609 offices at stake',
    ),
    imageUrl: ASSETS.images.editorial.mapaIne,
    body: loc(
      'El INE ha publicado el Plan Integral para los Procesos Electorales Locales.',
      'INE has published the Comprehensive Plan for Local Electoral Processes.',
    ),
  },
  {
    categoryId: 'NOSOTROS',
    title: loc(
      'MUESTRA.MX: Compromiso con la veracidad y la estadística abierta',
      'MUESTRA.MX: Committed to accuracy and open statistics.',
    ),
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    body: loc(
      'Somos un equipo especializado en opinión pública y consultoría estratégica.',
      'We are a team specialized in public opinion and strategic consulting.',
    ),
  },
];

export function newsCategoryLabel(categoryId: string): LocalizedString {
  return NEWS_CATEGORIES[categoryId as keyof typeof NEWS_CATEGORIES] ?? loc(categoryId, categoryId);
}

export const INTERVIEW: Interview = {
  category: loc('ENTREVISTA | MOVILIDAD ELÉCTRICA', 'INTERVIEW | ELECTRIC MOBILITY'),
  title: loc(
    'Futura apuesta por una movilidad eléctrica más accesible y cercana para las familias mexicanas',
    'Futura bets on electric mobility that is more accessible and closer to Mexican families',
  ),
  interviewee: loc(
    'Entrevista con la Lic. Adriana Hernández Bautista, gerente de ventas de Futura.',
    'Interview with Adriana Hernández Bautista, Futura sales manager.',
  ),
  imageUrl: ASSETS.images.interviews.adriana,
  caption: loc(
    'Lic. Adriana Hernández Bautista, gerente de ventas de Futura, en el showroom de la empresa.',
    'Adriana Hernández Bautista, Futura sales manager, at the company showroom.',
  ),
  intro: loc(
    'La movilidad eléctrica comienza a ganar terreno entre los consumidores que buscan reducir sus gastos de transporte, acceder a vehículos con mayor tecnología y encontrar alternativas más eficientes para sus recorridos diarios. Para conocer cómo está evolucionando este mercado y qué propone Futura, conversamos con la Lic. Adriana Hernández Bautista, gerente de ventas de la empresa.',
    'Electric mobility is gaining ground among consumers who want to cut transport costs, access more advanced vehicles and find more efficient options for daily trips. To understand how this market is evolving and what Futura offers, we spoke with Adriana Hernández Bautista, the company’s sales manager.',
  ),
  quote: loc(
    'La movilidad eléctrica ya es una opción real para muchas familias mexicanas.',
    'Electric mobility is already a real option for many Mexican families.',
  ),
};

export const SURVEY_SEEDS: Survey[] = [
  {
    id: 'playa-2027',
    active: true,
    showInNav: true,
    sortOrder: 10,
    shortLabel: loc('Playa del Carmen', 'Playa del Carmen'),
    city: loc('Playa del Carmen, Quintana Roo', 'Playa del Carmen, Quintana Roo'),
    title: loc('Playa del Carmen 2027', 'Playa del Carmen 2027'),
    question: loc(
      '¿Quién crees que deba ser la candidata o el candidato de MORENA VERDE PT para la Presidencia Municipal en 2027?',
      'Who do you think should be the MORENA VERDE PT nominee for Municipal President in 2027?',
    ),
    options: [
      { id: 'a', label: 'Estefanía Mercado' },
      { id: 'b', label: 'Mirella Diaz' },
      { id: 'c', label: 'Orlando Muñoz' },
      { id: 'd', label: 'Arturo Castro' },
    ],
    updatedAt: 0,
  },
  {
    id: 'tulum-2027',
    active: true,
    showInNav: true,
    sortOrder: 20,
    shortLabel: loc('Tulum 2027', 'Tulum 2027'),
    city: loc('Tulum, Quintana Roo', 'Tulum, Quintana Roo'),
    title: loc('Encuesta Tulum 2027', 'Tulum 2027 Survey'),
    question: loc(
      '¿A quién prefieres como candidato(a) de Morena en 2027 a la Presidencia Municipal de Tulum, Quintana Roo?',
      'Whom do you prefer as Morena’s 2027 nominee for Municipal President of Tulum, Quintana Roo?',
    ),
    options: [
      { id: 'a', label: 'Romualda Dzul', imageUrl: ASSETS.images.surveys.tulum.romualda },
      { id: 'b', label: 'Fili Tah', imageUrl: ASSETS.images.surveys.tulum.fili },
      { id: 'c', label: 'Jorge Portilla', imageUrl: ASSETS.images.surveys.tulum.jorge },
      { id: 'd', label: 'Iliana Canul', voteValue: 'Ileana', imageUrl: ASSETS.images.surveys.tulum.iliana },
    ],
    updatedAt: 0,
  },
];

export const OFFICES: Office[] = [
  {
    name: loc('Oficina Tijuana, B.C.', 'Tijuana Office, B.C.'),
    address: 'Paseo de los Héroes 9188, Interior 104, Zona Río.',
    lat: 32.5311,
    lng: -117.0308,
  },
  {
    name: loc('Oficina Oaxaca de Juárez', 'Oaxaca de Juárez Office'),
    address: 'Blvd. La Paz 108, Col. Colinas de La Soledad.',
    lat: 17.0732,
    lng: -96.7266,
  },
];
