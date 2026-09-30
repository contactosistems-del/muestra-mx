import { inject, Injectable } from '@angular/core';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ASSETS } from '../core/constants/assets';
import { loc, toLocalized } from '../core/i18n/localized';
import { HERO, INTERVIEW } from './catalog';
import type { FeaturedContent, Interview, SponsorContent } from '../domain/models';
import { FIRESTORE, type ContentRepository } from '../domain/tokens';

const COLLECTION = 'contenido';

const FEATURED_DEFAULT: FeaturedContent = {
  badge: HERO.badge,
  title: HERO.title,
  text: HERO.text,
  imageUrl: ASSETS.images.editorial.mapaIne,
  ctaPath: '/encuesta/playa-2027',
};

const SPONSOR_DEFAULT: SponsorContent = {
  badge: loc('Patrocinio', 'Sponsor'),
  name: loc('Movilidad Eléctrica Futura', 'Futura Electric Mobility'),
  imageUrl: ASSETS.images.sponsors.futura,
  linkPath: '/entrevista',
};

@Injectable()
export class FirestoreContentRepository implements ContentRepository {
  private readonly db = inject(FIRESTORE);

  watchFeatured(onChange: (item: FeaturedContent) => void): () => void {
    return this.watchDoc('destacada', (data) => this.toFeatured(data), FEATURED_DEFAULT, onChange);
  }

  watchInterview(onChange: (item: Interview) => void): () => void {
    return this.watchDoc('entrevista', (data) => this.toInterview(data), INTERVIEW, onChange);
  }

  watchSponsor(onChange: (item: SponsorContent) => void): () => void {
    return this.watchDoc('publicidad', (data) => this.toSponsor(data), SPONSOR_DEFAULT, onChange);
  }

  async saveFeatured(item: FeaturedContent): Promise<void> {
    await setDoc(doc(this.db, COLLECTION, 'destacada'), item);
  }

  async saveInterview(item: Interview): Promise<void> {
    await setDoc(doc(this.db, COLLECTION, 'entrevista'), item);
  }

  async saveSponsor(item: SponsorContent): Promise<void> {
    await setDoc(doc(this.db, COLLECTION, 'publicidad'), item);
  }

  private watchDoc<T>(
    id: string,
    map: (data: Record<string, unknown>) => T,
    fallback: T,
    onChange: (item: T) => void,
  ): () => void {
    return onSnapshot(
      doc(this.db, COLLECTION, id),
      async (snap) => {
        if (!snap.exists()) {
          try {
            await setDoc(snap.ref, fallback as object);
          } catch {
            onChange(fallback);
          }
          return;
        }
        onChange(map(snap.data() as Record<string, unknown>));
      },
      () => onChange(fallback),
    );
  }

  private toFeatured(data: Record<string, unknown>): FeaturedContent {
    return {
      badge: toLocalized(data['badge'], FEATURED_DEFAULT.badge.es),
      title: toLocalized(data['title'], FEATURED_DEFAULT.title.es),
      text: toLocalized(data['text'], FEATURED_DEFAULT.text.es),
      imageUrl: String(data['imageUrl'] || FEATURED_DEFAULT.imageUrl),
      ctaPath: String(data['ctaPath'] || FEATURED_DEFAULT.ctaPath),
    };
  }

  private toInterview(data: Record<string, unknown>): Interview {
    return {
      category: toLocalized(data['category'], INTERVIEW.category.es),
      title: toLocalized(data['title'], INTERVIEW.title.es),
      interviewee: toLocalized(data['interviewee'], INTERVIEW.interviewee.es),
      imageUrl: String(data['imageUrl'] || INTERVIEW.imageUrl),
      caption: toLocalized(data['caption'], INTERVIEW.caption.es),
      intro: toLocalized(data['intro'], INTERVIEW.intro.es),
      quote: toLocalized(data['quote'], INTERVIEW.quote.es),
    };
  }

  private toSponsor(data: Record<string, unknown>): SponsorContent {
    return {
      badge: toLocalized(data['badge'], SPONSOR_DEFAULT.badge.es),
      name: toLocalized(data['name'], SPONSOR_DEFAULT.name.es),
      imageUrl: String(data['imageUrl'] || SPONSOR_DEFAULT.imageUrl),
      linkPath: String(data['linkPath'] || SPONSOR_DEFAULT.linkPath),
    };
  }
}
