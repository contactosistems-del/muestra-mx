import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ASSETS } from '../constants/assets';
import { loc } from '../i18n/localized';
import { HERO, INTERVIEW } from '../../data/catalog';
import type { FeaturedContent, Interview, SponsorContent } from '../../domain/models';
import { CONTENT_REPOSITORY } from '../../domain/tokens';
import { jpegToDataUrl } from '../utils/news-image';
import { MediaStorageService } from './media-storage.service';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly repo = inject(CONTENT_REPOSITORY);
  private readonly media = inject(MediaStorageService);
  private readonly translator = inject(TranslationService);

  readonly featured = signal<FeaturedContent>({
    badge: HERO.badge,
    title: HERO.title,
    text: HERO.text,
    imageUrl: ASSETS.images.editorial.mapaIne,
    ctaPath: '/encuesta/playa-2027',
  });
  readonly interview = signal<Interview>(INTERVIEW);
  readonly sponsor = signal<SponsorContent>({
    badge: loc('Patrocinio', 'Sponsor'),
    name: loc('Movilidad Eléctrica Futura', 'Futura Electric Mobility'),
    imageUrl: ASSETS.images.sponsors.futura,
    linkPath: '/entrevista',
  });
  readonly busy = signal(false);

  constructor() {
    const stops = [
      this.repo.watchFeatured((item) => this.featured.set(item)),
      this.repo.watchInterview((item) => this.interview.set(item)),
      this.repo.watchSponsor((item) => this.sponsor.set(item)),
    ];
    inject(DestroyRef).onDestroy(() => stops.forEach((stop) => stop()));
  }

  async saveFeatured(input: {
    badge: string;
    title: string;
    text: string;
    ctaPath: string;
    image?: File | null;
  }): Promise<void> {
    this.busy.set(true);
    try {
      const [badgeEn, titleEn, textEn, imageUrl] = await Promise.all([
        this.translator.toEnglish(input.badge),
        this.translator.toEnglish(input.title),
        this.translator.toEnglish(input.text),
        this.resolveImage(input.image, this.featured().imageUrl),
      ]);
      await this.repo.saveFeatured({
        badge: loc(input.badge, badgeEn),
        title: loc(input.title, titleEn),
        text: loc(input.text, textEn),
        ctaPath: input.ctaPath.trim() || '/encuesta/playa-2027',
        imageUrl,
      });
    } finally {
      this.busy.set(false);
    }
  }

  async saveInterview(input: {
    category: string;
    title: string;
    interviewee: string;
    caption: string;
    intro: string;
    quote: string;
    image?: File | null;
  }): Promise<void> {
    this.busy.set(true);
    try {
      const [categoryEn, titleEn, intervieweeEn, captionEn, introEn, quoteEn, imageUrl] = await Promise.all([
        this.translator.toEnglish(input.category),
        this.translator.toEnglish(input.title),
        this.translator.toEnglish(input.interviewee),
        this.translator.toEnglish(input.caption),
        this.translator.toEnglish(input.intro),
        this.translator.toEnglish(input.quote),
        this.resolveImage(input.image, this.interview().imageUrl),
      ]);
      await this.repo.saveInterview({
        category: loc(input.category, categoryEn),
        title: loc(input.title, titleEn),
        interviewee: loc(input.interviewee, intervieweeEn),
        caption: loc(input.caption, captionEn),
        intro: loc(input.intro, introEn),
        quote: loc(input.quote, quoteEn),
        imageUrl,
      });
    } finally {
      this.busy.set(false);
    }
  }

  async saveSponsor(input: {
    badge: string;
    name: string;
    linkPath: string;
    image?: File | null;
  }): Promise<void> {
    this.busy.set(true);
    try {
      const [badgeEn, nameEn, imageUrl] = await Promise.all([
        this.translator.toEnglish(input.badge),
        this.translator.toEnglish(input.name),
        this.resolveImage(input.image, this.sponsor().imageUrl),
      ]);
      await this.repo.saveSponsor({
        badge: loc(input.badge, badgeEn),
        name: loc(input.name, nameEn),
        linkPath: input.linkPath.trim() || '/entrevista',
        imageUrl,
      });
    } finally {
      this.busy.set(false);
    }
  }

  private async resolveImage(file: File | null | undefined, fallback: string): Promise<string> {
    if (!file) return fallback;
    return jpegToDataUrl(await this.media.prepareNewsImage(file));
  }
}
