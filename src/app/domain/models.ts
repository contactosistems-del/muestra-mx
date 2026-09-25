export type Lang = 'es' | 'en';
export type Theme = 'light' | 'dark';

export interface LocalizedString {
  es: string;
  en: string;
}

export interface NewsItem {
  id: string;
  categoryId: string;
  title: LocalizedString;
  imageUrl: string;
  body: LocalizedString;
  publishedAt: number;
}

export interface NewsDraft {
  categoryId: string;
  title: LocalizedString;
  body: LocalizedString;
  imageUrl: string;
  imageBytes?: Uint8Array;
}

export interface Interview {
  category: LocalizedString;
  title: LocalizedString;
  interviewee: LocalizedString;
  imageUrl: string;
  caption: LocalizedString;
  intro: LocalizedString;
  quote: LocalizedString;
}

export interface FeaturedContent {
  badge: LocalizedString;
  title: LocalizedString;
  text: LocalizedString;
  imageUrl: string;
  ctaPath: string;
}

export interface SponsorContent {
  badge: LocalizedString;
  name: LocalizedString;
  imageUrl: string;
  linkPath: string;
}

export interface SurveyOption {
  id: string;
  label: string;
  voteValue?: string;
  imageUrl?: string;
}

/** Una encuesta del sitio: pregunta, candidatos y si está visible al público. */
export interface Survey {
  id: string;
  active: boolean;
  showInNav: boolean;
  sortOrder: number;
  shortLabel: LocalizedString;
  city: LocalizedString;
  title: LocalizedString;
  question: LocalizedString;
  options: SurveyOption[];
  updatedAt: number;
}

export interface SurveyDraft {
  id: string;
  active: boolean;
  showInNav: boolean;
  sortOrder: number;
  shortLabel: string;
  city: string;
  title: string;
  question: string;
  options: Array<{ id?: string; label: string; voteValue?: string; imageFile?: File | null; imageUrl?: string }>;
}

export interface VoteRecord {
  fecha: string;
  opcion: string;
  ip: string;
  deviceId: string;
  zona: string;
  lat: number;
  lng: number;
  timestamp: number;
  encuestaId: string;
}

export interface SurveyOptionTally {
  label: string;
  count: number;
  percent: number;
}

export interface SurveyResult {
  surveyId: string;
  total: number;
  options: SurveyOptionTally[];
}

export interface Office {
  name: LocalizedString;
  address: string;
  lat: number;
  lng: number;
}

export interface DeviceContext {
  fingerprint: string;
  ip: string;
  lat: number;
  lng: number;
}
