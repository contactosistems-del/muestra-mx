import type { Lang, LocalizedString } from '../../domain/models';

export function loc(es: string, en?: string): LocalizedString {
  const source = String(es ?? '');
  return { es: source, en: String(en || source) };
}

export function isLocalized(value: unknown): value is LocalizedString {
  return typeof value === 'object' && value !== null && 'es' in value && 'en' in value;
}

export function toLocalized(value: unknown, fallback = ''): LocalizedString {
  if (isLocalized(value)) return { es: value.es, en: value.en };
  if (typeof value === 'string' && value) return { es: value, en: value };
  return { es: fallback, en: fallback };
}

export function pickLang(value: LocalizedString, lang: Lang): string {
  return value[lang] || value.es;
}
